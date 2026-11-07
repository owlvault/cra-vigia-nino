"""
Pruebas del canal ciudadano (specs/canal-ciudadano.md, RF-CIU-01..10, RNF-CIU-01)
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import json
import re
import shutil
from pathlib import Path

import pytest

from ingesta.canal_ciudadano import GeneradorVistaCiudadana, _num_es, _version_tupla
from ingesta.pipeline_corte import PipelineCorte

RAIZ = Path(__file__).resolve().parents[2]
CODIGOS_INTERNOS = re.compile(r"\b[AHSR]-\d\b|\bICR\b|DIVIPOLA|sin_dato|sin_alerta")


def _ind(valor, fecha="2026-11-06", frescura="vigente"):
    return {"valor": valor, "fecha_dato": fecha, "frescura": frescura, "puntaje": None}


def _municipio(div, nombre, depto, cod, nivel, **inds):
    base = {"S-1": _ind(14.2, "2026-08-31", "desactualizado"), "S-2": _ind(38.5, "2024-12-31", "desactualizado"),
            "R-3": _ind(None, "2026-10-14"), "R-4": _ind(None, "2026-10-14"),
            "A-3": _ind(-88.5), "H-4": _ind(4.0)}
    base.update(inds)
    return {"divipola": div, "nombre": nombre, "departamento": depto, "cod_depto": cod, "nivel_alerta": nivel,
            "nivel_por_regla": False, "icr": 70.0, "poblacion": 1000, "subindices_capa": {}, "indicadores": base}


def _corte(**md):
    meta = {"fecha_corte": "2026-11-08", "estado_calidad": "PUBLICADO_VALIDO",
            "version_configuracion": "v1.1.0-20261107"}
    meta.update(md)
    ibague = _municipio("73001", "Ibagué", "Tolima", "73", "amarilla")
    ibague.update(zona_hidrografica="Alto Magdalena", subzona_hidrografica="Río Totare")
    return {"metadata_corte": meta, "municipios": [
        _municipio("44847", "Uribia", "La Guajira", "44", "roja", **{"R-4": _ind(1, "2026-10-14")}),
        _municipio("44001", "Riohacha", "La Guajira", "44", "naranja"),
        _municipio("47555", "Plato", "Magdalena", "47", "sin_dato"),
        ibague,
    ]}


SEMANAL = {
    "metadata": {"semana_vigente": "2026-W42"},
    "series": {c: [{"semana_iso": "2026-W42", "fecha_dato": "2026-10-12", "etiqueta_periodo": None}]
               for c in ("EMBALSES_NAL_PCT", "EMBALSE_BOGOTA_PCT", "NINO34_SSTA", "ONI")},
    "fct_variable_semana": {"1": {
        "EMBALSES_NAL_PCT": {"2026-W42": {"valor": 75.476, "delta_abs": 0.342, "tendencia": "mejora", "nivel_etiqueta": "Normal"}},
        "EMBALSE_BOGOTA_PCT": {"2026-W42": {"valor": 66.368, "delta_abs": -0.055, "tendencia": "estable", "nivel_etiqueta": "Atención"}},
        "NINO34_SSTA": {"2026-W42": {"valor": 3.3, "delta_abs": 0.1, "tendencia": "empeora", "nivel_etiqueta": "Muy fuerte"}},
        "ONI": {"2026-W42": {"valor": 2.16, "delta_abs": 0.0, "tendencia": "estable", "nivel_etiqueta": "Muy fuerte"}},
    }},
}


@pytest.fixture
def base(tmp_path):
    shutil.copytree(RAIZ / "data" / "config", tmp_path / "data" / "config")
    return tmp_path


@pytest.fixture
def gen(base):
    return GeneradorVistaCiudadana(base_dir=str(base))


def _muni(vista, div):
    return next(m for d in vista["departamentos"] for m in d["municipios"] if m["divipola"] == div)


def _textos_visibles(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("texto", "razon", "advertencia", "aviso", "nota", "remision", "municipio_fuera_de_muestra"):
                if isinstance(v, str):
                    yield v
            yield from _textos_visibles(v)
    elif isinstance(obj, list):
        for x in obj:
            yield from _textos_visibles(x)


# --- RF-CIU-02 ------------------------------------------------------------------

def test_mismo_valor_en_ambos_canales(gen):
    vista = gen.construir(_corte(), SEMANAL)
    assert _muni(vista, "44001")["horas_servicio"]["valor"] == 14.2


# --- RF-CIU-03 ------------------------------------------------------------------

def test_lista_blanca_excluye_icr_y_no_habilitados(gen):
    texto = json.dumps(gen.construir(_corte(), SEMANAL), ensure_ascii=False)
    assert '"icr"' not in texto
    assert "subindices" not in texto
    assert "-88.5" not in texto            # A-3 no habilitado
    assert '"poblacion"' not in texto


# --- RF-CIU-04 ------------------------------------------------------------------

@pytest.mark.parametrize("div, etiqueta", [("44847", "Muy alto"), ("44001", "Alto"), ("73001", "Medio"), ("47555", "Sin información")])
def test_etiquetas_de_nivel(gen, div, etiqueta):
    nivel = _muni(gen.construir(_corte(), SEMANAL), div)["nivel_riesgo"]
    assert nivel["texto"] == etiqueta
    assert "alerta" not in nivel["texto"].lower()


def test_conteo_departamental_en_etiquetas_claras(gen):
    guajira = next(d for d in gen.construir(_corte(), SEMANAL)["departamentos"] if d["cod_depto"] == "44")
    assert guajira["municipios_por_nivel"]["Muy alto"] == 1
    assert guajira["municipios_por_nivel"]["Alto"] == 1


# --- RF-CIU-05 ------------------------------------------------------------------

def test_racionamiento_sin_registro(gen):
    assert _muni(gen.construir(_corte(), SEMANAL), "47555")["racionamiento"]["texto"] == "Sin información verificada"


def test_calamidad_verificada(gen):
    assert _muni(gen.construir(_corte(), SEMANAL), "44847")["calamidad_publica"]["texto"] == "Sí, con soporte oficial"


def test_cero_verificado_no_es_sin_informacion(gen):
    corte = _corte()
    corte["municipios"][3]["indicadores"]["R-4"] = _ind(0, "2026-10-14")
    assert _muni(gen.construir(corte, SEMANAL), "73001")["calamidad_publica"]["texto"] == "No, verificado"


# --- RF-CIU-06 ------------------------------------------------------------------

def test_irca_anual_con_banda_fuente_y_advertencia(gen):
    agua = _muni(gen.construir(_corte(), SEMANAL), "44847")["calidad_agua"]
    assert agua["texto"] == "Riesgo alto"
    assert agua["fuente"] == "Instituto Nacional de Salud – SIVICAP"
    assert agua["periodo"] == "2024"
    assert "2024" in agua["advertencia"]


def test_horas_con_periodo_mensual(gen):
    horas = _muni(gen.construir(_corte(), SEMANAL), "44001")["horas_servicio"]
    assert horas["texto"] == "En promedio, 14,2 horas de servicio al día"
    assert horas["periodo"] == "agosto de 2026"


# --- RF-CIU-07 / nacional ---------------------------------------------------------

def test_aviso_y_remisiones(gen):
    md = gen.construir(_corte(), SEMANAL)["metadata"]
    assert "no es una alerta ni una declaratoria oficial" in md["aviso"].lower()
    assert set(md["remisiones"]) == {"suministro", "emergencias", "clima", "quejas"}


def test_embalses_y_el_nino(gen):
    nac = gen.construir(_corte(), SEMANAL)["nacional"]
    assert nac["embalses"]["nacional"]["texto"].startswith("Embalses del país: 75,5 % de su volumen útil; subió 0,3")
    assert "se mantuvo estable" in nac["embalses"]["bogota"]["texto"]
    assert "3,3 °C" in nac["estado_el_nino"]["semanal"]["texto"]
    assert "IDEAM" in nac["estado_el_nino"]["remision"]


def test_sin_corte_semanal_muestra_sin_informacion(gen):
    nac = gen.construir(_corte(), None)["nacional"]
    assert nac["embalses"]["nacional"]["texto"] == "Sin información verificada"


# --- RF-CIU-08 ------------------------------------------------------------------

def test_zona_resuelta_y_no_resuelta(gen):
    vista = gen.construir(_corte(), SEMANAL)
    assert _muni(vista, "73001")["zona_hidrografica"] == "Alto Magdalena – Río Totare"
    assert _muni(vista, "44001")["zona_hidrografica"] is None


# --- RF-CIU-10 ------------------------------------------------------------------

def test_hoy_no_es_publicable(gen):
    md = gen.construir(_corte(), SEMANAL)["metadata"]
    assert md["estado"] == "no_publicable"
    assert any(m.startswith("C-CIU-01") for m in md["motivos_no_publicable"])
    assert any(m.startswith("C-CIU-02") for m in md["motivos_no_publicable"])


def test_corte_con_version_anterior_no_es_publicable(gen):
    motivos = gen.evaluar_compuerta(_corte(version_configuracion="v1.0.0-20261008"))
    assert any(m.startswith("C-CIU-03") for m in motivos)


def test_publicable_cuando_se_cumplen_las_condiciones(base):
    ruta = base / "data" / "config" / "canal_ciudadano.json"
    conf = json.loads(ruta.read_text(encoding="utf-8"))
    conf["condiciones_exposicion"].update(clasificacion_informacion_publica=True, textos_aprobados=True)
    ruta.write_text(json.dumps(conf), encoding="utf-8")
    ruta_t = base / "data" / "config" / "territorio_municipios.json"
    terr = json.loads(ruta_t.read_text(encoding="utf-8"))
    terr["fuente_poblacion"] = "DANE - prueba"
    ruta_t.write_text(json.dumps(terr), encoding="utf-8")
    md = GeneradorVistaCiudadana(base_dir=str(base)).construir(_corte(), SEMANAL)["metadata"]
    assert md["estado"] == "publicable"
    assert md["motivos_no_publicable"] == []


def test_version_tupla():
    assert _version_tupla("v1.1.0-20261107") > _version_tupla("v1.0.0-20261008")
    assert _version_tupla("basura") == (0,)
    assert _num_es(75.476) == "75,5"


# --- RNF-CIU-01 -----------------------------------------------------------------

def test_textos_visibles_sin_codigos_internos(gen):
    for texto in _textos_visibles(gen.construir(_corte(), SEMANAL)):
        assert not CODIGOS_INTERNOS.search(texto), texto


# --- RF-CIU-01 / RF-CIU-02 integrados al pipeline -------------------------------

def test_pipeline_genera_vista_sin_tocar_el_canal_interno(base):
    p = PipelineCorte(base_dir=str(base))
    amenaza = {"indicador_a1_nino34": 3.4, "indices_semanales": {"fecha_semana": "01NOV2026"}}
    sui = {m["divipola"]: {"s1_cont": 20.0, "s3_cob": 95.0, "s4_ianc": 30.0, "s5_pqr": 10.0,
                           "h4_autonomia_h": 20.0, "r1_pec": 1, "fecha_dato": "2026-10-31"}
           for m in p.territorio["municipios"]}
    ideam = {m["divipola"]: {"indicador_a3_anomalia_precip_pct": -30.0, "indicador_a4_dias_sin_lluvia": 15,
                             "indicador_h1_caudal_pct": 60.0, "indicador_h2_ivh_ena": "Alto",
                             "indicador_h3_iua_ena": "Medio"} for m in p.territorio["municipios"]}
    corte = p.generar_corte_completo(amenaza_global=amenaza, datos_ideam=ideam, datos_sivicap={},
                                     datos_ungrd_mvct={}, datos_xm={}, datos_firms={}, datos_sui=sui)
    assert corte["metadata_corte"]["estado_calidad"] == "PUBLICADO_VALIDO"

    interno = json.loads((base / "data" / "oro" / "corte_vigente.json").read_text(encoding="utf-8"))
    assert all(m["icr"] is not None and len(m["indicadores"]) == 20 for m in interno["municipios"])
    assert "vista_ciudadana" not in interno["metadata_corte"]   # el canal interno no se altera

    vista = json.loads((base / "data" / "oro" / "ciudadano" / "vista_vigente.json").read_text(encoding="utf-8"))
    assert vista["metadata"]["fecha_corte"] == interno["metadata_corte"]["fecha_corte"]
    assert corte["metadata_corte"]["vista_ciudadana"] == "no_publicable"


def test_falla_de_la_vista_no_afecta_el_corte_interno(base, monkeypatch):
    import ingesta.canal_ciudadano as cc

    def explota(*a, **k):
        raise RuntimeError("falla simulada")

    monkeypatch.setattr(cc.GeneradorVistaCiudadana, "generar", explota)
    p = PipelineCorte(base_dir=str(base))
    amenaza = {"indicador_a1_nino34": 3.4, "indices_semanales": {"fecha_semana": "01NOV2026"}}
    sui = {m["divipola"]: {"s1_cont": 20.0, "fecha_dato": "2026-10-31"} for m in p.territorio["municipios"]}
    ideam = {m["divipola"]: {"indicador_a3_anomalia_precip_pct": -30.0, "indicador_h2_ivh_ena": "Alto"}
             for m in p.territorio["municipios"]}
    corte = p.generar_corte_completo(amenaza_global=amenaza, datos_ideam=ideam, datos_sivicap={},
                                     datos_ungrd_mvct={}, datos_xm={}, datos_firms={}, datos_sui=sui)
    assert corte["metadata_corte"]["estado_calidad"] == "PUBLICADO_VALIDO"
    assert (base / "data" / "oro" / "corte_vigente.json").exists()
    assert corte["metadata_corte"]["vista_ciudadana"].startswith("error")


def test_corte_rechazado_no_genera_vista(base):
    p = PipelineCorte(base_dir=str(base))
    p.generar_corte_completo(amenaza_global={}, datos_ideam={}, datos_sivicap={}, datos_ungrd_mvct={},
                             datos_xm={}, datos_firms={}, datos_sui={})
    assert not (base / "data" / "oro" / "ciudadano" / "vista_vigente.json").exists()
