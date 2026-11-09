"""
Cruce municipio -> zonificación hidrográfica del IDEAM
Proyecto: Vigía El Niño · Acueductos (CRA)

ADR-0006 y specs/modelo-territorial.md (Q-TER-01): cada municipio se asigna al
área, zona y subzona hidrográfica que contiene su cabecera municipal, la misma
regla que usa H-2 en specs/indicadores.md.

Fuentes oficiales:
- Coordenadas de la cabecera: DIVIPOLA del DANE publicada en datos.gov.co.
- Zonificación: servicio ArcGIS REST del IDEAM, capa «Zonificación Hidrográfica 2025».

No se infiere nada por nombre: si el punto no cae dentro de ninguna subzona,
el municipio queda con estado 'no_resuelto'.

Desde la Fase 0 (cobertura nacional) el cruce es local, sobre las capas que
descarga ingesta.territorio.geometrias_ideam; consultar_subzona() queda para
verificaciones puntuales contra el servicio.

Uso:
    python -m ingesta.territorio.geometrias_ideam      # una vez por edición de capas
    python -m ingesta.territorio.cruce_hidrografico
"""

import json
import logging
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ingesta.territorio.geometrias_ideam import IndiceEspacial, cargar_capa, dir_geo

logger = logging.getLogger("CruceHidrografico")

RAIZ = Path(__file__).resolve().parents[2]
URL_DIVIPOLA = "https://www.datos.gov.co/resource/gdxc-w37w.json"
URL_ZONIFICACION = "https://visualizador.ideam.gov.co/gisserver/rest/services/Unidades_Analisis/MapServer/10"
CAMPOS_IDEAM = "cod_ah,nom_ah,cod_zh,nombre_zh,cod_szh,nombre_szh"
SR_MAGNA_SIRGAS = 4686
PAUSA_SEGUNDOS = 0.5  # cortesía con el servidor del IDEAM


def _get_json(url: str, params: Dict[str, str]) -> Any:
    """GET con verificación TLS estricta (architecture.md, política 1)."""
    consulta = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(consulta, headers={"User-Agent": "VigiaElNino-CRA/1.0"})
    ctx = ssl.create_default_context()
    if hasattr(ssl, "enum_certificates"):
        for cert, encoding, _ in ssl.enum_certificates("CA"):
            if encoding == "x509_asn":
                try:
                    ctx.load_verify_locations(cadata=cert)
                except ssl.SSLError:
                    pass
    with urllib.request.urlopen(req, timeout=60, context=ctx) as r:
        return json.loads(r.read().decode("utf-8"))


def _num_coma(valor: Optional[str]) -> Optional[float]:
    """El DANE publica las coordenadas con coma decimal ('-75,581775')."""
    if valor in (None, ""):
        return None
    return float(str(valor).replace(",", "."))


def cargar_cabeceras_dane(divipolas: List[str]) -> Dict[str, Dict[str, Any]]:
    lista = ",".join(f"'{d}'" for d in divipolas)
    filas = _get_json(URL_DIVIPOLA, {"$where": f"cod_mpio in ({lista})", "$limit": "5000"})
    return {
        f["cod_mpio"]: {
            "nombre_dane": f.get("nom_mpio"),
            "tipo_municipio": f.get("tipo_municipio"),
            "lat": _num_coma(f.get("latitud")),
            "lon": _num_coma(f.get("longitud")),
        }
        for f in filas
    }


def consultar_subzona(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    res = _get_json(f"{URL_ZONIFICACION}/query", {
        "geometry": f"{lon},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": str(SR_MAGNA_SIRGAS),
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": CAMPOS_IDEAM,
        "returnGeometry": "false",
        "f": "json",
    })
    if "error" in res:
        raise RuntimeError(f"IDEAM respondió error: {res['error']}")
    feats = res.get("features", [])
    if len(feats) != 1:
        return None  # fuera de toda subzona o en un borde ambiguo: no se adivina
    return _zona_desde_atributos(feats[0]["attributes"])


# Nombre oficial por código de área hidrográfica. La capa 2025 del IDEAM escribe «Pacifico»
# sin tilde; el código es la llave y el nombre se normaliza a la ortografía oficial.
AREAS_HIDROGRAFICAS = {1: "Caribe", 2: "Magdalena Cauca", 3: "Orinoco", 4: "Amazonas", 5: "Pacífico"}


def _zona_desde_atributos(a: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "cod_area_hidrografica": a["cod_ah"], "area_hidrografica": AREAS_HIDROGRAFICAS.get(a["cod_ah"], a["nom_ah"]),
        "cod_zona_hidrografica": a["cod_zh"], "zona_hidrografica": a["nombre_zh"],
        "cod_subzona_hidrografica": str(a["cod_szh"]), "subzona_hidrografica": a["nombre_szh"],
    }


def _categoria_remota(url: str, lat: float, lon: float, campo: str) -> Optional[str]:
    """Consulta de punto contra la geometría sin generalizar del servicio (solo para bordes)."""
    res = _get_json(f"{url}/query", {
        "geometry": f"{lon},{lat}", "geometryType": "esriGeometryPoint", "inSR": str(SR_MAGNA_SIRGAS),
        "spatialRel": "esriSpatialRelIntersects", "outFields": campo, "returnGeometry": "false", "f": "json"})
    if "error" in res:
        raise RuntimeError(f"IDEAM respondió error: {res['error']}")
    feats = res.get("features", [])
    return feats[0]["attributes"].get(campo) if len(feats) == 1 else None


def _categoria(indice: IndiceEspacial, lat: float, lon: float, campo: str, url: str) -> Tuple[Optional[str], str]:
    """
    Cruce local; si la cabecera queda en un borde (la capa local está generalizada
    ~200 m) se resuelve con una consulta puntual a la geometría exacta del servicio.
    Devuelve (categoría, método).
    """
    f = indice.unico(lon, lat)
    if f is not None:
        return f["properties"].get(campo), "local"
    time.sleep(PAUSA_SEGUNDOS)
    return _categoria_remota(url, lat, lon, campo), "servicio"


def construir(base_dir: Path = RAIZ) -> Dict[str, Any]:
    """
    Cruce local (Fase 0): las capas del IDEAM se descargan una vez con
    ingesta.territorio.geometrias_ideam y el punto en polígono se resuelve aquí,
    sin una consulta por municipio. Las coordenadas de la cabecera son las de la
    DIVIPOLA del DANE ya guardadas en territorio_municipios.json.
    """
    territorio = json.loads((base_dir / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    manifiesto = json.loads((dir_geo(base_dir) / "manifiesto.json").read_text(encoding="utf-8"))
    zonas = IndiceEspacial(cargar_capa("zonificacion_hidrografica", base_dir)["features"])

    municipios = []
    for m in territorio["municipios"]:
        fila: Dict[str, Any] = {"divipola": m["divipola"], "nombre_dane": m.get("nombre"),
                                "tipo_municipio": m.get("tipo_municipio")}
        if m.get("lat") is None or m.get("lon") is None:
            fila.update(estado="no_resuelto", motivo="sin coordenadas DANE")
        else:
            fila.update(lat=m["lat"], lon=m["lon"])
            f = zonas.unico(m["lon"], m["lat"])
            zona = _zona_desde_atributos(f["properties"]) if f else None
            if zona is None:   # borde de la capa generalizada: geometría exacta del servicio
                time.sleep(PAUSA_SEGUNDOS)
                zona = consultar_subzona(m["lat"], m["lon"])
                if zona is not None:
                    fila["metodo"] = "servicio"
            if zona is None:
                fila.update(estado="no_resuelto", motivo="la cabecera no cae en una única subzona")
            else:
                fila.update(zona, estado="resuelto")
        municipios.append(fila)

    capa = manifiesto["capas"]["zonificacion_hidrografica"]
    return {
        "descripcion": "Asignación de cada municipio evaluado a la zonificación hidrográfica oficial del IDEAM (ADR-0006).",
        "regla_asignacion": "Subzona hidrográfica que contiene el punto de la cabecera municipal publicado por el DANE (misma regla que H-2).",
        "fuentes": {
            "cabeceras": {"entidad": "DANE", "dataset": "DIVIPOLA - Códigos municipios", "url": URL_DIVIPOLA},
            "zonificacion": {"entidad": "IDEAM", "capa": capa["nombre_capa"], "url": capa["url"],
                             "sistema_referencia": f"EPSG:{SR_MAGNA_SIRGAS} (MAGNA-SIRGAS)",
                             "sha256_capa": capa["sha256"], "descargada_en": capa["descargado_en"]},
        },
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/cruce_hidrografico.py",
        "total": len(municipios),
        "resueltos": sum(1 for m in municipios if m["estado"] == "resuelto"),
        "municipios": municipios,
    }


def construir_ena(base_dir: Path = RAIZ) -> Dict[str, Any]:
    """
    H-2 y H-3 (specs/indicadores.md): categoría ENA de la subzona que contiene la
    cabecera. Son indicadores estáticos: se calculan una vez por edición del ENA,
    no en cada corrida diaria. Sin una única subzona => None (no se adivina).
    """
    cfg = base_dir / "data" / "config"
    territorio = json.loads((cfg / "territorio_municipios.json").read_text(encoding="utf-8"))
    conf = json.loads((cfg / "parametros_ideam.json").read_text(encoding="utf-8"))["fuentes"]
    manifiesto = json.loads((dir_geo(base_dir) / "manifiesto.json").read_text(encoding="utf-8"))
    ivh = IndiceEspacial(cargar_capa("ena_ivh_ano_seco", base_dir)["features"])
    iua = IndiceEspacial(cargar_capa("ena_iua_ano_seco", base_dir)["features"])
    c2, c3 = conf["ena_h2_ivh_ano_seco"], conf["ena_h3_iua_ano_seco"]

    municipios: Dict[str, Dict[str, Any]] = {}
    for m in territorio["municipios"]:
        if m.get("lat") is None or m.get("lon") is None:
            municipios[m["divipola"]] = {"h2_ivh_ano_seco": None, "h3_iua_ano_seco": None}
            continue
        h2, met2 = _categoria(ivh, m["lat"], m["lon"], c2["campo_categoria"], c2["url"])
        h3, met3 = _categoria(iua, m["lat"], m["lon"], c3["campo_categoria"], c3["url"])
        fila: Dict[str, Any] = {"h2_ivh_ano_seco": h2, "h3_iua_ano_seco": h3}
        if "servicio" in (met2, met3):
            fila["metodo"] = "servicio"
        municipios[m["divipola"]] = fila
    return {
        "descripcion": "Categorías ENA (año seco) de la subzona que contiene la cabecera municipal: H-2 (IVH, ENA 2010) y H-3 (IUA, ENA 2014).",
        "regla": "Punto de la cabecera DANE dentro de una única subzona de la capa ENA del IDEAM; si no, None.",
        "fuentes": {k: {"capa": manifiesto["capas"][k]["nombre_capa"], "url": manifiesto["capas"][k]["url"],
                        "sha256_capa": manifiesto["capas"][k]["sha256"]} for k in ("ena_ivh_ano_seco", "ena_iua_ano_seco")},
        "fecha_dato": {"h2": c2["fecha_dato"], "h3": c3["fecha_dato"]},
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/cruce_hidrografico.py",
        "cobertura": {"h2": sum(1 for v in municipios.values() if v["h2_ivh_ano_seco"]),
                      "h3": sum(1 for v in municipios.values() if v["h3_iua_ano_seco"]),
                      "total": len(municipios)},
        "municipios": municipios,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    resultado = construir()
    destino = RAIZ / "data" / "config" / "territorio_hidrografico.json"
    destino.write_text(json.dumps(resultado, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"{resultado['resueltos']}/{resultado['total']} municipios asignados -> {destino}")
    ena = construir_ena()
    destino_ena = RAIZ / "data" / "config" / "ena_municipios.json"
    destino_ena.write_text(json.dumps(ena, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"ENA: {ena['cobertura']} -> {destino_ena}")
