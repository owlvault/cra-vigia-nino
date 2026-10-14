"""
Recuperación retroactiva de series históricas desde las fuentes originales
Proyecto: Vigía El Niño · Acueductos (CRA)
Spec: context-lake/specs/comparativo-semanal.md (RF-SEM-08)

Cada recuperador es un conector (hereda ConectorBase): solo INSERTA crudos en bronce,
nunca actualiza ni borra (ADR-0003). Cada archivo bronce es un "tramo" con envoltura:

    {"_captura_id", "_capturado_en", "_hash", "_url_origen",
     "serie", "periodo_desde", "periodo_hasta", "payload": <respuesta cruda de la fuente>}

Idempotencia: un tramo cerrado (periodo_hasta < hoy - margen) ya descargado no se vuelve a
pedir; un tramo abierto se vuelve a pedir y solo se inserta si su hash cambió.

Fuentes:
    NOAA CPC   -> ConectorNOAA existente (archivo completo 1981-hoy en cada captura)
    XM         -> API servapibi.xm.com.co/daily, PorcVoluUtilDiar (Sistema y Embalse)
    IDEAM      -> datos.gov.co s54a-sgyg, agregado diario por departamento (SoQL)
    UNGRD      -> datos.gov.co emergencias 2019-2025 (incendios forestales, sequía, desabastecimiento)
    NASA FIRMS -> API de país COL (requiere FIRMS_MAP_KEY; sin clave queda «bloqueada»)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import urllib.parse
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterator, List, Optional, Tuple

from ingesta.conector_base import CapturaResultado, ConectorBase

logger = logging.getLogger("RecuperacionHistorica")

Notificador = Callable[[str, str, str], None]


def tramos(desde: date, hasta: date, dias: int) -> Iterator[Tuple[date, date]]:
    """Divide [desde, hasta] en tramos de máximo `dias` días."""
    d = desde
    while d <= hasta:
        f = min(d + timedelta(days=dias - 1), hasta)
        yield d, f
        d = f + timedelta(days=1)


def meses(desde: date, hasta: date) -> Iterator[Tuple[date, date]]:
    d = date(desde.year, desde.month, 1)
    while d <= hasta:
        sig = date(d.year + (d.month == 12), d.month % 12 + 1, 1)
        yield max(d, desde), min(sig - timedelta(days=1), hasta)
        d = sig


class RecuperadorBase(ConectorBase):
    CARPETA = ""

    def __init__(self, id_fuente: str, nombre: str, entidad: str, cfg: Dict[str, Any],
                 base_dir: Optional[str] = None, hoy: Optional[date] = None,
                 on_paso: Optional[Notificador] = None):
        super().__init__(id_fuente=id_fuente, nombre_fuente=nombre, entidad=entidad, base_dir=base_dir)
        self.cfg = cfg
        self.hoy = hoy or date.today()
        self.margen = int(cfg.get("margen_dias_periodo_abierto", 10))
        self.notificar = on_paso or (lambda *_: None)
        self._indice: Optional[Dict[str, str]] = None

    # ---------------------------------------------------------------- bronce
    def _indice_tramos(self) -> Dict[str, str]:
        """clave serie|desde|hasta -> último hash guardado."""
        if self._indice is None:
            self._indice = {}
            for arch in sorted(self.bronce_dir.glob("*.json")):
                try:
                    env = json.loads(arch.read_text(encoding="utf-8"))
                    self._indice[f"{env['serie']}|{env['periodo_desde']}|{env['periodo_hasta']}"] = env["_hash"]
                except Exception:
                    continue
        return self._indice

    def _requiere(self, serie: str, desde: date, hasta: date) -> bool:
        clave = f"{serie}|{desde.isoformat()}|{hasta.isoformat()}"
        abierto = hasta >= self.hoy - timedelta(days=self.margen)
        return abierto or clave not in self._indice_tramos()

    def _guardar_tramo(self, serie: str, desde: date, hasta: date, url: str, payload: Any) -> bool:
        cuerpo = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
        h = hashlib.sha256(cuerpo).hexdigest()
        clave = f"{serie}|{desde.isoformat()}|{hasta.isoformat()}"
        if self._indice_tramos().get(clave) == h:
            return False
        envoltura = {
            "_captura_id": str(uuid.uuid4()), "_capturado_en": datetime.now(timezone.utc).isoformat(),
            "_hash": h, "_url_origen": url, "serie": serie,
            "periodo_desde": desde.isoformat(), "periodo_hasta": hasta.isoformat(), "payload": payload,
        }
        self.guardar_en_bronce(json.dumps(envoltura, ensure_ascii=False).encode("utf-8"), "json", h)
        self._indice_tramos()[clave] = h
        return True

    # ---------------------------------------------------------------- red
    def _http(self, url: str, cuerpo: Optional[Dict[str, Any]] = None, timeout: int = 60, intentos: int = 3) -> bytes:
        datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
        req = urllib.request.Request(url, data=datos, method="POST" if datos else "GET",
                                     headers={"User-Agent": self.USER_AGENT, "Content-Type": "application/json", "Accept": "*/*"})
        ultimo: Optional[Exception] = None
        for i in range(intentos):
            try:
                with urllib.request.urlopen(req, context=self.ssl_context, timeout=timeout) as r:
                    return r.read()
            except Exception as e:  # reintento con espera (RF-ING-04)
                ultimo = e
                time.sleep([2, 8, 20][min(i, 2)])
        raise ConnectionError(f"{url[:90]}… falló tras {intentos} intentos: {ultimo}")

    def _resultado(self, nuevos: int, consultados: int, errores: List[str]) -> CapturaResultado:
        if errores and consultados == len(errores):
            raise ConnectionError("; ".join(errores[:3]))
        estado = "exitosa" if nuevos else "sin_cambios"
        msg = f"{nuevos} tramos nuevos de {consultados} consultados"
        if errores:
            msg += f" · {len(errores)} con error: {errores[0][:120]}"
        return CapturaResultado(id_fuente=self.id_fuente, estado=estado, filas_procesadas=nuevos,
                                ruta_archivo_bronce=str(self.bronce_dir), mensaje=msg)


# =============================================================================
class RecuperadorXM(RecuperadorBase):
    def __init__(self, cfg: Dict[str, Any], **kw: Any):
        super().__init__("FTE-XM-HISTORICO", "Volumen útil diario de embalses (XM API)", "XM S.A. E.S.P.", cfg, **kw)

    def ejecutar_captura(self) -> CapturaResultado:
        c = self.cfg["xm"]
        pendientes = []
        for v in c["ventanas"]:
            hasta = date.fromisoformat(v["hasta"]) if v.get("hasta") else self.hoy
            for a, b in tramos(date.fromisoformat(v["desde"]), hasta, int(c["max_dias_por_consulta"])):
                if self._requiere(v["entidad"], a, b):
                    pendientes.append((v["entidad"], a, b))
        nuevos, errores = 0, []
        for i, (ent, a, b) in enumerate(pendientes, 1):
            try:
                cuerpo = {"MetricId": c["metrica"], "StartDate": a.isoformat(), "EndDate": b.isoformat(), "Entity": ent}
                payload = json.loads(self._http(c["url"], cuerpo))
                nuevos += self._guardar_tramo(ent, a, b, f"{c['url']} {json.dumps(cuerpo)}", payload)
            except Exception as e:
                errores.append(f"{ent} {a}: {e}")
            if i % 10 == 0 or i == len(pendientes):
                self.notificar("XM histórico", "en_ejecucion", f"{i}/{len(pendientes)} tramos")
        return self._resultado(nuevos, len(pendientes), errores)


# =============================================================================
class RecuperadorIDEAM(RecuperadorBase):
    def __init__(self, cfg: Dict[str, Any], **kw: Any):
        super().__init__("FTE-IDEAM-PRECIP-HISTORICO", "Precipitación diaria por departamento (IDEAM, datos.gov.co)", "IDEAM", cfg, **kw)

    def _consulta(self, a: date, b: date) -> Tuple[str, Any]:
        c = self.cfg["ideam"]
        q = {
            "$select": "date_trunc_ymd(fechaobservacion) as dia, departamento, sum(valorobservado) as suma_mm, count(distinct codigoestacion) as estaciones, count(*) as observaciones",
            "$where": f"fechaobservacion between '{a.isoformat()}T00:00:00' and '{b.isoformat()}T23:59:59' and valorobservado >= 0",
            "$group": "dia, departamento", "$order": "dia", "$limit": 50000,
        }
        url = f"{c['url']}?{urllib.parse.urlencode(q)}"
        return url, json.loads(self._http(url, timeout=int(c.get("timeout_s", 240)), intentos=2))

    def ejecutar_captura(self) -> CapturaResultado:
        c = self.cfg["ideam"]
        pendientes = [(a, b) for a, b in meses(date.fromisoformat(c["desde"]), self.hoy) if self._requiere("diario_departamento", a, b)]
        nuevos, errores, hechos = 0, [], 0
        with ThreadPoolExecutor(max_workers=int(c.get("hilos", 4))) as ex:
            futuros = {ex.submit(self._consulta, a, b): (a, b) for a, b in pendientes}
            for f in as_completed(futuros):
                a, b = futuros[f]
                hechos += 1
                try:
                    url, payload = f.result()
                    nuevos += self._guardar_tramo("diario_departamento", a, b, url, payload)
                except Exception as e:
                    errores.append(f"{a:%Y-%m}: {e}")
                self.notificar("IDEAM histórico", "en_ejecucion", f"{hechos}/{len(pendientes)} meses")
        return self._resultado(nuevos, len(pendientes), errores)


# =============================================================================
class RecuperadorUNGRD(RecuperadorBase):
    def __init__(self, cfg: Dict[str, Any], **kw: Any):
        super().__init__("FTE-UNGRD-HISTORICO", "Emergencias UNGRD asociadas a El Niño (datos.gov.co)", "UNGRD", cfg, **kw)

    def ejecutar_captura(self) -> CapturaResultado:
        c = self.cfg["ungrd"]
        eventos = ", ".join(f"'{e}'" for e in c["eventos"])
        nuevos, errores, consultados = 0, [], 0
        for ds in c["datasets"]:
            a, b = date.fromisoformat(ds["desde"]), date.fromisoformat(ds["hasta"])
            if not self._requiere(ds["id"], a, b):
                continue
            consultados += 1
            q = {"$select": ds["campos"], "$where": f"evento in ({eventos})", "$order": "fecha", "$limit": 50000}
            url = f"{ds['url']}?{urllib.parse.urlencode(q)}"
            try:
                nuevos += self._guardar_tramo(ds["id"], a, b, url, json.loads(self._http(url, timeout=120)))
            except Exception as e:
                errores.append(f"{ds['id']}: {e}")
        return self._resultado(nuevos, consultados, errores)


# =============================================================================
class RecuperadorFIRMS(RecuperadorBase):
    def __init__(self, cfg: Dict[str, Any], **kw: Any):
        super().__init__("FTE-FIRMS-HISTORICO", "Focos de calor VIIRS Colombia (NASA FIRMS)", "NASA", cfg, **kw)

    def ejecutar_captura(self) -> CapturaResultado:
        c = self.cfg["firms"]
        clave = os.environ.get(c["variable_entorno_clave"], "").strip()
        if not clave:
            raise PermissionError(f"bloqueada: requiere la variable de entorno {c['variable_entorno_clave']} (MAP_KEY gratuita de NASA FIRMS)")
        pendientes = [(a, b) for a, b in tramos(date.fromisoformat(c["desde"]), self.hoy, int(c["max_dias_por_consulta"]))
                      if self._requiere("COL_VIIRS_SNPP_SP", a, b)]
        nuevos, errores = 0, []
        for a, b in pendientes:
            url = c["url"].format(map_key=clave, dias=(b - a).days + 1, fecha=a.isoformat())
            try:
                csv = self._http(url, timeout=120).decode("utf-8", errors="replace")
                nuevos += self._guardar_tramo("COL_VIIRS_SNPP_SP", a, b, url.replace(clave, "***"), {"csv": csv})
            except Exception as e:
                errores.append(f"{a}: {e}")
        return self._resultado(nuevos, len(pendientes), errores)


# =============================================================================
def recuperar_historico(base_dir: Optional[str] = None, on_paso: Optional[Notificador] = None,
                        fuentes: Optional[List[str]] = None) -> Dict[str, Any]:
    """Ejecuta la recuperación incremental de todas las fuentes y registra en ops."""
    from ingesta.conectores.conector_noaa import ConectorNOAA

    root = Path(base_dir or Path(__file__).resolve().parent.parent.parent)
    cfg_total = json.loads((root / "data" / "config" / "comparativo_semanal.json").read_text(encoding="utf-8"))
    cfg = cfg_total["recuperacion_historica"]
    notificar = on_paso or (lambda *_: None)
    kw = {"base_dir": str(root), "on_paso": notificar}
    catalogo: Dict[str, Callable[[], ConectorBase]] = {
        "NOAA histórico": lambda: ConectorNOAA(base_dir=str(root)),
        "XM histórico": lambda: RecuperadorXM(cfg, **kw),
        "IDEAM histórico": lambda: RecuperadorIDEAM(cfg, **kw),
        "UNGRD histórico": lambda: RecuperadorUNGRD(cfg, **kw),
        "FIRMS histórico": lambda: RecuperadorFIRMS(cfg, **kw),
    }
    resumen: Dict[str, Any] = {"inicio": datetime.now(timezone.utc).isoformat(), "fuentes": {}}
    for nombre, fabrica in catalogo.items():
        if fuentes and nombre.split()[0] not in fuentes:
            continue
        notificar(nombre, "en_ejecucion", "Consultando fuente original")
        t0 = time.time()
        res = fabrica().ejecutar()  # ConectorBase.ejecutar registra en ops/capturas.json
        res_d = res.to_dict()
        res_d["duracion_s"] = round(time.time() - t0, 1)
        if res.estado == "fallida" and res.mensaje.startswith("bloqueada"):
            res_d["estado"] = "bloqueada"
        resumen["fuentes"][nombre] = res_d
        notificar(nombre, "fallida" if res.estado == "fallida" else res.estado, res.mensaje)
    resumen["fin"] = datetime.now(timezone.utc).isoformat()

    ruta = root / "data" / "ops" / "recuperacion_historica.json"
    hist: List[Dict[str, Any]] = []
    if ruta.exists():
        try:
            hist = json.loads(ruta.read_text(encoding="utf-8"))
        except Exception:
            hist = []
    hist.append(resumen)
    ruta.write_text(json.dumps(hist[-200:], ensure_ascii=False, indent=2), encoding="utf-8")
    return resumen


if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    p = argparse.ArgumentParser(description="Recuperación retroactiva de series históricas (RF-SEM-08)")
    p.add_argument("--fuentes", nargs="*", help="NOAA XM IDEAM UNGRD FIRMS (por defecto todas)")
    a = p.parse_args()
    r = recuperar_historico(fuentes=a.fuentes, on_paso=lambda n, e, m: print(f"  [{e:^12}] {n}: {m}", flush=True))
    for n, d in r["fuentes"].items():
        print(f"{n:18} {d['estado']:12} {d.get('duracion_s', '')}s  {d['mensaje'][:140]}")
