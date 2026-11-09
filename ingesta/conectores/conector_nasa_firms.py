"""
Conector Oficial NASA FIRMS (Focos de Calor y Anomalías Térmicas)
Fuente: FTE-FIRMS
Indicador: A-5 (Focos de Calor en el Municipio - Conteo 7 días)

Acceso:
- NASA FIRMS API de área por país (producto VIIRS S-NPP de tiempo casi real, NRT)
- Variable de entorno requerida: FIRMS_MAP_KEY
- Si la clave no está configurada o la API falla, A-5 queda en null (sin_dato), nunca en 0.

Fase 0 (cobertura nacional): cada detección se asigna al municipio cuyo polígono
la contiene (data/config/geo/municipios.geojson), no por nombre. Con respuesta
válida de la API, un municipio sin detecciones tiene A-5 = 0 (dato observado).
Spec (specs/indicadores.md A-5): solo cuentan detecciones de confianza nominal o alta.
"""

import csv
import hashlib
import io
import json
import logging
import os
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from ingesta.conector_base import CapturaResultado, ConectorBase

logger = logging.getLogger("ConectorNASAFIRMS")

URL_AREA_PAIS = "https://firms.modaps.eosdis.nasa.gov/api/country/csv/{key}/{fuente}/COL/{dias}/{fecha}"
FUENTE_FIRMS = "VIIRS_SNPP_NRT"      # SP (standard processing) llega con meses de rezago
DIAS_VENTANA = 7
MAX_DIAS_POR_CONSULTA = 5            # límite de DAY_RANGE en la API de área de FIRMS
CONFIANZAS_VALIDAS = {"n", "h", "nominal", "high"}


def tramos_consulta(hoy: date, dias: int = DIAS_VENTANA, maximo: int = MAX_DIAS_POR_CONSULTA) -> List[Tuple[date, int]]:
    """[(fecha_inicio, n_días)] que cubren los últimos 'dias' días hasta hoy inclusive."""
    inicio = hoy - timedelta(days=dias - 1)
    tramos = []
    while inicio <= hoy:
        n = min(maximo, (hoy - inicio).days + 1)
        tramos.append((inicio, n))
        inicio += timedelta(days=n)
    return tramos


def leer_detecciones(csv_texto: str) -> List[Dict[str, Any]]:
    """Filas del CSV de FIRMS con confianza nominal o alta y coordenadas válidas."""
    filas = []
    for r in csv.DictReader(io.StringIO(csv_texto)):
        conf = str(r.get("confidence", "")).strip().lower()
        try:
            lat, lon = float(r["latitude"]), float(r["longitude"])
        except (KeyError, TypeError, ValueError):
            continue
        if conf in CONFIANZAS_VALIDAS:
            filas.append({"lat": lat, "lon": lon, "fecha": r.get("acq_date"), "confianza": conf})
    return filas


def contar_por_municipio(detecciones: List[Dict[str, Any]], indice: Any,
                         divipolas: List[str]) -> Tuple[Dict[str, int], int]:
    """
    Conteo de detecciones por municipio (punto en polígono). Devuelve (conteos, fuera)
    donde 'fuera' son las detecciones que no caen en ningún polígono (mar, frontera).
    """
    conteo = {d: 0 for d in divipolas}
    fuera = 0
    for det in detecciones:
        f = indice.unico(det["lon"], det["lat"])
        div = str(f["properties"]["num_dane"]).zfill(5) if f else None
        if div in conteo:
            conteo[div] += 1
        else:
            fuera += 1
    return conteo, fuera


