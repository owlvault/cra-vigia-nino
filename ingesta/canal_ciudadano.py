"""
Vista ciudadana derivada del corte publicado
Proyecto: Vigía El Niño · Acueductos (CRA)
Spec: context-lake/specs/canal-ciudadano.md (RF-CIU-01 a RF-CIU-10), ADR-0006

La vista se construye SOLO a partir del corte diario publicado y del corte
semanal vigente (RF-CIU-02): filtra por la lista blanca de config, traduce a
lenguaje claro y evalúa la compuerta de exposición. No recalcula ningún valor.
El canal interno no se toca (RF-CIU-01).

Uso (regenerar desde el corte vigente):
    python -m ingesta.canal_ciudadano
"""

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("CanalCiudadano")

ESTADO_PUBLICABLE = "publicable"
ESTADO_NO_PUBLICABLE = "no_publicable"
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def _version_tupla(version: Optional[str]) -> Tuple[int, ...]:
    """'v1.1.0-20261107' -> (1, 1, 0, 20261107). Versión ilegible => (0,)."""
    try:
        base, _, fecha = str(version).lstrip("v").partition("-")
        return tuple(int(x) for x in base.split(".")) + ((int(fecha),) if fecha else ())
    except ValueError:
        return (0,)


def _num_es(valor: float, decimales: int = 1) -> str:
    """Número con coma decimal: 75.476 -> '75,5'; 20.0 -> '20'."""
    texto = f"{valor:.{decimales}f}".rstrip("0").rstrip(".") if decimales else f"{valor:.0f}"
    return texto.replace(".", ",")


def _periodo(fecha: Optional[str], granularidad: str) -> Optional[str]:
    """Periodo legible del dato: año, 'agosto de 2026' o '12 de octubre de 2026'."""
    if not fecha:
        return None
    try:
        d = datetime.strptime(fecha[:10], "%Y-%m-%d")
    except ValueError:
        return None
    if granularidad == "anual":
        return str(d.year)
    if granularidad == "mensual":
        return f"{MESES[d.month - 1]} de {d.year}"
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


class GeneradorVistaCiudadana:
    def __init__(self, base_dir: Optional[str] = None):
        self.root_dir = Path(base_dir or Path(__file__).resolve().parent.parent)
        cfg = self.root_dir / "data" / "config"
        self.conf = json.loads((cfg / "canal_ciudadano.json").read_text(encoding="utf-8"))
        self.dir_salida = self.root_dir / "data" / "oro" / "ciudadano"

    # ------------------------------------------------------------------ textos
    def _fuente(self, clave: str) -> str:
        return self.conf["fuentes_legibles"].get(clave, clave)

    def _advertencia(self, frescura: Optional[str], periodo: Optional[str]) -> Optional[str]:
        if frescura == "desactualizado" and periodo:
            return self.conf["textos"]["advertencia_desactualizado"].format(periodo=periodo)
        return None

    def _sin_info(self, fuente: str) -> Dict[str, Any]:
        return {"texto": self.conf["textos"]["sin_informacion"], "valor": None, "fuente": fuente,
                "periodo": None, "advertencia": None}

    # ---------------------------------------------------------- por municipio
    def _nivel(self, m: Dict[str, Any], fecha_corte: str) -> Dict[str, Any]:
        etiqueta = self.conf["etiquetas_nivel_riesgo"].get(m.get("nivel_alerta"), self.conf["etiquetas_nivel_riesgo"]["sin_dato"])
        return {"texto": etiqueta,
                "razon": self.conf["textos"]["razon_nivel_por_regla"] if m.get("nivel_por_regla") else None,
                "fuente": self._fuente("CRA"), "periodo": _periodo(fecha_corte, "diario"), "advertencia": None}

    def _calidad_agua(self, ind: Dict[str, Any]) -> Dict[str, Any]:
        fuente = self._fuente("INS SIVICAP")
        valor = ind.get("valor")
        if not isinstance(valor, (int, float)):
            return self._sin_info(fuente)
        banda = next((b["texto"] for b in self.conf["bandas_irca"] if valor <= b["hasta"]), None)
        if banda is None:
            return self._sin_info(fuente)  # fuera de [0, 100]: no se interpreta
        periodo = _periodo(ind.get("fecha_dato"), "anual")
        return {"texto": banda, "valor": valor, "unidad": "IRCA (0 a 100)", "fuente": fuente,
                "periodo": periodo, "advertencia": self._advertencia(ind.get("frescura"), periodo)}

    def _horas_servicio(self, ind: Dict[str, Any]) -> Dict[str, Any]:
        fuente = self._fuente("SSPD SUI")
        valor = ind.get("valor")
        if not isinstance(valor, (int, float)):
            return self._sin_info(fuente)
        periodo = _periodo(ind.get("fecha_dato"), "mensual")
        return {"texto": f"En promedio, {_num_es(valor)} horas de servicio al día", "valor": valor, "unidad": "horas/día",
                "fuente": fuente, "periodo": periodo, "advertencia": self._advertencia(ind.get("frescura"), periodo)}

    def _binario(self, ind: Dict[str, Any], clave_fuente: str) -> Dict[str, Any]:
        """RF-CIU-05: 1 => 'Sí, con soporte oficial'; 0 => 'No, verificado'; null => sin información."""
        fuente = self._fuente(clave_fuente)
        valor = ind.get("valor")
        if valor not in (0, 1) or isinstance(valor, bool):
            return self._sin_info(fuente)
        texto = self.conf["textos"]["si_verificado"] if valor == 1 else self.conf["textos"]["no_verificado"]
        periodo = _periodo(ind.get("fecha_dato"), "diario")
        return {"texto": texto, "valor": valor, "fuente": fuente, "periodo": periodo,
                "advertencia": self._advertencia(ind.get("frescura"), periodo)}

    def _zona(self, m: Dict[str, Any]) -> Optional[str]:
        """RF-CIU-08: zona y subzona solo si el cruce las resolvió."""
        if m.get("zona_hidrografica") and m.get("subzona_hidrografica"):
            return f"{m['zona_hidrografica']} – {m['subzona_hidrografica']}"
        return None

    def _municipio(self, m: Dict[str, Any], fecha_corte: str) -> Dict[str, Any]:
        inds = m.get("indicadores", {})
        constructores = {
            "nivel_riesgo": lambda: self._nivel(m, fecha_corte),
            "calidad_agua": lambda: self._calidad_agua(inds.get("S-2", {})),
            "horas_servicio": lambda: self._horas_servicio(inds.get("S-1", {})),
            "racionamiento": lambda: self._binario(inds.get("R-3", {}), "MinVivienda Survey123"),
            "calamidad_publica": lambda: self._binario(inds.get("R-4", {}), "UNGRD Sala de Crisis"),
        }
        datos = {clave: f() for clave, f in constructores.items() if clave in self.conf["lista_blanca"]}
        return {"divipola": m["divipola"], "municipio": m["nombre"], "departamento": m["departamento"],
                "zona_hidrografica": self._zona(m), **datos}

    # ---------------------------------------------------------------- nacional
    def _variable_semanal(self, semanal: Dict[str, Any], codigo: str, fuente: str) -> Dict[str, Any]:
        md = semanal.get("metadata", {})
        semana = md.get("semana_vigente")
        fila = (semanal.get("fct_variable_semana", {}).get("1", {}).get(codigo, {}) or {}).get(semana)
        serie = next((s for s in semanal.get("series", {}).get(codigo, []) if s.get("semana_iso") == semana), {})
        if not fila or fila.get("valor") is None:
            return self._sin_info(fuente)
        fecha = serie.get("fecha_dato")
        periodo = serie.get("etiqueta_periodo") or _periodo(fecha, "diario")
        advertencia = None
        try:
            edad = (datetime.now(timezone.utc).date() - datetime.strptime(fecha[:10], "%Y-%m-%d").date()).days
            if edad > self.conf["dias_max_dato_semanal_sin_advertencia"]:
                advertencia = self.conf["textos"]["advertencia_desactualizado"].format(periodo=periodo)
        except (TypeError, ValueError):
            pass
        return {"valor": fila["valor"], "nivel": fila.get("nivel_etiqueta"), "delta": fila.get("delta_abs"),
                "tendencia": fila.get("tendencia"), "fuente": fuente, "periodo": periodo, "advertencia": advertencia}

    def _texto_tendencia(self, v: Dict[str, Any]) -> str:
        t = self.conf["textos"]
        if v.get("tendencia") == "estable" or not v.get("delta"):
            return t["tendencia_estable"]
        plantilla = t["tendencia_sube"] if v["delta"] > 0 else t["tendencia_baja"]
        return plantilla.format(delta=_num_es(abs(v["delta"])))

    def _nacional(self, semanal: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        semanal = semanal or {}
        res: Dict[str, Any] = {}
        if "embalses" in self.conf["lista_blanca"]:
            fuente = self._fuente("XM")
            emb = {}
            for clave, codigo, nombre in (("nacional", "EMBALSES_NAL_PCT", "Embalses del país"),
                                          ("bogota", "EMBALSE_BOGOTA_PCT", "Embalses que abastecen a Bogotá")):
                v = self._variable_semanal(semanal, codigo, fuente)
                if v.get("valor") is not None:
                    v["texto"] = f"{nombre}: {_num_es(v['valor'])} % de su volumen útil; {self._texto_tendencia(v)}"
                emb[clave] = v
            emb["nota"] = self.conf["textos"]["embalses_nota"]
            res["embalses"] = emb
        if "estado_el_nino" in self.conf["lista_blanca"]:
            fuente = self._fuente("NOAA")
            nino = self._variable_semanal(semanal, "NINO34_SSTA", fuente)
            oni = self._variable_semanal(semanal, "ONI", fuente)
            if nino.get("valor") is not None:
                nino["texto"] = (f"La temperatura del océano Pacífico central está {_num_es(nino['valor'])} °C por encima de lo normal"
                                 + (f" (intensidad: {nino['nivel'].lower()})" if nino.get("nivel") else ""))
            res["estado_el_nino"] = {"semanal": nino, "trimestral": oni,
                                     "remision": self.conf["textos"]["remisiones"]["clima"]}
        return res

    # --------------------------------------------------------------- compuerta
    def evaluar_compuerta(self, corte: Dict[str, Any]) -> List[str]:
        """RF-CIU-10: devuelve las condiciones de ADR-0006 incumplidas (vacía => publicable)."""
        cond = self.conf["condiciones_exposicion"]
        md = corte.get("metadata_corte", {})
        motivos = []
        if not cond.get("clasificacion_informacion_publica"):
            motivos.append("C-CIU-01 clasificación de información pendiente (Q-SEG-01)")
        if not cond.get("textos_aprobados"):
            motivos.append("C-CIU-02 textos del canal sin aprobar (Q-CIU-02)")
        if md.get("estado_calidad") != "PUBLICADO_VALIDO":
            motivos.append("C-CIU-03 el corte no está publicado")
        elif _version_tupla(md.get("version_configuracion")) < _version_tupla(cond.get("version_minima_configuracion_icr")):
            motivos.append(f"C-CIU-03 corte calculado con configuración {md.get('version_configuracion')}, "
                           f"anterior a {cond.get('version_minima_configuracion_icr')}")
        sin_dane = [m["divipola"] for m in corte.get("municipios", [])
                    if not str(m.get("fuente_poblacion", "")).startswith("DANE")]
        if sin_dane or not corte.get("municipios"):
            motivos.append(f"C-CIU-04 población sin proyección DANE en {len(sin_dane)} municipios")
        return motivos

    # ------------------------------------------------------------------ vista
    def construir(self, corte: Dict[str, Any], semanal: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        md = corte.get("metadata_corte", {})
        fecha_corte = md.get("fecha_corte")
        motivos = self.evaluar_compuerta(corte)
        municipios = [self._municipio(m, fecha_corte) for m in corte.get("municipios", [])]

        etiquetas = self.conf["etiquetas_nivel_riesgo"]
        deptos: Dict[str, Dict[str, Any]] = {}
        for m_vista, m in zip(municipios, corte.get("municipios", [])):
            d = deptos.setdefault(m["cod_depto"], {"cod_depto": m["cod_depto"], "departamento": m["departamento"],
                                                   "municipios_por_nivel": {e: 0 for e in etiquetas.values()},
                                                   "municipios": []})
            d["municipios_por_nivel"][etiquetas.get(m.get("nivel_alerta"), etiquetas["sin_dato"])] += 1
            d["municipios"].append(m_vista)

        return {
            "metadata": {
                "estado": ESTADO_NO_PUBLICABLE if motivos else ESTADO_PUBLICABLE,
                "motivos_no_publicable": motivos,
                "fecha_corte": fecha_corte,
                "generado_en": datetime.now(timezone.utc).isoformat(),
                "version_canal": self.conf["version"],
                "version_configuracion_icr": md.get("version_configuracion"),
                "semana_semanal": (semanal or {}).get("metadata", {}).get("semana_vigente"),
                "aviso": self.conf["textos"]["aviso"],
                "remisiones": self.conf["textos"]["remisiones"],
                "municipio_fuera_de_muestra": self.conf["textos"]["municipio_fuera_de_muestra"],
            },
            "nacional": self._nacional(semanal),
            "departamentos": sorted(deptos.values(), key=lambda d: d["departamento"]),
        }

    def generar(self, corte: Dict[str, Any], semanal: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Construye y escribe la vista; nunca toca los artefactos del canal interno."""
        vista = self.construir(corte, semanal)
        contenido = json.dumps(vista, indent=2, ensure_ascii=False)
        self.dir_salida.mkdir(parents=True, exist_ok=True)
        for nombre in ("vista_vigente.json", f"vista_{vista['metadata']['fecha_corte']}.json"):
            destino = self.dir_salida / nombre
            temp = destino.with_name(f"{nombre}.tmp.{int(time.time() * 1000)}")
            temp.write_text(contenido, encoding="utf-8")
            temp.replace(destino)
        return vista


def cargar_semanal(root_dir: Path) -> Optional[Dict[str, Any]]:
    ruta = root_dir / "data" / "oro" / "semanal" / "corte_semanal_vigente.json"
    return json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else None


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    gen = GeneradorVistaCiudadana()
    corte = json.loads((gen.root_dir / "data" / "oro" / "corte_vigente.json").read_text(encoding="utf-8"))
    v = gen.generar(corte, cargar_semanal(gen.root_dir))
    logger.info(f"Vista ciudadana {v['metadata']['fecha_corte']}: {v['metadata']['estado']} {v['metadata']['motivos_no_publicable']}")
