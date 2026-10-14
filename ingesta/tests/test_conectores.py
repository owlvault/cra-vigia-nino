"""
Pruebas Automatizadas de Conectores e Idempotencia
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import pytest
from pathlib import Path
from ingesta.conectores.conector_noaa import ConectorNOAA
from ingesta.conectores.conector_xm_embalses import ConectorXMEmbalses
from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda

def test_conector_xm_ejecucion():
    conector = ConectorXMEmbalses()
    res = conector.ejecutar()
    assert res.estado in ("exitosa", "sin_cambios")
    assert res.bytes_descargados > 0
    assert len(res.hash_sha256) == 64
    assert res.datos_extraidos is not None

def test_conector_ungrd_mvct_ejecucion():
    conector = ConectorUNGRDMinVivienda()
    res = conector.ejecutar()
    assert res.estado in ("exitosa", "sin_cambios")
    assert res.filas_procesadas >= 15
    assert "44847" in res.datos_extraidos["capa_r_por_divipola"] # Uribia
    uribia = res.datos_extraidos["capa_r_por_divipola"]["44847"]
    assert uribia["piso_regla_naranja_activo"] is True
