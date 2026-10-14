"""
Servidor local del Tablero Vigía El Niño · Acueductos (CRA)
Spec: context-lake/specs/comparativo-semanal.md (RF-SEM-05, RNF-SEM-02)

- Sirve los estáticos de tablero/ (tablero principal, auditoría y micrositio /semanal/).
- Expone la API del botón «Actualizar datos»:
    GET  /api/semanal/datos        -> corte semanal vigente (oro)
    GET  /api/semanal/estado       -> estado de la actualización en curso / última
    POST /api/semanal/actualizar   -> {"modo": "completo" | "recalculo"}  (202 / 409)
- Escucha solo en 127.0.0.1 mientras no exista Keycloak (specs/seguridad-acceso.md).

Uso: python servidor_tablero.py [--puerto 8088]
"""

from __future__ import annotations

import argparse
import json
import logging
import threading
from datetime import datetime, timezone
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict

from ingesta.semanal.modelo_semanal import ejecutar_actualizacion

RAIZ = Path(__file__).resolve().parent
DIR_TABLERO = RAIZ / "tablero"
CORTE_VIGENTE = RAIZ / "data" / "oro" / "semanal" / "corte_semanal_vigente.json"

logger = logging.getLogger("ServidorTablero")


class EstadoActualizacion:
    """Máx. 1 ejecución activa (AGENTS.md). Estado compartido entre hilos."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.estado: Dict[str, Any] = {"estado": "inactivo", "pasos": []}

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return json.loads(json.dumps(self.estado))

    def iniciar(self, modo: str) -> bool:
        with self._lock:
            if self.estado.get("estado") == "en_ejecucion":
                return False
            self.estado = {"estado": "en_ejecucion", "modo": modo, "pasos": [],
                           "inicio": datetime.now(timezone.utc).isoformat(), "fin": None, "mensaje": ""}
            return True

    def paso(self, nombre: str, estado: str, mensaje: str) -> None:
        with self._lock:
            pasos = [p for p in self.estado["pasos"] if p["paso"] != nombre]
            pasos.append({"paso": nombre, "estado": estado, "mensaje": (mensaje or "")[:240]})
            self.estado["pasos"] = pasos

    def terminar(self, registro: Dict[str, Any]) -> None:
        with self._lock:
            self.estado.update(estado=registro["estado"], fin=registro["fin"], mensaje=registro["mensaje"],
                               semana_publicada=registro.get("semana_publicada"),
                               id_ejecucion=registro.get("id_ejecucion"))


ESTADO = EstadoActualizacion()


def _trabajo(modo: str) -> None:
    try:
        registro = ejecutar_actualizacion(modo, base_dir=str(RAIZ), on_paso=ESTADO.paso)
    except Exception as e:  # defensa: nunca dejar el estado colgado en en_ejecucion
        logger.exception("Falla no controlada en actualización")
        registro = {"estado": "fallido", "fin": datetime.now(timezone.utc).isoformat(), "mensaje": str(e)}
    ESTADO.terminar(registro)


class Manejador(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".js": "application/javascript; charset=utf-8",
                      ".json": "application/json; charset=utf-8",
                      ".geojson": "application/geo+json"}

    def _json(self, codigo: int, cuerpo: Any) -> None:
        datos = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(datos)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802
        ruta = self.path.split("?")[0]
        if ruta == "/api/semanal/estado":
            return self._json(HTTPStatus.OK, ESTADO.snapshot())
        if ruta == "/api/semanal/datos":
            if not CORTE_VIGENTE.exists():
                return self._json(HTTPStatus.NOT_FOUND, {"error": "Aún no hay corte semanal. Pulse «Actualizar datos»."})
            datos = CORTE_VIGENTE.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(datos)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(datos)
            return
        return super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        if self.path.split("?")[0] != "/api/semanal/actualizar":
            return self._json(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada"})
        try:
            largo = min(int(self.headers.get("Content-Length") or 0), 4096)
            cuerpo = json.loads(self.rfile.read(largo) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._json(HTTPStatus.BAD_REQUEST, {"error": "Cuerpo JSON inválido"})
        modo = cuerpo.get("modo", "completo")
        if modo not in ("completo", "recalculo"):
            return self._json(HTTPStatus.BAD_REQUEST, {"error": "modo debe ser 'completo' o 'recalculo'"})
        if not ESTADO.iniciar(modo):
            return self._json(HTTPStatus.CONFLICT, {"error": "Ya hay una actualización en curso", **ESTADO.snapshot()})
        threading.Thread(target=_trabajo, args=(modo,), daemon=True, name=f"actualizacion-{modo}").start()
        return self._json(HTTPStatus.ACCEPTED, ESTADO.snapshot())

    def log_message(self, fmt: str, *args: Any) -> None:
        if "/api/semanal/estado" not in (args[0] if args else ""):
            logger.info("%s - %s", self.address_string(), fmt % args)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    p = argparse.ArgumentParser(description="Servidor local del Tablero Vigía El Niño")
    p.add_argument("--puerto", type=int, default=8088)
    a = p.parse_args()
    servidor = ThreadingHTTPServer(("127.0.0.1", a.puerto), partial(Manejador, directory=str(DIR_TABLERO)))
    logger.info(f"Tablero en http://localhost:{a.puerto}/  ·  Comparativo semanal en http://localhost:{a.puerto}/semanal/")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        logger.info("Servidor detenido")


if __name__ == "__main__":
    main()
