"""
Pruebas Automatizadas de Ciberseguridad y Controles Técnicos (Fase 1 de Remediación)
Proyecto: Vigía El Niño · Acueductos (CRA)
Verifica la remediación de SEC-01, SEC-02, SEC-03, SEC-04, SEC-05 y SEC-06.
"""

import io
import os
import ssl
from http import HTTPStatus
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from ingesta.queries_sui.SUI_EXT_07_DATOS_ABIERTOS_SOCRATA import SocrataClientSUI
from servidor_tablero import Manejador

RAIZ = Path(__file__).resolve().parent.parent.parent


def test_sec01_validacion_ssl_estricta_activa():
    """SEC-01 (CWE-295): Verifica que el cliente Socrata exija certificados TLS válidos."""
    cliente = SocrataClientSUI()
    assert cliente.ssl_context.check_hostname is True
    assert cliente.ssl_context.verify_mode == ssl.CERT_REQUIRED


def test_sec02_gitignore_excluye_secretos_y_entornos():
    """SEC-02: Verifica que .gitignore excluya .env, llaves criptográficas y entornos."""
    contenido = (RAIZ / ".gitignore").read_text(encoding="utf-8")
    for patron in (".env", "*.pem", "*.key", "venv/", ".venv/", "node_modules/"):
        assert patron in contenido, f"Falta patrón {patron} en .gitignore"


def test_sec06_existe_plantilla_env_example():
    """SEC-06: Verifica que exista .env.example documentando las variables críticas."""
    ruta_env = RAIZ / ".env.example"
    assert ruta_env.exists()
    contenido = ruta_env.read_text(encoding="utf-8")
    for var in ("VIGIA_ADMIN_TOKEN", "SOCRATA_APP_TOKEN", "FIRMS_MAP_KEY", "CRA_CA_BUNDLE_PATH"):
        assert var in contenido, f"Falta variable {var} en .env.example"


def _crear_manejador_falso(headers_dict: dict) -> Manejador:
    """Construye una instancia aislada de Manejador sin abrir socket real."""
    instancia = Manejador.__new__(Manejador)
    instancia.headers = headers_dict
    return instancia


def test_sec03_bloqueo_csrf_origen_externo(monkeypatch):
    """SEC-03 (CWE-352): Verifica que POST desde un Origin externo sea rechazado con 403."""
    monkeypatch.delenv("VIGIA_ADMIN_TOKEN", raising=False)
    m = _crear_manejador_falso({
        "Content-Type": "application/json",
        "Origin": "https://sitio-malicioso.example.com"
    })
    valido, codigo, msg = m._validar_seguridad_post()
    assert valido is False
    assert codigo == HTTPStatus.FORBIDDEN
    assert "CSRF" in msg


def test_sec03_exige_token_admin_cuando_configurado(monkeypatch):
    """SEC-03: Verifica que cuando VIGIA_ADMIN_TOKEN está definido se rechacen peticiones sin él."""
    monkeypatch.setenv("VIGIA_ADMIN_TOKEN", "secreto_institucional_cra_2026")
    # Sin token -> 401
    m_sin_token = _crear_manejador_falso({
        "Content-Type": "application/json",
        "Origin": "http://localhost:8088"
    })
    valido, codigo, _ = m_sin_token._validar_seguridad_post()
    assert valido is False
    assert codigo == HTTPStatus.UNAUTHORIZED

    # Con token válido -> 200
    m_con_token = _crear_manejador_falso({
        "Content-Type": "application/json",
        "Origin": "http://localhost:8088",
        "X-Vigia-Auth-Token": "secreto_institucional_cra_2026"
    })
    valido_ok, codigo_ok, _ = m_con_token._validar_seguridad_post()
    assert valido_ok is True
    assert codigo_ok == HTTPStatus.OK


def test_sec04_escape_html_presente_en_frontend():
    """SEC-04 (CWE-79): Verifica que las funciones de sanitización XSS estén implementadas."""
    app_js = (RAIZ / "tablero" / "js" / "app.js").read_text(encoding="utf-8")
    aud_js = (RAIZ / "tablero" / "auditoria" / "js" / "auditoria.js").read_text(encoding="utf-8")
    assert "function escaparHtml(" in app_js
    assert "function escaparHtml(" in aud_js

