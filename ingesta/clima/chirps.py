"""
Precipitación municipal desde CHIRPS v3.0 (respaldo satelital nacional, Fase 0)
Proyecto: Vigía El Niño · Acueductos (CRA)

Lee solo la ventana de Colombia de cada ráster (lectura remota por rangos HTTP con
GDAL /vsicurl/, sin descargar el archivo global) y agrega por municipio:
- media de los píxeles con centro dentro del polígono municipal del IDEAM;
- si ninguno (municipio menor que un píxel), los píxeles que el polígono toca;
- si no hay polígono (municipio creado después de la capa), el píxel de la cabecera.

Las funciones de agregación son puras (numpy) y se prueban sin red.
"""

import json
import logging
import re
import time
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger("CHIRPS")

METODO_CENTRO = "pixeles_centro_en_poligono"
METODO_TOCA = "pixeles_que_toca_el_poligono"
METODO_CABECERA = "pixel_de_la_cabecera"

Rejilla = Dict[str, Tuple[np.ndarray, np.ndarray, str]]   # div -> (filas, columnas, método)


# ------------------------------------------------------------------ rejilla
def construir_rejilla(transform: Any, forma: Tuple[int, int], municipios: List[Dict[str, Any]],
                      poligonos: Dict[str, Dict[str, Any]]) -> Rejilla:
    """Índices de píxel por municipio para una ventana (transform afín + forma)."""
    from rasterio.features import geometry_mask
    from rasterio.transform import rowcol

    rejilla: Rejilla = {}
    for m in municipios:
        div = m["divipola"]
        geom = poligonos.get(div)
        filas = cols = np.empty(0, dtype=int)
        metodo = METODO_CENTRO
        if geom is not None:
            dentro = ~geometry_mask([geom], out_shape=forma, transform=transform, all_touched=False)
            if not dentro.any():
                dentro = ~geometry_mask([geom], out_shape=forma, transform=transform, all_touched=True)
                metodo = METODO_TOCA
            filas, cols = np.nonzero(dentro)
        if filas.size == 0 and m.get("lat") is not None and m.get("lon") is not None:
            f, c = rowcol(transform, m["lon"], m["lat"])
            if 0 <= f < forma[0] and 0 <= c < forma[1]:
                filas, cols = np.array([f]), np.array([c])
                metodo = METODO_CABECERA
        rejilla[div] = (filas, cols, metodo)
    return rejilla


def promedios_municipales(arr: np.ndarray, rejilla: Rejilla) -> Dict[str, Optional[float]]:
    """Media por municipio de los píxeles válidos (NaN = sin dato); sin píxel válido => None."""
    res: Dict[str, Optional[float]] = {}
    for div, (filas, cols, _) in rejilla.items():
        if filas.size == 0:
            res[div] = None
            continue
        vals = arr[filas, cols]
        vals = vals[~np.isnan(vals)]
        res[div] = round(float(vals.mean()), 2) if vals.size else None
    return res


