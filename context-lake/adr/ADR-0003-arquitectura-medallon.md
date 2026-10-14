---
id: adr-0003
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-10-08
fuentes: [requisito de trazabilidad a fuentes oficiales]
---

# ADR-0003 — Arquitectura de datos en zonas bronce, plata y oro con configuración versionada

## Contexto

Cada cifra del tablero debe poder rastrearse a la fuente oficial y a la descarga exacta (RES-05). Las fuentes cambian de esquema sin aviso y los umbrales y pesos del ICR se van a recalibrar durante el evento.

## Decisión

1. Bronce guarda el crudo inmutable con hash y metadatos de captura.
2. Plata guarda datos tipados, validados y con `divipola`.
3. Oro guarda indicadores e ICR versionados por `fecha_corte`.
4. Pesos, umbrales, catálogo de fuentes y textos configurables viven en el esquema `config` con versiones; nunca en código.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Cargar directo a tablas finales | Menos tablas | Sin reproceso ni linaje | Incumple RES-05 |
| Umbrales en código | Simple | Cada recalibración exige despliegue | El evento está en curso; se recalibrará a menudo |

## Consecuencias

**Positivas:** reproducibilidad (RNF-CAL-01), linaje visible, recalibración sin despliegue.
**Negativas:** más almacenamiento; más modelos dbt.
**Deuda que introduce:** ninguna.

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `docs/architecture.md` | Modelo de datos por esquemas |
| `specs/ingesta-fuentes.md` | RF-ING-02 |
| `specs/calidad-datos.md` | RF-CAL-05 |
| `specs/indice-riesgo.md` | RF-ICR-07 |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Aceptada | Diseño SDD |
