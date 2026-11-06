# Handoff Report — Explorer 2: Domain & Real Data Sources Specialist

**Fecha:** 2026-11-06  
**Agente:** Explorer 2 (`explorer_survey_2`)  
**Misión:** Diagnóstico de requerimientos de datos, inventario del repositorio, evaluación técnica de fuentes oficiales (nacionales e internacionales) y diseño de arquitectura del pipeline automatizado de ingestión para el sistema *Vigía El Niño · Acueductos (CRA)*.  
**Destinatario:** Orquestador (`ab9340ac-f663-430c-ac20-00b7601d9edb`)

---

## 1. Observation

Durante la investigación técnica se inspeccionaron exhaustivamente la base de código, los archivos de configuración, las zonas de almacenamiento Medallón (`data/bronce`, `data/plata`, `data/oro`, `data/ops`, `data/config`), las especificaciones funcionales en `context-lake/specs/`, los antecedentes de auditoría forense institucional en `context-lake/docs/` y se realizaron pruebas activas de conectividad y extracción HTTP/TLS contra los endpoints oficiales externos.

A continuación se resumen los hallazgos observados directamente:

### 1.1 Estado del Repositorio y Evolución de Conectores (Crudos vs Mock)
* **Arquitectura Medallón Implementada en Filesystem:**
  * `data/bronce/`: Archivos crudos inmutables organizados por prefijo `fte_*` (`fte_cpc_noaa`, `fte_ins_irca`, `fte_ideam_clima`, `fte_ungrd_mvct`, `fte_xm_embalses`, `fte_xm_historico`, `fte_sui`, `fte_sspd_sui`, `fte_firms_nasa`). La convención de nombres es `YYYYMMDD_HHMMSS_<hash[:8]>.<ext>` (cumplimiento `RF-ING-02`).
  * `data/ops/`: Trazabilidad operacional en `capturas.json` (500 eventos máximos), registros de cortes diarios `auditoria_corte_*.json`, ejecuciones semanales y recuperación histórica.
  * `data/config/`: Catálogos maestros `catalogo_municipios_ideam.json`, `comparativo_semanal.json` (`v1.1.0-20261013`) y `actos_administrativos_verificados.json`.
  * `data/oro/`: Consolidado de indicadores y corte publicado `corte_vigente.json`, snapshots diarios versionados (`corte_YYYY-MM-DD.json`) y serie histórica semanal en `data/oro/semanal/historico/`.

* **Dictamen de Auditoría Forense Previa (14 de octubre de 2026):**
  * En `context-lake/docs/Informe_Auditoria_Forense_Vigia_El_Nino_CRA_20261014.md`, el CIO de la CRA documentó una **No Conformidad Crítica** en la versión inicial `v1.0.0`:
    * *Hallazgo H-01:* Invención de actos administrativos en `conector_ungrd_minvivienda.py` (decretos simulados como "Resolución Alcaldía Mayor 128-2026" para Bogotá D.C. o "Decreto Distrital 089-2026" para Santa Marta).
    * *Hallazgo H-02:* Falsificación del nivel de embalses en `conector_xm_embalses.py` fijando Chuza en `43.8 %` cuando en la API real de XM marcaba `90.15 %` al 2026-10-13.
    * *Hallazgo H-03:* Simulación de variables de precipitación y caudales del IDEAM en `conector_ideam.py` y omisión del municipio de Tuta (Boyacá, DIVIPOLA `15837`) dentro del diccionario estático.
    * *Hallazgo H-04:* Inyección de datos estáticos en indicadores SUI (`pipeline_corte.py`), incluyendo H-4 (autonomía) fijada en una constante de 14.0 horas y S-6 (consumo) en 12.8 m³/susc/mes para todos los municipios sin diferenciar por piso térmico (Res. CRA 887/2019).
    * *Hallazgo H-05:* Focos de calor simulados de NASA FIRMS y probabilidad fija del 75.0% para NOAA en lugar del 83.0% del boletín de octubre.
    * *Hallazgo H-06:* Validación circular y tautológica en `auditoria/auditor_veracidad.py`.
    * *Bug B-05:* Desactivación global de verificación SSL (`verify_mode = ssl.CERT_NONE`) en `conector_base.py`.

