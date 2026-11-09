"""
Contrato del IRCA mensual (Fase 1, solicitud al INS / SIVICAP)
Proyecto: Vigía El Niño · Acueductos (CRA)

datos.gov.co (nxt2-39c3) publica el IRCA anual con ~1 año de rezago; la spec pide
el último IRCA mensual (S-2, periodo mensual). Con el contrato irca_mensual_v1 el
INS (o las secretarías de salud) entregan el dato mensual y Vigía lo prefiere al
anual cuando es más reciente.

Contrato irca_mensual_v1 (CSV UTF-8), cargado como data/bronce/fte_ins_irca/irca_mensual_*.csv:
    divipola      5 dígitos DANE     obligatorio
    periodo       AAAA-MM            obligatorio
    irca_urbano   0..100
    irca_rural    0..100
Al menos uno de los dos IRCA. Se usa el urbano y, si falta, el rural (misma regla del conector anual).
"""

import calendar
import csv
import io
import re
from typing import Any, Dict, List, Optional, Tuple

VERSION_CONTRATO = "irca_mensual_v1"


def _irca(v: Any) -> Optional[float]:
    v = str(v or "").strip().replace(",", ".")
    if not v or v.upper() == "ND":
        return None
    x = float(v)
    if not 0 <= x <= 100:
        raise ValueError(f"IRCA {x} fuera de 0..100")
    return x


def leer(texto: str, divipolas_validas: set) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, Any]]]:
    """Último periodo válido por municipio y rechazos con motivo."""
    lector = csv.DictReader(io.StringIO(texto.lstrip("﻿")))
    faltan = [c for c in ("divipola", "periodo") if c not in (lector.fieldnames or [])]
    if faltan:
        raise ValueError(f"El archivo no cumple el contrato {VERSION_CONTRATO}: faltan columnas {faltan}")
    ultimos: Dict[str, Dict[str, Any]] = {}
    rechazos: List[Dict[str, Any]] = []
    for i, f in enumerate(lector, start=2):
        div = str(f.get("divipola") or "").strip().zfill(5)
        periodo = str(f.get("periodo") or "").strip()
        motivos = []
        if div not in divipolas_validas:
            motivos.append(f"divipola {div} no está en la DIVIPOLA")
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", periodo):
            motivos.append("periodo no es AAAA-MM")
        try:
            urb, rur = _irca(f.get("irca_urbano")), _irca(f.get("irca_rural"))
        except ValueError as e:
            motivos.append(str(e))
            urb = rur = None
        if not motivos and urb is None and rur is None:
            motivos.append("sin IRCA urbano ni rural")
        if motivos:
            rechazos.append({"linea": i, "divipola": div, "motivos": motivos})
            continue
        if div not in ultimos or periodo > ultimos[div]["periodo"]:
            anio, mes = int(periodo[:4]), int(periodo[5:])
            ultimos[div] = {"periodo": periodo, "irca_urbano": urb, "irca_rural": rur,
                            "valor": urb if urb is not None else rur,
                            "fecha_dato": f"{periodo}-{calendar.monthrange(anio, mes)[1]:02d}"}
    return ultimos, rechazos
