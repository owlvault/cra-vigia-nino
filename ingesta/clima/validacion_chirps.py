"""
Validación de CHIRPS v3 contra las estaciones del IDEAM (Fase 0, compuerta de calidad)
Proyecto: Vigía El Niño · Acueductos (CRA)

Antes de usar CHIRPS como respaldo de A-3/A-4 hay que saber cuánto se parece a la
medición en tierra donde ambas existen. Este script compara, en la MISMA fecha de
corte (la última disponible en CHIRPS), los municipios que tienen valor por
estaciones IDEAM y por CHIRPS:

- lluvia observada 30 días (mm): sesgo (mediana de la razón), correlación, error;
- A-3 (anomalía %): correlación, error absoluto en puntos porcentuales y coincidencia
  del tramo de puntaje (mismos quiebres de parametros_icr.json);
- A-4 (días secos): coincidencia del tramo de puntaje.

Se estratifica por la forma en que IDEAM obtiene el valor: estación dentro del
municipio vs. IDW con estaciones vecinas (hasta 50 km).

Uso:
    python -m ingesta.clima.validacion_chirps <bronce_ideam.json> <datos_chirps.json> [salida.json]
"""

import json
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]


def puntaje(valor: float, quiebres: List[List[float]]) -> float:
    """Misma interpolación por tramos que PipelineCorte.normalizar_tramos (RF-ICR-01)."""
    asc = sorted(quiebres, key=lambda p: p[0])
    if valor <= asc[0][0]:
        return float(asc[0][1])
    if valor >= asc[-1][0]:
        return float(asc[-1][1])
    for (x0, y0), (x1, y1) in zip(asc, asc[1:]):
        if x0 <= valor <= x1:
            return y0 + (valor - x0) / (x1 - x0) * (y1 - y0)
    return float(asc[-1][1])


