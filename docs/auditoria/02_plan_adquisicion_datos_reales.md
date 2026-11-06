# Plan de Conexión y Adquisición Automatizada de Datos Reales
## Sistema de Monitoreo y Alerta Temprana — Vigía El Niño · Acueductos (CRA)

**Documento:** `docs/auditoria/02_plan_adquisicion_datos_reales.md`  
**Entidad Responsable:** Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**Versión del Plan:** 2.0.0 (Post-Auditoría Forense)  
**Fecha de Emisión:** Noviembre de 2026  
**Clasificación:** Documento Técnico Oficial / Estrategia de Ingeniería de Datos  
**Estado:** Aprobado para Implementación  

---

## 1. Resumen Ejecutivo y Marco Estratégico

### 1.1 Contexto Regulatorio e Institucional
El fenómeno hidrometeorológico de El Niño 2026-2027 representa una amenaza crítica para la seguridad hídrica de Colombia, caracterizada por déficits prolongados de precipitación, reducción severa de caudales en fuentes superficiales, estrés térmico, aumento del riesgo de incendios de la cobertura vegetal y descenso acelerado de los niveles de almacenamiento en embalses reguladores. Ante este panorama, la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA), en articulación con el Ministerio de Vivienda, Ciudad y Territorio (MinVivienda), la Superintendencia de Servicios Públicos Domiciliarios (SSPD), el Instituto de Hidrología, Meteorología y Estudios Ambientales (IDEAM) y la Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD), diseñó el sistema **Vigía El Niño · Acueductos**.

El propósito medular de este sistema es calcular diariamente el **Índice Compuesto de Riesgo (ICR)** para los 1,122 municipios del territorio nacional, integrando 20 indicadores estructurados en cuatro capas dimensionales:
1. **Capa A — Amenaza Hidroclimática (30%):** Monitoreo oceánico-atmosférico global y regional (NOAA CPC), anomalías locales de lluvia y días secos consecutivos (IDEAM / CHIRPS), caudales deprimidos (IDEAM) y focos de calor satelitales (NASA FIRMS).
2. **Capa H — Vulnerabilidad de la Oferta Hídrica (30%):** Índices estructurales de vulnerabilidad por desabastecimiento hídrico (IVH) y uso del agua (IUA) del Estudio Nacional del Agua (ENA - IDEAM), autonomía de almacenamiento en sistemas de acueducto y nivel de embalses abastecedores del Sistema Interconectado Nacional (XM Sinergox) y embalses locales de acueducto (SUI).
3. **Capa S — Desempeño del Servicio de Acueducto (25%):** Continuidad operativa del suministro (horas/día), calidad fisicoquímica y microbiológica del agua potable (IRCA - INS SIVICAP), cobertura urbana, índice de agua no contabilizada (IANC / pérdidas), variaciones en quejas y reclamos por falta de servicio (PQR) y consumo medio facturado (SUI SSPD).
4. **Capa R — Capacidad de Respuesta e Impacto en Territorio (15%):** Adopción de Planes de Emergencia y Contingencia (PEC - MinVivienda / SUI), activación de contingencias con carrotanques (UNGRD), reportes de racionamiento sectorizado (Survey123 MinVivienda) y decretos formales de Calamidad Pública vigentes (UNGRD).

### 1.2 Justificación Técnica: Erradicación Definitiva de Datos Sintéticos
El 14 de octubre de 2026, la Dirección de Tecnologías de la Información y las Comunicaciones (CIO) de la CRA emitió el *Informe de Auditoría Forense y Verificación de Integridad Técnica*, en el cual se identificó una No Conformidad Crítica en las versiones preliminares del prototipo (`v1.0.0`). Dicha auditoría reveló la presencia de datos simulados y diccionarios estáticos quemados en el código fuente:
* Decretos ficticios de calamidad pública atribuidos a alcaldías distritales y municipales en `conector_ungrd_minvivienda.py`.
* Valores congelados de embalses en `conector_xm_embalses.py` (ej. Chuza reportado en 43.8% cuando el valor real de XM registraba 90.15%).
* Variables de lluvia y temperatura simuladas en `conector_ideam.py` con omisión de municipios reales (ej. Tuta, Boyacá, DIVIPOLA `15837`).
* Continuidad fijada arbitrariamente en 14.0 horas/día y consumos congelados en 12.8 m³/susc/mes en `pipeline_corte.py`.
* Desactivación global de la verificación de certificados TLS (`verify_mode = ssl.CERT_NONE`).

Para un organismo regulador del Estado colombiano, emitir resoluciones de desincentivo al consumo excesivo de agua (Resolución CRA 887 de 2019) o declarar alertas institucionales basadas en datos sintéticos acarrea responsabilidad disciplinaria, fiscal y jurídica. Por tanto, este documento establece el **Plan de Conexión y Adquisición Automatizada de Datos Reales**, un instrumento vinculante de ingeniería de datos que redefine el ciclo de vida del dato, prohíbe por diseño cualquier inyección sintética y formaliza la integración con plataformas tecnológicas oficiales nacionales e internacionales.

### 1.3 Principios Rectores del Plan
1. **Veracidad Feaciente y Cero Datos Ficticios (Criterio CA-01):** Todo indicador debe derivarse exclusivamente de una captura física descargada de un endpoint oficial o de un extracto institucional certificado. Ante la ausencia de datos en la fuente, el sistema debe registrar `null` (`sin_dato`) y aplicar la regla formal de redistribución proporcional de pesos (RF-ICR-04).
2. **Inmutabilidad Criptográfica en Zona Bronce (RF-ING-02 y RF-ING-03):** Toda descarga externa se almacena sin modificaciones en su formato crudo original (JSON, CSV, TXT, NetCDF), sellada con fecha UTC y hash SHA-256. El sistema garantiza la idempotencia: descargas con hash idéntico al último corte no generan duplicidad ni alteran la serie histórica.
3. **Resiliencia Multinivel y Degrade Controlado (RF-ING-04 y RF-CAL-03):** Si una fuente externa no responde, el pipeline activa circuit breakers con reintentos exponenciales y, de persistir la falla, utiliza el último crudo certificado disponible etiquetando la frescura como `desactualizado`. Si no hay ningún dato histórico, se activa el seguro de omisión sin comprometer el cálculo general.
4. **Soberanía Tecnológica y Stack Open Source On-Premise (ADR-0005):** El pipeline se ejecuta íntegramente sobre infraestructura local o nube privada de la CRA (Python 3.12, DuckDB, PostgreSQL, Apache Airflow / Task Scheduler, dbt), sin dependencias propietarias ni costos recurrentes de licenciamiento por volumen de datos.

---

## 2. Identificación y Evaluación Exhaustiva de Fuentes y Entidades Oficiales

Se han evaluado técnica y operativamente ocho (8) entidades e infraestructuras oficiales primarias y secundarias, verificando la disponibilidad de sus servicios mediante peticiones reales de red y pruebas de extracción en el entorno institucional.

```
                              ARQUITECTURA DE FUENTES OFICIALES FEDERADAS
  ===================================================================================================
  ÁMBITO         ENTIDAD / PLATAFORMA                 MECANISMO                INDICADORES VIGÍA
  ===================================================================================================
  GLOBAL /       NOAA Climate Prediction Center       HTTP Feed (Fixed TXT)    A-1 (SST Niño, ONI), A-2
  INTERNACIONAL  NASA FIRMS (Earthdata)               REST API (VIIRS CSV)     A-5 (Focos de Calor)
                 CHIRPS (UC Santa Barbara / USGS)     HTTP / NetCDF-4 (Ráster) A-3, A-4 (Lluvia satelital)
  ---------------------------------------------------------------------------------------------------
  SECTOR         XM S.A. E.S.P. (Sinergox)            REST API POST (JSON)     H-5 (Embalses SIN)
  ENERGÉTICO
  ---------------------------------------------------------------------------------------------------
  AGUA POTABLE   SSPD - SUI (Bodega Oracle Institucional) Oracle Net SQL / VPN S-1, S-3, S-4, S-5, S-6,
  Y SERVICIOS    SSPD - SUI (Reporte Diario Embalses) Web Form / SUI Módulo    H-4, R-1 (Continuidad, IANC)
  DOMICILIARIOS  INS SIVICAP (datos.gov.co)           Socrata SoQL (JSON)      S-2 (IRCA Calidad de Agua)
  ---------------------------------------------------------------------------------------------------
  HIDROCLIMA Y   IDEAM (Socrata s54a-sgyg / 57sv-p2fu) Socrata SoQL (JSON/CSV) A-3, A-4 (Precipitación)
  TERRITORIO     IDEAM (Catálogo de Estaciones hp9r)   Socrata SoQL (JSON)      dim_estacion, H-1 (Caudal)
                 IDEAM / MADS (Estudio Nacional Agua)  Geoportal SIAC (GeoJSON) H-2 (IVH), H-3 (IUA)
                 DANE (DIVIPOLA / MGN / Censo)         Descarga Directa (CSV)   dim_territorio, hogares
  ---------------------------------------------------------------------------------------------------
  GESTIÓN DEL    UNGRD (Datos Abiertos 2343-nuqp)      Socrata SoQL (JSON)      R-2 (Carrotanques), R-4
  RIESGO         UNGRD / MinVivienda (Sala de Crisis)  Archivo Verificado JSON  R-3 (Racionamiento), R-4
  ===================================================================================================
```

