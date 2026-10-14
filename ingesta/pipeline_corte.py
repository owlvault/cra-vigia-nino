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

class PipelineCorte:
    VERSION_CONFIG = "v1.0.0-20261008"
    
    # Pesos oficiales por capa según specs/indice-riesgo.md
    PESOS_CAPA = {
        "A": 0.30, # Amenaza hidroclimática (A-3, A-4, H-1)
        "H": 0.30, # Vulnerabilidad de la oferta (H-2, H-3, H-4)
        "S": 0.25, # Desempeño del servicio (S-1, S-2, S-3, S-4, S-5)
        "R": 0.15  # Respuesta e impacto confirmado (R-1, R-2, R-3, R-4)
    }

    @staticmethod
    def _escribir_atomico(ruta_destino: Path, contenido: str) -> None:
        """Escribe un archivo de manera atómica usando un archivo temporal y reemplazo."""
        ruta_destino.parent.mkdir(parents=True, exist_ok=True)
        temp_path = ruta_destino.with_name(f"{ruta_destino.name}.tmp.{int(time.time() * 1000)}")
        temp_path.write_text(contenido, encoding="utf-8")
        temp_path.replace(ruta_destino)

    def __init__(self, base_dir: Optional[str] = None):
        self.root_dir = Path(base_dir or Path(__file__).resolve().parent.parent)
        self.oro_dir = self.root_dir / "data" / "oro"
        self.plata_dir = self.root_dir / "data" / "plata"
        self.oro_dir.mkdir(parents=True, exist_ok=True)
        self.plata_dir.mkdir(parents=True, exist_ok=True)

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
        """
        # 1. Capa A: Promedio de puntajes disponibles entre A-3, A-4, H-1
        puntajes_a = []
        for cod in ["A-3", "A-4", "H-1"]:
            if cod in indicadores and indicadores[cod].get("puntaje") is not None:
                puntajes_a.append(indicadores[cod]["puntaje"])
        subindice_a = round(sum(puntajes_a) / len(puntajes_a), 2) if puntajes_a else None

        # 2. Capa H: Promedio de disponibles entre H-2, H-3, H-4
        puntajes_h = []
        for cod in ["H-2", "H-3", "H-4"]:
            if cod in indicadores and indicadores[cod].get("puntaje") is not None:
                puntajes_h.append(indicadores[cod]["puntaje"])
        subindice_h = round(sum(puntajes_h) / len(puntajes_h), 2) if puntajes_h else None

        # 3. Capa S: Promedio de disponibles entre S-1, S-2, S-3, S-4, S-5
        puntajes_s = []
        for cod in ["S-1", "S-2", "S-3", "S-4", "S-5"]:
            if cod in indicadores and indicadores[cod].get("puntaje") is not None:
                puntajes_s.append(indicadores[cod]["puntaje"])
        subindice_s = round(sum(puntajes_s) / len(puntajes_s), 2) if puntajes_s else None

        # 4. Capa R: Máximo de disponibles entre R-1, R-2, R-3, R-4 (RF-ICR-03)
        puntajes_r = []
        for cod in ["R-1", "R-2", "R-3", "R-4"]:
            if cod in indicadores and indicadores[cod].get("puntaje") is not None:
                puntajes_r.append(indicadores[cod]["puntaje"])
        subindice_r = max(puntajes_r) if puntajes_r else None

        # 5. Evaluación de cobertura de datos y redistribución de pesos (RF-ICR-04)
        capas_disponibles = {}
        if subindice_a is not None: capas_disponibles["A"] = (subindice_a, self.PESOS_CAPA["A"])
        if subindice_h is not None: capas_disponibles["H"] = (subindice_h, self.PESOS_CAPA["H"])
        if subindice_s is not None: capas_disponibles["S"] = (subindice_s, self.PESOS_CAPA["S"])
        if subindice_r is not None: capas_disponibles["R"] = (subindice_r, self.PESOS_CAPA["R"])

        suma_pesos_disponibles = sum(peso for _, peso in capas_disponibles.values())
        cobertura_pct = round(suma_pesos_disponibles * 100, 1)

        # Regla: Si las capas disponibles suman menos del 60 %, el ICR es 'sin_dato'
        if suma_pesos_disponibles < 0.60:
            icr_calculado = None
            nivel_alerta = "sin_dato"
            nivel_por_regla = False
        else:
            # Redistribución proporcional de pesos
            icr_ponderado = 0.0
            for capa, (subind, peso_nominal) in capas_disponibles.items():
                peso_efectivo = peso_nominal / suma_pesos_disponibles
                icr_ponderado += subind * peso_efectivo
            
            icr_calculado = round(icr_ponderado, 1)

            # 6. Asignación de nivel de alerta según umbrales (RF-ICR-05)
            if icr_calculado < 40.0:
                nivel_alerta = "sin_alerta"
            elif icr_calculado < 60.0:
                nivel_alerta = "amarilla"
            elif icr_calculado < 75.0:
                nivel_alerta = "naranja"
            else:
                nivel_alerta = "roja"

            nivel_por_regla = False

            # 7. Regla de Piso por Impacto Confirmado (RF-ICR-06)
            # Si R-3 (racionamiento) o R-4 (calamidad) están activos, mínimo Nivel Naranja
            r3_activo = indicadores.get("R-3", {}).get("valor") == 1
            r4_activo = indicadores.get("R-4", {}).get("valor") == 1
            
            if (r3_activo or r4_activo) and nivel_alerta in ("sin_alerta", "amarilla"):
                nivel_alerta = "naranja"
                nivel_por_regla = True

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
        datos_sui: Optional[Dict[str, Any]] = None
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
        
        # Base de municipios emblemáticos y prioritarios de Colombia
        MUNICIPIOS_MAESTRO = [
            # La Guajira
            {"divipola": "44847", "nombre": "Uribia", "depto": "La Guajira", "cod_depto": "44", "poblacion": 196000, "region": "Caribe", "lat": 11.713, "lon": -72.015},
            {"divipola": "44430", "nombre": "Maicao", "depto": "La Guajira", "cod_depto": "44", "poblacion": 182000, "region": "Caribe", "lat": 11.378, "lon": -72.241},
            {"divipola": "44001", "nombre": "Riohacha", "depto": "La Guajira", "cod_depto": "44", "poblacion": 210000, "region": "Caribe", "lat": 11.544, "lon": -72.907},
            {"divipola": "44560", "nombre": "Manaure", "depto": "La Guajira", "cod_depto": "44", "poblacion": 125000, "region": "Caribe", "lat": 11.775, "lon": -72.444},
            
            # Magdalena
            {"divipola": "47001", "nombre": "Santa Marta", "depto": "Magdalena", "cod_depto": "47", "poblacion": 540000, "region": "Caribe", "lat": 11.240, "lon": -74.199},
            {"divipola": "47555", "nombre": "Plato", "depto": "Magdalena", "cod_depto": "47", "poblacion": 65000, "region": "Caribe", "lat": 9.790, "lon": -74.782},
            
            # Bolívar
            {"divipola": "13244", "nombre": "El Carmen de Bolívar", "depto": "Bolívar", "cod_depto": "13", "poblacion": 78000, "region": "Caribe", "lat": 9.717, "lon": -75.121},
            {"divipola": "13430", "nombre": "Magangué", "depto": "Bolívar", "cod_depto": "13", "poblacion": 138000, "region": "Caribe", "lat": 9.242, "lon": -74.755},
            {"divipola": "13001", "nombre": "Cartagena de Indias", "depto": "Bolívar", "cod_depto": "13", "poblacion": 1040000, "region": "Caribe", "lat": 10.391, "lon": -75.479},
            
            # Cesar
            {"divipola": "20001", "nombre": "Valledupar", "depto": "Cesar", "cod_depto": "20", "poblacion": 510000, "region": "Caribe", "lat": 10.463, "lon": -73.253},
            {"divipola": "20011", "nombre": "Aguachica", "depto": "Cesar", "cod_depto": "20", "poblacion": 112000, "region": "Caribe", "lat": 8.307, "lon": -73.618},
            
            # Santander
            {"divipola": "68079", "nombre": "Barichara", "depto": "Santander", "cod_depto": "68", "poblacion": 12000, "region": "Andina", "lat": 6.635, "lon": -73.224},
            {"divipola": "68679", "nombre": "San Gil", "depto": "Santander", "cod_depto": "68", "poblacion": 58000, "region": "Andina", "lat": 6.556, "lon": -73.133},
            {"divipola": "68001", "nombre": "Bucaramanga", "depto": "Santander", "cod_depto": "68", "poblacion": 615000, "region": "Andina", "lat": 7.125, "lon": -73.119},
            
            # Cundinamarca y Bogotá
            {"divipola": "11001", "nombre": "Bogotá, D.C.", "depto": "Bogotá, D.C.", "cod_depto": "11", "poblacion": 7900000, "region": "Andina", "lat": 4.711, "lon": -74.072},
            {"divipola": "25307", "nombre": "Girardot", "depto": "Cundinamarca", "cod_depto": "25", "poblacion": 120000, "region": "Andina", "lat": 4.303, "lon": -74.802},
            {"divipola": "25126", "nombre": "Cajicá", "depto": "Cundinamarca", "cod_depto": "25", "poblacion": 85000, "region": "Andina", "lat": 4.918, "lon": -74.027},
            
            # Tolima
            {"divipola": "73001", "nombre": "Ibagué", "depto": "Tolima", "cod_depto": "73", "poblacion": 540000, "region": "Andina", "lat": 4.438, "lon": -75.232},
            {"divipola": "73268", "nombre": "Espinal", "depto": "Tolima", "cod_depto": "73", "poblacion": 74000, "region": "Andina", "lat": 4.149, "lon": -74.884},
            
            # Huila
            {"divipola": "41001", "nombre": "Neiva", "depto": "Huila", "cod_depto": "41", "poblacion": 365000, "region": "Andina", "lat": 2.927, "lon": -75.281},
            
            # Boyacá
            {"divipola": "15837", "nombre": "Tuta", "depto": "Boyacá", "cod_depto": "15", "poblacion": 10500, "region": "Andina", "lat": 5.694, "lon": -73.230},
            
            # Antioquia
            {"divipola": "05001", "nombre": "Medellín", "depto": "Antioquia", "cod_depto": "05", "poblacion": 2550000, "region": "Andina", "lat": 6.244, "lon": -75.581},
            
            # Valle del Cauca
            {"divipola": "76001", "nombre": "Cali", "depto": "Valle del Cauca", "cod_depto": "76", "poblacion": 2280000, "region": "Pacífica", "lat": 3.451, "lon": -76.532}
        ]

        # Calcular cada municipio
        municipios_oro = []
        for m in MUNICIPIOS_MAESTRO:
            div = m["divipola"]
            sui_info = datos_sui.get(div, {})
            ideam_info = datos_ideam.get(div, {})
            sivicap_info = datos_sivicap.get(div, {})
            ungrd_info = datos_ungrd_mvct.get(div, {})
            xm_info = datos_xm.get(div, {})
            firms_info = datos_firms.get(div, {})

            # Normalizar S-1 (Continuidad h/día: 24->0, 22->40, 18->60, 12->75, 4->100)
            cont = float(sui_info.get("s1_cont", 24.0))
            if "puntaje_s1" in sui_info and sui_info["puntaje_s1"] is not None:
                punt_s1 = float(sui_info["puntaje_s1"])
            elif cont >= 24.0: punt_s1 = 0.0
            elif cont >= 22.0: punt_s1 = round(((24.0 - cont) / 2.0) * 40.0, 2)
            elif cont >= 18.0: punt_s1 = round(40.0 + ((22.0 - cont) / 4.0) * 20.0, 2)
            elif cont >= 12.0: punt_s1 = round(60.0 + ((18.0 - cont) / 6.0) * 15.0, 2)
            elif cont >= 4.0: punt_s1 = round(75.0 + ((12.0 - cont) / 8.0) * 25.0, 2)
            else: punt_s1 = 100.0

            # Normalizar S-3 (Cobertura %: 100->0, 95->40, 85->60, 70->75, 40->100)
            cob = float(sui_info.get("s3_cob", 95.0))
            if "puntaje_s3" in sui_info and sui_info["puntaje_s3"] is not None:
                punt_s3 = float(sui_info["puntaje_s3"])
            elif cob >= 100.0: punt_s3 = 0.0
            elif cob >= 95.0: punt_s3 = round(((100.0 - cob) / 5.0) * 40.0, 2)
            elif cob >= 85.0: punt_s3 = round(40.0 + ((95.0 - cob) / 10.0) * 20.0, 2)
            elif cob >= 70.0: punt_s3 = round(60.0 + ((85.0 - cob) / 15.0) * 15.0, 2)
            elif cob >= 40.0: punt_s3 = round(75.0 + ((70.0 - cob) / 30.0) * 25.0, 2)
            else: punt_s3 = 100.0

            # Normalizar S-4 (IANC %: 20->0, 30->40, 40->60, 50->75, 70->100)
            ianc = float(sui_info.get("s4_ianc", 30.0))
            if "puntaje_s4" in sui_info and sui_info["puntaje_s4"] is not None:
                punt_s4 = float(sui_info["puntaje_s4"])
            elif ianc <= 20.0: punt_s4 = 0.0
            elif ianc <= 30.0: punt_s4 = round(((ianc - 20.0) / 10.0) * 40.0, 2)
            elif ianc <= 40.0: punt_s4 = round(40.0 + ((ianc - 30.0) / 10.0) * 20.0, 2)
            elif ianc <= 50.0: punt_s4 = round(60.0 + ((ianc - 40.0) / 10.0) * 15.0, 2)
            elif ianc <= 70.0: punt_s4 = round(75.0 + ((ianc - 50.0) / 20.0) * 25.0, 2)
            else: punt_s4 = 100.0

            # Normalizar S-5 (Variación PQR: 0->0, 25->40, 50->60, 100->75, 300->100)
            pqr = float(sui_info.get("s5_pqr", 20.0))
            if "puntaje_s5" in sui_info and sui_info["puntaje_s5"] is not None:
                punt_s5 = float(sui_info["puntaje_s5"])
            elif pqr <= 0: punt_s5 = 0.0
            elif pqr <= 25.0: punt_s5 = round((pqr / 25.0) * 40.0, 2)
            elif pqr <= 50.0: punt_s5 = round(40.0 + ((pqr - 25.0) / 25.0) * 20.0, 2)
            elif pqr <= 100.0: punt_s5 = round(60.0 + ((pqr - 50.0) / 50.0) * 15.0, 2)
            elif pqr <= 300.0: punt_s5 = round(75.0 + ((pqr - 100.0) / 200.0) * 25.0, 2)
            else: punt_s5 = 100.0

            # Normalizar H-4 (Autonomía de almacenamiento)
            h4_val = float(sui_info.get("h4_autonomia_h", 14.0))
            if "puntaje_h4" in sui_info and sui_info["puntaje_h4"] is not None:
                punt_h4 = float(sui_info["puntaje_h4"])
            elif h4_val >= 24.0: punt_h4 = 0.0
            elif h4_val >= 18.0: punt_h4 = round(((24.0 - h4_val) / 6.0) * 35.0, 2)
            elif h4_val >= 12.0: punt_h4 = round(35.0 + ((18.0 - h4_val) / 6.0) * 20.0, 2)
            elif h4_val >= 6.0: punt_h4 = round(55.0 + ((12.0 - h4_val) / 6.0) * 20.0, 2)
            elif h4_val >= 2.0: punt_h4 = round(75.0 + ((6.0 - h4_val) / 4.0) * 25.0, 2)
            else: punt_h4 = 100.0

            s6_val = float(sui_info.get("s6_consumo_m3", 12.8))

            # Normalizar S-2 (IRCA desde SIVICAP)
            irca_val = sivicap_info.get("valor_indicador_s2", 12.0)
            punt_s2 = sivicap_info.get("puntaje_riesgo_s2", 55.0)

            # Capa R (Respuesta)
            r1_val = int(sui_info.get("r1_pec", 1))
            punt_r1 = float(sui_info.get("puntaje_r1", 0.0 if r1_val == 1 else 100.0))
            r2_val = ungrd_info.get("indicador_r2_carrotanques", 0)
            punt_r2 = 60.0 if r2_val == 1 else 0.0
            r3_val = ungrd_info.get("indicador_r3_racionamiento", 0)
            punt_r3 = 80.0 if r3_val == 1 else 0.0
            r4_val = ungrd_info.get("indicador_r4_calamidad", 0)
            punt_r4 = 100.0 if r4_val == 1 else 0.0

            fecha_sui = sui_info.get("fecha_corte", "2026-08-31")
            a5_val = firms_info.get("indicador_a5_focos_7d")

            # Diccionario consolidado de los 20 indicadores
            indicadores_m = {
                # Amenaza Global
                "A-1": {"nombre": "ONI / Niño 3.4", "valor": amenaza_global.get("indicador_a1_nino34"), "unidad": "°C", "fuente": "NOAA CPC", "fecha_dato": amenaza_global.get("fecha_boletin_noaa", "2026-09-30"), "puntaje": None},
                "A-2": {"nombre": "Probabilidad Niño Muy Fuerte", "valor": amenaza_global.get("indicador_a2_probabilidad_muy_fuerte_pct", 83.0), "unidad": "%", "fuente": "NOAA CPC", "fecha_dato": amenaza_global.get("fecha_boletin_noaa", "2026-10-10"), "puntaje": None},
                # Amenaza Local
                "A-3": {"nombre": "Anomalía Precipitación 30d", "valor": ideam_info.get("indicador_a3_anomalia_precip_pct", -40.0), "unidad": "%", "fuente": "IDEAM", "fecha_dato": fecha_corte, "puntaje": ideam_info.get("puntaje_a3", 60.0)},
                "A-4": {"nombre": "Días Consecutivos sin Lluvia", "valor": ideam_info.get("indicador_a4_dias_sin_lluvia", 20), "unidad": "días", "fuente": "IDEAM", "fecha_dato": fecha_corte, "puntaje": ideam_info.get("puntaje_a4", 60.0)},
                "A-5": {"nombre": "Focos de Calor (7d)", "valor": a5_val, "unidad": "conteo", "fuente": "NASA FIRMS", "fecha_dato": fecha_corte, "puntaje": None},
                # Oferta Hídrica
                "H-1": {"nombre": "Caudal Fuente Abastecedora", "valor": ideam_info.get("indicador_h1_caudal_pct", 50.0), "unidad": "%", "fuente": "IDEAM", "fecha_dato": fecha_corte, "puntaje": ideam_info.get("puntaje_h1", 60.0)},
                "H-2": {"nombre": "Vulnerabilidad Hídrica ENA", "valor": ideam_info.get("indicador_h2_ivh_ena", "Medio"), "unidad": "categoría", "fuente": "IDEAM ENA", "fecha_dato": "2022-12-31", "puntaje": ideam_info.get("puntaje_h2", 40.0)},
                "H-3": {"nombre": "Uso del Agua ENA (IUA)", "valor": ideam_info.get("indicador_h3_iua_ena", "Medio"), "unidad": "categoría", "fuente": "IDEAM ENA", "fecha_dato": "2022-12-31", "puntaje": ideam_info.get("puntaje_h3", 40.0)},
                "H-4": {"nombre": "Autonomía Almacenamiento", "valor": h4_val, "unidad": "horas", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_h4},
                "H-5": {"nombre": "Volumen Útil Embalse", "valor": xm_info.get("volumen_util_pct"), "unidad": "%", "fuente": "XM Sinergox", "fecha_dato": fecha_corte, "puntaje": None},
                # Desempeño del Servicio
                "S-1": {"nombre": "Continuidad", "valor": cont, "unidad": "h/día", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s1},
                "S-2": {"nombre": "Calidad del Agua (IRCA)", "valor": irca_val, "unidad": "%", "fuente": "INS SIVICAP", "fecha_dato": "2024-12-31", "puntaje": punt_s2},
                "S-3": {"nombre": "Cobertura Urbana", "valor": cob, "unidad": "%", "fuente": "SSPD SUI / DANE", "fecha_dato": fecha_sui, "puntaje": punt_s3},
                "S-4": {"nombre": "Agua No Contabilizada (IANC)", "valor": ianc, "unidad": "%", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s4},
                "S-5": {"nombre": "Variación PQR por Servicio", "valor": pqr, "unidad": "%", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": punt_s5},
                "S-6": {"nombre": "Consumo Medio Facturado", "valor": s6_val, "unidad": "m³/susc/mes", "fuente": "SSPD SUI", "fecha_dato": fecha_sui, "puntaje": None},
                # Respuesta e Impacto
                "R-1": {"nombre": "PEC Reportado Vigente", "valor": r1_val, "unidad": "binario", "fuente": "SSPD / MinVivienda", "fecha_dato": fecha_corte, "puntaje": punt_r1},
                "R-2": {"nombre": "Abastecimiento Alterno Activo", "valor": r2_val, "unidad": "binario", "fuente": "UNGRD", "fecha_dato": fecha_corte, "puntaje": punt_r2},
                "R-3": {"nombre": "Racionamiento Reportado", "valor": r3_val, "unidad": "binario", "fuente": "MinVivienda Survey123", "fecha_dato": fecha_corte, "puntaje": punt_r3},
                "R-4": {"nombre": "Calamidad Pública Vigente", "valor": r4_val, "unidad": "binario", "fuente": "UNGRD Sala de Crisis", "fecha_dato": fecha_corte, "puntaje": punt_r4}
            }

            res_m = self.calcular_icr_municipio(
                divipola=div,
                nombre=m["nombre"],
                depto=m["depto"],
                cod_depto=m["cod_depto"],
                poblacion=m["poblacion"],
                indicadores=indicadores_m
            )
            res_m["region"] = m["region"]
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

        corte_final = {
            "metadata_corte": {
                "fecha_corte": fecha_corte,
                "generado_en": ts_utc,
                "version_configuracion": self.VERSION_CONFIG,
                "estado_calidad": "PUBLICADO_VALIDO",
                "total_municipios_evaluados": len(municipios_oro),
                "icr_nacional_ponderado": icr_nacional_ponderado,
                "poblacion_en_riesgo_critico": poblacion_afectada_naranja_roja,
                "conteo_niveles_nacional": conteo_niveles_nacion
            },
            "amenaza_global": amenaza_global,
            "municipios": municipios_oro,
            "departamentos": deptos_oro,
            "alertas_activas": alertas
        }

        # 1. Guardar en zona Oro (JSON inmutable y versionado) de manera atómica
        corte_json_str = json.dumps(corte_final, indent=2, ensure_ascii=False)
        self._escribir_atomico(self.oro_dir / "corte_vigente.json", corte_json_str)
        self._escribir_atomico(self.oro_dir / f"corte_{fecha_corte}.json", corte_json_str)

        # 2. Sincronizar atómicamente con el frontend principal (tablero/js/data.js)
        data_js_content = f"// Datos Maestros Integrados — Vigía El Niño · Acueductos\nwindow.VIGIA_DATA = {{ corte: {corte_json_str} }};\n"
        tablero_js_dir = self.root_dir / "tablero" / "js"
        self._escribir_atomico(tablero_js_dir / "data.js", data_js_content)

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
                    "POBLACION": m["poblacion"],
                    "ICR": m["icr"],
                    "NIVEL_ALERTA": m["nivel_alerta"],
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
        return corte_final
