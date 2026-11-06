# Informe de Auditoría Técnica Integral: Calidad de Código, Seguridad, Dependencias y Pruebas
**Proyecto:** Vigía El Niño · Acueductos (CRA)  
**Auditor:** Explorer 3 (Code Quality, Security, Dependencies & Testing Auditor)  
**Fecha:** 2026-11-06T14:35:00Z  
**Ruta de Entrega:** `.agents/teamwork/explorer_survey_3/handoff.md`  
**Destino de Consolidación:** Coordinación / `docs/auditoria/03_resultado_auditoria_tecnica.md` (Requisito R3 / R4)

---

## 1. Observation (Observaciones Directas)

Se realizó una auditoría técnica exhaustiva y estática sobre el total del código base, estructuras de directorios, archivos de configuración, entorno de dependencias y suite de pruebas del repositorio `vigia-nino-acueductos`. A continuación se detallan los hallazgos empíricos organizados por dimensión.

### 1.1 Dependencias y Entorno de Ejecución
- **Archivo único de dependencias:** Solo existe `ingesta/requirements.txt` (7 líneas). No existe archivo `requirements.txt` en la raíz del proyecto, ni `pyproject.toml`, `setup.py`, `Pipfile`, o `poetry.lock`.
  ```text
  # ingesta/requirements.txt:1-7
  httpx>=0.27.0
  requests>=2.31.0
  pydantic>=2.8.0
  pytest>=8.0.0
  pyyaml>=6.0.1
  openpyxl>=3.1.2
  ```
- **Sin fijación estricta de versiones (Unpinned upper bounds):** Todas las dependencias usan operadores `>=` sin límite superior (`<`), lo que expone el proyecto a roturas súbitas por cambios de versión mayor (Breaking Changes).
- **Inexistencia de Lockfile:** No hay archivo de bloqueo (`requirements.lock`, `Pipfile.lock` o `poetry.lock`), impidiendo builds deterministas en entornos de integración o despliegue institucional.
- **Mezcla de dependencias de desarrollo y producción:** `pytest>=8.0.0` está declarado en las dependencias operativas en lugar de un archivo segregado `requirements-dev.txt`.
- **Redundancia de clientes HTTP frente al código real:** Se declaran simultáneamente `requests>=2.31.0` y `httpx>=0.27.0`, pero en el 85% de los conectores (`conector_noaa.py`, `conector_sivicap.py`, `conector_xm_embalses.py`, `conector_ungrd_minvivienda.py`, `conector_ideam.py`, `conector_nasa_firms.py`, `recuperacion.py`) se implementa directamente la biblioteca estándar `urllib.request`.
- **Riesgo por versiones vulnerables permitidas:** `requests>=2.31.0` admite versiones históricas con alertas de seguridad conocidas (CVE-2023-32681, CVE-2024-35195).
- **Librerías frontend sin gestión de paquetes:** En `tablero/js/` se encuentran archivos minificados copiados manualmente: `leaflet.js` (v1.9.4) y `echarts.min.js`. No existe `package.json`, `package-lock.json` ni herramientas de gestión npm/yarn, impidiendo el escaneo automatizado de vulnerabilidades en frontend (e.g. `npm audit`, Dependabot).
- **Ausencia de dependencias de auditoría estática y calidad:** No están listados ni instalados paquetes esenciales como `ruff`, `flake8`, `mypy`, `black`, `bandit` ni `pytest-cov`.

### 1.2 Seguridad, Secretos y Gestión de Red
- **Desactivación explícita de validación SSL/TLS (Vulnerabilidad Crítica):**
  En `ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:41-43`:
  ```python
  # Contexto SSL tolerante a inspección corporativa en redes CRA
  self.ssl_context = ssl.create_default_context()
  self.ssl_context.check_hostname = False
  self.ssl_context.verify_mode = ssl.CERT_NONE
  ```
  El módulo deshabilita deliberadamente la verificación del nombre de host y acepta certificados inválidos o autofirmados, habilitando ataques de intermediario (Man-in-the-Middle, MitM — CWE-295).
