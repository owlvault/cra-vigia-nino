---
name: vigia-nino-data-analyst
description: "Contexto de datos de Vigía El Niño · Acueductos (CRA, Colombia). Explica el modelo medallón bronce/plata/oro (hoy en archivos JSON, destino PostgreSQL 16), las entidades territoriales con llave DIVIPOLA, los 20 indicadores A/H/S/R, el Índice Compuesto de Riesgo (ICR), los niveles de alerta y el comparativo semanal. Úsalo al analizar datos de Vigía para: (1) riesgo por municipio o departamento y niveles de alerta, (2) evolución semanal del evento El Niño y análogos históricos, (3) calidad, frescura y trazabilidad de los datos de fuente, o cualquier pregunta que requiera contexto específico de este proyecto. Sirve a dos canales que coexisten: el interno (analistas CRA, contenido técnico completo) y el ciudadano (lenguaje claro y lista blanca de references/ciudadania.md)."
---

# Vigía El Niño · Acueductos — Análisis de datos

Sistema interno de la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA) que mide el impacto de El Niño 2026-27 sobre el servicio de acueducto, desde la Nación hasta cada municipio. Uso regulatorio: **toda cifra que se reporte debe llevar fuente y fecha del dato**.

## Dos canales: identifica primero a quién respondes

Coexisten dos canales sobre el **mismo corte publicado** (`context-lake/specs/canal-ciudadano.md`, ADR-0006). No mezcles sus reglas:

| | Canal interno | Canal ciudadano |
|---|---|---|
| Quién | Comisionados, analistas y administradores de datos de la CRA | Cualquier persona |
| Qué puedes usar | Todo: ICR, subíndices, los 20 indicadores, cobertura, alertas, configuración, comparativo semanal | Solo la lista blanca de `references/ciudadania.md` |
| Vocabulario | Técnico: ICR, «alerta naranja», códigos A-n…R-n | Lenguaje claro: «nivel de riesgo Alto», sin códigos |
| Reglas comunes | Fuente y fecha en cada cifra; `sin_dato` nunca es 0; advierte frescura y cambios de versión | Las mismas |

**Cómo decidir:** si quien pregunta usa términos internos (ICR, capas, códigos de indicador, corte, frescura) o se identifica como de la CRA, responde en modo interno. Si pregunta como habitante («¿hay agua en mi municipio?», «¿es segura el agua?»), responde en modo ciudadano. Si no está claro, usa el modo ciudadano: es el más restrictivo.

Para el **modo ciudadano**, lee antes **`references/ciudadania.md`**. Lo esencial:
- Habla en lenguaje claro. Da fuente y fecha en cada cifra. «Sin información» nunca es «no».
- El nivel de Vigía es un **nivel de riesgo analítico de la CRA**, no una alerta oficial del IDEAM ni de gestión del riesgo.
- Para decisiones prácticas, remite al prestador, la alcaldía, la UNGRD o el IDEAM.
- Agrega por **departamento**. Para hablar del agua, usa la **zonificación hidrográfica del IDEAM** (`area_hidrografica`, `zona_hidrografica`, `subzona_hidrografica`, ya presentes en cada municipio).
- Marco de la decisión: `context-lake/adr/ADR-0006-canal-ciudadano.md`.
- Nivel en lenguaje claro: Bajo, Medio, Alto, Muy alto o Sin información (RF-CIU-04). Nunca la palabra «alerta».
- Las secciones técnicas de abajo son para calcular bien en ambos modos; en el modo ciudadano no las copies tal cual.

## Dónde viven los datos (léelo primero)

| Estado | Almacenamiento | Cómo se consulta |
|---|---|---|
| **Hoy (v1)** | Archivos JSON en `data/<zona>/` del repositorio `cra-vigia-nino` | Python (`json`) o `jq` |
| **Destino** | PostgreSQL 16 + PostGIS, esquemas `bronce`, `plata`, `oro`, `config`, `ops` | SQL |

Solo el **comparativo semanal** tiene DDL escrito (`transform/sql/comparativo_semanal.sql`). Las tablas del **corte diario** (`oro.dim_territorio`, `oro.fct_indicador_municipio`, `oro.fct_icr_municipio`…) están descritas en `context-lake/docs/architecture.md` pero **todavía no existen**: hoy están anidadas dentro de `data/oro/corte_*.json`. Si escribes SQL para ellas, dilo explícitamente.

## Dialecto SQL: PostgreSQL 16

