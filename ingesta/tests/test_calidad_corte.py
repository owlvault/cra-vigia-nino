"""
Pruebas de frescura (RF-CAL-03) y compuerta de publicación (RF-CAL-04)
Proyecto: Vigía El Niño · Acueductos (CRA)
Escenarios tomados de context-lake/specs/calidad-datos.md
"""

import json
import shutil
from pathlib import Path

import pytest

from ingesta.pipeline_corte import PipelineCorte

RAIZ = Path(__file__).resolve().parents[2]


@pytest.fixture
def base_aislada(tmp_path):
    """Copia solo la configuración a un directorio temporal: el pipeline no toca el repo."""
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return tmp_path


@pytest.fixture
def pipeline(base_aislada):
    return PipelineCorte(base_dir=str(base_aislada))


def _municipio(icr, frescura_a1="vigente"):
    return {"icr": icr, "indicadores": {"A-1": {"valor": 1.2, "frescura": frescura_a1}}}


def test_irca_mensual_desactualizado(pipeline):
    """Escenario: IRCA mensual desactualizado (2026-06-30 frente a corte 2026-10-08)."""
    assert pipeline.evaluar_frescura("S-2", "2026-06-30", "2026-10-08", 12.0) == "desactualizado"


def test_frescura_vigente_dentro_del_margen(pipeline):
    assert pipeline.evaluar_frescura("S-2", "2026-09-15", "2026-10-08", 12.0) == "vigente"


def test_frescura_formato_semanal_noaa(pipeline):
    assert pipeline.evaluar_frescura("A-1", "28OCT2026", "2026-11-06", 3.4) == "vigente"


def test_frescura_indicador_estatico_siempre_vigente(pipeline):
    assert pipeline.evaluar_frescura("H-2", "2022-12-31", "2026-11-06", "Alto") == "vigente"


def test_frescura_sin_valor_no_se_evalua(pipeline):
    assert pipeline.evaluar_frescura("A-5", "2026-11-06", "2026-11-06", None) is None


def test_corte_valido(pipeline):
    """Escenario: Corte válido (ICR para el 96 % de municipios y A-1 vigente)."""
    municipios = [_municipio(50.0) for _ in range(24)] + [_municipio(None)]
    estado, motivos = pipeline.evaluar_compuerta(municipios)
    assert estado == "PUBLICADO_VALIDO"
    assert motivos == []


def test_cobertura_insuficiente(pipeline):
    """Escenario: Cobertura insuficiente (ICR para el 71 % de municipios)."""
    municipios = [_municipio(50.0) for _ in range(71)] + [_municipio(None) for _ in range(29)]
    estado, motivos = pipeline.evaluar_compuerta(municipios)
    assert estado == "RECHAZADO"
    assert "cobertura 71 % < 90 %" in motivos


def test_amenaza_sin_valor_vigente_rechaza(pipeline):
    municipios = [_municipio(50.0, frescura_a1="desactualizado") for _ in range(10)]
    estado, motivos = pipeline.evaluar_compuerta(municipios)
    assert estado == "RECHAZADO"
    assert "A-1 sin valor vigente" in motivos


def test_corte_rechazado_no_reemplaza_al_publicado(pipeline, base_aislada):
    """El tablero sigue mostrando el último corte publicado cuando la compuerta rechaza."""
    oro = base_aislada / "data" / "oro"
    vigente = oro / "corte_vigente.json"
    vigente.write_text(json.dumps({"metadata_corte": {"fecha_corte": "anterior"}}), encoding="utf-8")

    # Sin datos de amenaza A-1 no puede quedar vigente: el corte debe rechazarse.
    corte = pipeline.generar_corte_completo(
        amenaza_global={}, datos_ideam={}, datos_sivicap={}, datos_ungrd_mvct={},
        datos_xm={}, datos_firms={}, datos_sui={},
    )

    assert corte["metadata_corte"]["estado_calidad"] == "RECHAZADO"
    assert json.loads(vigente.read_text(encoding="utf-8"))["metadata_corte"]["fecha_corte"] == "anterior"
    fecha = corte["metadata_corte"]["fecha_corte"]
    assert (oro / "rechazados" / f"corte_{fecha}.json").exists()
    assert not (oro / f"corte_{fecha}.json").exists()
    assert not (base_aislada / "tablero" / "js" / "data.js").exists()
