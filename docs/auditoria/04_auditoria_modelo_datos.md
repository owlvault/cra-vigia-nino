# Auditoría del modelo de datos — Vigía El Niño · Acueductos

**Fecha:** 2026-11-07 · **Corte auditado:** 2026-11-06 (semana 2026-W45)
**Alcance:** modelo documentado (`context-lake/docs/architecture.md`, specs), DDL (`transform/sql/comparativo_semanal.sql`), zonas `data/bronce`, `data/plata`, `data/oro`, `data/config`, `data/ops` y código que las produce (`ingesta/`).
**Límite:** se verificó consistencia interna y trazabilidad. No se contrastó contra las fuentes externas (IDEAM, SUI, NOAA, etc.).

## Lo que cuadra

- `divipola` de 5 dígitos, sin duplicados, prefijo coherente con `cod_depto`.
- Conteos por nivel, población en riesgo, ICR nacional (39,28 vs 39,3) y los 12 agregados departamentales se recalculan exactos.
- Las 10 alertas activas coinciden con los municipios rojos y naranja.
- Plata semanal: sin llaves duplicadas; `sin_dato` siempre es NULL, nunca 0 (765 filas).
- Bronce: ningún hash difiere de lo registrado en `capturas.json`.

## Hallazgos críticos

1. **A-3, A-4 y H-1 provienen de un catálogo estático, no de mediciones.** Son idénticos a `data/config/catalogo_municipios_ideam.json` en los 23 municipios, e idénticos entre los cortes 2026-10-14 y 2026-11-06, pero `fecha_dato` avanza con el corte. Viola la regla de oro 6.
2. **`sin_dato` se vuelve 0 por ausencia de registro (regla de oro 5).** R-2, R-3 y R-4 valen 0 en 21 municipios, pero `actos_administrativos_verificados.json` solo lista 2 (Uribia, Manaure) y declara explícitamente solo 4 sin decreto. No se distingue «verificado sin calamidad» de «sin información»; alimenta `respuesta_R` y la regla de piso.
3. **Cobertura publicada falsa.** `cobertura_datos_pct = 100` en los 23 municipios; la real por indicadores es 90–95 % (A-5 nulo en 23, H-5 nulo en 20). El código mide peso de capas con algún indicador, no indicadores con dato. Estado igualmente `PUBLICADO_VALIDO`.
4. **Ruptura metodológica sin versionar.** Entre los cortes 10-09 y 10-14 cambian 153 de 460 celdas y el ICR nacional pasa de 49,4 a 39,3, con la misma `version_configuracion` (`v1.0.0-20261008`). La línea base semanal (W41) es el corte antiguo, por lo que W41→W42 mezcla metodologías.
5. **Municipios y pesos quemados en código.** `ingesta/pipeline_corte.py` contiene `MUNICIPIOS_MAESTRO` (población, lat/lon) y `PESOS_CAPA`; los umbrales del ICR (40/60/75) también. Contradice CA-01 y las reglas de oro 3 y 4.
6. **Trazabilidad de Bronce rota.** `capturas.json`: 102 registros, 86 rutas únicas; 214 de 298 archivos en disco sin registro (210 `xm_historico`, 3 `ungrd_historico`, y el extracto SUI, fuente de H-4 y S-1…S-6, sin hash). Dos registros apuntan a directorios. Rutas absolutas de Windows (`G:\Mi unidad\...`).

## Hallazgos medios

| # | Hallazgo |
|---|---|
| 7 | `valor` con tipos mixtos (float, int, texto: H-2/H-3 guardan «Alto», «Medio»…). Indicadores sin puntaje: A-1, A-2, S-6 (informativos) y H-5 en 3 casos. |
| 8 | Desnormalización: nombre, unidad y fuente repetidos 460 veces; A-1/A-2 (nacionales) copiados a cada municipio. No existe `dim_indicador`. |
| 9 | Antigüedad sin marca: S-2 de 2024-12, H-2/H-3 de 2022-12, SUI de 2026-08 frente a corte 2026-11. El oro diario no tiene `estado_dato`. |
| 10 | A-1: `fecha_dato` 2026-09-30 vs semana 28-oct en `amenaza_global`. Nombrado «ONI / Niño 3.4» pero muestra 3,4 (anomalía semanal Niño 3.4); el ONI es 2,46. |
| 11 | Modelo documentado vs implementado: no existen `dim_territorio`, `dim_indicador`, `fct_icr_municipio`, `fct_amenaza_global`, `corte`, `config.alias_territorio`, `config.fuente_abastecedora`. El DDL solo cubre el comparativo semanal. `data/historico/indice_historico.json` no existe (real: `data/oro/semanal/historico/manifest.json`). Plata solo existe para la capa semanal. |
| 12 | Solo 23 municipios; región Pacífica con 1; sin Orinoquía, Amazonía ni Insular (RF-TER-06). |
| 13 | DDL: `fct_variable_semana` sin FK a `config.variable_semanal`; la vista `v_comparativo_semanal` une con la config más reciente, reetiquetando semanas pasadas pese a `version_config`. Falta el CHECK `sin_dato ⇔ NULL` que sí tiene plata. `fct_depto_semana.cod_depto` sin FK. |
| 14 | ICR por municipio/departamento solo para W41, W42 y W45 (faltan W43, W44). `semana_actual` = W45 pero `semana_vigente` = W42. |
| 15 | Plata: 510 de 765 `origen_bronce` con rutas Windows; 438 de 765 filas en `sin_dato` (57 %). |

## Hallazgos bajos

- Fuente de verdad ambigua: `tablero/js/data.js`, `tablero/semanal/data/comparativo_semanal.json`, `auditoria/` vs `tablero/auditoria/` (`auditoria.js` ya divergió) y `corte_vigente.json` vs `corte_2026-11-06.json` son copias.
- `FIRMS_MAP_KEY` ausente: una captura histórica falló y A-5 queda nulo en todo el corte.

## Seguimiento de correcciones (2026-11-07)

**Corrección a este informe — hallazgo 3.** `cobertura_datos_pct` como peso de capas disponibles es lo que define RF-ICR-04 («la cobertura de datos registrada es 70 %» cuando falta la capa H); no es un error de cálculo. El problema real era otro: el estado `PUBLICADO_VALIDO` estaba fijo en el código y nunca se aplicaba la compuerta RF-CAL-04.

| Hallazgo | Estado | Commit |
|---|---|---|
| 3 — compuerta de publicación | Corregido: RF-CAL-04 aplicada; un corte rechazado va a `data/oro/rechazados/` y no reemplaza el vigente | `f7cf2aa` |
| 9 — antigüedad sin marca | Corregido: cada indicador lleva `frescura` (RF-CAL-03) | `f7cf2aa` |
| 10 — fecha de A-1 | Corregido: A-1 usa la semana NOAA y A-2 la del boletín (antes, fechas literales) | `f7cf2aa` |
| 2 — `sin_dato` convertido en 0 | Corregido: sin valores por defecto en pipeline, conectores SUI/IDEAM/UNGRD ni auditor; R-n sin registro = `sin_dato` | `21ca7a2` |
| 5 — municipios y pesos en código | Corregido: `parametros_icr.json` y `territorio_municipios.json`; H-4 alineado a la spec | `03764b4` |
| 1 — A-3, A-4 y H-1 desde catálogo estático | Corregido: mediciones diarias automáticas + normales 1991-2020 + ENA 2010/2014 del IDEAM; H-1 `sin_dato` por RF-TER-05; retirado `catalogo_municipios_ideam.json` | `bbab546` |
| 6 — trazabilidad de Bronce rota | Corregido: `capturas.json` reconciliado con el 100 % de los archivos en `data/bronce/` (incluidos históricos XM/UNGRD y extracto SUI), sin directorios y con rutas relativas POSIX portables (`data/bronce/...`) | `2026-11-08` |
| 13 — restricciones DDL en `comparativo_semanal.sql` | Corregido: `'suma'` en CHECK de `agregacion`, FK a `config.variable_semanal (codigo, version_config)`, CHECK `sin_dato ⇔ NULL` en `fct_variable_semana` y unión por versión de configuración en `v_comparativo_semanal` | `2026-11-08` |
| 15 — rutas Windows e IDEAM simulado en modelo semanal | Corregido: rutas relativas en `origen_bronce` y precipitación semanal agregada desde mediciones reales de estaciones IDEAM (`crudo.diarios`) | `2026-11-08` |

