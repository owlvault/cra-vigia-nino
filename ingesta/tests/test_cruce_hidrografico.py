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


def test_construir_marca_no_resuelto_sin_inventar(monkeypatch, tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    monkeypatch.setattr(cruce, "PAUSA_SEGUNDOS", 0)
    monkeypatch.setattr(cruce, "cargar_cabeceras_dane",
                        lambda divs: {"05001": {"nombre_dane": "MEDELLÍN", "tipo_municipio": "Municipio",
                                                "lat": 6.246631, "lon": -75.581775}})

    def falso_get(url, params):
        if url.endswith("/query"):
            return {"features": [{"attributes": PORCE}]}
        return {"name": "Zonificación Hidrográfica 2025"}

    monkeypatch.setattr(cruce, "_get_json", falso_get)
    res = cruce.construir(tmp_path)
    por_div = {m["divipola"]: m for m in res["municipios"]}
    assert por_div["05001"]["estado"] == "resuelto"
    assert por_div["44847"]["estado"] == "no_resuelto"     # sin coordenadas DANE en la simulación
    assert "area_hidrografica" not in por_div["44847"]
    assert res["resueltos"] == 1


def test_config_versionada_cubre_los_23_municipios():
    datos = json.loads((RAIZ / "data" / "config" / "territorio_hidrografico.json").read_text(encoding="utf-8"))
    territorio = json.loads((RAIZ / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    assert {m["divipola"] for m in datos["municipios"]} == {m["divipola"] for m in territorio["municipios"]}
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
