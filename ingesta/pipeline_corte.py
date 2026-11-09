"""
Motor de Cálculo del Índice Compuesto de Riesgo (ICR) y Pipeline de Corte
Proyecto: Vigía El Niño · Acueductos (CRA)
Especificaciones:
- specs/indicadores.md
- specs/indice-riesgo.md
- specs/modelo-territorial.md
- specs/calidad-datos.md
"""

import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("PipelineCorte")

class ConfiguracionInvalida(ValueError):
    """La configuración versionada no cumple las reglas de la spec y se rechaza."""


class PipelineCorte:

    @staticmethod
    def _escribir_atomico(ruta_destino: Path, contenido: str) -> None:
        """Escribe un archivo de manera atómica usando un archivo temporal y reemplazo."""
        ruta_destino.parent.mkdir(parents=True, exist_ok=True)
        temp_path = ruta_destino.with_name(f"{ruta_destino.name}.tmp.{int(time.time() * 1000)}")
        temp_path.write_text(contenido, encoding="utf-8")
        temp_path.replace(ruta_destino)

    ESTADO_PUBLICADO = "PUBLICADO_VALIDO"
    ESTADO_RECHAZADO = "RECHAZADO"

    def __init__(self, base_dir: Optional[str] = None):
        self.root_dir = Path(base_dir or Path(__file__).resolve().parent.parent)
        self.oro_dir = self.root_dir / "data" / "oro"
        self.plata_dir = self.root_dir / "data" / "plata"
        self.oro_dir.mkdir(parents=True, exist_ok=True)
        self.plata_dir.mkdir(parents=True, exist_ok=True)
        # Regla de oro 3: pesos, umbrales y territorio viven en config versionada, no en código
        self.parametros_corte = self._leer_config("parametros_corte.json")
        self.parametros_icr = self._leer_config("parametros_icr.json")
        self.territorio = self._leer_config("territorio_municipios.json")
        self.hidrografia = self._cargar_hidrografia()
        self.poblacion_dane = self._cargar_poblacion_dane()
        self.validar_parametros_icr(self.parametros_icr)
        self.VERSION_CONFIG = self.parametros_icr["version"]
        self.PESOS_CAPA = {capa: c["peso"] for capa, c in self.parametros_icr["capas"].items()}

    CAMPOS_HIDROGRAFICOS = ("cod_area_hidrografica", "area_hidrografica", "cod_zona_hidrografica",
                            "zona_hidrografica", "cod_subzona_hidrografica", "subzona_hidrografica")

    def _cargar_hidrografia(self) -> Dict[str, Dict[str, Any]]:
        """Zonificación IDEAM por divipola (ADR-0006). Si no existe el cruce, los campos quedan None."""
        ruta = self.root_dir / "data" / "config" / "territorio_hidrografico.json"
        if not ruta.exists():
            return {}
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        return {m["divipola"]: m for m in datos.get("municipios", []) if m.get("estado") == "resuelto"}

    def _cargar_poblacion_dane(self) -> Dict[str, Any]:
        """Proyecciones DANE por municipio y año (RF-TER-06). Si no existe el archivo, vacío."""
        ruta = self.root_dir / "data" / "config" / "poblacion_dane.json"
        return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}

    def poblacion_municipio(self, municipio: Dict[str, Any], anio: str) -> Tuple[int, str]:
        """
        Población del año del corte según el DANE. Si falta la proyección, usa el valor
        de respaldo de territorio_municipios.json y lo declara en la fuente: así la
        compuerta del canal ciudadano (C-CIU-04) lo detecta.
        """
        serie = self.poblacion_dane.get("poblacion_por_anio", {}).get(municipio["divipola"], {})
        if anio in serie:
            act = self.poblacion_dane.get("fuente", {}).get("actualizacion_dane") or ""
            return serie[anio], f"DANE PPED 2018-2042, proyección {anio} ({act})".strip()
        logger.warning(f"Sin proyección DANE {anio} para {municipio['divipola']}; se usa el valor de respaldo")
        if municipio.get("poblacion") is None:   # municipio agregado en la Fase 0, sin respaldo del prototipo
            return 0, "sin población (sin proyección DANE ni respaldo)"
        return municipio["poblacion"], "prototipo (sin proyección DANE)"

    # Precedencia de fuentes para A-3 y A-4 (Fase 0, cobertura nacional): la medición de
    # estaciones del IDEAM manda; CHIRPS v3 solo llena donde las estaciones no dan valor.
    FUENTE_CHIRPS = "CHIRPS v3.0 (UCSB CHC)"

    def elegir_precipitacion(self, ideam: Dict[str, Any], chirps: Dict[str, Any], campo: str) -> Dict[str, Any]:
        """Valor, fuente, fecha, método y cota inferior (A-4) del indicador de lluvia para un municipio."""
        v = self._num(ideam.get(campo))
        if v is not None:
            return {"valor": v, "fuente": "IDEAM", "fecha_dato": ideam.get("fecha_dato"),
                    "metodo": "estaciones_ideam", "cota_inferior": ideam.get("a4_cota_inferior")}
        v = self._num(chirps.get(campo))
        if v is not None:
            version = chirps.get("version_dato")
            return {"valor": v, "fuente": self.FUENTE_CHIRPS, "fecha_dato": chirps.get("fecha_dato"),
                    "metodo": f"satelite_chirps_{version}" if version else "satelite_chirps",
                    "cota_inferior": chirps.get("a4_cota_inferior")}
        # Sin valor en ninguna: se conserva la fecha del IDEAM (como antes) y el método queda declarado
        return {"valor": None, "fuente": "IDEAM", "fecha_dato": ideam.get("fecha_dato"),
                "metodo": "sin_dato", "cota_inferior": None}

    @staticmethod
    def _municipios_con_embalse() -> set:
        """H-5 solo aplica donde un embalse del catálogo XM abastece al municipio."""
        try:
            from ingesta.conectores.conector_xm_embalses import ConectorXMEmbalses
            return {d for e in ConectorXMEmbalses.CATALOGO_EMBALSES.values() for d in e["municipios_asociados"]}
        except Exception as e:  # noqa: BLE001
            logger.warning(f"No se pudo leer el catálogo de embalses: {e}")
            return set()

    def _leer_config(self, nombre: str) -> Dict[str, Any]:
        ruta = self.root_dir / "data" / "config" / nombre
        return json.loads(ruta.read_text(encoding="utf-8"))

    # Claves de parametros_icr.json que el tablero necesita para no repetir pesos, umbrales ni capas en código
    CLAVES_CONFIG_TABLERO = ("version", "capas", "niveles_alerta", "quiebres",
                             "puntaje_categorico", "puntaje_binario", "piso_por_impacto")

    def monitor_fuentes(self) -> List[Dict[str, Any]]:
        """
        Resumen por fuente de la bitácora ops/capturas.json (RF-ING-01) para la vista V-07:
        última captura (cualquier estado) y última captura válida (exitosa o sin cambios).
        Nada se completa por defecto: si no hay bitácora, la lista queda vacía.
        """
        ruta = self.root_dir / "data" / "ops" / "capturas.json"
        if not ruta.exists():
            return []
        try:
            capturas = json.loads(ruta.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"No se pudo leer la bitácora de capturas: {e}")
            return []
        resumen: Dict[str, Dict[str, Any]] = {}
        for c in capturas:
            fid = c.get("id_fuente")
            if not fid:
                continue
            r = resumen.setdefault(fid, {"id_fuente": fid, "total_capturas": 0, "fallidas": 0,
                                         "ultima": None, "ultima_valida": None})
            r["total_capturas"] += 1
            if c.get("estado") == "fallida":
                r["fallidas"] += 1
            r["ultima"] = {k: c.get(k) for k in ("estado", "capturado_en", "mensaje", "filas_procesadas")}
            if c.get("estado") == "exitosa":
                r["ultima_valida"] = {k: c.get(k) for k in
                                      ("capturado_en", "hash_sha256", "filas_procesadas", "ruta_archivo_bronce")}
            elif c.get("estado") == "sin_cambios" and r["ultima_valida"]:
                # Confirma que el crudo vigente sigue igual: se actualiza la fecha, no las filas ni la ruta
                r["ultima_valida"]["capturado_en"] = c.get("capturado_en")
        return sorted(resumen.values(), key=lambda r: r["id_fuente"])

    def publicar_data_js(self, corte_json_str: str) -> None:
        """
        Escribe tablero/js/data.js con el corte, la configuración del ICR vigente y el monitor de fuentes.
        Se escapa '</' para que el JSON no pueda cerrar la etiqueta <script>.
        """
        config_tablero = {k: self.parametros_icr[k] for k in self.CLAVES_CONFIG_TABLERO if k in self.parametros_icr}
        seguro = lambda s: s.replace("</", "<\\/")  # noqa: E731
        contenido = (
            "// Datos Maestros Integrados — Vigía El Niño · Acueductos. Generado por pipeline_corte: no editar.\n"
            f"window.VIGIA_DATA = {{ corte: {seguro(corte_json_str)},\n"
            f"config_icr: {seguro(json.dumps(config_tablero, ensure_ascii=False))},\n"
            f"fuentes: {seguro(json.dumps(self.monitor_fuentes(), ensure_ascii=False))} }};\n"
        )
        self._escribir_atomico(self.root_dir / "tablero" / "js" / "data.js", contenido)

    def republicar_tablero(self) -> None:
        """Regenera data.js desde el corte vigente sin volver a capturar fuentes (cambios de config o de UI)."""
        ruta = self.oro_dir / "corte_vigente.json"
        self.publicar_data_js(ruta.read_text(encoding="utf-8"))

    @staticmethod
    def validar_parametros_icr(conf: Dict[str, Any]) -> None:
        """RN-ICR-01 (pesos suman 100 %) y caso borde 'umbrales no monótonos se rechazan'."""
        suma = sum(c["peso"] for c in conf["capas"].values())
        if abs(suma - 1.0) > 1e-9:
            raise ConfiguracionInvalida(f"Los pesos de capa suman {suma:.4f}, deben sumar 1")
        for cod, puntos in conf["quiebres"].items():
            valores = [v for v, _ in puntos]
            puntajes = [p for _, p in puntos]
            creciente = all(a < b for a, b in zip(valores, valores[1:]))
            decreciente = all(a > b for a, b in zip(valores, valores[1:]))
            if not (creciente or decreciente) or puntajes != sorted(puntajes):
                raise ConfiguracionInvalida(f"Quiebres no monótonos para {cod}: {puntos}")
        desde = [n["icr_desde"] for n in conf["niveles_alerta"]]
        if desde != sorted(desde):
            raise ConfiguracionInvalida("Los umbrales de nivel de alerta no son crecientes")

    @staticmethod
    def _parsear_fecha(fecha: Optional[str]) -> Optional[datetime]:
        """Acepta AAAA-MM-DD o el formato semanal de NOAA (28OCT2026)."""
        if not fecha:
            return None
        for formato in ("%Y-%m-%d", "%d%b%Y"):
            try:
                return datetime.strptime(fecha, formato)
            except ValueError:
                continue
        return None

    def evaluar_frescura(self, codigo: str, fecha_dato: Optional[str], fecha_corte: str, valor: Any) -> Optional[str]:
        """
        RF-CAL-03: 'vigente' si fecha_corte - fecha_dato <= multiplicador × periodo esperado;
        'desactualizado' si es mayor. Indicadores estáticos (periodo nulo) siempre vigentes.
        Sin valor o sin fecha interpretable: None (no hay dato cuya frescura evaluar).
        """
        if valor is None:
            return None
        conf = self.parametros_corte["frescura"]
        periodos = conf["periodo_dias_por_indicador"]
        if codigo not in periodos:
            return None
        periodo = periodos[codigo]
        if periodo is None:
            return "vigente"
        f_dato = self._parsear_fecha(fecha_dato)
        f_corte = self._parsear_fecha(fecha_corte)
        if f_dato is None or f_corte is None:
            return None
        edad_dias = (f_corte - f_dato).days
        return "vigente" if edad_dias <= conf["multiplicador_vigente"] * periodo else "desactualizado"

    def evaluar_compuerta(self, municipios: List[Dict[str, Any]]) -> Tuple[str, List[str]]:
        """
        RF-CAL-04: publica solo si (a) hay ICR en al menos el % mínimo de municipios y
        (b) el indicador de amenaza (A-1) está vigente. Devuelve (estado, motivos de rechazo).
        """
        conf = self.parametros_corte["compuerta_publicacion"]
        motivos: List[str] = []

        total = len(municipios)
        con_icr = sum(1 for m in municipios if m.get("icr") is not None)
        pct_icr = (con_icr / total * 100) if total else 0.0
        if pct_icr < conf["min_pct_municipios_con_icr"]:
            motivos.append(f"cobertura {pct_icr:.0f} % < {conf['min_pct_municipios_con_icr']:.0f} %")

        cod_amenaza = conf["indicador_amenaza_vigente"]
        amenaza_vigente = any(
            m.get("indicadores", {}).get(cod_amenaza, {}).get("frescura") == "vigente" for m in municipios
        )
        if not amenaza_vigente:
            motivos.append(f"{cod_amenaza} sin valor vigente")

        return (self.ESTADO_RECHAZADO if motivos else self.ESTADO_PUBLICADO), motivos

    @staticmethod
    def _num(valor: Any) -> Optional[float]:
        """Convierte a número; None, vacío o no numérico => None (sin_dato)."""
        if valor is None or valor == "":
            return None
        try:
            return float(valor)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _binario(valor: Any) -> Optional[int]:
        """1/0 solo si la fuente lo informa; cualquier otra cosa => None (RF-IND-04)."""
        if valor in (0, 1) and not isinstance(valor, bool):
            return int(valor)
        return None

    def normalizar_tramos(self, codigo: str, valor: Optional[float]) -> Optional[float]:
        """RF-ICR-01: interpolación lineal entre quiebres, recortada a [0, 100]. Sin valor => None."""
        if valor is None:
            return None
        puntos = self.parametros_icr["quiebres"][codigo]
        # Ordenar por valor ascendente para interpolar sin importar la dirección del indicador
        asc = sorted(puntos, key=lambda p: p[0])
        if valor <= asc[0][0]:
            return float(asc[0][1])
        if valor >= asc[-1][0]:
            return float(asc[-1][1])
        for (x0, y0), (x1, y1) in zip(asc, asc[1:]):
            if x0 <= valor <= x1:
                return round(y0 + (valor - x0) / (x1 - x0) * (y1 - y0), 2)
        return None

    def puntaje_categorico(self, categoria: Any) -> Optional[float]:
        """RF-ICR-02. Categoría ausente o no reconocida => None, nunca un puntaje por defecto."""
        if not isinstance(categoria, str):
            return None
        puntaje = self.parametros_icr["puntaje_categorico"].get(categoria.strip().lower())
        return None if puntaje is None else float(puntaje)

    def puntaje_binario(self, codigo: str, valor: Optional[int]) -> Optional[float]:
        """RF-ICR-03. Sin dato => None."""
        if valor is None:
            return None
        conf = self.parametros_icr["puntaje_binario"][codigo]
        return float(conf["activo"] if valor == 1 else conf["inactivo"])

    def excede_vigencia_icr(self, codigo: str, fecha_dato: Optional[str], fecha_corte: str) -> bool:
        """
        Caso borde de specs/indice-riesgo.md: un indicador cuya antigüedad supera
        'multiplicador_sin_dato' × su periodo esperado se trata como sin_dato en el ICR.
        """
        conf = self.parametros_corte["frescura"]
        mult = conf.get("multiplicador_sin_dato")
        periodo = conf["periodo_dias_por_indicador"].get(codigo)
        if mult is None or periodo is None:
            return False
        f_dato, f_corte = self._parsear_fecha(fecha_dato), self._parsear_fecha(fecha_corte)
        if f_dato is None or f_corte is None:
            return False
        return (f_corte - f_dato).days > mult * periodo

    def calcular_icr_municipio(
        self,
        divipola: str,
        nombre: str,
        depto: str,
        cod_depto: str,
        poblacion: int,
        indicadores: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calcula el ICR de un municipio de acuerdo a las especificaciones RF-ICR-01 a RF-ICR-06.
        Capas, pesos, agregación, umbrales y piso se leen de parametros_icr.json.
        """
        conf = self.parametros_icr

        # 1-4. Subíndice por capa: promedio de puntajes disponibles (máximo para R, RF-ICR-03)
        subindices: Dict[str, Optional[float]] = {}
        for capa, c in conf["capas"].items():
            puntajes = [indicadores[cod]["puntaje"] for cod in c["indicadores"]
                        if cod in indicadores and indicadores[cod].get("puntaje") is not None]
            if not puntajes:
                subindices[capa] = None
            elif c["agregacion"] == "maximo":
                subindices[capa] = max(puntajes)
            else:
                subindices[capa] = round(sum(puntajes) / len(puntajes), 2)

        # 5. Cobertura y redistribución de pesos (RF-ICR-04)
        capas_disponibles = {capa: (sub, conf["capas"][capa]["peso"])
                             for capa, sub in subindices.items() if sub is not None}
        suma_pesos_disponibles = sum(peso for _, peso in capas_disponibles.values())
        cobertura_pct = round(suma_pesos_disponibles * 100, 1)

        nivel_por_regla = False
        if suma_pesos_disponibles < conf["peso_minimo_disponible"]:
            icr_calculado = None
            nivel_alerta = "sin_dato"
        else:
            icr_ponderado = sum(sub * peso / suma_pesos_disponibles for sub, peso in capas_disponibles.values())
            icr_calculado = round(icr_ponderado, 1)

            # 6. Nivel de alerta (RF-ICR-05)
            nivel_alerta = conf["niveles_alerta"][0]["nivel"]
            for n in conf["niveles_alerta"]:
                if icr_calculado >= n["icr_desde"]:
                    nivel_alerta = n["nivel"]

            # 7. Piso por impacto confirmado (RF-ICR-06)
            piso = conf["piso_por_impacto"]
            orden = [n["nivel"] for n in conf["niveles_alerta"]]
            activo = any(indicadores.get(cod, {}).get("valor") == 1 for cod in piso["indicadores_activadores"])
            if activo and orden.index(nivel_alerta) < orden.index(piso["nivel_minimo"]):
                nivel_alerta = piso["nivel_minimo"]
                nivel_por_regla = True

        subindice_a, subindice_h = subindices.get("A"), subindices.get("H")
        subindice_s, subindice_r = subindices.get("S"), subindices.get("R")

        # Fase 0: un ICR sin todas las capas no es comparable con uno completo; se declara
        if icr_calculado is None:
            calidad_icr = "sin_dato"
        elif suma_pesos_disponibles >= 1.0 - 1e-9:
            calidad_icr = "completo"
        else:
            calidad_icr = "parcial"

        return {
            "divipola": divipola,
            "nombre": nombre,
            "departamento": depto,
            "cod_depto": cod_depto,
            "poblacion": poblacion,
            "icr": icr_calculado,
            "nivel_alerta": nivel_alerta,
            "nivel_por_regla": nivel_por_regla,
            "cobertura_datos_pct": cobertura_pct,
            "calidad_icr": calidad_icr,
            "capas_sin_dato": [capa for capa, sub in subindices.items() if sub is None],
            "subindices_capa": {
                "amenaza_A": subindice_a,
                "vulnerabilidad_H": subindice_h,
                "servicio_S": subindice_s,
                "respuesta_R": subindice_r
            },
            "indicadores": indicadores,
            "config_version": self.VERSION_CONFIG
        }

    def generar_corte_completo(
        self,
        amenaza_global: Dict[str, Any],
        datos_ideam: Dict[str, Any],
        datos_sivicap: Dict[str, Any],
        datos_ungrd_mvct: Dict[str, Any],
        datos_xm: Dict[str, Any],
        datos_firms: Dict[str, Any],
        datos_sui: Optional[Dict[str, Any]] = None,
        datos_chirps: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Consolida todas las fuentes y genera el corte analítico completo versionado en zona oro.
        """
        fecha_corte = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ts_utc = datetime.now(timezone.utc).isoformat()

        # Ingestar o usar datos SUI oficiales certificados
        if datos_sui is None:
            try:
                from ingesta.conectores.conector_sui import ConectorSUI
                con_sui = ConectorSUI(base_dir=str(self.root_dir))
                datos_sui = con_sui.ejecutar().datos_extraidos or {}
            except Exception as e:
                logger.warning(f"No se pudo ejecutar ConectorSUI: {e}")
                datos_sui = {}
        
        # Territorio evaluado desde config (antes embebido en código)
        MUNICIPIOS_MAESTRO = self.territorio["municipios"]
        municipios_h5 = self._municipios_con_embalse()
        datos_chirps = datos_chirps or {}

        # Calcular cada municipio
        municipios_oro = []
        for m in MUNICIPIOS_MAESTRO:
            div = m["divipola"]
            sui_info = datos_sui.get(div, {})
            ideam_info = datos_ideam.get(div, {})
            prec_a3 = self.elegir_precipitacion(ideam_info, datos_chirps.get(div, {}), "indicador_a3_anomalia_precip_pct")
            prec_a4 = self.elegir_precipitacion(ideam_info, datos_chirps.get(div, {}), "indicador_a4_dias_sin_lluvia")
            sivicap_info = datos_sivicap.get(div, {})
            ungrd_info = datos_ungrd_mvct.get(div, {})
            xm_info = datos_xm.get(div, {})
            firms_info = datos_firms.get(div, {})

            # Regla de oro 5 / RF-IND-04: un valor ausente en la fuente queda None (sin_dato),
            # nunca un valor por defecto. El puntaje se calcula aquí, a partir del valor, y
            # es None cuando no hay valor.
            cont = self._num(sui_info.get("s1_cont"))
            cob = self._num(sui_info.get("s3_cob"))
            ianc = self._num(sui_info.get("s4_ianc"))
            pqr = self._num(sui_info.get("s5_pqr"))
            h4_val = self._num(sui_info.get("h4_autonomia_h"))
            s6_val = self._num(sui_info.get("s6_consumo_m3"))
            irca_val = self._num(sivicap_info.get("valor_indicador_s2"))
            a3_val = prec_a3["valor"]
            a4_val = prec_a4["valor"]
            h1_val = self._num(ideam_info.get("indicador_h1_caudal_pct"))
            h2_val = ideam_info.get("indicador_h2_ivh_ena")
            h3_val = ideam_info.get("indicador_h3_iua_ena")

            punt_s1 = self.normalizar_tramos("S-1", cont)
            punt_s3 = self.normalizar_tramos("S-3", cob)
            punt_s4 = self.normalizar_tramos("S-4", ianc)
            punt_s5 = self.normalizar_tramos("S-5", pqr)
            punt_h4 = self.normalizar_tramos("H-4", h4_val)
            punt_s2 = self.normalizar_tramos("S-2", irca_val)
            punt_a3 = self.normalizar_tramos("A-3", a3_val)
            punt_a4 = self.normalizar_tramos("A-4", a4_val)
            punt_h1 = self.normalizar_tramos("H-1", h1_val)
            punt_h2 = self.puntaje_categorico(h2_val)
            punt_h3 = self.puntaje_categorico(h3_val)

            # Capa R (Respuesta): binarios RF-ICR-03; sin información de la fuente => sin_dato
            r1_val = self._binario(sui_info.get("r1_pec"))
            r2_val = self._binario(ungrd_info.get("indicador_r2_carrotanques"))
            r3_val = self._binario(ungrd_info.get("indicador_r3_racionamiento"))
            r4_val = self._binario(ungrd_info.get("indicador_r4_calamidad"))
            punt_r1 = self.puntaje_binario("R-1", r1_val)
            punt_r2 = self.puntaje_binario("R-2", r2_val)
            punt_r3 = self.puntaje_binario("R-3", r3_val)
            punt_r4 = self.puntaje_binario("R-4", r4_val)

            # Fechas del dato tomadas de la fuente (RF-IND-01), no literales
            fecha_sui = sui_info.get("fecha_dato")
            periodo_irca = sivicap_info.get("periodo_ano")
            # IRCA mensual (Fase 1) trae su fecha; el anual se fecha al cierre del año
            fecha_s2 = sivicap_info.get("fecha_dato") or (f"{periodo_irca}-12-31" if periodo_irca else None)
            fecha_ideam = ideam_info.get("fecha_dato")
            fecha_ungrd = ungrd_info.get("fecha_dato")
            a5_val = firms_info.get("indicador_a5_focos_7d")

            # A-1 es la anomalía semanal Niño 3.4: su fecha es la semana NOAA, no una fecha fija.
            # A-2 proviene de la discusión diagnóstica ENSO: su fecha es la del boletín.
            f_semana = self._parsear_fecha((amenaza_global.get("indices_semanales") or {}).get("fecha_semana"))
            fecha_a1 = f_semana.strftime("%Y-%m-%d") if f_semana else None
            fecha_a2 = amenaza_global.get("fecha_boletin_enso")

            # Diccionario consolidado de los 20 indicadores
            indicadores_m = {
                # Amenaza Global
                "A-1": {"nombre": "ONI / Niño 3.4", "valor": amenaza_global.get("indicador_a1_nino34"), "unidad": "°C", "fuente": "NOAA CPC", "fecha_dato": fecha_a1, "puntaje": None},
                "A-2": {"nombre": "Probabilidad Niño Muy Fuerte", "valor": amenaza_global.get("indicador_a2_probabilidad_muy_fuerte_pct"), "unidad": "%", "fuente": "NOAA CPC", "fecha_dato": fecha_a2, "puntaje": None},
                # Amenaza Local
                "A-3": {"nombre": "Anomalía Precipitación 30d", "valor": a3_val, "unidad": "%", "fuente": prec_a3["fuente"], "fecha_dato": prec_a3["fecha_dato"], "puntaje": punt_a3, "metodo": prec_a3["metodo"]},
                "A-4": {"nombre": "Días Consecutivos sin Lluvia", "valor": a4_val, "unidad": "días", "fuente": prec_a4["fuente"], "fecha_dato": prec_a4["fecha_dato"], "puntaje": punt_a4, "metodo": prec_a4["metodo"]},
                "A-5": {"nombre": "Focos de Calor (7d)", "valor": a5_val, "unidad": "conteo", "fuente": "NASA FIRMS", "fecha_dato": fecha_corte, "puntaje": None},
                # Oferta Hídrica
                "H-1": {"nombre": "Caudal Fuente Abastecedora", "valor": h1_val, "unidad": "%", "fuente": "IDEAM", "fecha_dato": fecha_ideam, "puntaje": punt_h1},
                "H-2": {"nombre": "Vulnerabilidad Hídrica ENA", "valor": h2_val, "unidad": "categoría", "fuente": "IDEAM ENA 2010 (año seco)", "fecha_dato": ideam_info.get("fecha_dato_h2"), "puntaje": punt_h2},
                "H-3": {"nombre": "Uso del Agua ENA (IUA)", "valor": h3_val, "unidad": "categoría", "fuente": "IDEAM ENA 2014 (año seco)", "fecha_dato": ideam_info.get("fecha_dato_h3"), "puntaje": punt_h3},
                "H-4": {"nombre": "Autonomía Almacenamiento", "valor": h4_val, "unidad": "horas", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_h4},
                "H-5": {"nombre": "Volumen Útil Embalse", "valor": xm_info.get("volumen_util_pct"), "unidad": "%", "fuente": "XM Sinergox", "fecha_dato": fecha_corte, "puntaje": None, "aplica": div in municipios_h5},
                # Desempeño del Servicio
                "S-1": {"nombre": "Continuidad", "valor": cont, "unidad": "h/día", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s1},
                "S-2": {"nombre": "Calidad del Agua (IRCA)", "valor": irca_val, "unidad": "%", "fuente": "INS SIVICAP", "fecha_dato": fecha_s2, "puntaje": punt_s2},
                "S-3": {"nombre": "Cobertura Urbana", "valor": cob, "unidad": "%", "fuente": "SSPD SUI / DANE", "fecha_dato": fecha_sui, "puntaje": punt_s3},
                "S-4": {"nombre": "Agua No Contabilizada (IANC)", "valor": ianc, "unidad": "%", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s4},
                "S-5": {"nombre": "Variación PQR por Servicio", "valor": pqr, "unidad": "%", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s5},
                "S-6": {"nombre": "Consumo Medio Facturado", "valor": s6_val, "unidad": "m³/susc/mes", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": None},
                # Respuesta e Impacto
                "R-1": {"nombre": "PEC Reportado Vigente", "valor": r1_val, "unidad": "binario", "fuente": "SSPD / MinVivienda", "fecha_dato": fecha_sui, "puntaje": punt_r1},
                "R-2": {"nombre": "Abastecimiento Alterno Activo", "valor": r2_val, "unidad": "binario", "fuente": "UNGRD", "fecha_dato": fecha_ungrd, "puntaje": punt_r2},
                "R-3": {"nombre": "Racionamiento Reportado", "valor": r3_val, "unidad": "binario", "fuente": "MinVivienda Survey123", "fecha_dato": fecha_ungrd, "puntaje": punt_r3},
                "R-4": {"nombre": "Calamidad Pública Vigente", "valor": r4_val, "unidad": "binario", "fuente": "UNGRD Sala de Crisis", "fecha_dato": fecha_ungrd, "puntaje": punt_r4}
            }

            # A-4 que se detuvo en un día sin dato es una cota inferior: se declara
            if prec_a4["cota_inferior"] and a4_val is not None:
                indicadores_m["A-4"]["nota"] = f"Al menos {int(a4_val)} días: el conteo se detuvo en un día sin dato"

            # RF-CAL-03: frescura de cada valor frente a su periodo esperado
            for cod_ind, ind in indicadores_m.items():
                ind["frescura"] = self.evaluar_frescura(cod_ind, ind.get("fecha_dato"), fecha_corte, ind.get("valor"))
                # Dato demasiado antiguo: se muestra con su frescura, pero no entra al ICR
                if ind.get("puntaje") is not None and self.excede_vigencia_icr(cod_ind, ind.get("fecha_dato"), fecha_corte):
                    ind["puntaje"] = None
                    ind["excluido_icr"] = "antigüedad mayor a la vigencia máxima"

            poblacion_m, fuente_poblacion_m = self.poblacion_municipio(m, fecha_corte[:4])
            res_m = self.calcular_icr_municipio(
                divipola=div,
                nombre=m["nombre"],
                depto=m["departamento"],
                cod_depto=m["cod_depto"],
                poblacion=poblacion_m,
                indicadores=indicadores_m
            )
            res_m["region"] = m.get("region")
            res_m["tipo_municipio"] = m.get("tipo_municipio")
            # Contexto (no entra al ICR): nivel de riesgo de desabastecimiento de MinVivienda (FTE-MVCT-RIESGO)
            res_m["contexto_minvivienda"] = ungrd_info.get("contexto_minvivienda")
            res_m["fuente_poblacion"] = fuente_poblacion_m
            hidro = self.hidrografia.get(div, {})
            for campo in self.CAMPOS_HIDROGRAFICOS:
                res_m[campo] = hidro.get(campo)
            res_m["lat"] = m["lat"]
            res_m["lon"] = m["lon"]
            municipios_oro.append(res_m)

        # 8. Agregaciones Departamentales y Nacionales (RF-TER-06)
        conteo_niveles_nacion = {"roja": 0, "naranja": 0, "amarilla": 0, "sin_alerta": 0, "sin_dato": 0}
        poblacion_afectada_naranja_roja = 0
        poblacion_total = sum(m["poblacion"] for m in municipios_oro)
        suma_icr_ponderado = 0.0

        por_departamento: Dict[str, Any] = {}
        for m in municipios_oro:
            nivel = m["nivel_alerta"]
            conteo_niveles_nacion[nivel] += 1
            if nivel in ("naranja", "roja"):
                poblacion_afectada_naranja_roja += m["poblacion"]
            if m["icr"] is not None:
                suma_icr_ponderado += m["icr"] * m["poblacion"]

            c_dep = m["cod_depto"]
            if c_dep not in por_departamento:
                por_departamento[c_dep] = {
                    "cod_depto": c_dep,
                    "departamento": m["departamento"],
                    "municipios": [],
                    "poblacion_total": 0,
                    "conteo_niveles": {"roja": 0, "naranja": 0, "amarilla": 0, "sin_alerta": 0, "sin_dato": 0},
                    "poblacion_naranja_roja": 0,
                    "suma_icr_ponderado": 0.0
                }
            por_departamento[c_dep]["municipios"].append(m["divipola"])
            por_departamento[c_dep]["poblacion_total"] += m["poblacion"]
            por_departamento[c_dep]["conteo_niveles"][nivel] += 1
            if nivel in ("naranja", "roja"):
                por_departamento[c_dep]["poblacion_naranja_roja"] += m["poblacion"]
            if m["icr"] is not None:
                por_departamento[c_dep]["suma_icr_ponderado"] += m["icr"] * m["poblacion"]

        # Finalizar agregados por departamento
        deptos_oro = []
        for c_dep, d in por_departamento.items():
            icr_dep = round(d["suma_icr_ponderado"] / d["poblacion_total"], 1) if d["poblacion_total"] > 0 else None
            deptos_oro.append({
                "cod_depto": c_dep,
                "departamento": d["departamento"],
                "total_municipios": len(d["municipios"]),
                "icr_medio_ponderado": icr_dep,
                "poblacion_total": d["poblacion_total"],
                "poblacion_naranja_roja": d["poblacion_naranja_roja"],
                "conteo_niveles": d["conteo_niveles"]
            })

        deptos_oro.sort(key=lambda x: (x["icr_medio_ponderado"] or 0), reverse=True)

        icr_nacional_ponderado = round(suma_icr_ponderado / poblacion_total, 1) if poblacion_total > 0 else 0.0

        # Lista de alertas activas (V-06)
        alertas = []
        id_alerta_seq = 1
        for m in municipios_oro:
            if m["nivel_alerta"] in ("naranja", "roja"):
                motivo = "ICR crítico por déficit hídrico extremo"
                if m.get("nivel_por_regla"):
                    motivo = "Piso automático por racionamiento/calamidad confirmada (RF-ICR-06)"
                alertas.append({
                    "id_alerta": f"ALT-{fecha_corte.replace('-', '')}-{id_alerta_seq:04d}",
                    "divipola": m["divipola"],
                    "municipio": m["nombre"],
                    "departamento": m["departamento"],
                    "nivel": m["nivel_alerta"],
                    "icr": m["icr"],
                    "motivo": motivo,
                    "estado_revision": "PENDIENTE_REVISION_CRA",
                    "fecha_emision": ts_utc,
                    "prioridad": "ALTA" if m["nivel_alerta"] == "roja" else "MEDIA"
                })
                id_alerta_seq += 1

        # RF-CAL-04: compuerta de publicación
        estado_calidad, motivos_rechazo = self.evaluar_compuerta(municipios_oro)

        # Fase 0: trazabilidad de la cobertura nacional (cuántos municipios tienen cada dato y de qué método)
        conteo_calidad_icr = {c: sum(1 for m in municipios_oro if m.get("calidad_icr") == c)
                              for c in ("completo", "parcial", "sin_dato")}
        cobertura_indicadores: Dict[str, Any] = {}
        for m in municipios_oro:
            for cod, ind in m["indicadores"].items():
                c = cobertura_indicadores.setdefault(cod, {"con_valor": 0, "aplica": 0})
                if ind.get("aplica", True):
                    c["aplica"] += 1
                    if ind.get("valor") is not None:
                        c["con_valor"] += 1
                if ind.get("metodo") and ind.get("valor") is not None:
                    met = c.setdefault("por_metodo", {})
                    met[ind["metodo"]] = met.get(ind["metodo"], 0) + 1

        corte_final = {
            "metadata_corte": {
                "fecha_corte": fecha_corte,
                "generado_en": ts_utc,
                "version_configuracion": self.VERSION_CONFIG,
                "estado_calidad": estado_calidad,
                "motivos_rechazo": motivos_rechazo,
                "total_municipios_evaluados": len(municipios_oro),
                "icr_nacional_ponderado": icr_nacional_ponderado,
                "poblacion_en_riesgo_critico": poblacion_afectada_naranja_roja,
                "conteo_niveles_nacional": conteo_niveles_nacion,
                "conteo_calidad_icr": conteo_calidad_icr,
                "cobertura_indicadores": cobertura_indicadores
            },
            "amenaza_global": amenaza_global,
            "municipios": municipios_oro,
            "departamentos": deptos_oro,
            "alertas_activas": alertas
        }

        corte_json_str = json.dumps(corte_final, indent=2, ensure_ascii=False)

        # Corte rechazado: se conserva para diagnóstico, pero el tablero sigue con el último publicado.
        if estado_calidad != self.ESTADO_PUBLICADO:
            self._escribir_atomico(self.oro_dir / "rechazados" / f"corte_{fecha_corte}.json", corte_json_str)
            logger.warning(f"Corte {fecha_corte} RECHAZADO: {'; '.join(motivos_rechazo)}")
            return corte_final

        # 1. Guardar en zona Oro (JSON inmutable y versionado) de manera atómica
        self._escribir_atomico(self.oro_dir / "corte_vigente.json", corte_json_str)
        self._escribir_atomico(self.oro_dir / f"corte_{fecha_corte}.json", corte_json_str)

        # 2. Sincronizar atómicamente con el frontend principal (tablero/js/data.js)
        self.publicar_data_js(corte_json_str)

        # 3. Sincronizar atómicamente con ArcGIS GeoJSON (tablero/vigia_corte_actualizado_arcgis.geojson)
        features = []
        for m in municipios_oro:
            ind = m.get("indicadores", {})
            sub = m.get("subindices_capa", {})
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [m.get("lon", 0.0), m.get("lat", 0.0)]
                },
                "properties": {
                    "DIVIPOLA": m["divipola"],
                    "MUNICIPIO": m["nombre"],
                    "DEPARTAMENTO": m["departamento"],
                    "COD_DEPTO": m["cod_depto"],
                    "REGION": m.get("region", ""),
                    "AREA_HIDROGRAFICA": m.get("area_hidrografica"),
                    "ZONA_HIDROGRAFICA": m.get("zona_hidrografica"),
                    "COD_SUBZONA_HIDROGRAFICA": m.get("cod_subzona_hidrografica"),
                    "SUBZONA_HIDROGRAFICA": m.get("subzona_hidrografica"),
                    "POBLACION": m["poblacion"],
                    "ICR": m["icr"],
                    "NIVEL_ALERTA": m["nivel_alerta"],
                    "CALIDAD_ICR": m.get("calidad_icr"),
                    "COBERTURA_DATOS_PCT": m.get("cobertura_datos_pct"),
                    "SUB_AMENAZA": sub.get("amenaza_A"),
                    "SUB_VULNERABILIDAD": sub.get("vulnerabilidad_H"),
                    "SUB_SERVICIO": sub.get("servicio_S"),
                    "SUB_RESPUESTA": sub.get("respuesta_R"),
                    "S1_CONTINUIDAD_H": ind.get("S-1", {}).get("valor"),
                    "S2_IRCA_PTS": ind.get("S-2", {}).get("valor"),
                    "A3_DEFICIT_LLUVIA_PCT": ind.get("A-3", {}).get("valor"),
                    "A4_DIAS_SECOS": ind.get("A-4", {}).get("valor"),
                    "A5_FOCOS_CALOR_7D": ind.get("A-5", {}).get("valor"),
                    "H1_CAUDAL_PCT": ind.get("H-1", {}).get("valor"),
                    "H4_AUTONOMIA_H": ind.get("H-4", {}).get("valor"),
                    "R1_PLAN_EMERGENCIA": ind.get("R-1", {}).get("valor"),
                    "R2_ABASTECIMIENTO_ALTERNO": ind.get("R-2", {}).get("valor"),
                    "R3_RACIONAMIENTO": ind.get("R-3", {}).get("valor"),
                    "R4_CALAMIDAD": ind.get("R-4", {}).get("valor"),
                    "FECHA_CORTE": fecha_corte
                }
            }
            features.append(feature)

        geojson_data = {
            "type": "FeatureCollection",
            "name": "vigia_corte_municipios_arcgis_v2",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            },
            "metadata_export": {
                "sistema": "Vigía El Niño · Acueductos (CRA)",
                "fecha_corte": fecha_corte,
                "entidades": len(features),
                "formato": "Esri-Ready GeoJSON WGS84 (EPSG:4326)",
                "observaciones": "Generado automáticamente por PipelineCorte de manera atómica"
            },
            "features": features
        }
        self._escribir_atomico(
            self.root_dir / "tablero" / "vigia_corte_actualizado_arcgis.geojson",
            json.dumps(geojson_data, indent=2, ensure_ascii=False)
        )

        logger.info(f"Corte exitoso: {len(municipios_oro)} municipios evaluados. ICR Nacional={icr_nacional_ponderado}")

        # 4. Canal ciudadano (specs/canal-ciudadano.md). Va al final y aislado: si falla,
        #    el canal interno ya quedó publicado y no se ve afectado (RF-CIU-01).
        try:
            from ingesta.canal_ciudadano import GeneradorVistaCiudadana, cargar_semanal
            vista = GeneradorVistaCiudadana(base_dir=str(self.root_dir)).generar(corte_final, cargar_semanal(self.root_dir))
            corte_final["metadata_corte"]["vista_ciudadana"] = vista["metadata"]["estado"]
        except Exception as e:
            logger.error(f"Vista ciudadana no generada; el corte interno sigue publicado: {e}")
            corte_final["metadata_corte"]["vista_ciudadana"] = f"error: {e}"
        return corte_final