* **Estado de las Correcciones Post-Auditoría (v1.1.0):**
  * `conector_base.py` (línea 87): Reactivó contexto SSL seguro por defecto: `self.ssl_context = ssl.create_default_context()`.
  * `conector_xm_embalses.py` (líneas 80-105 y 151-195): Conectado a la API REST real de XM Sinergox (`https://servapibi.xm.com.co/daily`) para `MetricId: PorcVoluUtilDiar`.
  * `conector_sivicap.py` (líneas 18-28 y 65-75): Conectado directamente a la API Socrata de Datos Abiertos (`datos.gov.co/resource/nxt2-39c3.json`) para el IRCA municipal.
  * `conector_noaa.py`: Descarga y parsea en vivo los índices semanales `wksst9120.for` y el archivo histórico `oni.ascii.txt` de NOAA CPC.
  * `conector_sui.py` (nuevo componente): Lee el extracto certificado oficial en `data/bronce/fte_sui/extracto_oficial_sui_2026.json`.
  * `conector_ungrd_minvivienda.py`: Implementó consulta a datos abiertos (`2343-nuqp.json`) y filtro de seguridad mediante `actos_administrativos_verificados.json`.
  * `conector_nasa_firms.py`: Consume `FIRMS_MAP_KEY`. Si la clave de entorno no está provista, emite `None` de forma segura sin generar datos sintéticos.
  * `ingesta/queries_sui/`: Suite completa de 7 scripts SQL parametrizados para consultar la bodega institucional Oracle de la SSPD (`sui-scan.sspd.gov.co:1521/SUIPRD`) y módulo alternativo Socrata.

### 1.2 Pruebas de Conectividad y Respuestas de Endpoints en Vivo
Se ejecutaron consultas HTTP reales desde el entorno PowerShell/Python contra los servicios externos identificados:
1. **NOAA CPC Semanal (`https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for`):**
   * *Resultado:* HTTP 200 OK. Responde archivo de ancho fijo con observaciones semanales de anomalías Niño 1+2, Niño 3, Niño 3.4 y Niño 4.
2. **XM Sinergox API (`https://servapibi.xm.com.co/daily`):**
   * *Resultado:* HTTP 200 OK vía POST con JSON `{ "MetricId": "PorcVoluUtilDiar", "StartDate": "2026-10-01", "EndDate": "2026-10-02", "Entity": "Sistema" }`. Responde claves `Metric` y `Items` con volumen útil diario del SIN.
3. **Socrata IRCA Nacional INS SIVICAP (`https://www.datos.gov.co/resource/nxt2-39c3.json`):**
   * *Resultado:* HTTP 200 OK. Responde esquema completo: `departamentocodigo`, `departamento`, `municipiocodigo`, `municipio`, `a_o`, `irca`, `nivel_de_riesgo`, `ircaurbano`, `nivel_de_riesgo_urbano`, `ircarural`, `nivel_de_riesgo_rural`.
4. **Socrata IDEAM Precipitación (`https://www.datos.gov.co/resource/s54a-sgyg.json`):**
   * *Resultado:* HTTP 200 OK. Responde esquema: `codigoestacion`, `codigosensor`, `fechaobservacion`, `valorobservado`, `nombreestacion`, `departamento`, `municipio`, `zonahidrografica`, `latitud`, `longitud`.
5. **Socrata IDEAM Catálogo de Estaciones (`https://www.datos.gov.co/resource/hp9r-jxuu.json`):**
   * *Resultado:* HTTP 200 OK. Contiene metadatos de más de 4,000 estaciones hidrometeorológicas nacionales.
6. **Socrata IDEAM Cuasi-Tiempo-Real (`https://www.datos.gov.co/resource/57sv-p2fu.json`):**
   * *Resultado:* HTTP 200 OK. Reportes telemétricos preliminares de sensores en minutos/horas.
7. **Socrata UNGRD Emergencias V2 (`https://www.datos.gov.co/resource/2343-nuqp.json`):**
   * *Resultado:* HTTP 200 OK. Posee 13,012 registros con fecha mínima `2025-01-01` y fecha máxima `2025-12-31`. Contiene campos específicos como `no_ecreto_de_calamidad_publica`, `agua_potable_en_galones_x`, `acued`, `codificaci_n_segun_divipola`, `descripcion_agua_y_saneamiento`. El corte 2026 aún no se publica en Socrata.
8. **Socrata SUI Cobertura (`https://www.datos.gov.co/resource/stxq-kks6.json`):**
   * *Resultado:* HTTP 403 Forbidden. El conjunto fue privatizado o descontinuado por la SSPD en la plataforma pública.
9. **Socrata RUPS Prestadores (`https://www.datos.gov.co/resource/4qkq-csdn.json`):**
   * *Resultado:* HTTP 200 OK. Permite consultar el catastro de prestadores inscritos por NIT y municipio.

---

## 2. Logic Chain

A partir de las observaciones anteriores, se construye la siguiente cadena lógica de deducción técnica:

1. **Premisa 1 (Marco Normativo y Regulatorio):**
   El sistema Vigía El Niño · Acueductos tiene como finalidad sustentar decisiones regulatorias de la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA) y alertas tempranas interinstitucionales (con MinVivienda, SSPD, IDEAM y UNGRD). En consecuencia, **ningún indicador del Índice Compuesto de Riesgo (ICR) puede depender de valores inventados, interpolaciones arbitrarias o números de actos administrativos no contrastados** (verificado en la Auditoría Forense CRA 2026-10-14).

2. **Premisa 2 (Disponibilidad Asimétrica de Fuentes Primarias):**
   Las fuentes externas no presentan el mismo grado de madurez técnica ni los mismos canales de publicación:
   * *Madurez Alta (API REST pública y disponible):* NOAA CPC (archivos de texto estables), XM Sinergox (API REST JSON diaria sin auth), INS SIVICAP (Socrata SoQL API), NASA FIRMS (API REST con MAP_KEY).
   * *Madurez Media (APIs de datos abiertos masivas pero complejas):* IDEAM (Socrata `s54a-sgyg` y `57sv-p2fu` son masivas, no tienen preagregación municipal en vivo y causan timeouts sin particionamiento; DHIME carece de API abierta).
   * *Madurez Condicionada / Acceso Restringido:* SUI SSPD (no tiene API REST pública abierta; depende de la bodega Oracle institucional bajo VPN/credenciales o de la carga asistida de extractos certificados; el reporte diario de embalses por Res. 20241000395385 inició en Google Forms y pasa a SUI sin API pública confirmada); UNGRD (los datasets abiertos anuales en datos.gov.co tienen un rezago de 6 a 12 meses; las declaratorias del día a día viven en la Sala de Crisis Nacional o en gacetas municipales).

3. **Premisa 3 (Identificación del Cuello de Botella de Ingestión Diaria):**
   Dado que IDEAM y SUI no proveen endpoints REST de respuesta instantánea para los 1,122 municipios del país a las 05:00 AM, pretender consultar 1,122 municipios directamente contra Socrata `s54a-sgyg` en cada corte diario provocaría fallas recurrentes por timeout o denegación de servicio (HTTP 429/504).

4. **Premisa 4 (Estrategia de Doble Vía / Resiliencia Multinivel):**
   Para garantizar que el corte diario de las 06:00 AM se complete en menos de 45 minutos (cumplimiento `RNF-ING-01` y `RNF-CAL-02`) con 100% de veracidad fehaciente, el pipeline debe implementar:
   * **Vía Primaria (En Vivo / Alta Frecuencia):** Ingestión automatizada de APIs en tiempo real para variables dinámicas (NOAA, XM, SIVICAP, FIRMS y sensores cuasi-reales).
   * **Vía Secundaria (Extracción Programada / Batch):** Pipeline desacoplado de procesamiento nocturno sobre Socrata IDEAM (como el desarrollado en `ingesta/historico/recuperacion.py`) que precalcule las anomalías a 30 días y días secos por DIVIPOLA antes del corte diario.
   * **Vía Institucional Formal (Bodega SUI & Sala de Crisis UNGRD):** Protocolo de transferencia segura mediante conector Oracle SUI (`ingesta/queries_sui/`) bajo convenio interinstitucional CRA-SSPD, o ingestión de extractos oficiales certificados en Bronce (`extracto_oficial_sui_2026.json`) validados con hash SHA-256.
   * **Vía Gridded / Satelital de Contingencia (CHIRPS):** Ingestión de mallas satelitales CHIRPS de 0.05° para cubrir municipios sin estaciones telemétricas del IDEAM (e.g. Alta Guajira).

5. **Conclusión de la Cadena Lógica:**
   Es técnicamente viable conectar fuentes 100% reales y eliminar definitivamente los datos mock, siempre que se formalice la matriz técnica de conectores, se configure la ingesta escalonada en arquitectura Medallón y se aplique una política estricta de degradación controlada (`sin_dato` con redistribución de pesos según `RF-ICR-04`), prohibiendo por diseño cualquier inyección de valores quemados en código.

---

## 3. Matriz Técnica de Fuentes Oficiales Evaluadas

A continuación se detalla la evaluación técnica exhaustiva de cada fuente oficial identificada, especificando sus endpoints, mecanismos de acceso, esquemas, periodicidad, límites y modos de fallo.

### Matriz Comparativa de Fuentes Primarias

| Fuente / Entidad | Indicadores Relacionados | Mecanismo de Acceso | Endpoint URL / Identificador | Autenticación | Frecuencia de Actualización | Formato / Esquema | Rate Limits / Cuotas | Modo de Fallo Típico & Resiliencia |
|---|---|---|---|---|---|---|---|---|
| **NOAA Climate Prediction Center (CPC)** | A-1 (SST Niño 1+2, 3, 3.4, 4; ONI), A-2 (Discusión ENSO) | HTTP GET directo (Web feed) | `https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for` (semanal) y `oni.ascii.txt` (trimestral) | Ninguna (Público) | Semanal (lunes mediodía) y Mensual (segundo jueves) | Fixed-width TXT (formato columnar Fortran y ASCII tabular) | Sin límite explícito (respetar 1 req/s) | Fallo en formato si NOAA cambia el espaciado ASCII. Reintentos exponenciales y validación por expresión regular. |
| **XM S.A. E.S.P. (Sinergox)** | H-5 (Nivel de embalses abastecedores del SIN) | REST API (HTTP POST JSON) | `https://servapibi.xm.com.co/daily` | Ninguna (Público) | Diaria (madrugada ~03:00 COT con corte día anterior) | JSON estructurado (`Metric`, `Items -> DailyEntities`) | Máximo 30 días por consulta recomendado | Timeout o mantenimiento de API XM. Fallback automático al último snapshot certificado en `data/bronce/fte_xm_historico/`. Ponderación multirreservorio por capacidad (`capacidad_hm3`). |
| **INS SIVICAP (datos.gov.co)** | S-2 (IRCA - Calidad de agua potable) | Socrata Open Data API (SoQL) | `https://www.datos.gov.co/resource/nxt2-39c3.json` | Pública (App Token opcional para cuota extendida) | Mensual / Anual consolidado por secretarías de salud | JSON tabular (`departamentocodigo`, `municipiocodigo`, `a_o`, `ircaurbano`, `ircarural`) | 1,000 req/h sin token; 50,000 con token | Dataset desactualizado o municipio sin reporte en el periodo. Se conserva el último dato histórico marcando frescura como `desactualizado` (RF-CAL-03). |
| **IDEAM (Datos Abiertos Socrata)** | A-3 (Anomalía precipitación), A-4 (Días sin lluvia) | Socrata SoQL API (GET) | `https://www.datos.gov.co/resource/s54a-sgyg.json` (histórico) y `57sv-p2fu.json` (cuasi-real) | Pública (Recomendado `X-App-Token`) | Diaria / Continua | JSON / CSV (`codigoestacion`, `fechaobservacion`, `valorobservado`, `latitud`, `longitud`) | Límite por petición 50,000 registros; timeout en consultas agregadas masivas | Timeout 504 en consultas no indexadas. Mitigación: procesamiento desacoplado por tramos mensuales y agrupación previa por departamento/municipio. |
| **IDEAM (Catálogo de Estaciones)** | Metadatos y ubicación de red hidrometeorológica | Socrata SoQL API (GET) | `https://www.datos.gov.co/resource/hp9r-jxuu.json` | Pública | Mensual / Semestral | JSON (`codigo`, `nombre`, `categoria`, `latitud`, `longitud`, `departamento`, `municipio`) | Estándar Socrata | Cambios en códigos de estación. Uso de tabla dimensional indexada en Plata. |
| **IDEAM (Estudio Nacional del Agua - ENA)** | H-2 (IVH año seco), H-3 (IUA año seco) | Descarga Geoespacial (Shapefile / GeoJSON / WFS) | Geoportal SIAC / MADS ArcGIS Hub (`siac-datosabiertos-mads.hub.arcgis.com`) | Pública | Estático (por edición ENA cada 4-5 años) | GeoJSON / Feature Layer poligonal por Subzona Hidrográfica (SZH) | Sin límite | Fuente estática de referencia. Se precarga en zona Plata como catálogo territorial de cruce espacial DIVIPOLA-SZH. |
| **SSPD - SUI (Bodega Oracle Institucional)** | S-1 (Continuidad), S-3 (Cobertura), S-4 (IANC), S-5 (PQR), S-6 (Consumo), H-4 (Autonomía), R-1 (PEC) | Conexión Oracle Net (SQL) | `sui-scan.sspd.gov.co:1521/SUIPRD` (Esquema `SUI_AAA.*`) | Usuario/Contraseña institucional + VPN CRA + Whitelist IP | Mensual (cierre contable días 15 a 30 de cada mes) | Tablas relacionales Oracle (`CAR_CONTINUIDAD_ACUEDUCTO`, `CAR_COMERCIAL_RESUMEN`, etc.) | Regulado por concurrencia interna de la base de datos | Caída de VPN o bloqueo de sesión. Fallback a extractos certificados en Bronce validados criptográficamente. |
| **SSPD - SUI (Reporte Diario Embalses Res. 20241000395385)** | H-5 ampliado (embalses operados por prestadores de acueducto) | Web Form / Futura API SUI | Plataforma SUI (`sui.gov.co`) | Credenciales SUI de prestador | Diaria (corte 23:59 día siguiente) | En transición: Formulario estructurado hacia módulo SUI | N/A (no pública actualmente) | Falta de API pública expuesta. Requiere canal de intercambio institucional formal CRA-SSPD. |
| **UNGRD (Datos Abiertos Socrata)** | R-2 (Carrotanques), R-3 (Racionamiento), R-4 (Calamidades) | Socrata SoQL API (GET) | `https://www.datos.gov.co/resource/2343-nuqp.json` (2025) y datasets anteriores | Pública | Anual consolidado / Periódico | JSON (`evento`, `codificaci_n_segun_divipola`, `no_ecreto_de_calamidad_publica`, `agua_potable_en_galones_x`) | Estándar Socrata | Rezago temporal (corte anual acumulado). No refleja emergencias del mismo día sin articulación con Sala de Crisis. |
| **UNGRD (Sala de Crisis Nacional) & MinVivienda** | R-3 (Survey123 desabastecimiento), R-4 (Registro Calamidades) | Archivo formal verificado / Convenio institucional | `data/config/actos_administrativos_verificados.json` y Geoportal UNGRD | Acceso institucional | Diaria durante temporada de crisis | JSON / Boletines consolidados de prensa y gacetas oficiales | N/A | Falsos positivos por actos simulados. Solo se activan municipios con decreto verificado; si no hay dato, R queda en 0 sin forzar piso ficticio. |
| **NASA FIRMS (Earthdata)** | A-5 (Focos de calor 7 días) | REST API (HTTP GET CSV) | `https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/VIIRS_SNPP_SP/COL/{days}/{date}` | `MAP_KEY` (gratuita mediante registro) | Diaria (pasadas orbitales cada 12 horas) | CSV (`latitude`, `longitude`, `bright_ti4`, `scan`, `track`, `acq_date`, `confidence`) | 5,000 transacciones/día por llave | Falta de clave o límite de cuota. Degradación controlada: A-5 queda en `null` (`sin_dato`) sin alterar el ICR (A-5 es informativo). |
| **CHIRPS (UC Santa Barbara / USGS)** *(Fuente Propuesta)* | A-3 complementario, A-4 alterno de alta resolución | HTTP / FTP Download de mallas ráster | `https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/netcdf/p05/` | Pública (Gratuita) | Diaria (con 1 a 2 días de rezago) | NetCDF-4 / GeoTIFF (malla regular global 0.05° ~5 km) | Sin límite | Archivos de gran volumen (~50 MB/día). Procesamiento espacial ráster zonal con `rasterio`/`xarray` para extraer series por polígono municipal DANE. |
| **Copernicus C3S / ECMWF SEAS5** *(Fuente Propuesta)* | Predicción climática multimensual ENSO | Copernicus Climate Data Store (CDS API Python) | `https://cds.climate.copernicus.eu/api/v2` | CDS API Key (registro gratuito) | Mensual (publicación el día 10 de cada mes) | NetCDF / GRIB (probabilidades de precipitación y temperatura a 1-6 meses) | Regulado por cola de tareas CDS | Encolamiento de peticiones. Ejecución asíncrona mediante cron mensual. |

