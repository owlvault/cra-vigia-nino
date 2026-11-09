"""
Conector CHIRPS v3.0 — respaldo satelital nacional de A-3 y A-4 (Fase 0)
Fuente: FTE-CHIRPS (Climate Hazards Center, UCSB, con USGS EROS / FEWS NET)
Indicadores:
- A-3: anomalía de precipitación 30 días (%) contra la normal CHIRPS 1991-2020
- A-4: días consecutivos con lluvia municipal < 1 mm (aproximado: ver asunciones)

Uso en el corte: solo donde las estaciones del IDEAM no producen valor
(PipelineCorte prioriza IDEAM). Cubre los 1.122 municipios porque no depende de
que haya una estación en el municipio.

Eficiencia: cada día se lee una sola vez (ventana de Colombia por rangos HTTP) y
su promedio municipal se guarda en data/plata/chirps/diario_municipal.json; las
corridas siguientes solo leen los días nuevos o los que pasaron de preliminar a final.
"""

import hashlib
import json
import logging
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from ingesta.clima import chirps
from ingesta.clima import precipitacion_municipal as pm
from ingesta.conector_base import CapturaResultado, ConectorBase

logger = logging.getLogger("ConectorCHIRPS")


def indicadores_municipio(serie: Dict[date, Optional[float]], normal: Dict[str, float], hasta: date,
                          p: Dict[str, Any]) -> Dict[str, Any]:
    """A-3 y A-4 de un municipio a partir de su serie diaria CHIRPS (función pura)."""
    fin = pm.ultimo_dia_con_dato(serie, hasta, p["dias_maximos_atraso"])
    res: Dict[str, Any] = {"fecha_dato": fin.isoformat() if fin else None, "a3": None, "a4": None,
                           "a4_cota_inferior": None, "lluvia_30d_mm": None, "normal_30d_mm": None,
                           "dias_validos_30d": 0}
    if fin is None:
        return res
    res["a4"], res["a4_cota_inferior"] = pm.dias_consecutivos_secos(serie, fin, p["umbral_dia_seco_mm"])
    base = pm.normal_ventana(normal, fin, p["dias_ventana_anomalia"]) if normal else None
    res["a3"], res["lluvia_30d_mm"], res["dias_validos_30d"] = pm.anomalia_30d(
        serie, fin, p["dias_ventana_anomalia"], p["dias_validos_minimos_ventana"], base)
    res["normal_30d_mm"] = round(base, 1) if base else None
    return res


