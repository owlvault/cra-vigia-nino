"""
Pruebas del cruce municipio -> zonificación hidrográfica (RF-TER-08, ADR-0006)
Proyecto: Vigía El Niño · Acueductos (CRA)
Sin red: se simulan las respuestas del DANE y del IDEAM.
"""

import json
import shutil
from pathlib import Path

import pytest

from ingesta.pipeline_corte import PipelineCorte
from ingesta.territorio import cruce_hidrografico as cruce

RAIZ = Path(__file__).resolve().parents[2]

PORCE = {"cod_ah": 2, "nom_ah": "Magdalena Cauca", "cod_zh": 27, "nombre_zh": "Nechí",
         "cod_szh": 2701, "nombre_szh": "Río Porce"}


def test_coordenadas_dane_con_coma_decimal():
    assert cruce._num_coma("-75,581775") == -75.581775
    assert cruce._num_coma("") is None
    assert cruce._num_coma(None) is None


def test_cabecera_dentro_de_una_subzona(monkeypatch):
    """Escenario RF-TER-08: Medellín cae en Magdalena Cauca / Nechí / 2701 Río Porce."""
    monkeypatch.setattr(cruce, "_get_json", lambda url, params: {"features": [{"attributes": PORCE}]})
    zona = cruce.consultar_subzona(6.246631, -75.581775)
    assert zona["area_hidrografica"] == "Magdalena Cauca"
    assert zona["zona_hidrografica"] == "Nechí"
    assert zona["cod_subzona_hidrografica"] == "2701"


@pytest.mark.parametrize("features", [[], [{"attributes": PORCE}, {"attributes": PORCE}]])
def test_punto_fuera_o_ambiguo_no_se_adivina(monkeypatch, features):
    """Escenario RF-TER-08: sin exactamente una subzona => None (no_resuelto)."""
    monkeypatch.setattr(cruce, "_get_json", lambda url, params: {"features": features})
    assert cruce.consultar_subzona(0.0, 0.0) is None


def test_error_del_servicio_no_se_silencia(monkeypatch):
    monkeypatch.setattr(cruce, "_get_json", lambda url, params: {"error": {"code": 500}})
    with pytest.raises(RuntimeError):
        cruce.consultar_subzona(6.2, -75.5)


CUADRO = {"type": "Polygon", "coordinates": [[[-76.0, 6.0], [-75.0, 6.0], [-75.0, 7.0], [-76.0, 7.0], [-76.0, 6.0]]]}


def _base_sintetica(tmp_path, municipios):
    cfg = tmp_path / "data" / "config"
    (cfg / "geo").mkdir(parents=True)
    (cfg / "territorio_municipios.json").write_text(json.dumps({"municipios": municipios}), encoding="utf-8")
    shutil.copy(RAIZ / "data" / "config" / "parametros_ideam.json", cfg / "parametros_ideam.json")
    capas = {"zonificacion_hidrografica": PORCE, "ena_ivh_ano_seco": {"cod_szh": 2701, "cat": "Alto"},
             "ena_iua_ano_seco": {"cod_szh": 2701, "cat_iua_seco": "Crítico"}}
    manifiesto = {"capas": {}}
    for nombre, props in capas.items():
        fc = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": props, "geometry": CUADRO}]}
        (cfg / "geo" / f"{nombre}.geojson").write_text(json.dumps(fc), encoding="utf-8")
        manifiesto["capas"][nombre] = {"nombre_capa": nombre, "url": f"https://ideam/{nombre}",
                                       "sha256": "x", "descargado_en": "2026-11-09"}
    (cfg / "geo" / "manifiesto.json").write_text(json.dumps(manifiesto), encoding="utf-8")


