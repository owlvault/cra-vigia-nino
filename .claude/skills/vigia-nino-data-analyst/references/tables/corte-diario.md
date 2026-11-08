# Corte diario (zona oro)

## Referencia rápida

### Contexto
Cada día el pipeline (`ingesta/pipeline_corte.py`) consolida las fuentes, calcula 20 indicadores y el ICR de cada municipio, y publica un corte si pasa la compuerta de calidad. Hoy cada corte es **un solo JSON anidado**. En el destino PostgreSQL se normalizará en `dim_territorio`, `dim_indicador`, `fct_indicador_municipio`, `fct_icr_municipio`, `fct_amenaza_global` y `corte`, tablas que **aún no existen**.

### Filtro estándar
```python
corte["metadata_corte"]["estado_calidad"] == "PUBLICADO_VALIDO"
```

---

## Archivos

| Archivo | Contenido |
|---|---|
| `data/oro/corte_vigente.json` | Último corte publicado (lo lee el tablero) |
| `data/oro/corte_AAAA-MM-DD.json` | Histórico publicado; hay cortes del 2026-10-08, 10-09, 10-14 y 11-06 |
| `data/oro/rechazados/corte_AAAA-MM-DD.json` | Cortes que no pasaron RF-CAL-04 |
| `tablero/js/data.js` | Copia de `corte_vigente.json` envuelta en `window.VIGIA_DATA`; **no la analices**, es derivada |
| `tablero/vigia_corte_actualizado_arcgis.geojson` | Exportación por punto para ArcGIS; columnas en MAYÚSCULAS |

## Estructura de `corte_*.json`

### `metadata_corte` (1 por corte)
| Campo | Tipo | Notas |
|---|---|---|
| **fecha_corte** | `AAAA-MM-DD` | Llave del corte (UTC) |
| generado_en | ISO-8601 UTC | |
| **version_configuracion** | texto | Revísalo antes de comparar cortes |
| **estado_calidad** | `PUBLICADO_VALIDO` \| `RECHAZADO` | |
| motivos_rechazo | lista de texto | Solo en cortes posteriores a 2026-11-07 |
| total_municipios_evaluados | int | |
| icr_nacional_ponderado | float | Ponderado por población |
| poblacion_en_riesgo_critico | int | Naranja + roja |
| conteo_niveles_nacional | objeto | `roja`, `naranja`, `amarilla`, `sin_alerta`, `sin_dato` |

### `amenaza_global` (1 por corte; destino `oro.fct_amenaza_global`)
`indices_semanales{fecha_semana ('28OCT2026'), nino12/3/34/4 _sst y _anomalia}`, `indice_oni_trimestral{trimestre, ano, oni_anomalia, intensidad_evento}`, `indicador_a1_nino34`, `indicador_a2_probabilidad_muy_fuerte_pct`, `fecha_boletin_enso`, `estado_alerta_noaa`.

### `municipios[]` (1 por municipio; destino `oro.fct_icr_municipio`)
| Campo | Tipo | Notas |
|---|---|---|
| **divipola** | texto(5) | PK con `fecha_corte` |
| nombre, departamento, cod_depto, region, lat, lon, poblacion | | Atributos de dimensión repetidos en el hecho; `lat`/`lon` del DANE desde 2026-11-07 |
| fuente_poblacion | texto | «DANE PPED 2018-2042, proyección AAAA…» o «prototipo (sin proyección DANE)». Solo en cortes posteriores al 2026-11-07 |
| area_hidrografica, zona_hidrografica, subzona_hidrografica (+ `cod_*`) | texto / int / texto | Zonificación IDEAM (RF-TER-08); null si el cruce no la resolvió. Solo en cortes posteriores al 2026-11-07 |
| **icr** | float \| null | 1 decimal |
| **nivel_alerta** | texto | |
| nivel_por_regla | bool | Piso RF-ICR-06 |
| cobertura_datos_pct | float | % del peso de capas, **no** % de indicadores |
| subindices_capa | objeto | `amenaza_A`, `vulnerabilidad_H`, `servicio_S`, `respuesta_R` (null si la capa no tiene datos) |
| config_version | texto | |
| indicadores | objeto `{codigo: {...}}` | Ver abajo |

