"""
Pruebas Automatizadas del Motor de Auditoría y Veracidad de Datos
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import shutil
import pytest
from pathlib import Path
from auditoria.auditor_veracidad import AuditorVeracidad

@pytest.fixture
def auditor(tmp_path: Path):
    a = AuditorVeracidad()
    # Aislar directorios de escritura para no modificar ops, auditoria ni tablero durante pytest
    ops_tmp = tmp_path / "ops"
    ops_tmp.mkdir(parents=True, exist_ok=True)
    if (a.ops_dir / "capturas.json").exists():
        shutil.copy2(a.ops_dir / "capturas.json", ops_tmp / "capturas.json")
    a.ops_dir = ops_tmp
    a.auditoria_dir = tmp_path / "auditoria"
    a.auditoria_dir.mkdir(parents=True, exist_ok=True)
    a.tablero_dir = tmp_path / "tablero"
    (a.tablero_dir / "auditoria").mkdir(parents=True, exist_ok=True)
    return a

def test_auditoria_integridad_criptografica(auditor):
    """Verifica que todos los archivos de zona bronce tengan integridad SHA-256 inmutable."""
    res = auditor.auditar_integridad_criptografica()
    assert res["estado"] == "VALIDADO"
    assert res["archivos_corruptos"] == 0
    assert res["archivos_evaluados"] >= 18
    assert res["tasa_integridad_pct"] == 100.0

def test_auditoria_reconciliacion_fuentes(auditor):
    """Verifica que los 460 puntos de control coincidan exactamente con los datos crudos."""
    res = auditor.auditar_reconciliacion_campo_a_campo()
    assert res["estado"] == "VERIFICADO_100_PCT"
    assert res["total_discrepancias"] == 0
    assert res["tasa_veracidad_pct"] == 100.0
    assert res["total_comparaciones"] == 460

def test_auditoria_modelo_matematico_icr(auditor):
    """Verifica que el recálculo autónomo del modelo ICR coincida con el tablero."""
    res = auditor.auditar_modelo_matematico_icr()
    assert res["estado"] == "VALIDADO"
    assert res["coincidencias_icr"] == res["total_municipios"]
    assert res["maxima_desviacion_icr"] <= 0.05
    assert res["diff_icr_nacional"] <= 0.05

def test_auditoria_reglas_calidad_frescura(auditor):
    """Verifica que no existan violaciones a las reglas RN-CAL."""
    res = auditor.auditar_reglas_calidad_frescura()
    assert res["estado"] == "VALIDADO"
    assert res["total_violaciones"] == 0

def test_auditoria_dictamen_oficial(auditor):
    """Verifica que el dictamen final sea CERTIFICADO_FEHACIENTE con hash SHA-256."""
    informe = auditor.ejecutar_auditoria_completa()
    res = informe["resumen_ejecutivo"]
    assert res["veredicto_oficial"] == "CERTIFICADO_FEHACIENTE"
    assert len(res["hash_dictamen_sha256"]) == 64
    assert res["indicadores_clave_auditoria"]["tasa_veracidad_datos_pct"] == 100.0

def test_auditoria_linaje_vinculo_fuente(auditor):
    """Verifica RF-CAL-05: que cada registro de reconciliación contenga vínculo activo a la fuente oficial."""
    res = auditor.auditar_reconciliacion_campo_a_campo()
    matriz = res["matriz"]
    assert len(matriz) == 460
    
    for item in matriz:
        assert "url_fuente" in item, f"Falta url_fuente en indicador {item.get('indicador')}"
        assert item["url_fuente"].startswith("http://") or item["url_fuente"].startswith("https://")
        assert "portal_oficial" in item and len(item["portal_oficial"]) > 3
        assert "id_fuente_canonico" in item and item["id_fuente_canonico"].startswith("FTE-")
        assert "descripcion_fuente" in item and len(item["descripcion_fuente"]) > 10

