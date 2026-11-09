"""
Población municipal proyectada del DANE
Proyecto: Vigía El Niño · Acueductos (CRA)

RF-TER-06 exige ponderar por la población proyectada DANE del año del corte, y
ADR-0006 (C-CIU-04) exige que ningún dato del prototipo llegue al canal
ciudadano. Este script extrae del archivo oficial del DANE el total municipal
(cabecera + centros poblados y rural disperso) de cada año para los municipios
evaluados y lo guarda, con su procedencia, en data/config/poblacion_dane.json.

Fuente: DANE, Proyecciones de Población y Estudios Demográficos (PPED),
«Municipal. Proyecciones de población por área geográfica, periodo 2018-2042».

Uso:
    python -m ingesta.territorio.poblacion_dane            # descarga del portal DANE
    python -m ingesta.territorio.poblacion_dane --archivo PPED-AreaMun-2018-2042_VP.xlsx
"""

import argparse
import hashlib
import json
import logging
import ssl
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger("PoblacionDANE")

RAIZ = Path(__file__).resolve().parents[2]
URL_DANE = ("https://www.dane.gov.co/files/censo2018/proyecciones-de-poblacion/"
            "Municipal/PPED-AreaMun-2018-2042_VP.xlsx")
HOJA = "PobMunicipalxÁrea"
ENCABEZADO = ("DP", "DPNOM", "MPIO", "DPMP", "AÑO", "ÁREA GEOGRÁFICA", "TOTAL")
AREA_TOTAL = "Total"


def descargar(destino: Path) -> Path:
    req = urllib.request.Request(URL_DANE, headers={"User-Agent": "VigiaElNino-CRA/1.0"})
    with urllib.request.urlopen(req, timeout=300, context=ssl.create_default_context()) as r:
        destino.write_bytes(r.read())
    return destino


def leer_totales(filas: Iterable[tuple], divipolas: List[str]) -> Dict[str, Dict[str, int]]:
    """
    Recorre las filas de la hoja y devuelve {divipola: {año: total}} solo para
    el área 'Total'. Valida el encabezado: si el DANE cambia el formato, falla
    en lugar de leer columnas equivocadas.
    """
    buscados = set(divipolas)
    resultado: Dict[str, Dict[str, int]] = {}
    encabezado_ok = False
    for fila in filas:
        if not fila:
            continue
        if tuple(fila[:7]) == ENCABEZADO:
            encabezado_ok = True
            continue
        if not encabezado_ok or fila[5] != AREA_TOTAL:
            continue
        div = str(fila[2]).zfill(5)
        if div in buscados and isinstance(fila[6], (int, float)):
            resultado.setdefault(div, {})[str(int(fila[4]))] = int(fila[6])
    if not encabezado_ok:
        raise ValueError(f"No se encontró el encabezado esperado {ENCABEZADO} en la hoja {HOJA}")
    return resultado


def construir(archivo: Path, base_dir: Path = RAIZ) -> Dict[str, Any]:
    import openpyxl  # dependencia solo de este script

    territorio = json.loads((base_dir / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    divipolas = [m["divipola"] for m in territorio["municipios"]]
    wb = openpyxl.load_workbook(archivo, read_only=True, data_only=True)
    try:
        totales = leer_totales(wb[HOJA].iter_rows(values_only=True), divipolas)
        actualizacion = next((c for fila in wb["PPED"].iter_rows(values_only=True) for c in fila
                              if isinstance(c, str) and c.startswith("Actualizado")), None)
    finally:
        wb.close()  # en Windows, el modo read_only deja el archivo bloqueado si no se cierra
    faltantes = sorted(set(divipolas) - set(totales))
    return {
        "descripcion": "Población total proyectada por municipio y año (RF-TER-06). Se usa la del año del corte.",
        "fuente": {
            "entidad": "DANE",
            "operacion": "Proyecciones de Población y Estudios Demográficos (PPED)",
            "archivo": "Municipal. Proyecciones de población por área geográfica, periodo 2018-2042",
            "url": URL_DANE,
            "sha256": hashlib.sha256(archivo.read_bytes()).hexdigest(),
            "actualizacion_dane": actualizacion,
            "area": "Total (cabecera municipal + centros poblados y rural disperso)",
        },
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/poblacion_dane.py",
        "municipios_sin_proyeccion": faltantes,
        "poblacion_por_anio": {div: totales[div] for div in divipolas if div in totales},
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument("--archivo", type=Path, help="xlsx ya descargado del portal DANE")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        archivo = args.archivo or descargar(Path(tmp) / "PPED-AreaMun-2018-2042_VP.xlsx")
        resultado = construir(archivo)
    destino = RAIZ / "data" / "config" / "poblacion_dane.json"
    destino.write_text(json.dumps(resultado, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"{len(resultado['poblacion_por_anio'])} municipios con proyección -> {destino}")
