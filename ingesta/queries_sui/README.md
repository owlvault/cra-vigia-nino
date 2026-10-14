# Suite de Consultas de Extracción SUI — Vigía El Niño · Acueductos

Este directorio contiene las consultas SQL optimizadas para extraer datos del **Sistema Único de Información (SUI)** operado por la Superintendencia de Servicios Públicos Domiciliarios (SSPD), requeridos para alimentar los indicadores del sistema **Vigía El Niño · Acueductos** de la CRA.

## Contenido de la Suite

1. [`SUI_EXT_01_PRESTADORES_APS_MUNICIPIOS.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_01_PRESTADORES_APS_MUNICIPIOS.sql): Catastro RUPS de prestadores y APS por código DIVIPOLA DANE.
2. [`SUI_EXT_02_CONTINUIDAD_SERVICIO.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_02_CONTINUIDAD_SERVICIO.sql): Indicador **S-1 Continuidad** (horas/día) con ponderación municipal por suscriptores (RF-TER-03).
3. [`SUI_EXT_03_COMERCIAL_SUSCRIPTORES_COBERTURA.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_03_COMERCIAL_SUSCRIPTORES_COBERTURA.sql): Indicadores **S-3 Cobertura Urbana** (%) y **S-6 Consumo Medio Facturado**.
4. [`SUI_EXT_04_BALANCE_HIDRICO_IANC_PERDIDAS.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_04_BALANCE_HIDRICO_IANC_PERDIDAS.sql): Indicador **S-4 Agua No Contabilizada / IANC** (%).
5. [`SUI_EXT_05_PQR_DESABASTECIMIENTO.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_05_PQR_DESABASTECIMIENTO.sql): Indicador **S-5 Variación Interanual de PQR** por falta de servicio (%).
6. [`SUI_EXT_06_PLANES_EMERGENCIA_CONTINGENCIA.sql`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_06_PLANES_EMERGENCIA_CONTINGENCIA.sql): Indicador **R-1 Planes de Emergencia y Contingencia (PEC)** reportados vigentes.
7. [`SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py): Script de consulta SoQL alternativa para conjuntos públicos en `datos.gov.co`.
8. [`diccionario_variables_sui.md`](file:///g:/Mi%20unidad/Proyectos/vigia-nino-acueductos/ingesta/queries_sui/diccionario_variables_sui.md): Diccionario de variables, esquemas y reglas de negocio.

## Guía de Uso

### Modo 1: Ejecución en Bodega Oracle SUI (Conector Institucional)
```python
import oracledb

connection = oracledb.connect(user="USER_CRA", password="PASSWORD", dsn="sui-scan.sspd.gov.co:1521/SUIPRD")
cursor = connection.cursor()

with open("ingesta/queries_sui/SUI_EXT_02_CONTINUIDAD_SERVICIO.sql") as f:
    sql = f.read()

cursor.execute(sql, period_id="2026-08")
resultados = cursor.fetchall()
```

### Modo 2: Consulta vía Datos Abiertos (SoQL)
```bash
python ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py
```
