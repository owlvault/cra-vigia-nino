"""
Conector oficial IDEAM — mediciones de precipitación y Estudio Nacional del Agua
Fuentes: FTE-IDEAM-PREC, FTE-IDEAM-ENA (FTE-IDEAM-CAUD pendiente, ver H-1)
Indicadores:
- A-3: anomalía de precipitación 30 días (%)          — red automática + normales 1991-2020
- A-4: días consecutivos sin lluvia (< 1 mm)           — red automática
- H-1: caudal de la fuente abastecedora                — sin_dato (RF-TER-05, Q-TER-03)
- H-2: vulnerabilidad hídrica en año seco (ENA 2010)   — subzona de la cabecera
- H-3: uso del agua en año seco (ENA 2014)             — subzona de la cabecera

Reemplaza el catálogo estático anterior (hallazgo 1 de la auditoría): todo
valor sale de consultas a servicios oficiales del IDEAM, cuyo crudo se guarda
en bronce. Parámetros y URLs en data/config/parametros_ideam.json; estaciones
por municipio en data/config/estaciones_ideam.json.
"""

import hashlib
import json
import logging
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from ingesta.clima import precipitacion_municipal as pm
from ingesta.conector_base import CapturaResultado, ConectorBase

logger = logging.getLogger("ConectorIDEAM")


