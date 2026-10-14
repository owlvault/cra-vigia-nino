"""
Almacén histórico semanal (append-only) — RF-SEM-09
Proyecto: Vigía El Niño · Acueductos (CRA)
Spec: context-lake/specs/comparativo-semanal.md

Línea base: el primer corte oro diario con estado_calidad válido (data/oro/corte_AAAA-MM-DD.json).
Desde la semana ISO de esa línea base hasta la semana actual se guarda un archivo por semana:

    data/oro/semanal/historico/manifest.json
    data/oro/semanal/historico/semana_<AAAA-Www>.json

Reglas:
- La línea base se fija una sola vez (manifest) y no se mueve aunque aparezcan cortes anteriores.
- Una semana está «abierta» hasta fin_semana + dias_gracia_cierre; mientras tanto se reescribe.
- Al pasar la gracia se escribe una última vez con estado «cerrada» y nunca más se sobrescribe.
- Si una semana cerrada se recalcula con otro resultado, el cambio NO se aplica: se registra
  en manifest.discrepancias (trazabilidad sin reescritura).
"""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


def _sha256_archivo(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()


def _sha256_obj(obj: Any) -> str:
    return hashlib.sha256(json.dumps(obj, ensure_ascii=False, sort_keys=True, default=str).encode("utf-8")).hexdigest()


def estado_semana(fin: date, hoy: date, dias_gracia: int) -> str:
    """Pura: 'cerrada' si ya pasó la gracia tras el fin de la semana."""
    return "cerrada" if fin + timedelta(days=dias_gracia) < hoy else "abierta"


class AlmacenHistorico:
    def __init__(self, root: Path, cfg: Dict[str, Any], hoy: date):
        conf = cfg.get("almacen_historico", {})
        self.root = root
        self.dir = root / conf.get("directorio", "data/oro/semanal/historico")
        self.gracia = int(conf.get("dias_gracia_cierre", 7))
        self.estado_valido = conf.get("estado_corte_valido", "PUBLICADO_VALIDO")
        self.hoy = hoy
        self.manifest_file = self.dir / "manifest.json"

    # ------------------------------------------------------------------ io
    def _leer(self, ruta: Path) -> Optional[Dict[str, Any]]:
        if not ruta.exists():
            return None
        try:
            return json.loads(ruta.read_text(encoding="utf-8"))
        except Exception:
            return None

    def _escribir(self, ruta: Path, contenido: Any) -> None:
        ruta.parent.mkdir(parents=True, exist_ok=True)
        tmp = ruta.with_suffix(ruta.suffix + ".tmp")
        tmp.write_text(json.dumps(contenido, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
        tmp.replace(ruta)

    def manifest(self) -> Optional[Dict[str, Any]]:
        return self._leer(self.manifest_file)

    # ------------------------------------------------------------ línea base
    def _linea_base(self, cortes_oro: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        from ingesta.semanal.modelo_semanal import semana_iso
        validos = [c for c in cortes_oro
                   if c["corte"].get("metadata_corte", {}).get("estado_calidad") == self.estado_valido]
        if not validos:
            return None
        c = validos[0]
        meta = c["corte"]["metadata_corte"]
        return {
            "fecha_corte": c["fecha"].isoformat(), "semana_iso": semana_iso(c["fecha"]),
            "archivo": c["archivo"], "sha256": _sha256_archivo(self.root / c["archivo"]),
            "estado_calidad": meta.get("estado_calidad"), "generado_en": meta.get("generado_en"),
            "version_configuracion": meta.get("version_configuracion"),
        }

    # -------------------------------------------------------------- registro
    def registrar(self, corte_semanal: Dict[str, Any], cortes_oro: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Actualiza el almacén con el corte semanal recién construido. Devuelve el manifest."""
        from ingesta.semanal.modelo_semanal import fin_semana, inicio_semana, rango_semanas, semana_iso

        ahora = datetime.now(timezone.utc).isoformat()
        man = self.manifest()
        if man is None:
            base = self._linea_base(cortes_oro)
            if base is None:
                return None  # sin cortes válidos no hay almacén
            man = {
                "modelo": "almacen_historico_semanal", "spec": "RF-SEM-09",
                "linea_base": base, "creado_en": ahora, "actualizado_en": ahora,
                "politica": {"dias_gracia_cierre": self.gracia, "estado_corte_valido": self.estado_valido,
                             "reescritura_semanas_cerradas": False},
                "semanas": [], "discrepancias": [],
            }

        meta = corte_semanal["metadata"]
        variables = [v for v in corte_semanal["variables"] if v.get("activa", True) and not v.get("solo_analogos")]
        fct1 = corte_semanal["fct_variable_semana"].get("1", {})
        series = corte_semanal["series"]
        inicio_ev = corte_semanal.get("evento_vigente", {}).get("inicio_semana")
        semana_actual = semana_iso(self.hoy)
        indice = {s["semana_iso"]: s for s in man["semanas"]}

        for s in rango_semanas(man["linea_base"]["semana_iso"], semana_actual):
            ruta = self.dir / f"semana_{s}.json"
            previo = self._leer(ruta)
            ini, fin = inicio_semana(s), fin_semana(s)
            estado = estado_semana(fin, self.hoy, self.gracia)

            obs_idx = {c: {o["semana_iso"]: o for o in series.get(c, [])} for c in (v["codigo"] for v in variables)}
            valores = {}
            for v in variables:
                f = fct1.get(v["codigo"], {}).get(s)
                o = obs_idx[v["codigo"]].get(s, {})
                if f is None:
                    continue
                valores[v["codigo"]] = {
                    "valor": f["valor"], "estado_dato": f["estado_dato"], "unidad": v["unidad"],
                    "fecha_dato": o.get("fecha_dato"), "fuente": v["fuente"], "origen_bronce": o.get("origen_bronce"),
                    "nivel_etiqueta": f["nivel_etiqueta"], "nivel_riesgo": f["nivel_riesgo"],
                    "valor_semana_anterior": f["valor_referencia"], "delta_abs": f["delta_abs"], "tendencia": f["tendencia"],
                }
            cortes_sem = [{
                "fecha_corte": c["fecha"].isoformat(), "archivo": c["archivo"],
                "sha256": _sha256_archivo(self.root / c["archivo"]),
                "estado_calidad": c["corte"].get("metadata_corte", {}).get("estado_calidad"),
                "generado_en": c["corte"].get("metadata_corte", {}).get("generado_en"),
            } for c in cortes_oro if semana_iso(c["fecha"]) == s]
            contenido_datos = {
                "variables": valores,
                "cortes_diarios": cortes_sem,
                "corte_referencia": cortes_sem[-1]["fecha_corte"] if cortes_sem else None,
                "departamentos": [d for d in corte_semanal.get("fct_depto_semana", []) if d["semana_iso"] == s],
                "niveles_municipio": corte_semanal.get("niveles_municipio", {}).get(s, {}),
                "evento": {"inicio_semana": inicio_ev,
                           "semana_evento": ((ini - inicio_semana(inicio_ev)).days // 7 + 1) if inicio_ev else None},
            }
            h = _sha256_obj(contenido_datos)

            if previo and previo.get("estado") == "cerrada":
                if previo.get("sha256_datos") != h and not any(
                        d["semana_iso"] == s and d["sha256_recalculo"] == h for d in man["discrepancias"]):
                    man["discrepancias"].append({"semana_iso": s, "detectada_en": ahora,
                                                 "sha256_congelado": previo.get("sha256_datos"), "sha256_recalculo": h,
                                                 "nota": "Recalculo distinto a la semana congelada; no se reescribe."})
                continue

            registro = {
                "semana_iso": s, "inicio": ini.isoformat(), "fin": fin.isoformat(),
                "estado": estado,
                "cierre_programado": (fin + timedelta(days=self.gracia + 1)).isoformat(),
                "cerrada_en": ahora if estado == "cerrada" else None,
                "creado_en": (previo or {}).get("creado_en", ahora), "actualizado_en": ahora,
                "id_ejecucion": meta.get("id_ejecucion"), "version_config": meta.get("version_config"),
                "hash_entradas": meta.get("hash_entradas"), "sha256_datos": h,
                "es_linea_base": s == man["linea_base"]["semana_iso"],
                **contenido_datos,
            }
            self._escribir(ruta, registro)
            indice[s] = {"semana_iso": s, "estado": estado, "archivo": str(ruta.relative_to(self.root)),
                         "sha256_datos": h, "cortes_diarios": len(cortes_sem),
                         "variables_con_dato": sum(1 for x in valores.values() if x["estado_dato"] != "sin_dato"),
                         "actualizado_en": ahora}

        man["semanas"] = [indice[k] for k in sorted(indice)]
        man["actualizado_en"] = ahora
        self._escribir(self.manifest_file, man)
        return man

    def resumen(self, man: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not man:
            return None
        return {
            "linea_base": man["linea_base"], "creado_en": man["creado_en"], "actualizado_en": man["actualizado_en"],
            "politica": man["politica"],
            "semanas": man["semanas"],
            "total_semanas": len(man["semanas"]),
            "cerradas": sum(1 for s in man["semanas"] if s["estado"] == "cerrada"),
            "discrepancias": len(man["discrepancias"]),
        }
