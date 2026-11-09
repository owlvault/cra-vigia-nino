"""
Precipitación municipal, A-3 y A-4 a partir de estaciones del IDEAM (funciones puras, sin I/O)
Proyecto: Vigía El Niño · Acueductos (CRA)

- RF-TER-04: lluvia municipal diaria = promedio de las estaciones dentro del
  municipio con dato válido ese día; si no hay ninguna, IDW (1/d²) de las 3
  estaciones válidas más cercanas en 50 km; si no hay 3, sin_dato.
- A-4: días consecutivos hasta la fecha del dato con lluvia municipal < 1 mm.
- A-3: (lluvia 30 d − línea base 30 d) / línea base × 100, con línea base de las
  normales 1991-2020 prorrateadas por días (ASUNCIÓN en parametros_ideam.json).

Ningún valor ausente se rellena: sin dato suficiente, el resultado es None.
"""

import calendar
import math
from datetime import date, timedelta
from typing import Dict, Iterable, List, Optional, Tuple

MESES_NORMAL = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distancia de gran círculo (haversine)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def valor_municipal(valores_dentro: List[float],
                    cercanas: List[Tuple[float, float]],
                    n_idw: int, potencia: float) -> Tuple[Optional[float], str]:
    """
    RF-TER-04 para un día (o para una normal).
    valores_dentro: valores válidos de estaciones dentro del municipio.
    cercanas: (distancia_km, valor) de estaciones válidas dentro del radio, sin las de adentro.
    Devuelve (valor, método) con método 'estaciones_municipio', 'idw' o 'sin_dato'.
    """
    if valores_dentro:
        return sum(valores_dentro) / len(valores_dentro), "estaciones_municipio"
    vecinas = sorted(cercanas)[:n_idw]
    if len(vecinas) < n_idw:
        return None, "sin_dato"
    if any(d == 0 for d, _ in vecinas):
        return next(v for d, v in vecinas if d == 0), "idw"
    pesos = [1 / d ** potencia for d, _ in vecinas]
    return sum(p * v for p, (_, v) in zip(pesos, vecinas)) / sum(pesos), "idw"


def serie_municipal(diarios: Dict[str, Dict[date, Tuple[float, int]]],
                    dentro: Iterable[str], cercanas: Dict[str, float],
                    dias: List[date], min_registros: int,
                    n_idw: int, potencia: float, max_registros: Optional[int] = None) -> Dict[date, Optional[float]]:
    """
    diarios: {estación: {día: (mm, n_registros)}}.
    Un día de estación es válido si min_registros <= n_registros <= max_registros:
    menos registros subestima la lluvia; más indica duplicados u otra resolución
    y la sobrestima. En ambos casos el día de esa estación se descarta.
    """
    dentro = set(dentro)
    tope = max_registros if max_registros is not None else float("inf")

    def valido(e: str, dia: date) -> bool:
        return dia in diarios.get(e, {}) and min_registros <= diarios[e][dia][1] <= tope

    serie: Dict[date, Optional[float]] = {}
    for dia in dias:
        val_dentro = [diarios[e][dia][0] for e in dentro if valido(e, dia)]
        val_cerca = [(dist, diarios[e][dia][0]) for e, dist in cercanas.items()
                     if e not in dentro and valido(e, dia)]
        serie[dia], _ = valor_municipal(val_dentro, val_cerca, n_idw, potencia)
    return serie


def ultimo_dia_con_dato(serie: Dict[date, Optional[float]], hasta: date, max_atraso: int) -> Optional[date]:
    """Último día con valor municipal, a lo sumo max_atraso días antes de 'hasta'."""
    for k in range(max_atraso + 1):
        d = hasta - timedelta(days=k)
        if serie.get(d) is not None:
            return d
    return None


def dias_consecutivos_secos(serie: Dict[date, Optional[float]], fin: date, umbral_mm: float) -> Tuple[int, bool]:
    """
    A-4: días seguidos hacia atrás desde 'fin' con lluvia < umbral.
    Devuelve (días, es_cota_inferior): cota inferior si el conteo se detuvo en un
    día sin dato o al llegar al inicio de la serie, no en un día con lluvia.
    """
    dias = 0
    d = fin
    while d in serie:
        v = serie[d]
        if v is None:
            return dias, True
        if v >= umbral_mm:
            return dias, False
        dias += 1
        d -= timedelta(days=1)
    return dias, True


def normal_ventana(normal_mensual: Dict[str, float], fin: date, n_dias: int) -> Optional[float]:
    """
    Línea base prorrateada: suma, para cada día de la ventana, la normal del mes
    dividida por los días del mes. Mes sin normal => None.
    """
    total = 0.0
    for k in range(n_dias):
        d = fin - timedelta(days=k)
        mensual = normal_mensual.get(MESES_NORMAL[d.month - 1])
        if mensual is None:
            return None
        total += mensual / calendar.monthrange(d.year, d.month)[1]
    return total


def anomalia_30d(serie: Dict[date, Optional[float]], fin: date, n_dias: int, min_validos: int,
                 base_mm: Optional[float]) -> Tuple[Optional[float], Optional[float], int]:
    """
    A-3: (observada − base) / base × 100. Devuelve (anomalía %, lluvia observada, días válidos).
    Menos de min_validos días con dato, o base nula o cero => anomalía None.
    """
    valores = [serie.get(fin - timedelta(days=k)) for k in range(n_dias)]
    validos = [v for v in valores if v is not None]
    if len(validos) < min_validos or not base_mm:
        return None, (sum(validos) if validos else None), len(validos)
    # Días faltantes (permitidos hasta el mínimo) se completan con la media observada de la ventana
    observada = sum(validos) * n_dias / len(validos)
    return round((observada - base_mm) / base_mm * 100, 1), round(observada, 1), len(validos)


def estaciones_inconsistentes(diarios: Dict[str, Dict[date, Tuple[float, int]]],
                              municipio_de_estacion: Dict[str, str],
                              referencia: Dict[date, Dict[str, Optional[float]]],
                              dias: List[date], min_registros: int, max_registros: int,
                              min_dias_validos: int, min_referencia_mm: float,
                              fraccion_maxima: float) -> Dict[str, Dict[str, float]]:
    """
    Control de calidad (Fase 0): estación cuyo total en la ventana es menor que
    'fraccion_maxima' de la lluvia de referencia de su municipio (CHIRPS), cuando la
    referencia supera 'min_referencia_mm'. Detecta sensores que transmiten ceros con
    registros completos (p. ej. 0 mm en dos meses en Condoto). Una sequía real no se
    descarta: la referencia independiente también la mostraría seca.
    Devuelve {estación: {"estacion_mm", "referencia_mm", "dias_validos"}}.
    """
    sospechosas: Dict[str, Dict[str, float]] = {}
    for cod, serie in diarios.items():
        div = municipio_de_estacion.get(cod)
        if div is None:
            continue
        validos = [d for d in dias if d in serie and min_registros <= serie[d][1] <= max_registros
                   and referencia.get(d, {}).get(div) is not None]
        if len(validos) < min_dias_validos:
            continue
        s_est = sum(serie[d][0] for d in validos)
        s_ref = sum(referencia[d][div] for d in validos)
        if s_ref >= min_referencia_mm and s_est < fraccion_maxima * s_ref:
            sospechosas[cod] = {"estacion_mm": round(s_est, 1), "referencia_mm": round(s_ref, 1),
                                "dias_validos": len(validos)}
    return sospechosas
