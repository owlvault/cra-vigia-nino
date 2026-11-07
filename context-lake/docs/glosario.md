---
id: glosario
tipo: glosario
proyecto: vigia-nino-acueductos
estado: en_produccion
actualizado: 2026-10-14
fuentes: [prototipo, NOAA CPC, Res. MinSalud 2115 de 2007, MinVivienda, DANE, SSPD SUI, Auditoría Forense CRA 2026-10-14]
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
| Zonificación hidrográfica | División oficial del IDEAM en áreas (Caribe, Magdalena-Cauca, Orinoco, Amazonas, Pacífico), zonas y subzonas hidrográficas. Cada municipio se asigna a la subzona que contiene su cabecera. | cuenca (salvo en sentido técnico), región hídrica | `specs/modelo-territorial.md` RF-TER-08 |
| Región natural | Agrupación geográfica descriptiva (Caribe, Andina, Pacífica, Orinoquía, Amazonía, Insular). No es unidad de agregación oficial del sistema. | región (a secas) | tablero interno |
| APS | Área de Prestación de Servicio de un prestador en un municipio. | sistema, mercado | `specs/modelo-territorial.md` |
| Prestador | Persona prestadora del servicio de acueducto inscrita en el RUPS. | operador, empresa, ESP (salvo cuando sea su razón social) | `specs/ingesta-fuentes.md` |
| RUPS | Registro Único de Prestadores de Servicios Públicos, administrado por la SSPD. | — | `specs/ingesta-fuentes.md` |
| SUI | Sistema Único de Información de la SSPD. Fuente primaria oficial para continuidad, pérdidas, cobertura, autonomía y consumo. | — | `specs/ingesta-fuentes.md`, H-4, S-6 |
| Extracto Oficial SUI | Extracto estructurado y certificado de indicadores del SUI para prestadores de acueducto municipal depositado en la zona Bronce inmutable. | diccionario base, datos quemados | `ingesta/conectores/conector_sui.py` |
| IRCA | Índice de Riesgo de la Calidad del Agua para consumo humano, 0-100 %, Res. 2115 de 2007. Bandas: 0-5 sin riesgo; 5,1-14 bajo; 14,1-35 medio; 35,1-80 alto; 80,1-100 inviable sanitariamente. | índice de calidad | S-2 |
| IANC | Índice de Agua No Contabilizada, %. | pérdidas % | S-4 |
| IPUF | Índice de Pérdidas por Usuario Facturado, m³/suscriptor/mes. | — | S-4 |
| Continuidad | Horas promedio por día con servicio de acueducto en el municipio. | disponibilidad | S-1 |
| Autonomía de Almacenamiento (H-4) | Días de suministro garantizados por la capacidad útil de almacenamiento del sistema frente a la demanda media diaria. | capacidad de reserva | H-4 |
| Consumo de Agua (S-6) | Dotación o consumo promedio por suscriptor en m³/mes, normalizado respecto a los topes de consumo básico CRA. | gasto hídrico | S-6 |
| PEC | Plan de Emergencia y Contingencia del prestador para el servicio de acueducto. | plan de contingencia, PGRD | R-1 |
| Indicador | Medida definida en `specs/indicadores.md` con código A-n, H-n, S-n o R-n. | KPI, métrica (salvo métricas de éxito MET-n) | todos |
| Capa | Agrupación de indicadores: A amenaza, H oferta hídrica, S servicio, R respuesta. | dimensión, componente | `specs/indice-riesgo.md` |
| ICR | Índice Compuesto de Riesgo por municipio, 0-100. | índice de riesgo, score | `specs/indice-riesgo.md` |
| Nivel de alerta | Categoría derivada del ICR: sin alerta, amarilla, naranja, roja. | semáforo, estado | `specs/alertas.md` |
| Alerta | Evento generado cuando un municipio sube de nivel de alerta entre dos cortes. | notificación (la notificación es el envío de la alerta) | `specs/alertas.md` |
| Corte | Conjunto de indicadores e ICR calculados y publicados para una fecha. | snapshot, carga | todos |
| Bronce / Plata / Oro | Zonas de datos: crudo inmutable con SHA-256 / normalizado y validado / indicadores listos para consumo. | raw, staging, mart | `docs/architecture.md` |
| Frescura | Tiempo entre la fecha del dato en la fuente y la fecha del corte. | actualidad, latencia | `specs/calidad-datos.md` |
| Línea base | Valor del indicador para el mismo periodo en un año sin El Niño fuerte, usado para anomalías. | promedio histórico | `specs/indicadores.md` |
| Auditor de Veracidad | Componente independiente que certifica la correspondencia estricta entre Bronce y Oro, recalculando hashes criptográficos y validando reglas RN-CAL. | validador sintáctico | `auditoria/` |
| Certificado Fehaciente | Veredicto regulatorio oficial emitido cuando la tasa de veracidad es 100%, todos los hashes coinciden y no existen datos no respaldados. | reporte de pruebas | `auditoria/` |
| Almacén Histórico | Repositorio persistente de snapshots semanales de trayectorias observadas y modeladas para auditoría temporal. | bitácora, log | `ingesta/semanal/` |
| Evento Análogo | Episodio histórico de El Niño (2015-16, 2023-24, 2009-10) seleccionado por menor distancia euclidiana multivariada ponderada para proyectar trayectorias. | escenario similar | `ingesta/semanal/` |
| Sincronización Atómica UI | Escritura concurrente y atómica de `corte_vigente.json`, `data.js` y `vigia_corte_actualizado_arcgis.geojson` para prevenir inconsistencias de renderizado. | exportación, copia | `ingesta/pipeline_corte.py` |

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-GLO-01 | ¿La CRA usa oficialmente "APS" o "Área de Servicio Exclusivo"/"sistema" en sus documentos de análisis? | `specs/modelo-territorial.md` | CRA – Subdirección de Regulación |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo y fuentes oficiales |
| 2026-10-14 | Incorporación de términos de auditoría forense, extracto oficial SUI, almacén histórico, eventos análogos y sincronización atómica. | Auditoría Forense CRA 2026-10-14 |