### 2.1 IDEAM (Instituto de Hidrología, Meteorología y Estudios Ambientales)
El IDEAM es la autoridad meteorológica e hidrológica de Colombia. Administra la red nacional de más de 4,000 estaciones hidrometeorológicas.
* **Precipitación Diaria Histórica y Reciente:** Disponible a través de la plataforma de datos abiertos del Estado colombiano (`datos.gov.co`) en el conjunto `s54a-sgyg` (*Precipitación Total Diaria*). Contiene registros consolidados diarios de estaciones pluviométricas y climatológicas.
* **Sensorica Cuasi-Tiempo-Real:** Conjunto `57sv-p2fu` en `datos.gov.co`. Provee telemetría horaria/minutaria de estaciones automáticas telemétricas.
* **Catálogo Maestro de Estaciones:** Conjunto `hp9r-jxuu`. Incluye coordenadas geográficas (latitud, longitud), altitud, cuenca hidrográfica, departamento, municipio y tipo de sensor (convencional vs. automático).
* **Estudio Nacional del Agua (ENA):** Publicado quinquenalmente por el IDEAM. Provee las capas territoriales oficiales del Índice de Vulnerabilidad por Desabastecimiento Hídrico (IVH) y el Índice de Uso del Agua (IUA) a nivel de Subzona Hidrográfica (SZH), alojadas en el Geoportal del Sistema de Información Ambiental de Colombia (SIAC) y el ArcGIS Hub del Ministerio de Ambiente y Desarrollo Sostenible (MADS).

### 2.2 SSPD - SUI (Sistema Único de Información de la Superservicios)
El SUI es la fuente legal y regulatoria obligatoria de los servicios públicos en Colombia (Ley 142 de 1994 y Ley 689 de 2001).
* **Bodega Central Oracle (`sui-scan.sspd.gov.co:1521/SUIPRD`):** Contiene la información operacional y comercial certificada reportada periódicamente por más de 3,500 prestadores de acueducto inscritos en el RUPS. Alberga los formatos de continuidad de servicio (`CAR_CONTINUIDAD_ACUEDUCTO`), balance hídrico y pérdidas (`CAR_BALANCE_HIDRICO`), comercial y suscriptores (`CAR_COMERCIAL_RESUMEN`), quejas y reclamos (`PQR_USUARIOS`) y planes de emergencia y contingencia (`GESTION_RIESGO_PEC`).
* **Catastro RUPS de Prestadores:** Registro oficial de prestadores de acueducto, alcantarillado y aseo (conjunto abierto `4qkq-csdn` en `datos.gov.co`), que mapea el NIT, razón social y estado del prestador con sus Áreas de Prestación del Servicio (APS) y códigos DIVIPOLA municipales.
* **Reporte Diario de Embalses Abastecedores de Acueducto (Resolución SSPD 20241000395385):** Marco regulatorio expedido en 2024 que exige a prestadores con embalses propios de abastecimiento (ej. EAAB con Chingaza y Tominé, EPM con Piedras Blancas y La Fe, ACUAVALLE con Sara Brut) reportar diariamente a las 23:59 COT el nivel, volumen útil y caudal de entrada/salida.
* **Extractos Certificados en Bronce:** Como contingencia auditada a las restricciones de conectividad externa sobre la bodega Oracle, el SUI genera extractos mensuales consolidados validados criptográficamente (`data/bronce/fte_sui/extracto_oficial_sui_2026.json`).

### 2.3 XM S.A. E.S.P. (Sinergox)
XM opera el Sistema Interconectado Nacional (SIN) y administra el mercado mayorista de energía eléctrica. Monitorea en tiempo real los grandes embalses multipropósito del país, muchos de los cuales abastecen de agua cruda a los mayores acueductos urbanos de Colombia (ej. Sistema Chingaza / Embalse Chuza y San Rafael para Bogotá; Embalse Peñol-Guatapé y Río Grande II para Medellín y Valle de Aburrá; Embalse Calima para el Valle del Cauca).
* **API REST Abierta Sinergox:** Endpoint de alta disponibilidad que responde a consultas JSON diarias sin requerir token de autenticación. Permite consultar variables del sistema eléctrico, destacando la métrica `PorcVoluUtilDiar` (Porcentaje de Volumen Útil Diario).

### 2.4 INS SIVICAP (Instituto Nacional de Salud)
El SIVICAP (Sistema de Información para la Vigilancia de la Calidad del Agua para Consumo Humano) consolida los resultados del Índice de Riesgo de la Calidad del Agua Potable (IRCA) calculado a partir de muestras fisicoquímicas y microbiológicas analizadas por las Secretarías de Salud departamentales y distritales, en cumplimiento del Decreto 1575 de 2007 y la Resolución 2115 de 2007.
* **Plataforma Socrata Open Data (`datos.gov.co`):** Conjunto oficial `nxt2-39c3`. Provee registros consolidados por municipio y año/mes, desagregando el IRCA urbano y rural, así como su nivel de riesgo cualitativo (*Sin Riesgo*, *Bajo*, *Medio*, *Alto*, *Inviable Sanitariamente*).

### 2.5 UNGRD y MinVivienda (Gestión del Riesgo y Emergencias de Agua)
La Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD) y el Viceministerio de Agua y Saneamiento Básico del MinVivienda coordinan la respuesta operativa ante la escasez hídrica.
* **Portal de Datos Abiertos UNGRD (`2343-nuqp`):** Histórico consolidado de emergencias por sequía y desabastecimiento, reportando número de eventos, galones de agua suministrados por carrotanques y números de decretos de calamidad pública.
* **Sala de Crisis Nacional y Monitoreo Diario:** Canal directo e institucional mediante el cual la Subdirección para el Manejo de Desastres de la UNGRD emite boletines diarios consolidados de declaratorias de Calamidad Pública vigentes (Ley 1523 de 2012).
* **Formulario Survey123 MinVivienda:** Herramienta telemática oficial donde los prestadores y municipios reportan formalmente la aplicación de medidas de racionamiento sectorizado de agua potable.
* **Catálogo de Verificación de Actos Administrativos (`data/config/actos_administrativos_verificados.json`):** Módulo de control introducido tras la auditoría forense que valida contra número de decreto, fecha de expedición y URL en gaceta oficial antes de computar un municipio en estado de Calamidad Pública o Racionamiento.

### 2.6 NOAA CPC (Climate Prediction Center)
El Climate Prediction Center de la National Oceanic and Atmospheric Administration (NOAA) de los Estados Unidos es la entidad líder a nivel mundial en el monitoreo del Fenómeno de El Niño - Oscilación del Sur (ENSO / ENOS).
* **Índices Semanales de Anomalías SST (`wksst9120.for`):** Archivo plano de ancho fijo actualizado todos los lunes que registra las temperaturas superficiales del mar (SST) y sus anomalías respecto al promedio climatológico en las regiones Niño 1+2 (costa sudamericana), Niño 3, Niño 3.4 (región central de acoplamiento atmósfera-océano) y Niño 4.
* **Índice Oceánico de El Niño (ONI / RONI) (`oni.ascii.txt`):** Promedio móvil trimestral centrado de las anomalías SST en la región Niño 3.4. Umbral de +0.5 °C sostenido durante 5 trimestres consecutivos define un evento cálido formal.
* **Discusión Diagnóstica y Tablas de Probabilidad:** Boletín oficial mensual emitido el segundo jueves de cada mes que establece el estado de alerta ENSO (*Advertencia de El Niño*, *Vigilancia*, o *Neutro*) y las probabilidades estadísticas para los siguientes 8 meses.