class ConectorCHIRPS(ConectorBase):
    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-CHIRPS",
            nombre_fuente="Precipitación satelital CHIRPS v3.0 (respaldo nacional de A-3 y A-4)",
            entidad="Climate Hazards Center, UCSB (con USGS EROS y FEWS NET)",
            base_dir=base_dir
        )
        cfg = self.root_dir / "data" / "config"
        self.conf = json.loads((cfg / "parametros_chirps.json").read_text(encoding="utf-8"))
        self.territorio = json.loads((cfg / "territorio_municipios.json").read_text(encoding="utf-8"))["municipios"]
        ruta_normales = cfg / "normales_chirps.json"
        self.normales = json.loads(ruta_normales.read_text(encoding="utf-8")) if ruta_normales.exists() else None
        self.ruta_cache = self.root_dir / "data" / "plata" / "chirps" / "diario_municipal.json"
        self._rejilla: Optional[chirps.Rejilla] = None

    # ---------------------------------------------------------------- caché
    def _leer_cache(self) -> Dict[str, Any]:
        if self.ruta_cache.exists():
            return json.loads(self.ruta_cache.read_text(encoding="utf-8"))
        return {"descripcion": "Promedio municipal diario CHIRPS v3.0 (mm). Zona plata: derivado de los rásteres remotos.",
                "dias": {}}

    def _guardar_cache(self, cache: Dict[str, Any], desde: date) -> None:
        # solo se conserva la ventana útil (y un margen) para que el archivo no crezca sin límite
        limite = (desde - timedelta(days=30)).isoformat()
        cache["dias"] = {d: v for d, v in sorted(cache["dias"].items()) if d >= limite}
        self.ruta_cache.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.ruta_cache.with_suffix(".tmp")
        tmp.write_text(json.dumps(cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        tmp.replace(self.ruta_cache)

    def _promedios_dia(self, url: str) -> Dict[str, Optional[float]]:
        from ingesta.territorio.geometrias_ideam import poligonos_municipales
        arr, transform = chirps.leer_ventana_con_reintento(url, self.conf["ventana_colombia"])
        if self._rejilla is None:
            self._rejilla = chirps.construir_rejilla(transform, arr.shape, self.territorio,
                                                     poligonos_municipales(self.root_dir))
        return chirps.promedios_municipales(arr, self._rejilla)

    def actualizar_cache(self, desde: date, hasta: date) -> Tuple[Dict[str, Any], List[Dict[str, str]]]:
        """Lee los días faltantes o mejorables (prelim -> final). Devuelve (caché, lecturas hechas)."""
        cache = self._leer_cache()
        disp = chirps.disponibilidad(self.conf, sorted({desde.year, hasta.year}))
        leidos: List[Dict[str, str]] = []
        dia = desde
        while dia <= hasta:
            clave = dia.isoformat()
            if dia in disp:
                version, url = disp[dia]
                previo = cache["dias"].get(clave)
                if previo is None or (previo["version"] == "prelim" and version == "final"):
                    cache["dias"][clave] = {"version": version, "url": url, "valores": self._promedios_dia(url),
                                            "leido_en": datetime.now(timezone.utc).isoformat()}
                    leidos.append({"dia": clave, "version": version, "url": url})
                    time.sleep(self.conf["precipitacion"]["pausa_segundos_entre_archivos"])
            dia += timedelta(days=1)
        self._guardar_cache(cache, desde)
        return cache, leidos

    # -------------------------------------------------------------- captura
    def ejecutar_captura(self) -> CapturaResultado:
        if self.normales is None:
            raise FileNotFoundError("Falta data/config/normales_chirps.json (python -m ingesta.clima.chirps)")
        p = self.conf["precipitacion"]
        ahora = datetime.now(timezone.utc)
        hasta = ahora.date() - timedelta(days=1)
        desde = hasta - timedelta(days=p["dias_historia_consulta"] - 1)
        cache, leidos = self.actualizar_cache(desde, hasta)

        dias = [hasta - timedelta(days=k) for k in range(p["dias_historia_consulta"])]
        datos: Dict[str, Any] = {}
        for m in self.territorio:
            div = m["divipola"]
            serie = {d: (cache["dias"].get(d.isoformat(), {}).get("valores", {}).get(div)) for d in dias}
            serie = {d: v for d, v in serie.items() if d.isoformat() in cache["dias"]}
            c = indicadores_municipio(serie, self.normales["normales"].get(div, {}), hasta, p)
            fin = c["fecha_dato"]
            # usar_en_icr (parametros_chirps.json): si está desactivado, el valor viaja solo como referencia
            usar = self.conf.get("usar_en_icr", {})
            datos[div] = {
                "divipola": div,
                "indicador_a3_anomalia_precip_pct": c["a3"] if usar.get("A-3", True) else None,
                "indicador_a4_dias_sin_lluvia": c["a4"] if usar.get("A-4", True) else None,
                "referencia_a3_pct": c["a3"], "referencia_a4_dias": c["a4"],
                "a4_cota_inferior": c["a4_cota_inferior"],
                "fecha_dato": fin,
                "version_dato": cache["dias"].get(fin, {}).get("version") if fin else None,
                "lluvia_30d_mm": c["lluvia_30d_mm"], "normal_30d_mm": c["normal_30d_mm"],
                "dias_validos_30d": c["dias_validos_30d"],
                "metodo_espacial": self.normales.get("metodo_espacial", {}).get(div),
                "fuente": "CHIRPS v3.0 (UCSB CHC, satélite + estaciones)",
            }

        usados = sorted(d for d in cache["dias"] if desde.isoformat() <= d <= hasta.isoformat())
        snapshot = {
            "fuente": "CHIRPS v3.0 diario (sat) — Climate Hazards Center, UCSB",
            "ventana": {"desde": desde.isoformat(), "hasta": hasta.isoformat()},
            "fecha_captura": ahora.isoformat(),
            "version_parametros": self.conf["version"],
            "normal": {"archivo": "data/config/normales_chirps.json", "periodo": self.normales.get("periodo")},
            "archivos_leidos_en_esta_corrida": leidos,
            "dias_usados": {d: {"version": cache["dias"][d]["version"], "url": cache["dias"][d]["url"]} for d in usados},
            # Solo los días leídos en esta corrida: los anteriores ya están en capturas previas de bronce
            "crudo": {"campos": ["dia", "divipola", "mm"],
                      "valores_por_dia": {x["dia"]: cache["dias"][x["dia"]]["valores"] for x in leidos
                                          if x["dia"] in cache["dias"]}},
            "municipios": {div: {k: v for k, v in d.items() if k != "divipola"} for div, d in datos.items()},
        }
        contenido = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido).hexdigest()
        ruta = self.guardar_en_bronce(contenido, "json", hash_sha256)

        con_a3 = sum(1 for d in datos.values() if d["referencia_a3_pct"] is not None)
        con_a4 = sum(1 for d in datos.values() if d["referencia_a4_dias"] is not None)
        ultimo = usados[-1] if usados else None
        return CapturaResultado(
            id_fuente=self.id_fuente, estado="exitosa", hash_sha256=hash_sha256,
            bytes_descargados=len(contenido), filas_procesadas=len(usados), ruta_archivo_bronce=str(ruta),
            mensaje=(f"CHIRPS: {len(leidos)} días leídos, último día disponible {ultimo}; "
                     f"A-3 en {con_a3}/{len(datos)} y A-4 en {con_a4}/{len(datos)} municipios; "
                     f"en el ICR: A-3 {'sí' if self.conf.get('usar_en_icr', {}).get('A-3', True) else 'no'}, "
                     f"A-4 {'sí' if self.conf.get('usar_en_icr', {}).get('A-4', True) else 'no'}"),
            datos_extraidos=datos,
        )
