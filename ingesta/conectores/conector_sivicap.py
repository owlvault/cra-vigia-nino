"""
Conector Oficial SIVICAP / Instituto Nacional de Salud (INS)
Fuente: FTE-INS-IRCA
Indicador: S-2 (Índice de Riesgo de la Calidad del Agua Potable - IRCA)

Acceso:
- API Socrata datos.gov.co: Dataset nxt2-39c3
Norma: Resolución 2115 de 2007 (MinSalud / MinAmbiente)
"""

import json
import hashlib
import urllib.parse
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from ingesta.conector_base import ConectorBase, CapturaResultado

class ConectorSIVICAP(ConectorBase):
    DATASET_ID = "nxt2-39c3"
    ENDPOINT = f"https://www.datos.gov.co/resource/{DATASET_ID}.json"

    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-INS-IRCA",
            nombre_fuente="Índice de Riesgo de la Calidad del Agua Potable (IRCA)",
            entidad="Instituto Nacional de Salud (INS) - SIVICAP",
            base_dir=base_dir
        )

    def _clasificar_irca(self, valor_irca: float) -> str:
        """Clasificación regulatoria según Resolución 2115 de 2007."""
        if valor_irca <= 5.0:
            return "SIN_RIESGO"      # Agua apta para consumo humano
        elif valor_irca <= 14.0:
            return "RIESGO_BAJO"     # Susceptible de mejoramiento
        elif valor_irca <= 35.0:
            return "RIESGO_MEDIO"    # No apta, requiere acciones correctivas
        elif valor_irca <= 80.0:
            return "RIESGO_ALTO"     # No apta, alto riesgo para la salud
        else:
            return "INVIABLE_SANITARIAMENTE"

    def _calcular_puntaje_normalizado(self, irca: float) -> float:
        """
        Normalización por tramos según specs/indicadores.md y specs/indice-riesgo.md:
        Puntos de quiebre: 0 -> 0; 5 -> 40; 14 -> 60; 35 -> 75; 80 -> 100
        """
        if irca <= 0:
            return 0.0
        elif irca <= 5.0:
            # Tramo 0 a 5 -> 0 a 40
            return round((irca / 5.0) * 40.0, 2)
        elif irca <= 14.0:
            # Tramo 5 a 14 -> 40 a 60
            return round(40.0 + ((irca - 5.0) / (14.0 - 5.0)) * 20.0, 2)
        elif irca <= 35.0:
            # Tramo 14 a 35 -> 60 a 75
            return round(60.0 + ((irca - 14.0) / (35.0 - 14.0)) * 15.0, 2)
        elif irca <= 80.0:
            # Tramo 35 a 80 -> 75 a 100
            return round(75.0 + ((irca - 35.0) / (80.0 - 35.0)) * 25.0, 2)
        else:
            return 100.0

    def ejecutar_captura(self) -> CapturaResultado:
        # Consulta de los últimos registros disponibles a nivel municipal
        soql_params = {
            "$where": "a_o = '2024' AND municipiocodigo != '#TODOS'",
            "$limit": "5000",
            "$order": "departamento ASC, municipio ASC"
        }
        query_string = urllib.parse.urlencode(soql_params)
        url_completa = f"{self.ENDPOINT}?{query_string}"
        
        contenido_bytes, _ = self.descargar_url(url_completa)
        hash_sha256 = hashlib.sha256(contenido_bytes).hexdigest()
        
        # Procesamiento y estandarización a zona plata/oro
        registros_raw = json.loads(contenido_bytes.decode("utf-8"))
        indicadores_s2_por_divipola: Dict[str, Any] = {}
        
        for reg in registros_raw:
            divipola_raw = str(reg.get("municipiocodigo", "")).strip()
            if not divipola_raw or divipola_raw == "#TODOS":
                continue
                
            divipola = divipola_raw.zfill(5)
            
            try:
                irca_urbano = float(reg.get("ircaurbano", 0.0)) if reg.get("ircaurbano") else None
            except (ValueError, TypeError):
                irca_urbano = None
                
            try:
                irca_rural = float(reg.get("ircarural", 0.0)) if reg.get("ircarural") else None
            except (ValueError, TypeError):
                irca_rural = None
                
            valor_evaluado = irca_urbano if irca_urbano is not None else irca_rural
            
            if valor_evaluado is not None:
                nivel_normativo = self._clasificar_irca(valor_evaluado)
                puntaje_riesgo = self._calcular_puntaje_normalizado(valor_evaluado)
            else:
                nivel_normativo = "SIN_DATO"
                puntaje_riesgo = None
                
            indicadores_s2_por_divipola[divipola] = {
                "divipola": divipola,
                "municipio": reg.get("municipio"),
                "departamento": reg.get("departamento"),
                "periodo_ano": reg.get("a_o"),
                "irca_urbano": irca_urbano,
                "irca_rural": irca_rural,
                "valor_indicador_s2": valor_evaluado,
                "nivel_riesgo_s2": nivel_normativo,
                "puntaje_riesgo_s2": puntaje_riesgo,
                "fuente": "INS - SIVICAP (datos.gov.co: nxt2-39c3)",
                "fecha_captura": datetime.now(timezone.utc).isoformat()
            }

        # Verificar idempotencia
        ultimo_hash = self._obtener_ultimo_hash()
        if ultimo_hash == hash_sha256:
            return CapturaResultado(
                id_fuente=self.id_fuente,
                estado="sin_cambios",
                hash_sha256=hash_sha256,
                bytes_descargados=len(contenido_bytes),
                filas_procesadas=len(indicadores_s2_por_divipola),
                mensaje="Sin cambios en el catálogo IRCA de SIVICAP.",
                datos_extraidos=indicadores_s2_por_divipola
            )
            
        ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)

        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_bytes),
            filas_procesadas=len(indicadores_s2_por_divipola),
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje=f"Captura exitosa de {len(indicadores_s2_por_divipola)} municipios desde SIVICAP",
            datos_extraidos=indicadores_s2_por_divipola
        )