class ConectorIDEAM(ConectorBase):
    TAMANO_LOTE_ESTACIONES = 40

    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-IDEAM-CLIMA",
            nombre_fuente="Precipitación y Estudio Nacional del Agua del IDEAM",
            entidad="Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM)",
            base_dir=base_dir
        )
        cfg = self.root_dir / "data" / "config"
        self.conf = json.loads((cfg / "parametros_ideam.json").read_text(encoding="utf-8"))
        self.estaciones = json.loads((cfg / "estaciones_ideam.json").read_text(encoding="utf-8"))
        self.territorio = json.loads((cfg / "territorio_municipios.json").read_text(encoding="utf-8"))["municipios"]
        # H-2/H-3 son estáticos: el cruce cabecera–subzona ENA se hace una vez (cruce_hidrografico.construir_ena)
        ruta_ena = cfg / "ena_municipios.json"
        self.ena_config = json.loads(ruta_ena.read_text(encoding="utf-8")) if ruta_ena.exists() else None

    # ------------------------------------------------------------------ red
    def _get_json(self, url: str, params: Dict[str, str], timeout: int = 180) -> Any:
        req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}",
                                     headers={"User-Agent": self.USER_AGENT, "Accept": "application/json"})
        with urllib.request.urlopen(req, context=self.ssl_context, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8"))

    def consultar_diarios(self, codigos: List[str], desde: date, hasta: date) -> List[List[Any]]:
        """Lluvia diaria por estación: [código, 'AAAA-MM-DD', mm, n_registros]."""
        f = self.conf["fuentes"]["precipitacion_10min"]
        filas: List[List[Any]] = []
        for i in range(0, len(codigos), self.TAMANO_LOTE_ESTACIONES):
            lote = ",".join(f"'{c}'" for c in codigos[i:i + self.TAMANO_LOTE_ESTACIONES])
            res = self._get_json(f["url"], {
                "$select": "codigoestacion, date_trunc_ymd(fechaobservacion) as dia, "
                           "sum(valorobservado) as mm, count(*) as n",
                "$where": (f"codigoestacion in ({lote}) AND codigosensor='{f['codigo_sensor']}' "
                           f"AND fechaobservacion between '{desde.isoformat()}T00:00:00' "
                           f"and '{hasta.isoformat()}T23:59:59'"),
                "$group": "codigoestacion, dia", "$limit": "50000"})
            filas += [[r["codigoestacion"], r["dia"][:10], round(float(r["mm"]), 2), int(r["n"])] for r in res]
        return filas

    def consultar_normales(self, codigos: List[str]) -> Dict[str, Dict[str, float]]:
        f = self.conf["fuentes"]["normales_climatologicas"]
        res = self._get_json(f["url"], {"$where": f"periodo='{f['periodo']}' AND par_metro='{f['parametro']}'",
                                        "$limit": "50000"})
        buscados = set(codigos)
        normales = {}
        for r in res:
            if r["c_digo"] in buscados:
                normales[r["c_digo"]] = {m: float(r[m]) for m in pm.MESES_NORMAL if r.get(m) not in (None, "")}
        return normales

    def consultar_ena(self, lat: float, lon: float, clave: str) -> Optional[str]:
        f = self.conf["fuentes"][clave]
        res = self._get_json(f"{f['url']}/query", {
            "geometry": f"{lon},{lat}", "geometryType": "esriGeometryPoint",
            "inSR": str(self.conf["fuentes"]["sistema_referencia"]), "spatialRel": "esriSpatialRelIntersects",
            "outFields": f["campo_categoria"], "returnGeometry": "false", "f": "json"}, timeout=60)
        if "error" in res:
            raise RuntimeError(f"IDEAM respondió error en {clave}: {res['error']}")
        feats = res.get("features", [])
        return feats[0]["attributes"][f["campo_categoria"]] if len(feats) == 1 else None

    def categorias_ena(self) -> Dict[str, Dict[str, Optional[str]]]:
        """
        H-2/H-3 por municipio. Fase 0: se leen del cruce estático data/config/ena_municipios.json
        (capas ENA descargadas en bloque). Sin ese archivo se consulta el servicio punto a punto,
        como antes (solo viable para pocos municipios: RF-ING-07).
        """
        if self.ena_config is not None:
            mun = self.ena_config["municipios"]
            return {m["divipola"]: {"h2_ivh_ano_seco": mun.get(m["divipola"], {}).get("h2_ivh_ano_seco"),
                                    "h3_iua_ano_seco": mun.get(m["divipola"], {}).get("h3_iua_ano_seco")}
                    for m in self.territorio}
        ena = {}
        for m in self.territorio:
            ena[m["divipola"]] = {"h2_ivh_ano_seco": self.consultar_ena(m["lat"], m["lon"], "ena_h2_ivh_ano_seco"),
                                  "h3_iua_ano_seco": self.consultar_ena(m["lat"], m["lon"], "ena_h3_iua_ano_seco")}
            time.sleep(1.0)
        return ena

    # ------------------------------------------------------------- cálculo
    def calcular_municipio(self, divipola: str, diarios: Dict[str, Dict[date, Tuple[float, int]]],
                           normales: Dict[str, Dict[str, float]], hasta: date) -> Dict[str, Any]:
        p = self.conf["precipitacion"]
        asign = self.estaciones["municipios"][divipola]
        dias = [hasta - timedelta(days=k) for k in range(p["dias_historia_consulta"])]
        min_reg = int(p["registros_por_dia_completo"] * p["fraccion_minima_registros_dia"])
        max_reg = int(p["registros_por_dia_completo"] * p["fraccion_maxima_registros_dia"])

        serie = pm.serie_municipal(diarios, asign["automaticas"]["dentro"], asign["automaticas"]["cercanas_km"],
                                   dias, min_reg, p["estaciones_idw"], p["potencia_idw"], max_reg)
        fin = pm.ultimo_dia_con_dato(serie, hasta, p["dias_maximos_sin_dato_reciente"])
        res: Dict[str, Any] = {"fecha_dato": fin.isoformat() if fin else None, "a4": None, "a4_cota_inferior": None,
                               "a3": None, "lluvia_30d_mm": None, "normal_30d_mm": None, "dias_validos_30d": 0}
        if fin is None:
            return res

        res["a4"], res["a4_cota_inferior"] = pm.dias_consecutivos_secos(serie, fin, p["umbral_dia_seco_mm"])

        # Línea base: normal municipal (misma regla RF-TER-04 sobre la red de normales)
        n_dentro = [normales[c] for c in asign["normales"]["dentro"] if c in normales]
        n_cerca = [(d, normales[c]) for c, d in asign["normales"]["cercanas_km"].items() if c in normales]
        base = None
        if n_dentro or len(n_cerca) >= p["estaciones_idw"]:
            meses = {}
            for mes in pm.MESES_NORMAL:
                val, _ = pm.valor_municipal([n[mes] for n in n_dentro if mes in n],
                                            [(d, n[mes]) for d, n in n_cerca if mes in n],
                                            p["estaciones_idw"], p["potencia_idw"])
                if val is not None:
                    meses[mes] = val
            base = pm.normal_ventana(meses, fin, p["dias_ventana_anomalia"])
        res["a3"], res["lluvia_30d_mm"], res["dias_validos_30d"] = pm.anomalia_30d(
            serie, fin, p["dias_ventana_anomalia"], p["dias_validos_minimos_ventana"], base)
        res["normal_30d_mm"] = round(base, 1) if base else None
        return res

    # ------------------------------------------------------------- captura
    def ejecutar_captura(self) -> CapturaResultado:
        ahora = datetime.now(timezone.utc)
        hasta = ahora.date() - timedelta(days=1)  # último día completo
        desde = hasta - timedelta(days=self.conf["precipitacion"]["dias_historia_consulta"] - 1)

        auto = sorted({c for v in self.estaciones["municipios"].values()
                       for c in v["automaticas"]["dentro"] + list(v["automaticas"]["cercanas_km"])})
        norm = sorted({c for v in self.estaciones["municipios"].values()
                       for c in v["normales"]["dentro"] + list(v["normales"]["cercanas_km"])})
        filas = self.consultar_diarios(auto, desde, hasta)
        normales = self.consultar_normales(norm)
        ena = self.categorias_ena()

        diarios: Dict[str, Dict[date, Tuple[float, int]]] = {}
        for cod, dia, mm, n in filas:
            diarios.setdefault(cod, {})[date.fromisoformat(dia)] = (mm, n)

        datos: Dict[str, Any] = {}
        resumen: Dict[str, Any] = {}
        f_ena2 = self.conf["fuentes"]["ena_h2_ivh_ano_seco"]["fecha_dato"]
        f_ena3 = self.conf["fuentes"]["ena_h3_iua_ano_seco"]["fecha_dato"]
        for m in self.territorio:
            div = m["divipola"]
            c = self.calcular_municipio(div, diarios, normales, hasta)
            datos[div] = {
                "divipola": div, "nombre_municipio": m["nombre"],
                "indicador_a3_anomalia_precip_pct": c["a3"],
                "indicador_a4_dias_sin_lluvia": c["a4"],
                "indicador_h1_caudal_pct": None,  # RF-TER-05: sin vínculo fuente abastecedora–estación (Q-TER-03)
                "indicador_h2_ivh_ena": ena[div]["h2_ivh_ano_seco"],
                "indicador_h3_iua_ena": ena[div]["h3_iua_ano_seco"],
                "fecha_dato": c["fecha_dato"], "fecha_dato_h2": f_ena2, "fecha_dato_h3": f_ena3,
                "a4_cota_inferior": c["a4_cota_inferior"], "lluvia_30d_mm": c["lluvia_30d_mm"],
                "normal_30d_mm": c["normal_30d_mm"], "dias_validos_30d": c["dias_validos_30d"],
                "fuente": "IDEAM (red automática, normales 1991-2020, ENA)",
            }
            # Resumen con los nombres de campo que reconcilia el auditor de veracidad
            resumen[div] = {"nombre": m["nombre"], "anomalia_precip_pct": c["a3"], "dias_sin_lluvia": c["a4"],
                            "caudal_fuente_pct": None, "ivh_ena": ena[div]["h2_ivh_ano_seco"],
                            "iua_ena": ena[div]["h3_iua_ano_seco"], "fecha_dato": c["fecha_dato"]}

        snapshot = {
            "fuente": "IDEAM — red automática de precipitación, normales climatológicas 1991-2020 y ENA",
            "consultas": {k: self.conf["fuentes"][k]["url"] for k in
                          ("precipitacion_10min", "normales_climatologicas", "ena_h2_ivh_ano_seco", "ena_h3_iua_ano_seco")},
            "ena_origen": ({"archivo": "data/config/ena_municipios.json", "fuentes": self.ena_config.get("fuentes")}
                           if self.ena_config is not None else "consulta puntual al servicio"),
            "ventana": {"desde": desde.isoformat(), "hasta": hasta.isoformat()},
            "fecha_reporte": ahora.strftime("%Y-%m-%d"),
            "fecha_captura": ahora.isoformat(),
            "version_parametros": self.conf["version"],
            "crudo": {"diarios_campos": ["codigoestacion", "dia", "mm", "n_registros"], "diarios": filas,
                      "normales_1991_2020": normales, "ena_por_cabecera": ena},
            "total_municipios": len(resumen),
            "municipios": resumen,
        }
        contenido = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido).hexdigest()
        ruta = self.guardar_en_bronce(contenido, "json", hash_sha256)

        con_a4 = sum(1 for d in datos.values() if d["indicador_a4_dias_sin_lluvia"] is not None)
        con_a3 = sum(1 for d in datos.values() if d["indicador_a3_anomalia_precip_pct"] is not None)
        return CapturaResultado(
            id_fuente=self.id_fuente, estado="exitosa", hash_sha256=hash_sha256,
            bytes_descargados=len(contenido), filas_procesadas=len(filas), ruta_archivo_bronce=str(ruta),
            mensaje=(f"IDEAM: {len(filas)} días-estación de {len(auto)} estaciones; "
                     f"A-4 en {con_a4}/{len(datos)} y A-3 en {con_a3}/{len(datos)} municipios"),
            datos_extraidos=datos,
        )
