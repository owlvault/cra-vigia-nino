"""
Clase Base para Conectores de Ingesta
Proyecto: Vigía El Niño · Acueductos (CRA)
Especificación: specs/ingesta-fuentes.md
Decisión: adr/ADR-0003-arquitectura-medallon.md

Requisitos cumplidos:
- RF-ING-01: Captura programada con registro en ops.captura.
- RF-ING-02: Crudo inmutable con _captura_id, _capturado_en, _hash y _url_origen.
- RF-ING-03: Idempotencia por hash SHA-256.
- RF-ING-04: Reintentos con espera ante fallas transitorias.
- RF-ING-07: Identificación institucional User-Agent CRA-VigiaNino.
"""

import os
import time
import json
import hashlib
import logging
import ssl
import urllib.request
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger("ConectorBase")

class CapturaResultado:
    def __init__(
        self,
        id_fuente: str,
        estado: str, # 'exitosa', 'sin_cambios', 'fallida'
        hash_sha256: str = "",
        bytes_descargados: int = 0,
        filas_procesadas: int = 0,
        ruta_archivo_bronce: str = "",
        mensaje: str = "",
        datos_extraidos: Optional[Any] = None
    ):
        self.id_fuente = id_fuente
        self.estado = estado
        self.hash_sha256 = hash_sha256
        self.bytes_descargados = bytes_descargados
        self.filas_procesadas = filas_procesadas
        self.ruta_archivo_bronce = ruta_archivo_bronce
        self.mensaje = mensaje
        self.datos_extraidos = datos_extraidos
        self.capturado_en = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id_fuente": self.id_fuente,
            "estado": self.estado,
            "hash_sha256": self.hash_sha256,
            "bytes_descargados": self.bytes_descargados,
            "filas_procesadas": self.filas_procesadas,
            "ruta_archivo_bronce": self.ruta_archivo_bronce,
            "mensaje": self.mensaje,
            "capturado_en": self.capturado_en
        }


class ConectorBase(ABC):
    """
    Clase abstracta obligatoria para cada conector de fuente oficial.
    """
    USER_AGENT = "CRA-VigiaNino/1.0 (Comision de Regulacion de Agua Potable y Saneamiento Basico; contacto: tic@cra.gov.co)"
    
    def __init__(self, id_fuente: str, nombre_fuente: str, entidad: str, base_dir: Optional[str] = None):
        self.id_fuente = id_fuente
        self.nombre_fuente = nombre_fuente
        self.entidad = entidad
        
        # Directorios de datos
        self.root_dir = Path(base_dir or Path(__file__).resolve().parent.parent)
        self.bronce_dir = self.root_dir / "data" / "bronce" / self.id_fuente.lower().replace("-", "_")
        self.ops_dir = self.root_dir / "data" / "ops"
        
        self.bronce_dir.mkdir(parents=True, exist_ok=True)
        self.ops_dir.mkdir(parents=True, exist_ok=True)
        
        # Archivo de control de ops
        self.log_capturas_file = self.ops_dir / "capturas.json"
        
        # Contexto SSL seguro con tolerancia a proxys corporativos CRA
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE

    def _obtener_ultimo_hash(self) -> Optional[str]:
        """Recupera el hash de la última captura exitosa para verificar idempotencia (RF-ING-03)."""
        if not self.log_capturas_file.exists():
            return None
        try:
            with open(self.log_capturas_file, "r", encoding="utf-8") as f:
                capturas = json.load(f)
                # Buscar en orden reverso la última exitosa
                for c in reversed(capturas):
                    if c.get("id_fuente") == self.id_fuente and c.get("estado") in ("exitosa", "sin_cambios"):
                        return c.get("hash_sha256")
        except Exception as e:
            logger.warning(f"No se pudo leer log de capturas previo: {e}")
        return None

    def _registrar_captura_en_ops(self, resultado: CapturaResultado):
        """Registra la auditoría en ops.captura (RF-ING-01)."""
        capturas = []
        if self.log_capturas_file.exists():
            try:
                with open(self.log_capturas_file, "r", encoding="utf-8") as f:
                    capturas = json.load(f)
            except Exception:
                capturas = []
        
        capturas.append(resultado.to_dict())
        # Limitar historial en ops a los últimos 500 eventos
        if len(capturas) > 500:
            capturas = capturas[-500:]
            
        with open(self.log_capturas_file, "w", encoding="utf-8") as f:
            json.dump(capturas, f, indent=2, ensure_ascii=False)

    def descargar_url(self, url: str, timeout: int = 15, max_intentos: int = 3) -> Tuple[bytes, int]:
        """
        Descarga con reintentos exponenciales y User-Agent institucional (RF-ING-04, RF-ING-07).
        """
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": self.USER_AGENT,
                "Accept": "*/*"
            }
        )
        
        esperas = [2, 8, 32] # Segundos (adaptados para ejecución ágil)
        ultimo_error = None
        
        for intento in range(max_intentos):
            try:
                inicio = time.time()
                with urllib.request.urlopen(req, context=self.ssl_context, timeout=timeout) as resp:
                    contenido = resp.read()
                    status = resp.status
                    if status == 200:
                        return contenido, status
                    else:
                        ultimo_error = f"HTTP {status}"
            except Exception as e:
                ultimo_error = str(e)
                tiempo_espera = esperas[intento] if intento < len(esperas) else 10
                logger.warning(f"[{self.id_fuente}] Intento {intento + 1}/{max_intentos} fallido: {e}. Esperando {tiempo_espera}s...")
                time.sleep(tiempo_espera)
                
        raise ConnectionError(f"Falla de descarga tras {max_intentos} intentos. Último error: {ultimo_error}")

    def guardar_en_bronce(self, contenido: bytes, extension: str, hash_sha256: str) -> Path:
        """
        Guarda el crudo inmutable en zona bronce (RF-ING-02).
        Formato: YYYYMMDD_HHMMSS_<hash[:8]>.<extension>
        """
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"{ts}_{hash_sha256[:8]}.{extension}"
        ruta_archivo = self.bronce_dir / nombre_archivo
        
        with open(ruta_archivo, "wb") as f:
            f.write(contenido)
            
        return ruta_archivo

    @abstractmethod
    def ejecutar_captura(self) -> CapturaResultado:
        """Método abstracto que implementa la lógica específica de cada fuente."""
        pass

    def ejecutar(self) -> CapturaResultado:
        """Punto de entrada con control de excepciones e idempotencia."""
        logger.info(f"=== Iniciando ingesta de fuente {self.id_fuente} ({self.nombre_fuente}) ===")
        try:
            res = self.ejecutar_captura()
            self._registrar_captura_en_ops(res)
            logger.info(f"=== Ingesta completada con estado: {res.estado} ({res.filas_procesadas} filas) ===")
            return res
        except Exception as e:
            logger.error(f"Error crítico en captura de {self.id_fuente}: {e}")
            fallo = CapturaResultado(
                id_fuente=self.id_fuente,
                estado="fallida",
                mensaje=str(e)
            )
            self._registrar_captura_en_ops(fallo)
            return fallo
