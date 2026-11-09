"""
Dimensión territorial nacional: los 1.122 códigos DIVIPOLA (Fase 0)
Proyecto: Vigía El Niño · Acueductos (CRA)

RF-TER-01 / ADR-0002: el territorio evaluado es la DIVIPOLA vigente del DANE
(1.103 municipios, 18 áreas no municipalizadas y 1 isla). Este script regenera
data/config/territorio_municipios.json a partir de:
- DANE, «DIVIPOLA – Códigos municipios» (datos.gov.co gdxc-w37w): código,
  nombre, departamento, tipo y coordenadas de la cabecera;
- el polígono municipal del IDEAM (data/config/geo/municipios.geojson) para
  verificar que cada código tiene geometría y que la cabecera cae dentro.

Los municipios que ya estaban en el archivo conservan sus campos (nombre con
tildes, región y población de respaldo); los nuevos llevan la región natural
por departamento (uso descriptivo, ver 'pendiente') y población de respaldo
nula: el corte usa la proyección DANE (RF-TER-06).

Uso:
    python -m ingesta.territorio.territorio_nacional
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from ingesta.territorio.cruce_hidrografico import URL_DIVIPOLA, _get_json, _num_coma
from ingesta.territorio.geometrias_ideam import poligonos_municipales, punto_en_geometria

logger = logging.getLogger("TerritorioNacional")
RAIZ = Path(__file__).resolve().parents[2]

# Región natural por departamento: agregación descriptiva del tablero interno. La
# agregación oficial es por departamento y zonificación hidrográfica (ADR-0006).
REGION_POR_DEPTO = {
    "05": "Andina", "08": "Caribe", "11": "Andina", "13": "Caribe", "15": "Andina", "17": "Andina",
    "18": "Amazonía", "19": "Pacífica", "20": "Caribe", "23": "Caribe", "25": "Andina", "27": "Pacífica",
    "41": "Andina", "44": "Caribe", "47": "Caribe", "50": "Orinoquía", "52": "Pacífica", "54": "Andina",
    "63": "Andina", "66": "Andina", "68": "Andina", "70": "Caribe", "73": "Andina", "76": "Pacífica",
    "81": "Orinoquía", "85": "Orinoquía", "86": "Amazonía", "88": "Insular", "91": "Amazonía",
    "94": "Amazonía", "95": "Amazonía", "97": "Amazonía", "99": "Orinoquía",
}

TOTAL_DIVIPOLA_ESPERADO = 1122


def _titulo(texto: str) -> str:
    """'SAN JOSÉ DEL GUAVIARE' -> 'San José del Guaviare' (presentación; la llave es el código)."""
    menores = {"de", "del", "la", "las", "los", "el", "y", "e"}
    palabras = texto.strip().lower().split()
    return " ".join(p if (i and p in menores) else p[:1].upper() + p[1:] for i, p in enumerate(palabras))


def cargar_divipola() -> List[Dict[str, Any]]:
    filas = _get_json(URL_DIVIPOLA, {"$limit": "5000", "$order": "cod_mpio"})
    if len(filas) != TOTAL_DIVIPOLA_ESPERADO:
        logger.warning(f"La DIVIPOLA trae {len(filas)} códigos (se esperaban {TOTAL_DIVIPOLA_ESPERADO})")
    return filas


def construir_municipios(divipola: List[Dict[str, Any]], existentes: Dict[str, Dict[str, Any]],
                         poligonos: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    municipios = []
    for f in divipola:
        div = str(f["cod_mpio"]).zfill(5)
        lat, lon = _num_coma(f.get("latitud")), _num_coma(f.get("longitud"))
        previo = existentes.get(div, {})
        geom = poligonos.get(div)
        m: Dict[str, Any] = {
            "divipola": div,
            "nombre": previo.get("nombre") or _titulo(f["nom_mpio"]),
            "departamento": previo.get("departamento") or _titulo(f["dpto"]),
            "cod_depto": div[:2],
            "tipo_municipio": f.get("tipo_municipio"),
            "poblacion": previo.get("poblacion"),
            "region": previo.get("region") or REGION_POR_DEPTO.get(div[:2]),
            "lat": lat,
            "lon": lon,
            "tiene_poligono": geom is not None,
            "cabecera_en_poligono": (geom is not None and lat is not None and lon is not None
                                     and punto_en_geometria(lon, lat, geom)),
        }
        if div in existentes:
            m["piloto"] = True
        municipios.append(m)
    return municipios


def construir(base_dir: Path = RAIZ) -> Dict[str, Any]:
    ruta = base_dir / "data" / "config" / "territorio_municipios.json"
    previo = json.loads(ruta.read_text(encoding="utf-8"))
    existentes = {m["divipola"]: m for m in previo["municipios"]}
    poligonos = poligonos_municipales(base_dir)
    municipios = construir_municipios(cargar_divipola(), existentes, poligonos)

    sin_poligono = [m["divipola"] for m in municipios if not m["tiene_poligono"]]
    fuera = [m["divipola"] for m in municipios if m["tiene_poligono"] and not m["cabecera_en_poligono"]]
    sin_region = [m["divipola"] for m in municipios if not m["region"]]
    return {
        "descripcion": "Municipios evaluados por el corte diario: DIVIPOLA nacional completa (equivale a oro.dim_territorio, RF-TER-01).",
        "version": f"v2.0.0-{datetime.now(timezone.utc):%Y%m%d}",
        "origen": ("DIVIPOLA del DANE (datos.gov.co gdxc-w37w): código, nombre, departamento, tipo y coordenadas "
                   "de la cabecera. Polígono municipal del IDEAM (Entidades_Territoriales/MapServer/2). "
                   f"Los {len(existentes)} municipios del piloto conservan nombre, región y población de respaldo."),
        "pendiente": previo.get("pendiente"),
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/territorio_nacional.py",
        "resumen": {
            "total": len(municipios),
            "por_tipo": {t: sum(1 for m in municipios if m["tipo_municipio"] == t)
                         for t in sorted({m["tipo_municipio"] for m in municipios})},
            "piloto": len(existentes),
            "sin_poligono": sin_poligono,
            "cabecera_fuera_del_poligono": fuera,
            "sin_region": sin_region,
        },
        "municipios": municipios,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    r = construir()
    destino = RAIZ / "data" / "config" / "territorio_municipios.json"
    destino.write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"{r['resumen']} -> {destino}")
