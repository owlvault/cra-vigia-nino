---
id: adr-0006
tipo: adr
proyecto: vigia-nino-acueductos
estado: aceptada
actualizado: 2026-11-07
fuentes: [decisión de Camilo Carvajalino 2026-11-07, docs/auditoria/04_auditoria_modelo_datos.md, IDEAM zonificación hidrográfica, Ley 1712 de 2014]
---

# ADR-0006 — Abrir a la ciudadanía un subconjunto de la información de Vigía

## Contexto

RES-02 (2026-10-08) limitó la versión 1 a uso exclusivamente interno de la CRA. El 2026-11-07 se decidió que el público principal de las consultas sobre los datos de Vigía son los **ciudadanos en general**: durante El Niño 2026-27, los hogares necesitan saber si su municipio está en riesgo de desabastecimiento y si su agua es segura.

Abrir la información sin reglas tiene riesgos concretos, detectados en la auditoría del modelo de datos:

- Varios indicadores aún no son mediciones reales (A-3, A-4, H-1 salen de un catálogo estático; A-2 está escrito en código).
- Otros están desactualizados (S-2 es IRCA anual 2024).
- La población y la regionalización son del prototipo, no del DANE.
- El vocabulario «alerta amarilla/naranja/roja» coincide con las alertas oficiales del IDEAM y del Sistema Nacional de Gestión del Riesgo, y un ciudadano puede confundir un nivel analítico de la CRA con una alerta oficial.

## Decisión

1. **Se modifica RES-02. Coexisten dos canales.** El **canal interno** (ingesta, cálculo, configuración, auditoría, tablero completo V-01 a V-08) se mantiene sin cambios para la CRA. Se agrega un **canal ciudadano** de solo lectura sobre un subconjunto de la información, derivado del mismo corte publicado (`specs/canal-ciudadano.md`).
2. **Contenido del canal ciudadano.** Solo indicadores con dato verificable y frescura conocida:

   | Información | Origen | Condición |
   |---|---|---|
   | Nivel de riesgo del municipio | `nivel_alerta` del corte publicado | Nombrado «nivel de riesgo», nunca «alerta» |
   | Calidad del agua | S-2 IRCA, bandas de la Res. 2115 de 2007 | Siempre con el año del dato |
   | Horas de servicio al día | S-1 continuidad | Con el periodo SUI |
   | Racionamiento / calamidad pública | R-3, R-4 | Solo «sí» con soporte; si no, «sin información verificada» |
   | Nivel de embalses | `EMBALSES_NAL_PCT`, `EMBALSE_BOGOTA_PCT` | Aclarar que son embalses del SIN |
   | Estado de El Niño | `NINO34_SSTA`, `ONI` | Remitir al boletín del IDEAM |

   Quedan **excluidos** mientras no cambie su estado: el ICR numérico y los subíndices, A-2, A-3, A-4, H-1, la población en riesgo y el ICR nacional.
3. **Unidad territorial.** Se agrega y presenta por **departamento** (DANE, DIVIPOLA). Para explicar el efecto sobre el agua se usa la **zonificación hidrográfica del IDEAM** (área, zona y subzona), asignando cada municipio a la subzona que contiene su cabecera. Las regiones naturales quedan solo como etiqueta descriptiva. No se usan regiones del PND ni RAP para agregar.
4. **Reglas de comunicación.** Toda cifra lleva fuente y fecha (RES-05). `sin_dato` se dice «sin información», nunca «no». Cada respuesta aclara que es análisis de la CRA y no una declaratoria oficial, y remite al prestador, la alcaldía, la UNGRD o el IDEAM para decisiones prácticas.

## Condiciones antes de exponer el canal

El canal **no se pone en producción** hasta que se cumpla:

| ID | Condición | Responsable |
|---|---|---|
| C-CIU-01 | Q-SEG-01 resuelta: la información del canal está clasificada como **pública** en el esquema de activos de información de la CRA (Ley 1712 de 2014) | Oficina de Planeación y TIC CRA |
| C-CIU-02 | Existe `specs/canal-ciudadano.md` con requisitos EARS y escenarios BDD (regla de oro 1). **Cumplida en borrador el 2026-11-07**; falta aprobación de textos (Q-CIU-02) | Camilo |
| C-CIU-03 | El corte que alimenta el canal pasó la compuerta RF-CAL-04 | ACT-ORQUESTADOR |
| C-CIU-04 | Ningún dato del prototipo se muestra al público (regla de oro 8): la población y las coordenadas vienen del DANE antes de publicar cualquier agregado por población. **Cumplida en datos el 2026-11-07**: coordenadas DIVIPOLA y proyecciones PPED 2018-2042 (act. 2025-07-30); la compuerta la verifica en cada corte | ACT-ADMIN-DATOS |

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Mantener uso solo interno (RES-02 original) | Sin riesgo de mala interpretación | La información de riesgo hídrico no llega a quien la padece durante el evento | Se decidió priorizar el interés ciudadano |
| Publicar el tablero completo | Simple | Expone indicadores sin validar y el vocabulario de «alerta» | Riesgo de desinformación |
| Publicar los datos abiertos crudos | Máxima transparencia | Sin lenguaje claro ni advertencias; el ciudadano no puede interpretar ICR, capas ni frescura | No responde a la necesidad del hogar |

## Consecuencias

**Positivas:** la información llega a los ciudadanos con reglas explícitas de lenguaje, frescura y fuente; obliga a resolver la deuda de datos reales (IDEAM, DANE) antes de publicar.
**Negativas:** abre un frente de comunicación pública que la CRA debe sostener; exige la clasificación de la información (Q-SEG-01) y una spec nueva.
**Deuda que introduce:** mantener el cruce municipio → subzona hidrográfica cuando cambie la zonificación del IDEAM o DIVIPOLA.

## Impacto en el Context Lake

| Archivo | Qué cambia |
|---|---|
| `docs/business_context.md` | RES-02 modificada; no-objetivo de portal público acotado |
| `AGENTS.md` | Fuera de alcance e índice de decisiones |
| `specs/seguridad-acceso.md` | Fuera de alcance remite a este ADR |
| `specs/modelo-territorial.md` | Q-TER-01 resuelta: departamento + zonificación hidrográfica IDEAM |
| `specs/canal-ciudadano.md` | Creada en borrador 2026-11-07 |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-CIU-01 | ¿Por qué medio se expone el canal: página en el portal CRA, asistente conversacional o ambos? | `specs/canal-ciudadano.md` | Camilo / Oficina de Comunicaciones CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-11-07 | Aceptada | Decisión de Camilo Carvajalino |
| 2026-11-07 | Se precisa que el canal interno y el ciudadano coexisten; spec creada | Decisión de Camilo Carvajalino |
