"""
Pruebas de la población proyectada DANE (RF-TER-06, ADR-0006 C-CIU-04)
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import json
import shutil
from pathlib import Path

import pytest

from ingesta.pipeline_corte import PipelineCorte
from ingesta.territorio.poblacion_dane import ENCABEZADO, leer_totales

RAIZ = Path(__file__).resolve().parents[2]

FILAS = [
    ("PROYECCIONES DE POBLACIÓN",) + (None,) * 6,
    ENCABEZADO,
    ("05", "Antioquia", "05001", "Medellín", 2026, "Cabecera Municipal", 2478217),
    ("05", "Antioquia", "05001", "Medellín", 2026, "Centros Poblados y Rural Disperso", 48578),
    ("05", "Antioquia", "05001", "Medellín", 2026, "Total", 2526795),
    ("05", "Antioquia", "05001", "Medellín", 2027, "Total", 2531000),
    ("05", "Antioquia", "05002", "Abejorral", 2026, "Total", 20000),
]


def test_solo_toma_el_total_de_los_municipios_buscados():
    res = leer_totales(FILAS, ["05001"])
    assert res == {"05001": {"2026": 2526795, "2027": 2531000}}


def test_formato_inesperado_falla_en_lugar_de_leer_mal():
    with pytest.raises(ValueError):
        leer_totales([("otra", "cosa")], ["05001"])


def test_config_cubre_los_23_municipios_con_fuente():
    datos = json.loads((RAIZ / "data" / "config" / "poblacion_dane.json").read_text(encoding="utf-8"))
    territorio = json.loads((RAIZ / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    assert datos["fuente"]["entidad"] == "DANE"
    assert len(datos["fuente"]["sha256"]) == 64
    for m in territorio["municipios"]:
        serie = datos["poblacion_por_anio"][m["divipola"]]
        assert {"2026", "2027"} <= set(serie)


@pytest.fixture
def pipeline(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return PipelineCorte(base_dir=str(tmp_path))


def test_usa_la_proyeccion_del_anio_del_corte(pipeline):
    medellin = next(m for m in pipeline.territorio["municipios"] if m["divipola"] == "05001")
    esperado = pipeline.poblacion_dane["poblacion_por_anio"]["05001"]
    p26, f26 = pipeline.poblacion_municipio(medellin, "2026")
    p27, _ = pipeline.poblacion_municipio(medellin, "2027")
    assert p26 == esperado["2026"] and p27 == esperado["2027"]
    assert f26.startswith("DANE")


def test_sin_proyeccion_usa_respaldo_y_lo_declara(pipeline):
    medellin = next(m for m in pipeline.territorio["municipios"] if m["divipola"] == "05001")
    pob, fuente = pipeline.poblacion_municipio(medellin, "2099")
    assert pob == medellin["poblacion"]
    assert fuente.startswith("prototipo")


def test_corte_registra_la_fuente_de_poblacion(pipeline):
    corte = pipeline.generar_corte_completo(amenaza_global={}, datos_ideam={}, datos_sivicap={},
                                            datos_ungrd_mvct={}, datos_xm={}, datos_firms={}, datos_sui={})
    anio = corte["metadata_corte"]["fecha_corte"][:4]
    for m in corte["municipios"]:
        assert m["poblacion"] == pipeline.poblacion_dane["poblacion_por_anio"][m["divipola"]][anio]
        assert m["fuente_poblacion"].startswith("DANE")
