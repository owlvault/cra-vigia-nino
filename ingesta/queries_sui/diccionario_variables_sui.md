# Diccionario de Variables y Especificación Técnica — Extracción SUI

**Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)**  
**Proyecto:** Vigía El Niño · Acueductos  
**Componente:** Ingesta SUI (Sistema Único de Información de la SSPD)  
**Versión:** 1.0.0  

---

## 1. Mapeo de Indicadores Vigía vs Tablas y Queries SUI

| Código Indicador | Nombre Indicador | Unidad | Tabla de Origen SUI (Oracle) | Archivo Query SQL | Transformación / Agregación |
|---|---|---|---|---|---|
| **dim_prestador** | Catastro RUPS y APS | Texto | `SUI_AAA.EMPRESAS_PRESTADORAS`, `SUI_AAA.AREAS_PRESTACION_SERVICIO` | `SUI_EXT_01_PRESTADORES_APS_MUNICIPIOS.sql` | Mapeo 1:N entre empresa prestadora, APS y código DIVIPOLA 5 dígitos. |
| **S-1** | Continuidad | h/día | `SUI_AAA.CAR_CONTINUIDAD_ACUEDUCTO` | `SUI_EXT_02_CONTINUIDAD_SERVICIO.sql` | Media ponderada por suscriptores facturados en cada APS del municipio. |
| **S-3** | Cobertura Urbana | % | `SUI_AAA.CAR_COMERCIAL_RESUMEN`, `DANE_PROYECCIONES_HOGARES` | `SUI_EXT_03_COMERCIAL_SUSCRIPTORES_COBERTURA.sql` | $(\text{Suscrip. Residenciales Urbanos} / \text{Hogares Urbanos DANE}) \times 100$. Acotado a 100%. |
| **S-4** | Agua No Contabilizada (IANC) | % | `SUI_AAA.CAR_BALANCE_HIDRICO` | `SUI_EXT_04_BALANCE_HIDRICO_IANC_PERDIDAS.sql` | $((\text{Vol. Suministrado} - \text{Vol. Facturado}) / \text{Vol. Suministrado}) \times 100$. |
| **S-5** | Variación PQR Falta de Servicio | % | `SUI_AAA.PQR_USUARIOS` | `SUI_EXT_05_PQR_DESABASTECIMIENTO.sql` | $((\text{PQR mes actual} - \text{PQR mes año anterior}) / \text{PQR mes año anterior}) \times 100$. |
| **S-6** | Consumo Facturado por Suscriptor | m³/susc/mes | `SUI_AAA.CAR_COMERCIAL_RESUMEN` | `SUI_EXT_03_COMERCIAL_SUSCRIPTORES_COBERTURA.sql` | $\text{Volumen Residencial Facturado} / \text{Total Suscriptores Residenciales}$. |
| **R-1** | PEC Reportado | Binario (0/1) | `SUI_AAA.GESTION_RIESGO_PEC` | `SUI_EXT_06_PLANES_EMERGENCIA_CONTINGENCIA.sql` | 1 si el 100% de los prestadores urbanos del municipio tienen PEC vigente; 0 si alguno no. |

---

## 2. Parámetros de Ejecución en Oracle

Todas las consultas SQL fueron diseñadas con bind variables estándar de Oracle (`:variable`) para permitir su parametrización segura tanto en Airflow como en scripts de extracción Python (ej. `oracledb` / `cx_Oracle` / `SQLAlchemy`):

- `:period_id` (VARCHAR2): Periodo contable/operativo en formato `'YYYY-MM'` (ejemplo: `'2026-08'`).
- `:prev_period_id` (VARCHAR2): Periodo comparativo interanual en formato `'YYYY-MM'` (ejemplo: `'2025-08'`).
- `:fecha_corte` (VARCHAR2): Fecha en formato `'YYYY-MM-DD'` para verificar vigencias a la fecha del corte.
- `:cod_departamento` (VARCHAR2): Código de dos dígitos del departamento o `'TODOS'` para barrido nacional.

---

## 3. Consideraciones de Rendimiento e Indexación

1. **Particionamiento por Periodo:** Las tablas `CAR_BALANCE_HIDRICO`, `CAR_CONTINUIDAD_ACUEDUCTO` y `PQR_USUARIOS` son masivas a nivel nacional. Los queries utilizan el campo `PERIODO` como primer predicado de filtrado para forzar la poda de particiones (*partition pruning*).
2. **Índices Requeridos en SUI:**
   - `IDX_APS_EMPRESA`: En `AREAS_PRESTACION_SERVICIO(ID_EMPRESA, SERVICIO)`.
   - `IDX_CONT_PERIODO`: En `CAR_CONTINUIDAD_ACUEDUCTO(PERIODO, ID_EMPRESA, ID_APS)`.
   - `IDX_COM_PERIODO`: En `CAR_COMERCIAL_RESUMEN(PERIODO, SERVICIO, USO_TARIFA)`.
3. **Manejo de Errores y Nulos:** Se emplea `NULLIF(..., 0)` para evitar divisiones por cero en municipios desprovistos de macromedición o sin suscriptores registrados.
