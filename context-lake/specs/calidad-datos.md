---
id: spec-calidad-datos
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [solicitud de trazabilidad a fuentes oficiales 2026-10-08, ADR-0003]
---

# Spec — Calidad de datos y publicación del corte

## Propósito

Validar los datos de bronce al pasarlos a plata, medir su frescura y decidir si un corte se publica. NO cubre la descarga (`specs/ingesta-fuentes.md`) ni las fórmulas (`specs/indicadores.md`).

## Contexto relevante

- Flujo: `docs/business_context.md` → FL-01, pasos 2 y 5
- Decisiones: `adr/ADR-0003-arquitectura-medallon.md`
- Términos: `docs/glosario.md` → Corte, Frescura, Bronce / Plata / Oro

## Requisitos funcionales

### RF-CAL-01 — Validación de esquema

CUANDO se transforma una captura de bronce a plata, el sistema DEBE verificar que existan las columnas requeridas y que sus tipos sean convertibles según el contrato de la fuente en `config.contrato_fuente`.

```gherkin
Escenario: Columna renombrada en la fuente
  Dado el contrato de FTE-INS-IRCA exige la columna "irca"
  Y la captura nueva trae "valor_irca" en su lugar
  Cuando se ejecuta la transformación a plata
  Entonces la fuente queda marcada "esquema_cambiado"
  Y plata conserva los datos de la última captura válida
  Y ACT-ADMIN-DATOS recibe una notificación
```

**Prioridad:** debe

### RF-CAL-02 — Reglas de rango

El sistema DEBE marcar como `fuera_de_rango` y excluir del cálculo todo valor que viole las reglas de la tabla RN-CAL, conservando el registro en plata con su marca.

```gherkin
Escenario: IRCA imposible
  Dado un registro de IRCA = 135 para DIVIPOLA "25126"
  Cuando se valida en plata
  Entonces el registro queda con estado_calidad "fuera_de_rango"
  Y no se usa para calcular S-2

Escenario: Continuidad válida en el borde
  Dado una continuidad de 24,0 h/día
  Cuando se valida en plata
  Entonces el registro queda con estado_calidad "valido"
```

**Prioridad:** debe

### RF-CAL-03 — Frescura por indicador

El sistema DEBE calcular, para cada valor en `oro.fct_indicador_municipio`, la `fecha_dato` (fecha a la que se refiere el dato en la fuente) y el estado de frescura según la frecuencia esperada del indicador: `vigente` si `fecha_corte - fecha_dato` ≤ 1,5 × periodo esperado; `desactualizado` si es mayor.

```gherkin
Escenario: IRCA mensual desactualizado
  Dado el último IRCA de DIVIPOLA "44001" con fecha_dato 2026-06-30
  Y el periodo esperado de S-2 es 1 mes
  Cuando se calcula el corte del 2026-10-08
  Entonces S-2 de "44001" queda con frescura "desactualizado"
```

**Prioridad:** debe

### RF-CAL-04 — Compuerta de publicación

CUANDO termina el cálculo de un corte, el sistema DEBE publicarlo solo si cumple las tres condiciones: (a) ICR calculado para al menos el 90 % de los municipios, (b) la capa A tiene al menos un valor vigente de A-1, (c) ningún test de dbt de severidad `error` falló. SI no se cumple, ENTONCES el corte queda `rechazado`, el tablero sigue mostrando el último publicado y ACT-ADMIN-DATOS recibe el motivo.

```gherkin
Escenario: Corte válido
  Dado un corte con ICR para el 96 % de municipios, A-1 vigente y 0 tests en error
  Cuando termina el cálculo
  Entonces el corte queda en estado "publicado"

Escenario: Cobertura insuficiente
  Dado un corte con ICR para el 71 % de municipios
  Cuando termina el cálculo
  Entonces el corte queda en estado "rechazado" con motivo "cobertura 71 % < 90 %"
  Y la API sigue sirviendo el corte publicado anterior
```

**Prioridad:** debe

### RF-CAL-05 — Linaje visible

El sistema DEBE permitir, para cualquier valor mostrado en el tablero, consultar la fuente, el `_captura_id`, la `fecha_dato` y la URL de origen.

```gherkin
Escenario: Trazar un valor
  Dado la ficha de DIVIPOLA "47001" mostrando S-1 = 14,2 h/día
  Cuando ACT-ANALISTA abre el detalle del valor
  Entonces ve "FTE-SUI-CONT", la fecha_dato, la fecha de captura y la URL de origen
```

**Prioridad:** debe

## Requisitos no funcionales

### RNF-CAL-01 — Reproducibilidad

Recalcular un corte publicado a partir de bronce y de la `config_version` registrada DEBE producir los mismos valores de ICR con diferencia ≤ 0,01.

### RNF-CAL-02 — Duración de la transformación

Bronce → Oro para un corte diario DEBE completarse en menos de 45 minutos en el servidor de producción.

### RNF-CAL-03 — Respaldo

La base de datos DEBE respaldarse completa al menos 1 vez al día con retención de 30 días, sujeto a Q-ARQ-04.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-CAL-01 | IRCA en [0, 100] | S-2 |
| RN-CAL-02 | Continuidad en [0, 24] h/día | S-1 |
| RN-CAL-03 | Precipitación diaria en [0, 500] mm | A-3, A-4 |
| RN-CAL-04 | Caudal ≥ 0 | H-1 |
| RN-CAL-05 | IANC en [0, 100] % | S-4 |
| RN-CAL-06 | Toda fila de plata DEBE tener `divipola` válido en la versión vigente de DIVIPOLA o estado `territorio_no_resuelto` | todos |
| RN-CAL-07 | Un valor `fuera_de_rango` o `territorio_no_resuelto` NUNCA entra al cálculo del ICR | `specs/indice-riesgo.md` |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Duplicados exactos en la fuente | Se deduplican en plata por llave natural; se registra el conteo en `ops.calidad` |
| Dos valores distintos para la misma llave y fecha | Se toma el de captura más reciente; se registra conflicto |
| Valores nulos en la fuente | Se conservan como nulos; el indicador queda `sin_dato` para ese municipio |
| Datos con fecha futura | `fuera_de_rango` |

## Fuera de alcance de esta spec

Corrección manual de datos de origen. Si una fuente publica un error, se documenta; no se edita.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-CAL-01 | ¿El umbral de 90 % de cobertura para publicar es aceptable al inicio, cuando algunas fuentes municipales serán escasas? | RF-CAL-04 | Camilo |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Diseño SDD |