---

## 4. Propuesta de Arquitectura del Pipeline de Ingestión Automatizada

Para resolver de manera definitiva las brechas técnicas identificadas en la auditoría, se propone la siguiente arquitectura desacoplada, resiliente e integrada al stack on-premise open-source de la CRA (Python 3.12, DuckDB/PostgreSQL, Airflow/Cron, dbt).

### 4.1 Diagrama de Flujo de la Arquitectura Medallón

```
  =============================================================================================
  FUENTES OFICIALES EXTERNAS                     CAPAS MEDALLÓN ON-PREMISE (CRA)
  =============================================================================================

  [NOAA CPC Feed] ------------------------+
  [XM Sinergox API] ----------------------+
  [INS SIVICAP SoQL] --------------------+
  [IDEAM Socrata / FEWS] ----------------+===> [ZONA BRONCE]
  [NASA FIRMS API] -----------------------+    - Inmutable append-only en filesystem
  [SSPD Oracle / Extracto Cert.] ---------+    - Nombre: YYYYMMDD_HHMMSS_<hash[:8]>.<ext>
  [UNGRD Sala Crisis / Actos Verif.] ----+    - Hash SHA-256 en ops.capturas.json
  [CHIRPS NetCDF (Sat)] ------------------+               |
                                                          v
                                               [COMPUERTA DE CALIDAD]
                                               - Esquema y contrato de fuente (RF-CAL-01)
                                               - Reglas de rango físico RN-CAL-01..07
                                               - Verificador de integridad SHA-256
                                                          |
                                                          v
                                               [ZONA PLATA]
                                               - Tipado estructurado y deduplicación
                                               - Mapeo espacial llave DANE DIVIPOLA
                                               - Parquet particionado / DuckDB
                                                          |
                                                          v
                                               [ZONA ORO]
                                               - Cálculo 20 indicadores oficiales
                                               - Modelo ICR multivariable ponderado
                                               - Regla de piso por impacto confirmado
                                               - Snapshots históricos y análogos ENOS
                                                          |
                                                          v
                                               [SINCRONIZACIÓN ATÓMICA]
                                               - corte_vigente.json
                                               - data.js (Frontend)
                                               - vigia_corte_actualizado_arcgis.geojson
                                               - Auditoría y Certificado Digital
```

### 4.2 Esquemas de Almacenamiento por Zona

