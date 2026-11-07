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

Uso:
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
from typing import Any, Dict, List, Optional

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
    with urllib.request.urlopen(req, timeout=60, context=ssl.create_default_context()) as r:
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
    a = feats[0]["attributes"]
    return {
        "cod_area_hidrografica": a["cod_ah"], "area_hidrografica": a["nom_ah"],
        "cod_zona_hidrografica": a["cod_zh"], "zona_hidrografica": a["nombre_zh"],
        "cod_subzona_hidrografica": str(a["cod_szh"]), "subzona_hidrografica": a["nombre_szh"],
    }


def construir(base_dir: Path = RAIZ) -> Dict[str, Any]:
    territorio = json.loads((base_dir / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    divipolas = [m["divipola"] for m in territorio["municipios"]]
    cabeceras = cargar_cabeceras_dane(divipolas)
    capa = _get_json(URL_ZONIFICACION, {"f": "json"})

    municipios = []
    for div in divipolas:
        cab = cabeceras.get(div)
        fila: Dict[str, Any] = {"divipola": div}
        if not cab or cab["lat"] is None or cab["lon"] is None:
            fila.update(estado="no_resuelto", motivo="sin coordenadas DANE")
        else:
            fila.update(cab)
            zona = consultar_subzona(cab["lat"], cab["lon"])
            if zona is None:
                fila.update(estado="no_resuelto", motivo="la cabecera no cae en una única subzona")
            else:
                fila.update(zona, estado="resuelto")
            time.sleep(PAUSA_SEGUNDOS)
        municipios.append(fila)

    return {
        "descripcion": "Asignación de cada municipio evaluado a la zonificación hidrográfica oficial del IDEAM (ADR-0006).",
        "regla_asignacion": "Subzona hidrográfica que contiene el punto de la cabecera municipal publicado por el DANE (misma regla que H-2).",
        "fuentes": {
            "cabeceras": {"entidad": "DANE", "dataset": "DIVIPOLA - Códigos municipios", "url": URL_DIVIPOLA},
            "zonificacion": {"entidad": "IDEAM", "capa": capa.get("name"), "url": URL_ZONIFICACION,
                             "sistema_referencia": f"EPSG:{SR_MAGNA_SIRGAS} (MAGNA-SIRGAS)"},
        },
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "generado_por": "ingesta/territorio/cruce_hidrografico.py",
        "total": len(municipios),
        "resueltos": sum(1 for m in municipios if m["estado"] == "resuelto"),
        "municipios": municipios,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    resultado = construir()
    destino = RAIZ / "data" / "config" / "territorio_hidrografico.json"
    destino.write_text(json.dumps(resultado, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    logger.info(f"{resultado['resueltos']}/{resultado['total']} municipios asignados -> {destino}")