### 2.7 NASA FIRMS (Fire Information for Resource Management System)
Sistema de información de incendios satelitales operado por el Earth Observing System Data and Information System (EOSDIS) de la NASA.
* **Sensor VIIRS (Visible Infrared Imaging Radiometer Suite) a bordo de Suomi NPP y NOAA-20:** Provee detecciones de focos térmicos activos (anomalías térmicas a 375 metros de resolución espacial) actualizadas cada 12 horas. Permite evaluar el estrés térmico territorial y el riesgo de incendios forestales en cuencas abastecedoras mediante su API REST con clave de acceso `MAP_KEY`.

### 2.8 CHIRPS & Copernicus C3S (Mallas Satelitales y Pronóstico Estacional)
Fuentes avanzadas recomendadas para solventar los vacíos de cobertura espacial de la red de superficie nacional:
* **CHIRPS (Climate Hazards Group InfraRed Precipitation with Stations):** Desarrollado por el Climate Hazards Center de la Universidad de California en Santa Bárbara y el USGS. Malla satelital cuasi-global diaria de precipitación a 0.05° de resolución espacial (~5.3 km) que combina imágenes infrarrojas geoestacionarias con estaciones pluviométricas calibradas. Disponible en formato NetCDF-4 y GeoTIFF, ideal para calcular anomalías de lluvia y días secos en municipios sin estaciones del IDEAM (ej. Alta Guajira, Orinoquía, Amazonía).
* **Copernicus Climate Data Store (C3S - ECMWF SEAS5):** Provee pronósticos climáticos estacionales multimensuales (1 a 6 meses de anticipación) a través de la API Python `cdsapi`. Permite anticipar escenarios probabilísticos de precipitación acumulada por cuencas.

---

## 3. Fichas Técnicas Detalladas por Fuente de Información

A continuación se presentan las especificaciones de ingeniería de datos para cada una de las fuentes oficiales integradas en el sistema.

### 3.1 Ficha Técnica FTE-CPC-NOAA: NOAA Climate Prediction Center
* **Identificador Interno:** `FTE-CPC-SEM` / `FTE-CPC-ONI`
* **Entidad / Propietario:** NOAA Climate Prediction Center (Estados Unidos)
* **Indicadores que Alimenta:** A-1 (Anomalías SST Niño 1+2, 3, 3.4, 4 y ONI trimestral), A-2 (Discusión y Probabilidad ENSO)
* **Endpoints y URLs Oficiales:**
  * Semanal: `https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for`
  * Trimestral ONI: `https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt`
  * Discusión ENSO: `https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml`
* **Mecanismo de Acceso y Transporte:** HTTP/1.1 y HTTP/2 GET directo sobre TLS 1.3. Requiere cabecera estándar `User-Agent: CRA-VigiaNino/1.0 (+https://www.cra.gov.co)`.
* **Frecuencia de Actualización:** 
  * Semanal: Todos los lunes entre 12:00 y 13:00 COT (corte semanal previo).
  * Mensual: ONI el día 10 de cada mes; Discusión el segundo jueves de cada mes.
* **Formato y Esquema de Datos Crudos:**
  * `wksst9120.for`: Archivo de texto ASCII columnar de ancho fijo (formato FORTRAN).
    * Columnas: `WEEK` (DDMMMYYYY), `Nino12_SST` (F5.2), `Nino12_ANOM` (F5.2), `Nino3_SST` (F5.2), `Nino3_ANOM` (F5.2), `Nino34_SST` (F5.2), `Nino34_ANOM` (F5.2), `Nino4_SST` (F5.2), `Nino4_ANOM` (F5.2).
  * `oni.ascii.txt`: Formato tabular con campos `SEAS` (cadena de 3 letras ej. DJF, JFM), `YR` (YYYY), `TOTAL` (SST absoluta), `ANOM` (anomalía respecto a climatología 1991-2020).
* **Autenticación y Credenciales:** Acceso público universal. No requiere API Key ni registro.
* **Rate Limits y Cuotas:** Sin límite formal explícito. Por cortesía institucional y prevención de bloqueo en firewall, el conector limita la tasa a máximo 1 petición/segundo.
* **Modos de Fallo Típicos y Estrategia de Resiliencia:**
  * *Fallo 1 (Cambio en espaciado ASCII):* Mitigado mediante parser robusto con expresiones regulares (`re.compile(r'\s+')`) en lugar de índices rígidos de caracteres.
  * *Fallo 2 (Caída temporal de servidores NOAA):* Reintentos exponenciales automáticos (RF-ING-04: 2 min, 8 min, 32 min). En caso de persistencia, se hereda la última observación de la semana previa sellada en `data/bronce/fte_cpc_noaa/` etiquetando la frescura como `desactualizado`.

### 3.2 Ficha Técnica FTE-XM-EMBALSES: XM Sinergox (API Embalses del SIN)
* **Identificador Interno:** `FTE-XM-EMBALSES`
* **Entidad / Propietario:** XM S.A. E.S.P. (Filial de ISA / Operador del SIN)
* **Indicadores que Alimenta:** H-5 (Nivel de embalses abastecedores del SIN)
* **Endpoint URL:** `https://servapibi.xm.com.co/daily`
* **Mecanismo de Acceso y Transporte:** HTTP POST enviando payload en formato `application/json` codificado en UTF-8.
* **Contrato de Petición (Payload POST):**
  ```json
  {
    "MetricId": "PorcVoluUtilDiar",
    "StartDate": "2026-11-05",
    "EndDate": "2026-11-05",
    "Entity": "Sistema"
  }
  ```
  *(Para consultas a embalses específicos, `Entity` se define como `"Embalse"` y se especifica el nombre o código oficial del embalse en el campo `Filter`).*
* **Frecuencia de Actualización:** Diaria. El cierre del día anterior se publica en la madrugada (~03:00 COT).
* **Formato y Esquema de Datos Crudos (Respuesta JSON):**
  ```json
  {
    "Metric": {
      "Name": "Volumen Util Diario",
      "Unit": "%"
    },
    "Items": [
      {
        "Date": "2026-11-05",
        "DailyEntities": [
          {
            "Code": "Sistema",
            "Value": 64.82
          }
        ]
      }
    ]
  }
  ```
* **Autenticación y Credenciales:** Totalmente pública y sin token.
* **Rate Limits y Cuotas:** Máximo 30 días de rango por petición. Consultas mayores a 30 días retornan error HTTP 400.
* **Ponderación Territorial Multirreservorio:** Para acueductos abastecidos por múltiples embalses (ej. Bogotá D.C. con Chuza, San Rafael, Neusa, Sisga, Tominé), el conector no promedia aritméticamente, sino que calcula la media ponderada por capacidad de almacenamiento útil:
  $$\text{Nivel Efectivo} = \frac{\sum (\text{Nivel}_i \times \text{Capacidad}_i)}{\sum \text{Capacidad}_i}$$
* **Modos de Fallo Típicos y Resiliencia:** Ventana de mantenimiento de base de datos XM en madrugadas (HTTP 500/503). El pipeline activa circuit breaker y carga el snapshot previo de `data/bronce/fte_xm_historico/` sin interrumpir la ejecución del corte.

### 3.3 Ficha Técnica FTE-INS-IRCA: INS SIVICAP (Calidad de Agua Potable)
* **Identificador Interno:** `FTE-INS-IRCA`
* **Entidad / Propietario:** Instituto Nacional de Salud (INS) / Ministerio de Salud y Protección Social
* **Indicadores que Alimenta:** S-2 (IRCA - Riesgo por Calidad de Agua Potable)
* **Endpoint URL:** `https://www.datos.gov.co/resource/nxt2-39c3.json`
* **Mecanismo de Acceso y Transporte:** Socrata Open Data API (SoQL) vía HTTP GET.
* **Ejemplo de Consulta SoQL Parametrizada:**
  ```http
  GET /resource/nxt2-39c3.json?$select=departamentocodigo,municipiocodigo,municipio,a_o,irca,nivel_de_riesgo,ircaurbano,ircarural&$where=a_o='2025' or a_o='2026'&$limit=5000 HTTP/1.1
  Host: www.datos.gov.co
  X-App-Token: ${SOCRATA_APP_TOKEN}
  ```
