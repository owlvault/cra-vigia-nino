"""
Módulo de Extracción Alternativa SUI vía API Socrata (datos.gov.co)
Proyecto: Vigía El Niño · Acueductos (CRA)

Permite consultar conjuntos de datos abiertos publicados por la Superintendencia
de Servicios Públicos Domiciliarios (SSPD) y el Instituto Nacional de Salud (INS)
mediante el lenguaje de consulta SoQL (Socrata Query Language).

Se utiliza como canal secundario o cuando no se dispone de conexión VPN/Directa
a la base de datos Oracle institucional del SUI.
"""

import os
import json
import logging
import urllib.request
import urllib.parse
import ssl
from typing import Dict, Any, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SUI_DatosAbiertos")

class SocrataClientSUI:
    BASE_URL = "https://www.datos.gov.co/resource"

    # Catálogo de Datasets Públicos Relevantes en datos.gov.co
    DATASETS = {
        # Calidad del agua potable por municipio (SIVICAP / INS) -> Indicador S-2
        "IRCA_NACIONAL": "nxt2-39c3",
        # Catálogo de prestadores y cobertura departamental
        "COBERTURA_SERVICIOS": "stxq-kks6",
    }

    def __init__(self, app_token: Optional[str] = None, timeout: int = 15):
        self.app_token = app_token or os.environ.get("SOCRATA_APP_TOKEN")
        self.timeout = timeout
        
        # Contexto SSL con validación estricta de certificados (CWE-295 remediado)
        # Soporta bundle CA institucional opcional mediante CRA_CA_BUNDLE_PATH
        self.ssl_context = ssl.create_default_context()
        ca_bundle = os.environ.get("CRA_CA_BUNDLE_PATH")
        if ca_bundle and os.path.exists(ca_bundle):
            self.ssl_context.load_verify_locations(cafile=ca_bundle)
        self.ssl_context.check_hostname = True
        self.ssl_context.verify_mode = ssl.CERT_REQUIRED

    def _ejecutar_consulta_soql(self, dataset_id: str, soql_params: Dict[str, str]) -> List[Dict[str, Any]]:
        """Ejecuta una petición GET a la API Socrata con parámetros SoQL."""
        query_str = urllib.parse.urlencode(soql_params)
        url = f"{self.BASE_URL}/{dataset_id}.json?{query_str}"
        
        headers = {
            "User-Agent": "CRA-VigiaNino/1.0 (Comision de Regulacion de Agua Potable y Saneamiento Basico)",
            "Accept": "application/json"
        }
        if self.app_token:
            headers["X-App-Token"] = self.app_token

        req = urllib.request.Request(url, headers=headers)
        logger.info(f"Consultando Socrata: dataset={dataset_id} params={soql_params}")
        
        try:
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    logger.info(f"Consulta exitosa: {len(data)} filas obtenidas")
                    return data
                else:
                    logger.error(f"Error HTTP {resp.status} al consultar {url}")
                    return []
        except Exception as e:
            logger.error(f"Falla en consulta Socrata ({dataset_id}): {e}")
            return []

    def extraer_irca_por_divipola(self, cod_divipola: str, ano: str = "2024") -> Optional[Dict[str, Any]]:
        """
        Extrae el último valor reportado de IRCA municipal urbano y rural.
        Dataset: nxt2-39c3
        """
        soql = {
            "$where": f"municipiocodigo = '{cod_divipola}' AND a_o = '{ano}'",
            "$order": "a_o DESC",
            "$limit": "1"
        }
        filas = self._ejecutar_consulta_soql(self.DATASETS["IRCA_NACIONAL"], soql)
        if filas:
            fila = filas[0]
            return {
                "divipola": fila.get("municipiocodigo"),
                "municipio": fila.get("municipio"),
                "departamento": fila.get("departamento"),
                "ano": fila.get("a_o"),
                "irca_urbano": float(fila.get("ircaurbano", 0.0)) if fila.get("ircaurbano") else None,
                "nivel_riesgo_urbano": fila.get("nivel_de_riesgo_urbano"),
                "irca_rural": float(fila.get("ircarural", 0.0)) if fila.get("ircarural") else None,
                "fuente": "INS-SIVICAP (datos.gov.co)",
                "fecha_captura": datetime.utcnow().isoformat()
            }
        return None

    def extraer_muestra_nacional_irca(self, ano: str = "2024", limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene una muestra de indicadores de calidad municipal a nivel nacional."""
        soql = {
            "$where": f"a_o = '{ano}' AND municipiocodigo != '#TODOS'",
            "$limit": str(limit),
            "$order": "ircaurbano DESC"
        }
        return self._ejecutar_consulta_soql(self.DATASETS["IRCA_NACIONAL"], soql)


if __name__ == "__main__":
    cliente = SocrataClientSUI()
    print("--- Test de extracción directa Socrata / IRCA ---")
    # Prueba para Riohacha (44001) o Uribia (44847)
    res = cliente.extraer_irca_por_divipola("44001", ano="2024")
    print("Resultado para Riohacha (44001):", res)
