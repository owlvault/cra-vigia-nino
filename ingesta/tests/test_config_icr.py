"""
Pruebas de la configuración versionada del ICR (regla de oro 3, RF-ICR-04/05/07, RN-ICR-01)
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import json
import re
import shutil
from pathlib import Path

import pytest

from ingesta.pipeline_corte import ConfiguracionInvalida, PipelineCorte

RAIZ = Path(__file__).resolve().parents[2]


@pytest.fixture
def base_aislada(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return tmp_path


@pytest.fixture
def pipeline(base_aislada):
    return PipelineCorte(base_dir=str(base_aislada))


def _editar_config(base, cambio):
    ruta = base / "data" / "config" / "parametros_icr.json"
    conf = json.loads(ruta.read_text(encoding="utf-8"))
    cambio(conf)
    ruta.write_text(json.dumps(conf), encoding="utf-8")


def _ind(puntaje):
    return {"valor": 1.0, "puntaje": puntaje}


def test_capa_h_sin_datos_redistribuye(pipeline):
    """Escenario RF-ICR-04: A = 70, H = sin_dato, S = 50, R = 0 => ICR 47,86 y cobertura 70 %."""
    res = pipeline.calcular_icr_municipio(
        divipola="99999", nombre="Prueba", depto="Prueba", cod_depto="99", poblacion=1,
        indicadores={"A-3": _ind(70.0), "S-1": _ind(50.0), "R-1": {"valor": 1, "puntaje": 0.0}},
    )
    assert res["icr"] == 47.9  # se muestra a 1 decimal (RN-ICR-02)
    assert res["cobertura_datos_pct"] == 70.0
    assert res["nivel_alerta"] == "amarilla"


@pytest.mark.parametrize("subindice, nivel", [(39.9, "sin_alerta"), (40.0, "amarilla"), (60.0, "naranja"), (75.0, "roja")])
def test_niveles_de_alerta_desde_config(pipeline, subindice, nivel):
    """RF-ICR-05 con umbrales leídos de config."""
    inds = {"A-3": _ind(subindice), "H-4": _ind(subindice), "S-1": _ind(subindice), "R-1": {"valor": 1, "puntaje": subindice}}
    res = pipeline.calcular_icr_municipio("99999", "P", "P", "99", 1, inds)
    assert res["nivel_alerta"] == nivel


def test_h4_usa_quiebres_de_la_spec(pipeline):
    """specs/indicadores.md: H-4 36 h -> 0, 24 h -> 40, 12 h -> 60, 6 h -> 75, 0 h -> 100."""
    assert pipeline.normalizar_tramos("H-4", 36.0) == 0.0
    assert pipeline.normalizar_tramos("H-4", 24.0) == 40.0
    assert pipeline.normalizar_tramos("H-4", 18.0) == 50.0
    assert pipeline.normalizar_tramos("H-4", 0.0) == 100.0


def test_version_de_config_se_registra(pipeline):
    """RF-ICR-07: cada resultado registra la config_version usada."""
    res = pipeline.calcular_icr_municipio("99999", "P", "P", "99", 1, {"A-3": _ind(10.0)})
    assert res["config_version"] == pipeline.parametros_icr["version"]


def test_pesos_que_no_suman_100_se_rechazan(base_aislada):
    """RN-ICR-01."""
    _editar_config(base_aislada, lambda c: c["capas"]["A"].update(peso=0.50))
    with pytest.raises(ConfiguracionInvalida):
        PipelineCorte(base_dir=str(base_aislada))


def test_umbrales_no_monotonos_se_rechazan(base_aislada):
    """Caso borde de specs/indice-riesgo.md."""
    _editar_config(base_aislada, lambda c: c["quiebres"].update({"S-1": [[24, 0], [12, 40], [18, 60], [6, 75], [4, 100]]}))
    with pytest.raises(ConfiguracionInvalida):
        PipelineCorte(base_dir=str(base_aislada))


def test_cambiar_un_peso_no_requiere_tocar_codigo(base_aislada):
    """Regla de oro 3: recalibrar por configuración."""
    def cambio(c):
        c["capas"]["A"]["peso"] = 0.40
        c["capas"]["H"]["peso"] = 0.20
    _editar_config(base_aislada, cambio)
    p = PipelineCorte(base_dir=str(base_aislada))
    assert p.PESOS_CAPA["A"] == 0.40


def test_territorio_viene_de_config(pipeline):
    municipios = pipeline.territorio["municipios"]
    assert len(municipios) == 1122                       # Fase 0: DIVIPOLA nacional completa
    assert len({m["divipola"] for m in municipios}) == 1122
    assert sum(1 for m in municipios if m.get("piloto")) == 23
    assert all(re.fullmatch(r"\d{5}", m["divipola"]) for m in municipios)
    assert all(m["divipola"][:2] == m["cod_depto"] for m in municipios)


def test_codigo_sin_matriz_de_municipios_ni_pesos():
    """Regla de oro 3 / CA-01: el pipeline no embebe territorio ni pesos."""
    fuente = (RAIZ / "ingesta" / "pipeline_corte.py").read_text(encoding="utf-8")
    assert '"poblacion": 196000' not in fuente
    assert not re.search(r'"A":\s*0\.30', fuente)