- **Reglas de exclusión incompletas en `.gitignore`:**
  El archivo `.gitignore` contiene únicamente 12 líneas y omite patrones críticos:
  * No excluye archivos de entorno: `.env`, `.env.*`.
  * No excluye llaves o certificados privados: `*.pem`, `*.key`, `*.pfx`.
  * No excluye entornos virtuales: `venv/`, `.venv/`, `env/`.
  * No excluye directorios de IDEs: `.vscode/`, `.idea/`.
  * No excluye artefactos de frontend: `node_modules/`.
- **Inexistencia de plantilla `.env.example`:**
  El código referencia variables de entorno como `FIRMS_MAP_KEY` (`conector_nasa_firms.py:56`, `recuperacion.py:223`) y `SOCRATA_APP_TOKEN` (`SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:37`), pero no existe un archivo `.env.example` documentado para guiar la parametrización segura del operador.
- **Servidor HTTP sin autenticación ni protección CSRF:**
  En `servidor_tablero.py:118-133`, el método `do_POST` expone el endpoint `/api/semanal/actualizar`, el cual ejecuta en segundo plano un hilo con la actualización pesada del modelo. El endpoint carece de token CSRF, cabecera de autenticación o validación de origen (CWE-352). Aunque escucha en `127.0.0.1`, cualquier script malicioso ejecutado en el navegador de un usuario local puede desencadenar peticiones POST en bucle (Denegación de Servicio local).
- **Cabeceras de seguridad HTTP deficientes:**
  En `servidor_tablero.py:96-100`, solo se configuran `X-Content-Type-Options: nosniff` y `Referrer-Policy: same-origin`. Se omiten `Content-Security-Policy` (CSP), `X-Frame-Options: DENY` y transporte seguro TLS/HTTPS, incumpliendo el requisito formal `RNF-SEG-02` establecido en `context-lake/specs/seguridad-acceso.md`.
- **Riesgo de XSS en manipulación del DOM vía `innerHTML`:**
  En `tablero/js/app.js` (más de 30 ocurrencias, e.g. líneas 446, 616, 1201, 1306, 1878, 2050, 3041) y `tablero/auditoria/js/auditoria.js` (líneas 230, 308, 348, 386), cadenas obtenidas del corte de datos se concatenan e inyectan directamente en `element.innerHTML` sin sanitización ni escape de entidades HTML (CWE-79).
- **Generación dinámica de JavaScript con riesgo de inyección:**
  En `ingesta/pipeline_corte.py:449`:
  ```python
  data_js_content = f"// Datos Maestros Integrados — Vigía El Niño · Acueductos\nwindow.VIGIA_DATA = {{ corte: {corte_json_str} }};\n"
  ```
  La serialización directa de JSON dentro de un script de asignación global `window.VIGIA_DATA = ...` sin escapar secuencias de cierre `</script>` genera riesgos de inyección si cadenas provenientes de fuentes externas contienen scripts maliciosos.

### 1.3 Calidad de Código y Análisis Estático
- **Conectores con consultas descartadas y lectura de archivos estáticos:**
  * En `ingesta/conectores/conector_ungrd_minvivienda.py:80`: Se invoca `self._consultar_emergencias_socrata()`, pero su valor de retorno es ignorado. En su lugar, el conector lee un archivo estático local: `data/config/actos_administrativos_verificados.json` (líneas 44-50, 93-100).
  * En `ingesta/conectores/conector_ideam.py:139`: Se invoca `self._consultar_estaciones_socrata()`, pero el retorno se ignora completamente. Los indicadores climáticos se extraen directamente del archivo estático `data/config/catalogo_municipios_ideam.json` (líneas 157-162).
  * En `ingesta/conectores/conector_sui.py:43-47`: Carga el archivo más reciente desde `data/bronce/fte_sui/*.json`, reprocesa los valores y vuelve a guardar el resultado en `data/bronce/fte_sui/` (línea 158), generando un ciclo redundante de escritura de Bronce sobre Bronce.
  * En `ingesta/conectores/conector_noaa.py:126-127`: Los campos `"indicador_a2_probabilidad_muy_fuerte_pct": 83.0` y `"fecha_boletin_enso": "2026-10-10"` están quemados como constantes fijas (Hardcoded) en el código.
