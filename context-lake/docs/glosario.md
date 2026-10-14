---
id: glosario
tipo: glosario
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo, NOAA CPC, Res. MinSalud 2115 de 2007, MinVivienda, DANE]
---

# Glosario — Vigía El Niño · Acueductos

| Término canónico | Definición | Sinónimos que NO usar | Se usa en |
|---|---|---|---|
| El Niño | Fase cálida del ciclo ENOS. En este sistema solo se modela su impacto por déficit de lluvia. | Fenómeno del Niño, FEN, ENSO cálido | todos |
| ENOS | El Niño – Oscilación del Sur. | ENSO (solo en nombres de fuentes en inglés) | `specs/indicadores.md` |
| Índice Niño 3.4 | Anomalía de temperatura superficial del mar (TSM) en 5°N-5°S, 170°W-120°W, en °C. | Niño34, N3.4 | `specs/indicadores.md` |
| ONI | Oceanic Niño Index: media móvil de 3 meses del Niño 3.4. Índice oficial usado por IDEAM. | — | A-1 |
| RONI | Relative ONI: Niño 3.4 menos la media tropical, reescalado. Usado por NOAA CPC desde 2025-2026 para intensidad. | ONI relativo | A-1, A-2 |
| TSM | Temperatura superficial del mar. | SST (solo en nombres de fuente) | Capa 1 |
| Municipio | Entidad territorial identificada por código DIVIPOLA de 5 dígitos. Incluye Bogotá D.C. y las áreas no municipalizadas. | ciudad, localidad, ente territorial | todos |
| Área no municipalizada (ANM) | Unidad territorial DIVIPOLA sin categoría de municipio. Se trata como Municipio en el modelo. | corregimiento departamental | `specs/modelo-territorial.md` |
| DIVIPOLA | Codificación oficial del DANE: 2 dígitos departamento + 3 dígitos municipio. Llave territorial única del sistema. | código DANE, código municipal | `specs/modelo-territorial.md` |
| APS | Área de Prestación de Servicio de un prestador en un municipio. | sistema, mercado | `specs/modelo-territorial.md` |
| Prestador | Persona prestadora del servicio de acueducto inscrita en el RUPS. | operador, empresa, ESP (salvo cuando sea su razón social) | `specs/ingesta-fuentes.md` |
| RUPS | Registro Único de Prestadores de Servicios Públicos, administrado por la SSPD. | — | `specs/ingesta-fuentes.md` |
| SUI | Sistema Único de Información de la SSPD. | — | `specs/ingesta-fuentes.md` |
| IRCA | Índice de Riesgo de la Calidad del Agua para consumo humano, 0-100 %, Res. 2115 de 2007. Bandas: 0-5 sin riesgo; 5,1-14 bajo; 14,1-35 medio; 35,1-80 alto; 80,1-100 inviable sanitariamente. | índice de calidad | S-2 |
| IANC | Índice de Agua No Contabilizada, %. | pérdidas % | S-4 |
| IPUF | Índice de Pérdidas por Usuario Facturado, m³/suscriptor/mes. | — | S-4 |
| Continuidad | Horas promedio por día con servicio de acueducto en el municipio. | disponibilidad | S-1 |
| PEC | Plan de Emergencia y Contingencia del prestador para el servicio de acueducto. | plan de contingencia, PGRD | R-1 |
| Indicador | Medida definida en `specs/indicadores.md` con código A-n, H-n, S-n o R-n. | KPI, métrica (salvo métricas de éxito MET-n) | todos |
| Capa | Agrupación de indicadores: A amenaza, H oferta hídrica, S servicio, R respuesta. | dimensión, componente | `specs/indice-riesgo.md` |
| ICR | Índice Compuesto de Riesgo por municipio, 0-100. | índice de riesgo, score | `specs/indice-riesgo.md` |
| Nivel de alerta | Categoría derivada del ICR: sin alerta, amarilla, naranja, roja. | semáforo, estado | `specs/alertas.md` |
| Alerta | Evento generado cuando un municipio sube de nivel de alerta entre dos cortes. | notificación (la notificación es el envío de la alerta) | `specs/alertas.md` |
| Corte | Conjunto de indicadores e ICR calculados y publicados para una fecha. | snapshot, carga | todos |
| Bronce / Plata / Oro | Zonas de datos: crudo inmutable / normalizado y validado / indicadores listos para consumo. | raw, staging, mart | `docs/architecture.md` |
| Frescura | Tiempo entre la fecha del dato en la fuente y la fecha del corte. | actualidad, latencia | `specs/calidad-datos.md` |
| Línea base | Valor del indicador para el mismo periodo en un año sin El Niño fuerte, usado para anomalías. | promedio histórico | `specs/indicadores.md` |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-GLO-01 | ¿La CRA usa oficialmente "APS" o "Área de Servicio Exclusivo"/"sistema" en sus documentos de análisis? | `specs/modelo-territorial.md` | CRA – Subdirección de Regulación |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo y fuentes oficiales |
