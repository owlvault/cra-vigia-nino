# Responder a la ciudadanía (modo ciudadano)

Esta guía aplica **solo al canal ciudadano**. El canal interno de la CRA se mantiene con todo su contenido técnico; ver la tabla «Dos canales» en `SKILL.md`. Especificación: `context-lake/specs/canal-ciudadano.md` (RF-CIU-01 a RF-CIU-10).

> **Marco: `context-lake/adr/ADR-0006-canal-ciudadano.md` (aceptada 2026-11-07).** Habilita un canal ciudadano de solo lectura sobre el subconjunto de información de esta guía. El canal **no está en producción** hasta cumplir C-CIU-01 a C-CIU-04: clasificación de la información (Q-SEG-01), `specs/canal-ciudadano.md` (aún no existe), corte que pase la compuerta y cero datos del prototipo visibles. Mientras tanto, toda respuesta aclara que es **información de análisis de la CRA, no una declaratoria oficial**.

---

## Reglas de respuesta

1. **Lenguaje claro, sin códigos.** Di «horas de servicio de agua al día», no «S-1». Di «calidad del agua», no «IRCA S-2», salvo que el ciudadano use el término.
2. **Siempre di fuente y fecha del dato** en la misma frase: «Según el SUI de la Superservicios, con datos de agosto de 2026, …».
3. **Si no hay dato, dilo.** «No tenemos información verificada sobre racionamiento en tu municipio» es distinto de «no hay racionamiento». Nunca conviertas `sin_dato` en «no».
4. **No uses la palabra «alerta» a secas.** En Colombia, las alertas amarilla, naranja y roja son avisos oficiales del IDEAM y de los consejos de gestión del riesgo. El nivel de Vigía es un **nivel de riesgo analítico**. Di: «nivel de riesgo alto (naranja) según el análisis de la CRA».
5. **No alarmes ni minimices.** Da el dato, su fecha y qué significa. No hagas predicciones propias ni recomendaciones operativas (cortes, carrotanques): están fuera del alcance del sistema.
6. **Remite a los canales oficiales** para decisiones prácticas:
   - Horarios de suministro o racionamiento: el prestador del servicio de acueducto y la alcaldía.
   - Emergencias: el consejo municipal de gestión del riesgo y la UNGRD.
   - Pronóstico y alertas climáticas: el IDEAM.
   - Quejas por el servicio: el prestador y, en segunda instancia, la Superintendencia de Servicios Públicos Domiciliarios.
7. **Solo hay 23 municipios.** Si preguntan por otro, di que todavía no está en el análisis. No uses un municipio vecino como sustituto.
8. **No presentes el ICR nacional como «el riesgo de Colombia».** Es el de 23 municipios, y Bogotá pesa casi la mitad.

---

## Indicadores recomendados para la ciudadanía

Se eligieron por dos criterios: que respondan una pregunta concreta de un hogar y que el dato **hoy** sea confiable.

### Recomendados

| Pregunta ciudadana | Indicador | Cómo presentarlo | Advertencia obligatoria |
|---|---|---|---|
| ¿Qué tan en riesgo está el agua de mi municipio? | `nivel_alerta` del corte diario | Bajo (`sin_alerta`), Medio (`amarilla`), Alto (`naranja`), Muy alto (`roja`), Sin información (`sin_dato`) (RF-CIU-04) | «Nivel de riesgo analítico de la CRA, no alerta oficial.» Da la fecha del corte. |
| ¿El agua de la llave es segura? | S-2 IRCA, con las bandas de la Res. 2115 de 2007: 0-5 sin riesgo; 5,1-14 bajo; 14,1-35 medio; 35,1-80 alto; 80,1-100 inviable sanitariamente | Banda en palabras + valor | **El dato es anual de 2024.** Dilo siempre; no describe el agua de hoy. |
| ¿Cuántas horas al día tengo agua? | S-1 continuidad (h/día) | «En promedio, X horas al día» | Promedio municipal del SUI, periodo 2026-08; puede variar por barrio y prestador. |
| ¿Hay racionamiento o calamidad declarada? | R-3 racionamiento, R-4 calamidad pública | «Sí, con soporte oficial» (1) / «No, verificado» (0) / «Sin información verificada» (`null`) | RF-CIU-05: `null` nunca se dice «no». |
| ¿Cómo están los embalses? | `EMBALSES_NAL_PCT` y `EMBALSE_BOGOTA_PCT` (semanal, XM) | % de volumen útil y si sube o baja frente a la semana anterior | Son embalses de generación eléctrica del SIN; solo algunos abastecen acueductos. |
| ¿El Niño sigue fuerte? | `NINO34_SSTA` (semanal) y `ONI` (trimestral), NOAA | Anomalía en °C, con la categoría de intensidad | El IDEAM es la autoridad nacional: remite a su boletín. |

### No recomendados para la ciudadanía (por ahora)

| Indicador | Motivo |
|---|---|
| ICR numérico (0-100) y subíndices | Es una construcción técnica con pesos sin validar (Q-ICR-01); el nivel comunica mejor. |
| A-3 anomalía de lluvia, A-4 días sin lluvia, H-1 caudal | Hoy salen de un catálogo estático, no de mediciones diarias (hallazgo 1 de la auditoría). Recomendables cuando se conecten datos reales del IDEAM. |
| A-2 probabilidad de un Niño muy fuerte | Valor transcrito a mano en el conector, sin captura automática. |
| S-4 IANC, S-5 PQR, H-4 autonomía, `cobertura_datos_pct` | Técnicos; no responden una pregunta de hogar. |
| `poblacion_en_riesgo_critico`, ICR nacional | Se calculan sobre 23 municipios y con poblaciones del prototipo, no del DANE. |

### Métrica de éxito sugerida para el canal ciudadano

- **Porcentaje de respuestas con fuente y fecha**: meta 100 %. Es el requisito regulatorio RES-05 aplicado al público.
- **Porcentaje de preguntas sobre municipios fuera de la muestra**: indica qué municipios ampliar primero.

---

## Regionalización recomendada

**Criterio:** usar divisiones que el Estado colombiano define con código oficial y que el ciudadano reconoce.

| Uso | División recomendada | Autoridad | Por qué |
|---|---|---|---|
| **Principal**: agregar y presentar | **Departamento** (`cod_depto` de DIVIPOLA) | DANE | División político-administrativa oficial, sin ambigüedad, ya presente en todos los datos. El ciudadano sabe en qué departamento vive. |
| **Hidrológica**: explicar el efecto de El Niño sobre el agua | **Área hidrográfica** del IDEAM: Caribe, Magdalena-Cauca, Orinoco, Amazonas y Pacífico. Para detalle, zona y subzona. | IDEAM (zonificación hidrográfica) | Es la unidad con que el IDEAM emite boletines y alertas, y la que usa el Estudio Nacional del Agua (ENA), de donde salen H-2 y H-3. El agua sigue cuencas, no límites políticos. |
| Solo descriptiva | Región natural (Caribe, Andina, Pacífica, Orinoquía, Amazonía, Insular) | — | Útil como etiqueta geográfica familiar, pero no tiene códigos ni límites oficiales para agregar. Es la que usa hoy `territorio_municipios.json`, sin validar. |
| **No usar** para agregar | Regiones del Plan Nacional de Desarrollo y Regiones Administrativas y de Planificación (RAP) | DNP; Ley 1454 de 2011 y Ley 1962 de 2019 | Las RAP son asociaciones voluntarias de departamentos; su composición cambia y no cubre todo el país. No se encontró una fuente oficial con la agrupación departamental de las regiones del PND 2022-2026. |

**Regla de asignación al área hidrográfica (RF-TER-08):** cada municipio se asigna a la subzona que contiene su **cabecera municipal**, la misma regla que H-2. El cruce ya existe:
- **Archivo:** `data/config/territorio_hidrografico.json`, generado por `ingesta/territorio/cruce_hidrografico.py`.
- **Fuentes:** cabeceras de la DIVIPOLA del DANE (corte 2024-12-30) y la capa «Zonificación Hidrográfica 2025» del IDEAM.
- **En el corte:** cada municipio trae `area_hidrografica`, `zona_hidrografica` y `subzona_hidrografica`, con sus códigos.
- **Si un municipio está `no_resuelto` o el campo viene `null`:** no lo deduzcas por el nombre del río ni del departamento; presenta solo el departamento.

Ejemplo de respuesta: «Ibagué (Tolima) se abastece en la zona del Alto Magdalena, subzona del río Totare, según la zonificación hidrográfica del IDEAM».