- **Captura silente de excepciones (Silent Exception Swallowing):**
  Se identificaron 17 bloques `try...except Exception:` con `pass` o `continue` sin registro en bitácoras de depuración ni propagación de error:
  * `ingesta/conector_base.py:112`
  * `ingesta/conectores/conector_xm_embalses.py:146`
  * `ingesta/conectores/conector_ungrd_minvivienda.py:58`
  * `ingesta/conectores/conector_nasa_firms.py:39`
  * `ingesta/semanal/modelo_semanal.py:38, 330, 357, 378, 430, 881`
  * `ingesta/semanal/historico.py:58`
  * `ingesta/historico/recuperacion.py:84, 277`
  * `auditoria/auditor_veracidad.py:354, 496, 956, 1051`
  Esto oculta fallos de corrupción de datos en JSON, deserialización defectuosa o fallas de permisos de disco.
- **Duplicación de código en reglas de normalización (Violación DRY):**
  Las fórmulas de normalización para `S-1`, `S-3`, `S-4`, `S-5` y `H-4` están definidas como métodos estáticos en `ConectorSUI` (`conector_sui.py:53-104`), pero están re-implementadas idénticamente en línea dentro de `PipelineCorte.generar_corte_completo()` (`pipeline_corte.py:240-289`).
- **Inyección de números mágicos por defecto (Default Fallback Magic Numbers):**
  En `ingesta/pipeline_corte.py:237-295`, cuando una variable no viene en los datos del municipio, en lugar de conservar `None` (sin dato) para activar la regla de cobertura mínima (< 60% peso), el código inyecta valores arbitrarios: continuidad en 24.0h, cobertura en 95.0%, IANC en 30.0%, PQR en 20.0%, autonomía en 14.0h, consumo en 12.8 m³, IRCA en 12.0%. Similarmente, en `conector_xm_embalses.py:161,203,214` se inyectan niveles de 75.1%, 50.0% y 66.4%.
- **Acoplamiento a rutas relativas no resueltas:**
  En `ingesta/cli.py:43`, la ruta `Path("data/oro/corte_vigente.json")` es relativa al directorio de trabajo actual. Si el CLI se ejecuta desde cualquier otra carpeta (ej. desde `ingesta/` o un script externo), la verificación de estado falla con un falso negativo.
- **Crecimiento descontrolado de archivos en disco (Disk Bloat):**
  En `auditoria/auditor_veracidad.py:1138`, cada ejecución genera un nuevo archivo timestamped `data/ops/auditoria_corte_YYYYMMDD_HHMMSS.json`. Ya existen más de 15 archivos acumulados sin política de retención o rotación automática.
- **Duplicidad de artefactos en el frontend:**
  El directorio `tablero/auditoria/` contiene duplicados exactos de los archivos `auditoria/index.html`, `auditoria/auditoria_data.js`, `auditoria/reporte_auditoria_vigente.json` y carpetas `css/`, `js/`, generando doble mantenimiento.

### 1.4 Suite de Pruebas y CI/CD
- **Inexistencia total de canal de CI/CD:**
  No existe configuración alguna de integración continua (`.github/workflows/`, `.gitlab-ci.yml`, Azure Pipelines o pre-commit hooks). Toda prueba y aseguramiento de calidad depende exclusivamente de ejecuciones manuales del desarrollador.
- **Pruebas unitarias tautológicas (Self-proving / Tautological Tests):**
  En `ingesta/tests/test_indice_riesgo.py`:
  * `test_escenario_continuidad_entre_umbrales` (líneas 14-25): No invoca ninguna función de `PipelineCorte`; calcula localmente `puntaje = round(60.0 + ((18.0 - 15.0) / 6.0) * 15.0, 2)` y aserta `assert puntaje == 67.5`.
  * `test_escenario_calamidad_declarada_con_pec_al_dia` (líneas 27-42): Calcula `max([0.0, 0.0, 100.0])` dentro del cuerpo de la prueba y aserta contra 100.0 sin llamar a la lógica del pipeline.
  * `test_escenario_capa_h_sin_datos_redistribucion` (líneas 44-67): Realiza operaciones aritméticas de pesos locales en la prueba sin validar la lógica interna del pipeline.
  Estas pruebas siempre pasan independientemente de si el código de producción tiene errores o no.
- **Pruebas con llamadas directas a red (Falta de mocks):**
  En `ingesta/tests/test_conectores.py:12-27`:
  Las pruebas `test_conector_xm_ejecucion` y `test_conector_ungrd_mvct_ejecucion` ejecutan instancias vivas de los conectores que intentan comunicarse con endpoints de red externos o leer la estructura de archivos local sin aislamiento ni simuladores (`unittest.mock`, `responses` o `httpx_mock`). Si la conexión a internet falla o el servidor externo está caído, la suite de pruebas unitarias colapsa.
- **Déficit crítico en cobertura de conectores:**
  5 de los 7 conectores no tienen ninguna prueba unitaria en `test_conectores.py`:
  * `ConectorNOAA`
  * `ConectorIDEAM`
  * `ConectorNASAFIRMS`
  * `ConectorSIVICAP`
  * `ConectorSUI`
- **Acoplamiento rígido de pruebas a datos estáticos:**
  En `ingesta/tests/test_auditoria.py`:
  * `test_auditoria_integridad_criptografica` (línea 18): Exige estrictamente `res["archivos_evaluados"] >= 18`.
  * `test_auditoria_reconciliacion_fuentes` (línea 27): Exige exactamente `res["total_comparaciones"] == 460`.
  Cualquier cambio legítimo en los datos crudos o agregación de nuevos municipios invalida las pruebas.
- **Ausencia de medición de cobertura de código:**
  No se cuenta con métricas automáticas de cobertura (sin `pytest-cov`).

### 1.5 Documentación y Gestión de Configuración
- **Ausencia de `README.md` en la raíz del repositorio:**
  La raíz del proyecto carece por completo de un archivo `README.md` que detalle: propósito del sistema, guía de instalación paso a paso, configuración de variables de entorno, comandos de inicio del servidor y ejecución de la suite de pruebas.
- **Contaminación del control de versiones con 305 archivos de datos operativos:**
  Actualmente se encuentran versionados en Git 305 archivos bajo `data/` (archivos crudos JSON en `bronce/`, cortes en `oro/`, registros en `ops/`). Esto infla el repositorio, genera conflictos constantes de mezcla (merge conflicts) y confunde el ciclo de vida del código con el almacenamiento del lago de datos.

---

## 2. Matriz Estructurada de Hallazgos y Severidad

