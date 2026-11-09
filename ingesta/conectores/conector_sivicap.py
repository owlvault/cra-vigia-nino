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
            nivel_normativo = self._clasificar_irca(valor_evaluado) if valor_evaluado is not None else "SIN_DATO"
                
            indicadores_s2_por_divipola[divipola] = {
                "divipola": divipola,
                "municipio": reg.get("municipio"),
                "departamento": reg.get("departamento"),
                "periodo_ano": reg.get("a_o"),
                "irca_urbano": irca_urbano,
                "irca_rural": irca_rural,
                "valor_indicador_s2": valor_evaluado,
                "nivel_riesgo_s2": nivel_normativo,
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
