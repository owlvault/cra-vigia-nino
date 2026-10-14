---
id: adr-0005
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-10-08
fuentes: [decisión de Camilo 2026-10-08: "Open source on-premise"]
---

# ADR-0005 — Stack de código abierto desplegado on-premise en la CRA

## Contexto

Camilo eligió despliegue on-premise con software de código abierto. El sistema es de uso interno, procesa datos públicos agregados y debe estar operando antes del pico esperado del evento (nov-2026 a ene-2027, RES-07).

## Decisión

Python 3.12 para conectores y lógica de riesgo; Apache Airflow 2.x con LocalExecutor como orquestador; PostgreSQL 16 + PostGIS 3 como almacén; dbt-core para transformaciones y pruebas de datos; FastAPI para la API; React 18 + Vite + TypeScript con MapLibre GL JS y Apache ECharts para la web; Keycloak para identidad; Nginx como proxy inverso; Docker Compose para el despliegue v1.

> **ASUNCIÓN (sin validar):** La selección de componentes concretos (Airflow frente a Prefect o Dagster, ECharts frente a otras librerías) la propone el equipo de diseño; Camilo eligió la familia "Python + Airflow + PostgreSQL/PostGIS + front web". Confirmar ECharts, Keycloak y Docker Compose con TI CRA.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Azure + Power BI | Encaja con Microsoft 365 de la CRA | Nube y licencias | Camilo eligió on-premise open source |
| Google Cloud | Servicios gestionados | Nube | Ídem |
| Prefect o Dagster | Más modernos | Menos adopción en el sector público colombiano | Airflow incluido en la elección de Camilo |
| Kubernetes | Escalable | Complejidad operativa para un servidor | Volumen no lo justifica en v1 |

## Consecuencias

**Positivas:** sin costo de licencias; control total de datos; portable.
**Negativas:** la CRA opera y actualiza la infraestructura; requiere salida a internet desde el servidor para las fuentes.
**Deuda que introduce:** un solo servidor sin alta disponibilidad en v1.

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `docs/architecture.md` | Componentes y convenciones |
| `AGENTS.md` | Tabla de stack y comandos |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Aceptada | Decisión de Camilo |
