---
id: spec-indicadores
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo (batería de 20 indicadores), NOAA CPC, Res. MinSalud 2115 de 2007 (IRCA), IDEAM Estudio Nacional del Agua, MinVivienda circular 2026EE0026348]
---

# Spec — Indicadores

## Propósito

Definir los 20 indicadores: fórmula, unidad, escala, fuente, periodicidad y umbrales. NO define cómo se combinan en el ICR (`specs/indice-riesgo.md`) ni cómo se muestran (`specs/tablero-ui.md`).

## Contexto relevante

- Fuentes: `specs/ingesta-fuentes.md` → catálogo FTE-*
- Asignación territorial: `specs/modelo-territorial.md`
- Términos: `docs/glosario.md` → Indicador, Capa, ONI, RONI, IRCA, IANC, IPUF, PEC

## Catálogo

`dir` = dirección del riesgo: `↓` el riesgo sube cuando el valor baja; `↑` sube cuando el valor sube.

| Código | Indicador | Fórmula | Unidad | Escala | Fuente | Periodo | dir | En ICR |
|---|---|---|---|---|---|---|---|---|
| A-1 | ONI / RONI | Último valor trimestral publicado; también Niño 3.4 semanal | °C | Nación | FTE-CPC-ONI, FTE-CPC-SEM | semanal / mensual | ↑ | No (contexto) |
| A-2 | Probabilidad de El Niño muy fuerte | Probabilidad máxima de intensidad "muy fuerte" o superior en los próximos 3 trimestres | % | Nación | FTE-CPC-PROB | mensual | ↑ | No (contexto) |
| A-3 | Anomalía de precipitación 30 días | (Σ lluvia 30 d − Σ línea base 30 d) / Σ línea base 30 d × 100 | % | Municipio | FTE-IDEAM-PREC | diario | ↓ | Sí, capa A |
| A-4 | Días consecutivos sin lluvia | Días hasta la fecha de corte con lluvia municipal < 1 mm | días | Municipio | FTE-IDEAM-PREC | diario | ↑ | Sí, capa A |

> **Fase 0 (ADR-0007, propuesta):** A-3 y A-4 salen de las estaciones del IDEAM, tras el control de calidad de estaciones (`parametros_ideam.json`). FTE-CHIRPS solo entra al ICR si `parametros_chirps.json` → `usar_en_icr` lo habilita; hoy está desactivado por la validación del 2026-11-09. Cada valor declara `fuente` y `metodo`. H-5 lleva `aplica = false` donde ningún embalse del catálogo XM abastece al municipio.

| A-5 | Focos de calor en el municipio (7 d) | Conteo de detecciones con confianza nominal o alta dentro del polígono | conteo | Municipio | FTE-FIRMS | diario | ↑ | No (informativo) |
| H-1 | Caudal de la fuente abastecedora | Caudal medio 7 d / caudal medio multianual del mismo mes × 100 | % | Fuente abastecedora | FTE-IDEAM-CAUD | diario | ↓ | Sí, capa A |
| H-2 | Índice de vulnerabilidad hídrica en año seco | Categoría ENA de la subzona hidrográfica que contiene la cabecera | categoría | Subzona | FTE-IDEAM-ENA | estático | ↑ | Sí, capa H |
| H-3 | Índice de uso del agua en año seco | Categoría ENA de la subzona | categoría | Subzona | FTE-IDEAM-ENA | estático | ↑ | Sí, capa H |
| H-4 | Reserva de almacenamiento | Volumen almacenado / demanda horaria media | horas | Sistema | Q-IND-01 | diario | ↓ | Sí, capa H |
| H-5 | Nivel de embalses abastecedores | Volumen útil / volumen útil máximo × 100 | % | Embalse | FTE-XM | diario | ↓ | No (informativo) |
| S-1 | Continuidad | Horas/día promedio del último mes reportado, agregado por suscriptores (RF-TER-03) | h/día | Municipio | FTE-SUI-CONT | mensual | ↓ | Sí, capa S |
| S-2 | IRCA | Último IRCA mensual del municipio | % | Municipio | FTE-INS-IRCA | mensual | ↑ | Sí, capa S |
| S-3 | Cobertura urbana de acueducto | Suscriptores residenciales urbanos / hogares urbanos DANE × 100 | % | Municipio | FTE-SUI-COM, FTE-DANE | anual | ↓ | Sí, capa S |
| S-4 | Agua no contabilizada | IANC del último periodo reportado; IPUF como dato complementario | % | APS → Municipio | FTE-SUI-COM | anual / mensual | ↑ | Sí, capa S |
| S-5 | Variación de PQR por falta de servicio | (PQR mes − PQR mismo mes año anterior) / PQR mismo mes año anterior × 100 | % | Municipio | FTE-SUI-PQR | mensual | ↑ | Sí, capa S |
| S-6 | Consumo facturado por suscriptor | m³ facturados residenciales / suscriptores residenciales | m³/suscr./mes | Municipio | FTE-SUI-COM | mensual | — | No (informativo) |
| R-1 | PEC reportado | 1 si todos los prestadores de acueducto del municipio tienen PEC reportado vigente; 0 si alguno no | binario | Municipio | FTE-SUI-PEC | semanal | ↓ | Sí, capa R |
| R-2 | Abastecimiento alterno activo | 1 si hay carrotanques u otra fuente alterna operando según UNGRD | binario | Municipio | FTE-UNGRD | diario | ↑ | Sí, capa R |
| R-3 | Racionamiento o desabastecimiento reportado | 1 si hay reporte vigente en los últimos 30 d | binario | Municipio | FTE-MVCT-AFECT | diario | ↑ | Sí, capa R |
| R-4 | Calamidad pública por desabastecimiento | 1 si hay declaratoria vigente | binario | Municipio | FTE-UNGRD | diario | ↑ | Sí, capa R |

