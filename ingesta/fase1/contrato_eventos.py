"""
Contrato de eventos de respuesta e impacto, capa R (Fase 1)
Proyecto: Vigía El Niño · Acueductos (CRA)

Una sola estructura recibe lo que entreguen UNGRD (carrotanques, calamidades),
MinVivienda (Survey123: racionamiento/desabastecimiento), Superservicios
(reportes de racionamiento de prestadores) o una verificación de la CRA.
Se carga por RF-ING-06 como data/bronce/fte_ungrd_mvct/eventos_respuesta_*.csv.

Contrato eventos_respuesta_v1 (CSV UTF-8):
    divipola        5 dígitos DANE                                   obligatorio
    indicador       R-2 | R-3 | R-4                                  obligatorio
    estado          activo | sin_evento                              obligatorio
    fecha_reporte   AAAA-MM-DD (cuándo la entidad lo reportó/verificó) obligatorio
    fecha_inicio    AAAA-MM-DD                                       obligatorio si activo
    fecha_fin       AAAA-MM-DD (vacío = sigue vigente)
    entidad         UNGRD | MinVivienda | Superservicios | CRA | Gobernación | Alcaldía   obligatorio
    soporte         número del acto o URL del reporte                obligatorio si activo
    poblacion_afectada  entero >= 0

Reglas (specs/indicadores.md, ADR-0006, RF-IND-04):
- «activo» sin soporte se rechaza: solo se dice «sí» con soporte.
- R-2 y R-4: valen 1 si hay un evento activo que cubre la fecha de corte.
- R-3: vale 1 si hay un reporte activo con fecha_reporte en los últimos 30 días.
- «sin_evento» vale 0 solo si fue reportado en los últimos 30 días y no hay activo.
- Sin registro: None (sin_dato). No estar en la lista no prueba ausencia.
"""

import csv
import io
import re
from datetime import date, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

VERSION_CONTRATO = "eventos_respuesta_v1"
INDICADORES = ("R-2", "R-3", "R-4")
ENTIDADES = {"UNGRD", "MinVivienda", "Superservicios", "CRA", "Gobernación", "Alcaldía"}
VENTANA_DIAS = 30
FECHA = re.compile(r"\d{4}-\d{2}-\d{2}")


def _fecha(v: Any) -> Optional[date]:
    v = str(v or "").strip()
    if not v:
        return None
    if not FECHA.fullmatch(v):
        raise ValueError(v)
    return date.fromisoformat(v)


def leer_csv(texto: str) -> List[Dict[str, str]]:
    lector = csv.DictReader(io.StringIO(texto.lstrip("﻿")))
    faltan = [c for c in ("divipola", "indicador", "estado", "fecha_reporte", "entidad") if c not in (lector.fieldnames or [])]
    if faltan:
        raise ValueError(f"El archivo no cumple el contrato {VERSION_CONTRATO}: faltan columnas {faltan}")
    return list(lector)


def validar(filas: Iterable[Dict[str, str]], divipolas_validas: set) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    validas, rechazos = [], []
    for i, f in enumerate(filas, start=2):
        motivos = []
        div = str(f.get("divipola") or "").strip().zfill(5)
        if div not in divipolas_validas:
            motivos.append(f"divipola {div} no está en la DIVIPOLA")
        ind = str(f.get("indicador") or "").strip().upper()
        if ind not in INDICADORES:
            motivos.append(f"indicador '{ind}' no es R-2, R-3 ni R-4")
        estado = str(f.get("estado") or "").strip().lower()
        if estado not in ("activo", "sin_evento"):
            motivos.append(f"estado '{estado}' no válido")
        entidad = str(f.get("entidad") or "").strip()
        if entidad not in ENTIDADES:
            motivos.append(f"entidad '{entidad}' no reconocida")
        fechas = {}
        for c in ("fecha_reporte", "fecha_inicio", "fecha_fin"):
            try:
                fechas[c] = _fecha(f.get(c))
            except ValueError:
                motivos.append(f"{c} no es AAAA-MM-DD")
                fechas[c] = None
        if fechas.get("fecha_reporte") is None and "fecha_reporte no es AAAA-MM-DD" not in motivos:
            motivos.append("fecha_reporte vacía")
        soporte = str(f.get("soporte") or "").strip()
        if estado == "activo":
            if not soporte:
                motivos.append("evento activo sin soporte (ADR-0006)")
            if fechas.get("fecha_inicio") is None:
                motivos.append("evento activo sin fecha_inicio")
        if fechas.get("fecha_inicio") and fechas.get("fecha_fin") and fechas["fecha_fin"] < fechas["fecha_inicio"]:
            motivos.append("fecha_fin anterior a fecha_inicio")
        pob = str(f.get("poblacion_afectada") or "").strip()
        if motivos:
            rechazos.append({"linea": i, "divipola": div, "indicador": ind, "motivos": motivos})
            continue
        validas.append({"divipola": div, "indicador": ind, "estado": estado, "entidad": entidad,
                        "soporte": soporte or None, "poblacion_afectada": int(pob) if pob.isdigit() else None,
                        **fechas})
    return validas, rechazos


def _cubre(ev: Dict[str, Any], corte: date) -> bool:
    return ev["fecha_inicio"] <= corte and (ev["fecha_fin"] is None or ev["fecha_fin"] >= corte)


def evaluar(eventos: List[Dict[str, Any]], corte: date) -> Dict[str, Dict[str, Dict[str, Any]]]:
    """{divipola: {indicador: {valor, soporte, entidad, fecha_dato}}} para la fecha de corte."""
    desde = corte - timedelta(days=VENTANA_DIAS)
    res: Dict[str, Dict[str, Dict[str, Any]]] = {}
    por_llave: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
    for ev in eventos:
        if ev["fecha_reporte"] <= corte:          # nada del futuro respecto al corte
            por_llave.setdefault((ev["divipola"], ev["indicador"]), []).append(ev)
    for (div, ind), evs in por_llave.items():
        if ind == "R-3":
            activos = [e for e in evs if e["estado"] == "activo" and e["fecha_reporte"] >= desde
                       and (e["fecha_fin"] is None or e["fecha_fin"] >= desde)]
        else:
            activos = [e for e in evs if e["estado"] == "activo" and _cubre(e, corte)]
        sin_evento = [e for e in evs if e["estado"] == "sin_evento" and e["fecha_reporte"] >= desde]
        if activos:
            ev = max(activos, key=lambda e: e["fecha_reporte"])
            valor = 1
        elif sin_evento:
            ev = max(sin_evento, key=lambda e: e["fecha_reporte"])
            valor = 0
        else:
            continue                               # registro viejo: sigue siendo sin_dato
        res.setdefault(div, {})[ind] = {"valor": valor, "soporte": ev["soporte"], "entidad": ev["entidad"],
                                        "fecha_dato": ev["fecha_reporte"].isoformat(),
                                        "poblacion_afectada": ev.get("poblacion_afectada")}
    return res