1. **Zona Bronce (`data/bronce/`):**
   * Almacenamiento crudo en filesystem local o bucket S3 on-premise compatible (MinIO).
   * Prohibido modificar o borrar (`RF-ING-02`). Idempotencia absoluta controlada por hash SHA-256 (`RF-ING-03`). Si una descarga tiene hash idéntico a la última captura exitosa, se cataloga como `sin_cambios`.
   * Envoltura de metadatos auditable:
     ```json
     {
       "_captura_id": "b3e21820-80a5-4f3e-8c11-9a72df88e104",
       "_capturado_en": "2026-11-06T10:00:15Z",
       "_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
       "_url_origen": "https://servapibi.xm.com.co/daily",
       "id_fuente": "FTE-XM-EMBALSES",
       "payload": { ... }
     }
     ```

2. **Zona Plata (`data/plata/`):**
   * Modelado columnar en DuckDB o PostgreSQL estructurado.
   * Llaves foráneas obligatorias: Código DIVIPOLA de 5 dígitos (DANE) normalizado con ceros a la izquierda (`LPAD(cod_municipio, 5, '0')`).
   * Aplicación de reglas de negocio de calidad (`RN-CAL`):
     * Continuidad: `0.0 <= s1_cont <= 24.0`
     * IRCA: `0.0 <= s2_irca <= 100.0`
     * Anomalía lluvia: `anomalia_pct >= -100.0`
     * Días secos: `dias_sin_lluvia >= 0`
     * Cobertura: `0.0 <= s3_cob <= 100.0`
     * Caudal: `caudal_pct >= 0.0`
   * Registro del estado de calidad: `valido`, `fuera_de_rango`, `territorio_no_resuelto`.

3. **Zona Oro (`data/oro/`):**
   * Tablas dimensionales y de hechos maestras:
     * `dim_territorio`: Catálogo de 1,122 municipios, departamentos, regiones, coordenadas centroides y polígonos MGN DANE.
     * `dim_indicador`: Catálogo de los 20 indicadores (`A-1` a `R-4`).
     * `fct_indicador_municipio`: Tabla con grano `(fecha_corte, divipola, codigo_indicador)`, valor bruto, valor normalizado (0 a 100), fecha del dato y estado de frescura (`vigente`, `desactualizado`, `sin_dato`).
     * `fct_icr_municipio`: Grano `(fecha_corte, divipola)`, subíndices de capa (`amenaza_A`, `vulnerabilidad_H`, `servicio_S`, `respuesta_R`), porcentaje de cobertura de datos, puntaje ICR y nivel de alerta (`sin_alerta`, `amarilla`, `naranja`, `roja`).
     * `fct_amenaza_global`: Grano `(fecha_corte)`, anomalías oceánicas Niño 1+2, 3, 3.4, 4, ONI trimestral y discusión oficial NOAA/IDEAM.
   * Publicación atómica mediante archivo temporal (`.tmp`) y reemplazo transaccional (`os.replace`) para evitar lecturas concurrentes corruptas.

4. **Zona Operacional y de Auditoría (`data/ops/`):**
   * Registro inmutable de transacciones de ingesta (`capturas.json`).
   * Informes de auditoría de veracidad (`auditoria/reporte_auditoria_vigente.json`) con verificación criptográfica SHA-256 de 460 puntos de control.

### 4.3 Frecuencia de Ingestión y Cronograma de Ejecución

El ciclo de ingestión se escalona para respetar la disponibilidad natural de las fuentes externas:

```
  03:00 COT  [FTE-XM-EMBALSES]       -> Descarga volumen útil de embalses del SIN (día anterior cerrado).
  04:00 COT  [FTE-FIRMS-NASA]        -> Descarga focos de calor satelitales VIIRS de las últimas pasadas nocturnas.
  04:30 COT  [FTE-CHIRPS-DAILY]      -> Descarga malla de precipitación satelital diaria acumulada.
  05:00 COT  [FTE-IDEAM-CLIMA]       -> Ejecución de consultas batch a estaciones telemétricas / DHIME.
  05:30 COT  [FTE-UNGRD-MVCT]        -> Sincronización de eventos de desabastecimiento y actos verificados.
  05:45 COT  [FTE-INS-IRCA]          -> Consulta de actualizaciones en SIVICAP / datos.gov.co.
  06:00 COT  [PIPELINE CORTE DIARIO] -> Consolidación Bronce -> Plata -> Oro, cálculo ICR y verificación criptográfica.
  06:15 COT  [PUBLICACIÓN ATÓMICA]   -> Sincronización con tablero web directivo y geoportales.
  
  LUNES 12:30 COT [FTE-CPC-NOAA]     -> Descarga semanal de índices Niño 1+2, 3, 3.4 y 4 (boletín NOAA mediodía).
  DÍA 10 MES  COT [FTE-CPC-ONI]      -> Descarga trimestral de ONI y actualización de discusión ENSO.
  DÍA 16 MES  COT [FTE-SSPD-SUI]     -> Sincronización de formatos comerciales y continuidad de la bodega SUI.
```

### 4.4 Estrategia de Resiliencia, Tolerancia a Fallos y Degrade Controlado

1. **Circuit Breaker y Reintentos Exponenciales (`RF-ING-04`):**
   * Ante fallas transitorias de red (códigos HTTP 5xx, timeouts), el orquestador reintenta hasta 3 veces con intervalos exponenciales de 2 minutos, 8 minutos y 32 minutos.
   * Errores de cliente (HTTP 4xx como 401, 403, 404) no se reintentan y marcan la captura inmediatamente como `fallida` en `ops.capturas.json`.

2. **Jerarquía de Respaldo y Degradación Controlada:**
   * *Nivel 1 (Conexión Directa en Vivo):* Consulta de API oficial externa.
   * *Nivel 2 (Último Crudo Válido en Bronce):* Si la API externa no responde o está en mantenimiento (e.g. XM o IDEAM), se carga el último tramo certificado previamente en Bronce, registrando la frescura como `desactualizado` pero manteniendo la validez del corte.
   * *Nivel 3 (Ausencia Total de Dato / Seguro `sin_dato`):* Si un indicador no tiene soporte en ninguna fuente para un municipio (e.g. FIRMS sin API key, o un municipio sin estación IDEAM ni reporte SUI):
     * El valor se registra como `null` / `sin_dato` (`RF-IND-04`).
     * **Prohibido asumir ceros o promedios arbitrarios.**
     * **Redistribución de Pesos (`RF-ICR-04`):** Si las capas con datos suman al menos el 60% del peso total (0.60), los pesos nominales se re-escalan proporcionalmente:
       $$\text{Peso Efectivo}_i = \frac{\text{Peso Nominal}_i}{\sum_{k \in \text{Disponibles}} \text{Peso Nominal}_k}$$
     * Si la cobertura disponible es inferior al 60%, el ICR municipal queda en `sin_dato` y el municipio no recibe nivel de alerta automático, alertando a los analistas.

3. **Política de Cero Diccionarios Quemados (Cumplimiento Criterio CA-01):**
   * Todo valor territorial debe derivarse de archivos crudos en Bronce o de catálogos auditables externos en `data/config/`.
   * Se prohíbe terminantemente embeber tuplas `(divipola, valor)` dentro de la lógica de programación en Python o JavaScript.

---

## 5. Plan de Implementación por Fases

Para guiar la materialización de esta arquitectura en las etapas posteriores del proyecto, se establece la siguiente hoja de ruta de implementación:

* **Fase 1: Quick Wins y Aseguramiento Inmediato (Semanas 1-2)**
  * Despliegue formal de los conectores funcionales probados: NOAA CPC, XM Sinergox (API REST directa), SIVICAP (SoQL Socrata) y NASA FIRMS (gestión de `FIRMS_MAP_KEY`).
  * Estandarización de `conector_base.py` con verificación estricta TLS y User-Agent institucional CRA.
  * Consolidación del catálogo maestro de 1,122 municipios con llaves DIVIPOLA DANE oficiales.

* **Fase 2: Formalización Interinstitucional y Acceso SUI / UNGRD (Semanas 3-5)**
  * Activación del protocolo de extracción sobre la bodega Oracle SUI (`sui-scan.sspd.gov.co:1521/SUIPRD`) bajo convenio CRA-SSPD usando la suite `ingesta/queries_sui/`.
  * Integración con la Sala de Crisis de la UNGRD y MinVivienda para recepción estructurada diaria de municipios con racionamiento activo (Survey123) y decretos de calamidad pública.
  * Implementación de la ingesta de reportes diarios de embalses de acueducto bajo la Resolución SSPD 20241000395385.

* **Fase 3: Mallas Satelitales e Integración IDEAM Masiva (Semanas 6-8)**
  * Implementación del pipeline de ingesta batch desacoplada para IDEAM `s54a-sgyg` en particiones mensuales con agregación municipal.
  * Integración del conector ráster CHIRPS (precipitación diaria 0.05°) como respaldo de alta resolución para cerrar la brecha espacial en cuencas no instrumentadas.
  * Automatización de la extracción de índices ENA (IVH e IUA) desde geoportales SIAC/MADS.

* **Fase 4: Orquestación Industrial, Calidad y CI/CD (Semanas 9-10)**
  * Configuración de DAGs en Apache Airflow (o servicio administrado Cloud Composer) para el cronograma diario/semanal.
  * Automatización de la compuerta de calidad dbt (`dbt test`) sobre esquemas Plata y Oro.
  * Ejecución continua y desatendida del `auditor_veracidad.py` con bloqueo automático de publicación ante cualquier discrepancia criptográfica.

---

## 6. Caveats

1. **Disponibilidad de la Bodega Oracle SUI:** El acceso directo a `sui-scan.sspd.gov.co:1521/SUIPRD` depende de la vigencia de la VPN institucional y credenciales activas entre la SSPD y la CRA. Durante esta exploración técnica externa no se ejecutaron transacciones vivas sobre la red interna de la SSPD para preservar la confidencialidad de credenciales; no obstante, la suite de queries SQL (`ingesta/queries_sui/`) se verificó sintáctica y estructuralmente acorde al diccionario de variables del SUI.
2. **Rezago del Portal de Datos Abiertos UNGRD:** El dataset público `2343-nuqp` en `datos.gov.co` tiene registros únicamente hasta el 31 de diciembre de 2025. Para eventos del año en curso 2026, el sistema debe alimentarse de gacetas municipales oficiales o del canal directo de la Sala de Crisis Nacional UNGRD.
3. **Sensorica telemétrica IDEAM:** Solo una fracción de las 4,000 estaciones del IDEAM transmiten en tiempo cuasi-real (`57sv-p2fu`). Gran parte de las estaciones convencionales dependen de recolección física manual, lo que justifica la adopción de mallas satelitales CHIRPS como complemento técnico para cobertura nacional homogénea.

---

## 7. Conclusion

El diagnóstico técnico del ecosistema de datos confirma que **es plenamente viable construir un sistema de monitoreo 100% basado en datos reales oficiales**, superando definitivamente las deficiencias de datos sintéticos detectadas en auditorías anteriores.

La solución técnica no depende de una sola fuente milagrosa, sino de una **arquitectura federada y resiliente** que combina:
1. Fuentes climáticas y operativas en tiempo real de alta confiabilidad (NOAA CPC, XM Sinergox, INS SIVICAP, NASA FIRMS).
2. Procesamiento batch desacoplado para datos masivos (IDEAM Socrata `s54a-sgyg` y malla satelital CHIRPS).
3. Conexión formal institucional a la bodega SUI (SSPD) para los indicadores de desempeño operativo (continuidad, cobertura, IANC, PQR, PEC, autonomía).
4. Verificación auditable de actos administrativos y racionamientos reales (UNGRD / MinVivienda) sin tolerar decretos ficticios.
5. Arquitectura Medallón estricta con verificación criptográfica SHA-256 continua y publicación atómica.

Este informe y sus especificaciones técnicas constituyen el insumo base para la redacción del reporte formal `docs/auditoria/02_plan_adquisicion_datos_reales.md`.

---

## 8. Verification Method

Para verificar de forma independiente los hallazgos y conectores documentados en este reporte, ejecute los siguientes comandos en PowerShell/Python desde el directorio raíz del proyecto:

1. **Verificar conectividad y respuesta de fuentes vivas (NOAA, SIVICAP, XM):**
   ```powershell
   python -c "
   import urllib.request, json, ssl
   ctx = ssl.create_default_context()
   # NOAA Semanal
   req = urllib.request.Request('https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for', headers={'User-Agent': 'CRA-VigiaNino/1.0'})
   with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
       print('NOAA Semanal status:', r.status)
   # SIVICAP IRCA
   req = urllib.request.Request('https://www.datos.gov.co/resource/nxt2-39c3.json?%24limit=1', headers={'User-Agent': 'CRA-VigiaNino/1.0'})
   with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
       print('SIVICAP IRCA status:', r.status, 'filas:', len(json.loads(r.read().decode())))
   # XM API Embalses
   b = json.dumps({'MetricId': 'PorcVoluUtilDiar', 'StartDate': '2026-10-01', 'EndDate': '2026-10-02', 'Entity': 'Sistema'}).encode()
   req = urllib.request.Request('https://servapibi.xm.com.co/daily', data=b, headers={'User-Agent': 'CRA-VigiaNino/1.0', 'Content-Type': 'application/json'})
   with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
       print('XM Sinergox status:', r.status)
   "
   ```

2. **Ejecutar suite de pruebas unitarias y de conectores de ingesta:**
   ```powershell
   $env:PYTHONPATH="."
   pytest ingesta/tests/test_conectores.py ingesta/tests/test_indice_riesgo.py -v
   ```

3. **Verificar estructura de crudos y catálogo de configuración:**
   ```powershell
   Get-ChildItem -Path data\bronce -Recurse | Select-Object FullName, Length
   Get-Content -Path data\config\catalogo_municipios_ideam.json | ConvertFrom-Json | Select-Object -ExpandProperty municipios
   ```

4. **Condiciones de Invalidación:**
   * Si NOAA cambia la ruta o formato de `wksst9120.for`.
   * Si XM modifica el contrato de su endpoint `https://servapibi.xm.com.co/daily` o impone autenticación obligatoria con token.
   * Si datos.gov.co despublica o privatiza el dataset `nxt2-39c3` de SIVICAP.
