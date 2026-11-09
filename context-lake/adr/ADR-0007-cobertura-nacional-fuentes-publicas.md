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
4. **CHIRPS v3.0 como respaldo de A-3 y A-4** (nueva fuente FTE-CHIRPS, Climate Hazards Center UCSB con USGS). Precedencia: **estaciones IDEAM primero**. CHIRPS solo llena el vacío, con la normal CHIRPS 1991-2020 del mismo píxel como línea base. Cada indicador declara `fuente` y `metodo` (`estaciones_ideam`, `satelite_chirps_prelim`, `satelite_chirps_final`).
5. **Calidad del ICR declarada**: `calidad_icr` = `completo` (las 4 capas), `parcial` (≥ 60 % del peso) o `sin_dato`. El corte publica el conteo nacional por calidad y la cobertura por indicador y método.
6. **H-5 solo aplica** a municipios abastecidos por un embalse del catálogo XM (`aplica: false` en el resto). No cuenta como faltante.
7. **IRCA**: último año disponible por municipio (antes el año 2024 estaba fijo en el código).
8. **FIRMS**: conteo por polígono municipal con el producto NRT. Con respuesta válida de la API, 0 es un dato observado. Sin clave, sigue siendo `null`.

## Consecuencias

- El ICR es calculable en casi todos los municipios con A + H (60 % del peso), pero **sin SUI la capa S solo tiene IRCA**. Un ICR `parcial` no es comparable con uno `completo`: el tablero y cualquier ranking deben filtrar o marcar por `calidad_icr`.
- CHIRPS tiene **rezago de 3 a 10 días** (preliminar) y su reparto diario es aproximado (README CHIRPS v3). A-4 satelital es menos confiable que A-3 satelital. La frescura lo declara: el valor se muestra `desactualizado`.
- La validación CHIRPS vs IDEAM (`ingesta/clima/validacion_chirps.py` → `data/ops/validacion_chirps_<fecha>.json`) es la evidencia para aceptar o no esta ADR.
- Nuevas dependencias: `numpy` y `rasterio` (open source, ADR-0005).
- Bronce crece con el territorio. Recomendación: sacar `data/bronce/` de git cuando se migre a PostgreSQL (ADR-0003).

## Pendiente para aceptar

- Q-ADR7-01: ¿La CRA acepta un respaldo satelital para indicadores de la capa A? (RN-ING-01: organismo científico público.)
- Q-ADR7-02: ¿El canal ciudadano debe excluir los municipios con `calidad_icr = parcial`?
- Fase 1 (convenios SSPD–SUI, INS, MinVivienda, UNGRD) para completar las capas S y R.
