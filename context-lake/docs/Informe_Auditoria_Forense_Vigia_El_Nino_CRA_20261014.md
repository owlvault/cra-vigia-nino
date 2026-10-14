# **INFORME DE AUDITORÍA TÉCNICA FORENSE Y REQUERIMIENTO DE CORRECCIÓN INMEDIATA**

**PARA:** Dirección de Proyecto / Líder Técnico — Fábrica de Software  
**DE:** Camilo Ernesto Carvajalino Martá — Asesor / Líder de Tecnologías de la Información (CIO)  
ENTIDAD: Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**PROYECTO:** Sistema de Alerta Temprana e Índice Compuesto de Riesgo — Vigía El Niño · Acueductos  
FECHA: 14 de octubre de 2026  
ASUNTO: Dictamen de NO CONFORMIDAD por simulación de datos en conectores de ingesta, tautología en el módulo de auditoría y defectos de sincronización en el Tablero Principal (v1.0.0 / v1.1.0).  
**CONCEPTO TÉCNICO:** RECHAZADO PARA PASO A PRODUCCIÓN / NO APTO PARA TOMA DE DECISIONES REGULATORIAS

# **1\. Objeto y Alcance de la Auditoría**

En ejercicio de las funciones de supervisión técnica y aseguramiento de calidad de la información para la toma de decisiones regulatorias de la CRA, se realizó una inspección forense integral (código fuente, arquitectura medallón en disco `data/bronce`, `data/plata`, `data/oro`, `data/ops` y servicio local en el puerto 8088\) sobre el sistema Vigía El Niño · Acueductos.

El objetivo de la revisión fue verificar el cumplimiento estricto de dos condiciones no negociables:

* Que el **100 % de los datos e indicadores** provenga de fuentes primarias reales, oficiales y trazables en tiempo real o bajo el último corte oficial disponible.  
* Que el **Índice Compuesto de Riesgo (ICR)** y los niveles de alerta municipal sirvan como insumo fidedigno en la vida real para la expedición de medidas regulatorias y articulación interinstitucional durante el fenómeno de El Niño 2026-2027.

# **2\. Dictamen Ejecutivo**

Se declara la **NO CONFORMIDAD CRÍTICA** del entregable actual. Si bien la arquitectura visual del tablero (`tablero/index.html` y `tablero/semanal/index.html`) y la formulación matemática del modelo ICR cumplen con las especificaciones de diseño, **el 65 % de los insumos que alimentan el corte municipal del Tablero Principal están falsificados mediante diccionarios estáticos (hardcoded) dentro del código Python de los conectores**.

Adicionalmente, se evidenció que el módulo Auditor Independiente de Veracidad (auditoria/auditor\_veracidad.py) emite un dictamen falso de *"CERTIFICADO\_FEHACIENTE (100.0 % de veracidad)"* mediante una **validación circular (tautológica)**: los conectores serializan sus propios diccionarios estáticos en la zona Bronce, les calculan un hash SHA-256, y posteriormente el auditor compara el tablero contra esos mismos archivos sintéticos y contra diccionarios idénticos copiados dentro del propio script del auditor.

**Advertencia Institucional:** Presentar en sesión de Comisión o ante organismos de control (Procuraduría, Contraloría) un tablero que reporta decretos municipales de calamidad pública inexistentes, racionamientos ficticios y niveles de embalses falsos bajo un sello criptográfico de "Certificación Fehaciente CRA" constituye un **riesgo jurídico, reputacional y disciplinario inaceptable** para la Entidad.

# **3\. Hallazgos Críticos de Veracidad (Evidencia Forense en Código)**

A continuación se detallan las no conformidades detectadas en la capa de ingesta y procesamiento, las cuales ya fueron parcialmente reconocidas por la propia Fábrica en el nodo "origenes\_no\_verificados" del archivo `data/config/comparativo_semanal.json` (`v1.1.0-20261013`), pero que **siguen contaminando el Tablero Principal y el cálculo del ICR**:

## **Hallazgo H-01 (Severidad: CRÍTICA — Riesgo Legal): Invención de Actos Administrativos, Calamidades y Racionamientos**

