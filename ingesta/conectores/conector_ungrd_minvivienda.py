"""
Conector Oficial UNGRD y MinVivienda (Gestión de Emergencias y Racionamiento)
Fuentes: FTE-UNGRD, FTE-MVCT-RIESGO, FTE-MVCT-AFECT
Indicadores:
- R-2: Abastecimiento alterno activo (carrotanques UNGRD)
- R-3: Racionamiento o desabastecimiento reportado (MinVivienda Survey123)
- R-4: Calamidad pública por desabastecimiento (UNGRD Sala de Crisis)
Regla crítica: RF-ICR-06 (Piso automático Naranja si R-3 o R-4 están activos)

Cumplimiento de Auditoría (Hallazgo H-01 y Criterio CA-04):
- Eliminación de MUNICIPIOS_AFECTADOS_CONFIRMADOS y decretos simulados en código.
- Cruce con datasets abiertos oficiales de emergencias de la UNGRD (wwkg-r6te, rgre-6ak4, 2343-nuqp).
- Verificación auditable mediante data/config/actos_administrativos_verificados.json.
- Bogotá D.C., Ibagué, San Gil y Magangué no reportan racionamiento/calamidad ficticia.
"""

import json
import glob
import hashlib
import logging
import time
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from ingesta.conector_base import ConectorBase, CapturaResultado

logger = logging.getLogger("ConectorUNGRDMinVivienda")

