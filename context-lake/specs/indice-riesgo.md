---
id: spec-indice-riesgo
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo (definición del ICR), specs/indicadores.md]
---

# Spec — Índice Compuesto de Riesgo (ICR)

## Propósito

Definir cómo se normalizan los indicadores, cómo se combinan en el ICR municipal y cómo se asigna el nivel de alerta. NO define el envío de alertas (`specs/alertas.md`).

## Contexto relevante

- Indicadores y umbrales: `specs/indicadores.md`
- Agregación territorial: `specs/modelo-territorial.md` → RF-TER-06
- Términos: `docs/glosario.md` → ICR, Capa, Nivel de alerta

## Estructura del ICR

| Capa | Peso | Indicadores |
|---|---|---|
| A — Amenaza hidroclimática | 30 % | A-3, A-4, H-1 |
| H — Vulnerabilidad de la oferta | 30 % | H-2, H-3, H-4 |
| S — Desempeño del servicio | 25 % | S-1, S-2, S-3, S-4, S-5 |
| R — Respuesta e impacto | 15 % | R-1, R-2, R-3, R-4 |

Dentro de cada capa los indicadores pesan igual. Los pesos viven en `config.peso` con versión (ADR-0003).

> **ASUNCIÓN (sin validar):** Pesos 30/30/25/15 y pesos iguales dentro de capa tomados del prototipo. H-1 se ubica en la capa A porque refleja la amenaza en curso sobre la fuente. Calibrar con eventos 2014-2016 y 2023-2024 (Q-ICR-01).

## Requisitos funcionales

### RF-ICR-01 — Normalización lineal por tramos

El módulo `riesgo/` DEBE transformar cada valor cuantitativo en un puntaje 0-100 interpolando linealmente entre los puntos de quiebre de `specs/indicadores.md` (0, 40, 60, 75, 100), recortando a 0 y 100 fuera del rango, respetando la dirección del indicador.

```gherkin
Escenario: Continuidad entre umbrales
  Dado S-1 = 15 h/día con quiebres 24→0, 22→40, 18→60, 12→75, 4→100
  Cuando se normaliza
  Entonces el puntaje es 67,5

Escenario: Valor mejor que el óptimo
  Dado H-1 = 130 %
  Cuando se normaliza
  Entonces el puntaje es 0

Escenario: Valor peor que el extremo
  Dado A-4 = 75 días
  Cuando se normaliza
  Entonces el puntaje es 100
```

**Prioridad:** debe

### RF-ICR-02 — Indicadores categóricos

El módulo DEBE asignar a H-2 y H-3 el puntaje fijo de su categoría según `specs/indicadores.md`.

**Prioridad:** debe

### RF-ICR-03 — Indicadores binarios

El módulo DEBE asignar: R-1 = 0 si hay PEC y 100 si no; R-2 = 60 si activo y 0 si no; R-3 = 80 si hay reporte y 0 si no; R-4 = 100 si hay calamidad y 0 si no. El subíndice de la capa R DEBE ser el máximo de los puntajes disponibles, no el promedio.

```gherkin
Escenario: Calamidad declarada con PEC al día
  Dado R-1 = PEC reportado, R-2 = sin_dato, R-3 = sin reporte, R-4 = calamidad vigente
  Cuando se calcula el subíndice R
  Entonces el subíndice R es 100
```

**Prioridad:** debe

### RF-ICR-04 — Cálculo del ICR con datos faltantes

El ICR DEBE ser la suma ponderada de los subíndices de capa. Un subíndice de capa es el promedio de los puntajes disponibles de sus indicadores (o el máximo para R). SI una capa no tiene ningún indicador disponible, ENTONCES su peso se redistribuye proporcionalmente entre las capas disponibles. SI las capas disponibles suman menos del 60 % del peso total, ENTONCES el ICR es `sin_dato`.

```gherkin
Escenario: Capa H sin datos
  Dado subíndices A = 70, H = sin_dato, S = 50, R = 0
  Cuando se calcula el ICR
  Entonces los pesos efectivos son A 42,86 %, S 35,71 %, R 21,43 %
  Y el ICR es 47,86
  Y la cobertura de datos registrada es 70 %

Escenario: Datos insuficientes
  Dado solo la capa S disponible (25 % del peso)
  Cuando se calcula el ICR
  Entonces el ICR es sin_dato y el nivel es "sin dato"
```

**Prioridad:** debe

### RF-ICR-05 — Nivel de alerta

El sistema DEBE asignar el nivel: `sin alerta` si ICR < 40; `amarilla` si 40 ≤ ICR < 60; `naranja` si 60 ≤ ICR < 75; `roja` si ICR ≥ 75.

**Prioridad:** debe

### RF-ICR-06 — Piso por impacto confirmado

CUANDO R-3 o R-4 están activos en un municipio, el sistema DEBE asignar como mínimo el nivel `naranja`, aunque el ICR calculado sea menor, y registrar `nivel_por_regla = true`.

```gherkin
Escenario: Racionamiento con ICR bajo
  Dado un municipio con ICR 38 y R-3 activo
  Cuando se asigna el nivel
  Entonces el nivel es "naranja"
  Y nivel_por_regla es verdadero
```

**Prioridad:** debe

### RF-ICR-07 — Versionado de la configuración

Cada fila de `oro.fct_icr_municipio` DEBE registrar la `config_version` de pesos y umbrales usada. CUANDO ACT-ADMIN-DATOS modifica un peso o umbral, el sistema DEBE crear una nueva versión con `vigente_desde` y NO DEBE recalcular cortes ya publicados salvo orden explícita de reproceso.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-ICR-01 — Pruebas

`riesgo/` DEBE tener cobertura de pruebas ≥ 95 % de líneas, incluyendo todos los escenarios de esta spec como pruebas automatizadas.

### RNF-ICR-02 — Explicabilidad

Para cada ICR, la API DEBE poder devolver el aporte de cada capa y de cada indicador en puntos de ICR.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-ICR-01 | La suma de pesos de capa DEBE ser 100 % en cada versión de configuración | RF-ICR-07 |
| RN-ICR-02 | El ICR se redondea a 1 decimal solo para mostrar; se almacena con precisión completa | todos |

### RF-ICR-07 — Calidad del ICR declarada (Fase 0, ADR-0007 propuesta)

Cada municipio DEBE llevar `calidad_icr`: `completo` si las cuatro capas tienen subíndice, `parcial` si el ICR existe con redistribución de pesos (≥ `peso_minimo_disponible`), `sin_dato` si no hay ICR. También lleva `capas_sin_dato`. El corte DEBE publicar `conteo_calidad_icr` y `cobertura_indicadores` (municipios con valor, municipios donde aplica y conteo por método).

```gherkin
Escenario: ICR sin capa de servicio
  Dado subíndices A = 60, H = 70, S = sin_dato, R = sin_dato
  Cuando se calcula el ICR
  Entonces calidad_icr es "parcial" y capas_sin_dato es ["S", "R"]
```

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Umbrales no monótonos en configuración | La configuración se rechaza al guardar |
| Indicador desactualizado | Se usa con su frescura; si supera 3 × su periodo esperado se trata como `sin_dato` |

## Fuera de alcance de esta spec

Modelos estadísticos o de aprendizaje automático para predecir desabastecimiento (posible fase 2, Q-ICR-02).

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-ICR-01 | ¿Quién aprueba los pesos y con qué datos se calibran? | Estado `validado` | CRA – Subdirección de Regulación |
| Q-ICR-02 | ¿Interesa en fase 2 un modelo predictivo entrenado con 2014-2016 y 2023-2024? | — | Camilo |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo |
