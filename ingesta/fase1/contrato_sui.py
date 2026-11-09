"""
Contrato de datos SUI por APS y agregación municipal (Fase 1, convenio CRA–SSPD)
Proyecto: Vigía El Niño · Acueductos (CRA)

El esquema interno de la bodega del SUI no es público. En lugar de depender de
nombres de tablas supuestos, la CRA pide a la SSPD un extracto con este contrato
(una fila por prestador × APS × periodo) y Vigía lo valida y lo agrega al municipio.

Contrato v1 (CSV UTF-8, separador coma, encabezado obligatorio):
    periodo                         AAAA-MM                      obligatorio
    id_prestador                    código RUPS                  obligatorio
    id_aps                          código del APS               obligatorio
    divipola                        5 dígitos DANE               obligatorio
    suscriptores_total              entero >= 0                  obligatorio (ponderador RF-TER-03)
    suscriptores_residenciales      entero >= 0
    suscriptores_residenciales_urbanos entero >= 0
    horas_continuidad_dia           0..24                        S-1
    volumen_producido_m3            >= 0                         S-4 (IANC volumétrico)
    volumen_facturado_m3            >= 0                         S-4
    ianc_pct                        0..100                       S-4 si no hay volúmenes
    consumo_residencial_m3          >= 0                         S-6
    pqr_falta_servicio_mes          entero >= 0                  S-5
    pqr_falta_servicio_mes_anio_anterior entero >= 0             S-5
    capacidad_almacenamiento_m3     >= 0                         H-4
    demanda_media_m3_h              > 0                          H-4
    pec_reportado_vigente           0 | 1                        R-1

Celda vacía = sin dato (nunca se asume 0). Las filas inválidas se rechazan con su
motivo; el resto sigue (specs/calidad-datos.md).
"""

import csv
import io
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple

VERSION_CONTRATO = "sui_aps_v1"

OBLIGATORIOS = ("periodo", "id_prestador", "id_aps", "divipola", "suscriptores_total")
RANGOS: Dict[str, Tuple[float, Optional[float]]] = {
    "suscriptores_total": (0, None), "suscriptores_residenciales": (0, None),
    "suscriptores_residenciales_urbanos": (0, None), "horas_continuidad_dia": (0, 24),
    "volumen_producido_m3": (0, None), "volumen_facturado_m3": (0, None), "ianc_pct": (0, 100),
    "consumo_residencial_m3": (0, None), "pqr_falta_servicio_mes": (0, None),
    "pqr_falta_servicio_mes_anio_anterior": (0, None), "capacidad_almacenamiento_m3": (0, None),
    "demanda_media_m3_h": (0, None), "pec_reportado_vigente": (0, 1),
}
COLUMNAS = OBLIGATORIOS + tuple(c for c in RANGOS if c not in OBLIGATORIOS)


def _num(v: Any) -> Optional[float]:
    if v is None or str(v).strip() == "":
        return None
    return float(str(v).strip().replace(",", "."))