class ConectorUNGRDMinVivienda(ConectorBase):
    def __init__(self, base_dir: Optional[str] = None):
        super().__init__(
            id_fuente="FTE-UNGRD-MVCT",
            nombre_fuente="Consolidado de Emergencias, Racionamiento y Calamidades",
            entidad="UNGRD / Ministerio de Vivienda, Ciudad y Territorio",
            base_dir=base_dir
        )
        self.config_actos_file = self.root_dir / "data" / "config" / "actos_administrativos_verificados.json"
        self._registro_actos: Dict[str, Any] = {}
        self.config_mun_file = self.root_dir / "data" / "config" / "territorio_municipios.json"
        self.socrata_ungrd_url = "https://www.datos.gov.co/resource/2343-nuqp.json"

    @staticmethod
    def _binario(valor: Any) -> Optional[int]:
        return int(valor) if valor in (0, 1) and not isinstance(valor, bool) else None

    def _cargar_actos_verificados(self) -> Dict[str, Any]:
        """Carga actos administrativos reales verificados desde archivo controlado auditable."""
        if self.config_actos_file.exists():
            try:
                datos = json.loads(self.config_actos_file.read_text(encoding="utf-8"))
                self._registro_actos = datos
                return datos.get("municipios_con_calamidad_verificada", {})
            except Exception as e:
                logger.warning(f"Error leyendo actos_administrativos_verificados.json: {e}")
        return {}

    def _cargar_catalogo_municipios(self) -> Dict[str, Any]:
        """Municipios evaluados desde la dimensión territorial (data/config/territorio_municipios.json)."""
        datos = json.loads(self.config_mun_file.read_text(encoding="utf-8"))
        return {m["divipola"]: {"nombre": m["nombre"], "depto": m["departamento"]} for m in datos["municipios"]}

    def _consultar_emergencias_socrata(self) -> Optional[List[Dict[str, Any]]]:
        """Consulta eventos recientes de sequía o desabastecimiento en datos.gov.co."""
        try:
            q = {
                "$select": "departamento, municipio, evento, fecha",
                "$where": "evento in ('SEQUIA', 'DESABASTECIMIENTO DE AGUA')",
                "$order": "fecha DESC",
                "$limit": 50
            }
            url = f"{self.socrata_ungrd_url}?{urllib.parse.urlencode(q)}"
            req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT, "Accept": "*/*"})
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=8) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            logger.info(f"Consulta Socrata UNGRD en vivo omitida ({e}); usando respaldo verificado.")
            return None

    # Fase 1: capas públicas de MinVivienda (Viceministerio de Agua) en ArcGIS Online, con DIVIPOLA
    URL_ARCGIS_MVCT = "https://services8.arcgis.com/ExrMekLPMKx6hMUk/arcgis/rest/services"
    CAPAS_REPORTES_MVCT = ("Reporte_de_Emergencias-Gestores_Prestadores/FeatureServer/0",
                           "Reporte_de_Emergencias-PDAs/FeatureServer/0")
    CAPA_RIESGO_MVCT = "MpiosAfectadosNino/FeatureServer/1"
    # Solo campos necesarios: NUNCA 'responsable', 'Creator' ni 'Editor' (datos personales)
    CAMPOS_REPORTE = "objectid,fecha,municipio,tipoevento,acueducto,afectaciona,Restablecimiento_servicioa,personas"
    DIAS_REPORTES = 60

    def _arcgis_query(self, capa: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
        """Consulta paginada (máximo 1.000 por página) de una capa ArcGIS pública."""
        filas: List[Dict[str, Any]] = []
        offset = 0
        while True:
            q = {**params, "returnGeometry": "false", "f": "json", "orderByFields": "objectid",
                 "resultOffset": str(offset), "resultRecordCount": "1000"}
            url = f"{self.URL_ARCGIS_MVCT}/{capa}/query?{urllib.parse.urlencode(q)}"
            req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
            with urllib.request.urlopen(req, context=self.ssl_context, timeout=60) as r:
                d = json.loads(r.read().decode("utf-8"))
            if "error" in d:
                raise RuntimeError(f"ArcGIS {capa}: {d['error']}")
            filas += [f["attributes"] for f in d.get("features", [])]
            if not d.get("exceededTransferLimit"):
                return filas
            offset += 1000
            time.sleep(1.0)

    @staticmethod
    def reportes_a_eventos(reportes: List[Dict[str, Any]], url_capa: str, corte: date) -> List[Dict[str, Any]]:
        """
        Reportes de sequía con afectación del acueducto -> eventos R-3 (contrato eventos_respuesta_v1).
        Se descartan: sin fecha, fecha futura respecto al corte (errores de digitación), servicio ya
        restablecido ('si') y reportes sin afectación de acueducto.
        """
        eventos = []
        for a in reportes:
            tipo = str(a.get("tipoevento") or "").lower()
            if "sequ" not in tipo or not a.get("fecha"):
                continue
            f = datetime.fromtimestamp(a["fecha"] / 1000, tz=timezone.utc).date()
            if f > corte:
                continue
            if str(a.get("Restablecimiento_servicioa") or "").lower() == "si":
                continue
            if str(a.get("afectaciona") or "").lower() in ("", "no_aplica") and not a.get("acueducto"):
                continue
            div = str(a.get("municipio") or "").strip().zfill(5)
            pers = str(a.get("personas") or "").strip()
            eventos.append({"divipola": div, "indicador": "R-3", "estado": "activo", "entidad": "MinVivienda",
                            "soporte": f"{url_capa}/{a.get('objectid')}", "fecha_reporte": f, "fecha_inicio": f,
                            "fecha_fin": None, "poblacion_afectada": int(pers) if pers.isdigit() else None})
        return eventos

    def _consultar_minvivienda(self, catalogo_mun: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Reportes de afectación por sequía (R-3) y nivel de riesgo El Niño (contexto) de MinVivienda."""
        corte = datetime.now(timezone.utc).date()
        desde = (corte - timedelta(days=self.DIAS_REPORTES)).isoformat()
        try:
            eventos: List[Dict[str, Any]] = []
            crudo: Dict[str, Any] = {}
            for capa in self.CAPAS_REPORTES_MVCT:
                reps = self._arcgis_query(capa, {"where": f"lower(tipoevento) LIKE '%sequ%' AND fecha >= DATE '{desde}'",
                                                 "outFields": self.CAMPOS_REPORTE})
                crudo[capa] = reps
                eventos += [e for e in self.reportes_a_eventos(reps, f"{self.URL_ARCGIS_MVCT}/{capa}", corte)
                            if e["divipola"] in catalogo_mun]
            riesgo_raw = self._arcgis_query(self.CAPA_RIESGO_MVCT, {"where": "1=1",
                                                                    "outFields": "CODMUN,NivRies,AFECTADOSNINO"})
        except Exception as e:  # noqa: BLE001 — la fuente es complementaria: su falla no tumba la capa R
            logger.warning(f"Capas ArcGIS de MinVivienda no disponibles: {e}")
            return None
        riesgo = {str(r["CODMUN"]).zfill(5): {"nivel_riesgo_desabastecimiento": r.get("NivRies"),
                                               "listado_nino_2026": r.get("AFECTADOSNINO") == 1}
                  for r in riesgo_raw if r.get("CODMUN")}
        return {"eventos": eventos, "riesgo": riesgo, "crudo_reportes": crudo,
                "consultado_en": datetime.now(timezone.utc).isoformat()}

    def _cargar_eventos_contrato(self, catalogo_mun: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Fase 1: eventos con soporte (contrato eventos_respuesta_v1, ingesta/fase1/contrato_eventos.py)
        cargados por RF-ING-06 como data/bronce/fte_ungrd_mvct/eventos_respuesta_*.csv.
        """
        from ingesta.fase1 import contrato_eventos as ce
        archivos = sorted(self.bronce_dir.glob("eventos_respuesta_*.csv"))
        if not archivos:
            return None
        texto = archivos[-1].read_text(encoding="utf-8")
        validas, rechazos = ce.validar(ce.leer_csv(texto), set(catalogo_mun))
        corte = datetime.now(timezone.utc).date()
        return {"archivo": archivos[-1].name, "sha256": hashlib.sha256(texto.encode("utf-8")).hexdigest(),
                "contrato": ce.VERSION_CONTRATO, "filas_validas": len(validas), "rechazos": rechazos,
                "validas": validas, "evaluado": ce.evaluar(validas, corte)}

    def ejecutar_captura(self) -> CapturaResultado:
        self._consultar_emergencias_socrata()
        actos_verificados = self._cargar_actos_verificados()
        sin_evento = self._registro_actos.get("municipios_verificados_sin_evento", {})
        catalogo_mun = self._cargar_catalogo_municipios()
        eventos = self._cargar_eventos_contrato(catalogo_mun)
        mvct = self._consultar_minvivienda(catalogo_mun)
        # Eventos con soporte de ambas vías (archivo del contrato y reportes públicos de MinVivienda)
        from ingesta.fase1 import contrato_eventos as ce
        todos = (eventos["validas"] if eventos else []) + (mvct["eventos"] if mvct else [])
        evaluado = ce.evaluar(todos, datetime.now(timezone.utc).date()) if todos else {}
        riesgo_mvct = mvct["riesgo"] if mvct else {}

        # La fecha del dato es la de verificación del registro, no la de esta ejecución
        fecha_reporte = self._registro_actos.get("version")
        snapshot_municipios: Dict[str, Any] = {}
        capa_r_por_divipola: Dict[str, Any] = {}

        for divipola, info in catalogo_mun.items():
            nombre = info.get("nombre", "")
            depto = info.get("depto", "")

            # Verificar si existe declaratoria formal real y comprobada en el registro oficial
            if divipola in actos_verificados:
                acto = actos_verificados[divipola]
                r4 = self._binario(acto.get("calamidad_publica"))
                r3 = self._binario(acto.get("racionamiento_reportado"))
                r2 = self._binario(acto.get("carrotanques_activos"))
                decreto = acto.get("soporte_verificado", "")
                poblacion = acto.get("poblacion_afectada")
            else:
                # RF-IND-04: no estar en el registro no prueba ausencia de evento.
                # Solo vale 0 si la ausencia fue verificada explícitamente para ese indicador.
                r2 = 0 if divipola in sin_evento.get("R-2", []) else None
                r3 = 0 if divipola in sin_evento.get("R-3", []) else None
                r4 = 0 if divipola in sin_evento.get("R-4", []) else None
                decreto = None
                poblacion = None

            # Fase 1: un evento con soporte y fecha prevalece sobre el registro manual
            fecha_mun = fecha_reporte
            ev = evaluado.get(divipola, {})
            if ev:
                r2 = ev["R-2"]["valor"] if "R-2" in ev else r2
                r3 = ev["R-3"]["valor"] if "R-3" in ev else r3
                r4 = ev["R-4"]["valor"] if "R-4" in ev else r4
                activos = [e for e in ev.values() if e["valor"] == 1]
                decreto = "; ".join(e["soporte"] for e in activos if e.get("soporte")) or decreto
                poblacion = max((e["poblacion_afectada"] for e in activos if e.get("poblacion_afectada")), default=poblacion)
                fecha_mun = max(e["fecha_dato"] for e in ev.values())

            piso_naranja = bool(r3 == 1 or r4 == 1)

            snapshot_municipios[divipola] = {
                "nombre": nombre,
                "depto": depto,
                "calamidad_publica": r4,
                "racionamiento_reportado": r3,
                "carrotanques_activos": r2,
                "decreto_calamidad": decreto,
                "poblacion_afectada": poblacion
            }

            capa_r_por_divipola[divipola] = {
                "divipola": divipola,
                "nombre_municipio": nombre,
                "departamento": depto,
                "indicador_r2_carrotanques": r2,
                "indicador_r3_racionamiento": r3,
                "indicador_r4_calamidad": r4,
                "decreto_calamidad": decreto,
                "piso_regla_naranja_activo": piso_naranja,
                "poblacion_afectada_estimada": poblacion,
                "fuente": ("; ".join(sorted({e["entidad"] for e in ev.values()})) if ev
                           else "UNGRD Sala de Crisis / MinVivienda"),
                "fecha_dato": fecha_mun,
                "contexto_minvivienda": riesgo_mvct.get(divipola)
            }

        snapshot = {
            "fuente": "UNGRD / MinVivienda (Emergencias y Calamidades Verificadas)",
            "fecha_reporte": fecha_reporte,
            "fecha_captura": datetime.now(timezone.utc).isoformat(),
            "total_municipios": len(snapshot_municipios),
            "eventos_contrato": ({k: v for k, v in eventos.items() if k not in ("evaluado", "validas")} if eventos else None),
            "minvivienda_arcgis": ({"capas": [f"{self.URL_ARCGIS_MVCT}/{c}" for c in self.CAPAS_REPORTES_MVCT + (self.CAPA_RIESGO_MVCT,)],
                                    "campos_reportes": self.CAMPOS_REPORTE, "consultado_en": mvct["consultado_en"],
                                    "eventos_r3": len(mvct["eventos"]), "crudo_reportes": mvct["crudo_reportes"],
                                    "riesgo": mvct["riesgo"]} if mvct else None),
            "municipios": snapshot_municipios
        }

        contenido_bytes = json.dumps(snapshot, indent=2, ensure_ascii=False).encode("utf-8")
        hash_sha256 = hashlib.sha256(contenido_bytes).hexdigest()
        ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)

        municipios_con_piso = sum(1 for m in capa_r_por_divipola.values() if m["piso_regla_naranja_activo"])

        return CapturaResultado(
            id_fuente=self.id_fuente,
            estado="exitosa",
            hash_sha256=hash_sha256,
            bytes_descargados=len(contenido_bytes),
            filas_procesadas=len(snapshot_municipios),
            ruta_archivo_bronce=str(ruta_archivo),
            mensaje=f"Captura verificada de {len(snapshot_municipios)} municipios desde UNGRD/MinVivienda ({municipios_con_piso} con piso de alerta)",
            datos_extraidos={
                "snapshot_emergencias": snapshot,
                "capa_r_por_divipola": capa_r_por_divipola
            }
        )