Hallazgos nuevos durante la corrección:
- El pipeline rellenaba datos ausentes con valores inventados (continuidad 24 h, IRCA 12, categoría ENA «Medio», PEC = 1…). Hoy no se activaban con los datos actuales, pero lo habrían hecho ante cualquier faltante. Corregido en `21ca7a2`.
- ~~`ingesta/tests/test_conectores.py` y `test_auditoria.py` escriben capturas reales en el Bronce del repositorio.~~ **Corregido (2026-11-08):** aislados con `tmp_path` y pruebas tautológicas de `test_indice_riesgo.py` reemplazadas por llamadas reales a `PipelineCorte`.
- ~~Los conectores SUI e IDEAM conservan sus propias funciones de normalización.~~ **Corregido (2026-11-08):** retiradas las funciones de normalización heredadas en `conector_sui.py` y `conector_sivicap.py` (regla de oro 3).
- Sincronizados `auditoria/js/auditoria.js` y `tablero/auditoria/js/auditoria.js`, automatizada la regeneración del dictamen de auditoría al publicar un corte completo y habilitada la carga de certificados intermedios del almacén CA del sistema operativo para los servicios GIS del IDEAM.

Pendientes y decisiones:
- **Decisión CRA:** regla de vigencia máxima (`multiplicador_sin_dato`) implementada pero desactivada. Con N = 3 y los periodos de la spec, quedan fuera H-4, S-2 y la capa R completa, y el ICR nacional sube de 39,3 a 51,0.
- ~~**Hallazgo 1**~~ (A-3, A-4 y H-1 desde un catálogo estático): **corregido el 2026-11-08**. A-3 y A-4 salen de la red automática de precipitación del IDEAM y de las normales 1991-2020; H-2 y H-3 del ENA (2010 y 2014) por subzona; H-1 queda `sin_dato` por RF-TER-05 hasta resolver Q-TER-03. Se retiró `catalogo_municipios_ideam.json`. Con las mediciones reales el ICR nacional baja de 41,8 a 34,6 y los municipios en rojo pasan de 4 a 1: el catálogo inflaba el riesgo (p. ej. «48 días sin lluvia» en Uribia, donde llovió 19 mm el 7 de noviembre).
- **Hallazgos estructurales de evolución futura (7–8, 11–12, 14):** corresponden al paso de archivos JSON a base de datos relacional PostgreSQL (`dim_territorio`, `dim_indicador`, `fct_indicador_municipio`) y a la ampliación de cobertura más allá de los 23 municipios priorizados.

## Prioridades recomendadas

1. Corregir 1–3 antes de otra publicación: cargar mediciones IDEAM reales; estados `sin_dato` / `no_aplica` / `verificado_cero`; cobertura por indicadores.
2. Versionar la ruptura del 14-oct y marcar los cortes anteriores como no comparables.
3. Mover matriz de municipios, pesos y umbrales a `config`; reconciliar `capturas.json` con el disco (incluido el extracto SUI).
4. Cerrar la brecha de diseño: DDL de `oro.dim_territorio`, `dim_indicador`, `fct_indicador_municipio`, o actualizar `architecture.md`.