### `municipios[].indicadores[codigo]` (destino `oro.fct_indicador_municipio`)
| Campo | Notas |
|---|---|
| nombre, unidad | Repetidos (deberían vivir en `dim_indicador`) |
| **valor** | número, texto (H-2/H-3), 0/1 (R-n) o **null** = sin_dato |
| **fuente** | Texto legible (`"SSPD SUI"`); no es el `id_fuente` |
| **fecha_dato** | Fecha a la que se refiere el dato en la fuente |
| puntaje | 0-100 o null; null también en informativos (A-1, A-2, A-5, H-5, S-6) |
| frescura | `vigente` / `desactualizado` / null (desde 2026-11-07) |
| excluido_icr | Presente solo si la regla de vigencia máxima lo sacó del ICR |

### `departamentos[]`
`cod_depto`, `departamento`, `total_municipios`, `icr_medio_ponderado`, `poblacion_total`, `poblacion_naranja_roja`, `conteo_niveles`. Vienen ordenados por ICR descendente.

### `alertas_activas[]`
`id_alerta` (`ALT-AAAAMMDD-NNNN`), `divipola`, `nivel`, `icr`, `motivo`, `estado_revision` (`PENDIENTE_REVISION_CRA`), `prioridad` (`ALTA` si es roja). Se generan con **cada municipio en naranja o roja**, no solo con los cambios de nivel: la spec (FL-03) aún no está implementada así.

---

## Consultas de ejemplo

### Tabla plana municipio × indicador (equivalente a `fct_indicador_municipio`)
```python
import json, pandas as pd
c = json.load(open("data/oro/corte_vigente.json", encoding="utf-8"))
filas = [{"fecha_corte": c["metadata_corte"]["fecha_corte"], "divipola": m["divipola"],
          "municipio": m["nombre"], "codigo": cod, **ind}
         for m in c["municipios"] for cod, ind in m["indicadores"].items()]
df = pd.DataFrame(filas)              # 23 × 20 = 460 filas
df[df["valor"].isna()].groupby("codigo").size()   # sin_dato por indicador
```

### Serie de ICR de un municipio entre cortes (advierte el cambio de versión)
```python
import glob
for f in sorted(glob.glob("data/oro/corte_????-??-??.json")):
    c = json.load(open(f, encoding="utf-8")); md = c["metadata_corte"]
    m = next(x for x in c["municipios"] if x["divipola"] == "47001")
    print(md["fecha_corte"], md["version_configuracion"], m["icr"], m["nivel_alerta"])
```

### Destino SQL: municipios que subieron de nivel entre dos cortes (tablas planificadas)
```sql
WITH orden AS (
  SELECT 'sin_dato' AS nivel, 0 AS r UNION ALL SELECT 'sin_alerta', 1
  UNION ALL SELECT 'amarilla', 2 UNION ALL SELECT 'naranja', 3 UNION ALL SELECT 'roja', 4)
SELECT h.divipola, t.nombre, a.nivel_alerta AS antes, h.nivel_alerta AS ahora, h.icr
FROM oro.fct_icr_municipio h
JOIN oro.fct_icr_municipio a ON a.divipola = h.divipola AND a.fecha_corte = DATE '2026-11-05'
JOIN orden oh ON oh.nivel = h.nivel_alerta
JOIN orden oa ON oa.nivel = a.nivel_alerta
JOIN oro.dim_territorio t ON t.divipola = h.divipola
WHERE h.fecha_corte = DATE '2026-11-06' AND oh.r > oa.r
ORDER BY h.icr DESC;
```

---

## Trampas comunes

1. **Ruptura metodológica del 14-oct**: los cortes 10-08 y 10-09 dan un ICR nacional de 49,4, y el 10-14 da 39,3 con la misma versión. Cambió el 33 % de las celdas.
   - Mal: graficar la caída como mejora del riesgo.
   - Bien: separar las series o anotar la corrección.
2. **A-3, A-4 y H-1 antes del 2026-11-08 no son mediciones**: hasta la configuración `v1.1.0` salían de un catálogo estático (iguales en todos los cortes). Desde `v1.2.0`, A-3 y A-4 son mediciones del IDEAM y H-1 es `sin_dato`; H-2/H-3 pasaron a ENA 2010/2014 (cambian de categoría en varios municipios).
3. **S-2 es anual 2024** aunque el periodo esperado sea mensual. Siempre marca su frescura.
4. **H-2/H-3 son texto**: `df["valor"].astype(float)` falla. Separa los categóricos.
5. **Los cortes anteriores al 2026-11-07 no tienen `frescura`, `motivos_rechazo` ni el arreglo de `sin_dato`**: allí R-2/R-3/R-4 = 0 puede significar «sin registro».
