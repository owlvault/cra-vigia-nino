"""
Pruebas de la Fase 0 (cobertura nacional, 1.122 municipios)
Proyecto: Vigía El Niño · Acueductos (CRA)
Sin red: rásteres, CSV y capas sintéticas.
"""

import json
import shutil
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pytest
from rasterio.transform import from_origin

from ingesta.clima import chirps
from ingesta.clima import precipitacion_municipal as pm
from ingesta.clima.validacion_chirps import tramo
from ingesta.conectores.conector_chirps import indicadores_municipio
from ingesta.conectores import conector_nasa_firms as firms
from ingesta.pipeline_corte import PipelineCorte
from ingesta.territorio.geometrias_ideam import IndiceEspacial
from ingesta.territorio.territorio_nacional import _titulo, construir_municipios

RAIZ = Path(__file__).resolve().parents[2]

# Rejilla 4x4 de 0,05° con origen en (-76.0, 6.2): píxel (f, c) centrado en (-75.975 + 0.05c, 6.175 - 0.05f)
TRANSFORM = from_origin(-76.0, 6.2, 0.05, 0.05)
CUADRO_GRANDE = {"type": "Polygon", "coordinates": [[[-76.0, 6.1], [-75.9, 6.1], [-75.9, 6.2], [-76.0, 6.2], [-76.0, 6.1]]]}
CUADRO_MINI = {"type": "Polygon", "coordinates": [[[-75.86, 6.06], [-75.84, 6.06], [-75.84, 6.04], [-75.86, 6.04], [-75.86, 6.06]]]}


# --- CHIRPS: agregación municipal ------------------------------------------------------

def test_rejilla_usa_centros_luego_toques_luego_cabecera():
    municipios = [{"divipola": "A", "lat": 6.15, "lon": -75.95},
                  {"divipola": "B", "lat": 6.05, "lon": -75.85},
                  {"divipola": "C", "lat": 6.03, "lon": -75.83},       # sin polígono
                  {"divipola": "D", "lat": 1.0, "lon": -70.0}]          # sin polígono y fuera de la ventana
    rej = chirps.construir_rejilla(TRANSFORM, (4, 4), municipios, {"A": CUADRO_GRANDE, "B": CUADRO_MINI})
    assert rej["A"][2] == chirps.METODO_CENTRO and rej["A"][0].size == 4
    assert rej["B"][2] == chirps.METODO_TOCA and rej["B"][0].size >= 1     # menor que un píxel
    assert rej["C"][2] == chirps.METODO_CABECERA and rej["C"][0].size == 1
    assert rej["D"][0].size == 0