- **JSON**: `col->>'campo'` devuelve texto; `col->'campo'` devuelve JSON (`niveles`, `conteo_niveles` y `pasos` son `jsonb`).
- **Fechas**: todo `timestamptz` se guarda en UTC. Para mostrar, usa `AT TIME ZONE 'America/Bogota'`.
- **Semanas**: ISO-8601 de lunes a domingo, texto `char(8)` como `'2026-W45'`. Ordena por `semana_iso` (orden lexicográfico = cronológico) o une con `oro.dim_semana`.
- **Nulos**: `valor IS NULL` significa `sin_dato`. Nunca uses `COALESCE(valor, 0)`.
- **Booleanos**: tipo nativo `boolean`, con `TRUE`/`FALSE`.

---

## Desambiguación de entidades

**«Municipio» o «territorio» puede significar:**
- **Municipio / ANM**: unidad DIVIPOLA de 5 dígitos. Incluye Bogotá D.C. (`11001`) y las áreas no municipalizadas, que se tratan como municipio. Es la unidad del ICR. (`config/territorio_municipios.json → municipios[]`, llave `divipola`)
- **Departamento**: los 2 primeros dígitos del DIVIPOLA (`cod_depto`). Bogotá es departamento `11`. (`corte → departamentos[]`, llave `cod_depto`)
- **Región**: el campo `region` (Caribe, Andina, Pacífica…) son regiones naturales heredadas del prototipo, **sin validar** (Q-TER-01). No agregues por él. Usa departamento (DANE) o área hidrográfica (IDEAM); ver `references/ciudadania.md`.
- **APS**: Área de Prestación de Servicio, un prestador dentro de un municipio. Definida en la spec, **no implementada** en los datos actuales.

**«Indicador» puede significar:**
- **Indicador del ICR**: los 20 códigos `A-1…R-4` de `specs/indicadores.md`, por municipio y corte diario.
- **Variable semanal**: códigos en MAYÚSCULAS (`NINO34_SSTA`, `EMBALSES_NAL_PCT`, `ICR_NACIONAL`…), con ámbito nacional, del comparativo semanal (V-08).

No los mezcles: `A-1` (corte diario) y `NINO34_SSTA` (semanal) salen del mismo boletín NOAA, pero viven en modelos distintos.

**«Corte» puede significar:**
- **Corte diario**: `data/oro/corte_AAAA-MM-DD.json`, con los 20 indicadores e ICR por municipio.
- **Corte semanal**: `data/oro/semanal/corte_semanal_*.json`, con series semanales, comparativos y análogos.

**Relaciones:**
- Departamento → Municipio: 1:N (`cod_depto = LEFT(divipola, 2)`)
- Corte diario → Municipio → Indicador: 1:N:20 (hoy anidado; en destino, `fct_indicador_municipio` con PK `(fecha_corte, divipola, codigo)`)
- Semana → Variable: 1:N (`oro.fct_variable_semana`, PK `(semana_iso, codigo)`)

---

## Terminología del negocio

| Término | Definición | Notas |
|---|---|---|
| DIVIPOLA | Código DANE: 2 dígitos de departamento + 3 de municipio | **Siempre texto de 5 caracteres** con cero inicial (`"05001"`). Nunca entero. |
| ICR | Índice Compuesto de Riesgo por municipio, 0-100 | Promedio ponderado de 4 capas; ver `references/metrics.md` |
| Capa | A amenaza, H oferta hídrica, S servicio, R respuesta | Pesos 30/30/25/15 en `data/config/parametros_icr.json` |
| Nivel de alerta | `sin_alerta` < 40 ≤ `amarilla` < 60 ≤ `naranja` < 75 ≤ `roja` | Más `sin_dato` cuando no hay ICR |
| `nivel_por_regla` | Nivel subido a naranja por R-3 o R-4 activo (RF-ICR-06) | El ICR puede ser < 60 y el nivel ser naranja |
| `sin_dato` | No hay valor de fuente | **Nunca equivale a 0** (regla de oro 5) |
| Frescura | `vigente` / `desactualizado` según la antigüedad frente al periodo esperado × 1,5 | Campo `frescura` por indicador, desde el corte posterior a 2026-11-07 |
| Arrastre | Valor no semanal (p. ej. ONI trimestral) repetido en semanas siguientes | `estado_dato = 'arrastre'`; no cuenta como dato nuevo |
| Semana del evento | Semanas desde el inicio del evento (Niño 3.4 ≥ 0,5 °C durante 4 semanas seguidas) | Alinea 2026-27 con análogos 1997-98, 2015-16 y 2023-24 |
| ONI / Niño 3.4 | ONI = media móvil trimestral de Niño 3.4. Niño 3.4 = anomalía semanal de TSM | El indicador A-1 se llama «ONI / Niño 3.4», pero **guarda la anomalía semanal Niño 3.4** |
| IRCA | Índice de riesgo de calidad del agua, 0-100 (Res. 2115/2007) | S-2; hoy es dato anual 2024 |
| IANC | Índice de agua no contabilizada (%) | S-4 |
| PEC | Plan de Emergencia y Contingencia del prestador | R-1: 1 = todos lo tienen (riesgo 0); 0 = falta alguno (riesgo 100) |

