# Sistema Independiente de Auditoría Periódica y Certificación de Veracidad de Datos

**Entidad:** Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**Sistema:** Vigía El Niño · Acueductos  
**Fecha de Implementación:** 2026-10-08  
**Componente:** Módulo Independiente de Auditoría y Veracidad (`auditoria/`)  
**Audiencia:** Comisionados Expertos, Dirección Ejecutiva, Subdirección de Regulación, Oficina de TIC & CD, Órganos de Control (SSPD, Procuraduría General de la Nación)

---

## 1. Justificación y Propósito Regulatorio

Para que el sistema **Vigía El Niño · Acueductos** sirva como soporte legítimo y vinculante para la toma de decisiones regulatorias extraordinarias (tales como la activación de planes de contingencia, flexibilización tarifaria de emergencia bajo la Resolución CRA 943 de 2021 o requerimientos perentorios a prestadores), la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA) requiere un mecanismo independiente que demuestre **de manera fehaciente, inmutable y reproducible** que:

1. **Inmutabilidad de Origen:** Ninguna cifra mostrada en el tablero proviene de suposiciones, datos sintéticos o ediciones manuales no supervisadas.
2. **Reconciliación Estricta:** Cada uno de los 460 puntos de control (23 municipios emblemáticos $\times$ 20 indicadores) coincide exactamente con los registros crudos capturados desde las entidades primarias oficiales (NOAA, SIVICAP, IDEAM, UNGRD, XM, FIRMS, SUI).
3. **Exactitud Matemática:** El cálculo del Índice Compuesto de Riesgo (ICR) y los niveles de alerta reproducen con desviación $0.00$ las ecuaciones aprobadas en las especificaciones regulatorias (RF-ICR-01 a RF-ICR-06).
4. **Cumplimiento de Reglas de Calidad:** Se respetan las reglas de rango físico y normativo (RN-CAL-01 a RN-CAL-07), garantizando en particular la Regla de Oro: `sin_dato` nunca es sustituido por un cero falso ($0$).

---

## 2. Arquitectura del Artefacto Independiente

El artefacto de auditoría fue concebido para operar con total autonomía respecto a los componentes de presentación y cálculo habituales:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│             ARQUITECTURA DEL SISTEMA INDEPENDIENTE DE AUDITORÍA Y VERACIDAD            │
└────────────────────────────────────────────────────────────────────────────────────────┘

  ZONA BRONCE INMUTABLE                         REGISTRO DE OPERACIONES
  data/bronce/ (18 archivos crudos)             data/ops/capturas.json
  ├── fte_cpc_noaa/ (*.txt)                     ├── Hash SHA-256 de descarga
  ├── fte_ins_irca/ (*.json)                    ├── Tamaño en bytes y filas procesadas
  ├── fte_ideam_clima/ (*.json)                 └── Timestamp UTC inmutable
  ├── fte_ungrd_mvct/ (*.json)                             │
  ├── fte_xm_embalses/ (*.json)                            │
  └── fte_firms_nasa/ (*.json)                             │
                 │                                         │
                 ▼                                         ▼
  ┌───────────────────────────────────────────────────────────────────────────────────┐
  │           MOTOR AUTÓNOMO DE AUDITORÍA (auditoria/auditor_veracidad.py)            │
  ├───────────────────────────────────────────────────────────────────────────────────┤
  │ 1. Auditoría Criptográfica: Recálculo en vivo de SHA-256 de archivos en disco     │
  │ 2. Reconciliación Punto a Punto: 460 cruces exactos Raw -> Oro                    │
  │ 3. Validador Matemático ICR: Recálculo autónomo de subíndices, pesos y piso       │
  │ 4. Verificador RN-CAL: Validación de rangos, frescura y no-ceros falsos           │
  │ 5. Certificación Digital: Firma del dictamen con hash SHA-256 inmutable           │
  └───────────────────────────────────────────────────────────────────────────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
  ARTEFACTOS DE SALIDA FORENSE                            TABLERO WEB INDEPENDIENTE
  ├── auditoria/reporte_auditoria_vigente.json            ├── auditoria/index.html
  ├── data/ops/auditoria_corte_YYYYMMDD.json              ├── auditoria/css/auditoria.css
  └── auditoria/auditoria_data.js                         └── auditoria/js/auditoria.js
                                                               (5 Vistas Interactivas)
```

---

## 3. Resultados de la Auditoría Inicial

La ejecución del motor sobre el corte vigente del **2026-10-08** arrojó los siguientes resultados fehacientes:

| Dimensión de Auditoría | Indicador Clave | Resultado Obtenido | Estado Regulatorio |
|---|---|---|---|
| **Integridad Criptográfica** | Tasa de Inmutabilidad SHA-256 | **100.0 %** (20 de 20 archivos íntegros) | **CONFORME** |
| **Fidelidad de Datos Primarios** | Tasa de Veracidad Raw $\to$ Tablero | **100.0 %** (460/460 coincidencias exactas) | **CERTIFICADO** |
| **Discrepancias Identificadas** | Diferencias $> 0.001$ | **0 discrepancias** | **ÓPTIMO** |
| **Precisión Matemática ICR** | Desviación Máxima frente a Fórmulas | **0.00 pts** | **EXACTO** |
| **Reglas de Calidad (RN-CAL)** | Violaciones de Rango o Ceros Falsos | **0 infracciones** | **CUMPLIMIENTO TOTAL** |
| **Dictamen General** | Veredicto Oficial CRA | **`CERTIFICADO_FEHACIENTE`** | **APROBADO** |

---

## 4. Estructura del Tablero de Auditoría Web (`auditoria/index.html`)

El tablero independiente contiene 5 módulos especializados:

1. **Matriz Forense de Reconciliación 1:1:**
   - Permite a cualquier auditor o comisionado filtrar los 460 puntos por municipio, departamento o capa de riesgo.
   - Cada fila detalla el indicador, la fuente autorizada, el valor crudo en zona bronce, el valor en tablero y el delta ($0.0000$).
   - Incluye el botón **"Linaje"** que abre el modal con la traza completa desde la URL oficial hasta el pixel de la pantalla.

2. **Integridad Criptográfica de Ingesta (Zona Bronce):**
   - Tabla forense que lista cada archivo descargado, su hash registrado en `ops.capturas` y el hash calculado en disco.
   - Incluye el botón **"Inspeccionar"** para consultar el payload crudo descargado.

3. **Validador Matemático Autónomo del ICR:**
   - Comprueba municipio por municipio el cálculo de los subíndices de capa ($I_A, I_H, I_S, I_R$), la suma de pesos disponibles ($\ge 60\%$), la redistribución dinámica y la aplicación de la **Regla de Piso Regulatorio (RF-ICR-06)** (si un municipio reporta racionamiento o calamidad, su nivel no puede ser inferior a Naranja).
   - Botón **"Fórmula"** con desglose aritmético paso a paso.

4. **Reglas de Calidad y Frescura (RN-CAL):**
   - Comprobación de límites físicos (IRCA $\in [0, 100]$, Continuidad $\in [0, 24]$, IANC $\in [0, 100]$, Caudal $\ge 0$).
   - Verificación de la Regla de Oro #5: un dato faltante queda como `NULL` / `sin_dato` y nunca se reemplaza por $0$.

5. **Certificado Oficial Imprimible:**
   - Documento formal con diseño institucional para exportación directa a PDF o impresión física (`window.print()`), firmado digitalmente con el hash SHA-256 del dictamen.

---

## 5. Modos de Ejecución Periódica

El sistema puede ejecutarse bajo demanda o programarse para auditoría periódica automática (diaria, semanal o tras cada corte de ingesta):

### A. Ejecución de un Clic en Windows
Doble clic sobre el archivo en la raíz del proyecto:
```bat
ejecutar_auditoria.bat
```
Este script ejecuta el motor de auditoría en consola y, al certificar el 100% de los datos, abre automáticamente el tablero de auditoría en el navegador.

### B. Ejecución en PowerShell / Windows Task Scheduler
```powershell
powershell -ExecutionPolicy Bypass -File .\ejecutar_auditoria.ps1
```
Retorna código de salida `$LASTEXITCODE = 0` cuando el dictamen es `CERTIFICADO_FEHACIENTE` y `1` en caso de cualquier anomalía.

### C. Ejecución vía Línea de Comandos (CLI Python)
```bash
python auditoria/auditor_veracidad.py
```

### D. Acceso Directo desde el Tablero Principal
En el tablero web institucional (`http://localhost:8088/`), los usuarios pueden abrir la auditoría con un solo clic:
- Mediante el botón **"Auditoría de Veracidad"** ubicado en el encabezado superior derecho.
- Mediante el botón **"Ejecutar / Ver Auditoría Fehaciente"** en la Vista **V-07 (Monitor de Fuentes e Ingesta)**.