* **Componente afectado:** `ingesta/conectores/conector_ungrd_minvivienda.py` (líneas 28 a 202\) — Indicadores **R-2, R-3 y R-4**.  
* **Evidencia:** El conector **no realiza ninguna petición HTTP ni consulta fuente externa alguna**. Contiene un diccionario estático llamado `MUNICIPIOS_AFECTADOS_CONFIRMADOS` con 17 municipios donde se declaran racionamientos activos (`R-3 = 1`), operación de carrotanques (`R-2 = 1`) y declaratorias de calamidad pública (`R-4 = 1`).  
* **Agravante jurídico:** El código incluye números de actos administrativos ficticios o simulados como soporte probatorio:  
  * `"11001" (Bogotá, D.C.)`: `"racionamiento_reportado": 1`, `"decreto_calamidad": "Resolución Alcaldía Mayor 128-2026"`.  
  * `"44847" (Uribia)`: `"decreto_calamidad": "Decreto Municipal 012-2026"`.  
  * `"47001" (Santa Marta)`: `"decreto_calamidad": "Decreto Distrital 089-2026"`.  
* **Impacto en la toma de decisiones:** Por efecto de la **Regla de Piso por Impacto Confirmado (`RF-ICR-06`)** programada en `pipeline_corte.py` (líneas 109-115), cualquier municipio con `R-3 = 1` o `R-4 = 1` es forzado automáticamente a **Alerta Naranja**. Esto provoca que municipios como **Bogotá D.C., Ibagué, San Gil y Magangué** aparezcan hoy en Alerta Naranja en el tablero y en la bandeja de escalamientos (`V-06`) por un racionamiento que en la realidad no está vigente.

## **Hallazgo H-02 (Severidad: CRÍTICA): Falsificación de Niveles de Embalses Abastecedores (XM Sinergox)**

* **Componente afectado:** `ingesta/conectores/conector_xm_embalses.py` (líneas 27 a 66\) — Indicador **H-5**.  
* **Evidencia:** El conector no invoca la API oficial de XM Sinergox. En su lugar, serializa el diccionario estático `EMBALSES_CRITICOS` con valores fijos:  
  * **Embalse de Chuza:** Fijado en código en **`43.8 %`**.  
  * **Agregado Nacional:** Fijado en código en **`49.3 %`**.  
* **Contraste con la fuente oficial (verificado en `data/bronce/fte_xm_historico/`):** En las descargas reales de la API XM ejecutadas el 13 de octubre de 2026 (`20261013_135118_14051e73.json`), el nivel real de **Chuza es `90.15 %` (`0.90147`)**, el **Agregado Bogotá es `66.37 %`**, **Peñol es `77.59 %`** y el **SIN Nacional ronda el `75.1 %`**. Una desviación de **46.3 puntos porcentuales** en el sistema Chingaza invalida cualquier análisis de vulnerabilidad hídrica para Bogotá y la Sabana.

## **Hallazgo H-03 (Severidad: CRÍTICA): Simulación de Variables Hidrometeorológicas del IDEAM y Omisión de Municipio**

* **Componente afectado:** `ingesta/conectores/conector_ideam.py` (líneas 28 a 65\) — Indicadores **A-3, A-4, H-1, H-2, H-3**.  
* **Evidencia:** No existe conexión a DHIME ni al portal de Datos Abiertos en este conector. Se inyecta el diccionario fijo `DATOS_TERRITORIALES_IDEAM` (ej. Uribia con `-88.5 %` de anomalía de precipitación, `48` días sin lluvia y `15.0 %` de caudal).  
* **Defecto adicional de integridad (Omisión de Tuta):** El catálogo maestro (`MUNICIPIOS_MAESTRO` en `pipeline_corte.py`) evalúa **23 municipios**, pero `DATOS_TERRITORIALES_IDEAM` solo contiene **22 municipios**. El municipio de **Tuta (Boyacá, DIVIPOLA `15837`)** fue omitido del conector IDEAM, por lo que `pipeline_corte.py` (líneas 247-252) le asigna silenciosamente valores por defecto inventados (`-40.0 %` en A-3, `20` días en A-4, `50.0 %` en H-1 y puntajes de `60.0` y `40.0`).