* **Frecuencia de Actualización:** Mensual / Consolidada por secretarías de salud municipales (reportes con corte a día 20 del mes vencido).
* **Formato y Esquema de Datos Crudos (JSON):**
  * `departamentocodigo` (string, 2 dígitos DANE)
  * `municipiocodigo` (string, 3 dígitos DANE)
  * `divipola` (campo compuesto: `departamentocodigo` + `municipiocodigo` = 5 dígitos)
  * `a_o` (string, ej. "2026")
  * `irca` (float, valor numérico entre 0.0 y 100.0)
  * `nivel_de_riesgo` (string: "SIN RIESGO", "BAJO", "MEDIO", "ALTO", "INVIABLE SANITARIAMENTE")
  * `ircaurbano` (float)
  * `ircarural` (float)
* **Autenticación y Credenciales:** Pública. Se recomienda registrar un `X-App-Token` institucional en la cabecera para elevar la cuota de peticiones.
* **Rate Limits y Cuotas:** 1,000 peticiones por hora por IP anónima; 50,000 peticiones por hora con App Token. Límite máximo de 50,000 registros por query.
* **Modos de Fallo Típicos y Resiliencia:** Municipios de categorías 5 y 6 con rezago de reporte de muestras (vacío temporal). En cumplimiento de RF-CAL-03, se hereda el último registro histórico disponible marcando el estado de frescura como `desactualizado`. Si no existe ninguna muestra en la historia del SIVICAP, el indicador S-2 se reporta como `null` (`sin_dato`) y se activa la redistribución de pesos RF-ICR-04.

### 3.4 Ficha Técnica FTE-IDEAM-CLIMA: IDEAM Precipitación y Catálogo
* **Identificador Interno:** `FTE-IDEAM-PREC` / `FTE-IDEAM-CAT`
* **Entidad / Propietario:** IDEAM (Subdirección de Meteorología e Hidrología)
* **Indicadores que Alimenta:** A-3 (Anomalía de precipitación respecto a la media histórica 30 días), A-4 (Días secos consecutivos)
* **Endpoints y URLs Oficiales:**
  * Precipitación Diaria: `https://www.datos.gov.co/resource/s54a-sgyg.json`
  * Telemetría Cuasi-Real: `https://www.datos.gov.co/resource/57sv-p2fu.json`
  * Catálogo de Estaciones: `https://www.datos.gov.co/resource/hp9r-jxuu.json`
* **Mecanismo de Acceso y Transporte:** Socrata SoQL vía HTTP GET con cláusulas de filtrado espacial y temporal.
* **Consulta SoQL Optimizada por Ventana Desacoplada:**
  ```http
  GET /resource/s54a-sgyg.json?$select=codigoestacion,fechaobservacion,valorobservado,latitud,longitud&$where=fechaobservacion >= '2026-10-01T00:00:00' and valorobservado is not null&$limit=50000&$offset=0 HTTP/1.1
  Host: www.datos.gov.co
  X-App-Token: ${SOCRATA_APP_TOKEN}
  ```
* **Frecuencia de Actualización:** Diaria a las 05:00 COT (para estaciones automáticas) y consolidaciones periódicas para estaciones convencionales.
* **Formato y Esquema de Datos Crudos (JSON):**
  * `codigoestacion` (string, código IDEAM de 8 a 10 dígitos)
  * `codigosensor` (string)
  * `fechaobservacion` (string ISO-8601: `YYYY-MM-DDTHH:MM:SS`)
  * `valorobservado` (float, milímetros de precipitación [mm] $\ge 0.0$)
  * `nombreestacion` (string)
  * `departamento` (string)
  * `municipio` (string)
* **Autenticación y Credenciales:** Pública con App Token opcional.
* **Rate Limits y Modos de Fallo:** La tabla `s54a-sgyg` supera los 15 millones de filas. Consultas globales sin índice de partición generan de inmediato error HTTP 504 Gateway Timeout.
* **Estrategia de Mitigación e Ingesta Desacoplada:** El pipeline diario nunca consulta la tabla masiva nacional en tiempo real durante el corte de las 06:00 AM. Se implementa un proceso batch nocturno desacoplado (`ingesta/historico/recuperacion.py`) que ejecuta barridos particionados mensualmente a las 01:00 COT, agregando los acumulados a nivel de DIVIPOLA municipal en Zona Plata. Durante el corte matutino, el cálculo del ICR lee la tabla preagregada en milisegundos.

### 3.5 Ficha Técnica FTE-SSPD-SUI: Bodega de Datos Oracle Institucional (SSPD)
* **Identificador Interno:** `FTE-SSPD-SUI`
* **Entidad / Propietario:** Superintendencia de Servicios Públicos Domiciliarios (SSPD)
* **Indicadores que Alimenta:** S-1 (Continuidad), S-3 (Cobertura Urbana), S-4 (IANC), S-5 (Variación PQR), S-6 (Consumo Facturado), H-4 (Autonomía de Almacenamiento), R-1 (Planes de Emergencia PEC)
* **Cadena de Conexión Institucional:**
  * Host / DSN: `sui-scan.sspd.gov.co:1521/SUIPRD`
  * Driver: Oracle Database Client / Python `oracledb` (en modo *Thin* o *Thick*)
  * Esquema Relacional: `SUI_AAA.*` (Agua, Alcantarillado y Aseo)
* **Mecanismo de Acceso y Transporte:** Protocolo nativo Oracle Net sobre red privada virtual (VPN IPSec dedicada CRA-SSPD) y lista blanca de direcciones IP autorizadas.
* **Frecuencia de Actualización:** Mensual, posterior al cierre de cargue y certificación de formatos (días 15 al 30 de cada mes).
* **Autenticación y Seguridad:** Credenciales institucionales seguras inyectadas en tiempo de ejecución mediante variables de entorno (`SUI_ORACLE_USER`, `SUI_ORACLE_PASSWORD`), gestionadas en HashiCorp Vault o archivo local cifrado protegido con permisos NTFS restringidos (`icacls`). Prohibido quemar contraseñas en scripts.
* **Suite de Consultas SQL Parametrizadas (`ingesta/queries_sui/`):**

```sql
-- EXTRACTO ILUSTRATIVO: SUI_EXT_02_CONTINUIDAD_SERVICIO.sql
-- Cálculo de Continuidad Promedio Ponderada por Suscriptores a Nivel Municipal (RF-TER-03)
SELECT 
    m.COD_DIVIPOLA,
    m.NOMBRE_MUNICIPIO,
    :period_id AS PERIODO,
    ROUND(
        SUM(c.HORAS_CONTINUIDAD_MES * r.SUSCRIPTORES_RESIDENCIALES) / 
        NULLIF(SUM(r.SUSCRIPTORES_RESIDENCIALES), 0) / 
        TO_NUMBER(TO_CHAR(LAST_DAY(TO_DATE(:period_id, 'YYYY-MM')), 'DD')), 
        2
    ) AS S1_CONTINUIDAD_HORAS_DIA,
    SUM(r.SUSCRIPTORES_RESIDENCIALES) AS TOTAL_SUSCRIPTORES_CALCULO
FROM SUI_AAA.CAR_CONTINUIDAD_ACUEDUCTO c
INNER JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps ON c.ID_EMPRESA = aps.ID_EMPRESA AND c.ID_APS = aps.ID_APS
INNER JOIN SUI_AAA.CAR_COMERCIAL_RESUMEN r ON c.ID_EMPRESA = r.ID_EMPRESA AND c.ID_APS = r.ID_APS AND c.PERIODO = r.PERIODO
INNER JOIN SUI_AAA.CAT_MUNICIPIOS_DIVIPOLA m ON aps.COD_MUNICIPIO = m.COD_DIVIPOLA
WHERE c.PERIODO = :period_id
  AND c.SERVICIO = 'ACUEDUCTO'
GROUP BY m.COD_DIVIPOLA, m.NOMBRE_MUNICIPIO;
```

* **Rendimiento e Indexación:** Los queries utilizan `PERIODO` como clave de poda de partición (*partition pruning*) sobre tablas de más de 80 millones de filas. Se implementa `NULLIF` para neutralizar divisiones por cero en municipios sin macromedición.
* **Modos de Fallo Típicos y Resiliencia:** Caída de túnel VPN o mantenimiento de la base Oracle. El pipeline conmuta de forma transparente hacia el extracto oficial certificado en Bronce (`data/bronce/fte_sui/extracto_oficial_sui_2026.json`), verificando su integridad mediante hash SHA-256.

