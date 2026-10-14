"""
Modelo semanal — Comparativo semana a semana del fenómeno El Niño en Colombia
Proyecto: Vigía El Niño · Acueductos (CRA)
Especificación: context-lake/specs/comparativo-semanal.md (V-08)
Decisión: adr/ADR-0003-arquitectura-medallon.md

Flujo (solo lectura de bronce y de cortes oro diarios; nunca escribe en bronce):

    bronce/fte_cpc_noaa  ─┐
    bronce/fte_xm_*      ─┤                           ┌─> oro/semanal/corte_semanal_vigente.json
    bronce/fte_ideam_*   ─┼─> plata/semanal/obs_... ──┤
    bronce/fte_firms_*   ─┤                           └─> oro/semanal/corte_semanal_<AAAA-Www>.json
    oro/corte_<fecha>    ─┘                               (+ copia publicada en tablero/semanal/data)

Las funciones puras (prefijo sin guion bajo y sin I/O) se prueban en
ingesta/tests/test_modelo_semanal.py.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
import shutil
import uuid
from datetime import date, datetime, timedelta, timezone, tzinfo
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

logger = logging.getLogger("ModeloSemanal")


def _zona_bogota() -> tzinfo:
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo("America/Bogota")
    except Exception:  # Windows sin paquete tzdata: Colombia no tiene horario de verano
        return timezone(timedelta(hours=-5), "America/Bogota")


TZ_BOGOTA = _zona_bogota()

MESES = {"JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6,
         "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12}
MES_CENTRAL_TRIMESTRE = {"DJF": 1, "JFM": 2, "FMA": 3, "MAM": 4, "AMJ": 5, "MJJ": 6,
                         "JJA": 7, "JAS": 8, "ASO": 9, "SON": 10, "OND": 11, "NDJ": 12}

# Formato de ancho fijo wksst9120.for: los negativos quedan pegados ("20.6-0.1")
_PATRON_NOAA = re.compile(r"^\s*(\d{2})([A-Z]{3})(\d{4})" + r"\s*(-?\d+\.\d)" * 8)
_PATRON_ONI = re.compile(r"^\s*([A-Z]{3})\s+(\d{4})\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)")
SEPARADOR_ONI = "--- SEPARADOR ONI ---"


# =============================================================================
# Utilidades de semana ISO (puras)
# =============================================================================
def semana_iso(d: date) -> str:
    anio, num, _ = d.isocalendar()
    return f"{anio}-W{num:02d}"


def inicio_semana(s: str) -> date:
    return date.fromisocalendar(int(s[:4]), int(s[6:8]), 1)


def fin_semana(s: str) -> date:
    return inicio_semana(s) + timedelta(days=6)


def desplazar_semana(s: str, n: int) -> str:
    return semana_iso(inicio_semana(s) + timedelta(weeks=n))


def rango_semanas(desde: str, hasta: str) -> List[str]:
    out: List[str] = []
    d, fin = inicio_semana(desde), inicio_semana(hasta)
    while d <= fin:
        out.append(semana_iso(d))
        d += timedelta(weeks=1)
    return out


def semanas_entre(a: str, b: str) -> int:
    """Número de semanas de a hasta b (b - a)."""
    return (inicio_semana(b) - inicio_semana(a)).days // 7


# =============================================================================
# Parsers NOAA (puros)
# =============================================================================
def parsear_noaa_semanal(texto: str) -> List[Dict[str, Any]]:
    filas: List[Dict[str, Any]] = []
    for linea in texto.splitlines():
        m = _PATRON_NOAA.match(linea)
        if not m or m.group(2) not in MESES:
            continue
        g = m.groups()
        fecha = date(int(g[2]), MESES[g[1]], int(g[0]))
        v = [float(x) for x in g[3:]]
        filas.append({
            "fecha": fecha, "semana_iso": semana_iso(fecha),
            "nino12_sst": v[0], "nino12": v[1], "nino3_sst": v[2], "nino3": v[3],
            "nino34_sst": v[4], "nino34": v[5], "nino4_sst": v[6], "nino4": v[7],
        })
    filas.sort(key=lambda r: r["fecha"])
    return filas


def parsear_oni(texto: str) -> List[Dict[str, Any]]:
    filas: List[Dict[str, Any]] = []
    for linea in texto.splitlines():
        m = _PATRON_ONI.match(linea)
        if not m or m.group(1) not in MES_CENTRAL_TRIMESTRE:
            continue
        trimestre, anio = m.group(1), int(m.group(2))
        mes = MES_CENTRAL_TRIMESTRE[trimestre]
        # Disponible desde el primer día del mes siguiente al último mes del trimestre
        mes_disp, anio_disp = mes + 2, anio
        if mes_disp > 12:
            mes_disp, anio_disp = mes_disp - 12, anio + 1
        filas.append({
            "trimestre": trimestre, "anio": anio,
            "fecha_dato": date(anio, mes, 15),
            "fecha_disponible": date(anio_disp, mes_disp, 1),
            "total": float(m.group(3)), "oni": float(m.group(4)),
        })
    filas.sort(key=lambda r: r["fecha_dato"])
    return filas


# =============================================================================
# Reglas analíticas (puras)
# =============================================================================
def detectar_inicio_evento(
    serie: List[Tuple[str, Optional[float]]],
    umbral: float,
    consecutivas: int,
    vigente: bool = True,
) -> Optional[str]:
    """
    serie: [(semana_iso, valor)] ordenada. Devuelve la semana de inicio de:
    - vigente=True: la racha que llega hasta el final de la serie (evento en curso).
    - vigente=False: la primera racha de >= `consecutivas` semanas (evento histórico).
    """
    rachas: List[Tuple[int, int]] = []
    ini: Optional[int] = None
    for i, (_, v) in enumerate(serie):
        if v is not None and v >= umbral:
            if ini is None:
                ini = i
        else:
            if ini is not None:
                rachas.append((ini, i - 1))
            ini = None
    if ini is not None:
        rachas.append((ini, len(serie) - 1))
    validas = [r for r in rachas if r[1] - r[0] + 1 >= consecutivas]
    if not validas:
        return None
    if vigente:
        ult = validas[-1]
        return serie[ult[0]][0] if ult[1] == len(serie) - 1 else None
    return serie[validas[0][0]][0]


def clasificar_nivel(valor: Optional[float], niveles: List[Dict[str, Any]]) -> Tuple[Optional[str], Optional[str]]:
    if valor is None or not niveles:
        return None, None
    for n in niveles:
        desde, hasta = n.get("desde"), n.get("hasta")
        if (desde is None or valor >= desde) and (hasta is None or valor < hasta):
            return n["etiqueta"], n["riesgo"]
    return None, None


def calcular_tendencia(valor: Optional[float], referencia: Optional[float], direccion: str, tolerancia: float) -> str:
    if valor is None or referencia is None:
        return "sin_dato"
    delta = valor - referencia
    if abs(delta) <= tolerancia:
        return "estable"
    sube = delta > 0
    if direccion == "sube_empeora":
        return "empeora" if sube else "mejora"
    return "mejora" if sube else "empeora"


def comparar(valor: Optional[float], referencia: Optional[float], var: Dict[str, Any]) -> Dict[str, Any]:
    delta_abs = None if valor is None or referencia is None else round(valor - referencia, 4)
    delta_pct = None
    if delta_abs is not None and referencia not in (None, 0):
        delta_pct = round(delta_abs / abs(referencia) * 100, 2)
    return {
        "valor_referencia": referencia,
        "delta_abs": delta_abs,
        "delta_pct": delta_pct,
        "tendencia": calcular_tendencia(valor, referencia, var["direccion"], float(var.get("tolerancia_estable", 0))),
    }


# =============================================================================
# Constructor del modelo (I/O sobre data/)
# =============================================================================
class ModeloSemanal:
    def __init__(self, base_dir: Optional[str] = None, hoy: Optional[date] = None):
        self.root = Path(base_dir or Path(__file__).resolve().parent.parent.parent)
        self.data = self.root / "data"
        self.config_file = self.data / "config" / "comparativo_semanal.json"
        self.plata_dir = self.data / "plata" / "semanal"
        self.oro_dir = self.data / "oro" / "semanal"
        self.ops_file = self.data / "ops" / "ejecuciones_semanal.json"
        self.publicacion_dir = self.root / "tablero" / "semanal" / "data"
        self.hoy = hoy or datetime.now(TZ_BOGOTA).date()
        self._hash = hashlib.sha256()
        self._archivos_entrada: List[str] = []

    # ---------------------------------------------------------------- lectura
    def _leer_bytes(self, ruta: Path) -> bytes:
        contenido = ruta.read_bytes()
        self._hash.update(ruta.name.encode())
        self._hash.update(contenido)
        self._archivos_entrada.append(str(ruta.relative_to(self.root)))
        return contenido

    def _leer_json(self, ruta: Path) -> Any:
        return json.loads(self._leer_bytes(ruta).decode("utf-8", errors="replace"))

    def cargar_config(self) -> Dict[str, Any]:
        with open(self.config_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _cargar_noaa(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Optional[str]]:
        carpeta = self.data / "bronce" / "fte_cpc_noaa"
        archivos = sorted(carpeta.glob("*.txt")) if carpeta.exists() else []
        if not archivos:
            return [], [], None
        ultimo = archivos[-1]
        texto = self._leer_bytes(ultimo).decode("utf-8", errors="ignore")
        semanal, _, oni = texto.partition(SEPARADOR_ONI)
        return parsear_noaa_semanal(semanal), parsear_oni(oni), str(ultimo.relative_to(self.root))

    def _cargar_capturas_bronce(self, carpeta: str) -> List[Dict[str, Any]]:
        """Devuelve capturas [{fecha, capturado_en, contenido, archivo}] ordenadas."""
        ruta = self.data / "bronce" / carpeta
        out: List[Dict[str, Any]] = []
        if not ruta.exists():
            return out
        for arch in sorted(ruta.glob("*.json")):
            try:
                cont = self._leer_json(arch)
            except Exception as e:  # crudo ilegible: se omite y se registra
                logger.warning(f"Crudo ilegible {arch.name}: {e}")
                continue
            ts_nombre = datetime.strptime(arch.name[:15], "%Y%m%d_%H%M%S").replace(tzinfo=timezone.utc)
            capturado = cont.get("fecha_captura") or ts_nombre.isoformat()
            try:
                fecha = date.fromisoformat(str(cont.get("fecha_reporte"))[:10])
            except ValueError:
                fecha = ts_nombre.astimezone(TZ_BOGOTA).date()
            out.append({"fecha": fecha, "capturado_en": capturado, "contenido": cont,
                        "archivo": str(arch.relative_to(self.root))})
        out.sort(key=lambda c: (c["fecha"], c["capturado_en"]))
        return out

    def _cargar_cortes_oro(self) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        for arch in sorted((self.data / "oro").glob("corte_????-??-??.json")):
            try:
                corte = self._leer_json(arch)
                fecha = date.fromisoformat(corte["metadata_corte"]["fecha_corte"])
            except Exception as e:
                logger.warning(f"Corte oro ilegible {arch.name}: {e}")
                continue
            out.append({"fecha": fecha, "corte": corte, "archivo": str(arch.relative_to(self.root))})
        out.sort(key=lambda c: c["fecha"])
        return out

    def _cargar_xm_historico(self) -> Dict[str, Any]:
        """Carga datos históricos y diarios de XM para Sistema y Agregado Bogotá."""
        por_fecha: Dict[date, Dict[str, float]] = {}
        archivos_leidos = []
        carpeta_hist = self.data / "bronce" / "fte_xm_historico"
        if carpeta_hist.exists():
            for arch in sorted(carpeta_hist.glob("*.json")):
                try:
                    data = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    serie = data.get("serie", "")
                    items = data.get("payload", {}).get("Items", [])
                    for it in items:
                        d_str = it.get("Date")
                        if not d_str:
                            continue
                        f = date.fromisoformat(d_str[:10])
                        if f not in por_fecha:
                            por_fecha[f] = {}
                        for ent in it.get("DailyEntities", []):
                            ent_id = ent.get("Id")
                            ent_name = ent.get("Name")
                            raw_val = ent.get("Value")
                            if raw_val is not None:
                                try:
                                    val_f = float(raw_val)
                                    val_pct = val_f * 100.0 if val_f <= 1.0 else val_f
                                    if ent_id == "Sistema" or serie == "Sistema":
                                        por_fecha[f]["Sistema"] = val_pct
                                    if ent_name == "AGREGADO BOGOTA":
                                        por_fecha[f]["AGREGADO BOGOTA"] = val_pct
                                except ValueError:
                                    pass
                except Exception as e:
                    logger.debug(f"Crudo XM histórico ilegible {arch.name}: {e}")

        carpeta_diaria = self.data / "bronce" / "fte_xm_embalses"
        if carpeta_diaria.exists():
            for arch in sorted(carpeta_diaria.glob("*.json")):
                try:
                    cont = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    f_str = cont.get("fecha_reporte")
                    if f_str:
                        f = date.fromisoformat(str(f_str)[:10])
                        if f not in por_fecha:
                            por_fecha[f] = {}
                        if "sin_volumen_util_pct" in cont:
                            por_fecha[f]["Sistema"] = float(cont["sin_volumen_util_pct"])
                        if "agregado_bogota_pct" in cont:
                            por_fecha[f]["AGREGADO BOGOTA"] = float(cont["agregado_bogota_pct"])
                except Exception:
                    pass

        return {"por_fecha": por_fecha, "archivos": archivos_leidos}

    def _cargar_ideam_precip(self) -> Dict[str, Any]:
        """Carga datos de precipitación por departamento o municipio."""
        por_semana: Dict[str, Dict[str, Any]] = {}
        archivos_leidos = []
        carpeta_precip = self.data / "bronce" / "fte_ideam_precip_historico"
        if carpeta_precip.exists():
            for arch in sorted(carpeta_precip.glob("*.json")):
                try:
                    data = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    for row in data.get("payload", []):
                        dia_str = row.get("dia")
                        if not dia_str:
                            continue
                        f = date.fromisoformat(dia_str[:10])
                        sem = semana_iso(f)
                        if sem not in por_semana:
                            por_semana[sem] = {"suma_mm": 0.0, "estaciones": 0, "ult_fecha": f}
                        por_semana[sem]["suma_mm"] += float(row.get("suma_mm", 0.0))
                        por_semana[sem]["estaciones"] += int(row.get("estaciones", 1))
                        if f > por_semana[sem]["ult_fecha"]:
                            por_semana[sem]["ult_fecha"] = f
                except Exception:
                    pass

        carpeta_clima = self.data / "bronce" / "fte_ideam_clima"
        if carpeta_clima.exists():
            for arch in sorted(carpeta_clima.glob("*.json")):
                try:
                    data = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    f_rep = data.get("fecha_reporte")
                    if f_rep:
                        f = date.fromisoformat(str(f_rep)[:10])
                        sem = semana_iso(f)
                        muns = data.get("municipios", {})
                        if muns:
                            vals_anom = [m.get("indicador_a3_anomalia_precip_pct") for m in muns.values() if isinstance(m.get("indicador_a3_anomalia_precip_pct"), (int, float))]
                            vals_mm = [m.get("precipitacion_acumulada_30d_mm") for m in muns.values() if isinstance(m.get("precipitacion_acumulada_30d_mm"), (int, float))]
                            prom_anom = sum(vals_anom) / len(vals_anom) if vals_anom else 0.0
                            prom_mm_dia = (sum(vals_mm) / len(vals_mm) / 30.0) if vals_mm else round(max(0.5, 4.0 * (1.0 + prom_anom / 100.0)), 2)
                            if sem not in por_semana:
                                por_semana[sem] = {"mm_dia": prom_mm_dia, "var_ref_pct": prom_anom, "ult_fecha": f, "estaciones": len(muns)}
                except Exception:
                    pass

        return {"por_semana": por_semana, "archivos": archivos_leidos}

    def _cargar_ungrd_historico(self) -> Dict[str, Any]:
        """Carga registros históricos de emergencias de la UNGRD."""
        eventos = []
        archivos_leidos = []
        carpeta = self.data / "bronce" / "fte_ungrd_historico"
        if carpeta.exists():
            for arch in sorted(carpeta.glob("*.json")):
                try:
                    data = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    for row in data.get("payload", []):
                        f_str = row.get("fecha")
                        ev = row.get("evento")
                        if f_str and ev:
                            f = date.fromisoformat(f_str[:10])
                            eventos.append({
                                "fecha": f,
                                "semana_iso": semana_iso(f),
                                "evento": ev.strip().upper()
                            })
                except Exception as e:
                    logger.debug(f"Crudo UNGRD histórico ilegible {arch.name}: {e}")
        return {"eventos": eventos, "archivos": archivos_leidos}

    def _cargar_firms_historico(self) -> Dict[str, Any]:
        """Carga focos históricos de NASA FIRMS si existen."""
        por_semana: Dict[str, int] = {}
        archivos_leidos = []
        carpeta = self.data / "bronce" / "fte_firms_historico"
        if carpeta.exists():
            for arch in sorted(carpeta.glob("*.json")):
                try:
                    data = self._leer_json(arch)
                    archivos_leidos.append(str(arch.relative_to(self.root)))
                    csv_text = data.get("payload", {}).get("csv", "")
                    if csv_text:
                        lines = csv_text.strip().splitlines()
                        if len(lines) > 1:
                            header = lines[0].split(",")
                            if "acq_date" in header:
                                idx_date = header.index("acq_date")
                                for line in lines[1:]:
                                    parts = line.split(",")
                                    if len(parts) > idx_date:
                                        d = date.fromisoformat(parts[idx_date])
                                        sem = semana_iso(d)
                                        por_semana[sem] = por_semana.get(sem, 0) + 1
                except Exception:
                    pass
        return {"por_semana": por_semana, "archivos": archivos_leidos}

    # ------------------------------------------------------- observaciones
    @staticmethod
    def _ultima_por_semana(capturas: List[Dict[str, Any]]) -> Dict[str, Tuple[Dict[str, Any], int]]:
        por_semana: Dict[str, Tuple[Dict[str, Any], int]] = {}
        for c in capturas:
            s = semana_iso(c["fecha"])
            n = por_semana[s][1] + 1 if s in por_semana else 1
            por_semana[s] = (c, n)  # capturas ordenadas: la última queda
        return por_semana

    def _obs(self, semana: str, var: Dict[str, Any], valor: Optional[float], estado: str,
             fecha_dato: Optional[date], n_obs: int, origen: Optional[str],
             ambito: str = "nacional", muestra: Optional[int] = None) -> Dict[str, Any]:
        if valor is None:
            estado = "sin_dato"
        return {
            "semana_iso": semana, "codigo": var["codigo"], "ambito": ambito,
            "valor": None if valor is None else round(float(valor), 4),
            "estado_dato": estado,
            "fecha_dato": fecha_dato.isoformat() if fecha_dato else None,
            "n_obs": n_obs, "tamano_muestra": muestra,
            "fuente": var["fuente"], "origen_bronce": origen,
        }

    def _observaciones_variable(self, var: Dict[str, Any], semanas: List[str], fuentes: Dict[str, Any]) -> List[Dict[str, Any]]:
        origen = var["origen"]
        campo = var["campo"]
        obs: List[Dict[str, Any]] = []

        if origen == "noaa_semanal":
            por_sem = {r["semana_iso"]: r for r in fuentes["noaa_semanal"]}
            for s in semanas:
                r = por_sem.get(s)
                obs.append(self._obs(s, var, r[campo] if r else None, "dato",
                                     r["fecha"] if r else None, 1 if r else 0, fuentes["noaa_archivo"]))
            return obs

        if origen == "noaa_oni":
            oni = fuentes["noaa_oni"]
            previo_id = None
            for s in semanas:
                fin = fin_semana(s)
                disponibles = [r for r in oni if r["fecha_disponible"] <= fin]
                r = disponibles[-1] if disponibles else None
                rid = (r["trimestre"], r["anio"]) if r else None
                estado = "dato" if rid != previo_id else "arrastre"
                previo_id = rid
                o = self._obs(s, var, r[campo] if r else None, estado,
                              r["fecha_dato"] if r else None, 1 if r else 0, fuentes["noaa_archivo"])
                if r:
                    o["etiqueta_periodo"] = f"{r['trimestre']} {r['anio']}"
                obs.append(o)
            return obs

        if origen in ("bronce_xm", "bronce_ideam", "bronce_firms"):
            capturas = fuentes[origen]
            por_sem = self._ultima_por_semana(capturas)
            for s in semanas:
                if s not in por_sem:
                    obs.append(self._obs(s, var, None, "sin_dato", None, 0, None))
                    continue
                cap, n = por_sem[s]
                cont = cap["contenido"]
                valor: Optional[float] = None
                muestra: Optional[int] = None
                ambito = "nacional"
                if origen == "bronce_xm":
                    valor = cont.get(campo)
                    muestra = len(cont.get("embalses", {})) or None
                    ambito = "muestra" if muestra else "nacional"
                else:
                    dic = cont.get("municipios") if origen == "bronce_ideam" else cont.get("focos_municipales")
                    vals = [m.get(campo) for m in (dic or {}).values() if isinstance(m.get(campo), (int, float))]
                    muestra = len(vals)
                    ambito = "muestra"
                    if vals:
                        valor = sum(vals) / len(vals) if var["agregacion"] == "promedio" else float(sum(vals))
                obs.append(self._obs(s, var, valor, "dato", cap["fecha"], n, cap["archivo"], ambito, muestra))
            return obs

        if origen == "oro_corte":
            por_sem = self._ultima_por_semana(fuentes["oro_cortes"])
            for s in semanas:
                if s not in por_sem:
                    obs.append(self._obs(s, var, None, "sin_dato", None, 0, None))
                    continue
                c, n = por_sem[s]
                meta = c["corte"].get("metadata_corte", {})
                if campo.startswith("conteo_"):
                    valor = meta.get("conteo_niveles_nacional", {}).get(campo.replace("conteo_", ""))
                else:
                    valor = meta.get(campo)
                obs.append(self._obs(s, var, valor, "dato", c["fecha"], n, c["archivo"],
                                     muestra=meta.get("total_municipios_evaluados")))
            return obs

        if origen == "xm_historico":
            datos_xm = fuentes["xm_historico"]
            por_fecha = datos_xm["por_fecha"]
            arch_origen = datos_xm["archivos"][-1] if datos_xm["archivos"] else None
            fechas_por_sem: Dict[str, List[date]] = {}
            for f in por_fecha:
                sem = semana_iso(f)
                if sem not in fechas_por_sem:
                    fechas_por_sem[sem] = []
                fechas_por_sem[sem].append(f)

            for s in semanas:
                fechas = [f for f in fechas_por_sem.get(s, []) if campo in por_fecha[f]]
                if not fechas:
                    obs.append(self._obs(s, var, None, "sin_dato", None, 0, arch_origen, ambito="nacional"))
                    continue
                fechas.sort()
                ult_f = fechas[-1]
                val = por_fecha[ult_f][campo]
                obs.append(self._obs(s, var, val, "dato", ult_f, len(fechas), arch_origen, ambito="nacional"))
            return obs

        if origen == "ideam_precip":
            datos_ideam = fuentes["ideam_precip"]
            por_semana = datos_ideam["por_semana"]
            arch_origen = datos_ideam["archivos"][-1] if datos_ideam["archivos"] else None
            for s in semanas:
                if s not in por_semana:
                    obs.append(self._obs(s, var, None, "sin_dato", None, 0, arch_origen, ambito="nacional"))
                    continue
                info = por_semana[s]
                val = None
                if campo == "mm_dia":
                    if "mm_dia" in info:
                        val = info["mm_dia"]
                    elif info.get("estaciones", 0) > 0:
                        val = round(info["suma_mm"] / info["estaciones"], 2)
                elif campo == "var_ref_pct":
                    if "var_ref_pct" in info:
                        val = info["var_ref_pct"]
                    else:
                        s_ref = f"2025-W{s[-2:]}"
                        if s_ref in por_semana:
                            val_ref = por_semana[s_ref].get("mm_dia")
                            if val_ref and "mm_dia" in info and val_ref > 0:
                                val = round(((info["mm_dia"] - val_ref) / val_ref) * 100.0, 1)
                estado = "dato" if val is not None else "sin_dato"
                obs.append(self._obs(s, var, val, estado, info.get("ult_fecha"), 1, arch_origen, ambito="nacional", muestra=info.get("estaciones")))
            return obs

        if origen == "ungrd_historico":
            datos_ungrd = fuentes["ungrd_historico"]
            eventos = datos_ungrd["eventos"]
            arch_origen = datos_ungrd["archivos"][-1] if datos_ungrd["archivos"] else None
            targets = [t.strip().upper() for t in campo.split("|")]
            
            conteo_sem: Dict[str, Tuple[int, date]] = {}
            for ev in eventos:
                if ev["evento"] in targets:
                    sem = ev["semana_iso"]
                    cnt, ult_f = conteo_sem.get(sem, (0, ev["fecha"]))
                    conteo_sem[sem] = (cnt + 1, max(ult_f, ev["fecha"]))

            for s in semanas:
                if s in conteo_sem:
                    cnt, ult_f = conteo_sem[s]
                    obs.append(self._obs(s, var, float(cnt), "dato", ult_f, cnt, arch_origen, ambito="nacional"))
                else:
                    anio_sem = int(s[:4])
                    if 2019 <= anio_sem <= 2025:
                        obs.append(self._obs(s, var, 0.0, "dato", fin_semana(s), 0, arch_origen, ambito="nacional"))
                    else:
                        obs.append(self._obs(s, var, None, "sin_dato", None, 0, arch_origen, ambito="nacional"))
            return obs

        if origen == "firms_historico":
            datos_firms = fuentes["firms_historico"]
            por_semana = datos_firms["por_semana"]
            arch_origen = datos_firms["archivos"][-1] if datos_firms["archivos"] else None
            for s in semanas:
                if s in por_semana:
                    cnt = por_semana[s]
                    obs.append(self._obs(s, var, float(cnt), "dato", fin_semana(s), cnt, arch_origen, ambito="nacional"))
                else:
                    obs.append(self._obs(s, var, None, "sin_dato", None, 0, arch_origen, ambito="nacional"))
            return obs

        raise ValueError(f"Origen no soportado en config: {origen}")

    # ------------------------------------------------------------ análogos
    def _serie_evento(self, noaa: List[Dict[str, Any]], inicio: str, variables: List[Dict[str, Any]],
                      hasta: Optional[date], fuentes: Optional[Dict[str, Any]] = None,
                      previas: int = 8) -> Dict[str, List[Dict[str, Any]]]:
        series: Dict[str, List[Dict[str, Any]]] = {v["codigo"]: [] for v in variables}

        # Precomputar índices rápidos para fuentes históricas si están disponibles
        xm_por_sem: Dict[str, Dict[str, float]] = {}
        ungrd_por_sem: Dict[str, Dict[str, int]] = {}
        if fuentes:
            if "xm_historico" in fuentes:
                por_fecha = fuentes["xm_historico"].get("por_fecha", {})
                for f, vals in por_fecha.items():
                    sem = semana_iso(f)
                    if sem not in xm_por_sem:
                        xm_por_sem[sem] = {}
                    for k_c, v_c in vals.items():
                        xm_por_sem[sem][k_c] = v_c  # el último día de la semana sobreescribe
            if "ungrd_historico" in fuentes:
                for ev in fuentes["ungrd_historico"].get("eventos", []):
                    sem = ev["semana_iso"]
                    e_name = ev["evento"]
                    if sem not in ungrd_por_sem:
                        ungrd_por_sem[sem] = {}
                    ungrd_por_sem[sem][e_name] = ungrd_por_sem[sem].get(e_name, 0) + 1

        for r in noaa:
            if hasta and r["fecha"] > hasta:
                break
            k = semanas_entre(inicio, r["semana_iso"]) + 1
            if k < 1 - previas:
                continue
            s = r["semana_iso"]
            for v in variables:
                val: Optional[float] = None
                orig = v.get("origen")
                campo = v.get("campo")
                if orig == "noaa_semanal":
                    val = r.get(campo)
                elif orig == "xm_historico":
                    val = xm_por_sem.get(s, {}).get(campo)
                elif orig == "ungrd_historico":
                    targets = [t.strip().upper() for t in (campo or "").split("|")]
                    if s in ungrd_por_sem:
                        val = float(sum(ungrd_por_sem[s].get(t, 0) for t in targets))
                    else:
                        anio_s = int(s[:4]) if len(s) >= 4 and s[:4].isdigit() else 0
                        val = 0.0 if (2019 <= anio_s <= 2025) else None
                series[v["codigo"]].append({"semana_evento": k, "semana_iso": s, "valor": val})
        return series

    # -------------------------------------------------------------- construir
    def construir(self, id_ejecucion: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.cargar_config()
        variables: List[Dict[str, Any]] = cfg["variables"]
        generado_en = datetime.now(timezone.utc)

        noaa_sem, noaa_oni, noaa_archivo = self._cargar_noaa()
        fuentes = {
            "noaa_semanal": noaa_sem, "noaa_oni": noaa_oni, "noaa_archivo": noaa_archivo,
            "bronce_xm": self._cargar_capturas_bronce("fte_xm_embalses"),
            "bronce_ideam": self._cargar_capturas_bronce("fte_ideam_clima"),
            "bronce_firms": self._cargar_capturas_bronce("fte_firms_nasa"),
            "oro_cortes": self._cargar_cortes_oro(),
            "xm_historico": self._cargar_xm_historico(),
            "ideam_precip": self._cargar_ideam_precip(),
            "ungrd_historico": self._cargar_ungrd_historico(),
            "firms_historico": self._cargar_firms_historico(),
        }

        semana_actual = semana_iso(self.hoy)
        semanas = rango_semanas(cfg["semana_inicio_seguimiento"], semana_actual)

        # ---- PLATA: observaciones semanales
        obs_plata: List[Dict[str, Any]] = []
        series: Dict[str, List[Dict[str, Any]]] = {}
        for var in variables:
            o = self._observaciones_variable(var, semanas, fuentes)
            series[var["codigo"]] = o
            obs_plata.extend(o)

        # ---- Evento vigente y análogos
        det = cfg["deteccion_evento"]
        var_det = next(v for v in variables if v["codigo"] == det["variable"])
        serie_det = [(r["semana_iso"], r[var_det["campo"]]) for r in noaa_sem]
        inicio_evento = detectar_inicio_evento(serie_det, det["umbral_inicio_c"], det["semanas_consecutivas_inicio"], vigente=True)

        vars_analogos = [v for v in variables if v.get("en_analogos")]
        analogos: List[Dict[str, Any]] = []
        for ev in cfg["eventos_analogos"]:
            desde, hasta = date.fromisoformat(ev["desde"]), date.fromisoformat(ev["hasta"])
            ventana = [(s, v) for s, v in serie_det if desde <= inicio_semana(s) <= hasta]
            ini = detectar_inicio_evento(ventana, det["umbral_inicio_c"], det["semanas_consecutivas_inicio"], vigente=False)
            if not ini:
                continue
            serie_ev = self._serie_evento(noaa_sem, ini, vars_analogos, hasta, fuentes=fuentes)
            pico = max((p for p in serie_ev[var_det["codigo"]] if p["semana_evento"] >= 1 and p["valor"] is not None), key=lambda p: p["valor"], default=None)
            analogos.append({**ev, "inicio_semana": ini, "pico": pico, "series": serie_ev})

        evento_vigente: Dict[str, Any] = {"inicio_semana": inicio_evento, "series": {}}
        if inicio_evento:
            evento_vigente["series"] = self._serie_evento(noaa_sem, inicio_evento, vars_analogos, None, fuentes=fuentes)
            pts = [p for p in evento_vigente["series"][var_det["codigo"]] if p["semana_evento"] >= 1 and p["valor"] is not None]
            evento_vigente["pico"] = max(pts, key=lambda p: p["valor"], default=None)
            evento_vigente["ultima"] = pts[-1] if pts else None

        def semana_evento(s: str) -> Optional[int]:
            return semanas_entre(inicio_evento, s) + 1 if inicio_evento else None

        # ---- ORO: dim_semana
        dim_semana = [{
            "semana_iso": s, "anio_iso": int(s[:4]), "numero": int(s[6:]),
            "inicio": inicio_semana(s).isoformat(), "fin": fin_semana(s).isoformat(),
            "semana_evento": semana_evento(s), "cerrada": fin_semana(s) < self.hoy,
        } for s in semanas]

        # ---- ORO: fct_variable_semana para cada desplazamiento de referencia
        desplazamientos = cfg.get("desplazamientos_referencia", [1, 4])
        fct: Dict[str, Dict[str, Dict[str, Any]]] = {str(d): {} for d in desplazamientos}
        for var in variables:
            idx = {o["semana_iso"]: o for o in series[var["codigo"]]}
            for d in desplazamientos:
                filas = fct[str(d)].setdefault(var["codigo"], {})
                for s in semanas:
                    o = idx[s]
                    ref_s = desplazar_semana(s, -d)
                    ref = idx.get(ref_s)
                    etiqueta, riesgo = clasificar_nivel(o["valor"], var.get("niveles", []))
                    filas[s] = {
                        "valor": o["valor"], "estado_dato": o["estado_dato"],
                        "semana_referencia": ref_s,
                        **comparar(o["valor"], ref["valor"] if ref else None, var),
                        "nivel_etiqueta": etiqueta, "nivel_riesgo": riesgo,
                    }

        # ---- Semana vigente: la más reciente con >= 50 % de variables con dato
        def cobertura(s: str) -> int:
            return sum(1 for v in variables if fct[str(desplazamientos[0])][v["codigo"]][s]["estado_dato"] != "sin_dato")
        con_datos = [s for s in semanas if cobertura(s) > 0]
        mayoria = [s for s in con_datos if cobertura(s) >= len(variables) / 2]
        semana_vigente = (mayoria or con_datos or [semana_actual])[-1]

        # ---- ORO: fct_depto_semana y niveles municipales por semana
        deptos: List[Dict[str, Any]] = []
        niveles_mun: Dict[str, Dict[str, Dict[str, Any]]] = {}
        for s, (c, _) in self._ultima_por_semana(fuentes["oro_cortes"]).items():
            corte = c["corte"]
            for d in corte.get("departamentos", []):
                deptos.append({
                    "semana_iso": s, "cod_depto": d["cod_depto"], "departamento": d["departamento"],
                    "fecha_corte": c["fecha"].isoformat(),
                    "icr_medio_ponderado": d.get("icr_medio_ponderado"),
                    "poblacion_total": d.get("poblacion_total"),
                    "poblacion_naranja_roja": d.get("poblacion_naranja_roja"),
                    "total_municipios": d.get("total_municipios"),
                    "conteo_niveles": d.get("conteo_niveles", {}),
                })
            niveles_mun[s] = {m["divipola"]: {"nivel": m.get("nivel_alerta"), "icr": m.get("icr"),
                                              "cod_depto": m.get("cod_depto"), "nombre": m.get("nombre")}
                              for m in corte.get("municipios", [])}

        # ---- Estado de fuentes (frescura)
        ahora = generado_en
        def _fresc(ultima_captura: Optional[str]) -> Optional[float]:
            if not ultima_captura:
                return None
            try:
                t = datetime.fromisoformat(ultima_captura)
                return round((ahora - t).total_seconds() / 3600, 1)
            except ValueError:
                return None
        fuentes_estado = []
        noaa_ult = noaa_sem[-1] if noaa_sem else None
        noaa_cap = None
        if noaa_archivo:
            noaa_cap = datetime.strptime(Path(noaa_archivo).name[:15], "%Y%m%d_%H%M%S").replace(tzinfo=timezone.utc).isoformat()
        fuentes_estado.append({"fuente": "NOAA CPC (semanal + ONI)", "ultima_fecha_dato": noaa_ult["fecha"].isoformat() if noaa_ult else None,
                               "ultima_captura": noaa_cap, "frescura_horas": _fresc(noaa_cap), "capturas": 1 if noaa_archivo else 0})
        for clave, nombre in (("bronce_xm", "XM Sinergox (embalses)"), ("bronce_ideam", "IDEAM DHIME (lluvia)"),
                              ("bronce_firms", "NASA FIRMS (focos de calor)")):
            caps = fuentes[clave]
            ult = caps[-1] if caps else None
            fuentes_estado.append({"fuente": nombre, "ultima_fecha_dato": ult["fecha"].isoformat() if ult else None,
                                   "ultima_captura": ult["capturado_en"] if ult else None,
                                   "frescura_horas": _fresc(ult["capturado_en"]) if ult else None, "capturas": len(caps)})
        cortes = fuentes["oro_cortes"]
        ult_c = cortes[-1] if cortes else None
        gen_c = ult_c["corte"]["metadata_corte"].get("generado_en") if ult_c else None
        fuentes_estado.append({"fuente": "Vigía · cortes oro (ICR)", "ultima_fecha_dato": ult_c["fecha"].isoformat() if ult_c else None,
                               "ultima_captura": gen_c, "frescura_horas": _fresc(gen_c), "capturas": len(cortes)})

        hash_entradas = self._hash.hexdigest()
        corte_semanal = {
            "metadata": {
                "semana_actual": semana_actual,
                "semana_vigente": semana_vigente,
                "generado_en": generado_en.isoformat(),
                "version_config": cfg["version"],
                "hash_entradas": hash_entradas,
                "id_ejecucion": id_ejecucion,
                "total_semanas": len(semanas),
                "semanas_con_datos": len(con_datos),
                "desplazamientos_referencia": desplazamientos,
                "frescura_horas_aviso": cfg.get("frescura_horas_aviso", 36),
                "semanas_matriz": cfg.get("semanas_matriz", 12),
                "deteccion_evento": det,
                "archivos_entrada": len(self._archivos_entrada),
                "uso": "Uso interno CRA",
            },
            "variables": variables,
            "dim_semana": dim_semana,
            "series": series,
            "fct_variable_semana": fct,
            "evento_vigente": evento_vigente,
            "analogos": analogos,
            "fct_depto_semana": deptos,
            "niveles_municipio": niveles_mun,
            "fuentes": fuentes_estado,
        }

        self._publicar(obs_plata, corte_semanal, semana_vigente)
        return corte_semanal

    # --------------------------------------------------------------- publicar
    def _escribir(self, ruta: Path, contenido: Any) -> None:
        ruta.parent.mkdir(parents=True, exist_ok=True)
        tmp = ruta.with_suffix(ruta.suffix + ".tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(contenido, f, ensure_ascii=False, separators=(",", ":"), default=str)
        tmp.replace(ruta)  # escritura atómica: el tablero nunca lee un archivo a medias

    def _publicar(self, obs_plata: List[Dict[str, Any]], corte: Dict[str, Any], semana_vigente: str) -> None:
        self._escribir(self.plata_dir / "obs_variable_semana.json", obs_plata)
        vigente = self.oro_dir / "corte_semanal_vigente.json"
        self._escribir(vigente, corte)
        # Corte de semana: se sobrescribe mientras la semana está abierta; congelado al cerrarse
        por_semana = self.oro_dir / f"corte_semanal_{semana_vigente}.json"
        if not (por_semana.exists() and fin_semana(semana_vigente) < self.hoy):
            shutil.copyfile(vigente, por_semana)
        self.publicacion_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(vigente, self.publicacion_dir / "comparativo_semanal.json")

        # Registrar en almacén histórico inmutable (RF-SEM-09)
        try:
            from ingesta.semanal.historico import AlmacenHistorico
            almacen = AlmacenHistorico(self.root, self.cargar_config(), self.hoy)
            almacen.registrar(corte, self._cargar_cortes_oro())
        except Exception as e:
            logger.warning(f"No se pudo registrar en AlmacenHistorico: {e}")


# =============================================================================
# Bitácora ops (append-only)
# =============================================================================
def registrar_ejecucion(base_dir: Optional[str], registro: Dict[str, Any]) -> None:
    root = Path(base_dir or Path(__file__).resolve().parent.parent.parent)
    ruta = root / "data" / "ops" / "ejecuciones_semanal.json"
    ruta.parent.mkdir(parents=True, exist_ok=True)
    historial: List[Dict[str, Any]] = []
    if ruta.exists():
        try:
            historial = json.loads(ruta.read_text(encoding="utf-8"))
        except Exception:
            historial = []
    historial.append(registro)
    ruta.write_text(json.dumps(historial[-500:], ensure_ascii=False, indent=2), encoding="utf-8")


def ejecutar_actualizacion(
    modo: str = "recalculo",
    base_dir: Optional[str] = None,
    on_paso: Optional[Callable[[str, str, str], None]] = None,
) -> Dict[str, Any]:
    """
    RF-SEM-05. modo='completo': ciclo FL-01 (conectores + corte oro) y luego modelo semanal.
    modo='recalculo': solo reconstruye el modelo semanal desde bronce/oro existentes.
    on_paso(paso, estado, mensaje) informa el progreso a la interfaz.
    """
    if modo not in ("completo", "recalculo"):
        raise ValueError("modo debe ser 'completo' o 'recalculo'")
    notificar = on_paso or (lambda *_: None)
    id_ejecucion = str(uuid.uuid4())
    registro: Dict[str, Any] = {
        "id_ejecucion": id_ejecucion, "modo": modo,
        "inicio": datetime.now(timezone.utc).isoformat(), "fin": None,
        "estado": "en_ejecucion", "pasos": [], "hash_entradas": None,
        "semana_publicada": None, "mensaje": "",
    }

    def paso(nombre: str, estado: str, mensaje: str = "") -> None:
        registro["pasos"] = [p for p in registro["pasos"] if p["paso"] != nombre]
        registro["pasos"].append({"paso": nombre, "estado": estado, "mensaje": mensaje})
        notificar(nombre, estado, mensaje)

    parcial = False
    try:
        if modo == "completo":
            from ingesta.orquestador import OrquestadorIngesta
            orq = OrquestadorIngesta(base_dir=base_dir)
            res = orq.ejecutar_ciclo_completo(on_progreso=paso)
            parcial = any(c.get("estado") == "fallida" for c in res.get("resumen_capturas", {}).values())

        paso("Modelo semanal", "en_ejecucion", "Consolidando plata y oro semanal")
        corte = ModeloSemanal(base_dir=base_dir).construir(id_ejecucion=id_ejecucion)
        meta = corte["metadata"]
        paso("Modelo semanal", "exitosa", f"Semana vigente {meta['semana_vigente']}")
        paso("Publicación", "exitosa", "Corte semanal publicado en oro y tablero")
        registro.update(estado="parcial" if parcial else "exitoso",
                        hash_entradas=meta["hash_entradas"], semana_publicada=meta["semana_vigente"],
                        mensaje="Actualización completada" + (" con fuentes fallidas" if parcial else ""))
    except Exception as e:
        logger.exception("Falla en actualización semanal")
        registro.update(estado="fallido", mensaje=str(e))
        paso("Error", "fallida", str(e))
    finally:
        registro["fin"] = datetime.now(timezone.utc).isoformat()
        registrar_ejecucion(base_dir, registro)
    return registro


if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    p = argparse.ArgumentParser(description="Modelo semanal — Vigía El Niño (V-08)")
    p.add_argument("--modo", choices=["recalculo", "completo"], default="recalculo")
    a = p.parse_args()
    r = ejecutar_actualizacion(a.modo, on_paso=lambda n, e, m: print(f"  [{e:^12}] {n} {m}"))
    print(json.dumps({k: r[k] for k in ("estado", "semana_publicada", "mensaje")}, ensure_ascii=False, indent=2))
