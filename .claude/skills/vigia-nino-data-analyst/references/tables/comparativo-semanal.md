# Comparativo semanal (V-08): plata y oro semanal

## Referencia rápida

### Contexto
Compara semana a semana la amenaza oceánica (NOAA) y su efecto en Colombia (embalses, lluvia, focos de calor, ICR) contra la semana anterior, contra 4 semanas atrás y contra eventos análogos. Lo genera `ingesta/semanal/modelo_semanal.py`. Es el **único dominio con DDL PostgreSQL escrito**: `transform/sql/comparativo_semanal.sql`.

### Desambiguación
- **`semana_actual`**: última semana con datos (puede estar abierta).
- **`semana_vigente`**: última semana cerrada y publicada como comparativo.
- **`semana_evento`**: número de semanas desde el inicio del evento (negativo antes del inicio).

### Filtros estándar
```sql
WHERE estado_dato <> 'sin_dato'        -- hay valor
-- 'arrastre' = repetición del último valor publicado (ONI trimestral): no es dato nuevo
```

---

## Tablas

### plata.obs_variable_semana
**JSON hoy**: `data/plata/semanal/obs_variable_semana.json` (lista plana, 765 filas = 17 variables × 45 semanas)
**PK**: `(semana_iso, codigo, ambito)`

| Columna | Tipo | Notas |
|---|---|---|
| **semana_iso** | char(8) | FK a `oro.dim_semana` |
| **codigo** | varchar(40) | Variable semanal |
| ambito | varchar(20) | `nacional` (759) o `muestra` (6; con `tamano_muestra` municipios) |
| **valor** | numeric | NULL ⇔ `estado_dato = 'sin_dato'` (CHECK) |
| **estado_dato** | varchar(12) | `dato` (293), `arrastre` (34), `sin_dato` (438) |
| fecha_dato | date | |
| n_obs | int | Observaciones agregadas |
| fuente | varchar(120) | |
| origen_bronce | text | Ruta del crudo, en formato Windows |

### oro.dim_semana
`semana_iso` (PK), `anio_iso`, `numero`, `inicio` (lunes), `fin` (domingo). El JSON agrega `semana_evento` y `cerrada`.

### oro.fct_variable_semana
**JSON hoy**: `corte_semanal_vigente.json → fct_variable_semana[desplazamiento][codigo][semana_iso]`, con `desplazamiento` ∈ `"1"`, `"4"`.
**PK SQL**: `(semana_iso, codigo)`. El DDL **no** incluye el desplazamiento: solo modela la comparación con la semana anterior.

| Columna | Notas |
|---|---|
| valor, estado_dato | Como en plata |
| semana_referencia, valor_referencia | Semana con la que se compara |
| delta_abs, delta_pct | NULL si falta cualquiera de los dos valores |
| **tendencia** | `empeora` / `mejora` / `estable` / `sin_dato` |
| nivel_etiqueta, nivel_riesgo | `sin` / `amarilla` / `naranja` / `roja` |
| version_config | |

### oro.corte_semanal
`semana_iso` (PK), `generado_en`, `version_config`, `hash_entradas`, `estado` (`abierta` / `cerrada` / `rechazada`), `inicio_evento`, `id_ejecucion`.

### oro.fct_depto_semana
**PK**: `(semana_iso, cod_depto)`. Toma el último corte diario de la semana (`fecha_corte`). Solo hay semanas con corte diario: W41, W42 y W45 (no hay W43 ni W44).

### oro.fct_analogo_semana / config.evento_analogo
Trayectoria de cada análogo (`1997-98`, `2015-16`, `2023-24`) por `semana_evento`. En el JSON: `analogos[].series[codigo]` y `analogos[].pico`.

### config.variable_semanal
Catálogo SCD con PK `(codigo, vigente_desde)`: `grupo`, `unidad`, `agregacion`, `direccion`, `tolerancia_estable`, `en_analogos`, `niveles` (jsonb `[{desde, hasta, etiqueta, riesgo}]`).

### Vista oro.v_comparativo_semanal
Une `fct_variable_semana` + `dim_semana` + la **última** versión de `config.variable_semanal`.

---

## Consultas de ejemplo

### Tablero de la semana vigente frente a la anterior
```sql
SELECT codigo, nombre, unidad, valor, valor_referencia, delta_abs, delta_pct, tendencia, nivel_riesgo, fecha_dato
FROM oro.v_comparativo_semanal
WHERE semana_iso = (SELECT max(semana_iso) FROM oro.corte_semanal WHERE estado = 'cerrada')
ORDER BY grupo, codigo;
```

### Variables que empeoran durante 3 semanas seguidas
```sql
WITH t AS (
  SELECT codigo, semana_iso, tendencia,
         SUM(CASE WHEN tendencia = 'empeora' THEN 0 ELSE 1 END)
           OVER (PARTITION BY codigo ORDER BY semana_iso) AS grupo_racha
  FROM oro.fct_variable_semana)
SELECT codigo, MIN(semana_iso) AS desde, MAX(semana_iso) AS hasta, COUNT(*) AS semanas
FROM t WHERE tendencia = 'empeora'
GROUP BY codigo, grupo_racha HAVING COUNT(*) >= 3
ORDER BY semanas DESC;
```

### Evento vigente frente a análogo, alineados por semana del evento (Python sobre el JSON actual)
```python
import json
s = json.load(open("data/oro/semanal/corte_semanal_vigente.json", encoding="utf-8"))
actual = s["evento_vigente"]["series"]["NINO34_SSTA"]
analogo = next(a for a in s["analogos"] if a["id_evento"] == "2015-16")["series"]["NINO34_SSTA"]
# Ambas son listas indexadas por semana del evento; compara posición a posición
```

---

## Trampas comunes

1. **La vista usa la config más reciente**: si cambian los `niveles` de una variable, las semanas pasadas se reetiquetan aunque `version_config` diga otra cosa. Para un análisis histórico, une `config.variable_semanal` por `vigente_desde <= generado_en`.
2. **`agregacion` no coincide entre JSON y DDL**: el JSON usa `'suma'` (incendios, focos, desabastecimiento) y el CHECK del DDL solo admite `'suma_ultima_captura'`. Una carga directa fallaría.
3. **57 % de las filas de plata son `sin_dato`**: muchas variables solo existen en semanas recientes. Siempre reporta `n` con dato.
4. **`fct_variable_semana` en SQL** no tiene CHECK `sin_dato ⇔ NULL`; en plata sí.
5. **Desplazamiento 4 semanas**: solo existe en el JSON (`fct_variable_semana["4"]`), no en el DDL.