## Umbrales de normalización

Cada indicador cuantitativo del ICR tiene 5 puntos de quiebre. El valor en el punto se transforma al puntaje indicado y entre puntos se interpola linealmente (fórmula en `specs/indice-riesgo.md`, RF-ICR-01).

| Código | Óptimo → 0 | Amarilla → 40 | Naranja → 60 | Roja → 75 | Extremo → 100 |
|---|---|---|---|---|---|
| A-3 | 0 % | −20 % | −40 % | −60 % | −90 % |
| A-4 | 0 d | 10 d | 20 d | 30 d | 60 d |
| H-1 | 100 % | 70 % | 50 % | 30 % | 10 % |
| H-4 | 36 h | 24 h | 12 h | 6 h | 0 h |
| S-1 | 24 h | 22 h | 18 h | 12 h | 4 h |
| S-2 | 0 | 5 | 14 | 35 | 80 |
| S-3 | 100 % | 95 % | 85 % | 70 % | 40 % |
| S-4 | 20 % | 30 % | 40 % | 50 % | 70 % |
| S-5 | 0 % | 25 % | 50 % | 100 % | 300 % |

Indicadores categóricos:

| Código | Muy bajo | Bajo | Moderado / Medio | Alto | Muy alto | Crítico |
|---|---|---|---|---|---|---|
| H-2 | 0 | 15 | 40 | 65 | 90 | — |
| H-3 | 0 | 15 | 40 | 65 | 90 | 100 |

> **ASUNCIÓN (sin validar):** El Índice de Uso del Agua en año seco del ENA 2014 tiene la categoría «Crítico», por encima de «Muy alto». Se le asigna 100 (extremo de la escala) para que una subzona crítica no quede como `sin_dato` (Q-IND-04). Fuentes vigentes: H-2 = IVH año seco por subzona, ENA 2010; H-3 = IUA año seco por subzona, ENA 2014 (servicio `Indicadores_Hidricos` del IDEAM), en la subzona que contiene la cabecera.

Binarios (R-n): ver RF-ICR-03.

> **ASUNCIÓN (sin validar):** Todos los umbrales salvo S-2 son propuestas del prototipo, no normativos. Los de S-2 siguen las bandas del IRCA de la Res. 2115 de 2007. Calibrar con datos de El Niño 2014-2016 y 2023-2024 antes de pasar a `validado` (Q-IND-02). Los umbrales viven en `config.umbral` y NO DEBEN quedar en código.

## Requisitos funcionales

### RF-IND-01 — Cálculo por corte

CUANDO se ejecuta un corte, el sistema DEBE calcular cada indicador del catálogo para cada municipio con el último dato válido disponible a la `fecha_corte`, y registrar valor, unidad, `fecha_dato`, fuente, `_captura_id` y frescura en `oro.fct_indicador_municipio`.

