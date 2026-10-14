---
id: spec-alertas
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo (niveles de alerta y acciones sugeridas), business_context FL-03]
---

# Spec — Alertas

## Propósito

Detectar cambios de nivel de alerta entre cortes, notificarlos y registrar su revisión. NO calcula el nivel (`specs/indice-riesgo.md`).

## Contexto relevante

- Flujo: `docs/business_context.md` → FL-03
- Términos: `docs/glosario.md` → Alerta, Nivel de alerta, Corte

## Requisitos funcionales

### RF-ALE-01 — Generación de alerta por escalamiento

CUANDO se publica un corte y un municipio tiene un nivel mayor que en el último corte publicado anterior, el sistema DEBE crear un registro en `oro.evt_alerta` con `divipola`, nivel anterior, nivel nuevo, ICR, `fecha_corte`, indicadores con mayor aporte y estado `nueva`.

```gherkin
Escenario: Paso de amarilla a naranja
  Dado "44847" en amarilla en el corte del 2026-10-07
  Y en naranja en el corte publicado del 2026-10-08
  Cuando termina la publicación
  Entonces existe una alerta "amarilla → naranja" para "44847" en estado "nueva"

Escenario: Sin cambio
  Dado "44847" en naranja en ambos cortes
  Cuando termina la publicación
  Entonces no se crea alerta nueva para "44847"
```

**Prioridad:** debe

### RF-ALE-02 — Desescalamiento

CUANDO un municipio baja de nivel, el sistema DEBE registrar el evento con tipo `desescalamiento` y NO DEBE enviar correo inmediato; se incluye en el resumen diario.

**Prioridad:** debe

### RF-ALE-03 — Notificación por correo

CUANDO se crea una alerta de escalamiento a naranja o roja, el sistema DEBE enviar en menos de 15 minutos un correo a los usuarios suscritos a ese nivel y departamento, con municipio, departamento, nivel anterior y nuevo, ICR, los 3 indicadores de mayor aporte y el enlace a la ficha municipal. El correo DEBE usar Verdana y el logo CRA según `docs/design_system.md`.

```gherkin
Escenario: Alerta roja
  Dado ACT-COMISIONADO suscrito a alertas rojas de todo el país
  Cuando se crea una alerta "naranja → roja" para "47189"
  Entonces ACT-COMISIONADO recibe un correo con asunto que empieza por "[ROJA] Ciénaga, Magdalena"

Escenario: Servidor de correo caído
  Dado el servidor SMTP no responde
  Cuando se intenta enviar la alerta
  Entonces la alerta queda en "pendiente_envio" y se reintenta cada 15 minutos durante 24 horas
```

**Prioridad:** debe

### RF-ALE-04 — Resumen diario

CUANDO se publica el corte diario, el sistema DEBE enviar a todos los usuarios activos un resumen con el conteo de municipios por nivel, los escalamientos y desescalamientos del día y el estado de frescura de las fuentes.

**Prioridad:** debería

### RF-ALE-05 — Revisión de alertas

El sistema DEBE permitir a ACT-ANALISTA marcar una alerta como `revisada` registrando una nota de texto de hasta 2.000 caracteres, el usuario y la hora.

```gherkin
Escenario: Revisión
  Dado una alerta "nueva" para "44847"
  Cuando ACT-ANALISTA la marca revisada con la nota "Confirmado racionamiento sectorizado con SSPD"
  Entonces la alerta queda "revisada" con usuario, hora y nota
```

**Prioridad:** debe

### RF-ALE-06 — Suscripciones

El sistema DEBE permitir a cada usuario elegir los niveles (naranja, roja) y los departamentos de los que recibe correo. Por defecto ACT-COMISIONADO recibe solo rojas nacionales y ACT-ANALISTA naranja y roja nacionales.

**Prioridad:** debe

### RF-ALE-07 — Acción sugerida

El sistema DEBE mostrar en la alerta y en la ficha municipal un texto de acción sugerida por nivel, configurable en `config.accion_sugerida`. Textos iniciales:

| Nivel | Acción sugerida |
|---|---|
| roja | Verificar activación del PEC y abastecimiento alterno; revisar con SSPD y UNGRD el estado de racionamiento; evaluar medidas regulatorias transitorias. |
| naranja | Verificar que el prestador tenga PEC reportado; seguimiento semanal de caudal y continuidad; coordinar con el PDA. |
| amarilla | Seguimiento quincenal de lluvia y caudal. |
| sin alerta | Monitoreo rutinario. |

> **ASUNCIÓN (sin validar):** Los textos son propuesta inicial adaptada al rol regulador de la CRA (el prototipo tenía acciones operativas de prestador). Validar con la Subdirección de Regulación (Q-ALE-01).

**Prioridad:** debería

## Requisitos no funcionales

### RNF-ALE-01 — No duplicación

Un mismo escalamiento (municipio, nivel nuevo, fecha_corte) NO DEBE notificarse más de una vez por usuario.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-ALE-01 | Las alertas se generan solo a partir de cortes `publicados` | RF-ALE-01 |
| RN-ALE-02 | Un cambio a "sin dato" no genera alerta; se reporta en el resumen diario | RF-ALE-01 |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Primer corte del sistema (sin corte anterior) | No se generan alertas; solo resumen |
| Reproceso de un corte ya publicado | No reenvía correos de alertas ya notificadas |
| Usuario desactivado | No recibe correos |

## Fuera de alcance de esta spec

SMS, WhatsApp, notificaciones push, alertas a entidades externas o al público (RES-02).

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-ALE-01 | ¿Textos de acción sugerida desde la competencia regulatoria de la CRA? | RF-ALE-07 | Subdirección de Regulación |
| Q-ALE-02 | ¿Cuenta de correo de servicio y relay SMTP disponibles? | RF-ALE-03 | TI CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo |
