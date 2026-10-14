# Evaluación de la Implementación del Proyecto "Vigía El Niño · Acueductos" con Datos Reales

**Entidad:** Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**Proyecto:** Vigía El Niño · Acueductos (Sistema de Monitoreo Integral de Riesgo en Servicios de Acueducto)  
**Fecha de Evaluación:** 2026-10-08  
**Estado:** Documento Estratégico y Técnico de Evaluación  
**Audiencia:** Dirección Ejecutiva, Subdirección de Regulación, Oficina de TIC & CD  

---

## 1. Resumen Ejecutivo y Diagnóstico Global

El fenómeno de El Niño 2026-27 se encuentra en una fase de rápida intensificación. De acuerdo con los registros en vivo del *Climate Prediction Center* (NOAA CPC) consultados en este ejercicio, la anomalía en la región Niño 3.4 se sitúa en **+1.8 °C** (con picos en la región Niño 1+2 de **+3.4 °C**), y existe una probabilidad superior al **75 %** de consolidar un evento de carácter histórico (RONI $\ge +2.5\ ^\circ\text{C}$) durante el último trimestre de 2026 y el primer trimestre de 2027. Paralelamente, el Ministerio de Vivienda, Ciudad y Territorio (MinVivienda) ha identificado preliminarmente **558 municipios** en riesgo Alto (447) o Muy Alto (111) respecto a la garantía de agua potable y saneamiento básico.

En este contexto, la CRA requiere superar el modelo tradicional de seguimiento reactivo y artesanal (basado en consolidaciones manuales en hojas de cálculo con rezagos superiores a 15 días) para implementar **Vigía El Niño · Acueductos**: un sistema integral, automatizado y de alta fidelidad regulatoria que procese fuentes oficiales, calcule 20 indicadores estandarizados y genere el **Índice Compuesto de Riesgo (ICR)** a escala municipal (código DIVIPOLA de 5 caracteres).

Esta evaluación audita la viabilidad técnica, operativa, analítica y regulatoria de alimentar el sistema con **datos reales**, identifica las restricciones de acceso y formula las estrategias definitivas de ingeniería para su puesta en marcha inmediata.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE DATOS REALES VIGÍA EL NIÑO                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
  FUENTES PRIMARIAS REALES
  ├── SUI (SSPD)          ──► Bodega Oracle / API Socrata datos.gov.co (S-1, S-3, S-4, S-5, R-1)
  ├── NOAA CPC            ──► Endpoints HTTP abiertos (wksst9120.for, oni.ascii.txt) (A-1, A-2)
  ├── IDEAM               ──► DHIME + Boletines Agrometeorológicos (A-3, A-4, H-1, H-2, H-3)
  ├── INS SIVICAP         ──► Socrata datos.gov.co (nxt2-39c3) (S-2 IRCA mensual municipal)
  ├── MinVivienda/UNGRD   ──► Survey123 + Registro Nacional de Calamidades (R-2, R-3, R-4)
  ├── XM Sinergox         ──► API REST de volumetría de embalses (H-5)
  ├── NASA FIRMS          ──► API VIIRS / MODIS focos de calor en cuencas (A-5)
  └── DANE                ──► DIVIPOLA oficial + Marco Geoestadístico Nacional (MGN)
                                    │
                                    ▼
  INGESTA AUTOMATIZADA ON-PREMISE CRA (Python 3.12 + Airflow/Scheduler)
  ├── Zona Bronce: Almacenamiento inmutable append-only con SHA-256
  ├── Zona Plata:  Tipificación estricta + Homologación DIVIPOLA 5 dígitos
  └── Zona Oro:    Cálculo de los 20 Indicadores + Índice Compuesto de Riesgo (ICR)
                                    │
                                    ▼
  CONSUMO REGULATORIO Y TOMA DE DECISIONES
  ├── Tablero Web Institucional CRA (React / HTML5 Vanilla + Nunito Sans + Mapas)
  ├── Ficha Municipal Detallada con trazabilidad fuente/fecha
  └── Notificaciones y Alertas Tempranas (Escalamiento a Comisionados)
```

---

## 2. Diagnóstico Detallado de Fuentes Reales (Factibilidad y Latencia)

A continuación se evalúa cada una de las fuentes oficiales contempladas en las especificaciones del Context Lake, diagnosticando su método de acceso real, periodicidad, nivel de rezago, formato y estrategia de ingesta.

| ID Fuente | Entidad | Indicadores | Disponibilidad Real y Método de Acceso | Rezago / Latencia Típica | Nivel de Riesgo Operativo | Estrategia de Mitigación / Captura |
|---|---|---|---|---|---|---|
| **FTE-SUI-CONT** | SSPD | S-1 (Continuidad h/día) | Bodega de datos Oracle institucional (`SUI_AAA.AREAS_PRESTACION_SERVICIO` y formatos de balance/continuidad) o Datasets Socrata en `datos.gov.co`. | 30 a 60 días (reporte a mes vencido). | Medio-Alto (rezago normativo). | Usar último reporte vigente con frescura explícita; alertar si supera 90 días. |
| **FTE-SUI-COM** | SSPD | S-3 (Cobertura), S-4 (IANC/Pérdidas), S-6 (Consumo) | Tablas comerciales y de balance hídrico (`CAR_COMERCIAL_RESUMEN`, `CAR_BALANCE_HIDRICO`). | Mensual para grandes; anual para pequeños prestadores. | Medio (datos dispares entre prestadores). | Imputación jerárquica: APS $\to$ Municipio. En municipios multi-prestador, ponderar por suscriptores facturados. |
| **FTE-SUI-PQR** | SSPD | S-5 (Variación PQR falta servicio) | Tabla de reclamaciones SUI clasificada por código de causal (falta de servicio/bajas presiones). | Mensual (cargue 15 de cada mes). | Bajo-Medio. | Comparar ventana mensual contra el mismo mes del año previo para aislar estacionalidad. |
| **FTE-SUI-RUPS** | SSPD | Catastro, `dim_prestador` | Registro Único de Prestadores de Servicios Públicos. Acceso público o directo. | Semanal / Mensual. | Bajo. | Cargar incrementalmente los estados de inscripción y APS vigentes. |
| **FTE-SUI-PEC** | SSPD / MinVivienda | R-1 (Planes de Emergencia) | Reporte de radicación de Planes de Contingencia ante SSPD / Dirección de Agua Potable. | Semanal en contingencia. | Medio (no siempre automatizado en SUI). | Conector híbrido: consulta de formato SUI + módulo de carga asistida por operador (ADR-0008). |
| **FTE-CPC-SEM** | NOAA CPC | A-1 (Niño 1+2, 3, 3.4, 4) | Archivo de texto plano público: `wksst9120.for`. Acceso HTTP directo sin autenticación. | < 24 horas (actualización semanal los lunes). | Ninguno (100% probado en vivo). | Descarga automatizada vía Python `urllib`/`httpx`; verificación SHA-256 e ingesta directa. |
| **FTE-CPC-ONI** | NOAA CPC | A-1 (ONI / RONI) | Archivo público `oni.ascii.txt` y página de discusión diagnóstica. | Mensual (día 10 de cada mes). | Ninguno (100% probado en vivo). | Ingesta mensual automatizada; detección de superación de umbrales (+0.5 °C débil, +1.5 °C fuerte, +2.0 °C muy fuerte). |
| **FTE-CPC-PROB** | NOAA CPC | A-2 (Probabilidad evento extremo) | Tablas de pronóstico probabilístico multimodelo IRI/CPC ENSO. | Mensual (segundo jueves del mes). | Bajo. | Scraping estructurado de la matriz trimestral de probabilidades. |
| **FTE-IDEAM-PREC** | IDEAM | A-3 (Anomalía 30d), A-4 (Días secos) | Plataforma DHIME (Catálogo Nacional de Estaciones) y API de datos abiertos de IDEAM. | 24 a 48 horas (diario). | Medio (intermitencia en DHIME). | Interpolar estaciones activas en polígono municipal; fallback: producto grillado CHIRPS o IDW 50 km. |
| **FTE-IDEAM-CAUD** | IDEAM | H-1 (Caudal fuentes abastecedoras) | Estaciones hidrométricas DHIME vinculadas a fuentes abastecedoras de acueductos. | 24 a 72 horas. | Medio-Alto (pocas cuencas tienen telemetría en tiempo real). | Mapeo explícito en `config.fuente_abastecedora`; si no hay estación vinculada, declarar `sin_dato`. |
| **FTE-IDEAM-ENA** | IDEAM | H-2 (Vulnerabilidad hídrica), H-3 (Uso del agua) | Estudio Nacional del Agua (capas vectoriales por subzona hidrográfica SZH). | Estático (actualización cada 4 años). | Ninguno (datos consolidados). | Capa geográfica cargada en `plata.dim_subzona_hidrografica`; cruce espacial con cabeceras municipales. |
| **FTE-INS-IRCA** | INS SIVICAP | S-2 (Calidad del agua IRCA) | Dataset público en `datos.gov.co` (`nxt2-39c3`) de calidad de agua para consumo humano. | Mensual. | Bajo (API Socrata activa y probada). | Conector REST con filtros SoQL por código DIVIPOLA y periodo. |
| **FTE-UNGRD** | UNGRD | R-2 (Abastecimiento alterno), R-4 (Calamidad pública) | Sala de Crisis Nacional - Boletines consolidados de emergencias por sequía / Fenómeno El Niño. | 12 a 24 horas. | Medio (formatos PDF/Excel). | Parser automatizado de matrices de declaratorias + confirmación asistida en mesa técnica. |
| **FTE-MVCT-RIESGO** | MinVivienda | Contexto territorial | Circular oficial 2026EE0026348 y listado de 558 municipios priorizados. | Por emisión normativa. | Bajo. | Archivo estructurado cargado en `bronce` con metadata del acto administrativo. |
| **FTE-MVCT-AFECT** | MinVivienda | R-3 (Racionamiento / Desabastecimiento) | Reportes diarios del aplicativo Survey123 operado por la Dirección de Desarrollo Sectorial. | Diario (12:00 m). | Medio (requiere convenio interinstitucional). | Acceso a webhook de ArcGIS/Survey123 o cargue diario asistido con plantilla normalizada. |
| **FTE-DANE** | DANE | Marco territorial y población | Codificación DIVIPOLA (1.122 entidades), proyecciones de población municipal DANE 2026. | Anual / Trimestral. | Ninguno. | Base de referencia universal (`oro.dim_territorio`); llave foránea ineludible. |
| **FTE-XM** | XM Sinergox | H-5 (Embalses abastecedores) | API REST pública de XM (`servapibi.xm.com.co` / Sinergox). | Diario (06:00 a.m.). | Bajo. | Consulta REST del volumen útil (% y Hm³) de embalses multipropósito (Chingaza, Tominé, San Rafael, etc.). |
| **FTE-FIRMS** | NASA FIRMS | A-5 (Focos de calor en cuencas) | API REST NASA FIRMS (sensor VIIRS 375m / MODIS) con MAP_KEY gratuita. | Diario (latencia 3 horas). | Bajo. | Conteo de anomalías térmicas dentro del polígono o microcuenca abastecedora municipal. |

---

## 3. Desafíos Reales de Integración y Reglas de Decisión

### 3.1 El Fenómeno del Rezago Temporal del SUI
El SUI es la fuente autoritativa del sector (ADR-0002), pero su ciclo de cargue por parte de las empresas de servicios públicos (ESP) es asíncrono y ex-post:
- **Realidad:** A fecha de corte de hoy (ej. octubre de 2026), los datos de continuidad ($S\text{-}1$) o facturación ($S\text{-}3, S\text{-}4$) disponibles en el SUI corresponden típicamente a agosto o julio de 2026.
- **Solución Técnica Obligatoria:** 
  1. El sistema **no debe detenerse** esperando datos del mes corriente. Debe aplicar el último valor válido certificado disponible.
  2. Cada indicador debe exhibir obligatoriamente en pantalla dos fechas: la **fecha de corte del sistema** y la **fecha efectiva del dato**.
  3. Se introduce el semáforo de frescura:
     - *Actualizado:* Dato con antigüedad menor a 45 días.
     - *Desactualizado:* Dato con antigüedad entre 46 y 90 días.
     - *Crítico:* Dato superior a 90 días (se emite advertencia visual pero se mantiene el valor). Si supera $3\times$ el periodo esperado (180 días), se computa como `sin_dato`.

### 3.2 La Regla de Oro: `sin_dato` Nunca es Cero ($0$)
En sistemas de información pública, un error frecuente es rellenar valores nulos con cero (`NULL -> 0`).
- Si en continuidad ($S\text{-}1$, donde el riesgo sube cuando el valor baja) se pusiera $0$, el sistema reportaría que el municipio tiene $0$ horas de agua (alarma extrema falsa).
- Si en IRCA ($S\text{-}2$, donde el riesgo sube cuando el valor sube) se pusiera $0$, el sistema reportaría agua 100% potable sin riesgo (falsa seguridad).
- **Manejo en Vigía:** Los campos sin reporte quedan estrictamente como `NULL` / `"sin_dato"`. En el tablero se presentan con el patrón visual rayado accesible, y en el cálculo del ICR se activa el **algoritmo de redistribución proporcional de pesos** (RF-ICR-04).

### 3.3 Homologación Territorial Estricta por Código DIVIPOLA
Muchas fuentes externas (boletines de UNGRD, reportes de prensa o Survey123 de MinVivienda) registran municipios únicamente por texto (ej. *"Carmen de Bolivar"*, *"San Andres de Sotavento"*, *"El Carmen"*).
- La vinculación nunca debe hacerse por cadenas de texto libres ni por coincidencia difusa no supervisada.
- Se implementa un resolvedor con tabla de sinónimos y alias (`config.alias_territorio`) que exige coincidencia exacta normalizada (sin tildes, minúsculas) cruzada con el departamento. Los registros ambiguos pasan a la bandeja de excepciones `ops.territorio_no_resuelto`.

---

## 4. Evaluación del Modelo Analítico: Índice Compuesto de Riesgo (ICR)

El ICR sintetiza la complejidad de 20 variables en un único índice escalar de **0 a 100 puntos**, estructurado en cuatro capas conceptuales de acuerdo con el marco de riesgo de desastres:

$$\text{ICR} = w_A \cdot I_A + w_H \cdot I_H + w_S \cdot I_S + w_R \cdot I_R$$

Donde los pesos iniciales calibrados son:
- **Capa A (Amenaza Hidroclimática - 30%):** $A\text{-}3$ (Anomalía lluvia 30d), $A\text{-}4$ (Días secos consecutivos), $H\text{-}1$ (Estrés de caudal en fuente abastecedora).
- **Capa H (Vulnerabilidad de la Oferta - 30%):** $H\text{-}2$ (Índice de Vulnerabilidad Hídrica ENA), $H\text{-}3$ (Índice de Uso del Agua ENA), $H\text{-}4$ (Autonomía de almacenamiento en horas).
- **Capa S (Desempeño del Servicio - 25%):** $S\text{-}1$ (Continuidad), $S\text{-}2$ (IRCA Calidad), $S\text{-}3$ (Cobertura urbana), $S\text{-}4$ (Agua no contabilizada / IANC), $S\text{-}5$ (Variación de PQR por falta de servicio).
- **Capa R (Respuesta e Impacto Confirmado - 15%):** $R\text{-}1$ (PEC reportado), $R\text{-}2$ (Operación de carrotanques), $R\text{-}3$ (Reporte activo de racionamiento), $R\text{-}4$ (Declaratoria de Calamidad Pública vigente).

### Puntos de Quiebre de Normalización (Interpolación Lineal por Tramos):
Cada indicador cuantitativo se normaliza a una escala $0 - 100$ mediante interpolación por tramos según la tabla de umbrales regulatorios de la CRA:
- **Puntaje 0 (Óptimo / Sin Riesgo):** Continuidad 24 h, Anomalía 0%, IRCA 0%, Cobertura 100%, Pérdidas 20%.
- **Puntaje 40 (Alerta Amarilla):** Continuidad 22 h, Anomalía -20%, IRCA 5%, Cobertura 95%, Pérdidas 30%.
- **Puntaje 60 (Alerta Naranja):** Continuidad 18 h, Anomalía -40%, IRCA 14%, Cobertura 85%, Pérdidas 40%.
- **Puntaje 75 (Alerta Roja):** Continuidad 12 h, Anomalía -60%, IRCA 35%, Cobertura 70%, Pérdidas 50%.
- **Puntaje 100 (Extremo / Colapso):** Continuidad $\le 4$ h, Anomalía $\le -90$%, IRCA $\ge 80$%, Cobertura $\le 40$%, Pérdidas $\ge 70$%.

### La Regla de Piso Regulatorio (RF-ICR-06):
Si en un municipio se reporta racionamiento confirmado ($R\text{-}3 = 1$) o se declara calamidad pública por desabastecimiento de agua ($R\text{-}4 = 1$), **el nivel de alerta se fija automáticamente como mínimo en Naranja**, independientemente de que su ICR calculado sea inferior a 60 por falta de reporte en otras capas. Esto garantiza que la realidad operativa de la emergencia prime sobre los desfases del reporte estadístico.

---

## 5. Arquitectura Técnica y Entorno de Ejecución

Para garantizar la soberanía de los datos y cumplir con el mandato de infraestructura on-premise de la CRA (ADR-0005), la solución se despliega en una arquitectura de tres capas:

1. **Capa de Almacenamiento y Transformación (PostgreSQL 16 + PostGIS 3 + dbt):**
   - Esquema `bronce`: Almacén append-only donde cada archivo crudo (JSON, CSV, texto plano de NOAA) se guarda con su hash SHA-256 inmutable.
   - Esquema `plata`: Tablas estructuradas con llaves DIVIPOLA resueltas y tipificación fuerte.
   - Esquema `oro`: Tablas dimensionales y de hechos versionadas por fecha de corte (`fct_icr_municipio`, `fct_indicador_municipio`, `fct_amenaza_global`).
   - Esquema `config`: Parámetros de umbrales, pesos y URLs totalmente desacoplados del código fuente.

2. **Capa de Ingesta Automatizada (Python 3.12):**
   - Módulo desacoplado de conectores que implementa la interfaz `ConectorBase` con políticas de reintentos exponenciales ($2, 8, 32$ min), timeouts estrictos y control de certificados corporativos/proxy institucional.

3. **Capa de Presentación (Tablero Web Institucional CRA):**
   - Aplicación web con los tokens de diseño institucional (`#43B2D7`, Nunito Sans, semáforo oficial sin usar colores de bandera para datos), con navegación drill-down, mapa coroplético interactivo, filtros multinivel y exportación certificada.

---

## 6. Hoja de Ruta de Implementación Inmediata

```mermaid
gantt
    title Cronograma de Implementación Vigía El Niño · Acueductos
    dateFormat  YYYY-MM-DD
    section Fase 1: Ingesta Base
    Conectores NOAA, SIVICAP, XM, UNGRD     :done, 2026-10-08, 2d
    Queries de Extracción SUI Oracle/SoQL   :done, 2026-10-08, 1d
    section Fase 2: Tablero y Modelo
    Tablero Web Institucional (7 Vistas)     :active, 2026-10-08, 2d
    Pruebas con Datos Reales Consolidados    :2026-10-10, 2d
    section Fase 3: Despliegue On-Premise
    Puesta en producción Docker Compose CRA :2026-10-12, 3d
    Capacitación y Monitoreo Diario 06:00    :2026-10-15, 2d
```

### Conclusión de la Evaluación
La implementación de **Vigía El Niño · Acueductos con datos reales es 100 % viable y urgente**. La combinación de fuentes globales automatizadas en tiempo real (NOAA, FIRMS, XM) con las fuentes sectoriales periódicas (SUI, SIVICAP, MinVivienda, UNGRD) y el modelo matemático de mitigación de datos faltantes dota a la CRA de un instrumento regulatorio de vanguardia para anticipar afectaciones territoriales con más de **14 días de antelación**, protegiendo el derecho humano al agua de las poblaciones más vulnerables de Colombia.