---

## Filtros estándar

Aplícalos siempre, salvo que te pidan lo contrario:

```python
# Solo cortes diarios publicados (los rechazados viven aparte, en data/oro/rechazados/)
corte["metadata_corte"]["estado_calidad"] == "PUBLICADO_VALIDO"

# Solo valores con dato: excluye None; NUNCA los conviertas en 0
[v for v in valores if v is not None]

# Semanal: separa dato real de arrastre
fila["estado_dato"] == "dato"          # observación nueva de esa semana
fila["estado_dato"] in ("dato", "arrastre")   # último valor conocido
```

```sql
-- Destino PostgreSQL (comparativo semanal)
WHERE f.estado_dato <> 'sin_dato'      -- equivale a valor IS NOT NULL (hay CHECK en plata)
  AND c.estado = 'cerrada'             -- oro.corte_semanal: semanas cerradas para comparar
```

**Cuándo omitir el filtro:**
- Para auditar la calidad, incluye los cortes de `data/oro/rechazados/` y los `sin_dato`, y repórtalos como tales.
- Para la cobertura de datos, cuenta los `sin_dato` explícitamente: son el hallazgo, no ruido.

---

## Métricas clave (resumen; detalle en `references/metrics.md`)

| Métrica | Fuente | Grano |
|---|---|---|
| ICR municipal | `corte.municipios[].icr` | municipio × corte diario |
| ICR medio departamental / nacional | `departamentos[].icr_medio_ponderado`, `metadata_corte.icr_nacional_ponderado` | ponderado por `poblacion` |
| Municipios por nivel | `metadata_corte.conteo_niveles_nacional`, `departamentos[].conteo_niveles` | corte |
| Población en riesgo crítico | `metadata_corte.poblacion_en_riesgo_critico` | Σ población en naranja + roja |
| Cobertura de datos | `municipios[].cobertura_datos_pct` | % del **peso de capas** con dato, no % de indicadores |
| Variación semanal | `fct_variable_semana[desplazamiento][codigo][semana]` | `delta_abs`, `delta_pct`, `tendencia` |

---

## Frescura de los datos

| Fuente | Indicadores | Periodo esperado | Estado real (nov-2026) |
|---|---|---|---|
| NOAA CPC | A-1, NINO*_SSTA, ONI | semanal / trimestral | Al día (semana del 28-oct) |
| IDEAM (red automática + normales 1991-2020) | A-3, A-4 | diario | Mediciones reales desde el 2026-11-08 (día anterior al corte). Antes de esa fecha, los cortes usaban un catálogo estático |
| IDEAM | H-1 | diario | `sin_dato` en todos: falta el vínculo municipio–fuente abastecedora (RF-TER-05, Q-TER-03) |
| IDEAM ENA | H-2 (ENA 2010), H-3 (ENA 2014) | estático | Categoría de la subzona de la cabecera; H-3 puede valer «Crítico» |
| SUI (SSPD) | H-4, S-1, S-3…S-6, R-1 | mensual / anual | Extracto del periodo 2026-08 |
| SIVICAP (INS) | S-2 | mensual | Dato **anual 2024** |
| UNGRD / MinVivienda | R-2, R-3, R-4 | diario | Registro manual verificado el 2026-10-14 |
| XM | H-5, embalses | diario | Al día; solo 3 municipios tienen embalse |
| NASA FIRMS | A-5, focos de calor | diario | `sin_dato` si falta `FIRMS_MAP_KEY` |

Para revisar la frescura de un corte, recorre `municipios[].indicadores[codigo].fecha_dato` y `.frescura`. En el semanal, usa `fuentes[]` (`ultima_fecha_dato`, `frescura_horas`).

---

## Navegación de la base de conocimiento