class ConectorNASAFIRMS(ConectorBase):
    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-FIRMS-NASA",
            nombre_fuente="Focos de Calor y Detecciones Térmicas NASA FIRMS",
            entidad="NASA Earthdata / FIRMS",
            base_dir=base_dir
        )
        self.config_mun_file = self.root_dir / "data" / "config" / "territorio_municipios.json"

    def _cargar_catalogo_municipios(self) -> Dict[str, Any]:
        """Municipios evaluados desde la dimensión territorial (data/config/territorio_municipios.json)."""
        datos = json.loads(self.config_mun_file.read_text(encoding="utf-8"))
        return {m["divipola"]: {"nombre": m["nombre"], "depto": m["departamento"]} for m in datos["municipios"]}

    def _consultar_api_firms(self, map_key: str) -> Optional[str]:
        """CSV de detecciones en Colombia de los últimos 7 días (varias consultas de <= 5 días)."""
        partes: List[str] = []
        for inicio, n in tramos_consulta(date.today()):
            url = URL_AREA_PAIS.format(key=map_key, fuente=FUENTE_FIRMS, dias=n, fecha=inicio.isoformat())
            req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
            try:
                with urllib.request.urlopen(req, context=self.ssl_context, timeout=60) as resp:
                    texto = resp.read().decode("utf-8", errors="replace")
            except Exception as e:  # noqa: BLE001
                logger.warning(f"Error consultando API NASA FIRMS ({inicio}, {n} d): {e}")
                return None
            if not texto.lstrip().lower().startswith(("latitude", "country_id")):
                logger.warning(f"Respuesta FIRMS inesperada: {texto[:120]!r}")
                return None
            lineas = texto.strip().splitlines()
            partes.append("\n".join(lineas if not partes else lineas[1:]))
            time.sleep(1.0)
        return "\n".join(partes)

    def ejecutar_captura(self) -> CapturaResultado:
        map_key = os.environ.get("FIRMS_MAP_KEY", "").strip()
        catalogo_mun = self._cargar_catalogo_municipios()
        fecha_reporte = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        csv_data = None
        if map_key:
            logger.info("Consultando API oficial NASA FIRMS con FIRMS_MAP_KEY...")
            csv_data = self._consultar_api_firms(map_key)
        else:
            logger.info("FIRMS_MAP_KEY no configurada. Conforme a la auditoría, A-5 queda en null (sin_dato).")

        conteos: Dict[str, Optional[int]] = {d: None for d in catalogo_mun}
        resumen_crudo: Dict[str, Any] = {}
        if csv_data is not None:
            from ingesta.territorio.geometrias_ideam import IndiceEspacial, cargar_capa
            detecciones = leer_detecciones(csv_data)
            indice = IndiceEspacial(cargar_capa("municipios", self.root_dir)["features"])
            c, fuera = contar_por_municipio(detecciones, indice, list(catalogo_mun))
            conteos.update(c)
            resumen_crudo = {"detecciones_validas": len(detecciones), "fuera_de_poligonos": fuera,
                             "csv": csv_data}

        focos_municipales: Dict[str, Any] = {}
        a5_por_divipola: Dict[str, Any] = {}
        for divipola, info in catalogo_mun.items():
            focos_municipales[divipola] = {"nombre": info.get("nombre", ""), "focos_7d": conteos[divipola]}
            a5_por_divipola[divipola] = {
                "divipola": divipola,
                "nombre_municipio": info.get("nombre", ""),
                "indicador_a5_focos_7d": conteos[divipola],
                "fuente": f"NASA FIRMS ({FUENTE_FIRMS})",
                "fecha_dato": fecha_reporte,
            }

        snapshot = {
            "fuente": f"NASA FIRMS ({FUENTE_FIRMS}, confianza nominal y alta)",
            "ventana_dias": DIAS_VENTANA,
            "fecha_reporte": fecha_reporte,
            "fecha_captura": datetime.now(timezone.utc).isoformat(),
            "estado_autenticacion": "api_key_presente" if map_key else "sin_api_key_modo_seguro",
            "respuesta_api": "valida" if csv_data is not None else "sin_respuesta",
            "crudo": resumen_crudo,
            "focos_municipales": focos_municipales,
        }

        contenido_bytes = json.dumps(snapshot, indent=2, ensure_ascii=False).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido_bytes).hexdigest()
        ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)
        con_dato = sum(1 for v in conteos.values() if v is not None)
        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_bytes),
            filas_procesadas=len(catalogo_mun),
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje=(f"Captura FIRMS: A-5 en {con_dato}/{len(catalogo_mun)} municipios "
                     f"(modo: {'API' if csv_data is not None else 'sin_clave/null'})"),
            datos_extraidos=a5_por_divipola
        )
