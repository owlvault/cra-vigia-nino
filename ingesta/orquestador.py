"""
Orquestador Principal de Ingesta y Consolidación de Datos
Proyecto: Vigía El Niño · Acueductos (CRA)
Especificación: specs/ingesta-fuentes.md y docs/business_context.md FL-01

Controla la ejecución secuencial o paralela de los conectores de fuentes externas,
gestiona la compuerta de calidad y ejecuta el pipeline de corte en zona Oro.
"""

import time
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timezone

from ingesta.conectores.conector_noaa import ConectorNOAA
from ingesta.conectores.conector_sivicap import ConectorSIVICAP
from ingesta.conectores.conector_ideam import ConectorIDEAM
from ingesta.conectores.conector_ungrd_minvivienda import ConectorUNGRDMinVivienda
from ingesta.conectores.conector_xm_embalses import ConectorXMEmbalses
from ingesta.conectores.conector_nasa_firms import ConectorNASAFIRMS
from ingesta.pipeline_corte import PipelineCorte

logger = logging.getLogger("OrquestadorVigia")

class OrquestadorIngesta:
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = base_dir
        self.pipeline = PipelineCorte(base_dir=base_dir)
        
        # Instanciar catálogo de conectores
        self.conectores = {
            "NOAA": ConectorNOAA(base_dir=base_dir),
            "SIVICAP": ConectorSIVICAP(base_dir=base_dir),
            "IDEAM": ConectorIDEAM(base_dir=base_dir),
            "UNGRD_MVCT": ConectorUNGRDMinVivienda(base_dir=base_dir),
            "XM": ConectorXMEmbalses(base_dir=base_dir),
            "FIRMS": ConectorNASAFIRMS(base_dir=base_dir)
        }

    def ejecutar_ciclo_completo(
        self, on_progreso: Optional[Callable[[str, str, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Ejecuta el flujo completo FL-01:
        1. Ingesta de fuentes a zona Bronce.
        2. Extracción de variables y normalización.
        3. Generación del corte en zona Oro.

        on_progreso(paso, estado, mensaje): callback opcional (RF-SEM-05).
        """
        notificar = on_progreso or (lambda *_: None)
        inicio = time.time()
        logger.info("================================================================================")
        logger.info("INICIANDO CICLO DIARIO DE INGESTA AUTOMÁTICA — VIGÍA EL NIÑO · ACUEDUCTOS")
        logger.info("================================================================================")
        
        resultados_captura = {}
        datos_extraidos = {}
        
        # 1. Ejecutar cada conector
        for nombre, conector in self.conectores.items():
            logger.info(f"-> Ejecutando conector: {nombre} ({conector.id_fuente})...")
            notificar(nombre, "en_ejecucion", conector.nombre_fuente)
            try:
                res = conector.ejecutar()
                resultados_captura[nombre] = res.to_dict()
                if res.datos_extraidos:
                    datos_extraidos[nombre] = res.datos_extraidos
                notificar(nombre, res.estado, res.mensaje)
            except Exception as e:
                logger.error(f"Falla no controlada en conector {nombre}: {e}")
                notificar(nombre, "fallida", str(e))
                resultados_captura[nombre] = {
                    "id_fuente": conector.id_fuente,
                    "estado": "fallida",
                    "mensaje": str(e)
                }

        # 2. Desempaquetar datos para el pipeline analítico
        amenaza_global = datos_extraidos.get("NOAA", {})
        sivicap_data = datos_extraidos.get("SIVICAP", {})
        ideam_data = datos_extraidos.get("IDEAM", {})
        ungrd_data = datos_extraidos.get("UNGRD_MVCT", {}).get("capa_r_por_divipola", {})
        xm_data = datos_extraidos.get("XM", {}).get("h5_por_divipola", {})
        firms_data = datos_extraidos.get("FIRMS", {})

        # 3. Ejecutar consolidación en zona Oro
        logger.info("-> Ejecutando cálculo analítico del Índice Compuesto de Riesgo (ICR)...")
        notificar("Corte oro (ICR)", "en_ejecucion", "Calculando Índice Compuesto de Riesgo")
        corte_oro = self.pipeline.generar_corte_completo(
            amenaza_global=amenaza_global,
            datos_ideam=ideam_data,
            datos_sivicap=sivicap_data,
            datos_ungrd_mvct=ungrd_data,
            datos_xm=xm_data,
            datos_firms=firms_data
        )

        notificar("Corte oro (ICR)", "exitosa", f"Corte {corte_oro['metadata_corte'].get('fecha_corte')}")
        duracion = round(time.time() - inicio, 2)
        logger.info(f"Ciclo diario completado exitosamente en {duracion} segundos.")
        
        return {
            "estado": "EXITOSO",
            "duracion_segundos": duracion,
            "resumen_capturas": resultados_captura,
            "corte_publicado": corte_oro["metadata_corte"]
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    orquestador = OrquestadorIngesta()
    resultado = orquestador.ejecutar_ciclo_completo()
    print("\n=== RESUMEN DE EJECUCIÓN DEL ORQUESTADOR ===")
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