def validar_filas(filas: Iterable[Dict[str, str]], divipolas_validas: set) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Devuelve (filas válidas tipadas, rechazos con motivo)."""
    validas: List[Dict[str, Any]] = []
    rechazos: List[Dict[str, Any]] = []
    vistos = set()
    for i, f in enumerate(filas, start=2):          # línea 1 = encabezado
        motivos = []
        for c in OBLIGATORIOS:
            if not str(f.get(c) or "").strip():
                motivos.append(f"{c} vacío")
        periodo = str(f.get("periodo") or "").strip()
        if periodo and not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", periodo):
            motivos.append("periodo no es AAAA-MM")
        div = str(f.get("divipola") or "").strip().zfill(5)
        if f.get("divipola") and div not in divipolas_validas:
            motivos.append(f"divipola {div} no está en la DIVIPOLA")
        fila: Dict[str, Any] = {"periodo": periodo, "id_prestador": str(f.get("id_prestador") or "").strip(),
                                "id_aps": str(f.get("id_aps") or "").strip(), "divipola": div}
        for c, (lo, hi) in RANGOS.items():
            try:
                v = _num(f.get(c))
            except ValueError:
                motivos.append(f"{c} no numérico")
                continue
            if v is not None and (v < lo or (hi is not None and v > hi)):
                motivos.append(f"{c}={v} fuera de rango")
            fila[c] = v
        if fila.get("demanda_media_m3_h") == 0:
            fila["demanda_media_m3_h"] = None        # demanda 0 no define autonomía
        llave = (fila["periodo"], fila["id_prestador"], fila["id_aps"])
        if not motivos and llave in vistos:
            motivos.append("fila duplicada (periodo, prestador, APS)")
        if motivos:
            rechazos.append({"linea": i, "llave": "|".join(llave), "motivos": motivos})
        else:
            vistos.add(llave)
            validas.append(fila)
    return validas, rechazos


def leer_csv(texto: str) -> List[Dict[str, str]]:
    lector = csv.DictReader(io.StringIO(texto.lstrip("﻿")))
    faltan = [c for c in OBLIGATORIOS if c not in (lector.fieldnames or [])]
    if faltan:
        raise ValueError(f"El extracto no cumple el contrato {VERSION_CONTRATO}: faltan columnas {faltan}")
    return list(lector)


def _ponderado(filas: List[Dict[str, Any]], campo: str) -> Optional[float]:
    pares = [(f[campo], f["suscriptores_total"]) for f in filas if f.get(campo) is not None]
    peso = sum(max(w, 1) for _, w in pares)
    return round(sum(v * max(w, 1) for v, w in pares) / peso, 2) if pares else None


def _suma(filas: List[Dict[str, Any]], campo: str) -> Optional[float]:
    vals = [f[campo] for f in filas if f.get(campo) is not None]
    return sum(vals) if vals else None


def agregar_municipio(filas: List[Dict[str, Any]], hogares_urbanos: Optional[float] = None) -> Dict[str, Any]:
    """Indicadores municipales a partir de las filas APS de un mismo municipio y periodo."""
    # S-1: RF-TER-03, ponderado por suscriptores
    s1 = _ponderado(filas, "horas_continuidad_dia")

    # S-4: volumétrico si todas las filas con volumen traen ambos; si no, ponderado del IANC reportado
    con_vol = [f for f in filas if f.get("volumen_producido_m3") and f.get("volumen_facturado_m3") is not None]
    if con_vol:
        prod = sum(f["volumen_producido_m3"] for f in con_vol)
        fact = sum(f["volumen_facturado_m3"] for f in con_vol)
        s4 = round(max(prod - fact, 0) / prod * 100, 1) if prod else None
    else:
        s4 = _ponderado(filas, "ianc_pct")

    # S-5: suma municipal de PQR, casos borde de specs/indicadores.md
    pares = [f for f in filas if f.get("pqr_falta_servicio_mes") is not None
             and f.get("pqr_falta_servicio_mes_anio_anterior") is not None]
    s5 = None
    if pares:
        actual = sum(f["pqr_falta_servicio_mes"] for f in pares)
        previo = sum(f["pqr_falta_servicio_mes_anio_anterior"] for f in pares)
        s5 = round((actual - previo) / previo * 100, 1) if previo else (300.0 if actual > 0 else 0.0)

    # S-6: consumo residencial por suscriptor residencial
    cons, susc = _suma(filas, "consumo_residencial_m3"), _suma(filas, "suscriptores_residenciales")
    s6 = round(cons / susc, 2) if cons is not None and susc else None

    # S-3: requiere hogares urbanos del DANE (no viene del SUI)
    s3 = None
    urb = _suma(filas, "suscriptores_residenciales_urbanos")
    if urb is not None and hogares_urbanos:
        s3 = round(min(urb / hogares_urbanos * 100, 100.0), 1)

    # H-4: almacenamiento del sistema municipal / demanda horaria media
    pares_h4 = [f for f in filas if f.get("capacidad_almacenamiento_m3") is not None and f.get("demanda_media_m3_h")]
    h4 = (round(sum(f["capacidad_almacenamiento_m3"] for f in pares_h4) /
                sum(f["demanda_media_m3_h"] for f in pares_h4), 1) if pares_h4 else None)

    # R-1: 1 si todos los prestadores reportan PEC vigente; 0 si alguno no; desconocido si falta alguno
    def estado(vals: List[Optional[float]]) -> Optional[int]:
        if any(v == 0 for v in vals):
            return 0
        return 1 if vals and all(v == 1 for v in vals) else None

    por_prestador: Dict[str, List[Optional[float]]] = {}
    for f in filas:
        por_prestador.setdefault(f["id_prestador"], []).append(f.get("pec_reportado_vigente"))
    pec = {p: estado(v) for p, v in por_prestador.items()}
    r1 = estado(list(pec.values()))

    return {"s1_cont": s1, "s3_cob": s3, "s4_ianc": s4, "s5_pqr": s5, "s6_consumo_m3": s6,
            "h4_autonomia_h": h4, "r1_pec": r1,
            "prestadores": len(pec), "aps": len({f["id_aps"] for f in filas})}


def agregar_nacional(validas: List[Dict[str, Any]], hogares_urbanos: Optional[Dict[str, float]] = None
                     ) -> Tuple[Optional[str], Dict[str, Dict[str, Any]]]:
    """
    Usa el periodo más reciente del extracto y agrega por municipio.
    Devuelve (periodo, {divipola: indicadores}).
    """
    if not validas:
        return None, {}
    periodo = max(f["periodo"] for f in validas)
    por_mun: Dict[str, List[Dict[str, Any]]] = {}
    for f in validas:
        if f["periodo"] == periodo:
            por_mun.setdefault(f["divipola"], []).append(f)
    hogares_urbanos = hogares_urbanos or {}
    return periodo, {d: agregar_municipio(fs, hogares_urbanos.get(d)) for d, fs in por_mun.items()}
