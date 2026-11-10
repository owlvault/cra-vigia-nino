# Diagnóstico — primer corte nacional (2026-11-09)

**Resultado:** RECHAZADO por la compuerta RF-CAL-04 (`cobertura 89 % < 90 %`).
**Decisión:** se mantiene publicado el corte piloto de 23 municipios (`corte_vigente.json`, 2026-11-09 01:04 UTC) hasta que la CRA resuelva cómo cerrar la brecha.
**Evidencia:** `data/oro/rechazados/corte_2026-11-09.json` y las capturas de bronce del 2026-11-09 23:41–23:59 UTC.

## Cifras

| | Municipios |
|---|---|
| Evaluados (DIVIPOLA completa) | 1.122 |
| Con ICR `completo` (las 4 capas) | 23 (el piloto) |
| Con ICR `parcial` (≥ 60 % del peso) | 974 |
| Sin ICR (`sin_dato`) | 125 — 2,31 millones de habitantes |
| Cobertura de la compuerta | 997 / 1.122 = 88,9 % (mínimo 90 %) |

Faltan 13 municipios para pasar la compuerta.

## Por qué 125 municipios quedan sin ICR

Los 125 no tienen A-3 (lluvia 30 días frente a la normal) ni A-4 (días secos consecutivos). Ninguna estación del IDEAM cercana pasa el control de calidad. Sin la capa A (30 %) y sin la capa R (15 %), el peso disponible es del 55 %, por debajo del 60 % que exige un ICR `parcial` (ADR-0007, punto 5).

Departamentos con más casos: Chocó 13, Caquetá 12, Bolívar 9, Amazonas 9, Nariño 8, Norte de Santander 8, Cesar 7, Meta 7, Guainía 7 y Antioquia 6.

## Cobertura por indicador

| Indicador | Con valor / aplica | Fuente |
|---|---|---|
| A-1, A-2 | 1.122 / 1.122 | NOAA (nacional) |
| A-3 | 951 / 1.122 | Estaciones IDEAM |
| A-4 | 996 / 1.122 | Estaciones IDEAM |
| A-5 | 0 / 1.122 | FIRMS sin `FIRMS_MAP_KEY` |
| H-1 | 0 / 1.122 | Sin fuente |
| H-2, H-3 | 1.120 y 1.122 / 1.122 | ENA (estático) |
| H-4 | 23 / 1.122 | Solo el piloto |
| H-5 | 14 / 14 | XM (solo municipios abastecidos por embalse) |
| S-1, S-3 a S-6 | 23 / 1.122 | SUI: solo el piloto |
| S-2 (IRCA) | 1.037 / 1.122 | SIVICAP |
| R-1 a R-4 | 23, 2, 5 y 6 / 1.122 | UNGRD/MinVivienda |

**Advertencia de comparabilidad.** Fuera del piloto, el ICR `parcial` se calcula con A-3/A-4, H-2/H-3 y el IRCA. La capa S queda reducida a un indicador y la capa R falta en 1.099 municipios. Ese ICR no es comparable con el de los 23 municipios completos (ADR-0007, Consecuencias).

## Opciones para decidir (CRA)

1. **Esperar más cobertura de lluvia**, con un concepto del IDEAM sobre estaciones adicionales (Q-ADR7-03).
2. **Usar CHIRPS de respaldo para A-3** solo donde no hay estación. Hoy está descartado por ADR-0007: concordancia del 42 % y sesgo de +32 pp. Además A-4 seguiría sin dato, porque CHIRPS diario borra las rachas secas.
3. **Ajustar la compuerta** (`parametros_corte.json` → `min_pct_municipios_con_icr`), o medirla sobre los municipios con fuentes desplegadas. Es un cambio de política de calidad (RF-CAL-04).
4. **Cerrar las fuentes de Fase 1** (SUI, IRCA y eventos; `contratos-datos-fase1.md`). Así el ICR `parcial` se acerca a `completo`, aunque no resuelve la capa A.

## Incidencias de la corrida

- CHIRPS respondió HTTP 429 (límite de solicitudes) en varios días. El conector reintentó y completó 72 días, hasta el 2026-11-05.
- Duración total del ciclo: 18 min 13 s.