# -------------------------------------------------------------------- lectura
def leer_ventana(url: str, ventana: Dict[str, float]) -> Tuple[np.ndarray, Any]:
    """
    Ventana de Colombia de un GeoTIFF remoto. Valores negativos (océano / sin dato
    en CHIRPS) se convierten en NaN. Devuelve (arreglo float32, transform de la ventana).
    """
    import rasterio
    from rasterio.windows import from_bounds

    with rasterio.Env(GDAL_HTTP_USERAGENT="CRA-VigiaNino/1.0", GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
                      CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif", GDAL_HTTP_MAX_RETRY="3", GDAL_HTTP_RETRY_DELAY="5"):
        with rasterio.open(f"/vsicurl/{url}") as ds:
            win = from_bounds(ventana["lon_min"], ventana["lat_min"], ventana["lon_max"], ventana["lat_max"],
                              ds.transform).round_offsets().round_lengths()
            arr = ds.read(1, window=win).astype("float32")
            transform = ds.window_transform(win)
    arr[arr < 0] = np.nan
    return arr, transform


ESPERAS_REINTENTO_S = (60, 120, 240)


def leer_ventana_con_reintento(url: str, ventana: Dict[str, float],
                               esperas: Tuple[int, ...] = ESPERAS_REINTENTO_S) -> Tuple[np.ndarray, Any]:
    """
    leer_ventana con retroceso largo: el servidor del CHC responde 429 (demasiadas
    solicitudes) tras ráfagas de lecturas; los reintentos cortos de GDAL no bastan.
    """
    for i, espera in enumerate((0,) + tuple(esperas)):
        if espera:
            logger.warning(f"Reintento {i}/{len(esperas)} de {url.rsplit('/', 1)[-1]} en {espera} s")
            time.sleep(espera)
        try:
            return leer_ventana(url, ventana)
        except Exception as e:  # noqa: BLE001 — se reintenta y luego se propaga
            ultimo = e
    raise ConnectionError(f"No se pudo leer {url} tras {len(esperas)} reintentos: {ultimo}")


def listar_archivos(url_directorio: str) -> List[str]:
    req = urllib.request.Request(url_directorio, headers={"User-Agent": "CRA-VigiaNino/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        html = r.read().decode("utf-8", errors="replace")
    return sorted(set(re.findall(r'chirps-v3\.0\.[a-z]+\.\d{4}\.\d{2}\.\d{2}\.tif', html)))


def disponibilidad(conf: Dict[str, Any], anios: List[int]) -> Dict[date, Tuple[str, str]]:
    """{día: (versión, url)}; la versión final reemplaza a la preliminar cuando existe."""
    f = conf["fuentes"]
    disp: Dict[date, Tuple[str, str]] = {}
    for version, clave in (("prelim", "diario_prelim"), ("final", "diario_final")):
        for anio in anios:
            base = f[clave].format(anio=anio)
            try:
                nombres = listar_archivos(base)
            except Exception as e:  # noqa: BLE001 — un año sin carpeta no es error
                logger.info(f"Sin listado {base}: {e}")
                continue
            for n in nombres:
                y, mth, d = (int(x) for x in n.split(".")[-4:-1])
                disp[date(y, mth, d)] = (version, base + n)
    return disp


# --------------------------------------------------------- normal 1991-2020
MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def construir_normales(base_dir: Path) -> Dict[str, Any]:
    """
    Normal mensual 1991-2020 por municipio desde CHIRPS v3 mensual (Latinoamérica).
    360 lecturas de ventana; se ejecuta una vez y se guarda en data/config/normales_chirps.json.
    """
    from ingesta.territorio.geometrias_ideam import poligonos_municipales

    cfg = base_dir / "data" / "config"
    conf = json.loads((cfg / "parametros_chirps.json").read_text(encoding="utf-8"))
    municipios = json.loads((cfg / "territorio_municipios.json").read_text(encoding="utf-8"))["municipios"]
    poligonos = poligonos_municipales(base_dir)
    p = conf["precipitacion"]
    a0, a1 = p["periodo_normal"]

    # Punto de control: promedio municipal de cada mes leído (zona plata, reproducible).
    # Si el servidor corta la sesión (429), la siguiente ejecución retoma donde iba.
    ruta_ctrl = base_dir / "data" / "plata" / "chirps" / f"mensual_{a0}_{a1}.json"
    ruta_ctrl.parent.mkdir(parents=True, exist_ok=True)
    ctrl: Dict[str, Dict[str, Optional[float]]] = (
        json.loads(ruta_ctrl.read_text(encoding="utf-8")) if ruta_ctrl.exists() else {})

    rejilla: Optional[Rejilla] = None
    for anio in range(a0, a1 + 1):
        pendientes = [mes for mes in range(1, 13) if f"{anio}-{mes:02d}" not in ctrl]
        for mes in pendientes:
            url = conf["fuentes"]["mensual_latam"].format(anio=anio, mes=mes)
            arr, transform = leer_ventana_con_reintento(url, conf["ventana_colombia"])
            if rejilla is None:
                rejilla = construir_rejilla(transform, arr.shape, municipios, poligonos)
            ctrl[f"{anio}-{mes:02d}"] = promedios_municipales(arr, rejilla)
            time.sleep(p["pausa_segundos_entre_archivos"])
        if pendientes:
            tmp = ruta_ctrl.with_suffix(".tmp")
            tmp.write_text(json.dumps(ctrl, separators=(",", ":")), encoding="utf-8")
            tmp.replace(ruta_ctrl)
            logger.info(f"Normal CHIRPS: año {anio} listo")
    if rejilla is None:   # todo venía del punto de control: la rejilla solo hace falta para el método espacial
        arr, transform = leer_ventana_con_reintento(conf["fuentes"]["mensual_latam"].format(anio=a1, mes=12),
                                                    conf["ventana_colombia"])
        rejilla = construir_rejilla(transform, arr.shape, municipios, poligonos)

    suma: Dict[str, np.ndarray] = {m["divipola"]: np.zeros(12) for m in municipios}
    n: Dict[str, np.ndarray] = {m["divipola"]: np.zeros(12) for m in municipios}
    for clave, valores in ctrl.items():
        anio, mes = (int(x) for x in clave.split("-"))
        if not a0 <= anio <= a1:
            continue
        for div, v in valores.items():
            if v is not None and div in suma:
                suma[div][mes - 1] += v
                n[div][mes - 1] += 1

    anios = a1 - a0 + 1
    normales = {}
    for div in suma:
        # un mes con menos del 90 % de los años no tiene normal (no se completa)
        normales[div] = {MESES[k]: round(float(suma[div][k] / n[div][k]), 1)
                         for k in range(12) if n[div][k] >= 0.9 * anios}
    assert rejilla is not None
    return {
        "descripcion": f"Normal mensual de precipitación CHIRPS v3.0 {a0}-{a1} por municipio (mm/mes), línea base de A-3 satelital.",
        "fuente": conf["fuentes"]["mensual_latam"],
        "periodo": [a0, a1],
        "meses_leidos": sum(1 for k in ctrl if a0 <= int(k[:4]) <= a1),
        "generado_por": "ingesta/clima/chirps.py (construir_normales)",
        "generado_en": datetime.now(timezone.utc).isoformat(),
        "metodo_espacial": {div: r[2] for div, r in rejilla.items()},
        "municipios_sin_normal": sorted(d for d, v in normales.items() if len(v) < 12),
        "normales": normales,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    raiz = Path(__file__).resolve().parents[2]
    r = construir_normales(raiz)
    destino = raiz / "data" / "config" / "normales_chirps.json"
    destino.write_text(json.dumps(r, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    logger.info(f"{len(r['normales'])} municipios; sin normal completa: {len(r['municipios_sin_normal'])} -> {destino}")
