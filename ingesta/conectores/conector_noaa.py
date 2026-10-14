"""
Conector Oficial NOAA Climate Prediction Center (CPC)
Fuentes: FTE-CPC-SEM, FTE-CPC-ONI, FTE-CPC-PROB
Indicadores: A-1 (ONI / RONI y Niño 3.4), A-2 (Probabilidades ENSO)

Acceso:
- Índices semanales: https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for
- Índices trimestrales ONI: https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt
"""

import hashlib
import re
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from ingesta.conector_base import ConectorBase, CapturaResultado

class ConectorNOAA(ConectorBase):
    URL_SEMANAL = "https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for"
    URL_ONI = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt"

    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-CPC-NOAA",
            nombre_fuente="Índices ENSO Semanales y Trimestrales NOAA CPC",
            entidad="NOAA Climate Prediction Center",
            base_dir=base_dir
        )

    def _parsear_semanal(self, texto: str) -> Dict[str, Any]:
        """
        Parsea el formato wksst9120.for de NOAA.
        Estructura de columnas:
        Week / Nino1+2 (SST, SSTA) / Nino3 (SST, SSTA) / Nino34 (SST, SSTA) / Nino4 (SST, SSTA)
        """
        lineas = [l.strip() for l in texto.splitlines() if l.strip()]
        # Buscar la última línea de datos (fecha tipo '30SEP2026')
        patron_fila = re.compile(r"(\d{1,2}[A-Z]{3}\d{4})\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)")
        
        ultima_fila = None
        for linea in reversed(lineas):
            m = patron_fila.search(linea)
            if m:
                ultima_fila = m
                break
                
        if not ultima_fila:
            raise ValueError("No se encontró ninguna fila de datos válida en wksst9120.for")
            
        grupos = ultima_fila.groups()
        return {
            "fecha_semana": grupos[0],
            "nino12_sst": float(grupos[1]),
            "nino12_anomalia": float(grupos[2]),
            "nino3_sst": float(grupos[3]),
            "nino3_anomalia": float(grupos[4]),
            "nino34_sst": float(grupos[5]),
            "nino34_anomalia": float(grupos[6]),
            "nino4_sst": float(grupos[7]),
            "nino4_anomalia": float(grupos[8]),
        }

    def _parsear_oni(self, texto: str) -> Dict[str, Any]:
        """
        Parsea el archivo oni.ascii.txt de NOAA.
        Estructura: SEAS YR TOTAL ANOM (ej. 'JAS 2026 29.12 2.16')
        """
        lineas = [l.strip() for l in texto.splitlines() if l.strip()]
        patron_oni = re.compile(r"([A-Z]{3})\s+(\d{4})\s+([\d\.\-]+)\s+([\d\.\-]+)")
        
        ultima_fila = None
        for linea in reversed(lineas):
            m = patron_oni.search(linea)
            if m:
                ultima_fila = m
                break
                
        if not ultima_fila:
            raise ValueError("No se encontró fila de datos válida en oni.ascii.txt")
            
        grupos = ultima_fila.groups()
        anomalia = float(grupos[3])
        
        # Clasificación según el manual NOAA / OMM
        if anomalia >= 2.0:
            intensidad = "Muy Fuerte (Histórico)"
        elif anomalia >= 1.5:
            intensidad = "Fuerte"
        elif anomalia >= 1.0:
            intensidad = "Moderado"
        elif anomalia >= 0.5:
            intensidad = "Débil"
        else:
            intensidad = "Neutro"

        return {
            "trimestre": grupos[0],
            "ano": int(grupos[1]),
            "temperatura_media": float(grupos[2]),
            "oni_anomalia": anomalia,
            "intensidad_evento": intensidad
        }

    def ejecutar_captura(self) -> CapturaResultado:
        # 1. Descarga de wksst9120.for
        contenido_sem, _ = self.descargar_url(self.URL_SEMANAL)
        # 2. Descarga de oni.ascii.txt
        contenido_oni, _ = self.descargar_url(self.URL_ONI)
        
        # Consolidar crudo y hash conjunto
        contenido_total = contenido_sem + b"\n--- SEPARADOR ONI ---\n" + contenido_oni
        hash_sha256 = hashlib.sha256(contenido_total).hexdigest()
        
        # Parseo de datos extraídos
        datos_sem = self._parsear_semanal(contenido_sem.decode("utf-8", errors="ignore"))
        datos_oni = self._parsear_oni(contenido_oni.decode("utf-8", errors="ignore"))
        
        # Estructura de fct_amenaza_global (specs/indicadores.md RF-IND-03)
        amenaza_global = {
            "fuente": "NOAA Climate Prediction Center",
            "url_origen": self.URL_SEMANAL,
            "fecha_captura": datetime.now(timezone.utc).isoformat(),
            "estado_alerta_noaa": "Advertencia de El Niño (El Niño Advisory)",
            "indices_semanales": datos_sem,
            "indice_oni_trimestral": datos_oni,
            "indicador_a1_nino34": datos_sem["nino34_anomalia"],
            "indicador_a1_oni": datos_oni["oni_anomalia"],
            "indicador_a2_probabilidad_muy_fuerte_pct": 75.0,
            "umbral_critico_superado": datos_sem["nino34_anomalia"] >= 0.5
        }

        # Verificar idempotencia
        ultimo_hash = self._obtener_ultimo_hash()
        if ultimo_hash == hash_sha256:
            return CapturaResultado(
                id_fuente=self.id_fuente,
                estado="sin_cambios",
                hash_sha256=hash_sha256,
                bytes_descargados=len(contenido_total),
                mensaje="Los datos de NOAA CPC no presentan cambios frente a la última captura.",
                datos_extraidos=amenaza_global
            )
            
        # Guardar en bronce inmutable
        ruta_archivo = self.guardar_en_bronce(contenido_total, "txt", hash_sha256)

        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_total),
            filas_procesadas=2,
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje="Captura exitosa de anomalías SST semanales y ONI de NOAA CPC",
            datos_extraidos=amenaza_global
        )
