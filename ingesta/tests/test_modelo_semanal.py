"""Pruebas del modelo semanal (specs/comparativo-semanal.md)."""

from datetime import date

from ingesta.semanal.modelo_semanal import (
    calcular_tendencia,
    clasificar_nivel,
    comparar,
    desplazar_semana,
    detectar_inicio_evento,
    parsear_noaa_semanal,
    parsear_oni,
    rango_semanas,
    semana_iso,
)

NOAA = """
 Weekly SST data starts week centered on 2Sept1981
                Nino1+2      Nino3        Nino34        Nino4
 Week          SST SSTA     SST SSTA     SST SSTA     SST SSTA
 02SEP1981     20.6-0.1     24.8-0.1     26.5-0.2     28.3-0.3
 23SEP2026     25.4 4.7     28.8 3.9     29.7 3.1     29.8 1.1
 30SEP2026     26.1 5.3     29.0 4.0     29.9 3.2     29.9 1.2
"""

ONI = """
 SEAS  YR   TOTAL   ANOM
  JJA 2026  29.09   1.80
  JAS 2026  29.12   2.16
"""


def test_parser_noaa_negativos_pegados():
    filas = parsear_noaa_semanal(NOAA)
    assert len(filas) == 3
    assert filas[0]["nino12"] == -0.1 and filas[0]["nino34"] == -0.2
    assert filas[-1]["nino34"] == 3.2 and filas[-1]["semana_iso"] == "2026-W40"


def test_parser_oni_disponibilidad():
    filas = parsear_oni(ONI)
    assert filas[-1]["oni"] == 2.16
    assert filas[-1]["fecha_disponible"] == date(2026, 10, 1)


def test_semanas_iso_cambio_de_anio():
    assert semana_iso(date(2026, 1, 1)) == "2026-W01"
    assert desplazar_semana("2026-W01", -1) == "2025-W52"
    assert rango_semanas("2025-W52", "2026-W02") == ["2025-W52", "2026-W01", "2026-W02"]


def test_tendencia_segun_direccion_y_tolerancia():
    assert calcular_tendencia(3.2, 3.1, "sube_empeora", 0.05) == "empeora"
    assert calcular_tendencia(45.0, 49.0, "baja_empeora", 0.3) == "empeora"
    assert calcular_tendencia(49.1, 49.0, "baja_empeora", 0.3) == "estable"
    assert calcular_tendencia(None, 49.0, "baja_empeora", 0.3) == "sin_dato"


def test_sin_dato_nunca_es_cero():
    r = comparar(None, 3.0, {"direccion": "sube_empeora", "tolerancia_estable": 0.05})
    assert r["delta_abs"] is None and r["tendencia"] == "sin_dato"


def test_clasificar_nivel():
    niveles = [{"desde": None, "hasta": 0.5, "etiqueta": "Neutro", "riesgo": "sin"},
               {"desde": 2.0, "hasta": None, "etiqueta": "Muy fuerte", "riesgo": "roja"}]
    assert clasificar_nivel(2.16, niveles) == ("Muy fuerte", "roja")
    assert clasificar_nivel(None, niveles) == (None, None)


def test_detectar_inicio_evento_vigente_e_historico():
    serie = [("W1", 0.2), ("W2", 0.6), ("W3", 0.7), ("W4", 0.1), ("W5", 0.5), ("W6", 0.8), ("W7", 1.0), ("W8", 1.2)]
    assert detectar_inicio_evento(serie, 0.5, 4, vigente=True) == "W5"
    assert detectar_inicio_evento(serie, 0.5, 2, vigente=False) == "W2"
    assert detectar_inicio_evento(serie[:4], 0.5, 4, vigente=True) is None
