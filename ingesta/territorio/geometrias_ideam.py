"""
Capas geográficas nacionales del IDEAM, descargadas una sola vez (Fase 0, cobertura nacional)
Proyecto: Vigía El Niño · Acueductos (CRA)

Antes, cada proceso pedía un polígono o hacía una consulta de punto por municipio
(23 municipios × 2 consultas ENA en cada corrida diaria). Con 1.122 municipios eso
son miles de solicitudes por corrida y viola RF-ING-07 (1 solicitud/s por dominio).

Este módulo descarga en bloque, paginado, las capas que no cambian día a día:
- municipios (polígonos, llave num_dane = DIVIPOLA),
- zonificación hidrográfica 2025 (área, zona, subzona),
- ENA 2010 IVH año seco (H-2) y ENA 2014 IUA año seco (H-3),

y las guarda como GeoJSON en data/config/geo/ con un manifiesto (URL, fecha,
conteo y SHA-256). Los cruces espaciales se hacen después en local.

Uso:
    python -m ingesta.territorio.geometrias_ideam
"""

import hashlib
import json
import logging
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Sequence, Tuple

logger = logging.getLogger("GeometriasIDEAM")

RAIZ = Path(__file__).resolve().parents[2]
SERVICIOS = "https://visualizador.ideam.gov.co/gisserver/rest/services"
SR_MAGNA_SIRGAS = 4686
GENERALIZACION_GRADOS = 0.002   # ~200 m; misma tolerancia que usaba estaciones_ideam.py
TAMANO_PAGINA = 50
PAUSA_SEGUNDOS = 1.0            # RF-ING-07

CAPAS: Dict[str, Dict[str, str]] = {
    "municipios": {"ruta": "Entidades_Territoriales/MapServer/2",
                   "campos": "num_dane,nom_mpio,nom_dpto,categoria"},
    "zonificacion_hidrografica": {"ruta": "Unidades_Analisis/MapServer/10",
                                  "campos": "cod_ah,nom_ah,cod_zh,nombre_zh,cod_szh,nombre_szh"},
    "ena_ivh_ano_seco": {"ruta": "Indicadores_Hidricos/MapServer/13", "campos": "cod_szh,cat"},
    "ena_iua_ano_seco": {"ruta": "Indicadores_Hidricos/MapServer/11",
                         "campos": "cod_szh,nom_szh,iua_seco,cat_iua_seco"},
}

Anillo = Sequence[Sequence[float]]


# ------------------------------------------------------------------------ red
def _contexto_tls() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    if hasattr(ssl, "enum_certificates"):
        for cert, encoding, _ in ssl.enum_certificates("CA"):
            if encoding == "x509_asn":
                try:
                    ctx.load_verify_locations(cadata=cert)
                except ssl.SSLError:
                    pass
    return ctx


def _get_json(url: str, params: Dict[str, str], timeout: int = 180, intentos: int = 3) -> Any:
    consulta = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(consulta, headers={"User-Agent": "CRA-VigiaNino/1.0"})
    for i in range(intentos):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_contexto_tls()) as r:
                datos = json.loads(r.read().decode("utf-8"))
            if isinstance(datos, dict) and "error" in datos:
                raise RuntimeError(f"El servicio respondió error: {datos['error']}")
            return datos
        except Exception as e:  # noqa: BLE001 — se reintenta y luego se propaga
            if i == intentos - 1:
                raise
            logger.warning(f"Reintento {i + 1} de {url}: {e}")
            time.sleep(4 ** (i + 1))


def descargar_capa(ruta: str, campos: str) -> Dict[str, Any]:
    """Todas las entidades de una capa ArcGIS REST, paginadas por objectid, en GeoJSON."""
    url = f"{SERVICIOS}/{ruta}"
    total = _get_json(f"{url}/query", {"where": "1=1", "returnCountOnly": "true", "f": "json"})["count"]
    features: List[Dict[str, Any]] = []
    for offset in range(0, total, TAMANO_PAGINA):
        pagina = _get_json(f"{url}/query", {
            "where": "1=1", "outFields": campos, "returnGeometry": "true",
            "outSR": str(SR_MAGNA_SIRGAS), "maxAllowableOffset": str(GENERALIZACION_GRADOS),
            "orderByFields": "objectid", "resultOffset": str(offset),
            "resultRecordCount": str(TAMANO_PAGINA), "f": "geojson"})
        features += pagina.get("features", [])
        time.sleep(PAUSA_SEGUNDOS)
    if len(features) != total:
        raise RuntimeError(f"{ruta}: se esperaban {total} entidades y llegaron {len(features)}")
    for f in features:   # coordenadas a 5 decimales (~1 m): reduce el archivo sin perder nada útil
        f["geometry"] = _redondear(f["geometry"]) if f.get("geometry") else None
        f.pop("id", None)
    return {"type": "FeatureCollection", "features": features}


def _redondear(geom: Dict[str, Any], dec: int = 5) -> Dict[str, Any]:
    def r(c):
        return [round(c[0], dec), round(c[1], dec)] if isinstance(c[0], (int, float)) else [r(x) for x in c]
    return {"type": geom["type"], "coordinates": r(geom["coordinates"])}


# ------------------------------------------------------------------ geometría
def _punto_en_anillo(lon: float, lat: float, anillo: Anillo) -> bool:
    """Ray casting sobre un anillo [[lon, lat], ...]."""
    dentro = False
    n = len(anillo)
    for i in range(n):
        x1, y1 = anillo[i][0], anillo[i][1]
        x2, y2 = anillo[(i + 1) % n][0], anillo[(i + 1) % n][1]
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            dentro = not dentro
    return dentro


def punto_en_geometria(lon: float, lat: float, geometria: Dict[str, Any]) -> bool:
    """Polygon o MultiPolygon GeoJSON; respeta huecos."""
    poligonos = [geometria["coordinates"]] if geometria["type"] == "Polygon" else geometria["coordinates"]
    for anillos in poligonos:
        if anillos and _punto_en_anillo(lon, lat, anillos[0]) and \
                not any(_punto_en_anillo(lon, lat, hueco) for hueco in anillos[1:]):
            return True
    return False


def caja(geometria: Dict[str, Any]) -> Tuple[float, float, float, float]:
    """(min_lon, min_lat, max_lon, max_lat) de una geometría GeoJSON."""
    xs: List[float] = []
    ys: List[float] = []

    def recorrer(c):
        if isinstance(c[0], (int, float)):
            xs.append(c[0])
            ys.append(c[1])
        else:
            for x in c:
                recorrer(x)
    recorrer(geometria["coordinates"])
    return min(xs), min(ys), max(xs), max(ys)


class IndiceEspacial:
    """Búsqueda de punto en polígono con prefiltro por caja envolvente (suficiente para ~1.000 polígonos)."""

    def __init__(self, features: List[Dict[str, Any]]):
        self.items = [(caja(f["geometry"]), f) for f in features if f.get("geometry")]

    def contienen(self, lon: float, lat: float) -> Iterator[Dict[str, Any]]:
        for (x0, y0, x1, y1), f in self.items:
            if x0 <= lon <= x1 and y0 <= lat <= y1 and punto_en_geometria(lon, lat, f["geometry"]):
                yield f

    def unico(self, lon: float, lat: float) -> Optional[Dict[str, Any]]:
        """La entidad que contiene el punto; None si ninguna o más de una (no se adivina)."""
        encontrados = list(self.contienen(lon, lat))
        return encontrados[0] if len(encontrados) == 1 else None


# --------------------------------------------------------------- persistencia
def dir_geo(base_dir: Path = RAIZ) -> Path:
    return base_dir / "data" / "config" / "geo"


def cargar_capa(nombre: str, base_dir: Path = RAIZ) -> Dict[str, Any]:
    ruta = dir_geo(base_dir) / f"{nombre}.geojson"
    if not ruta.exists():
        raise FileNotFoundError(f"Falta {ruta}. Ejecute: python -m ingesta.territorio.geometrias_ideam")
    return json.loads(ruta.read_text(encoding="utf-8"))


def poligonos_municipales(base_dir: Path = RAIZ) -> Dict[str, Dict[str, Any]]:
    """{divipola: geometría GeoJSON}."""
    capa = cargar_capa("municipios", base_dir)
    return {str(f["properties"]["num_dane"]).zfill(5): f["geometry"] for f in capa["features"]}


def construir(base_dir: Path = RAIZ, capas: Optional[List[str]] = None) -> Dict[str, Any]:
    destino = dir_geo(base_dir)
    destino.mkdir(parents=True, exist_ok=True)
    ruta_manifiesto = destino / "manifiesto.json"
    manifiesto = json.loads(ruta_manifiesto.read_text(encoding="utf-8")) if ruta_manifiesto.exists() else {
        "descripcion": "Capas geográficas del IDEAM descargadas en bloque para los cruces espaciales nacionales.",
        "generado_por": "ingesta/territorio/geometrias_ideam.py", "capas": {}}
    for nombre in capas or list(CAPAS):
        c = CAPAS[nombre]
        logger.info(f"Descargando {nombre} ({c['ruta']})...")
        info = _get_json(f"{SERVICIOS}/{c['ruta']}", {"f": "json"})
        fc = descargar_capa(c["ruta"], c["campos"])
        contenido = json.dumps(fc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        (destino / f"{nombre}.geojson").write_bytes(contenido)
        manifiesto["capas"][nombre] = {
            "url": f"{SERVICIOS}/{c['ruta']}", "nombre_capa": info.get("name"),
            "entidades": len(fc["features"]), "sistema_referencia": f"EPSG:{SR_MAGNA_SIRGAS}",
            "generalizacion_grados": GENERALIZACION_GRADOS,
            "descargado_en": datetime.now(timezone.utc).isoformat(),
            "sha256": hashlib.sha256(contenido).hexdigest(), "bytes": len(contenido)}
        logger.info(f"  {len(fc['features'])} entidades, {len(contenido) / 1e6:.1f} MB")
    ruta_manifiesto.write_text(json.dumps(manifiesto, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return manifiesto


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    construir(capas=sys.argv[1:] or None)