### 3.6 Ficha Técnica FTE-UNGRD-MVCT: Emergencias, Racionamiento y Calamidad Pública
* **Identificador Interno:** `FTE-UNGRD-MVCT`
* **Entidad / Propietario:** UNGRD (Subdirección para el Manejo de Desastres) y MinVivienda
* **Indicadores que Alimenta:** R-2 (Carrotanques), R-3 (Racionamiento de Agua Potable), R-4 (Decretos de Calamidad Pública)
* **Endpoints y Mecanismos de Acceso:**
  * Datos Abiertos UNGRD: `https://www.datos.gov.co/resource/2343-nuqp.json`
  * Sala de Crisis UNGRD & MinVivienda: Ingesta estructurada de reportes consolidados y matriz de actos administrativos en `data/config/actos_administrativos_verificados.json`.
* **Frecuencia de Actualización:** Diaria durante temporada de contingencia climática (05:30 COT).
* **Esquema de Validación de Actos Administrativos (Anti-Falsificación):**
  Cada registro de Calamidad Pública (R-4) o Racionamiento (R-3) debe contener obligatoriamente los siguientes metadatos auditados:
  ```json
  {
    "divipola": "44001",
    "municipio": "Riohacha",
    "departamento": "La Guajira",
    "tipo_acto": "Decreto Municipal",
    "numero_acto": "042",
    "anio_acto": 2026,
    "fecha_expedicion": "2026-02-15",
    "vigencia_hasta": "2026-08-15",
    "causal": "Desabastecimiento por sequía extrema / Fenómeno El Niño",
    "url_gaceta_oficial": "https://www.riohacha-laguajira.gov.co/normatividad/decreto-042-2026",
    "estado_verificacion": "CERTIFICADO_JURIDICO"
  }
  ```
* **Regla de Negocio Estricta (RN-CAL-07):** Ningún municipio puede marcarse con calamidad pública o racionamiento a menos que su número de decreto y gaceta oficial figuren validados en el catálogo. Si un municipio no cuenta con reporte verificado, los indicadores R-2, R-3 y R-4 asumen 0 puntos (ausencia de impacto comprobado), sin forzar pisos ficticios.

### 3.7 Ficha Técnica FTE-FIRMS-NASA: Detección Satelital de Focos de Calor
* **Identificador Interno:** `FTE-FIRMS-NASA`
* **Entidad / Propietario:** NASA EOSDIS (Earth Science Data and Information System)
* **Indicadores que Alimenta:** A-5 (Focos de calor acumulados a 7 días en cuenca municipal)
* **Endpoint URL Formateada:**
  `https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/VIIRS_SNPP_SP/COL/{DAYS}/{DATE}`
* **Parámetros del Endpoint:**
  * `MAP_KEY`: Clave alfanumérica de 32 caracteres provista gratuitamente por NASA Earthdata.
  * `VIIRS_SNPP_SP`: Sensor VIIRS en el satélite Suomi NPP (resolución espacial 375 m).
  * `COL`: Código ISO de 3 letras para Colombia.
  * `DAYS`: Ventana temporal retrospectiva (fijada en `7` días).
  * `DATE`: Fecha de corte en formato `YYYY-MM-DD`.
* **Mecanismo de Acceso:** HTTP GET directo retornando contenido en formato CSV.
* **Esquema de Salida CSV:**
  `country,latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,confidence,version,bright_ti5,frp,daynight`
* **Intersección Territorial Espacial:** El conector cruza espacialmente las coordenadas `(latitude, longitude)` de cada foco de calor contra los polígonos municipales oficiales del Marco Geoestadístico Nacional (MGN DANE) indexados en Zona Plata (`data/plata/territorio/mgn_municipios.parquet`), agregando el conteo de detecciones por código DIVIPOLA.
* **Autenticación y Rate Limits:** Requiere variable de entorno `FIRMS_MAP_KEY`. Cuota de 5,000 peticiones diarias por clave.
* **Modos de Fallo y Resiliencia:** Si la clave de entorno no está configurada o se excede la cuota de peticiones, el conector emite `None` de forma segura. El indicador A-5 se almacena como `sin_dato` y no altera el ICR municipal (A-5 se mantiene como indicador de contexto informativo y diagnóstico territorial).

### 3.8 Ficha Técnica FTE-CHIRPS-DAILY: Malla Satelital de Precipitación
* **Identificador Interno:** `FTE-CHIRPS-DAILY`
* **Entidad / Propietario:** Climate Hazards Center (UC Santa Barbara) / USGS
* **Indicadores que Alimenta:** A-3 (Anomalía de precipitación satelital) y A-4 (Días secos consecutivos de respaldo)
* **Endpoint URL Base:**
  `https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/netcdf/p05/chirps-v2.0.{YYYY}.days_p05.nc`
* **Mecanismo de Acceso:** Descarga HTTP de mallas NetCDF-4 comprimidas.
* **Frecuencia de Actualización:** Diaria con rezago operacional de 24 a 48 horas.
* **Especificación Técnica Ráster:** Malla regular global de 0.05° (~5.3 km de resolución espacial), cobertura latitudinal 50°S a 50°N. Variable: `precip` (milímetros diarios).
* **Procesamiento Zonal Espacial (Pipeline Python):**
  Mediante las librerías científicas `xarray`, `rioxarray` y `geopandas`, el pipeline extrae el clip espacial para Colombia (`bbox: [-79.5, -4.5, -66.8, 13.5]`) y ejecuta estadísticas zonales (`exact_extract` o `rasterstats`) para calcular la precipitación media areal por cada polígono municipal DANE.
* **Utilidad Estratégica:** Resuelve de manera concluyente la asimetría de la red telemétrica del IDEAM, garantizando que el 100% de los 1,122 municipios dispongan de series completas de precipitación diaria y cálculo de días sin lluvia.

---

## 4. Arquitectura y Flujo Conceptual del Pipeline de Ingestión Automatizada

El diseño arquitectónico del pipeline responde a los principios de la **Arquitectura Medallón** (ADR-0003), garantizando la separación estricta de responsabilidades entre el almacenamiento de datos crudos inmutables, la limpieza y normalización estructurada, y el cálculo transaccional de indicadores regulatorios.

```
+===================================================================================================+
|                            FLUJO GENERAL DEL PIPELINE DE INGESTIÓN                                |
+===================================================================================================+

  FUENTES EXTERNAS              ZONA BRONCE                   ZONA PLATA                  ZONA ORO
  
  [ NOAA CPC ] --------+
  [ XM Sinergox ] -----+     +------------------+         +------------------+         +------------------+
  [ INS SIVICAP ] -----+===> | Inmutable en     | ======> | Compuerta de     | ======> | Modelado         |
  [ IDEAM Socrata ] ---+     | Filesystem       |  ETL    | Calidad (Schema, |  dbt /  | Dimensional      |
  [ SUI Oracle ] ------+     | Nomenclatura:    | Limpieza| Rango RN-CAL,    | Python  | Indicadores A..R |
  [ UNGRD MinViv ] ----+     | YYYYMMDD_HHMMSS_ | DIVIPOLA| Tipado DuckDB)   |         | ICR Ponderado    |
  [ NASA FIRMS ] ------+     | <hash[:8]>.<ext> | DANE    | Parquet/Postgres |         | Regla de Piso    |
  [ CHIRPS NetCDF ] ---+     +------------------+         +------------------+         +------------------+
                                      |                            |                            |
                                      v                            v                            v
                                [ops.capturas]              [calidad_rechazo]           [corte_vigente]
                                Trazabilidad SHA-256        Auditoría de Frescura       data.js / GeoJSON
+===================================================================================================+
```

### 4.1 Zona Bronce (`data/bronce/`): Inmutabilidad y Trazabilidad Absoluta
1. **Regla de No Modificación (RF-ING-02):** Todo dato externo capturado se deposita directamente en el sistema de archivos sin aplicar conversiones, formateos ni eliminaciones de columnas. Queda terminantemente prohibido ejecutar operaciones de `UPDATE` o `DELETE` sobre el directorio Bronce.
2. **Convención Estricta de Nomenclatura:** Los archivos crudos se almacenan en subdirectorios por fuente utilizando el patrón:
   `data/bronce/fte_<fuente>/YYYYMMDD_HHMMSS_<hash[:8]>.<extension>`
   *(Ejemplos reales observados en el repositorio: `20261014_085600_a1b2c3d4.json`, `20261106_030000_f8e219ba.csv`).*
