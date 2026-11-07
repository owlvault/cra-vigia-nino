---
id: spec-canal-ciudadano
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-11-07
fuentes: [ADR-0006, decisión de Camilo Carvajalino 2026-11-07 (mantener canal interno y canal ciudadano), docs/auditoria/04_auditoria_modelo_datos.md, specs/calidad-datos.md, specs/modelo-territorial.md RF-TER-08]
---

# Spec — Canal ciudadano y su coexistencia con el canal interno

## Propósito

Definir cómo se entrega a la ciudadanía un subconjunto de la información de Vigía sin alterar el canal interno de la CRA, y bajo qué reglas de contenido, lenguaje y calidad. NO define el medio de entrega (página web, asistente conversacional u otro; Q-CIU-01) ni cambia el cálculo de indicadores o del ICR.

## Contexto relevante

- Decisión: `adr/ADR-0006-canal-ciudadano.md`
- Canal interno: `specs/tablero-ui.md` (V-01 a V-07), `specs/comparativo-semanal.md` (V-08), `specs/seguridad-acceso.md`
- Calidad y compuerta: `specs/calidad-datos.md` → RF-CAL-03, RF-CAL-04
- Territorio: `specs/modelo-territorial.md` → RF-TER-08
- Términos: `docs/glosario.md` → Nivel de alerta, Frescura, Zonificación hidrográfica

## Los dos canales

| | Canal interno | Canal ciudadano |
|---|---|---|
| Público | ACT-COMISIONADO, ACT-ANALISTA, ACT-ADMIN-DATOS | ACT-CIUDADANO (nuevo): cualquier persona, sin autenticación |
| Contenido | Todo: ICR, capas, 20 indicadores, alertas, fuentes, configuración, comparativo semanal | Solo la lista blanca de RF-CIU-03 |
| Vocabulario | Técnico: ICR, «alerta amarilla/naranja/roja», códigos A-n…R-n | Lenguaje claro: «nivel de riesgo», sin códigos |
| Acceso | OIDC/Keycloak, red CRA (`specs/seguridad-acceso.md`) | Público, solo lectura |
| Fuente de datos | Corte publicado en oro | Vista ciudadana derivada del **mismo** corte publicado |
| Cambios | Gobernados por sus specs actuales | Gobernados por esta spec |

## Actor nuevo

| ID | Actor | Rol | Qué puede hacer | Qué NO puede hacer |
|---|---|---|---|---|
| ACT-CIUDADANO | Persona interesada en el agua de su municipio | externo | Consultar la vista ciudadana | Ver el canal interno, el ICR numérico, la configuración ni datos excluidos; escribir nada |

## Requisitos funcionales

### RF-CIU-01 — Coexistencia sin interferencia

El sistema DEBE mantener el canal interno con todo su contenido y funcionamiento actuales, y el canal ciudadano NO DEBE modificar, filtrar ni retrasar ningún artefacto del canal interno (`corte_vigente.json`, `data.js`, GeoJSON, corte semanal, alertas).

```gherkin
Escenario: El canal interno no pierde información
  Dado un corte publicado con ICR, subíndices y los 20 indicadores
  Cuando se genera la vista ciudadana
  Entonces corte_vigente.json conserva ICR, subíndices y los 20 indicadores sin cambios

Escenario: Falla la vista ciudadana
  Dado que la generación de la vista ciudadana falla
  Cuando termina la publicación del corte
  Entonces el corte interno queda publicado igual
  Y ACT-ADMIN-DATOS recibe el motivo de la falla de la vista ciudadana
```

**Prioridad:** debe

### RF-CIU-02 — Una sola fuente de verdad

CUANDO se publica un corte con estado `PUBLICADO_VALIDO`, el sistema DEBE generar la vista ciudadana exclusivamente a partir de ese corte (y del corte semanal vigente para embalses y El Niño), y NO DEBE generarla a partir de cortes `RECHAZADO` ni recalcular valores por su cuenta.

```gherkin
Escenario: Corte rechazado
  Dado que el corte del 2026-11-08 queda RECHAZADO
  Cuando termina el ciclo diario
  Entonces la vista ciudadana sigue siendo la del último corte publicado
  Y muestra la fecha de ese corte

Escenario: Mismo valor en ambos canales
  Dado que S-1 de "47001" vale 14,2 h/día en el corte publicado
  Cuando se consulta la vista ciudadana de "47001"
  Entonces las horas de servicio al día son 14,2
```

**Prioridad:** debe

### RF-CIU-03 — Lista blanca de contenido

La vista ciudadana DEBE contener solo la información habilitada en `config.canal_ciudadano` (versionada, regla de oro 3). La lista inicial es:

| Clave | Origen | Presentación |
|---|---|---|
| `nivel_riesgo` | `nivel_alerta` del municipio | Etiqueta de RF-CIU-04 |
| `calidad_agua` | S-2 | Banda de la Res. 2115 de 2007 + valor + año del dato |
| `horas_servicio` | S-1 | Horas/día + periodo del dato |
| `racionamiento` | R-3 | RF-CIU-05 |
| `calamidad_publica` | R-4 | RF-CIU-05 |
| `embalses` | `EMBALSES_NAL_PCT`, `EMBALSE_BOGOTA_PCT` del corte semanal | % y tendencia frente a la semana anterior |
| `estado_el_nino` | `NINO34_SSTA`, `ONI` del corte semanal | Anomalía °C + intensidad + remisión al IDEAM |

El sistema NO DEBE incluir en la vista ciudadana el ICR numérico, los subíndices, `cobertura_datos_pct`, ni los indicadores A-2, A-3, A-4, A-5, H-1 a H-5, S-3 a S-6, R-1, R-2, la población en riesgo ni el ICR nacional, salvo que `config.canal_ciudadano` los habilite en una nueva versión.

```gherkin
Escenario: Campo no habilitado
  Dado que A-3 no está habilitado en config.canal_ciudadano
  Cuando se genera la vista ciudadana
  Entonces ningún municipio de la vista contiene A-3 ni el ICR numérico
```

**Prioridad:** debe

### RF-CIU-04 — Vocabulario del nivel de riesgo

El sistema DEBE presentar el nivel con las etiquetas de `config.canal_ciudadano`, inicialmente: `sin_alerta` → «Bajo», `amarilla` → «Medio», `naranja` → «Alto», `roja` → «Muy alto», `sin_dato` → «Sin información». El texto visible del canal ciudadano NO DEBE usar la palabra «alerta» para el nivel de Vigía.

```gherkin
Escenario: Municipio en naranja
  Dado "44001" con nivel_alerta "naranja"
  Cuando se consulta en el canal ciudadano
  Entonces su nivel de riesgo se muestra como "Alto"
  Y el texto no contiene la palabra "alerta"
```

**Prioridad:** debe

### RF-CIU-05 — Sin dato no es «no»

SI un valor de la lista blanca es `sin_dato`, ENTONCES la vista ciudadana DEBE mostrar «Sin información verificada» y NO DEBE mostrar «No», «0» ni omitir el campo. Para R-3 y R-4, el valor 1 DEBE mostrarse «Sí, con soporte oficial» y el 0 «No, verificado».

```gherkin
Escenario: Racionamiento sin registro
  Dado R-3 de "47555" con valor null
  Cuando se consulta en el canal ciudadano
  Entonces racionamiento muestra "Sin información verificada"

Escenario: Calamidad verificada
  Dado R-4 de "44847" con valor 1
  Cuando se consulta en el canal ciudadano
  Entonces calamidad pública muestra "Sí, con soporte oficial"
```

**Prioridad:** debe

### RF-CIU-06 — Fuente, fecha y frescura en cada dato

Cada dato de la vista ciudadana DEBE llevar la entidad fuente en lenguaje claro (p. ej. «Superintendencia de Servicios Públicos – SUI»), la fecha o el periodo del dato y, si su frescura es `desactualizado`, la advertencia «Dato con fecha [periodo]; puede no reflejar la situación actual». Para los datos semanales (embalses, El Niño) la advertencia aplica cuando el dato supera `dias_max_dato_semanal_sin_advertencia` días.

```gherkin
Escenario: IRCA anual
  Dado S-2 de "44847" con fecha_dato 2024-12-31 y frescura "desactualizado"
  Cuando se consulta la calidad del agua
  Entonces se muestra la banda, el valor, "INS – SIVICAP", "2024"
  Y la advertencia de dato desactualizado
```

**Prioridad:** debe

### RF-CIU-07 — Aviso de alcance y canales oficiales

Toda consulta del canal ciudadano DEBE mostrar el aviso de `config.canal_ciudadano` que indica que es un análisis de la CRA y no una alerta ni una declaratoria oficial, y DEBE remitir al prestador, la alcaldía, la UNGRD y el IDEAM según el tema.

**Prioridad:** debe

### RF-CIU-08 — Unidad territorial

La vista ciudadana DEBE organizarse por departamento y municipio (DIVIPOLA) e informar, cuando esté resuelta, la zona y la subzona hidrográfica del IDEAM (RF-TER-08). NO DEBE agrupar por región natural.

```gherkin
Escenario: Zona hidrográfica resuelta
  Dado "73001" con subzona hidrográfica "Río Totare"
  Cuando se consulta Ibagué
  Entonces se muestra "Tolima" y "Alto Magdalena – Río Totare"

Escenario: Zona no resuelta
  Dado un municipio con zonificación no_resuelto
  Cuando se consulta
  Entonces se muestra solo el departamento, sin zona hidrográfica
```

**Prioridad:** debe

### RF-CIU-09 — Municipio fuera de la muestra

