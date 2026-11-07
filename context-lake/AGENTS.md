---
id: agents
tipo: agents
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [conversación con Camilo Carvajalino 2026-10-08, prototipo, Manual DES-MAN04 V02]
---

# Vigía El Niño · Acueductos

Sistema interno de la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA) que recopila automáticamente datos oficiales (SUI, SIVICAP, IDEAM, NOAA, UNGRD, MinVivienda, DANE…), calcula 20 indicadores y un Índice Compuesto de Riesgo por municipio, y muestra el impacto de El Niño 2026-27 sobre el servicio de acueducto desde la Nación hasta cada municipio. Estado: greenfield; specs en borrador; existe un prototipo HTML de referencia con datos territoriales de ejemplo.

## Cómo usar este repositorio de contexto

Antes de escribir código, lee el archivo que corresponda a tu tarea:

| Si vas a... | Lee |
|---|---|
| entender por qué existe una funcionalidad o resolver un trade-off | `docs/business_context.md` |
| usar un término del dominio | `docs/glosario.md` |
| entender el stack, esquemas y convenciones | `docs/architecture.md` |
| construir cualquier pantalla, color, tipografía o logo | `docs/design_system.md` |
| escribir un conector de fuente | `specs/ingesta-fuentes.md` |
| validar datos o publicar un corte | `specs/calidad-datos.md` |
| asignar datos a municipios o agregar | `specs/modelo-territorial.md` |
| calcular un indicador | `specs/indicadores.md` |
| calcular el ICR o el nivel de alerta | `specs/indice-riesgo.md` |
| generar o enviar alertas | `specs/alertas.md` |
| construir el tablero web | `specs/tablero-ui.md` |
| comparar semana a semana / botón «Actualizar datos» | `specs/comparativo-semanal.md` |
| autenticación, roles, auditoría | `specs/seguridad-acceso.md` |
| saber por qué algo está hecho así | `adr/` (índice abajo) |

## Stack

| Capa | Tecnología | Restricción |
|---|---|---|
| Conectores y lógica | Python 3.12 | `riesgo/` sin I/O, `mypy --strict` |
| Orquestación | Apache Airflow 2.x (LocalExecutor) | Máx. 1 ejecución activa por fuente |
| Transformación | dbt-core + dbt-postgres | Tests de dbt son compuerta de publicación |
| Datos | PostgreSQL 16 + PostGIS 3 | Esquemas bronce, plata, oro, config, ops |
| API | FastAPI | Valida rol en cada solicitud |
| Web | React 18 + Vite + TypeScript, MapLibre GL JS, Apache ECharts | Sin CDNs externos; Nunito Sans local |
| Identidad | Keycloak (OIDC) federado al directorio CRA | Sin contraseñas propias |
| Despliegue | Docker Compose on-premise | Servidor Linux de la CRA |

## Reglas de oro

1. **No implementes comportamiento que no esté en una spec.** Si falta, detente y propón la adición a la spec. Razón: ADR-0001; los vacíos se vuelven indicadores sin sustento regulatorio.
2. **Nunca escribas, actualices ni borres en `bronce`.** Solo los conectores insertan. Razón: es la evidencia de origen de cada cifra (ADR-0003).
3. **Nunca pongas pesos, umbrales, URLs de fuentes ni textos de acciones en código.** Van en el esquema `config` versionado. Razón: se recalibran durante el evento sin despliegue.
4. **Identifica todo territorio con `divipola` de 5 caracteres.** Nunca crees llaves por nombre. Razón: ADR-0002.
5. **`sin_dato` nunca es 0.** Ni en cálculo ni en pantalla. Razón: un 0 falso baja el riesgo de un municipio sin información.
6. **Toda cifra mostrada lleva fuente y fecha del dato.** Razón: RES-05, uso regulatorio.
7. **Usa solo los tokens de `docs/design_system.md`.** Color institucional `#43B2D7`, Nunito Sans, logo según el manual. Los colores de bandera nunca codifican datos.
8. **No inventes datos de ejemplo en producción.** El prototipo es referencia de diseño, no de datos.
9. **Fechas en UTC en la base; presentación en `America/Bogota`.**
10. **Ante una ASUNCIÓN marcada en una spec, implementa lo asumido pero déjalo parametrizado** y menciona la asunción en el PR.

