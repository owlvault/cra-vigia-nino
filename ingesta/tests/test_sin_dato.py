"""
Pruebas de la regla de oro 5 (sin_dato nunca es 0) y de la normalización RF-ICR-01/02/03
Proyecto: Vigía El Niño · Acueductos (CRA)
Escenarios de context-lake/specs/indice-riesgo.md y specs/indicadores.md (RF-IND-04)
"""

import json
import shutil
from pathlib import Path

import pytest

from ingesta.pipeline_corte import PipelineCorte
from ingesta.conectores.conector_sui import ConectorSUI

RAIZ = Path(__file__).resolve().parents[2]


@pytest.fixture
def base_aislada(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return tmp_path


@pytest.fixture
def pipeline(base_aislada):
    return PipelineCorte(base_dir=str(base_aislada))


# --- RF-ICR-01: normalización lineal por tramos -------------------------------

def test_continuidad_entre_umbrales(pipeline):
    """Escenario: S-1 = 15 h/día => 67,5."""
    assert pipeline.normalizar_tramos("S-1", 15.0) == 67.5


def test_valor_mejor_que_el_optimo(pipeline):
    """Escenario: H-1 = 130 % => 0."""
    assert pipeline.normalizar_tramos("H-1", 130.0) == 0.0


def test_valor_peor_que_el_extremo(pipeline):
    """Escenario: A-4 = 75 días => 100."""
    assert pipeline.normalizar_tramos("A-4", 75.0) == 100.0


def test_anomalia_negativa_interpola(pipeline):
    assert pipeline.normalizar_tramos("A-3", -88.5) == 98.75


def test_sin_valor_sin_puntaje(pipeline):
    assert pipeline.normalizar_tramos("S-1", None) is None


# --- RF-ICR-02: categóricos ---------------------------------------------------

def test_categoria_reconocida_sin_importar_mayusculas(pipeline):
    assert pipeline.puntaje_categorico("Muy Alto") == 90.0
    assert pipeline.puntaje_categorico("moderado") == 40.0


def test_categoria_ausente_o_desconocida_es_sin_dato(pipeline):
    assert pipeline.puntaje_categorico(None) is None
    assert pipeline.puntaje_categorico("No reportado") is None


# --- RF-ICR-03 / RF-IND-04: binarios ------------------------------------------

def test_binarios_segun_spec(pipeline):
    assert pipeline.puntaje_binario("R-1", 1) == 0.0
    assert pipeline.puntaje_binario("R-1", 0) == 100.0
    assert pipeline.puntaje_binario("R-2", 1) == 60.0
    assert pipeline.puntaje_binario("R-3", 1) == 80.0
    assert pipeline.puntaje_binario("R-4", 1) == 100.0
    assert pipeline.puntaje_binario("R-4", 0) == 0.0


def test_binario_sin_informacion_no_se_asume_cero(pipeline):
    """RF-IND-04: sin información de la fuente => sin_dato, NO 0."""
    assert pipeline._binario(None) is None
    assert pipeline._binario("") is None
    assert pipeline.puntaje_binario("R-4", None) is None


# --- Corte completo: ningún valor ausente se rellena --------------------------

def test_corte_sin_fuentes_no_inventa_valores(pipeline):
    corte = pipeline.generar_corte_completo(
        amenaza_global={}, datos_ideam={}, datos_sivicap={}, datos_ungrd_mvct={},
        datos_xm={}, datos_firms={}, datos_sui={},
    )
    for m in corte["municipios"]:
        for cod, ind in m["indicadores"].items():
            assert ind["valor"] is None, f"{m['divipola']} {cod} inventó {ind['valor']}"
            assert ind["puntaje"] is None, f"{m['divipola']} {cod} inventó puntaje {ind['puntaje']}"
        assert m["icr"] is None
        assert m["nivel_alerta"] == "sin_dato"


def test_r_sin_registro_queda_sin_dato_y_verificado_queda_cero(pipeline):
    ungrd = {
        "11001": {"indicador_r2_carrotanques": None, "indicador_r3_racionamiento": None,
                  "indicador_r4_calamidad": 0, "fecha_dato": "2026-10-14"},
    }
    corte = pipeline.generar_corte_completo(
        amenaza_global={}, datos_ideam={}, datos_sivicap={}, datos_ungrd_mvct=ungrd,
        datos_xm={}, datos_firms={}, datos_sui={},
    )
    bogota = next(m for m in corte["municipios"] if m["divipola"] == "11001")
    assert bogota["indicadores"]["R-4"]["valor"] == 0
    assert bogota["indicadores"]["R-4"]["puntaje"] == 0.0
    assert bogota["indicadores"]["R-3"]["valor"] is None
    assert bogota["indicadores"]["R-3"]["puntaje"] is None


# --- Conectores ---------------------------------------------------------------

def test_sui_fecha_dato_es_fin_del_periodo_reportado():
    assert ConectorSUI._fin_de_periodo("2026-08") == "2026-08-31"
    assert ConectorSUI._fin_de_periodo("2024-02") == "2024-02-29"
    assert ConectorSUI._fin_de_periodo(None) is None


def test_ungrd_municipio_sin_registro_queda_sin_dato(base_aislada):
    from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda

    con = ConectorUNGRDMinVivienda(base_dir=str(base_aislada))
    con._consultar_emergencias_socrata = lambda: None  # sin red en pruebas
    res = con.ejecutar_captura()
    capa_r = res.datos_extraidos["capa_r_por_divipola"]

    actos = json.loads((base_aislada / "data" / "config" / "actos_administrativos_verificados.json").read_text(encoding="utf-8"))
    sin_evento_r4 = set(actos["municipios_verificados_sin_evento"]["R-4"])
    con_evento = set(actos["municipios_con_calamidad_verificada"])

    for div, r in capa_r.items():
        if div in con_evento:
            assert r["indicador_r4_calamidad"] == 1
        elif div in sin_evento_r4:
            assert r["indicador_r4_calamidad"] == 0
            assert r["indicador_r3_racionamiento"] is None
        else:
            assert r["indicador_r2_carrotanques"] is None
            assert r["indicador_r3_racionamiento"] is None
            assert r["indicador_r4_calamidad"] is None
    assert res.datos_extraidos["capa_r_por_divipola"]["44847"]["fecha_dato"] == actos["version"]
