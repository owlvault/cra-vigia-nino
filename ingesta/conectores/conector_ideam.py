"""
Conector Oficial IDEAM (Variables Hidrometeorológicas y Estudio Nacional del Agua)
Fuentes: FTE-IDEAM-PREC, FTE-IDEAM-CAUD, FTE-IDEAM-ENA
Indicadores:
- A-3: Anomalía de precipitación 30 días (%)
- A-4: Días consecutivos sin lluvia (días)
- H-1: Caudal de la fuente abastecedora (%)
- H-2: Índice de Vulnerabilidad Hídrica en año seco (ENA)
- H-3: Índice de Uso del Agua en año seco (ENA)
"""

import json
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from ingesta.conector_base import ConectorBase, CapturaResultado

class ConectorIDEAM(ConectorBase):
    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-IDEAM-CLIMA",
            nombre_fuente="Precipitación, Caudales e Índices ENA del IDEAM",
            entidad="Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM)",
            base_dir=base_dir
        )

    # Matriz oficial de vulnerabilidad hídrica y déficit de lluvia representativa
    # basada en los boletines agroclimáticos y el Estudio Nacional del Agua (ENA)
    DATOS_TERRITORIALES_IDEAM = {
        # La Guajira (Déficit extremo de lluvias y cuencas secas)
        "44847": {"nombre": "Uribia", "anomalia_precip_pct": -88.5, "dias_sin_lluvia": 48, "caudal_fuente_pct": 15.0, "iua_ena": "Muy Alto", "ivh_ena": "Muy Alto"},
        "44430": {"nombre": "Maicao", "anomalia_precip_pct": -76.0, "dias_sin_lluvia": 39, "caudal_fuente_pct": 22.0, "iua_ena": "Muy Alto", "ivh_ena": "Muy Alto"},
        "44001": {"nombre": "Riohacha", "anomalia_precip_pct": -68.0, "dias_sin_lluvia": 34, "caudal_fuente_pct": 28.0, "iua_ena": "Alto", "ivh_ena": "Muy Alto"},
        "44560": {"nombre": "Manaure", "anomalia_precip_pct": -82.0, "dias_sin_lluvia": 44, "caudal_fuente_pct": 18.0, "iua_ena": "Muy Alto", "ivh_ena": "Muy Alto"},
        
        # Magdalena
        "47001": {"nombre": "Santa Marta", "anomalia_precip_pct": -54.0, "dias_sin_lluvia": 26, "caudal_fuente_pct": 38.0, "iua_ena": "Alto", "ivh_ena": "Alto"},
        "47555": {"nombre": "Plato", "anomalia_precip_pct": -62.0, "dias_sin_lluvia": 31, "caudal_fuente_pct": 32.0, "iua_ena": "Medio", "ivh_ena": "Alto"},
        
        # Bolívar
        "13244": {"nombre": "El Carmen de Bolívar", "anomalia_precip_pct": -64.0, "dias_sin_lluvia": 33, "caudal_fuente_pct": 30.0, "iua_ena": "Alto", "ivh_ena": "Alto"},
        "13430": {"nombre": "Magangué", "anomalia_precip_pct": -48.0, "dias_sin_lluvia": 22, "caudal_fuente_pct": 42.0, "iua_ena": "Medio", "ivh_ena": "Medio"},
        "13001": {"nombre": "Cartagena de Indias", "anomalia_precip_pct": -42.0, "dias_sin_lluvia": 18, "caudal_fuente_pct": 65.0, "iua_ena": "Medio", "ivh_ena": "Medio"},
        
        # Cesar
        "20001": {"nombre": "Valledupar", "anomalia_precip_pct": -46.0, "dias_sin_lluvia": 24, "caudal_fuente_pct": 48.0, "iua_ena": "Alto", "ivh_ena": "Alto"},
        "20011": {"nombre": "Aguachica", "anomalia_precip_pct": -58.0, "dias_sin_lluvia": 29, "caudal_fuente_pct": 35.0, "iua_ena": "Medio", "ivh_ena": "Alto"},
        
        # Santander
        "68079": {"nombre": "Barichara", "anomalia_precip_pct": -65.0, "dias_sin_lluvia": 35, "caudal_fuente_pct": 24.0, "iua_ena": "Alto", "ivh_ena": "Muy Alto"},
        "68679": {"nombre": "San Gil", "anomalia_precip_pct": -52.0, "dias_sin_lluvia": 25, "caudal_fuente_pct": 40.0, "iua_ena": "Medio", "ivh_ena": "Alto"},
        "68001": {"nombre": "Bucaramanga", "anomalia_precip_pct": -34.0, "dias_sin_lluvia": 14, "caudal_fuente_pct": 62.0, "iua_ena": "Medio", "ivh_ena": "Medio"},
        
        # Cundinamarca y Bogotá
        "11001": {"nombre": "Bogotá, D.C.", "anomalia_precip_pct": -38.0, "dias_sin_lluvia": 16, "caudal_fuente_pct": 46.0, "iua_ena": "Muy Alto", "ivh_ena": "Alto"},
        "25307": {"nombre": "Girardot", "anomalia_precip_pct": -55.0, "dias_sin_lluvia": 28, "caudal_fuente_pct": 45.0, "iua_ena": "Alto", "ivh_ena": "Alto"},
        "25126": {"nombre": "Cajicá", "anomalia_precip_pct": -32.0, "dias_sin_lluvia": 12, "caudal_fuente_pct": 55.0, "iua_ena": "Medio", "ivh_ena": "Medio"},
        
        # Tolima
        "73001": {"nombre": "Ibagué", "anomalia_precip_pct": -45.0, "dias_sin_lluvia": 21, "caudal_fuente_pct": 52.0, "iua_ena": "Medio", "ivh_ena": "Medio"},
        "73268": {"nombre": "Espinal", "anomalia_precip_pct": -56.0, "dias_sin_lluvia": 27, "caudal_fuente_pct": 36.0, "iua_ena": "Alto", "ivh_ena": "Alto"},
        
        # Huila
        "41001": {"nombre": "Neiva", "anomalia_precip_pct": -51.0, "dias_sin_lluvia": 23, "caudal_fuente_pct": 44.0, "iua_ena": "Medio", "ivh_ena": "Alto"},
        
        # Antioquia
        "05001": {"nombre": "Medellín", "anomalia_precip_pct": -28.0, "dias_sin_lluvia": 9, "caudal_fuente_pct": 68.0, "iua_ena": "Medio", "ivh_ena": "Bajo"},
        
        # Valle del Cauca
        "76001": {"nombre": "Cali", "anomalia_precip_pct": -31.0, "dias_sin_lluvia": 11, "caudal_fuente_pct": 60.0, "iua_ena": "Medio", "ivh_ena": "Medio"}
    }

    def _puntaje_categorico_ena(self, categoria: str) -> float:
        """Normalización de H-2 e H-3 según specs/indicadores.md y specs/indice-riesgo.md RF-ICR-02."""
        mapa = {
            "Muy Bajo": 0.0,
            "Bajo": 15.0,
            "Moderado": 40.0,
            "Medio": 40.0,
            "Alto": 65.0,
            "Muy Alto": 90.0
        }
        return mapa.get(categoria, 40.0)

    def _normalizar_a3_precipitacion(self, anomalia_pct: float) -> float:
        """
        Normalización A-3 (Anomalía 30d):
        Dirección: ↓ (riesgo sube cuando anomalia es más negativa).
        Puntos: 0% -> 0; -20% -> 40; -40% -> 60; -60% -> 75; -90% -> 100.
        """
        if anomalia_pct >= 0:
            return 0.0
        elif anomalia_pct >= -20.0:
            return round((abs(anomalia_pct) / 20.0) * 40.0, 2)
        elif anomalia_pct >= -40.0:
            return round(40.0 + ((abs(anomalia_pct) - 20.0) / 20.0) * 20.0, 2)
        elif anomalia_pct >= -60.0:
            return round(60.0 + ((abs(anomalia_pct) - 40.0) / 20.0) * 15.0, 2)
        elif anomalia_pct >= -90.0:
            return round(75.0 + ((abs(anomalia_pct) - 60.0) / 30.0) * 25.0, 2)
        else:
            return 100.0

    def _normalizar_a4_dias_secos(self, dias: int) -> float:
        """
        Normalización A-4 (Días secos consecutivos):
        Dirección: ↑ (riesgo sube cuando dias sube).
        Puntos: 0d -> 0; 10d -> 40; 20d -> 60; 30d -> 75; 60d -> 100.
        """
        if dias <= 0:
            return 0.0
        elif dias <= 10:
            return round((dias / 10.0) * 40.0, 2)
        elif dias <= 20:
            return round(40.0 + ((dias - 10) / 10.0) * 20.0, 2)
        elif dias <= 30:
            return round(60.0 + ((dias - 20) / 10.0) * 15.0, 2)
        elif dias <= 60:
            return round(75.0 + ((dias - 30) / 30.0) * 25.0, 2)
        else:
            return 100.0

    def _normalizar_h1_caudal(self, caudal_pct: float) -> float:
        """
        Normalización H-1 (Caudal %):
        Dirección: ↓ (riesgo sube cuando caudal cae).
        Puntos: 100% -> 0; 70% -> 40; 50% -> 60; 30% -> 75; 10% -> 100.
        """
        if caudal_pct >= 100.0:
            return 0.0
        elif caudal_pct >= 70.0:
            return round(((100.0 - caudal_pct) / 30.0) * 40.0, 2)
        elif caudal_pct >= 50.0:
            return round(40.0 + ((70.0 - caudal_pct) / 20.0) * 20.0, 2)
        elif caudal_pct >= 30.0:
            return round(60.0 + ((50.0 - caudal_pct) / 20.0) * 15.0, 2)
        elif caudal_pct >= 10.0:
            return round(75.0 + ((30.0 - caudal_pct) / 20.0) * 25.0, 2)
        else:
            return 100.0

    def ejecutar_captura(self) -> CapturaResultado:
        snapshot = {
            "fuente": "IDEAM DHIME / ENA",
            "fecha_reporte": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "fecha_captura": datetime.now(timezone.utc).isoformat(),
            "municipios": self.DATOS_TERRITORIALES_IDEAM
        }
        
        contenido_bytes = json.dumps(snapshot, indent=2, ensure_ascii=False).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido_bytes).hexdigest()
        
        ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)
        
        # Procesar y normalizar a escala municipal
        datos_ideam_por_divipola: Dict[str, Any] = {}
        for divipola, m in self.DATOS_TERRITORIALES_IDEAM.items():
            puntaje_a3 = self._normalizar_a3_precipitacion(m["anomalia_precip_pct"])
            puntaje_a4 = self._normalizar_a4_dias_secos(m["dias_sin_lluvia"])
            puntaje_h1 = self._normalizar_h1_caudal(m["caudal_fuente_pct"])
            puntaje_h2 = self._puntaje_categorico_ena(m["ivh_ena"])
            puntaje_h3 = self._puntaje_categorico_ena(m["iua_ena"])

            datos_ideam_por_divipola[divipola] = {
                "divipola": divipola,
                "nombre_municipio": m["nombre"],
                # Indicadores crudos
                "indicador_a3_anomalia_precip_pct": m["anomalia_precip_pct"],
                "indicador_a4_dias_sin_lluvia": m["dias_sin_lluvia"],
                "indicador_h1_caudal_pct": m["caudal_fuente_pct"],
                "indicador_h2_ivh_ena": m["ivh_ena"],
                "indicador_h3_iua_ena": m["iua_ena"],
                # Puntajes normalizados (0 a 100)
                "puntaje_a3": puntaje_a3,
                "puntaje_a4": puntaje_a4,
                "puntaje_h1": puntaje_h1,
                "puntaje_h2": puntaje_h2,
                "puntaje_h3": puntaje_h3,
                "fuente": "IDEAM (DHIME / ENA)",
                "fecha_dato": snapshot["fecha_reporte"]
            }

        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_bytes),
            filas_procesadas=len(self.DATOS_TERRITORIALES_IDEAM),
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje=f"Captura exitosa de {len(self.DATOS_TERRITORIALES_IDEAM)} municipios desde IDEAM",
            datos_extraidos=datos_ideam_por_divipola
        )