def tramo(valor: Optional[float], quiebres: List[List[float]]) -> Optional[int]:
    """Banda de puntaje de 25 puntos (0: 0-25 ... 3: 75-100), la granularidad que mueve el ICR."""
    if valor is None:
        return None
    return min(int(puntaje(valor, quiebres) // 25), 3)


def _corr(x: np.ndarray, y: np.ndarray) -> Optional[float]:
    if len(x) < 3 or np.std(x) == 0 or np.std(y) == 0:
        return None
    return round(float(np.corrcoef(x, y)[0, 1]), 3)


def _spearman(x: np.ndarray, y: np.ndarray) -> Optional[float]:
    if len(x) < 3:
        return None
    rx = np.argsort(np.argsort(x)).astype(float)
    ry = np.argsort(np.argsort(y)).astype(float)
    return _corr(rx, ry)


def metricas(pares: List[Dict[str, Any]], q_a3: List[List[float]], q_a4: List[List[float]]) -> Dict[str, Any]:
    res: Dict[str, Any] = {"n_municipios": len(pares)}
    ll = [(p["ideam_mm"], p["chirps_mm"]) for p in pares if p["ideam_mm"] is not None and p["chirps_mm"] is not None]
    if ll:
        x, y = np.array([a for a, _ in ll]), np.array([b for _, b in ll])
        positivos = x > 5
        res["lluvia_30d"] = {
            "n": len(ll),
            "correlacion_pearson": _corr(x, y), "correlacion_spearman": _spearman(x, y),
            "error_absoluto_mediano_mm": round(float(np.median(np.abs(y - x))), 1),
            "razon_mediana_chirps_sobre_ideam": round(float(np.median(y[positivos] / x[positivos])), 2) if positivos.any() else None,
        }
    a3 = [(p["ideam_a3"], p["chirps_a3"]) for p in pares if p["ideam_a3"] is not None and p["chirps_a3"] is not None]
    if a3:
        x, y = np.array([a for a, _ in a3]), np.array([b for _, b in a3])
        tx = [tramo(v, q_a3) for v in x]
        ty = [tramo(v, q_a3) for v in y]
        res["a3_anomalia"] = {
            "n": len(a3),
            "correlacion_pearson": _corr(x, y), "correlacion_spearman": _spearman(x, y),
            "error_absoluto_mediano_pp": round(float(np.median(np.abs(y - x))), 1),
            "sesgo_mediano_pp": round(float(np.median(y - x)), 1),
            "mismo_tramo_pct": round(100 * float(np.mean([a == b for a, b in zip(tx, ty)])), 1),
            "tramo_mas_menos_1_pct": round(100 * float(np.mean([abs(a - b) <= 1 for a, b in zip(tx, ty)])), 1),
        }
    a4 = [(p["ideam_a4"], p["chirps_a4"]) for p in pares if p["ideam_a4"] is not None and p["chirps_a4"] is not None]
    if a4:
        tx = [tramo(a, q_a4) for a, _ in a4]
        ty = [tramo(b, q_a4) for _, b in a4]
        dif = np.array([b - a for a, b in a4], dtype=float)
        res["a4_dias_secos"] = {
            "n": len(a4),
            "error_absoluto_mediano_dias": round(float(np.median(np.abs(dif))), 1),
            "sesgo_mediano_dias": round(float(np.median(dif)), 1),
            "mismo_tramo_pct": round(100 * float(np.mean([a == b for a, b in zip(tx, ty)])), 1),
            "tramo_mas_menos_1_pct": round(100 * float(np.mean([abs(a - b) <= 1 for a, b in zip(tx, ty)])), 1),
        }
    return res


def validar(ruta_bronce_ideam: Path, datos_chirps: Dict[str, Any], base_dir: Path = RAIZ) -> Dict[str, Any]:
    from ingesta.conectores.conector_ideam import ConectorIDEAM

    snap = json.loads(Path(ruta_bronce_ideam).read_text(encoding="utf-8"))
    crudo = snap["crudo"]
    diarios: Dict[str, Dict[date, tuple]] = {}
    for cod, dia, mm, n in crudo["diarios"]:
        diarios.setdefault(cod, {})[date.fromisoformat(dia)] = (mm, n)
    normales = crudo["normales_1991_2020"]

    fechas = sorted({d["fecha_dato"] for d in datos_chirps.values() if d.get("fecha_dato")})
    if not fechas:
        raise ValueError("CHIRPS no trae fecha de dato")
    fecha = date.fromisoformat(max(fechas, key=lambda f: sum(1 for d in datos_chirps.values() if d.get("fecha_dato") == f)))

    con = ConectorIDEAM(base_dir=str(base_dir))
    icr = json.loads((base_dir / "data" / "config" / "parametros_icr.json").read_text(encoding="utf-8"))
    q_a3, q_a4 = icr["quiebres"]["A-3"], icr["quiebres"]["A-4"]

    pares: List[Dict[str, Any]] = []
    for m in con.territorio:
        div = m["divipola"]
        ch = datos_chirps.get(div, {})
        if ch.get("fecha_dato") != fecha.isoformat():
            continue
        ide = con.calcular_municipio(div, diarios, normales, fecha)
        if ide["fecha_dato"] != fecha.isoformat():
            continue   # sin dato IDEAM ese día: no hay con qué comparar
        asign = con.estaciones["municipios"][div]["automaticas"]
        pares.append({
            "divipola": div, "estrato": "estacion_dentro" if asign["dentro"] else "idw_vecinas",
            "ideam_mm": ide["lluvia_30d_mm"], "chirps_mm": ch.get("lluvia_30d_mm"),
            "ideam_a3": ide["a3"], "chirps_a3": ch.get("indicador_a3_anomalia_precip_pct"),
            "ideam_a4": ide["a4"], "chirps_a4": ch.get("indicador_a4_dias_sin_lluvia"),
            "ideam_normal_mm": ide["normal_30d_mm"], "chirps_normal_mm": ch.get("normal_30d_mm"),
        })

    normal_pares = [(p["ideam_normal_mm"], p["chirps_normal_mm"]) for p in pares
                    if p["ideam_normal_mm"] and p["chirps_normal_mm"]]
    return {
        "descripcion": "Concordancia CHIRPS v3 vs estaciones IDEAM en la misma fecha de corte (Fase 0).",
        "fecha_comparada": fecha.isoformat(),
        "bronce_ideam": Path(ruta_bronce_ideam).name,
        "global": metricas(pares, q_a3, q_a4),
        "por_estrato": {e: metricas([p for p in pares if p["estrato"] == e], q_a3, q_a4)
                        for e in ("estacion_dentro", "idw_vecinas")},
        "normal_30d": {
            "n": len(normal_pares),
            "razon_mediana_chirps_sobre_ideam": round(float(np.median([b / a for a, b in normal_pares])), 2) if normal_pares else None,
        },
        "pares": pares,
    }


if __name__ == "__main__":
    bronce, datos = Path(sys.argv[1]), json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    r = validar(bronce, datos)
    salida = Path(sys.argv[3]) if len(sys.argv) > 3 else RAIZ / "data" / "ops" / f"validacion_chirps_{r['fecha_comparada']}.json"
    salida.write_text(json.dumps(r, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in r.items() if k != "pares"}, indent=1, ensure_ascii=False))