3. **Control Criptográfico de Idempotencia (RF-ING-03):** Antes de persistir un archivo en Bronce, el sistema calcula su firma digital SHA-256. Si el hash resultante coincide con la última captura exitosa de esa misma fuente, se descarta el duplicado y se registra en el log operacional con estado `sin_cambios`.
4. **Metadatos de Auditoría:** Cada captura genera un registro estructurado en `data/ops/capturas.json`:
   * `id_captura` (UUID v4)
   * `id_fuente` (ej. `FTE-XM-EMBALSES`)
   * `timestamp_inicio` / `timestamp_fin` (UTC)
   * `estado` (`exitosa`, `fallida`, `sin_cambios`)
   * `hash_sha256` (64 caracteres hexadecimales)
   * `tamano_bytes` y `filas_extraidas`
   * `url_origen` y `codigo_http_respuesta`

### 4.2 Compuerta de Calidad y Validación de Contratos
Entre la Zona Bronce y la Zona Plata se interpone un motor de validación de calidad automática que ejecuta:
* **Verificación de Contrato de Esquema (RF-CAL-01):** Valida la presencia inalterada de columnas requeridas y tipos de datos esperados. Si una entidad externa altera el nombre de una clave (ej. SIVICAP renombrando `irca` a `valor_irca`), la compuerta rechaza la carga hacia Plata, conserva el último estado válido y genera una alerta técnica inmediata a los administradores.
* **Comprobación de Límites Físicos (Reglas RN-CAL):**
  * Continuidad (S-1): $0.0 \le \text{Horas/Día} \le 24.0$
  * Calidad de Agua (S-2): $0.0 \le \text{IRCA} \le 100.0$
  * Cobertura Urbana (S-3): $0.0 \le \text{Cobertura} \le 100.0$
  * Pérdidas de Agua (S-4): $0.0 \le \text{IANC} \le 100.0$
  * Anomalía de Lluvia (A-3): $\text{Anomalía} \ge -100.0\%$
  * Días Secos Consecutivos (A-4): $\text{Días} \ge 0$
  * Nivel de Embalses (H-5): $0.0 \le \text{Volumen Útil} \le 100.0\%$
  Los registros que violen estos límites se marcan con el flag `fuera_de_rango` en la tabla de excepciones de calidad y se excluyen de la agregación del ICR.

### 4.3 Zona Plata (`data/plata/`): Normalización y Enriquecimiento Territorial
1. **Normalización DIVIPOLA DANE:** Se homologan todos los identificadores espaciales al código DIVIPOLA DANE de 5 dígitos como texto, rellenando con ceros a la izquierda (`LPAD(cod_municipio, 5, '0')`). Esto elimina inconsistencias históricas entre códigos numéricos enteros (ej. `5001` vs `05001` para Medellín).
2. **Estructura Columnar y Motor Analítico:** La Zona Plata se gestiona en DuckDB y archivos Parquet particionados por año y mes. Permite consultas analíticas vectorizadas de alto rendimiento sobre millones de registros climáticos y operativos en milisegundos.
3. **Medición de Frescura por Indicador (RF-CAL-03):** Se computa el lapso transcurrido entre la `fecha_corte` y la `fecha_dato` de la fuente:
   * Estado `vigente`: Si $\text{Antigüedad} \le 1.5 \times \text{Periodicidad Esperada}$.
   * Estado `desactualizado`: Si supera dicho umbral, notificando al usuario en los metadatos de la interfaz visual.

### 4.4 Zona Oro (`data/oro/`): Modelo Dimensional y Cálculo del ICR
1. **Esquema Dimensional Consolidado:**
   * `dim_territorio`: Catálogo maestro de los 1,122 municipios, departamentos, subregiones hidrográficas, centroides y poblaciones DANE.
   * `dim_indicador`: Catálogo oficial de los 20 indicadores con sus ponderadores y rangos de quiebre.
   * `fct_indicador_municipio`: Grano por fecha de corte, municipio e indicador. Almacena valor bruto, valor normalizado (0 a 100) y frescura.
   * `fct_icr_municipio`: Grano por fecha de corte y municipio. Almacena los subíndices de capa ($A, H, S, R$), el porcentaje de cobertura de datos municipal, el puntaje consolidado del ICR y el nivel de alerta oficial.
2. **Piso por Impacto Confirmado (RF-ICR-06):** Si un municipio presenta racionamiento formalizado (R-3) o declaratoria de calamidad pública vigente (R-4), el sistema asigna de forma obligatoria como mínimo el nivel de alerta **Naranja**, incluso si la fórmula matemática del ICR arrojase un puntaje inferior, registrando la traza `nivel_por_regla = true`.
3. **Publicación Atómica y Sin Bloqueos:** La consolidación diaria genera los archivos de entrega (`corte_vigente.json`, `data.js` para el frontend y `vigia_corte_actualizado_arcgis.geojson` para geoportales). Para prevenir que lecturas concurrentes consuman un archivo a medio escribir, el orquestador escribe primero en un archivo temporal (`.tmp`) en el mismo sistema de archivos y ejecuta un reemplazo atómico transaccional (`os.replace`).

---

## 5. Cronograma de Ejecución y Orquestación de Cargas

El ciclo de adquisición está escalonado para respetar las ventanas de cierre y publicación de cada entidad oficial, garantizando que el corte oficial de la CRA se encuentre consolidado, auditado y publicado antes de las 06:15 AM (COT) de cada día.

```
+===================================================================================================+
|                     CRONOGRAMA DIARIO ESCALONADO DE INGESTIÓN (COT)                               |
+===================================================================================================+

  03:00 COT  [FTE-XM-EMBALSES]       -> Cierre de embalses del SIN del día anterior.
  04:00 COT  [FTE-FIRMS-NASA]        -> Pasadas orbitales nocturnas satélites VIIRS.
  04:30 COT  [FTE-CHIRPS-DAILY]      -> Mallas ráster satelitales de lluvia acumulada.
  05:00 COT  [FTE-IDEAM-CLIMA]       -> Ejecución de cargas batch desacopladas IDEAM.
  05:30 COT  [FTE-UNGRD-MVCT]        -> Sincronización de eventos y actos administrativos.
  05:45 COT  [FTE-INS-IRCA]          -> Consulta de actualizaciones en SIVICAP Socrata.
  06:00 COT  [PIPELINE CORTE DIARIO] -> Transformación Bronce -> Plata -> Oro y cálculo ICR.
  06:10 COT  [AUDITORÍA FORENSE]     -> Verificación criptográfica SHA-256 de 460 controles.
  06:15 COT  [PUBLICACIÓN ATÓMICA]   -> Sincronización final: corte_vigente.json y data.js.

+===================================================================================================+
|                     CICLOS PERIÓDICOS COMPLEMENTARIOS (COT)                                       |
+===================================================================================================+

  LUNES 12:30 COT     [FTE-CPC-NOAA]     -> Boletín semanal SST Niño 1+2, 3, 3.4 y 4.
  DÍA 10 DE CADA MES  [FTE-CPC-ONI]      -> Actualización trimestral ONI y discusión ENSO.
  DÍA 16 DE CADA MES  [FTE-SSPD-SUI]     -> Sincronización bodega Oracle / Extracto SUI.
  SEMESTRAL           [FTE-IDEAM-ENA]    -> Actualización de índices territoriales IVH / IUA.
+===================================================================================================+
```

### Orquestación Técnica
* **Entornos de Desarrollo y Servidores On-Premise Locales:** Orquestación gestionada mediante tareas programadas del sistema operativo (*Windows Task Scheduler* o *Linux Cron*) ejecutando scripts PowerShell y Python (`ingesta/ejecutar_corte_diario.ps1`).
* **Entorno Productivo Institucional:** Despliegue de Directed Acyclic Graphs (DAGs) en **Apache Airflow** (o Cloud Composer), aprovechando operadores estándar (`BashOperator`, `PythonOperator`, `OracleOperator`) con reintentos configurables y monitoreo de SLAs de ejecución.

---

## 6. Estrategia de Resiliencia, Tolerancia a Fallos y Degradación Controlada