| ID | Severidad | Categoría | Archivo / Ubicación | Descripción del Hallazgo | Recomendación Concreta de Remediación |
|---|---|---|---|---|---|
| **SEC-01** | **CRÍTICA** | Seguridad / Red | `ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:42-43` | Desactivación de validación SSL/TLS (`check_hostname = False`, `verify_mode = ssl.CERT_NONE`), habilitando ataques MitM. | Eliminar la desactivación manual de TLS; utilizar el contexto seguro por defecto `ssl.create_default_context()` o incorporar certificados institucionales de la CRA mediante `ssl_context.load_verify_locations()`. |
| **SEC-02** | **ALTA** | Seguridad / Git | `.gitignore:1-12` | Omisión de reglas para `.env`, `.env.*`, credenciales `*.pem`, `*.key`, entornos virtuales `venv/` y directorios IDE. | Actualizar `.gitignore` incluyendo explícitamente `.env`, `.env.*`, `*.pem`, `*.key`, `venv/`, `.venv/`, `.vscode/`, `.idea/` y `node_modules/`. |
| **SEC-03** | **ALTA** | Seguridad / Web | `servidor_tablero.py:118-133` | Endpoint POST `/api/semanal/actualizar` sin autenticación, sin validación de rol ni protección contra CSRF. | Implementar cabecera de validación token/secreto local o token anti-CSRF en la sesión HTTP y verificar cabecera `Origin`/`Referer` estricta. |
| **SEC-04** | **ALTA** | Seguridad / XSS | `tablero/js/app.js`, `tablero/auditoria/js/auditoria.js` | Inyección directa de datos no sanitizados en `innerHTML` en más de 30 bloques de renderizado. | Reemplazar asignaciones `innerHTML` por `textContent` / `innerText`, o utilizar una función de escape estricto de entidades HTML (`escapeHtml()`) previo a la interpolación en plantillas. |
| **TST-01** | **ALTA** | Pruebas Unitarias | `ingesta/tests/test_indice_riesgo.py:14-68` | Pruebas unitarias tautológicas: calculan operaciones aritméticas locales sin invocar las funciones del pipeline real. | Refactorizar las pruebas para instanciar `PipelineCorte` e invocar directamente los métodos `normalizar_*` y `calcular_icr_municipio` con entradas de prueba controladas. |
| **TST-02** | **ALTA** | Pruebas Unitarias | `ingesta/tests/test_conectores.py:12-27` | Pruebas unitarias que realizan llamadas reales a la red externa sin mocks ni fixtures de aislamiento. | Utilizar `unittest.mock.patch` o `httpx_mock` para simular respuestas HTTP predefinidas (payloads simulados en fixtures de prueba). |
| **CICD-01** | **ALTA** | Automatización | Raíz del repositorio | Inexistencia total de pipelines de Integración Continua (CI/CD) para ejecución de pruebas y análisis estático. | Crear flujo de GitHub Actions (`.github/workflows/ci.yml`) que ejecute en cada commit/PR: `pytest`, linters (`ruff`) y chequeo de tipos (`mypy`). |
| **COD-01** | **ALTA** | Calidad / Lógica | `ingesta/conectores/conector_ungrd_minvivienda.py:80`, `conector_ideam.py:139` | Conectores que descartan la respuesta de consulta externa y leen datos de archivos estáticos locales de configuración. | Diseñar la lógica de ingestión real para procesar el payload de Socrata/DHIME, utilizando el archivo de configuración únicamente como fallback ante fallo comprobado con registro de alerta. |
| **DEP-01** | **MEDIA** | Dependencias | `ingesta/requirements.txt:1-7` | Sin límites superiores de versión (`<`), sin archivo lockfile y mezcla de paquetes dev (`pytest`) con producción. | Definir rangos cerrados de versión, separar en `requirements.txt` y `requirements-dev.txt`, y generar `requirements.lock` mediante `pip-tools` o `poetry`. |
| **DEP-02** | **MEDIA** | Dependencias | `ingesta/requirements.txt`, conectores | Redundancia de dependencias HTTP (`requests` y `httpx`) mientras el código usa `urllib.request`. | Estandarizar la arquitectura HTTP en un único cliente robusto (preferiblemente `httpx` con async/sync) y remover bibliotecas no utilizadas. |
| **DEP-03** | **MEDIA** | Dependencias / Web | `tablero/js/` (`leaflet.js`, `echarts.min.js`) | Bibliotecas JavaScript de terceros integradas como archivos estáticos sin gestor de paquetes ni trazabilidad de CVEs. | Inicializar `package.json` para gestionar dependencias frontend vía npm, permitiendo auditorías con `npm audit` y empaquetado optimizado con Vite. |
| **SEC-05** | **MEDIA** | Seguridad / Web | `servidor_tablero.py:96-100` | Ausencia de cabeceras de seguridad requeridas (`Content-Security-Policy`, `X-Frame-Options: DENY`, HSTS) según RNF-SEG-02. | Agregar cabeceras `Content-Security-Policy: default-src 'self' ...`, `X-Frame-Options: DENY` y `X-XSS-Protection: 1; mode=block` en el método `end_headers()`. |
| **SEC-06** | **MEDIA** | Seguridad / Config | Raíz del proyecto | Ausencia de plantilla de configuración `.env.example`. | Crear `.env.example` documentando las variables opcionales y obligatorias (`FIRMS_MAP_KEY`, `SOCRATA_APP_TOKEN`, `PORT`, `LOG_LEVEL`). |
| **COD-02** | **MEDIA** | Calidad / Robustez | 17 ubicaciones en conectores, modelo y auditoría | Captura masiva y silente de excepciones (`except Exception: pass/continue`) sin logging ni trazabilidad. | Reemplazar con excepciones específicas (`json.JSONDecodeError`, `FileNotFoundError`) y agregar logging explícito (`logger.error(...)`) antes de continuar. |
| **COD-03** | **MEDIA** | Calidad / DRY | `ingesta/pipeline_corte.py:240-289`, `conector_sui.py:53-104` | Duplicación idéntica de código de las funciones de normalización de indicadores `S-1`, `S-3`, `S-4`, `S-5` y `H-4`. | Reutilizar directamente las funciones estáticas de `ConectorSUI` o extraerlas a un módulo compartido `ingesta.normalizadores`. |
| **COD-04** | **MEDIA** | Calidad / Integridad | `ingesta/pipeline_corte.py:237-295`, `conector_xm_embalses.py:161,203,214` | Inyección de valores mágicos fijos cuando falta información municipal en lugar de asignar `None` (sin dato). | Mantener el valor como `None` para que las reglas de calidad de datos (`RF-ICR-04`) detecten la cobertura real y clasifiquen como `sin_dato` si la cobertura es insuficiente. |
| **COD-05** | **MEDIA** | Calidad / Rutas | `ingesta/cli.py:43` | Uso de ruta relativa no anclada a la raíz (`Path("data/oro/corte_vigente.json")`), sensible al directorio de ejecución. | Anclar la ruta al directorio raíz del proyecto mediante `Path(__file__).resolve().parent.parent / "data" / ...`. |
| **TST-03** | **MEDIA** | Pruebas Unitarias | `ingesta/tests/test_conectores.py` | Cobertura deficiente: 5 conectores de 7 carecen de pruebas automatizadas. | Desarrollar casos de prueba unitaria para `ConectorNOAA`, `ConectorIDEAM`, `ConectorNASAFIRMS`, `ConectorSIVICAP` y `ConectorSUI`. |
| **TST-04** | **MEDIA** | Pruebas Unitarias | `ingesta/tests/test_auditoria.py:18, 27` | Pruebas frágiles fuertemente acopladas a la cardinalidad exacta de archivos estáticos (460 filas, 18 archivos). | Parametrizar las pruebas para validar consistencia porcentual (100% de integridad) sobre los archivos presentes, sin atar la aserción a un número mágico estático. |
| **DOC-01** | **MEDIA** | Documentación | Raíz del proyecto | Ausencia de archivo `README.md` en la raíz del repositorio. | Redactar un `README.md` profesional con descripción del proyecto, arquitectura rápida, requisitos de instalación, configuración de `.env` y comandos de prueba y ejecución. |
| **REP-01** | **MEDIA** | Repositorio / Datos | Directorio `data/` | 305 archivos de datos (bronce, plata, oro, ops) versionados y rastreados en Git. | Migrar el almacenamiento de datos a almacenamiento de objetos (GCS/S3 o MinIO local) o excluirlos en `.gitignore` preservando solo datos semilla (`seed/`). |
| **COD-06** | **BAJA** | Calidad / Operación | `auditoria/auditor_veracidad.py:1138` | Acumulación infinita de archivos de auditoría en `data/ops/` sin retención ni depuración de logs. | Incorporar una política de rotación que conserve únicamente los últimos N reportes de auditoría (e.g. últimos 30 días). |
| **COD-07** | **BAJA** | Calidad / Estructura | `tablero/auditoria/` vs `auditoria/` | Duplicación completa de archivos HTML/JS/CSS de auditoría entre dos carpetas del proyecto. | Centralizar la interfaz de auditoría en una única ubicación y configurar el servidor web para servir la ruta `/auditoria/` desde esa carpeta fuente. |

