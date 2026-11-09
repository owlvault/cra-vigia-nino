"""
Pruebas Automatizadas de Normalización y Cálculo del ICR
Proyecto: Vigía El Niño · Acueductos (CRA)
Verifica los escenarios de prueba exactos de specs/indice-riesgo.md
"""

import pytest
from ingesta.pipeline_corte import PipelineCorte

@pytest.fixture
def pipeline():
    return PipelineCorte()

def test_escenario_continuidad_entre_umbrales(pipeline):
    """
    Escenario: Continuidad entre umbrales (RF-ICR-01)
    Dado S-1 = 15 h/día con quiebres 24->0, 22->40, 18->60, 12->75, 4->100
    Cuando se normaliza
    Entonces el puntaje es 67.5
    """
    puntaje = pipeline.normalizar_tramos("S-1", 15.0)
    assert puntaje == 67.5

def test_escenario_calamidad_declarada_con_pec_al_dia(pipeline):
    """
    Escenario: Calamidad declarada con PEC al día (RF-ICR-03)
    Dado R-1 = PEC reportado (0), R-2 = sin_dato, R-3 = sin reporte (0), R-4 = calamidad vigente (100)
    Cuando se calcula el subíndice R
    Entonces el subíndice R es 100 (máximo, no promedio)
    """
    res = pipeline.calcular_icr_municipio(
        divipola="77777",
        nombre="MunicipioCalamidad",
        depto="La Guajira",
        cod_depto="44",
        poblacion=20000,
        indicadores={
            "A-3": {"valor": -50.0, "puntaje": 65.0},
            "H-2": {"valor": "Alto", "puntaje": 75.0},
            "S-1": {"valor": 12.0, "puntaje": 75.0},
            "R-1": {"valor": 1, "puntaje": pipeline.puntaje_binario("R-1", 1)},
            "R-2": {"valor": None, "puntaje": pipeline.puntaje_binario("R-2", None)},
            "R-3": {"valor": 0, "puntaje": pipeline.puntaje_binario("R-3", 0)},
            "R-4": {"valor": 1, "puntaje": pipeline.puntaje_binario("R-4", 1)},
        }
    )
    assert res["subindices_capa"]["respuesta_R"] == 100.0

def test_escenario_capa_h_sin_datos_redistribucion(pipeline):
    """
    Escenario: Capa H sin datos (RF-ICR-04)
    Dado subíndices A = 70, H = sin_dato, S = 50, R = 0
    Cuando se calcula el ICR
    Entonces los pesos efectivos son A 42.86 %, S 35.71 %, R 21.43 %
    Y el ICR es 47.86 (aprox 47.9)
    Y la cobertura de datos registrada es 70 %
    """
    res = pipeline.calcular_icr_municipio(
        divipola="66666",
        nombre="MunicipioSinCapaH",
        depto="Bolívar",
        cod_depto="13",
        poblacion=30000,
        indicadores={
            "A-3": {"valor": -55.0, "puntaje": 70.0},
            "S-1": {"valor": 20.0, "puntaje": 50.0},
            "R-1": {"valor": 1, "puntaje": 0.0}
        }
    )
    assert res["subindices_capa"]["vulnerabilidad_H"] is None
    assert res["cobertura_datos_pct"] == 70.0
    assert res["icr"] == 47.9

def test_escenario_piso_por_impacto_confirmado(pipeline):
    """
    Escenario: Racionamiento con ICR bajo (RF-ICR-06)
    Dado un municipio con ICR calculado 38 y R-3 activo
    Cuando se asigna el nivel
    Entonces el nivel es 'naranja'
    Y nivel_por_regla es verdadero
    """
    res = pipeline.calcular_icr_municipio(
        divipola="99999",
        nombre="MunicipioPrueba",
        depto="Cundinamarca",
        cod_depto="25",
        poblacion=50000,
        indicadores={
            "A-3": {"valor": -10.0, "puntaje": 20.0},
            "H-2": {"valor": "Bajo", "puntaje": 15.0},
            "S-1": {"valor": 23.0, "puntaje": 20.0},
            "R-3": {"valor": 1, "puntaje": 80.0} # Racionamiento activo
        }
    )
    # Su ICR matemático daría < 60 (amarilla o sin alerta), pero por R-3 debe subir a naranja
    assert res["nivel_alerta"] == "naranja"
    assert res["nivel_por_regla"] is True

def test_escenario_datos_insuficientes(pipeline):
    """
    Escenario: Datos insuficientes (< 60% peso) (RF-ICR-04)
    Dado solo la capa S disponible (25 % del peso)
    Cuando se calcula el ICR
    Entonces el ICR es sin_dato y el nivel es 'sin_dato'
    """
    res = pipeline.calcular_icr_municipio(
        divipola="88888",
        nombre="MunicipioSinDatos",
        depto="Chocó",
        cod_depto="27",
        poblacion=10000,
        indicadores={
            "S-1": {"valor": 20.0, "puntaje": 50.0} # Solo 1 indicador de S (25% peso total)
        }
    )
    assert res["icr"] is None
    assert res["nivel_alerta"] == "sin_dato"