### 6.1 Circuit Breaker y Reintentos Exponenciales (RF-ING-04)
Ante anomalías en la comunicación con servidores externos, el orquestador clasifica la naturaleza del error:
1. **Errores Transitorios de Red (Códigos HTTP 5xx, 408 Timeout, Connection Reset):**
   * El sistema no desfallece de inmediato. Aplica un patrón de *Exponential Backoff* con tres (3) intentos sucesivos espaciados en intervalos crecientes:
     * Intento 1: A los 2 minutos de la falla inicial.
     * Intento 2: A los 8 minutos del segundo intento.
     * Intento 3: A los 32 minutos del tercer intento.
   * Si en cualquiera de los intentos el servidor responde satisfactoriamente (HTTP 200), la captura se marca como `exitosa` y continúa el flujo.
2. **Errores de Cliente / Autenticación (Códigos HTTP 4xx: 400, 401, 403, 404):**
   * Indican un cambio de contrato, revocación de credenciales o privatización del recurso. El sistema aborta de inmediato los reintentos para no saturar el servicio, registra el incidente como `fallida` en `ops.capturas` y emite una alerta crítica por correo electrónico y webhook al equipo de administradores de datos (RF-ING-05).

### 6.2 Jerarquía de Respaldo y Failover Multinivel
Para asegurar que el cálculo regulatorio diario nunca se detenga, se implementa una política de contingencia jerarquizada en tres niveles:

```
  +-------------------------------------------------------------+
  | NIVEL 1: Consulta Directa en Vivo a la API Oficial          |
  | (Estado ideal: dato fresco del día capturado y verificado)  |
  +-------------------------------------------------------------+
                                | Fallo persistente
                                v
  +-------------------------------------------------------------+
  | NIVEL 2: Último Crudo Certificado en Zona Bronce            |
  | (Carga el snapshot anterior válido en Bronce; el indicador  |
  | se calcula pero se etiqueta con frescura 'desactualizado')  |
  +-------------------------------------------------------------+
                                | Ausencia total histórica
                                v
  +-------------------------------------------------------------+
  | NIVEL 3: Ausencia de Dato / Seguro 'sin_dato' (RF-ICR-04)   |
  | (Indicador queda en null; NUNCA se asumen ceros ni medias;  |
  | se aplica la redistribución matemática proporcional de peso)|
  +-------------------------------------------------------------+
```

### 6.3 Redistribución Matemática de Pesos del ICR (RF-ICR-04)
La regla de negocio RF-ICR-04 establece con rigor cómo debe operar el cálculo del ICR ante la ausencia física de información en uno o más indicadores o capas completas para un municipio específico:

1. **Subíndice de Capa con Indicadores Parciales:**
   Si dentro de una capa dimensional (ej. Capa S) se encuentran disponibles 3 de sus 5 indicadores, el subíndice de dicha capa se calcula como la media aritmética simple de los indicadores disponibles:
   $$S = \frac{1}{|K_{\text{disp}}|} \sum_{i \in K_{\text{disp}}} \text{Puntaje}_i$$
   *(Para la Capa R, el subíndice corresponde al valor máximo de los indicadores disponibles, $R = \max_{j} (\text{Puntaje}_j)$).*

2. **Capa Entera sin Datos y Redistribución Proporcional:**
   Si todos los indicadores de una capa dimensional resultan en `sin_dato` (por ejemplo, Capa H ausente en un municipio no cubierto por embalses ni ENA):
   * El peso nominal de las capas activas se redistribuye proporcionalmente para que sumen el 100% de la evaluación:
     $$\text{Peso Efectivo}_k = \frac{\text{Peso Nominal}_k}{\sum_{m \in \text{Capas Activas}} \text{Peso Nominal}_m}$$
   * **Ejemplo Práctico 1 (Capa H sin datos):**
     * Pesos Nominales: $A = 0.30$, $H = 0.30$ (sin dato), $S = 0.25$, $R = 0.15$.
     * Suma de Capas Activas = $0.30 + 0.25 + 0.15 = 0.70$ (70% de cobertura de datos $\ge 60\%$).
     * Pesos Efectivos Redistribuidos:
       * $\text{Peso Efectivo } A = 0.30 / 0.70 = 42.86\%$
       * $\text{Peso Efectivo } S = 0.25 / 0.70 = 35.71\%$
       * $\text{Peso Efectivo } R = 0.15 / 0.70 = 21.43\%$
       * $\text{Total} = 42.86\% + 35.71\% + 21.43\% = 100.00\%$
     * Si los subíndices calculados son $A = 70.0$, $S = 50.0$, $R = 0.0$, el ICR efectivo es:
       $$\text{ICR} = (70.0 \times 0.4286) + (50.0 \times 0.3571) + (0.0 \times 0.2143) = 30.00 + 17.86 + 0.00 = 47.86$$
       *(Nivel de Alerta: Amarilla, Cobertura de Datos: 70%).*

3. **Seguro de Insuficiencia de Datos (< 60%):**
   * Si la suma de los pesos nominales de las capas con datos disponibles es estrictamente inferior al 60% ($< 0.60$), el sistema **no calcula el ICR numérico**, emitiendo `ICR = null` y clasificando el municipio en estado oficial `sin_dato`.
   * **Ejemplo Práctico 2:** Si únicamente se encuentra disponible la Capa S (peso nominal 25%), dado que $25\% < 60\%$, el ICR queda en `sin_dato` y el municipio no recibe color de alerta automático, activando un informe de supervisión para el equipo técnico.

---

## 7. Hoja de Ruta Técnica de Implementación por Fases

La transición hacia la operatividad plena del sistema se estructura en una hoja de ruta técnica de cuatro (4) fases secuenciales diseñadas para asegurar la continuidad del servicio, mitigar riesgos de integración y validar paso a paso la integridad de los datos.

```
+===================================================================================================+
|                            HOJA DE RUTA TÉCNICA DE IMPLEMENTACIÓN                                 |
+===================================================================================================+

  [FASE 1: Quick Wins y Aseguramiento] ----> Semanas 1 a 2
  - Despliegue de conectores funcionales estables (NOAA, XM, SIVICAP, FIRMS).
  - Reactivación obligatoria de contexto SSL/TLS en conector_base.py.
  - Normalización del Catálogo Maestro DIVIPOLA DANE (1,122 municipios).
  
  [FASE 2: Formalización SUI y UNGRD] ------> Semanas 3 a 5
  - Activación de queries_sui/ sobre bodega Oracle bajo convenio CRA-SSPD.
  - Mesa técnica con Sala de Crisis UNGRD y MinVivienda (Survey123).
  - Implementación de reporte diario de embalses Res. SSPD 20241000395385.
  
  [FASE 3: Mallas Satelitales e IDEAM] -----> Semanas 6 a 8
  - Despliegue del pipeline batch particionado mensual para IDEAM s54a-sgyg.
  - Conector ráster CHIRPS (precipitación diaria 0.05° en NetCDF-4).
  - Precarga de capas territoriales ENA (IVH e IUA) desde SIAC/MADS.
  
  [FASE 4: Industrialización y CI/CD] ------> Semanas 9 a 10
  - Orquestación de DAGs en Apache Airflow / Cloud Composer.
  - Compuertas de calidad automatizadas dbt test (esquemas Plata y Oro).
  - Ejecución continua y desatendida del Auditor Forense con 460 puntos SHA-256.

+===================================================================================================+
```

### 7.1 Fase 1: Quick Wins y Aseguramiento Inmediato (Semanas 1 - 2)
* **Objetivo:** Consolidar las fuentes públicas abiertas ya verificadas que no requieren convenios interinstitucionales complejos y asegurar el entorno de ejecución.
* **Actividades Principales:**
  1. Estandarizar y auditar `conector_base.py`, verificando la reactivación permanente de certificados SSL/TLS válidos (`ssl.create_default_context()`) y la cabecera `User-Agent: CRA-VigiaNino/1.0`.
  2. Desplegar los conectores productivos de NOAA CPC (`conector_noaa.py`), XM Sinergox (`conector_xm_embalses.py`) y SIVICAP (`conector_sivicap.py`).
  3. Gestionar la credencial oficial `FIRMS_MAP_KEY` en el archivo seguro `.env` y activar el filtrado espacial de focos de calor.
  4. Homologar el catálogo maestro de 1,122 municipios en `data/config/catalogo_municipios_ideam.json` contra el Marco Geoestadístico Nacional (MGN) del DANE.
* **Entregables:** Conectores base operativos en producción, crudos inmutables en Bronce para NOAA, XM y SIVICAP, y catálogo DIVIPOLA 100% normalizado.

