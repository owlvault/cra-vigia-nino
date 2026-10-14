---
id: adr-0002
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-10-08
fuentes: [prototipo, catálogo de fuentes]
---

# ADR-0002 — Usar el código DIVIPOLA del DANE como llave territorial única

## Contexto

Las 18 fuentes identifican el territorio de forma distinta: código DIVIPOLA numérico o texto, nombre de municipio, coordenadas, APS de prestador o subzona hidrográfica. Cruzarlas exige una llave común y estable.

## Decisión

Toda tabla de plata y oro identifica el territorio con `divipola` (texto de 5 caracteres). Datos por coordenadas se asignan por contención en polígonos MGN del DANE; datos por nombre se resuelven contra DIVIPOLA y una tabla de alias, sin coincidencia aproximada.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Nombre de municipio | Legible | Homónimos (p. ej. varios "San Andrés", "Granada") y variaciones de escritura | No es único |
| Código SUI interno | Nativo del SUI | No existe en fuentes no SSPD | No es universal |
| Cuenca hidrográfica como unidad principal | Natural para hidrología | No corresponde a la unidad de prestación ni de decisión | Se usa solo para H-2, H-3 y A-5 |

## Consecuencias

**Positivas:** cruce determinista; compatible con todas las entidades públicas.
**Negativas:** requiere mantener alias y versiones de DIVIPOLA.
**Deuda que introduce:** tabla `config.alias_territorio` mantenida a mano.

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `specs/modelo-territorial.md` | RF-TER-01, RF-TER-02 |
| `docs/glosario.md` | Término DIVIPOLA |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Aceptada | Diseño SDD |
