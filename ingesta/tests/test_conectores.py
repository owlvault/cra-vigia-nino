"""
Pruebas Automatizadas de Conectores e Idempotencia
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import shutil
import pytest
from pathlib import Path
from ingesta.conectores.conector_noaa import ConectorNOAA
from ingesta.conectores.conector_xm_embalses import ConectorXMEmbalses
from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda

RAIZ_REPO = Path(__file__).resolve().parent.parent.parent


@pytest.fixture
def base_aislada(tmp_path: Path) -> Path:
    """Copia solo config (y respaldo XM si existe) en tmp_path para no escribir en data/bronce del repo."""
    shutil.copytree(RAIZ_REPO / "data" / "config", tmp_path / "data" / "config")
    xm_hist = RAIZ_REPO / "data" / "bronce" / "fte_xm_historico"
    if xm_hist.exists():
        dest_xm = tmp_path / "data" / "bronce" / "fte_xm_historico"
        dest_xm.mkdir(parents=True, exist_ok=True)
        for f in sorted(xm_hist.glob("*.json"))[-4:]:
            shutil.copy2(f, dest_xm / f.name)
    return tmp_path


def test_conector_xm_ejecucion(base_aislada: Path):
    conector = ConectorXMEmbalses(base_dir=str(base_aislada))
    res = conector.ejecutar()
    assert res.estado in ("exitosa", "sin_cambios")
    assert res.bytes_descargados > 0
    assert len(res.hash_sha256) == 64
    assert res.datos_extraidos is not None


def test_conector_ungrd_mvct_ejecucion(base_aislada: Path):
    conector = ConectorUNGRDMinVivienda(base_dir=str(base_aislada))
    res = conector.ejecutar()
    assert res.estado in ("exitosa", "sin_cambios")
    assert res.filas_procesadas >= 15
    assert "44847" in res.datos_extraidos["capa_r_por_divipola"] # Uribia
    uribia = res.datos_extraidos["capa_r_por_divipola"]["44847"]
    assert uribia["piso_regla_naranja_activo"] is True