### 7.2 Fase 2: Formalización Interinstitucional y Acceso SUI / UNGRD (Semanas 3 - 5)
* **Objetivo:** Materializar la integración formal con la bodega central de la Superintendencia de Servicios Públicos Domiciliarios y la Sala de Crisis de la UNGRD.
* **Actividades Principales:**
  1. Habilitar el túnel VPN IPSec institucional y las credenciales de lectura en `sui-scan.sspd.gov.co:1521/SUIPRD` para ejecutar la suite de consultas `ingesta/queries_sui/` (SUI_EXT_01 a 06).
  2. Implementar la carga y verificación de extractos oficiales SUI certificados (`extracto_oficial_sui_2026.json`) como contingencia ante caídas de VPN.
  3. Configurar el canal de recepción diaria de datos con la Sala de Crisis Nacional de la UNGRD y el Viceministerio de Agua (Survey123 de desabastecimiento), acoplándolo a `data/config/actos_administrativos_verificados.json`.
  4. Incorporar la ingesta del reporte diario de embalses operados por prestadores de acueducto bajo la Resolución SSPD 20241000395385.
* **Entregables:** Ingestión directa de continuidad (S-1), pérdidas (S-4), cobertura (S-3) y PQR (S-5) desde la base SUI; erradicación total de decretos ficticios en capa R.

### 7.3 Fase 3: Mallas Satelitales e Integración IDEAM Masiva (Semanas 6 - 8)
* **Objetivo:** Superar los cuellos de botella de consulta en las bases abiertas del IDEAM y alcanzar el 100% de cobertura espacial en precipitaciones y días secos.
* **Actividades Principales:**
  1. Desplegar el pipeline batch nocturno desacoplado para la tabla masiva `s54a-sgyg` del IDEAM, ejecutando extracciones particionadas mensualmente y preagregando los acumulados a nivel DIVIPOLA.
  2. Implementar el módulo ráster CHIRPS en Python (`xarray` / `rioxarray` / `geopandas`) para descargar las mallas diarias NetCDF de 0.05° y extraer la precipitación media areal por municipio.
  3. Cargar las capas poligonales oficiales del Estudio Nacional del Agua (ENA) para computar de forma estática y precisa los indicadores H-2 (IVH) y H-3 (IUA) por subzona hidrográfica (SZH).
* **Entregables:** Indicadores A-3 y A-4 calculados para el 100% de los municipios sin timeouts de red; integración satelital CHIRPS como respaldo de alta resolución.

### 7.4 Fase 4: Industrialización, Calidad y CI/CD (Semanas 9 - 10)
* **Objetivo:** Automatizar integralmente el pipeline bajo estándares de ingeniería de software empresarial, monitoreo continuo y pruebas automáticas.
* **Actividades Principales:**
  1. Configurar los DAGs de orquestación en Apache Airflow con programación horaria escalonada, políticas de reintento automático y notificaciones vía Slack/Email.
  2. Automatizar las pruebas de compuerta de calidad mediante suites de prueba de **dbt** (`dbt test`) sobre los modelos de Zona Plata y Zona Oro.
  3. Incorporar la ejecución desatendida del script de auditoría forense (`auditor_veracidad.py`), bloqueando de forma automática la publicación del corte si se detecta cualquier discrepancia criptográfica en los 460 puntos de control SHA-256.
  4. Configurar el pipeline de integración continua (CI/CD) en GitHub Actions o GitLab CI para ejecutar linters, análisis de seguridad (`bandit`) y pruebas unitarias automáticas ante cada cambio en el repositorio.
* **Entregables:** Sistema Vigía El Niño completamente autónomo, auditable, escalable y certificado para la toma de decisiones regulatorias de la CRA.

### 7.5 Matriz RACI del Plan de Implementación

| Actividad / Entregable | CRA (Líder Técnico) | SSPD (SUI) | IDEAM | UNGRD / MinVivienda | Proveedor / Dev |
|---|---|---|---|---|---|
| Conexión APIs públicas (NOAA, XM, SIVICAP, FIRMS) | **A** | I | I | I | **R** |
| Acceso y VPN a Bodega Oracle SUI | **A** | **R** | I | I | C |
| Protocolo Verificación Actos Administrativos | **A** | I | I | **R** | C |
| Pipeline Desacoplado IDEAM / Mallas CHIRPS | **A** | I | **C** | I | **R** |
| Despliegue de DAGs Airflow y CI/CD | **A** | I | I | I | **R** |
| Certificación Diaria de Veracidad Forense | **A / R** | I | I | I | C |

*(Convención: **R** = Responsable de ejecución, **A** = Aprobador final / Accountable, **C** = Consultado, **I** = Informado).*

---

## 8. Protocolo de Verificación Independiente y Criterios de Aceptación

Para certificar que la arquitectura de ingestión y sus conectores cumplen con las especificaciones de este plan, cualquier auditor técnico o evaluador independiente puede ejecutar el siguiente protocolo de pruebas desde el entorno PowerShell/Python en la raíz del proyecto:

### 8.1 Verificación de Conectividad y Respuestas en Vivo (Smoke Tests de Red)
Ejecutar el siguiente script en línea de comandos para constatar la disponibilidad de los endpoints oficiales:

```powershell
python -c "
import urllib.request, json, ssl

ctx = ssl.create_default_context()
headers = {'User-Agent': 'CRA-VigiaNino/1.0'}

# 1. NOAA CPC Semanal
req_noaa = urllib.request.Request('https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for', headers=headers)
with urllib.request.urlopen(req_noaa, context=ctx, timeout=10) as r:
    print('1. NOAA Semanal Status:', r.status, '(OK)')

# 2. XM Sinergox API Embalses
payload_xm = json.dumps({'MetricId': 'PorcVoluUtilDiar', 'StartDate': '2026-10-01', 'EndDate': '2026-10-02', 'Entity': 'Sistema'}).encode('utf-8')
req_xm = urllib.request.Request('https://servapibi.xm.com.co/daily', data=payload_xm, headers={'User-Agent': 'CRA-VigiaNino/1.0', 'Content-Type': 'application/json'})
with urllib.request.urlopen(req_xm, context=ctx, timeout=10) as r:
    print('2. XM Sinergox Status:', r.status, '(OK)')

# 3. SIVICAP IRCA Socrata
req_sivicap = urllib.request.Request('https://www.datos.gov.co/resource/nxt2-39c3.json?%24limit=1', headers=headers)
with urllib.request.urlopen(req_sivicap, context=ctx, timeout=10) as r:
    data = json.loads(r.read().decode())
    print('3. SIVICAP IRCA Status:', r.status, 'con registros válidos:', len(data) > 0)
"
```

### 8.2 Ejecución de Pruebas Unitarias de Ingesta y Calidad
Ejecutar la suite automatizada de pruebas del repositorio para certificar que los conectores respetan los contratos y que el cálculo del ICR con datos faltantes cumple la redistribución RF-ICR-04:

```powershell
$env:PYTHONPATH="."
pytest ingesta/tests/test_conectores.py ingesta/tests/test_indice_riesgo.py -v
```

### 8.3 Inspección de Archivos Crudos y Auditoría Criptográfica
Comprobar la existencia física e inmutabilidad de los crudos en Zona Bronce y la coherencia del registro operacional:

```powershell
# Listar estructura de crudos en Bronce
Get-ChildItem -Path data\bronce -Recurse | Where-Object { -not $_.PSIsContainer } | Select-Object FullName, Length

# Verificar últimas capturas en registro de operaciones
Get-Content -Path data\ops\capturas.json | ConvertFrom-Json | Select-Object -Last 5 | Format-Table id_fuente, estado, hash_sha256, filas
```

### 8.4 Condiciones de Invalidación Técnica
El presente plan y la publicación del corte diario se considerarán automáticamente invalidados si se detecta alguna de las siguientes condiciones:
1. Retorno de valores sintéticos o hardcodeados en cualquier script de conector.
2. Inactivación de la verificación de certificados TLS (`verify_mode = ssl.CERT_NONE`).
3. Modificación o eliminación de archivos previamente persistidos en `data/bronce/`.
4. Publicación de un corte con menos del 60% de cobertura sin marcar el ICR en `sin_dato`.
5. Incorporación de decretos de calamidad pública no verificables en gacetas oficiales.

---
**Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)**  
*Subdirección de Regulación Tarifaria & Dirección de Tecnologías de la Información*  
*Sistema Vigía El Niño · Acueductos — República de Colombia*