## **Hallazgo H-04 (Severidad: ALTA): Datos Estáticos y Constantes Invariantes en Indicadores SUI**

* **Componente afectado:** `ingesta/pipeline_corte.py` (líneas 165 a 190 y 254 a 266\) — Indicadores **S-1, S-3, S-4, S-5, S-6, H-4, R-1**.  
* **Evidencia:**  
  1. Los indicadores **S-1** (Continuidad), **S-3** (Cobertura), **S-4** (IANC), **S-5** (Variación PQR) y **R-1** (PEC) están codificados en duro en el diccionario `DATOS_SUI_BASE` dentro del motor de cálculo.  
  2. El indicador **H-4 (Autonomía de Almacenamiento)** tiene asignada una constante fija de **`14.0 horas` (puntaje `55.0`) para el 100 % de los municipios** (línea 254), desde Uribia hasta Bogotá.  
  3. El indicador **S-6 (Consumo Medio Facturado)** tiene asignada una constante fija de **`12.8 m³/susc/mes` para todos los municipios** (línea 264), ignorando los pisos térmicos establecidos en la Resolución CRA 887 de 2019\.

## **Hallazgo H-05 (Severidad: ALTA): Simulación de Focos de Calor (NASA FIRMS) y Probabilidad ENSO (NOAA)**

* **Componentes afectados:** `ingesta/conectores/conector_nasa_firms.py` (líneas 26-37) y `ingesta/conectores/conector_noaa.py` (línea 102).  
* **Evidencia:**  
  1. `conector_nasa_firms.py` publica un diccionario fijo (`FOCOS_CALOR_7D`) para 10 municipios y en `pipeline_corte.py` (línea 249\) se rellenan los 13 municipios restantes con un valor por defecto de `8 focos`. Asimismo, el archivo `tablero/focos_calor_colombia_7d.csv` contiene coordenadas generadas sintéticamente.  
  2. En `conector_noaa.py` (línea 102), aunque `A-1` se descarga ejemplarmente desde la NOAA (`wksst9120.for` y `oni.ascii.txt`), el indicador **`A-2` (`indicador_a2_probabilidad_muy_fuerte_pct`) está quemado en `75.0 %`** con fecha fija `"2026-09-10"` en `pipeline_corte.py` (línea 245), ignorando el boletín oficial CPC/IDEAM de octubre de 2026 (que sitúa la probabilidad en 83 %).

## **Hallazgo H-06 (Severidad: CRÍTICA): Fraude Técnico por Circularidad en `auditor_veracidad.py`**

* **Componente afectado:** `auditoria/auditor_veracidad.py` (líneas 290 a 470).  
* **Evidencia:** El módulo de auditoría fue programado para hacer pasar datos estáticos por datos verificados:  
  * En las líneas 348-372, el auditor tiene **copiado exactamente el mismo diccionario `DATOS_SUI_BASE`** de `pipeline_corte.py` y afirma en la línea 447 que el archivo de origen es `"SUI_BODEGA_ORACLE_EXT_01_A_06"`, archivo que **no existe en ninguna parte del repositorio**.  
  * En la línea 416, cuando un municipio no está en el diccionario fijo de FIRMS, el auditor asigna `val_raw = 8` para que coincida forzosamente con el valor por defecto `8` de `pipeline_corte.py`.  
  * En la línea 440, el auditor fuerza `val_raw = 75.0` para `A-2` sin leer ningún archivo de la NOAA.

# **4\. Defectos de Integración, Sincronización y Lógica (Bugs Funcionales)**

Además de los problemas de veracidad de datos, la exploración técnica identificó **5 defectos de programación** que impiden el funcionamiento correcto del sistema:

1. **Bug B-01 — Ruptura entre `comparativo_semanal.json` (`v1.1.0`) y `modelo_semanal.py`:**  
   El 13 de octubre a las `13:47 UTC`, la Fábrica actualizó `data/config/comparativo_semanal.json` a la versión `v1.1.0-20261013`, configurando las variables con los nuevos orígenes reales descargados por `ingesta/historico/recuperacion.py` (`"origen": "xm_historico"`, `"ideam_precip"`, `"ungrd_historico"`, `"firms_historico"`). Sin embargo, **en `ingesta/semanal/modelo_semanal.py` (líneas 188-246), la función `_observaciones_variable()` solo reconoce `("noaa_semanal", "noaa_oni", "bronce_xm", "bronce_ideam", "bronce_firms", "oro_corte")`** y lanza una excepción fatal: `ValueError(f"Origen no soportado en config: {origen}")`.  
   **Consecuencia:** Si un usuario presiona hoy el botón **«Actualizar datos»** en la vista semanal, el proceso falla inmediatamente.  
2. **Bug B-02 — Desconexión total entre el Pipeline Diario y el Frontend Principal (`tablero/js/data.js`):**  
   Cuando se ejecuta `orquestador.py` o `pipeline_corte.py`, el resultado se escribe en `data/oro/corte_vigente.json`. Sin embargo, el Tablero Principal (`tablero/index.html`) no consume `data/oro/corte_vigente.json`, sino que carga estáticamente `js/data.js` (`window.VIGIA_DATA`), el cual está congelado con fecha `2026-10-09`.  
3. **Bug B-03 — Textos y Cifras Quemadas (Hardcoded) en el DOM de `tablero/index.html`:**  
   * **Línea 55:** Fecha estática inicial desfasada (`2026-10-08`).  
   * **Línea 186:** El texto principal del banner NOAA tiene escrito en duro: *"Anomalía en la región Niño 3.4 a \+1.8 °C (con picos en la región Niño 1+2 de \+3.4 °C)"*, contradiciendo los recuadros contiguos que muestran `+3.2 °C` y `+5.3 °C`.  
   * **Líneas 233 y 238:** Los KPIs iniciales en HTML muestran `6` municipios en Alerta Roja y `11` en Naranja, mientras que el modelo de datos tiene `5` en Roja y `12` en Naranja.  
   * **Líneas 312 a 326 (Vista `V-02 Amenaza`):** Los diagnósticos regionales de Caribe & La Guajira y Región Andina son párrafos HTML estáticos que jamás se actualizan mediante JavaScript.  
4. **Bug B-04 — Error Matemático en Promedio de Embalses Múltiples (`conector_xm_embalses.py` y `auditor_veracidad.py`):**  
   En `conector_xm_embalses.py` (líneas 91-93), cuando un municipio tiene más de dos embalses asociados, el código calcula un promedio iterativo erróneo `(acum + nuevo) / 2`, otorgándole el 50 % del peso al último embalse iterado e ignorando la ponderación por capacidad (`capacidad_hm3`).  
5. **Bug B-05 — Deshabilitación de Verificación SSL Global (`conector_base.py`):**  
   En `ingesta/conector_base.py` (líneas 74-76), se desactiva la verificación de certificados SSL (`verify_mode = ssl.CERT_NONE`), exponiendo la ingesta a ataques Man-in-the-Middle (MitM).

# **5\. Plan de Acción Obligatorio para la Fábrica de Software**

Para aprobar el recibo a satisfacción del sistema, la Fábrica debe implementar y entregar los siguientes **4 paquetes de trabajo correctivos**:

1. **Refactorización de Conectores a Consumo Real 100 % Verificable:**  
   * **`conector_xm_embalses.py`:** Eliminar `EMBALSES_CRITICOS` estático. Consumir directamente el endpoint diario de la API REST de XM (`MetricId: "PorcVoluUtilDiar"`, entidades `"Sistema"` y `"Embalse"`).  
   * **`conector_ideam.py`:** Eliminar `DATOS_TERRITORIALES_IDEAM`. Conectar mediante SoQL al dataset oficial de estaciones hidrometeorológicas de IDEAM en Datos Abiertos (`s54a-sgyg`) para calcular para los **23 municipios** (incluyendo Tuta `15837`) la precipitación acumulada de los últimos 30 días y días secos consecutivos.  
   * **`conector_ungrd_minvivienda.py`:** Eliminar de inmediato `MUNICIPIOS_AFECTADOS_CONFIRMADOS` y todos los números de decretos inventados. Integrar la consulta a los datasets abiertos de emergencias de la UNGRD (`wwkg-r6te`, `rgre-6ak4`, `2343-nuqp`) y un archivo controlado auditable con actos administrativos reales verificados.  
   * **`conector_nasa_firms.py`:** Eliminar `FOCOS_CALOR_7D` y el CSV sintético. Conectar a la API oficial de NASA FIRMS (`VIIRS_SNPP_SP`). Si no hay API Key configurada, el indicador `A-5` debe quedar en `null` (`sin_dato`).  
   * **Conector SUI (`conector_sui.py` — Nuevo):** Extraer `DATOS_SUI_BASE` de `pipeline_corte.py` y crear un conector formal que lea los extractos oficiales certificados del SUI desde `data/bronce/fte_sui/`.  
2. **Reparación de `modelo_semanal.py` para compatibilidad con `v1.1.0`:**  
   * Implementar en `ModeloSemanal._observaciones_variable()` y `construir()` los lectores para los orígenes `"xm_historico"`, `"ideam_precip"`, `"ungrd_historico"` y `"firms_historico"` e integrar la llamada a `AlmacenHistorico.registrar()`.  
3. **Sincronización Automática con el Tablero Principal (`data.js` e `index.html`):**  
   * En `pipeline_corte.py`, escribir de manera atómica tanto `data/oro/corte_vigente.json` como `tablero/js/data.js` y `tablero/vigia_corte_actualizado_arcgis.geojson`.  
   * Eliminar todos los textos quemados en `tablero/index.html` (línea 186 y vista `V-02`).  
4. **Reingeniería del Auditor de Veracidad (`auditor_veracidad.py`):**  
   * Eliminar `DATOS_SUI_BASE` y cualquier constante de respaldo dentro de `auditor_veracidad.py`.  
   * Si cualquier fuente activa en el corte tiene origen en diccionarios en memoria, está listada en `origenes_no_verificados`, o carece de trazabilidad HTTP real, el veredicto del auditor **DEBE ser `RECHAZADO_FUENTE_NO_VERIFICADA`**.

# **6\. Criterios de Aceptación (Definition of Done)**

| ID Prueba | Comando / Verificación | Criterio de Aceptación Exigido |
| :---- | :---- | :---- |
| **CA-01** | Búsqueda estática en código (`grep` / AST) en `ingesta/` y `auditoria/` | **Cero (0)** diccionarios con valores de indicadores municipales *hardcodeados* en archivos `.py`. |
| **CA-02** | Ejecución de actualización semanal con `{"modo": "completo"}` | Respuesta HTTP `202` y finalización en estado `exitoso` sin lanzar `ValueError: Origen no soportado en config: xm_historico`. |
| **CA-03** | Verificación de Embalses (`H-5` y `EMBALSES_NAL_PCT`) en Tablero | El nivel de Chuza y del Agregado Bogotá en el tablero principal y en el semanal coincide al decimal con el reporte diario oficial de XM (\~90.1 % y \~66.4 % en oct-2026). |
| **CA-04** | Verificación de Alertas por Regla de Piso (`RF-ICR-06`) | Ningún municipio aparece con `R-3 = 1` o `R-4 = 1` sin un registro real en el dataset de emergencias UNGRD o acto administrativo real verificable. |
| **CA-05** | Ejecución de `pytest` y `python auditoria/auditor_veracidad.py` | 100 % de tests aprobados y dictamen del auditor validando exclusivamente archivos descargados de fuentes externas reales. |

**Firma:**

**Camilo Ernesto Carvajalino Martá**  
*Asesor / Líder de TI (CIO)*  
*Comisión de Regulación de Agua Potable y Saneamiento Básico — CRA*