def test_promedio_municipal_ignora_sin_dato_y_no_inventa():
    arr = np.array([[1, 3, np.nan, 0], [5, np.nan, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], dtype="float32")
    rej = {"A": (np.array([0, 0, 1, 1]), np.array([0, 1, 0, 1]), chirps.METODO_CENTRO),
           "S": (np.array([0]), np.array([2]), chirps.METODO_CENTRO),
           "V": (np.empty(0, dtype=int), np.empty(0, dtype=int), chirps.METODO_CENTRO)}
    res = chirps.promedios_municipales(arr, rej)
    assert res["A"] == pytest.approx(3.0)          # (1 + 3 + 5) / 3: el NaN no cuenta como 0
    assert res["S"] is None and res["V"] is None


def test_indicadores_chirps_usan_ultimo_dia_y_normal_propia():
    hasta = date(2026, 11, 8)
    fin = date(2026, 10, 31)                        # rezago típico del preliminar
    serie = {fin - timedelta(days=k): (0.0 if k < 6 else 4.0) for k in range(60)}
    p = {"dias_maximos_atraso": 14, "umbral_dia_seco_mm": 1.0, "dias_ventana_anomalia": 30,
         "dias_validos_minimos_ventana": 27}
    normal = {m: 150.0 for m in pm.MESES_NORMAL}
    r = indicadores_municipio(serie, normal, hasta, p)
    assert r["fecha_dato"] == "2026-10-31"
    assert r["a4"] == 6 and r["a4_cota_inferior"] is False
    assert r["lluvia_30d_mm"] == pytest.approx(24 * 4.0)
    base = 30 * 150.0 / 31                           # ventana 2-31 oct, normal prorrateada por días
    assert r["normal_30d_mm"] == pytest.approx(base, abs=0.05)
    assert r["a3"] == pytest.approx((96.0 - base) / base * 100, abs=0.05)


def test_indicadores_chirps_sin_dato_reciente_quedan_vacios():
    p = {"dias_maximos_atraso": 3, "umbral_dia_seco_mm": 1.0, "dias_ventana_anomalia": 30,
         "dias_validos_minimos_ventana": 27}
    r = indicadores_municipio({date(2026, 10, 1): 2.0}, {}, date(2026, 11, 8), p)
    assert r["a3"] is None and r["a4"] is None and r["fecha_dato"] is None


def test_sin_normal_no_hay_anomalia_pero_si_dias_secos():
    fin = date(2026, 10, 31)
    serie = {fin - timedelta(days=k): 0.0 for k in range(40)}
    p = {"dias_maximos_atraso": 3, "umbral_dia_seco_mm": 1.0, "dias_ventana_anomalia": 30,
         "dias_validos_minimos_ventana": 27}
    r = indicadores_municipio(serie, {}, fin, p)
    assert r["a3"] is None and r["a4"] == 40


# --- FIRMS -------------------------------------------------------------------------------

def test_tramos_firms_cubren_siete_dias_sin_superar_el_limite():
    tramos = firms.tramos_consulta(date(2026, 11, 9))
    assert tramos == [(date(2026, 11, 3), 5), (date(2026, 11, 8), 2)]
    assert sum(n for _, n in tramos) == 7


CSV_FIRMS = """latitude,longitude,bright_ti4,acq_date,confidence
6.15,-75.95,330,2026-11-08,n
6.16,-75.94,331,2026-11-08,h
6.17,-75.93,332,2026-11-08,l
5.00,-70.00,333,2026-11-08,n
x,y,0,2026-11-08,n
"""


def test_firms_cuenta_por_poligono_solo_confianza_nominal_y_alta():
    det = firms.leer_detecciones(CSV_FIRMS)
    assert len(det) == 3                             # la de confianza baja y la fila inválida se descartan
    indice = IndiceEspacial([{"type": "Feature", "properties": {"num_dane": "05001"}, "geometry": CUADRO_GRANDE}])
    conteo, fuera = firms.contar_por_municipio(det, indice, ["05001", "05002"])
    assert conteo == {"05001": 2, "05002": 0}      # 0 observado (la API respondió), no None
    assert fuera == 1


def test_firms_sin_clave_deja_a5_en_null(tmp_path, monkeypatch):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    monkeypatch.delenv("FIRMS_MAP_KEY", raising=False)
    res = firms.ConectorNASAFIRMS(base_dir=str(tmp_path)).ejecutar_captura()
    assert len(res.datos_extraidos) == 1122
    assert all(v["indicador_a5_focos_7d"] is None for v in res.datos_extraidos.values())


# --- Índice espacial ---------------------------------------------------------------------

def test_indice_espacial_no_adivina_en_solapes():
    f1 = {"type": "Feature", "properties": {"id": 1}, "geometry": CUADRO_GRANDE}
    f2 = {"type": "Feature", "properties": {"id": 2}, "geometry": CUADRO_GRANDE}
    assert IndiceEspacial([f1]).unico(-75.95, 6.15)["properties"]["id"] == 1
    assert IndiceEspacial([f1, f2]).unico(-75.95, 6.15) is None
    assert IndiceEspacial([f1]).unico(-70.0, 1.0) is None


# --- Territorio nacional -------------------------------------------------------------------

def test_territorio_conserva_piloto_y_agrega_nuevos():
    divipola = [{"cod_mpio": "05001", "nom_mpio": "MEDELLÍN", "dpto": "ANTIOQUIA", "tipo_municipio": "Municipio",
                 "latitud": "6,15", "longitud": "-75,95"},
                {"cod_mpio": "27493", "nom_mpio": "NUEVO BELÉN DE BAJIRÁ", "dpto": "CHOCÓ",
                 "tipo_municipio": "Municipio", "latitud": "7,37", "longitud": "-76,71"}]
    existentes = {"05001": {"divipola": "05001", "nombre": "Medellín", "departamento": "Antioquia",
                            "poblacion": 2600000, "region": "Andina"}}
    ms = {m["divipola"]: m for m in construir_municipios(divipola, existentes, {"05001": CUADRO_GRANDE})}
    assert ms["05001"]["piloto"] and ms["05001"]["poblacion"] == 2600000
    assert ms["05001"]["cabecera_en_poligono"] is True
    assert ms["27493"]["nombre"] == "Nuevo Belén de Bajirá"
    assert ms["27493"]["region"] == "Pacífica" and ms["27493"]["poblacion"] is None
    assert ms["27493"]["tiene_poligono"] is False and "piloto" not in ms["27493"]


def test_titulo_respeta_conectores():
    assert _titulo("SAN JOSÉ DEL GUAVIARE") == "San José del Guaviare"
    assert _titulo("EL CARMEN DE ATRATO") == "El Carmen de Atrato"


def test_territorio_versionado_es_la_divipola_completa():
    t = json.loads((RAIZ / "data" / "config" / "territorio_municipios.json").read_text(encoding="utf-8"))
    assert t["resumen"]["total"] == 1122
    assert t["resumen"]["por_tipo"]["Municipio"] == 1103
    assert t["resumen"]["sin_poligono"] == ["27493"]          # creado en 2022, posterior a la capa IDEAM
    assert t["resumen"]["cabecera_fuera_del_poligono"] == []
    pob = json.loads((RAIZ / "data" / "config" / "poblacion_dane.json").read_text(encoding="utf-8"))
    assert pob["municipios_sin_proyeccion"] == [] and len(pob["poblacion_por_anio"]) == 1122


# --- Pipeline: precedencia de fuentes, calidad del ICR, H-5 ------------------------------

@pytest.fixture
def pipeline(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return PipelineCorte(base_dir=str(tmp_path))


def test_ideam_tiene_precedencia_sobre_chirps(pipeline):
    ideam = {"indicador_a3_anomalia_precip_pct": -10.0, "fecha_dato": "2026-11-08"}
    chirps_d = {"indicador_a3_anomalia_precip_pct": -50.0, "fecha_dato": "2026-10-31", "version_dato": "prelim"}
    r = pipeline.elegir_precipitacion(ideam, chirps_d, "indicador_a3_anomalia_precip_pct")
    assert (r["valor"], r["fuente"], r["metodo"]) == (-10.0, "IDEAM", "estaciones_ideam")
    r = pipeline.elegir_precipitacion({}, chirps_d, "indicador_a3_anomalia_precip_pct")
    assert r["valor"] == -50.0 and r["fecha_dato"] == "2026-10-31"
    assert r["fuente"] == pipeline.FUENTE_CHIRPS and r["metodo"] == "satelite_chirps_prelim"
    r = pipeline.elegir_precipitacion({}, {}, "indicador_a3_anomalia_precip_pct")
    assert r["valor"] is None and r["metodo"] == "sin_dato"


def test_corte_nacional_declara_calidad_y_cobertura(pipeline):
    amenaza = {"indicador_a1_nino34": 3.4, "indices_semanales": {"fecha_semana": "01NOV2026"}}
    hoy = date.today().isoformat()
    ideam = {"05001": {"indicador_a3_anomalia_precip_pct": -30.0, "indicador_a4_dias_sin_lluvia": 5,
                       "indicador_h2_ivh_ena": "Alto", "indicador_h3_iua_ena": "Medio", "fecha_dato": hoy}}
    chirps_d = {"91263": {"indicador_a3_anomalia_precip_pct": -70.0, "indicador_a4_dias_sin_lluvia": 12,
                          "fecha_dato": hoy, "version_dato": "prelim"}}
    sui = {"05001": {"s1_cont": 23.0, "fecha_dato": hoy}}
    ungrd = {"05001": {"indicador_r4_calamidad": 0, "fecha_dato": hoy}}
    corte = pipeline.generar_corte_completo(amenaza_global=amenaza, datos_ideam=ideam, datos_sivicap={},
                                            datos_ungrd_mvct=ungrd, datos_xm={}, datos_firms={},
                                            datos_sui=sui, datos_chirps=chirps_d)
    ms = {m["divipola"]: m for m in corte["municipios"]}
    assert len(ms) == 1122
    assert ms["05001"]["calidad_icr"] == "completo"
    assert ms["91263"]["indicadores"]["A-3"]["fuente"] == pipeline.FUENTE_CHIRPS
    assert ms["91263"]["indicadores"]["A-3"]["metodo"] == "satelite_chirps_prelim"
    meta = corte["metadata_corte"]
    assert sum(meta["conteo_calidad_icr"].values()) == 1122
    cob = meta["cobertura_indicadores"]
    assert cob["A-3"]["por_metodo"] == {"estaciones_ideam": 1, "satelite_chirps_prelim": 1}
    # H-5 solo aplica donde hay embalse del catálogo XM: no infla el faltante nacional
    assert ms["11001"]["indicadores"]["H-5"]["aplica"] is True
    assert ms["91263"]["indicadores"]["H-5"]["aplica"] is False
    assert cob["H-5"]["aplica"] < 50


def test_tramo_de_validacion_usa_los_quiebres_del_icr():
    q_a3 = [[0, 0], [-20, 25], [-40, 50], [-60, 75], [-90, 100]]
    assert tramo(0.0, q_a3) == 0 and tramo(-30.0, q_a3) == 1 and tramo(-95.0, q_a3) == 3
    assert tramo(None, q_a3) is None


# --- Control de calidad de estaciones y uso de CHIRPS en el ICR ---------------------------

def test_estacion_que_transmite_ceros_se_excluye_pero_la_sequia_real_no():
    dias = [date(2026, 10, 31) - timedelta(days=k) for k in range(40)]
    diarios = {"MUERTA": {d: (0.0, 144) for d in dias},          # 0 mm mientras la referencia llueve
               "SECA": {d: (0.0, 144) for d in dias},            # 0 mm y la referencia también seca
               "BUENA": {d: (5.0, 144) for d in dias},
               "CORTA": {d: (0.0, 144) for d in dias[:10]}}      # pocos días válidos: no se juzga
    de_est = {"MUERTA": "27205", "SECA": "44847", "BUENA": "05001", "CORTA": "27205"}
    ref = {d: {"27205": 30.0, "44847": 0.2, "05001": 6.0} for d in dias}
    malas = pm.estaciones_inconsistentes(diarios, de_est, ref, dias, 115, 144, 30, 100.0, 0.1)
    assert set(malas) == {"MUERTA"}
    assert malas["MUERTA"]["referencia_mm"] == pytest.approx(1200.0)


def test_chirps_no_entra_al_icr_si_el_parametro_lo_desactiva():
    conf = json.loads((RAIZ / "data" / "config" / "parametros_chirps.json").read_text(encoding="utf-8"))
    assert conf["usar_en_icr"]["A-4"] is False      # validación: CHIRPS borra las rachas secas
    assert "justificacion" in conf["usar_en_icr"]
