"""
Pruebas de los contratos de datos de la Fase 1 (SUI por APS, eventos de la capa R, IRCA mensual)
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import shutil
from datetime import date, timedelta
from pathlib import Path

import pytest

from ingesta.fase1 import contrato_eventos as ce
from ingesta.fase1 import contrato_irca as ci
from ingesta.fase1 import contrato_sui as cs

RAIZ = Path(__file__).resolve().parents[2]
DIVS = {"47001", "05001", "44847"}

ENC = ",".join(cs.COLUMNAS)


def _csv(*filas):
    return ENC + "\n" + "\n".join(filas) + "\n"


def _fila(**kw):
    base = {c: "" for c in cs.COLUMNAS}
    base.update({k: str(v) for k, v in kw.items()})
    return ",".join(base[c] for c in cs.COLUMNAS)


# --- SUI por APS -----------------------------------------------------------------------

def test_rf_ter_03_continuidad_ponderada_por_suscriptores():
    """Escenario de specs/modelo-territorial.md: 9.000 × 20 h y 1.000 × 10 h => 19,0 h."""
    texto = _csv(_fila(periodo="2026-09", id_prestador="P1", id_aps="A1", divipola="47001",
                       suscriptores_total=9000, horas_continuidad_dia=20),
                 _fila(periodo="2026-09", id_prestador="P2", id_aps="A2", divipola="47001",
                       suscriptores_total=1000, horas_continuidad_dia=10))
    validas, rechazos = cs.validar_filas(cs.leer_csv(texto), DIVS)
    periodo, mun = cs.agregar_nacional(validas)
    assert rechazos == [] and periodo == "2026-09"
    assert mun["47001"]["s1_cont"] == pytest.approx(19.0)


def test_ianc_volumetrico_pqr_y_autonomia():
    texto = _csv(_fila(periodo="2026-09", id_prestador="P1", id_aps="A1", divipola="05001", suscriptores_total=100,
                       suscriptores_residenciales=80, volumen_producido_m3=1000, volumen_facturado_m3=600,
                       consumo_residencial_m3=800, pqr_falta_servicio_mes=30, pqr_falta_servicio_mes_anio_anterior=10,
                       capacidad_almacenamiento_m3=120, demanda_media_m3_h=10, pec_reportado_vigente=1),
                 _fila(periodo="2026-09", id_prestador="P2", id_aps="A2", divipola="05001", suscriptores_total=50,
                       suscriptores_residenciales=20, volumen_producido_m3=1000, volumen_facturado_m3=800,
                       consumo_residencial_m3=200, pqr_falta_servicio_mes=0, pqr_falta_servicio_mes_anio_anterior=0,
                       capacidad_almacenamiento_m3=30, demanda_media_m3_h=5, pec_reportado_vigente=0))
    _, mun = cs.agregar_nacional(cs.validar_filas(cs.leer_csv(texto), DIVS)[0])
    m = mun["05001"]
    assert m["s4_ianc"] == pytest.approx(30.0)          # (2000 - 1400) / 2000
    assert m["s5_pqr"] == pytest.approx(200.0)          # (30 - 10) / 10
    assert m["s6_consumo_m3"] == pytest.approx(10.0)    # 1000 m³ / 100 suscriptores residenciales
    assert m["h4_autonomia_h"] == pytest.approx(10.0)   # 150 m³ / 15 m³/h
    assert m["r1_pec"] == 0                             # un prestador sin PEC => 0
    assert m["s3_cob"] is None                          # sin hogares DANE no hay cobertura


def test_pqr_casos_borde_y_r1_desconocido():
    filas = [{"id_prestador": "P1", "id_aps": "A", "suscriptores_total": 1, "pqr_falta_servicio_mes": 5,
              "pqr_falta_servicio_mes_anio_anterior": 0, "pec_reportado_vigente": 1},
             {"id_prestador": "P2", "id_aps": "B", "suscriptores_total": 1, "pec_reportado_vigente": None}]
    m = cs.agregar_municipio(filas)
    assert m["s5_pqr"] == 300.0                          # año anterior 0 y mes > 0 => extremo
    assert m["r1_pec"] is None                           # un prestador sin información: no se afirma 1


def test_sui_rechaza_filas_invalidas_sin_detener_el_resto():
    texto = _csv(_fila(periodo="2026-09", id_prestador="P1", id_aps="A1", divipola="47001", suscriptores_total=10,
                       horas_continuidad_dia=30),
                 _fila(periodo="2026-9", id_prestador="P1", id_aps="A2", divipola="99999", suscriptores_total=10),
                 _fila(periodo="2026-09", id_prestador="P1", id_aps="A3", divipola="47001", suscriptores_total=10,
                       horas_continuidad_dia=12),
                 _fila(periodo="2026-09", id_prestador="P1", id_aps="A3", divipola="47001", suscriptores_total=10))
    validas, rechazos = cs.validar_filas(cs.leer_csv(texto), DIVS)
    assert len(validas) == 1
    motivos = " ".join(m for r in rechazos for m in r["motivos"])
    assert "fuera de rango" in motivos and "AAAA-MM" in motivos and "DIVIPOLA" in motivos and "duplicada" in motivos


def test_sui_sin_columnas_del_contrato_falla_explicitamente():
    with pytest.raises(ValueError, match="contrato"):
        cs.leer_csv("periodo,divipola\n2026-09,47001\n")


def test_conector_sui_usa_extracto_nacional_y_conserva_piloto(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    shutil.copytree(RAIZ / "data" / "bronce" / "fte_sui", tmp_path / "data" / "bronce" / "fte_sui")
    (tmp_path / "data" / "bronce" / "fte_sui" / "sui_aps_2026-09.csv").write_text(_csv(
        _fila(periodo="2026-09", id_prestador="P1", id_aps="A1", divipola="91263", suscriptores_total=300,
              horas_continuidad_dia=8)), encoding="utf-8")
    from ingesta.conectores.conector_sui import ConectorSUI
    datos = ConectorSUI(base_dir=str(tmp_path)).ejecutar_captura().datos_extraidos
    assert datos["91263"]["s1_cont"] == 8.0 and datos["91263"]["fecha_dato"] == "2026-09-30"
    assert datos["91263"]["origen"] == "extracto_nacional_aps"
    assert datos["44847"]["origen"] == "extracto_certificado_piloto"


# --- Eventos de la capa R -------------------------------------------------------------------

CORTE = date(2026, 11, 9)
ENC_EV = "divipola,indicador,estado,fecha_reporte,fecha_inicio,fecha_fin,entidad,soporte,poblacion_afectada"


def _ev(texto):
    validas, rechazos = ce.validar(ce.leer_csv(ENC_EV + "\n" + texto), DIVS)
    return ce.evaluar(validas, CORTE), rechazos


def test_calamidad_vigente_y_vencida():
    r, _ = _ev("47001,R-4,activo,2026-10-01,2026-10-01,,UNGRD,Decreto 123 de 2026,5000\n"
               "05001,R-4,activo,2026-08-01,2026-08-01,2026-09-30,UNGRD,Decreto 9 de 2026,\n")
    assert r["47001"]["R-4"]["valor"] == 1 and r["47001"]["R-4"]["soporte"] == "Decreto 123 de 2026"
    assert "05001" not in r                       # vencida y sin verificación reciente: sin_dato, no 0


def test_racionamiento_solo_cuenta_30_dias():
    r, _ = _ev("47001,R-3,activo,2026-10-20,2026-10-18,,MinVivienda,https://ejemplo/1,\n"
               "05001,R-3,activo,2026-09-01,2026-09-01,,MinVivienda,https://ejemplo/2,\n")
    assert r["47001"]["R-3"]["valor"] == 1
    assert "05001" not in r


def test_sin_evento_verificado_vale_cero_y_activo_sin_soporte_se_rechaza():
    r, rechazos = _ev("44847,R-2,sin_evento,2026-11-01,,,UNGRD,,\n"
                      "47001,R-2,activo,2026-11-01,2026-11-01,,UNGRD,,\n")
    assert r["44847"]["R-2"]["valor"] == 0
    assert "47001" not in r
    assert any("sin soporte" in m for x in rechazos for m in x["motivos"])


def test_reporte_posterior_al_corte_se_ignora():
    r, _ = _ev(f"47001,R-4,activo,{(CORTE + timedelta(days=2)).isoformat()},2026-11-10,,UNGRD,Decreto 1,\n")
    assert r == {}


def test_conector_ungrd_aplica_eventos_y_piso_naranja(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda
    c = ConectorUNGRDMinVivienda(base_dir=str(tmp_path))
    hoy = date.today()
    (c.bronce_dir / "eventos_respuesta_x.csv").write_text(
        ENC_EV + f"\n91263,R-4,activo,{hoy.isoformat()},{(hoy - timedelta(days=3)).isoformat()},,UNGRD,Decreto 77 de 2026,1200\n",
        encoding="utf-8")
    c._consultar_emergencias_socrata = lambda: None
    c._consultar_minvivienda = lambda catalogo: None
    capa = c.ejecutar_captura().datos_extraidos["capa_r_por_divipola"]
    assert capa["91263"]["indicador_r4_calamidad"] == 1
    assert capa["91263"]["piso_regla_naranja_activo"] is True
    assert capa["91263"]["decreto_calamidad"] == "Decreto 77 de 2026"
    assert capa["91263"]["fecha_dato"] == hoy.isoformat()


# --- IRCA mensual ----------------------------------------------------------------------------

def test_irca_mensual_toma_el_ultimo_periodo_y_rechaza_invalidos():
    texto = ("divipola,periodo,irca_urbano,irca_rural\n"
             "47001,2026-08,3.1,20\n47001,2026-09,,12.5\n05001,2026-09,120,\n44847,2026-09,ND,ND\n")
    ult, rech = ci.leer(texto, DIVS)
    assert ult["47001"] == {"periodo": "2026-09", "irca_urbano": None, "irca_rural": 12.5,
                            "valor": 12.5, "fecha_dato": "2026-09-30"}
    assert {r["divipola"] for r in rech} == {"05001", "44847"}


# --- Reportes públicos de MinVivienda (ArcGIS) -------------------------------------------------

def _ms(d):
    from datetime import datetime, timezone
    return int(datetime(d.year, d.month, d.day, 12, tzinfo=timezone.utc).timestamp() * 1000)


def test_reportes_minvivienda_filtran_sequia_vigente_con_afectacion():
    from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda as C
    corte = date(2026, 11, 9)
    reps = [
        {"objectid": 1, "fecha": _ms(date(2026, 10, 22)), "municipio": "05001", "tipoevento": "sequia",
         "acueducto": "fuente", "afectaciona": "temporal", "Restablecimiento_servicioa": "temporalmente", "personas": "52624"},
        {"objectid": 2, "fecha": _ms(date(2026, 12, 3)), "municipio": "47001", "tipoevento": "Sequía;",
         "afectaciona": "temporal"},                                    # fecha futura: error de digitación
        {"objectid": 3, "fecha": _ms(date(2026, 10, 30)), "municipio": "44847", "tipoevento": "sequia",
         "afectaciona": "temporal", "Restablecimiento_servicioa": "si"},  # ya restablecido
        {"objectid": 4, "fecha": _ms(date(2026, 10, 30)), "municipio": "44847", "tipoevento": "sismo",
         "afectaciona": "temporal"},
        {"objectid": 5, "fecha": None, "municipio": "44847", "tipoevento": "sequia", "afectaciona": "temporal"},
    ]
    ev = C.reportes_a_eventos(reps, "https://arcgis/capa", corte)
    assert [(e["divipola"], e["soporte"], e["poblacion_afectada"]) for e in ev] == [("05001", "https://arcgis/capa/1", 52624)]
    r = ce.evaluar(ev, corte)
    assert r["05001"]["R-3"]["valor"] == 1 and r["05001"]["R-3"]["entidad"] == "MinVivienda"


def test_conector_integra_minvivienda_y_no_guarda_datos_personales(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda
    c = ConectorUNGRDMinVivienda(base_dir=str(tmp_path))
    c._consultar_emergencias_socrata = lambda: None
    hoy = date.today()
    llamadas = []

    def falso_query(capa, params):
        llamadas.append(params["outFields"])
        if "MpiosAfectadosNino" in capa:
            return [{"CODMUN": "91263", "NivRies": "Muy Alto", "AFECTADOSNINO": 1}]
        return [{"objectid": 9, "fecha": _ms(hoy), "municipio": "91263", "tipoevento": "sequia",
                 "afectaciona": "temporal", "personas": "800"}] if "Gestores" in capa else []

    c._arcgis_query = falso_query
    res = c.ejecutar_captura()
    capa = res.datos_extraidos["capa_r_por_divipola"]
    assert capa["91263"]["indicador_r3_racionamiento"] == 1
    assert capa["91263"]["piso_regla_naranja_activo"] is True
    assert capa["91263"]["contexto_minvivienda"] == {"nivel_riesgo_desabastecimiento": "Muy Alto", "listado_nino_2026": True}
    assert capa["05001"]["indicador_r3_racionamiento"] is None      # sin reporte: sin_dato, no 0
    assert all("responsable" not in f and "Creator" not in f and "Editor" not in f for f in llamadas)
    assert "responsable" not in Path(res.ruta_archivo_bronce).read_text(encoding="utf-8")
