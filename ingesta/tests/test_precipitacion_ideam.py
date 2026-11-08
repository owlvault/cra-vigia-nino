"""
Pruebas de A-3 y A-4 con mediciones del IDEAM (RF-TER-04, RF-IND-02, spec de indicadores)
Proyecto: Vigía El Niño · Acueductos (CRA)
Sin red: las respuestas del IDEAM se simulan.
"""

import json
import shutil
from datetime import date, timedelta
from pathlib import Path

import pytest

from ingesta.clima import precipitacion_municipal as pm
from ingesta.territorio.estaciones_ideam import asignar, punto_en_geometria

RAIZ = Path(__file__).resolve().parents[2]
HOY = date(2026, 11, 7)


def _dias(n):
    return [HOY - timedelta(days=k) for k in range(n)]


# --- RF-TER-04 -------------------------------------------------------------------

def test_promedio_de_estaciones_dentro_del_municipio():
    valor, metodo = pm.valor_municipal([10.0, 20.0], [(5.0, 100.0)], 3, 2)
    assert (valor, metodo) == (15.0, "estaciones_municipio")


def test_idw_con_tres_estaciones_cercanas():
    valor, metodo = pm.valor_municipal([], [(10.0, 10.0), (20.0, 20.0), (40.0, 40.0), (45.0, 99.0)], 3, 2)
    pesos = [1 / 100, 1 / 400, 1 / 1600]
    esperado = (10 * pesos[0] + 20 * pesos[1] + 40 * pesos[2]) / sum(pesos)
    assert metodo == "idw" and valor == pytest.approx(esperado)


def test_municipio_sin_estacion_y_solo_dos_cercanas_es_sin_dato():
    """Escenario RF-TER-04: '94001' sin estaciones y solo 2 válidas a menos de 50 km."""
    assert pm.valor_municipal([], [(10.0, 5.0), (30.0, 7.0)], 3, 2) == (None, "sin_dato")


def test_dia_con_registros_incompletos_o_duplicados_se_descarta():
    diarios = {"A": {HOY: (50.0, 60)},      # incompleto: subestima
               "B": {HOY: (80.0, 900)},     # duplicados: sobrestima
               "C": {HOY: (4.0, 144)}}
    serie = pm.serie_municipal(diarios, ["A", "B", "C"], {}, [HOY], 115, 3, 2, max_registros=144)
    assert serie[HOY] == 4.0


# --- A-4 -------------------------------------------------------------------------

def test_dias_secos_se_detienen_en_dia_con_lluvia():
    serie = {HOY: 0.0, HOY - timedelta(1): 0.5, HOY - timedelta(2): 0.9, HOY - timedelta(3): 3.0}
    assert pm.dias_consecutivos_secos(serie, HOY, 1.0) == (3, False)


def test_dia_con_lluvia_hoy_es_cero():
    assert pm.dias_consecutivos_secos({HOY: 19.0}, HOY, 1.0) == (0, False)


def test_dia_sin_dato_vuelve_el_conteo_cota_inferior():
    serie = {HOY: 0.0, HOY - timedelta(1): 0.0, HOY - timedelta(2): None, HOY - timedelta(3): 0.0}
    assert pm.dias_consecutivos_secos(serie, HOY, 1.0) == (2, True)


def test_ultimo_dia_con_dato_tolera_pocos_dias_de_atraso():
    serie = {HOY: None, HOY - timedelta(1): None, HOY - timedelta(2): 3.0}
    assert pm.ultimo_dia_con_dato(serie, HOY, 3) == HOY - timedelta(2)
    assert pm.ultimo_dia_con_dato({HOY: None}, HOY, 0) is None


# --- A-3 / RF-IND-02 ----------------------------------------------------------------

def test_deficit_del_50_por_ciento():
    """Escenario RF-IND-02: línea base 80 mm, lluvia observada 40 mm => −50 %."""
    serie = {d: 40.0 / 30 for d in _dias(30)}
    anomalia, observada, validos = pm.anomalia_30d(serie, HOY, 30, 27, 80.0)
    assert (anomalia, observada, validos) == (-50.0, 40.0, 30)


def test_pocos_dias_validos_es_sin_dato():
    serie = {d: (1.0 if i < 13 else None) for i, d in enumerate(_dias(30))}
    anomalia, _, validos = pm.anomalia_30d(serie, HOY, 30, 27, 80.0)
    assert anomalia is None and validos == 13


def test_sin_linea_base_es_sin_dato():
    serie = {d: 1.0 for d in _dias(30)}
    assert pm.anomalia_30d(serie, HOY, 30, 27, None)[0] is None


def test_normal_prorrateada_cruza_dos_meses():
    """Ventana 9-oct a 7-nov: 23 días de octubre y 7 de noviembre."""
    normal = {m: 0.0 for m in pm.MESES_NORMAL}
    normal.update(oct=310.0, nov=300.0)
    assert pm.normal_ventana(normal, HOY, 30) == pytest.approx(23 * 10 + 7 * 10)


def test_normal_con_mes_faltante_es_sin_dato():
    assert pm.normal_ventana({"oct": 310.0}, HOY, 30) is None


# --- Asignación geométrica de estaciones ---------------------------------------------

CUADRADO = {"type": "Polygon", "coordinates": [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
                                               [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]]}


def test_punto_en_poligono_respeta_huecos():
    assert punto_en_geometria(2, 2, CUADRADO)
    assert not punto_en_geometria(5, 5, CUADRADO)      # dentro del hueco
    assert not punto_en_geometria(11, 5, CUADRADO)


def test_asignar_separa_dentro_y_cercanas():
    municipios = [{"divipola": "99999", "lat": 5.0, "lon": 5.0}]
    estaciones = [{"codigo": "A", "lat": 2.0, "lon": 2.0},     # dentro
                  {"codigo": "B", "lat": 5.0, "lon": 10.3},    # fuera, a ~585 km
                  {"codigo": "C", "lat": 5.0, "lon": 5.0}]     # en el hueco: fuera
    res = asignar(municipios, {"99999": CUADRADO}, estaciones, radio_km=50)["99999"]
    assert res["dentro"] == ["A"]
    assert res["cercanas_km"] == {"C": 0.0}


# --- Conector con red simulada ---------------------------------------------------------

@pytest.fixture
def conector(tmp_path, monkeypatch):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    from ingesta.conectores.conector_ideam import ConectorIDEAM
    c = ConectorIDEAM(base_dir=str(tmp_path))
    c.estaciones = {"municipios": {m["divipola"]: {"automaticas": {"dentro": [], "cercanas_km": {}},
                                                   "normales": {"dentro": [], "cercanas_km": {}}}
                                   for m in c.territorio}}
    c.estaciones["municipios"]["44847"] = {"automaticas": {"dentro": ["E1"], "cercanas_km": {}},
                                           "normales": {"dentro": ["N1"], "cercanas_km": {}}}
    monkeypatch.setattr("ingesta.conectores.conector_ideam.time.sleep", lambda s: None)
    return c


def test_conector_calcula_con_mediciones_y_no_inventa(conector, monkeypatch):
    hasta = date.today() - timedelta(days=1)
    filas = [["E1", (hasta - timedelta(days=k)).isoformat(), (0.0 if k < 5 else 2.0), 144] for k in range(75)]
    monkeypatch.setattr(conector, "consultar_diarios", lambda codigos, desde, h: filas)
    monkeypatch.setattr(conector, "consultar_normales",
                        lambda codigos: {"N1": {m: 60.0 for m in pm.MESES_NORMAL}})
    monkeypatch.setattr(conector, "consultar_ena",
                        lambda lat, lon, clave: "Crítico" if "h3" in clave else "Alto")
    res = conector.ejecutar_captura()
    uribia = res.datos_extraidos["44847"]
    assert uribia["indicador_a4_dias_sin_lluvia"] == 5
    assert uribia["indicador_a3_anomalia_precip_pct"] is not None
    assert uribia["indicador_h1_caudal_pct"] is None          # RF-TER-05 / Q-TER-03
    assert uribia["indicador_h3_iua_ena"] == "Crítico"
    otro = res.datos_extraidos["44001"]                        # sin estaciones en la simulación
    assert otro["indicador_a4_dias_sin_lluvia"] is None
    assert otro["indicador_a3_anomalia_precip_pct"] is None
    bronce = json.loads(Path(res.ruta_archivo_bronce).read_text(encoding="utf-8"))
    assert bronce["municipios"]["44847"]["dias_sin_lluvia"] == 5      # campo que reconcilia el auditor
    assert len(bronce["crudo"]["diarios"]) == 75


def test_categoria_critico_tiene_puntaje(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    from ingesta.pipeline_corte import PipelineCorte
    p = PipelineCorte(base_dir=str(tmp_path))
    assert p.puntaje_categorico("Crítico") == 100.0
    assert p.puntaje_categorico("Muy Alto") == 90.0