```gherkin
Escenario: Continuidad con dato de dos meses atrás
  Dado el último reporte de continuidad de "20001" con fecha_dato 2026-08-31 y valor 15,5 h/día
  Cuando se calcula el corte del 2026-10-08
  Entonces S-1 de "20001" = 15,5 con fecha_dato 2026-08-31 y frescura "desactualizado"
```

**Prioridad:** debe

### RF-IND-02 — Línea base de precipitación

El sistema DEBE calcular la línea base de A-3 como la media de la precipitación acumulada en la misma ventana de 30 días del calendario para los años 1991-2020 de cada municipio. SI hay menos de 15 años con dato, ENTONCES A-3 es `sin_dato`.

> **ASUNCIÓN (sin validar):** Periodo de referencia 1991-2020 (normal climatológica OMM vigente). Confirmar con IDEAM qué normal usa en sus boletines.

> **Implementación v1 (2026-11-08):** la red automática del IDEAM en datos abiertos (`s54a-sgyg`) solo tiene datos desde 2003 y, en la ventana de 30 días, pocas estaciones superan 15 años en 1991-2020 (Riohacha: 5). Por eso la línea base es la **normal climatológica oficial 1991-2020 del IDEAM** (`nsz2-kzcq`, Directriz OMM 1203), mensual y prorrateada por los días de cada mes de la ventana, promediada por municipio con la regla RF-TER-04. La lluvia observada exige 27 de 30 días con dato municipal. Parámetros en `data/config/parametros_ideam.json`.

```gherkin
Escenario: Déficit del 50 %
  Dado la línea base de "15001" para el 2026-09-09 a 2026-10-08 de 80 mm
  Y la lluvia observada de 40 mm
  Cuando se calcula A-3
  Entonces A-3 = −50 %
```

**Prioridad:** debe

### RF-IND-03 — Indicadores de contexto nacional

El sistema DEBE calcular A-1 y A-2 una sola vez por corte en `oro.fct_amenaza_global`, incluyendo Niño 1+2, Niño 3, Niño 3.4 y Niño 4 semanales, el estado de alerta de NOAA y la fecha de la última discusión.

```gherkin
Escenario: Nueva discusión de CPC
  Dado una captura nueva de FTE-CPC-PROB con estado "El Niño Advisory" y fecha 2026-10-08
  Cuando se calcula el corte
  Entonces fct_amenaza_global muestra estado "Advertencia de El Niño" y fecha de discusión 2026-10-08
```

**Prioridad:** debe

### RF-IND-04 — Indicadores binarios sin dato

SI una fuente de un indicador binario R-n no tiene información para un municipio, ENTONCES el valor DEBE quedar `sin_dato` y NO DEBE asumirse 0.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-IND-01 — Catálogo editable sin despliegue

Agregar o desactivar un indicador del catálogo DEBE poder hacerse por configuración más un modelo dbt, sin modificar `riesgo/` ni `web/`.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-IND-01 | Los códigos de indicador son estables y NUNCA se reciclan | catálogo |
| RN-IND-02 | Solo se usan datos con estado_calidad `valido` | todos |
| RN-IND-03 | A-1 y A-2 no modifican el ICR municipal; se muestran como contexto | `specs/indice-riesgo.md` |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| PQR del año anterior = 0 | Si PQR del mes > 0, S-5 = extremo (300 %); si ambos 0, S-5 = 0 % |
| Municipio con varios embalses | H-5 = media ponderada por volumen útil máximo |
| IRCA no reportado en el mes | Se usa el último disponible con su frescura |

## Fuera de alcance de esta spec

Indicadores de alcantarillado y aseo (RES-03). Pronósticos de lluvia a futuro como indicador municipal (Q-IND-03).

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-IND-01 | ¿Existe fuente oficial de almacenamiento y demanda por sistema para H-4? Si no, H-4 queda `sin_dato` y su peso se redistribuye | H-4 | CRA / SSPD |
| Q-IND-02 | ¿Quién valida los umbrales y con qué datos históricos? | Estado `validado` | CRA – Subdirección de Regulación |
| Q-IND-03 | ¿Incluir la predicción climática mensual de IDEAM como indicador A-6? | — | Camilo |
| Q-IND-04 | ¿Qué puntaje corresponde a la categoría «Crítico» del IUA (ENA 2014)? Se asumió 100 | H-3 | CRA / IDEAM |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo |
