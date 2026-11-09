"""
Asignación de estaciones de precipitación del IDEAM a municipios (RF-TER-04)
Proyecto: Vigía El Niño · Acueductos (CRA)

Para cada municipio evaluado:
- estaciones DENTRO de su polígono municipal (contención geométrica, no por nombre);
- estaciones CERCANAS a su cabecera (radio IDW), para cuando no hay dato adentro.

Se hace para dos redes: automática (lluvia diaria reciente) y normales 1991-2020.
Las estaciones no se mueven: el resultado es una dimensión en config que se
regenera cuando cambie la red o se agreguen municipios.

Uso:
    python -m ingesta.territorio.estaciones_ideam
"""

import json
import logging
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

from ingesta.clima.precipitacion_municipal import distancia_km

logger = logging.getLogger("EstacionesIDEAM")
RAIZ = Path(__file__).resolve().parents[2]
Anillo = Sequence[Sequence[float]]


def _get_json(url: str, params: Dict[str, str], timeout: int = 180) -> Any:
    req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                 headers={"User-Agent": "VigiaElNino-CRA/1.0"})
    ctx = ssl.create_default_context()
    if hasattr(ssl, "enum_certificates"):
        for cert, encoding, _ in ssl.enum_certificates("CA"):
            if encoding == "x509_asn":
                try:
                    ctx.load_verify_locations(cadata=cert)
                except ssl.SSLError:
                    pass
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return json.loads(r.read().decode("utf-8"))


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


# -------------------------------------------------------------------- fuentes
def poligono_municipio(conf: Dict[str, Any], divipola: str) -> Dict[str, Any]:
    fuente = conf["fuentes"]["municipios_poligonos"]
    res = _get_json(f"{fuente['url']}/query", {
        "where": f"{fuente['campo_divipola']}='{divipola}'", "outFields": fuente["campo_divipola"],
        "returnGeometry": "true", "outSR": str(conf["fuentes"]["sistema_referencia"]),
        "maxAllowableOffset": "0.002", "f": "geojson"})
    feats = res.get("features", [])
    if len(feats) != 1:
        raise RuntimeError(f"Se esperaba 1 polígono para {divipola} y llegaron {len(feats)}")
    return feats[0]["geometry"]


def estaciones_automaticas(conf: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Estaciones con el sensor de 10 min activas en los últimos 30 días."""
    f = conf["fuentes"]["precipitacion_10min"]
    desde = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00")
    filas = _get_json(f["url"], {
        "$select": "codigoestacion, nombreestacion, municipio, departamento, latitud, longitud",
        "$where": f"codigosensor='{f['codigo_sensor']}' AND fechaobservacion >= '{desde}'",
        "$group": "codigoestacion, nombreestacion, municipio, departamento, latitud, longitud",
        "$limit": "5000"})
    return [{"codigo": r["codigoestacion"], "nombre": r["nombreestacion"],
             "lat": float(r["latitud"]), "lon": float(r["longitud"])} for r in filas]


def estaciones_normales(conf: Dict[str, Any]) -> List[Dict[str, Any]]:
    f = conf["fuentes"]["normales_climatologicas"]
    filas = _get_json(f["url"], {"$where": f"periodo='{f['periodo']}' AND par_metro='{f['parametro']}'",
                                 "$select": "c_digo, estaci_n, latitud, longitud", "$limit": "50000"})
    return [{"codigo": r["c_digo"], "nombre": r["estaci_n"],
             "lat": float(r["latitud"]), "lon": float(r["longitud"])} for r in filas
            if r.get("latitud") and r.get("longitud")]


# ------------------------------------------------------------------- cálculo
def asignar(municipios: List[Dict[str, Any]], poligonos: Dict[str, Dict[str, Any]],
            estaciones: List[Dict[str, Any]], radio_km: float) -> Dict[str, Dict[str, Any]]:
    """Por municipio: códigos dentro del polígono y {código: km a la cabecera} dentro del radio."""
    resultado = {}
    for m in municipios:
        geom = poligonos[m["divipola"]]
        dentro, cercanas = [], {}
        for e in estaciones:
            if punto_en_geometria(e["lon"], e["lat"], geom):
                dentro.append(e["codigo"])
            else:
                d = distancia_km(m["lat"], m["lon"], e["lat"], e["lon"])
                if d <= radio_km:
                    cercanas[e["codigo"]] = round(d, 2)
        resultado[m["divipola"]] = {"dentro": sorted(dentro), "cercanas_km": dict(sorted(cercanas.items(), key=lambda x: x[1]))}
    return resultado


def construir(base_dir: Path = RAIZ) -> Dict[str, Any]:
    cfg = base_dir / "data" / "config"
    conf = json.loads((cfg / "parametros_ideam.json").read_text(encoding="utf-8"))
    municipios = json.loads((cfg / "territorio_municipios.json").read_text(encoding="utf-8"))["municipios"]
    radio = conf["precipitacion"]["radio_idw_km"]

    poligonos = {}
    for m in municipios:
        poligonos[m["divipola"]] = poligono_municipio(conf, m["divipola"])
        time.sleep(0.3)
    auto, normales = estaciones_automaticas(conf), estaciones_normales(conf)
    a_auto, a_norm = asignar(municipios, poligonos, auto, radio), asignar(municipios, poligonos, normales, radio)

    usados_auto = {c for v in a_auto.values() for c in v["dentro"] + list(v["cercanas_km"])}
    usados_norm = {c for v in a_norm.values() for c in v["dentro"] + list(v["cercanas_km"])}
    return {
        "descripcion": "Estaciones IDEAM por municipio: dentro del polígono municipal y cercanas a la cabecera (RF-TER-04).",
        "regla": f"Contención en el polígono municipal del IDEAM; cercanas = a menos de {radio} km de la cabecera DANE.",
        "fuentes": {k: conf["fuentes"][k]["url"] for k in ("precipitacion_10min", "normales_climatologicas", "municipios_poligonos")},
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/estaciones_ideam.py",
        "estaciones": {
            "automaticas": {e["codigo"]: {"nombre": e["nombre"], "lat": e["lat"], "lon": e["lon"]} for e in auto if e["codigo"] in usados_auto},
            "normales": {e["codigo"]: {"nombre": e["nombre"], "lat": e["lat"], "lon": e["lon"]} for e in normales if e["codigo"] in usados_norm},
        },
        "municipios": {m["divipola"]: {"automaticas": a_auto[m["divipola"]], "normales": a_norm[m["divipola"]]} for m in municipios},
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    r = construir()
    destino = RAIZ / "data" / "config" / "estaciones_ideam.json"
    destino.write_text(json.dumps(r, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"{len(r['estaciones']['automaticas'])} automáticas y {len(r['estaciones']['normales'])} normales -> {destino}")
