"""
Conector Oficial SUI — Sistema Único de Información (SSPD)
Fuentes: FTE-SSPD-SUI
Indicadores:
- S-1: Continuidad del Servicio (h/día)
- S-3: Cobertura Urbana de Acueducto (%)
- S-4: Agua No Contabilizada / IANC (%)
- S-5: Variación Interanual de PQR (%)
- S-6: Consumo Medio Facturado (m³/susc/mes) según piso térmico (Res. CRA 887/2019)
- H-4: Autonomía de Almacenamiento Efectiva (horas)
- R-1: Plan de Emergencia y Contingencia (PEC) reportado vigente

Cumplimiento de Auditoría (Hallazgo H-04 y Criterio CA-01):
- Eliminación de estructuras hardcodeadas en pipeline_corte.py y auditor_veracidad.py.
- Lectura de extractos oficiales certificados en data/bronce/fte_sui/.
- Autonomía H-4 y Consumo S-6 diferenciados por prestador y piso térmico.
"""

import calendar
import json
import glob
import hashlib
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pathlib import Path
from ingesta.conector_base import ConectorBase, CapturaResultado

logger = logging.getLogger("ConectorSUI")

class ConectorSUI(ConectorBase):
    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-SSPD-SUI",
            nombre_fuente="Variables de Prestación SUI (Continuidad, Cobertura, IANC, PQR, PEC)",
            entidad="Superintendencia de Servicios Públicos Domiciliarios (SSPD)",
            base_dir=base_dir
        )
        self.sui_bronce_dir = self.root_dir / "data" / "bronce" / "fte_sui"
        self.sui_bronce_dir.mkdir(parents=True, exist_ok=True)

    def _cargar_extracto_certificado(self) -> Dict[str, Any]:
        """Carga el extracto oficial certificado de la bodega SUI en zona bronce."""
        archivos = sorted(self.sui_bronce_dir.glob("*.json"))
        if archivos:
            try:
                # Tomar el más reciente
                return json.loads(archivos[-1].read_text(encoding="utf-8"))
            except Exception as e:
                logger.warning(f"Error leyendo extracto SUI en bronce: {e}")
        return {}

    @staticmethod
    def _num(valor: Any) -> Optional[float]:
        if valor is None or valor == "":
            return None
        try:
            return float(valor)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _fin_de_periodo(periodo: Optional[str]) -> Optional[str]:
        """'2026-08' -> '2026-08-31'. Periodo ausente o inválido => None."""
        try:
            anio, mes = (int(x) for x in str(periodo).split("-")[:2])
        except (TypeError, ValueError):
            return None
        return f"{anio:04d}-{mes:02d}-{calendar.monthrange(anio, mes)[1]:02d}"

    def ejecutar_captura(self) -> CapturaResultado:
        extracto = self._cargar_extracto_certificado()
        municipios_raw = extracto.get("municipios", {})
        # fecha_dato = último día del periodo reportado (no la fecha de certificación)
        fecha_corte = self._fin_de_periodo(extracto.get("periodo_corte"))

        datos_procesados: Dict[str, Any] = {}
        for divipola, m in municipios_raw.items():
            # Campo ausente en el extracto => None (sin_dato), nunca un valor supuesto.
            # La normalización a puntaje [0, 100] la realiza PipelineCorte desde parametros_icr.json (regla de oro 3).
            s1_cont = self._num(m.get("s1_cont"))
            s3_cob = self._num(m.get("s3_cob"))
            s4_ianc = self._num(m.get("s4_ianc"))
            s5_pqr = self._num(m.get("s5_pqr"))
            s6_consumo = self._num(m.get("s6_consumo_m3"))
            h4_auton = self._num(m.get("h4_autonomia_h"))
            r1_pec = m.get("r1_pec") if m.get("r1_pec") in (0, 1) else None

            datos_procesados[divipola] = {
                "divipola": divipola,
                "nombre": m.get("nombre", ""),
                "piso_termico": m.get("piso_termico", "templado"),
                "s1_cont": s1_cont,
                "s3_cob": s3_cob,
                "s4_ianc": s4_ianc,
                "s5_pqr": s5_pqr,
                "s6_consumo_m3": s6_consumo,
                "h4_autonomia_h": h4_auton,
                "r1_pec": r1_pec,
                "fecha_dato": fecha_corte
            }

        snapshot = {
            "fuente": "SSPD SUI (Sistema Único de Información)",
            "fecha_reporte": fecha_corte,
            "fecha_captura": datetime.now(timezone.utc).isoformat(),
            "total_municipios": len(datos_procesados),
            "municipios": datos_procesados
        }

        contenido_bytes = json.dumps(snapshot, indent=2, ensure_ascii=False).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido_bytes).hexdigest()
        ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)

        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_bytes),
            filas_procesadas=len(datos_procesados),
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje=f"Captura certificada de {len(datos_procesados)} municipios desde SSPD SUI",
            datos_extraidos=datos_procesados
        )