---

## 3. Logic Chain (Cadena Lógica de Razonamiento)

1. **Premisa 1 (Seguridad y Confianza Regulatoria):**
   Un sistema diseñado para la Comisión de Regulación de Agua Potable (CRA) que monitorea emergencias hídricas y orienta decisiones regulatorias ante el fenómeno de El Niño no puede emitir certificaciones de veracidad ("CERTIFICADO_FEHACIENTE") si sus canales de ingestión desactivan la verificación criptográfica TLS (`verify_mode = ssl.CERT_NONE` en `SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:43`). Cualquier ataque MitM en la red local o corporativa podría inyectar datos manipulados de IRCA o cobertura sin que el sistema lo advierta.

2. **Premisa 2 (Madurez y Veracidad de la Ingestión):**
   Aunque la documentación (`context-lake/specs/ingesta-fuentes.md`) y el módulo de auditoría declaran que la ingestión es automatizada y en vivo, la inspección del código fuente evidencia que `conector_ungrd_minvivienda.py` y `conector_ideam.py` descartan el retorno de las peticiones HTTP y leen archivos de configuración estáticos JSON, mientras que `conector_sui.py` lee un archivo JSON preexistente en bronce y lo reescribe con nueva fecha. En consecuencia, el flujo actual es una simulación guiada por configuraciones estáticas más que un pipeline de datos dinámico.

3. **Premisa 3 (Fiabilidad de la Suite de Pruebas):**
   El reporte de ejecución de `pytest` arroja `20 passed in 9.16s`. Sin embargo, el análisis estático detallado revela que:
   - 3 de las 5 pruebas de ICR son tautológicas (comprueban aritmética básica de Python escrita en el mismo archivo de prueba, sin pasar por el pipeline).
   - Las pruebas de conectores hacen peticiones de red reales (violando el principio de aislamiento y reproducibilidad).
   - 5 de los 7 conectores carecen completamente de pruebas.
   Por tanto, la tasa de éxito del 100% en los tests proporciona una falsa sensación de seguridad técnica.

4. **Premisa 4 (Mantenibilidad y Deuda Técnica):**
   La ausencia de un archivo `README.md` en la raíz, la falta de limitación superior en las dependencias, la ausencia de lockfile y la presencia de 305 archivos JSON/GeoJSON comprometidos en el historial de Git demuestran que el proyecto se encuentra en un estado de prototipo avanzado (PoC / MVP) y no en un nivel de producción maduro.

---

## 4. Caveats (Advertencias y Supuestos)

- **Entorno de Red Corporativa CRA:** La desactivación de SSL en `SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py` parece haber sido introducida para sortear proxies corporativos de inspección SSL dentro de la red interna de la entidad. Sin embargo, solucionar un bloqueo de red omitiendo la verificación de certificados es un antipatrón de seguridad crítico.
- **Alcance de la Auditoría:** No se realizaron pruebas dinámicas de intrusión (pentesting activo) sobre los puertos locales ni se modificó ningún archivo de código del repositorio, respetando el carácter estrictamente de solo lectura del rol Explorer.
- **Librerías de Terceros Frontend:** No se desensamblaron por completo los archivos minificados `leaflet.js` y `echarts.min.js`, limitándose a la verificación de versiones y revisión de patrones comunes de riesgo en el código JavaScript personalizado.

---

## 5. Conclusion (Conclusiones Técnicas)

1. **Diagnóstico General:** El repositorio `vigia-nino-acueductos` exhibe una arquitectura conceptual sofisticada (modelo de almacenamiento medallón, trazabilidad de linaje, interfaces de tablero completas y narrativa de auditoría regulatoria), pero presenta **brechas críticas de seguridad, calidad de pruebas y automatización de datos reales**.
2. **Prioridades Inmediatas de Remediación:**
   - **P1 (Seguridad Crítica):** Habilitar la validación estricta de certificados SSL en todas las conexiones salientes y actualizar `.gitignore` para bloquear la fuga de secretos.
   - **P2 (Confiabilidad del ICR y Datos):** Sustituir los fallbacks arbitrarios (números mágicos quemados) por la preservación rigurosa de `sin_dato` (`None`) para que el ICR refleje fielmente la insuficiencia de información.
   - **P3 (Pruebas Reales y CI/CD):** Refactorizar las pruebas tautológicas para validar los componentes reales de `PipelineCorte`, aislar los conectores mediante mocks e implementar un flujo automatizado de CI con GitHub Actions.
   - **P4 (Higiene de Repositorio):** Crear el archivo `README.md` maestro, estructurar `requirements.txt` con límites de versión y migrar los 305 archivos de datos fuera del historial de Git.

---

## 6. Verification Method (Método de Verificación Independiente)

Para verificar y reproducir de manera autónoma las observaciones y conclusiones reportadas, ejecute los siguientes procedimientos en PowerShell desde la raíz del proyecto (`g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos`):

### 6.1 Verificación de Desactivación SSL (SEC-01)
```powershell
Select-String -Path "ingesta\queries_sui\SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py" -Pattern "(CERT_NONE|check_hostname)"
```
*Resultado esperado:* Debe mostrar las líneas 42 y 43 con `check_hostname = False` y `verify_mode = ssl.CERT_NONE`.

### 6.2 Verificación de Pruebas Tautológicas (TST-01)
```powershell
Get-Content -Path "ingesta\tests\test_indice_riesgo.py" | Select-Object -Index (13..26)
```
*Resultado esperado:* Debe mostrar que `test_escenario_continuidad_entre_umbrales` no invoca a `pipeline`, sino que calcula la variable `puntaje` directamente mediante aritmética local.

### 6.3 Verificación de Conectores Descartando Respuestas (COD-01)
```powershell
Select-String -Path "ingesta\conectores\conector_ungrd_minvivienda.py" -Pattern "(_consultar_emergencias_socrata|actos_administrativos_verificados\.json)"
Select-String -Path "ingesta\conectores\conector_ideam.py" -Pattern "(_consultar_estaciones_socrata|catalogo_municipios_ideam\.json)"
```
*Resultado esperado:* Confirmación de que las llamadas a Socrata se realizan pero no se asignan a ninguna variable, y los datos se cargan desde los archivos JSON en `data/config/`.

### 6.4 Verificación de Ausencia de README y Plantilla de Entorno (DOC-01, SEC-06)
```powershell
Test-Path -Path "README.md"
Test-Path -Path ".env.example"
```
*Resultado esperado:* Ambos comandos deben retornar `False`.

### 6.5 Verificación de Archivos de Datos en Git (REP-01)
```powershell
(git ls-files data/).Count
```
*Resultado esperado:* Retorna `305`, confirmando que los datos crudos y procesados están versionados en el control de código fuente.