| Dominio | Archivo | Úsalo para |
|---|---|---|
| Ciudadanía | `references/ciudadania.md` | **Léelo primero**: lenguaje, indicadores recomendados y regionalización |
| Entidades | `references/entities.md` | Territorio, indicadores, cortes, fuentes y sus llaves |
| Métricas | `references/metrics.md` | ICR, normalización, agregados y fórmulas exactas |
| Corte diario | `references/tables/corte-diario.md` | Estructura de `corte_*.json` y tablas oro de destino |
| Comparativo semanal | `references/tables/comparativo-semanal.md` | Plata/oro semanal, DDL real y análogos |
| Bronce, config y ops | `references/tables/bronce-config-ops.md` | Trazabilidad, capturas, parámetros y auditoría |

---

## Patrones de consulta comunes

### Municipios en alerta naranja o roja del último corte publicado
```python
import json
corte = json.load(open("data/oro/corte_vigente.json", encoding="utf-8"))
assert corte["metadata_corte"]["estado_calidad"] == "PUBLICADO_VALIDO"
criticos = sorted(
    (m for m in corte["municipios"] if m["nivel_alerta"] in ("naranja", "roja")),
    key=lambda m: m["icr"], reverse=True)
for m in criticos:
    print(m["divipola"], m["nombre"], m["departamento"], m["icr"], m["nivel_alerta"],
          "(por regla)" if m["nivel_por_regla"] else "")
```

### Un indicador con su fuente y fecha (requisito regulatorio)
```python
ind = next(m for m in corte["municipios"] if m["divipola"] == "44847")["indicadores"]["S-1"]
print(f'{ind["valor"]} {ind["unidad"]} — {ind["fuente"]}, dato al {ind["fecha_dato"]}')
```

### Evolución semanal de una variable (destino SQL)
```sql
SELECT f.semana_iso, d.inicio, f.valor, f.estado_dato, f.delta_abs, f.tendencia, f.nivel_riesgo
FROM oro.fct_variable_semana f
JOIN oro.dim_semana d USING (semana_iso)
WHERE f.codigo = 'EMBALSES_NAL_PCT'
ORDER BY f.semana_iso;
```

---

## Solución de problemas

### Errores comunes
- **Tratar `null` como 0**: baja falsamente el riesgo o la media → filtra los `None` y reporta cuántos faltan.
- **DIVIPOLA como entero**: `5001` en vez de `"05001"` rompe los cruces de Antioquia y otros → usa siempre `str.zfill(5)`.
- **Promediar ICR sin ponderar**: los agregados oficiales ponderan por población → usa `Σ(icr × poblacion) / Σ poblacion`.
- **Leer la cobertura como % de indicadores**: `cobertura_datos_pct = 100` puede coexistir con A-5 y H-5 vacíos → para el % de indicadores con dato, cuenta `valor is not None` sobre 20.
- **Comparar cortes de versiones distintas**: los cortes del 08 y 09-oct se calcularon antes de la corrección del 14-oct (153 de 460 celdas cambiaron con la misma `version_configuracion`). La v1.1.0 cambió los quiebres de H-4 → revisa `version_configuracion` antes de comparar ICR entre fechas y advierte la ruptura.
- **Mezclar cortes antes y después del 2026-11-08 para A-3, A-4, H-1, H-2 o H-3**: hasta `v1.1.0` eran constantes de un catálogo; desde `v1.2.0` son mediciones del IDEAM y H-1 es `sin_dato`. El ICR nacional cae de 41,8 a 34,6 por ese cambio, no por una mejora del riesgo → no compares ni grafiques a través de esa ruptura sin advertirla.
- **A-4 con `nota`**: si el indicador trae «Al menos N días», el conteo se detuvo en un día sin dato; es una cota inferior.
- **Confundir `semana_actual` con `semana_vigente`** en el corte semanal: la primera es la última semana con datos; la segunda, la última semana cerrada y publicada.
- **Ver R-2, R-3 o R-4 = 0 como «sin emergencia»**: solo es 0 si la ausencia está verificada; si no hay registro, el valor es `null`.

### Rutas
- `ruta_archivo_bronce` y `origen_bronce` traen rutas absolutas de Windows (`G:\Mi unidad\...\data\bronce\...`) → toma lo que va después de `data\bronce\`, cambia `\` por `/` y resuelve desde la raíz del repo.

### Rendimiento
- `corte_semanal_vigente.json` pesa ~660 KB y trae todo. Para una sola variable, lee `data/plata/semanal/obs_variable_semana.json` (lista plana).
- No recorras `data/bronce/` para análisis: es la evidencia cruda. Usa oro y recurre a bronce solo para trazar un valor.