def test_construir_local_marca_no_resuelto_sin_inventar(monkeypatch, tmp_path):
    """Fase 0: cruce local; borde o fuera => se pregunta al servicio; si tampoco, no_resuelto."""
    _base_sintetica(tmp_path, [
        {"divipola": "05001", "nombre": "Medellín", "lat": 6.246631, "lon": -75.581775},
        {"divipola": "44847", "nombre": "Uribia", "lat": None, "lon": None},
        {"divipola": "99999", "nombre": "Fuera", "lat": 11.0, "lon": -72.0},
    ])
    monkeypatch.setattr(cruce, "PAUSA_SEGUNDOS", 0)
    consultados = []
    monkeypatch.setattr(cruce, "consultar_subzona", lambda lat, lon: consultados.append((lat, lon)))
    res = cruce.construir(tmp_path)
    por_div = {m["divipola"]: m for m in res["municipios"]}
    assert por_div["05001"]["estado"] == "resuelto"
    assert por_div["05001"]["cod_subzona_hidrografica"] == "2701"
    assert por_div["44847"]["motivo"] == "sin coordenadas DANE"
    assert por_div["99999"]["estado"] == "no_resuelto"
    assert "area_hidrografica" not in por_div["99999"]
    assert consultados == [(11.0, -72.0)]                  # solo el caso fuera de la capa local
    assert res["resueltos"] == 1


def test_borde_se_resuelve_con_geometria_exacta_del_servicio(monkeypatch, tmp_path):
    _base_sintetica(tmp_path, [{"divipola": "99999", "nombre": "Borde", "lat": 11.0, "lon": -72.0}])
    monkeypatch.setattr(cruce, "PAUSA_SEGUNDOS", 0)
    monkeypatch.setattr(cruce, "consultar_subzona", lambda lat, lon: cruce._zona_desde_atributos(PORCE))
    fila = cruce.construir(tmp_path)["municipios"][0]
    assert fila["estado"] == "resuelto" and fila["metodo"] == "servicio"


def test_construir_ena_local(monkeypatch, tmp_path):
    _base_sintetica(tmp_path, [
        {"divipola": "05001", "nombre": "Medellín", "lat": 6.246631, "lon": -75.581775},
        {"divipola": "99999", "nombre": "Fuera", "lat": 11.0, "lon": -72.0},
    ])
    monkeypatch.setattr(cruce, "PAUSA_SEGUNDOS", 0)
    monkeypatch.setattr(cruce, "_categoria_remota", lambda url, lat, lon, campo: None)
    ena = cruce.construir_ena(tmp_path)
    assert ena["municipios"]["05001"] == {"h2_ivh_ano_seco": "Alto", "h3_iua_ano_seco": "Crítico"}
    assert ena["municipios"]["99999"]["h2_ivh_ano_seco"] is None    # no se adivina
    assert ena["cobertura"] == {"h2": 1, "h3": 1, "total": 2}


def test_config_versionada_cubre_todo_el_territorio():
    datos = json.loads((RAIZ / "data" / "config" / "territorio_hidrografico.json").read_text(encoding="utf-8"))
    territorio = json.loads((RAIZ / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    assert {m["divipola"] for m in datos["municipios"]} == {m["divipola"] for m in territorio["municipios"]}
    assert datos["resueltos"] == datos["total"] == 1122
    areas_oficiales = {"Caribe", "Magdalena Cauca", "Orinoco", "Amazonas", "Pacífico"}
    for m in datos["municipios"]:
        if m["estado"] == "resuelto":
            assert m["area_hidrografica"] in areas_oficiales


def test_corte_incluye_zonificacion(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    p = PipelineCorte(base_dir=str(tmp_path))
    corte = p.generar_corte_completo(amenaza_global={}, datos_ideam={}, datos_sivicap={},
                                     datos_ungrd_mvct={}, datos_xm={}, datos_firms={}, datos_sui={})
    medellin = next(m for m in corte["municipios"] if m["divipola"] == "05001")
    assert medellin["area_hidrografica"] == "Magdalena Cauca"
    assert medellin["cod_subzona_hidrografica"] == "2701"
