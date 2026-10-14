---
id: adr-0004
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-10-08
fuentes: [CRA DES-MAN04 Manual de Identidad Visual V02, solicitud de Camilo 2026-10-08]
---

# ADR-0004 — Aplicar el Manual de Identidad Visual CRA DES-MAN04 V02 a la interfaz

## Contexto

Camilo pidió que el tablero use la imagen corporativa de la CRA. Una primera versión del sistema de diseño tomó colores del sitio cra.gov.co (`#3366CC`, `#074982`, Montserrat), que corresponden a la plantilla GOV.CO del sitio y no al manual de la entidad. Luego Camilo entregó el manual oficial DES-MAN04 V02 (julio 2024).

## Decisión

La interfaz usa: color institucional `#43B2D7`; colores de bandera `#FFC800`, `#003189`, `#D80025` solo en la franja de bandera del logo y como acento de títulos; tipografía Nunito Sans; logo reducido "CRA" a color; barra inferior cian en cada vista. Los colores derivados para pantalla y los semánticos de alerta se definen en `docs/design_system.md`. Verdana solo en correos y exportes Office.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Paleta del sitio cra.gov.co (`#3366CC`, Montserrat) | Coincide con la sede electrónica | Es la plantilla GOV.CO, no el manual de la CRA | Superada por el manual oficial |
| Diseño libre del prototipo | Ya construido | No institucional | Incumple RES-04 |

## Consecuencias

**Positivas:** coherencia con la identidad oficial de la entidad.
**Negativas:** `#43B2D7` no alcanza contraste AA para texto; se crea un derivado `#17729A` que requiere visto bueno de Comunicaciones (Q-DIS-04).
**Deuda que introduce:** el logo del prototipo es un recorte del PDF; producción requiere el vectorial (Q-DIS-01).

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `docs/design_system.md` | Reescrito según el manual |
| `specs/tablero-ui.md` | Referencia al manual |
| `specs/alertas.md` | RF-ALE-03 usa Verdana en correos |
| `documentacion/fuentes/marca/` | Manual y logo de referencia |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Aceptada | Manual entregado por Camilo |