CUANDO ACT-CIUDADANO consulta un municipio que no está en el corte publicado, el sistema DEBE informar que ese municipio aún no está incluido en el análisis y NO DEBE mostrar datos de otro municipio ni del departamento como si fueran suyos. Puede ofrecer, rotulado como tal, el resumen de su departamento si existe.

**Prioridad:** debe

### RF-CIU-10 — Compuerta de exposición ciudadana

El sistema DEBE generar la vista ciudadana con un estado `publicable` o `no_publicable` y la lista de condiciones incumplidas de ADR-0006 (C-CIU-01 a C-CIU-04). Como parte de C-CIU-03, un corte calculado con una configuración del ICR anterior a `version_minima_configuracion_icr` es `no_publicable`: esos cortes registraban R-2/R-3/R-4 = 0 sin verificación. El medio de entrega NO DEBE exponer una vista `no_publicable`. Los agregados que dependen de población NO DEBEN incluirse mientras la población no provenga de las proyecciones del DANE (C-CIU-04).

```gherkin
Escenario: Clasificación pendiente
  Dado que Q-SEG-01 no está resuelta
  Cuando se genera la vista ciudadana
  Entonces su estado es "no_publicable" con motivo "C-CIU-01 clasificación de información pendiente"
  Y el canal interno sigue operando normalmente
```

**Prioridad:** debe

## Requisitos no funcionales

### RNF-CIU-01 — Lenguaje claro

Los textos del canal ciudadano DEBEN seguir la Guía de Lenguaje Claro del DNP para servidores públicos y vivir en `config.canal_ciudadano`, no en código. Ningún texto visible DEBE contener códigos internos (A-n, H-n, S-n, R-n, ICR, DIVIPOLA).

### RNF-CIU-02 — Separación técnica

El canal ciudadano DEBE leer solo la vista ciudadana; NO DEBE tener acceso a la base, a los endpoints ni a los archivos del canal interno.

### RNF-CIU-03 — Privacidad

El canal ciudadano NO DEBE requerir ni almacenar datos personales del ciudadano (Ley 1581 de 2012). Las métricas de uso se registran agregadas.

### RNF-CIU-04 — Accesibilidad e imagen

DEBE cumplir WCAG 2.1 AA y los lineamientos GOV.CO (RES-04), con la identidad de `docs/design_system.md`.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-CIU-01 | La vista ciudadana nunca contiene un valor que no exista en el corte publicado del que deriva | RF-CIU-02 |
| RN-CIU-02 | Agregar un dato a la lista blanca requiere nueva versión de `config.canal_ciudadano` y que el dato provenga de medición real con frescura conocida | RF-CIU-03 |
| RN-CIU-03 | «Sin información verificada» nunca se resume como «no» ni se cuenta como cero | RF-CIU-05 |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| El corte semanal no está disponible | Embalses y El Niño muestran «Sin información verificada» con la fecha del último dato; el resto de la vista se publica |
| Nivel `sin_dato` | «Sin información»; no se ubica al municipio en ningún nivel de riesgo |
| Nivel subido por regla (`nivel_por_regla`) | Se muestra el nivel y la razón en lenguaje claro: «Hay racionamiento o calamidad pública con soporte oficial» |
| Cambio de versión de configuración del ICR | La vista indica la fecha del corte; no compara niveles entre versiones distintas |

## Implementación v1

| Pieza | Ubicación |
|---|---|
| Configuración (lista blanca, etiquetas, textos, condiciones) | `data/config/canal_ciudadano.json` |
| Generador | `ingesta/canal_ciudadano.py`, invocado al final de `PipelineCorte.generar_corte_completo` solo para cortes publicados |
| Salida | `data/oro/ciudadano/vista_vigente.json` y `vista_AAAA-MM-DD.json` |
| Pruebas | `ingesta/tests/test_canal_ciudadano.py` |

## Fuera de alcance de esta spec

El medio de entrega (Q-CIU-01), notificaciones a ciudadanos, consultas personalizadas por dirección o barrio, y cualquier canal de escritura (quejas, reportes): esos van por el prestador y la Superintendencia de Servicios Públicos.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-CIU-01 | ¿Por qué medio se expone el canal: página en el portal CRA, asistente conversacional o ambos? | Implementación del medio | Camilo / Oficina de Comunicaciones CRA |
| Q-CIU-02 | ¿Quién aprueba los textos de `config.canal_ciudadano` (etiquetas, aviso, remisiones)? | RNF-CIU-01 | Oficina de Comunicaciones CRA |
| Q-SEG-01 | Clasificación de la información (Ley 1712 de 2014) | RF-CIU-10, C-CIU-01 | Oficina de Planeación y TIC CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-11-07 | Versión inicial: coexistencia del canal interno y el ciudadano | ADR-0006; decisión de Camilo |
| 2026-11-07 | Implementación v1 de la vista; versión mínima de configuración en C-CIU-03 | Prueba con el corte vigente |