## Fuera de alcance

- Alcantarillado y aseo.
- Acceso de entidades externas; API pública. Excepción: canal ciudadano de solo lectura, con las condiciones de `adr/ADR-0006-canal-ciudadano.md` y solo después de `specs/canal-ciudadano.md`.
- Modelos propios de predicción climática.
- Captura de datos de prestadores (no reemplaza el SUI).
- Gestión operativa de la emergencia (carrotanques, inventarios).
- App móvil nativa.

## Comandos

> **ASUNCIÓN (sin validar):** Comandos objetivo del monorepo; se crean en el primer commit.

| Acción | Comando |
|---|---|
| levantar entorno | `docker compose -f infra/compose.yml up -d` |
| pruebas Python | `make test` (pytest en `ingesta/`, `riesgo/`, `alertas/`, `api/`) |
| pruebas de datos | `make dbt-test` |
| pruebas web | `make web-test` |
| lint | `make lint` (ruff, mypy, eslint) |
| ejecutar corte manual | `make corte FECHA=AAAA-MM-DD` |

## Índice de specs

| Spec | Dominio | Estado |
|---|---|---|
| `specs/ingesta-fuentes.md` | 18 fuentes, captura, reintentos, carga asistida | borrador |
| `specs/calidad-datos.md` | Validación, frescura, compuerta de publicación, linaje | borrador |
| `specs/modelo-territorial.md` | DIVIPOLA, APS, estaciones, agregación | borrador |
| `specs/indicadores.md` | 20 indicadores, fórmulas, umbrales | borrador |
| `specs/indice-riesgo.md` | Normalización, ICR, niveles, versionado | borrador |
| `specs/alertas.md` | Escalamientos, correo, revisión | borrador |
| `specs/tablero-ui.md` | Vistas V-01 a V-07, drill territorial, ficha | borrador |
| `specs/comparativo-semanal.md` | V-08 comparativo semanal, modelo semanal, actualización bajo demanda | borrador |
| `specs/seguridad-acceso.md` | OIDC, roles, auditoría | borrador |

## Índice de decisiones

| ADR | Decisión | Estado |
|---|---|---|
| `adr/ADR-0001-sdd-context-lake.md` | Spec-Driven Development sobre Context Lake | aceptada |
| `adr/ADR-0002-divipola-llave-territorial.md` | DIVIPOLA como llave territorial | aceptada |
| `adr/ADR-0003-arquitectura-medallon.md` | Bronce/plata/oro y configuración versionada | aceptada |
| `adr/ADR-0004-imagen-institucional-cra.md` | Manual de Identidad Visual CRA DES-MAN04 V02 | aceptada |
| `adr/ADR-0005-stack-open-source-on-premise.md` | Stack open source on-premise | aceptada |
| `adr/ADR-0006-canal-ciudadano.md` | Canal ciudadano de solo lectura; agregación por departamento y zonificación hidrográfica IDEAM | aceptada |

## Preguntas abiertas

Las bloqueantes para iniciar implementación: Q-ARQ-01 (directorio de identidad), Q-ARQ-03 (salida a internet del servidor), Q-ING-01 (acceso SUI y datasets), Q-TER-03 (inventario de fuentes abastecedoras), Q-DIS-01 (logo vectorial). El resto está en cada archivo.

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-AGE-01 | ¿Repositorio Git institucional donde vivirá el monorepo? | Primer commit | TI CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Fase 3 del Context Lake |
| 2026-11-07 | Canal ciudadano (ADR-0006) | Decisión de Camilo |
