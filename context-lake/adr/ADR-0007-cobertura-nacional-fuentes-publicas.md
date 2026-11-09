---
id: adr-0007
tipo: adr
proyecto: vigia-nino-acueductos
estado: propuesta
actualizado: 2026-11-09
fuentes: [DANE DIVIPOLA gdxc-w37w, IDEAM Entidades_Territoriales e Indicadores_Hidricos, CHIRPS v3.0 README, datos.gov.co nxt2-39c3 y 2343-nuqp]
---

# ADR-0007 — Cobertura nacional (1.122 municipios) con fuentes públicas: Fase 0

## Contexto

Hasta v1.2.0 el corte evaluaba 23 municipios (2 % de la DIVIPOLA). El código ya era genérico (todo territorio sale de `territorio_municipios.json`), pero tres prácticas no escalaban:

- Consultas por municipio en cada corrida: 2 consultas ENA por municipio por día y un polígono por municipio. Con 1.122 municipios son miles de solicitudes y se incumple RF-ING-07.
- Lluvia solo de estaciones: la red automática del IDEAM tiene estación dentro de 366 municipios; con IDW de vecinas a ≤ 50 km llega a ~1.000, y 107 municipios no tienen ninguna estación útil.
- Las capas S y R dependen de extractos manuales (SUI) y verificaciones manuales (actos administrativos) que solo existen para el piloto.

## Decisión (propuesta)

1. **Territorio = DIVIPOLA completa** (1.103 municipios, 18 áreas no municipalizadas, 1 isla). Se regenera con `ingesta/territorio/territorio_nacional.py`.
2. **Capas geográficas descargadas en bloque** (`ingesta/territorio/geometrias_ideam.py` → `data/config/geo/` con manifiesto y SHA-256). Todo cruce espacial es local. Si la cabecera cae en un borde de la capa generalizada (~200 m), se consulta una vez la geometría exacta del servicio.
3. **H-2/H-3 son estáticos**: se calculan una vez por edición del ENA (`data/config/ena_municipios.json`), no en cada corrida.
4. **CHIRPS v3.0 (FTE-CHIRPS): referencia y control de calidad, no respaldo del ICR.** Era la alternativa ya prevista en Q-TER-02. La validación del 2026-11-09 (`data/ops/validacion_chirps_2026-10-31.json`, 1.006 municipios con ambas fuentes) dio:
   - **A-4:** CHIRPS diario borra las rachas secas: 0 de las 47 rachas de 10 o más días que detecta el IDEAM.
   - **A-3:** concordancia baja (42 % en el mismo tramo y +32 pp de sesgo, aun con control de calidad).

   Por eso `parametros_chirps.json` → `usar_en_icr` = `false` para A-3 y A-4. CHIRPS se calcula y se guarda como referencia, y sirve para el **control de calidad de las estaciones IDEAM** (`parametros_ideam.json` → `control_calidad_estaciones`). Ese control excluye las estaciones cuyo total en 60 días es menor al 10 % de CHIRPS cuando CHIRPS marca 100 mm o más: 56 de 513, entre ellas 11 con 0 mm en ~70 días, como Aeropuerto Condoto.
5. **Calidad del ICR declarada**: `calidad_icr` = `completo` (las 4 capas), `parcial` (≥ 60 % del peso) o `sin_dato`. El corte publica el conteo nacional por calidad y la cobertura por indicador y método.
6. **H-5 solo aplica** a municipios abastecidos por un embalse del catálogo XM (`aplica: false` en el resto). No cuenta como faltante.
7. **IRCA**: último año disponible por municipio (antes el año 2024 estaba fijo en el código).
8. **FIRMS**: conteo por polígono municipal con el producto NRT. Con respuesta válida de la API, 0 es un dato observado. Sin clave, sigue siendo `null`.

## Consecuencias

- El ICR es calculable en casi todos los municipios con A + H (60 % del peso), pero **sin SUI la capa S solo tiene IRCA**. Un ICR `parcial` no es comparable con uno `completo`: el tablero y cualquier ranking deben filtrar o marcar por `calidad_icr`.
- La red automática del IDEAM mide 35-50 % menos que CHIRPS (preliminar y final) y que la normal climatológica. **El A-3 del IDEAM podría estar sesgado hacia sequía.** Requiere concepto hidrológico o del IDEAM (Q-ADR7-03) antes de cambiar la fuente primaria. CHIRPS, además, llega con 3 a 10 días de rezago.
- La validación CHIRPS frente a IDEAM (`ingesta/clima/validacion_chirps.py` → `data/ops/validacion_chirps_<fecha>.json`) es la evidencia para aceptar o no esta ADR.
- Nuevas dependencias: `numpy` y `rasterio` (open source, ADR-0005).
- Bronce crece con el territorio. Recomendación: sacar `data/bronce/` de git cuando se migre a PostgreSQL (ADR-0003).

## Pendiente para aceptar

- Q-ADR7-03: ¿La red automática del IDEAM (sensor 0240, 10 min) subregistra la lluvia frente a la normal de estaciones convencionales? Si es así, A-3 debe recalcularse (normal de la misma red o CHIRPS de punta a punta).

- Q-ADR7-01: ¿La CRA acepta un respaldo satelital para indicadores de la capa A? (RN-ING-01: organismo científico público.)
- Q-ADR7-02: ¿El canal ciudadano debe excluir los municipios con `calidad_icr = parcial`?
- Fase 1 (convenios SSPD–SUI, INS, MinVivienda, UNGRD) para completar las capas S y R.
