---
id: adr-0001
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-10-08
fuentes: [solicitud de Camilo 2026-10-08]
---

# ADR-0001 — Desarrollar con Spec-Driven Development sobre un Context Lake

## Contexto

El sistema se implementará con agentes de código (Claude Code u otros) y debe estar operando durante El Niño 2026-27, con plazo corto. El conocimiento del dominio (meteorología, hidrología, regulación de acueducto) no está en el código ni lo tienen los agentes con la precisión requerida.

## Decisión

Toda funcionalidad se implementa a partir de una spec en `context-lake/specs/` con requisitos EARS y criterios Dado/Cuando/Entonces. Ningún agente escribe código para un comportamiento que no esté en una spec. Las decisiones se registran como ADR append-only. Las pruebas automatizadas se derivan de los escenarios gherkin.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Desarrollo directo desde el prototipo | Rápido al inicio | El agente inventa fórmulas, umbrales y fuentes | Riesgo de indicadores sin sustento regulatorio |
| Documento de requisitos tradicional | Familiar para la entidad | Ambiguo para agentes; envejece sin control | No es ejecutable ni trazable a pruebas |

## Consecuencias

**Positivas:** trazabilidad requisito → prueba → código; vacíos visibles como preguntas abiertas.
**Negativas:** costo inicial de escribir y mantener specs.
**Deuda que introduce:** ninguna.

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `AGENTS.md` | Regla de oro 1 |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Aceptada | Solicitud de Camilo |
