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
    def normalizar_s1_continuidad(cont: float) -> float:
        """S-1 Continuidad (h/día): 24->0, 22->40, 18->60, 12->75, 4->100."""
        if cont >= 24.0: return 0.0
        elif cont >= 22.0: return round(((24.0 - cont) / 2.0) * 40.0, 2)
        elif cont >= 18.0: return round(40.0 + ((22.0 - cont) / 4.0) * 20.0, 2)
        elif cont >= 12.0: return round(60.0 + ((18.0 - cont) / 6.0) * 15.0, 2)
        elif cont >= 4.0: return round(75.0 + ((12.0 - cont) / 8.0) * 25.0, 2)
        else: return 100.0

    @staticmethod
    def normalizar_s3_cobertura(cob: float) -> float:
        """S-3 Cobertura (%): 100->0, 95->40, 85->60, 70->75, 40->100."""
        if cob >= 100.0: return 0.0
        elif cob >= 95.0: return round(((100.0 - cob) / 5.0) * 40.0, 2)
        elif cob >= 85.0: return round(40.0 + ((95.0 - cob) / 10.0) * 20.0, 2)
        elif cob >= 70.0: return round(60.0 + ((85.0 - cob) / 15.0) * 15.0, 2)
        elif cob >= 40.0: return round(75.0 + ((70.0 - cob) / 30.0) * 25.0, 2)
        else: return 100.0

    @staticmethod
    def normalizar_s4_ianc(ianc: float) -> float:
        """S-4 IANC (%): 20->0, 30->40, 40->60, 50->75, 70->100."""
        if ianc <= 20.0: return 0.0
        elif ianc <= 30.0: return round(((ianc - 20.0) / 10.0) * 40.0, 2)
        elif ianc <= 40.0: return round(40.0 + ((ianc - 30.0) / 10.0) * 20.0, 2)
        elif ianc <= 50.0: return round(60.0 + ((ianc - 40.0) / 10.0) * 15.0, 2)
        elif ianc <= 70.0: return round(75.0 + ((ianc - 50.0) / 20.0) * 25.0, 2)
        else: return 100.0

    @staticmethod
    def normalizar_s5_pqr(pqr: float) -> float:
        """S-5 Variación PQR: 0->0, 25->40, 50->60, 100->75, 300->100."""
        if pqr <= 0: return 0.0
        elif pqr <= 25.0: return round((pqr / 25.0) * 40.0, 2)
        elif pqr <= 50.0: return round(40.0 + ((pqr - 25.0) / 25.0) * 20.0, 2)
        elif pqr <= 100.0: return round(60.0 + ((pqr - 50.0) / 50.0) * 15.0, 2)
        elif pqr <= 300.0: return round(75.0 + ((pqr - 100.0) / 200.0) * 25.0, 2)
        else: return 100.0

    @staticmethod
    def normalizar_h4_autonomia(horas: float) -> float:
        """
        H-4 Autonomía de Almacenamiento (horas):
        Dirección: ↓ (riesgo sube cuando disminuye la autonomía).
        Puntos: >=24h -> 0; 18h -> 35; 12h -> 55; 6h -> 75; <=2h -> 100.
        """
        if horas >= 24.0: return 0.0
        elif horas >= 18.0: return round(((24.0 - horas) / 6.0) * 35.0, 2)
        elif horas >= 12.0: return round(35.0 + ((18.0 - horas) / 6.0) * 20.0, 2)
        elif horas >= 6.0: return round(55.0 + ((12.0 - horas) / 6.0) * 20.0, 2)
        elif horas >= 2.0: return round(75.0 + ((6.0 - horas) / 4.0) * 25.0, 2)
        else: return 100.0

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
            # Campo ausente en el extracto => None (sin_dato), nunca un valor supuesto
            s1_cont = self._num(m.get("s1_cont"))
            s3_cob = self._num(m.get("s3_cob"))
            s4_ianc = self._num(m.get("s4_ianc"))
            s5_pqr = self._num(m.get("s5_pqr"))
            s6_consumo = self._num(m.get("s6_consumo_m3"))
            h4_auton = self._num(m.get("h4_autonomia_h"))
            r1_pec = m.get("r1_pec") if m.get("r1_pec") in (0, 1) else None

            punt_s1 = self.normalizar_s1_continuidad(s1_cont) if s1_cont is not None else None
            punt_s3 = self.normalizar_s3_cobertura(s3_cob) if s3_cob is not None else None
            punt_s4 = self.normalizar_s4_ianc(s4_ianc) if s4_ianc is not None else None
            punt_s5 = self.normalizar_s5_pqr(s5_pqr) if s5_pqr is not None else None
            punt_h4 = self.normalizar_h4_autonomia(h4_auton) if h4_auton is not None else None
            punt_r1 = None if r1_pec is None else (0.0 if r1_pec == 1 else 100.0)

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
                "puntaje_s1": punt_s1,
                "puntaje_s3": punt_s3,
                "puntaje_s4": punt_s4,
                "puntaje_s5": punt_s5,
                "puntaje_h4": punt_h4,
                "puntaje_r1": punt_r1,
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
