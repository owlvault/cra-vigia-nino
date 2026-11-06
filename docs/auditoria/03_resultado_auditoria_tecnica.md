# Informe de Auditoría Técnica Integral: Código Base, Seguridad, Calidad, Dependencias y Pruebas

**Sistema de Información:** Vigía El Niño · Monitoreo y Alerta Temprana de Acueductos  
**Entidad Reguladora:** Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**Versión del Repositorio Auditado:** Commit de referencia / Estado de desarrollo operativo  
**Fecha de Evaluación:** 6 de noviembre de 2026  
**Alcance:** Código fuente (`ingesta/`, `auditoria/`, `tablero/`, scripts raíz), dependencias, suite de pruebas, infraestructura de datos y configuraciones operativas  
**Clasificación de Seguridad:** Confidencial / Uso Técnico Regulatorio  

---

## 1. Identificación y Metadatos de la Auditoría

| Parámetro | Detalle Institucional |
|---|---|
| **Objetivo de la Auditoría** | Evaluación técnica forense, estática y dinámica de la arquitectura de software, calidad del código fuente, postura de ciberseguridad, gestión de dependencias, integridad del modelo de datos y fiabilidad de la suite de pruebas del proyecto `vigia-nino-acueductos`. |
| **Estándares y Marcos de Referencia** | OWASP Top 10 (2021), CWE/SANS Top 25 Most Dangerous Software Weaknesses, ISO/IEC 25010 (Calidad del Producto de Software), PEP 8 / Flake8 / Ruff standards para Python, Twelve-Factor App Methodology. |
| **Pila Tecnológica Auditada** | Python 3.12+, Vanilla JavaScript (ES6+), Leaflet 1.9.4, Apache ECharts 5.x, Pytest 9.1+, HTTP nativo (`urllib.request`), Almacenamiento Medallón (JSON/GeoJSON en disco local). |
| **Tipo de Análisis** | Análisis Estático de Código Fuente (SAST), Auditoría de Dependencias de Terceros (SCA), Auditoría de Configuración y Gestión de Secretos, Ejecución Dinámica de Suite de Pruebas Unitarias. |
| **Resultado Global del Dictamen** | **NO APTO PARA PRODUCCIÓN REGULATORIA (ESTADO: PROTOTIPO CON VULNERABILIDADES CRÍTICAS Y BRECHAS DE INTEGRIDAD DE DATOS)**. |

---

## 2. Resumen Ejecutivo

El sistema `vigia-nino-acueductos` fue concebido como una plataforma de monitoreo y alerta temprana ante el fenómeno de El Niño 2026-2027 para orientar la toma de decisiones regulatorias de la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA). El repositorio presenta un diseño conceptual estructurado en capas (arquitectura Medallón: Bronce, Plata, Oro), una interfaz de tablero geográfico interactivo de alta riqueza visual y un módulo especializado de auditoría matemática (`AuditorVeracidad`).

No obstante, la presente auditoría técnica integral evidenció que existe una **brecha profunda entre la arquitectura documental prometida y la implementación real del código base**. El proyecto se encuentra actualmente en un estado de prototipo avanzado con serias debilidades estructurales que impiden su uso confiable en entornos institucionales de producción.

### Principales Conclusiones Ejecutivas:
1. **Compromiso Crítico de Ciberseguridad (CWE-295):** El conector a datos abiertos Socrata (`SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py`) desactiva deliberadamente la validación de certificados SSL/TLS y la verificación del nombre de host (`check_hostname = False`, `verify_mode = ssl.CERT_NONE`), exponiendo las consultas a ataques de intermediario (Man-in-the-Middle) que anulan cualquier garantía de autenticidad sobre los datos recibidos.
2. **Simulación de Ingestión en Conectores Clave:** Conectores esenciales como `conector_ungrd_minvivienda.py` y `conector_ideam.py` realizan peticiones HTTP a APIs gubernamentales pero descartan por completo el valor retornado, leyendo en su lugar archivos JSON estáticos precargados en el directorio `data/config/`. Asimismo, `conector_sui.py` lee archivos existentes en la zona bronce y los vuelve a guardar en la misma zona con nuevos metadatos (reescritura de Bronce sobre Bronce), y `conector_noaa.py` contiene valores de probabilidad fijados estáticamente en el código fuente.
3. **Falsa Sensación de Cobertura en Pruebas Unitarias:** Aunque la ejecución manual de pruebas parece reportar alta tasa de éxito, las pruebas unitarias del Índice de Capacidad de Respuesta (`ingesta/tests/test_indice_riesgo.py`) son **tautológicas**: calculan operaciones aritméticas simples dentro del propio cuerpo del test sin invocar jamás las clases ni métodos del pipeline real de producción. Además, la ejecución actual de `pytest` arroja **2 pruebas fallidas** en `test_auditoria.py` debido a discrepancias reales entre las capas de datos y las aserciones rígidas de consistencia.
4. **Vulnerabilidades en Superficie Web:** El servidor HTTP local (`servidor_tablero.py`) carece de autenticación y de tokens anti-CSRF en su endpoint de recálculo (`/api/semanal/actualizar`), no implementa cabeceras fundamentales de seguridad como Content Security Policy (CSP) o X-Frame-Options, y el frontend (`tablero/js/app.js` y `auditoria.js`) realiza más de 40 concatenaciones directas en `element.innerHTML` sin sanitización de cadenas, habilitando riesgos de Cross-Site Scripting (XSS basado en DOM).
5. **Deuda Técnica y Falta de Industrialización:** No existen flujos de integración continua (CI/CD), las dependencias carecen de límites superiores de versión y de archivo de bloqueo (`lockfile`), 305 archivos operativos de datos están indebidamente versionados en el árbol de Git, y 17 bloques de captura silente de excepciones (`except Exception: pass/continue`) ocultan fallas potenciales de I/O y corrupción de datos.

### Distribución de Hallazgos por Nivel de Severidad:

```
[ CRÍTICA ] █ (1)   — Bypass SSL/TLS MitM
[  ALTA   ] ██████ (6) — Gitignore, POST sin CSRF, DOM XSS, Tests tautológicos, Tests con red viva, Consultas descartadas
[  MEDIA  ] ███████████ (11) — Sin lockfile, Redundancia HTTP, Libs frontend, Cabeceras HTTP, Sin .env.example, Excepciones silenciadas, Violación DRY, Magic numbers, Rutas relativas, Déficit cobertura tests, Tests acoplados a datos
[  BAJA   ] ██ (2)   — Crecimiento ops sin rotación, Duplicación código frontend
-------------------------------------------------------------------------------------------------------------------------
TOTAL: 20 HALLAZGOS TÉCNICOS ESTRUCTURADOS
```

---

## 3. Dimensión 1: Análisis de Dependencias y Entorno de Ejecución

### 3.1 Diagnóstico de `ingesta/requirements.txt`
El archivo de dependencias del proyecto se encuentra localizado únicamente en `ingesta/requirements.txt`. El contenido exacto auditado es:

```text
# ingesta/requirements.txt:1-7
httpx>=0.27.0
requests>=2.31.0
pydantic>=2.8.0
pytest>=8.0.0
pyyaml>=6.0.1
openpyxl>=3.1.2
```

Se identifican las siguientes no conformidades:
- **Ausencia de límites superiores de versión (Unpinned Upper Bounds):** Todas las declaraciones emplean exclusivamente el operador `>=`. Al no establecer un límite superior (`<3.0.0` para pydantic, `<1.0.0` para httpx), cualquier actualización con incompatibilidades de API (Breaking Changes) romperá de forma imprevista los pipelines de ejecución y cálculo en futuras instalaciones.
- **Inexistencia de archivo Lockfile (`requirements.lock`, `Pipfile.lock`, `poetry.lock`):** No existe ningún mecanismo que garantice que dos despliegues o dos desarrolladores instalen las mismas versiones transitivas exactas de las librerías. Esto anula el principio de reproducibilidad determinista exigido por entornos regulatorios de misión crítica.
- **Mezcla de dependencias de desarrollo y producción:** `pytest>=8.0.0` está declarado en las dependencias generales de ingesta. En un entorno de producción, las herramientas de testing no deben empaquetarse con el runtime de ejecución, debiendo segregarse en un archivo `requirements-dev.txt`.
- **Riesgo por versiones vulnerables permitidas:** `requests>=2.31.0` permite la resolución de versiones con vulnerabilidades de seguridad reportadas en el flujo de redirección de sesiones y filtración de credenciales (CVE-2023-32681, CVE-2024-35195). Debe exigirse como mínimo `requests>=2.32.3`.

### 3.2 Redundancia y Divergencia de Clientes HTTP
Existe una marcada desconexión entre las dependencias declaradas y la implementación real del código:
- Se declaran en `requirements.txt` tanto `requests>=2.31.0` como `httpx>=0.27.0`.
- Sin embargo, una inspección exhaustiva de los conectores (`conector_noaa.py`, `conector_sivicap.py`, `conector_xm_embalses.py`, `conector_ungrd_minvivienda.py`, `conector_ideam.py`, `conector_nasa_firms.py`, `recuperacion.py`) demuestra que **el 85% de la red utiliza la librería estándar `urllib.request`**.
- Esta dualidad genera sobrecarga innecesaria en el entorno virtual, aumenta la superficie de ataque y evidencia falta de un estándar de desarrollo corporativo para las operaciones de red.

### 3.3 Gestión de Librerías Frontend
En la interfaz web (`tablero/js/`), se encuentran copiados manualmente archivos minificados de terceros:
- `tablero/js/leaflet.js` (Leaflet v1.9.4)
- `tablero/js/echarts.min.js` (Apache ECharts 5.x)

**Hallazgo:** El proyecto carece de `package.json`, `package-lock.json` o un empaquetador moderno como Vite o Webpack. La inclusión manual de scripts vendor impide la ejecución de herramientas de escaneo automatizado de vulnerabilidades (`npm audit`, Snyk, Dependabot) y bloquea la actualización automatizada de parches de seguridad en el cliente.

### 3.4 Ausencia de Herramientas de Calidad Estática
No se identificaron dependencias ni herramientas de linters o formateo estático en el entorno de desarrollo:
- No existen dependencias para análisis estático (`ruff`, `flake8`, `pylint`).
- No existe comprobación estática de tipos (`mypy`, `pyright`).
- No existen formateadores deterministas de código (`black`, `isort`).
- No existen escáneres de seguridad estática (`bandit`).
- No existe recolección de cobertura de pruebas (`pytest-cov`).

---

## 4. Dimensión 2: Seguridad, Secretos y Gestión de Red

### 4.1 Desactivación Crítica de Validación SSL/TLS (CWE-295)
En el conector de datos abiertos Socrata de la Superintendencia de Servicios Públicos Domiciliarios (SUI), se identificó una vulnerabilidad crítica de ciberseguridad.

**Ubicación:** `ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:41-43`

```python
# Contexto SSL tolerante a inspección corporativa en redes CRA
self.ssl_context = ssl.create_default_context()
self.ssl_context.check_hostname = False
self.ssl_context.verify_mode = ssl.CERT_NONE
```

#### Análisis Forense del Riesgo:
- **CWE-295 (Improper Certificate Validation):** Al establecer `check_hostname = False` y `verify_mode = ssl.CERT_NONE`, el cliente HTTP de Python acepta cualquier certificado digital presentado por la red, incluyendo certificados autofirmados, expirados, revocados o pertenecientes a dominios completamente distintos.
- **Impacto:** Si un adversario con acceso a la red local, al proveedor de servicios de internet o al proxy institucional intercepta el tráfico, puede suplantar la API de `datos.gov.co` e inyectar registros manipulados de calidad del agua (IRCA) o continuidad del servicio sin que el sistema emita ninguna advertencia de seguridad.
- **Contradicción Regulatoria:** El proyecto ostenta emitir certificaciones de veracidad con hash SHA-256 e inmutabilidad (`AuditorVeracidad`), pero su canal de adquisición de datos crudos tiene desactivada la seguridad criptográfica de transporte.

### 4.2 Omisiones Críticas en `.gitignore` y Riesgo de Fuga de Credenciales
El archivo `.gitignore` en la raíz del repositorio cuenta con apenas 12 líneas y omite patrones esenciales de exclusión:

```text
# .gitignore actual
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
.coverage
htmlcov/
*.tmp
.system_generated/
*.gdoc
*.gsheet
*.gslides
```

**Patrones Ausentes de Alto Riesgo:**
1. **Archivos de variables de entorno:** No se excluyen `.env`, `.env.local`, `.env.*`. Si un desarrollador configura sus credenciales reales en un archivo `.env`, este será registrado en el control de versiones.
2. **Llaves y certificados criptográficos:** No se excluyen `*.pem`, `*.key`, `*.pfx`, `*.crt`.
3. **Entornos virtuales:** No se excluyen `venv/`, `.venv/`, `env/`.
4. **Configuraciones de entornos integrados (IDE):** No se excluyen `.vscode/`, `.idea/`.
5. **Módulos y dependencias de frontend:** No se excluye `node_modules/`.

### 4.3 Inexistencia de Plantilla de Configuración `.env.example`
El código fuente hace referencia explícita a variables de entorno para su operación:
- `FIRMS_MAP_KEY` en `conector_nasa_firms.py:56` y `recuperacion.py:223`.
- `SOCRATA_APP_TOKEN` en `SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:37`.
- `PORT` en `servidor_tablero.py:141`.

No obstante, **no existe el archivo `.env.example` en la raíz del repositorio**. Esto genera barreras de adopción, impide la automatización de despliegues en infraestructura de nube y propicia que los operadores configuren llaves de forma desordenada o las quemen en el código.

### 4.4 Endpoint POST no Autenticado y Ausencia de Protección CSRF (CWE-352)
En el servidor HTTP local que soporta el tablero de control (`servidor_tablero.py`), se implementa un método `do_POST` que atiende peticiones en la ruta `/api/semanal/actualizar`:

**Ubicación:** `servidor_tablero.py:118-133`

```python
def do_POST(self) -> None:  # noqa: N802
    if self.path.split("?")[0] != "/api/semanal/actualizar":
        return self._json(HTTPStatus.NOT_FOUND, {"error": "Ruta no encontrada"})
    try:
        largo = min(int(self.headers.get("Content-Length") or 0), 4096)
        cuerpo = json.loads(self.rfile.read(largo) or b"{}")
    except (ValueError, json.JSONDecodeError):
        return self._json(HTTPStatus.BAD_REQUEST, {"error": "Cuerpo JSON inválido"})
    modo = cuerpo.get("modo", "completo")
    if modo not in ("completo", "recalculo"):
        return self._json(HTTPStatus.BAD_REQUEST, {"error": "modo debe ser 'completo' o 'recalculo'"})
    if not ESTADO.iniciar(modo):
        return self._json(HTTPStatus.CONFLICT, {"error": "Ya hay una actualización en curso", **ESTADO.snapshot()})
    threading.Thread(target=_trabajo, args=(modo,), daemon=True, name=f"actualizacion-{modo}").start()
    return self._json(HTTPStatus.ACCEPTED, ESTADO.snapshot())
```

#### Vulnerabilidades Detectadas:
- **Ausencia de Autenticación:** Cualquier cliente de red capaz de emitir una petición HTTP POST a dicho endpoint puede desencadenar la ejecución pesada en segundo plano de la ingesta y recálculo del modelo.
- **Ausencia de Validación Anti-CSRF (CWE-352):** Aunque el servidor esté enlazado a `127.0.0.1`, una página web maliciosa visitada por el analista regulatorio en su navegador puede enviar peticiones `fetch()` en segundo plano contra `http://localhost:8000/api/semanal/actualizar`, provocando denegación de servicio local (DoS) o consumo de cuotas de red externas.
- **Falta de Validación de Origen (`Origin` / `Referer`):** No se comprueba que la petición provenga del propio dominio o puerto del servidor.

### 4.5 Cabeceras de Seguridad HTTP Deficientes
En `servidor_tablero.py:96-100`, la sobrescritura del método `end_headers` solo configura dos cabeceras básicas:

```python
def end_headers(self) -> None:
    self.send_header("X-Content-Type-Options", "nosniff")
    self.send_header("Referrer-Policy", "same-origin")
    super().end_headers()
```

**Incumplimiento de Especificación:** El documento formal de requisitos no funcionales `context-lake/specs/seguridad-acceso.md` (requisito `RNF-SEG-02`) estipula la implementación estricta de:
- `Content-Security-Policy: default-src 'self' ...` (Totalmente ausente).
- `X-Frame-Options: DENY` (Totalmente ausente; el tablero es vulnerable a ataques de clickjacking si se incrusta en iframes externos).
- `Strict-Transport-Security` (Ausente; el servidor opera exclusivamente sobre HTTP plano sin TLS).

### 4.6 Superficie de XSS en Manipulación de DOM vía `innerHTML` (CWE-79)
Se realizó un escaneo del código JavaScript del tablero web y se identificaron **35 ocurrencias de asignación a `.innerHTML` en `tablero/js/app.js`** y **8 ocurrencias en `tablero/auditoria/js/auditoria.js`**.

**Ejemplo representativo (`tablero/js/app.js:1201` y `1224`):**
```javascript
grid.innerHTML = eslabones.map((esl, idx) => `
    <div class="eslabon-card">
        <h4>${esl.titulo}</h4>
        <p>${esl.descripcion}</p>
    </div>
`).join('');
```

**Riesgo:** Si un texto proveniente de los datos crudos (por ejemplo, el nombre de un municipio, el nombre de un prestador en el catálogo SUI o el texto de un decreto de calamidad de UNGRD) contiene caracteres especiales `<script>` o eventos en línea `onerror=`, este se ejecutará directamente en el contexto del navegador del usuario. Las inserciones en el DOM deben realizarse mediante `textContent` o a través de plantillas con escape estricto de entidades HTML.

### 4.7 Generación Dinámica de Archivos JavaScript con Riesgo de Inyección
En `ingesta/pipeline_corte.py:449`, el pipeline sincroniza los datos calculados con el frontend mediante la concatenación directa de cadenas:

```python
data_js_content = f"// Datos Maestros Integrados — Vigía El Niño · Acueductos\nwindow.VIGIA_DATA = {{ corte: {corte_json_str} }};\n"
tablero_js_dir = self.root_dir / "tablero" / "js"
self._escribir_atomico(tablero_js_dir / "data.js", data_js_content)
```

Si el objeto JSON resultante contiene la cadena `</script>`, y este archivo es cargado dentro de un bloque HTML `<script>`, el navegador cerrará inmediatamente el bloque de ejecución de script y ejecutará cualquier contenido posterior como código HTML/JS arbitrario.

---

## 5. Dimensión 3: Calidad de Código y Análisis Estático

### 5.1 Conectores con Consultas Descartadas y Lectura de Archivos Estáticos
La auditoría funcional del código de ingesta reveló un patrón de diseño inconsistente: conectores que simulan ejecutar llamadas de red pero consumen datos de respaldo estáticos preempaquetados.

#### Caso 1: `conector_ungrd_minvivienda.py`
En las líneas 79-83:
```python
def ejecutar_captura(self) -> CapturaResultado:
    self._consultar_emergencias_socrata()  # <--- Invocada pero el retorno es descartado
    actos_verificados = self._cargar_actos_verificados()
    catalogo_mun = self._cargar_catalogo_municipios()
```
- La función `_consultar_emergencias_socrata()` realiza la petición HTTP a `https://www.datos.gov.co/resource/2343-nuqp.json`, pero su valor de retorno **no se asigna a ninguna variable ni se procesa**.
- El conector lee directamente de `data/config/actos_administrativos_verificados.json` (líneas 44-50), por lo que el sistema siempre reporta exactamente los mismos municipios en calamidad pública sin importar el estado dinámico del país.

#### Caso 2: `conector_ideam.py`
En las líneas 137-140:
```python
def ejecutar_captura(self) -> CapturaResultado:
    municipios_base = self._cargar_catalogo_base()
    self._consultar_estaciones_socrata()  # <--- Invocada pero el retorno es descartado
```
- Se descarta el retorno de la API del IDEAM y los cálculos de anomalía de precipitación, días secos y caudales se toman de `data/config/catalogo_municipios_ideam.json` (líneas 157-163).

#### Caso 3: `conector_sui.py` (Ciclo Bronce sobre Bronce)
En las líneas 43-47 y 156-158:
```python
archivos = sorted(self.sui_bronce_dir.glob("*.json"))
if archivos:
    return json.loads(archivos[-1].read_text(encoding="utf-8"))
...
ruta_archivo = self.guardar_en_bronce(contenido_bytes, "json", hash_sha256)
```
- El conector lee el último archivo JSON existente en `data/bronce/fte_sui/` y vuelve a guardarlo en la misma carpeta `data/bronce/fte_sui/` con un nuevo nombre y timestamp. No consulta la bodega SUI real ni un endpoint externo.

#### Caso 4: `conector_noaa.py` (Constantes Quemadas)
En las líneas 126-127:
```python
"indicador_a2_probabilidad_muy_fuerte_pct": 83.0,
"fecha_boletin_enso": "2026-10-10",
```
- La probabilidad del boletín oficial de NOAA ENSO para el indicador A-2 está fijada estáticamente en `83.0%` con fecha estática `2026-10-10`, sin extraerla del texto oficial del CPC.

### 5.2 Antipatrón de Captura Silente de Excepciones (17 Bloques Detectados)
Se identificaron 17 bloques de captura genérica de excepciones que utilizan `except Exception:` seguido de `pass` o `continue`, sin registrar el error en bitácoras (`logger.error`), sin emitir advertencias y sin relanzar la excepción.

**Listado Exhaustivo de Ubicaciones:**
1. `ingesta/conector_base.py:112` — Falla en limpieza de archivos temporales ignorada.
2. `ingesta/conectores/conector_xm_embalses.py:146` — Falla en extracción de series de tiempo de embalses ignorada con `pass`.
3. `ingesta/conectores/conector_ungrd_minvivienda.py:58` — Falla en lectura de catálogo ignorada con `pass`.
4. `ingesta/conectores/conector_nasa_firms.py:39` — Falla en carga de coordenadas ignorada con `pass`.
5. `ingesta/semanal/modelo_semanal.py:38` — Falla en importación dinámica silenciada.
6. `ingesta/semanal/modelo_semanal.py:330` — Falla en conversión de fechas silenciada con `continue`.
7. `ingesta/semanal/modelo_semanal.py:357` — Falla en cálculo de métricas agregadas silenciada con `pass`.
8. `ingesta/semanal/modelo_semanal.py:378` — Falla en serialización silenciada con `pass`.
9. `ingesta/semanal/modelo_semanal.py:430` — Falla en asignación de alertas silenciada con `pass`.
10. `ingesta/semanal/modelo_semanal.py:881` — Falla en recálculo histórico ignorada con `pass`.
11. `ingesta/semanal/historico.py:58` — Falla en descompresión de datos históricos ignorada con `pass`.
12. `ingesta/historico/recuperacion.py:84` — Error en red de recuperación histórica silenciado con `pass`.
13. `ingesta/historico/recuperacion.py:277` — Error en persistencia de snapshots silenciado con `pass`.
14. `auditoria/auditor_veracidad.py:354` — Error en lectura de hash criptográfico silenciado con `pass`.
15. `auditoria/auditor_veracidad.py:496` — Discrepancia en reconciliación ignorada con `pass`.
16. `auditoria/auditor_veracidad.py:956` — Fallo en validación de reglas de calidad ignorado con `pass`.
17. `auditoria/auditor_veracidad.py:1051` — Fallo en verificación de linaje ignorado con `pass`.

**Impacto Técnico:** Este antipatrón enmascara errores catastróficos en tiempo de ejecución, tales como archivos JSON corruptos, desbordamientos de memoria, errores de permisos en disco o respuestas HTTP truncadas, permitiendo que el sistema continúe procesando datos incompletos o erróneos sin dejar rastro en auditoría.

### 5.3 Duplicación de Lógica de Normalización (Violación del Principio DRY)
El principio *Don't Repeat Yourself* (DRY) es vulnerado sistemáticamente en los algoritmos de normalización de indicadores:
- En `ingesta/conectores/conector_sui.py:53-104`, se definen métodos estáticos para normalizar los indicadores `S-1` (continuidad), `S-3` (cobertura), `S-4` (IANC), `S-5` (PQR) y `H-4` (autonomía de almacenamiento).
- En `ingesta/pipeline_corte.py:240-289`, **se reimplementan exactamente las mismas fórmulas lógicas y quiebres de interpolación lineal en línea**.

Cualquier ajuste regulatorio en las fórmulas de la CRA (por ejemplo, modificación de la resolución de quiebres de continuidad o cambios en los umbrales de IANC) requerirá modificaciones en múltiples archivos dispersos, con alto riesgo de divergencia matemática entre lo que procesa el conector y lo que consolida el pipeline.

### 5.4 Inyección de Números Mágicos de Respaldo (Distorsión de RF-ICR-04)
En `ingesta/pipeline_corte.py:237-295`, cuando una variable municipal no viene informada en los datos crudos, el código inyecta valores arbitrarios fijos por defecto (*fallback magic numbers*):
- Continuidad (`s1_cont`): Se inyecta `24.0` h/día.
- Cobertura (`s3_cob`): Se inyecta `95.0` %.
- IANC (`s4_ianc`): Se inyecta `30.0` %.
- PQR (`s5_pqr`): Se inyecta `20.0` %.
- Autonomía de almacenamiento (`h4_autonomia_h`): Se inyecta `14.0` h.
- Consumo medio (`s6_consumo_m3`): Se inyecta `12.8` m³.
- IRCA (`valor_indicador_s2`): Se inyecta `12.0` puntos.

**Impacto Regulatorio Crítico:** La especificación formal `specs/indice-riesgo.md` en su regla `RF-ICR-04` establece que la ausencia de datos debe registrarse como `None` (`sin_dato`), permitiendo que el sistema calcule la cobertura efectiva de información y clasifique al municipio en estado de alerta o `cobertura_insuficiente` si la ponderación disponible es inferior al 60%. Al inyectar artificialmente valores "óptimos" (como continuidad de 24 horas y cobertura del 95%), el pipeline enmascara el desabastecimiento real de los municipios y asigna puntajes de riesgo artificialmente bajos.

### 5.5 Acoplamiento a Rutas Relativas Frágiles
En `ingesta/cli.py:43`:
```python
archivo_corte = Path("data/oro/corte_vigente.json")
```
La ruta no está anclada al directorio del proyecto (`Path(__file__).resolve().parent.parent`). Si el comando de consola `python -m ingesta.cli estado` se ejecuta desde cualquier carpeta distinta a la raíz (por ejemplo, desde un cronjob en el directorio `/var/spool/cron` o dentro de la carpeta `ingesta/`), la verificación falla con un falso negativo indicando que no existe corte vigente.

### 5.6 Acumulación Descontrolada de Archivos en Disco (Disk Bloat)
En `auditoria/auditor_veracidad.py:1138`:
```python
ts_nombre = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
ruta_ops_historico = self.ops_dir / f"auditoria_corte_{ts_nombre}.json"
```
Cada ejecución individual de la auditoría genera un nuevo archivo inmutable con fecha y segundo en `data/ops/`. En el entorno auditado se encontraron **24 archivos acumulados**, sin que exista ninguna política de rotación, compresión o depuración de logs antiguos. A lo largo de un ciclo operativo anual con capturas diarias o semanales, esto saturará la capacidad de inodos y espacio en disco.

### 5.7 Duplicación de Código y Estructura en Frontend Web
Se identificó una duplicación estructural completa entre los directorios `tablero/auditoria/` y `auditoria/`:
- `tablero/auditoria/index.html` es idéntico a `auditoria/index.html`.
- `tablero/auditoria/auditoria_data.js` es idéntico a `auditoria/auditoria_data.js`.
- `tablero/auditoria/css/auditoria.css` es idéntico a `auditoria/css/auditoria.css`.
- `tablero/auditoria/js/auditoria.js` es idéntico a `auditoria/js/auditoria.js`.

Esta duplicidad provoca inconsistencias visuales y operativas si un mantenedor modifica una versión sin sincronizar la otra.

---

## 6. Dimensión 4: Suite de Pruebas, Cobertura y CI/CD

### 6.1 Ausencia Total de Canal de CI/CD
El repositorio carece por completo de infraestructura de Integración Continua y Despliegue Continuo:
- No existe el directorio `.github/workflows/` con flujos de trabajo automatizados.
- No existen archivos `.gitlab-ci.yml`, Azure Pipelines, ni configuraciones de pre-commit hooks (`.pre-commit-config.yaml`).
- El aseguramiento de calidad depende al 100% de la disciplina voluntaria del desarrollador para ejecutar comandos en su máquina local antes de realizar commits.

### 6.2 Pruebas Unitarias Tautológicas en `test_indice_riesgo.py`
En `ingesta/tests/test_indice_riesgo.py`, se descubrió que 3 de las pruebas unitarias principales destinadas a validar el cálculo del Índice de Capacidad de Respuesta (ICR) son **tautológicas** (se auto-prueban a sí mismas sin ejecutar el código de producción):

**Caso 1 (`test_indice_riesgo.py:14-25`):**
```python
def test_escenario_continuidad_entre_umbrales(pipeline):
    cont = 15.0
    # Tramo 18h (60) a 12h (75) -> Delta=6h, Delta_puntaje=15
    puntaje = round(60.0 + ((18.0 - cont) / 6.0) * 15.0, 2)
    assert puntaje == 67.5
```
*Diagnóstico:* La prueba recibe el fixture `pipeline`, pero **nunca lo utiliza**. Realiza el cálculo aritmético localmente en la función de prueba y verifica que la fórmula escrita en el test dé 67.5. Si la función real de normalización en `pipeline_corte.py` tiene un error grave o devuelve 0, esta prueba seguirá pasando en verde.

**Caso 2 (`test_indice_riesgo.py:27-42`):**
```python
def test_escenario_calamidad_declarada_con_pec_al_dia(pipeline):
    indicadores = { ... }
    puntajes_r = [ind["puntaje"] for ind in indicadores.values() if ind.get("puntaje") is not None]
    subindice_r = max(puntajes_r)
    assert subindice_r == 100.0
```
*Diagnóstico:* No invoca la lógica de consolidación de capa R de `PipelineCorte`. Ejecuta la función `max()` nativa de Python sobre un diccionario local y aserta que el resultado es 100.0.

**Caso 3 (`test_indice_riesgo.py:44-67`):**
```python
def test_escenario_capa_h_sin_datos_redistribucion(pipeline):
    w_disp = 0.30 + 0.25 + 0.15
    assert round(w_disp * 100, 1) == 70.0
    ...
    icr = (70.0 * w_ef_a) + (50.0 * w_ef_s) + (0.0 * w_ef_r)
    assert round(icr, 2) == 47.86
```
*Diagnóstico:* Realiza la redistribución matemática de pesos de forma manual dentro de la prueba. Nunca invoca el método que calcula el ICR en el sistema.

### 6.3 Pruebas Acopladas a Red Externa sin Mocks ni Fixtures
En `ingesta/tests/test_conectores.py:12-27`:
```python
def test_conector_xm_ejecucion():
    conector = ConectorXMEmbalses()
    res = conector.ejecutar()
    assert res.estado in ("exitosa", "sin_cambios")
```
- Las pruebas `test_conector_xm_ejecucion` y `test_conector_ungrd_mvct_ejecucion` ejecutan llamadas directas a internet contra los servidores de XM y UNGRD sin utilizar dobles de prueba (`unittest.mock`, `responses` o `httpx_mock`).
- Si la conexión a internet del servidor de CI falla, si los servidores de XM están en mantenimiento o si el portal `datos.gov.co` tiene intermitencias, la suite de pruebas unitarias colapsa inmediatamente. Las pruebas unitarias deben ser deterministas, aisladas y reproducibles sin red.

### 6.4 Fallas Dinámicas en la Ejecución Real de la Suite de Pruebas
Durante la auditoría dinámica, se ejecutó la suite completa de pruebas mediante el comando `python -m pytest -v`. De 20 pruebas recolectadas, **2 pruebas fallaron rotundamente**:

```text
================================== FAILURES ===================================
____________________ test_auditoria_reconciliacion_fuentes ____________________
auditor = <auditoria.auditor_veracidad.AuditorVeracidad object>
>   ???
E   AssertionError: assert 'CON_DISCREPANCIAS' == 'VERIFICADO_100_PCT'
E     - VERIFICADO_100_PCT
E     + CON_DISCREPANCIAS
ingesta\tests\test_auditoria.py:24: AssertionError

_______________________ test_auditoria_dictamen_oficial _______________________
auditor = <auditoria.auditor_veracidad.AuditorVeracidad object>
>   ???
E   AssertionError: assert 'CON_OBSERVACIONES' == 'CERTIFICADO_FEHACIENTE'
E     - CERTIFICADO_FEHACIENTE
E     + CON_OBSERVACIONES
ingesta\tests\test_auditoria.py:47: AssertionError
======================== 2 failed, 18 passed in 11.36s ========================
```

#### Análisis de la Falla:
- El módulo `AuditorVeracidad` realiza una verificación campo a campo entre los archivos JSON de zona bronce y las zonas plata/oro. Al existir discrepancias reales en los datos versionados en `data/`, el auditor emite el dictamen legítimo `CON_DISCREPANCIAS` y `CON_OBSERVACIONES`.
- No obstante, el archivo de pruebas `test_auditoria.py` asume rígidamente que el sistema siempre debe encontrarse en estado perfecto (`VERIFICADO_100_PCT` y `CERTIFICADO_FEHACIENTE`).
- Esto demuestra que la suite de pruebas no tolera la evolución natural de los datos y se encuentra quebrada en el repositorio actual.

### 6.5 Déficit Crítico de Cobertura en Conectores
De los 7 conectores de datos implementados en el sistema, **5 carecen por completo de pruebas unitarias**:
1. `ConectorNOAA` (Sin pruebas)
2. `ConectorIDEAM` (Sin pruebas)
3. `ConectorNASAFIRMS` (Sin pruebas)
4. `ConectorSIVICAP` (Sin pruebas)
5. `ConectorSUI` (Sin pruebas)

---

## 7. Dimensión 5: Documentación y Gestión del Repositorio

### 7.1 Ausencia de `README.md` en la Raíz del Proyecto
La raíz del repositorio carece completamente de un archivo `README.md`. No existe documentación oficial inicial que detalle:
- Resumen y objetivo del proyecto ante la regulación de la CRA.
- Requisitos previos del sistema (versión de Python, librerías del sistema).
- Instrucciones paso a paso para la creación del entorno virtual e instalación de dependencias.
- Configuración de variables de entorno requeridas.
- Comandos para la ejecución de ingesta, cálculo del corte y servidor web.
- Instrucciones de ejecución y verificación de pruebas unitarias.

### 7.2 Contaminación de Git con 305 Archivos Operativos de Datos
La inspección de los archivos versionados mediante `git ls-files data/` reveló que **existen 305 archivos operativos rastreados activamente en el historial del repositorio**.
- Se incluyen archivos JSON en `data/bronce/`, `data/plata/`, `data/oro/` y logs en `data/ops/`.
- **Impacto:** Esta práctica desvirtúa el propósito del sistema de control de versiones Git, generando un tamaño excesivo del repositorio (bloat), conflictos recurrentes de fusión (*merge conflicts*) en ramas de desarrollo y mezclando el ciclo de vida del código fuente con la persistencia volátil del lago de datos.

---

## 8. Matriz Consolidada de 20 Hallazgos Técnicos Estructurados

A continuación se detalla la matriz exhaustiva de los 20 hallazgos identificados, clasificados por severidad, con su respectiva ficha técnica, impacto y código concreto de remediación.

---

### Ficha Técnica SEC-01: Desactivación Explícita de Validación SSL/TLS (CWE-295)
- **ID:** `SEC-01`
- **Severidad:** **CRÍTICA**
- **Categoría:** Ciberseguridad / Gestión de Red
- **Archivo y Línea:** `ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py:41-43`
- **Descripción del Problema:**
  El conector a datos abiertos Socrata desactiva la validación de certificados y la verificación de identidad del host:
  ```python
  self.ssl_context = ssl.create_default_context()
  self.ssl_context.check_hostname = False
  self.ssl_context.verify_mode = ssl.CERT_NONE
  ```
- **Impacto Técnico y Regulatorio:**
  Permite ataques de intermediario (Man-in-the-Middle - MitM). Un adversario en la red puede interceptar el tráfico de `datos.gov.co` y suministrar datos falsificados de calidad de agua o cobertura municipal, comprometiendo las decisiones regulatorias de la CRA.
- **Recomendación Concreta de Remediación:**
  Restablecer la verificación estricta de certificados TLS. Si la red corporativa de la CRA utiliza inspección SSL con una Autoridad Certificadora (CA) privada institucional, debe parametrizarse la ruta al certificado de confianza mediante `ssl_context.load_verify_locations()` sin relajar la verificación global.
  ```python
  # Remediación propuesta en SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py
  self.ssl_context = ssl.create_default_context()
  ca_bundle = os.environ.get("CRA_CA_BUNDLE_PATH")
  if ca_bundle and os.path.exists(ca_bundle):
      self.ssl_context.load_verify_locations(cafile=ca_bundle)
  self.ssl_context.check_hostname = True
  self.ssl_context.verify_mode = ssl.CERT_REQUIRED
  ```

---

### Ficha Técnica SEC-02: Omisión de Reglas Críticas en `.gitignore`
- **ID:** `SEC-02`
- **Severidad:** **ALTA**
- **Categoría:** Ciberseguridad / Control de Versiones
- **Archivo y Línea:** `.gitignore:1-12`
- **Descripción del Problema:**
  El archivo `.gitignore` omite la exclusión de secretos locales (`.env`), llaves privadas (`*.pem`, `*.key`), entornos virtuales (`venv/`, `.venv/`), directorios de configuración de IDEs (`.vscode/`, `.idea/`) y dependencias frontend (`node_modules/`).
- **Impacto Técnico:**
  Riesgo inminente de filtración de credenciales reales (`FIRMS_MAP_KEY`, `SOCRATA_APP_TOKEN`) en el repositorio público o compartido de Git.
- **Recomendación Concreta de Remediación:**
  Actualizar el archivo `.gitignore` con los patrones recomendados por OWASP y Python Software Foundation:
  ```gitignore
  # Remediación propuesta en .gitignore
  .env
  .env.*
  *.pem
  *.key
  *.pfx
  *.crt
  venv/
  .venv/
  env/
  .vscode/
  .idea/
  node_modules/
  dist/
  build/
  *.log
  ```

---

### Ficha Técnica SEC-03: Endpoint POST sin Autenticación ni Protección CSRF (CWE-352)
- **ID:** `SEC-03`
- **Severidad:** **ALTA**
- **Categoría:** Ciberseguridad / Arquitectura Web
- **Archivo y Línea:** `servidor_tablero.py:118-133`
- **Descripción del Problema:**
  El endpoint `/api/semanal/actualizar` acepta peticiones HTTP POST y dispara hilos de ejecución intensiva de cálculo sin verificar token de autorización, clave de acceso local, origen (`Origin` / `Referer`) ni token anti-CSRF.
- **Impacto Técnico:**
  Permite que cualquier script en un navegador local o cliente de red dispare procesos pesados en bucle, provocando agotamiento de recursos del sistema (Denegación de Servicio local) y sobreconsumo de cuotas de APIs gubernamentales externas.
- **Recomendación Concreta de Remediación:**
  Implementar la validación de un token de autorización en la cabecera `Authorization` o `X-Vigia-Auth-Token` configurado en el archivo `.env`, así como la validación estricta de la cabecera `Origin` o `Host`:
  ```python
  # Remediación propuesta en servidor_tablero.py:118
  token_esperado = os.environ.get("VIGIA_ADMIN_TOKEN")
  token_recibido = self.headers.get("X-Vigia-Auth-Token")
  if token_esperado and token_recibido != token_esperado:
      return self._json(HTTPStatus.UNAUTHORIZED, {"error": "No autorizado"})
  
  origen = self.headers.get("Origin") or self.headers.get("Referer")
  if origen and not (origen.startswith("http://localhost") or origen.startswith("http://127.0.0.1")):
      return self._json(HTTPStatus.FORBIDDEN, {"error": "Origen no permitido (CSRF blocked)"})
  ```

---

### Ficha Técnica SEC-04: Vulnerabilidad de Cross-Site Scripting (XSS basado en DOM - CWE-79)
- **ID:** `SEC-04`
- **Severidad:** **ALTA**
- **Categoría:** Ciberseguridad / Frontend
- **Archivo y Línea:** `tablero/js/app.js` (35 ocurrencias) y `tablero/auditoria/js/auditoria.js` (8 ocurrencias)
- **Descripción del Problema:**
  Se concatenan cadenas de texto procedentes de los datos y metadatos JSON directamente en la propiedad `innerHTML` de elementos del DOM sin escape ni sanitización de caracteres HTML.
- **Impacto Técnico:**
  Si un adversario logra inyectar código en las descripciones de fuentes o catálogos externos, este se ejecutará en la sesión del usuario del tablero, habilitando robo de información de sesión o desfiguración de la interfaz.
- **Recomendación Concreta de Remediación:**
  Crear una función utilitaria de escape HTML y aplicarla a todos los campos dinámicos antes de la interpolación de cadenas, o preferir el uso de `textContent` / `createElement`:
  ```javascript
  // Remediación propuesta en tablero/js/app.js
  function escaparHtml(str) {
      if (!str) return '';
      return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
  }
  // Uso: `<h4>${escaparHtml(esl.titulo)}</h4><p>${escaparHtml(esl.descripcion)}</p>`
  ```

---

### Ficha Técnica TST-01: Pruebas Unitarias Tautológicas en el Cálculo del ICR
- **ID:** `TST-01`
- **Severidad:** **ALTA**
- **Categoría:** Calidad de Pruebas / Aseguramiento de Software
- **Archivo y Línea:** `ingesta/tests/test_indice_riesgo.py:14-68`
- **Descripción del Problema:**
  Las pruebas unitarias `test_escenario_continuidad_entre_umbrales`, `test_escenario_calamidad_declarada_con_pec_al_dia` y `test_escenario_capa_h_sin_datos_redistribucion` realizan operaciones matemáticas dentro de la misma función de prueba sin llamar a los métodos reales de `PipelineCorte`.
- **Impacto Técnico:**
  Las pruebas siempre pasan al 100% independientemente de si la lógica de negocio de producción contiene errores graves, generando una falsa sensación de confiabilidad técnica.
- **Recomendación Concreta de Remediación:**
  Refactorizar la suite para invocar directamente los métodos de normalización y el motor de cálculo del pipeline de producción:
  ```python
  # Remediación propuesta en test_indice_riesgo.py
  def test_escenario_continuidad_entre_umbrales(pipeline):
      # Probar el método real de normalización de producción
      puntaje = pipeline.normalizar_s1_continuidad(15.0)
      assert puntaje == 67.5

  def test_escenario_calamidad_declarada_con_pec_al_dia(pipeline):
      # Invocar la función real de consolidación de Capa R
      subindice_r = pipeline.calcular_subindice_capa_r(r1=1, r2=None, r3=0, r4=1)
      assert subindice_r == 100.0
  ```

---

### Ficha Técnica TST-02: Pruebas Unitarias Acopladas a Red Externa sin Aislamiento (Mocks)
- **ID:** `TST-02`
- **Severidad:** **ALTA**
- **Categoría:** Calidad de Pruebas / Aislamiento
- **Archivo y Línea:** `ingesta/tests/test_conectores.py:12-27`
- **Descripción del Problema:**
  Las pruebas de conectores ejecutan instancias reales que realizan solicitudes HTTP contra los servidores externos de XM y UNGRD sin utilizar herramientas de intercepción ni mocks.
- **Impacto Técnico:**
  Las pruebas no son deterministas. Caídas de red, mantenimiento de portales gubernamentales o variaciones en los datos en vivo provocan falsos positivos y fallos inesperados en la suite de pruebas.
- **Recomendación Concreta de Remediación:**
  Aislar las pruebas unitarias mediante `unittest.mock.patch` o `pytest-mock`, simulando respuestas HTTP controladas:
  ```python
  # Remediación propuesta en test_conectores.py
  from unittest.mock import patch, MagicMock

  @patch("urllib.request.urlopen")
  def test_conector_xm_ejecucion_con_mock(mock_urlopen):
      mock_response = MagicMock()
      mock_response.read.return_value = b'{"mock_data": 123}'
      mock_response.__enter__.return_value = mock_response
      mock_urlopen.return_value = mock_response
      
      conector = ConectorXMEmbalses()
      res = conector.ejecutar()
      assert res.estado == "exitosa"
  ```

---

### Ficha Técnica CICD-01: Inexistencia Total de Canal de CI/CD
- **ID:** `CICD-01`
- **Severidad:** **ALTA**
- **Categoría:** DevOps / Automatización
- **Archivo y Línea:** Raíz del repositorio (Inexistencia de `.github/workflows/`)
- **Descripción del Problema:**
  No existe ningún archivo de configuración de integración continua en el repositorio para automatizar la ejecución de pruebas, análisis de seguridad y revisión de calidad de código en cada confirmación o solicitud de extracción (*pull request*).
- **Impacto Técnico:**
  El código con regresiones, fallos de sintaxis o vulnerabilidades puede ser integrado a las ramas principales sin detección previa.
- **Recomendación Concreta de Remediación:**
  Crear el flujo de GitHub Actions `.github/workflows/ci.yml` que instale dependencias en un entorno limpio, ejecute `pytest`, linters (`ruff`) y verificación de tipos (`mypy`):
  ```yaml
  # Remediación propuesta en .github/workflows/ci.yml
  name: Integración Continua Vigía CRA
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - name: Configurar Python
          uses: actions/setup-python@v5
          with:
            python-version: '3.12'
        - name: Instalar Dependencias
          run: |
            python -m pip install --upgrade pip
            pip install -r ingesta/requirements.txt pytest-mock ruff
        - name: Linter con Ruff
          run: ruff check .
        - name: Ejecutar Pruebas Automatizadas
          run: pytest -v
  ```

---

### Ficha Técnica COD-01: Conectores que Descartan Consultas HTTP y Leen JSONs Estáticos
- **ID:** `COD-01`
- **Severidad:** **ALTA**
- **Categoría:** Calidad de Código / Integridad de Datos
- **Archivo y Línea:** `ingesta/conectores/conector_ungrd_minvivienda.py:80` y `conector_ideam.py:139`
- **Descripción del Problema:**
  Se ejecutan las llamadas `self._consultar_emergencias_socrata()` y `self._consultar_estaciones_socrata()`, pero el valor retornado no se procesa ni se almacena. Los datos reales se extraen exclusivamente de archivos de configuración estáticos locales (`data/config/`).
- **Impacto Técnico:**
  El pipeline no realiza ingestión dinámica de emergencias ni de variables meteorológicas. El sistema opera sobre datos congelados simulados, incumpliendo su promesa de monitoreo dinámico continuo.
- **Recomendación Concreta de Remediación:**
  Procesar e integrar el payload JSON recibido de las APIs en vivo. Diseñar el archivo de configuración únicamente como respaldo de emergencia (*fallback*) condicionado a que la consulta externa falle:
  ```python
  # Remediación propuesta en conector_ungrd_minvivienda.py:80
  datos_socrata = self._consultar_emergencias_socrata()
  if datos_socrata:
      # Procesar y mapear los eventos reales por DIVIPOLA
      capa_r_por_divipola = self._procesar_emergencias_vivas(datos_socrata)
  else:
      logger.warning("Fallo en consulta externa Socrata UNGRD; aplicando respaldo verificado.")
      capa_r_por_divipola = self._procesar_desde_respaldo()
  ```

---

### Ficha Técnica DEP-01: Dependencias sin Límites Superiores, sin Lockfile y Mezcla de Dev/Prod
- **ID:** `DEP-01`
- **Severidad:** **MEDIA**
- **Categoría:** Gestión de Dependencias
- **Archivo y Línea:** `ingesta/requirements.txt:1-7`
- **Descripción del Problema:**
  Dependencias declaradas únicamente con `>=`, ausencia de archivo de bloqueo determinista (`lockfile`) y presencia de paquetes de testing (`pytest`) en el archivo productivo.
- **Impacto Técnico:**
  Riesgo de fallas imprevistas en builds futuros por cambios de versión mayor incompatibles (Breaking Changes) y falta de reproducibilidad en despliegues.
- **Recomendación Concreta de Remediación:**
  Segregar en `requirements.txt` y `requirements-dev.txt`, acotar versiones superiores con `<` y generar `requirements.lock` mediante `pip-compile` (`pip-tools`):
  ```text
  # requirements.txt
  httpx>=0.27.0,<0.28.0
  requests>=2.32.3,<3.0.0
  pydantic>=2.8.0,<3.0.0
  pyyaml>=6.0.1,<7.0.0
  openpyxl>=3.1.2,<4.0.0
  ```
  ```text
  # requirements-dev.txt
  -r requirements.txt
  pytest>=8.0.0,<9.0.0
  pytest-mock>=3.12.0
  ruff>=0.4.0
  mypy>=1.10.0
  ```

---

### Ficha Técnica DEP-02: Redundancia y Divergencia de Clientes HTTP
- **ID:** `DEP-02`
- **Severidad:** **MEDIA**
- **Categoría:** Gestión de Dependencias / Arquitectura
- **Archivo y Línea:** `ingesta/requirements.txt:2-3` vs Conectores de ingesta
- **Descripción del Problema:**
  Se declaran simultáneamente `requests` y `httpx`, pero el 85% de los conectores utiliza la librería estándar `urllib.request`.
- **Impacto Técnico:**
  Sobrecarga del entorno con paquetes no utilizados e inconsistencia en patrones de comunicación HTTP (manejo de timeouts, reintentos y sesiones).
- **Recomendación Concreta de Remediación:**
  Estandarizar todas las llamadas de red del proyecto en un único cliente robusto (preferiblemente `httpx` por su compatibilidad síncrona/asíncrona y soporte nativo HTTP/2) y eliminar `requests` y el uso directo de `urllib.request`.

---

### Ficha Técnica DEP-03: Librerías Frontend sin Gestor de Paquetes
- **ID:** `DEP-03`
- **Severidad:** **MEDIA**
- **Categoría:** Gestión de Dependencias / Frontend
- **Archivo y Línea:** `tablero/js/leaflet.js`, `tablero/js/echarts.min.js`
- **Descripción del Problema:**
  Archivos minificados de librerías de terceros copiados manualmente en el repositorio sin `package.json` ni control de versiones formal.
- **Impacto Técnico:**
  Imposibilidad de auditar vulnerabilidades en frontend mediante herramientas automatizadas (`npm audit`) y dificultad para aplicar parches de seguridad.
- **Recomendación Concreta de Remediación:**
  Inicializar un proyecto frontend estándar con `npm` / `package.json` y empaquetador Vite, permitiendo la gestión moderna y auditada de librerías JavaScript.

---

### Ficha Técnica SEC-05: Cabeceras de Seguridad HTTP Deficientes en el Servidor Web
- **ID:** `SEC-05`
- **Severidad:** **MEDIA**
- **Categoría:** Ciberseguridad / Servidor Web
- **Archivo y Línea:** `servidor_tablero.py:96-100`
- **Descripción del Problema:**
  El servidor no emite cabeceras de Content Security Policy (CSP) ni `X-Frame-Options: DENY`, incumpliendo la especificación formal `RNF-SEG-02`.
- **Impacto Técnico:**
  Vulnerabilidad a ataques de clickjacking y falta de restricciones sobre orígenes de scripts e imágenes.
- **Recomendación Concreta de Remediación:**
  Configurar cabeceras de protección en `end_headers`:
  ```python
  # Remediación propuesta en servidor_tablero.py:96
  def end_headers(self) -> None:
      self.send_header("X-Content-Type-Options", "nosniff")
      self.send_header("X-Frame-Options", "DENY")
      self.send_header("Referrer-Policy", "same-origin")
      self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;")
      super().end_headers()
  ```

---

### Ficha Técnica SEC-06: Inexistencia de Plantilla `.env.example`
- **ID:** `SEC-06`
- **Severidad:** **MEDIA**
- **Categoría:** Ciberseguridad / Configuración
- **Archivo y Línea:** Raíz del repositorio
- **Descripción del Problema:**
  No existe archivo `.env.example` que documente las variables requeridas y opcionales del sistema (`FIRMS_MAP_KEY`, `SOCRATA_APP_TOKEN`, etc.).
- **Impacto Técnico:**
  Dificulta la instalación y configuración segura del proyecto, propiciando errores humanos y quemado de llaves en el código.
- **Recomendación Concreta de Remediación:**
  Crear el archivo `.env.example` en la raíz con descripciones claras y valores de ejemplo neutrales.

---

### Ficha Técnica COD-02: Antipatrón de Captura Silente de Excepciones (17 Bloques)
- **ID:** `COD-02`
- **Severidad:** **MEDIA**
- **Categoría:** Calidad de Código / Robustez
- **Archivo y Línea:** 17 ubicaciones (`conector_base.py:112`, `conector_xm_embalses.py:146`, `conector_ungrd_minvivienda.py:58`, etc.)
- **Descripción del Problema:**
  Captura de `Exception` con `pass` o `continue` sin registrar bitácoras ni propagar el error.
- **Impacto Técnico:**
  Ocultamiento de fallas catastróficas de I/O, deserialización o permisos, corrompiendo silenciosamente el flujo de datos.
- **Recomendación Concreta de Remediación:**
  Reemplazar con excepciones específicas (`FileNotFoundError`, `json.JSONDecodeError`) e incluir llamadas obligatorias a `logger.error(..., exc_info=True)`.

---

### Ficha Técnica COD-03: Duplicación de Lógica de Normalización (Violación del Principio DRY)
- **ID:** `COD-03`
- **Severidad:** **MEDIA**
- **Categoría:** Calidad de Código / Mantenibilidad
- **Archivo y Línea:** `ingesta/pipeline_corte.py:240-289` vs `conector_sui.py:53-104`
- **Descripción del Problema:**
  Las fórmulas de normalización para `S-1`, `S-3`, `S-4`, `S-5` y `H-4` están duplicadas idénticamente en dos archivos independientes.
- **Impacto Técnico:**
  Alto riesgo de divergencia matemática entre componentes cuando la regulación modifique umbrales o quiebres.
- **Recomendación Concreta de Remediación:**
  Centralizar todas las funciones de normalización en un módulo único `ingesta.normalizadores` e importarlo tanto en los conectores como en el pipeline de corte.

---

### Ficha Técnica COD-04: Inyección de Números Mágicos de Respaldo que Falsean RF-ICR-04
- **ID:** `COD-04`
- **Severidad:** **MEDIA**
- **Categoría:** Integridad de Datos / Reglas de Negocio
- **Archivo y Línea:** `ingesta/pipeline_corte.py:237-295`
- **Descripción del Problema:**
  Cuando un municipio no reporta un indicador, se inyectan valores fijos por defecto (ej. continuidad 24h, cobertura 95%) en lugar de asignar `None`.
- **Impacto Técnico:**
  Enmascara la falta de datos municipales, anulando el mecanismo regulatorio de detección de insuficiencia de información (`RF-ICR-04`).
- **Recomendación Concreta de Remediación:**
  Asignar estrictamente `None` ante la ausencia de dato crudo, permitiendo que el motor de calidad compute la cobertura real del municipio y active las alertas de vacíos de información.

---

### Ficha Técnica COD-05: Acoplamiento a Rutas Relativas no Resueltas
- **ID:** `COD-05`
- **Severidad:** **MEDIA**
- **Categoría:** Calidad de Código / Portabilidad
- **Archivo y Línea:** `ingesta/cli.py:43`
- **Descripción del Problema:**
  Uso de `Path("data/oro/corte_vigente.json")` relativo al directorio de trabajo actual (`cwd`).
- **Impacto Técnico:**
  Falla de ejecución con falsos negativos cuando el CLI se invoca desde scripts automatizados o directorios secundarios.
- **Recomendación Concreta de Remediación:**
  Anclar todas las rutas a la raíz del repositorio mediante `Path(__file__).resolve().parents[1] / "data" / ...`.

---

### Ficha Técnica TST-03: Déficit Crítico de Cobertura en Conectores
- **ID:** `TST-03`
- **Severidad:** **MEDIA**
- **Categoría:** Calidad de Pruebas / Cobertura
- **Archivo y Línea:** `ingesta/tests/test_conectores.py`
- **Descripción del Problema:**
  5 de los 7 conectores carecen totalmente de pruebas unitarias automatizadas (`ConectorNOAA`, `ConectorIDEAM`, `ConectorNASAFIRMS`, `ConectorSIVICAP`, `ConectorSUI`).
- **Impacto Técnico:**
  Cualquier fallo de parsing o cambio en esquemas de estos 5 conectores pasará inadvertido.
- **Recomendación Concreta de Remediación:**
  Crear suites de pruebas unitarias con datos de prueba (*fixtures*) en formato JSON para cada uno de los 5 conectores restantes.

---

### Ficha Técnica TST-04: Pruebas Acopladas a Cardinalidades Estáticas y Fallo en Ejecución Real
- **ID:** `TST-04`
- **Severidad:** **MEDIA**
- **Categoría:** Calidad de Pruebas / Robustez
- **Archivo y Línea:** `ingesta/tests/test_auditoria.py:18, 27`
- **Descripción del Problema:**
  Aserciones fijas contra números mágicos (`assert res["archivos_evaluados"] >= 18`, `assert res["total_comparaciones"] == 460`). Falla en ejecución dinámica (`CON_DISCREPANCIAS` vs `VERIFICADO_100_PCT`).
- **Impacto Técnico:**
  La suite de pruebas se rompe legítimamente cuando los datos del repositorio evolucionan.
- **Recomendación Concreta de Remediación:**
  Parametrizar las aserciones para verificar consistencia lógica porcentual sobre los archivos presentes, desacoplándolas de cardinalidades estáticas.

---

### Ficha Técnica DOC-01: Ausencia de `README.md` en la Raíz del Proyecto
- **ID:** `DOC-01`
- **Severidad:** **MEDIA**
- **Categoría:** Documentación / Operabilidad
- **Archivo y Línea:** Raíz del repositorio
- **Descripción del Problema:**
  Inexistencia de archivo `README.md` maestro con instrucciones de instalación, ejecución y pruebas.
- **Impacto Técnico:**
  Impide el despliegue eficiente y la transferencia de conocimiento técnico a los equipos de la CRA.
- **Recomendación Concreta de Remediación:**
  Redactar un `README.md` exhaustivo y profesional que documente la arquitectura, variables de entorno, guías de arranque del servidor y ejecución de la suite de pruebas.

---

### Ficha Técnica REP-01: Contaminación de Git con 305 Archivos Operativos de Datos
- **ID:** `REP-01`
- **Severidad:** **MEDIA**
- **Categoría:** Control de Versiones / Gestión de Lago de Datos
- **Archivo y Línea:** Directorio `data/` (305 archivos versionados)
- **Descripción del Problema:**
  Versionamiento activo en Git de archivos crudos, procesados y reportes históricos de auditoría.
- **Impacto Técnico:**
  Inflado del repositorio (bloat), conflictos recurrentes de mezcla y mezcla inapropiada entre código fuente y datos operativos.
- **Recomendación Concreta de Remediación:**
  Excluir el directorio `data/` en `.gitignore` (preservando únicamente un directorio de semillas `data/seed/`) y migrar la persistencia a almacenamiento de objetos (AWS S3, Google Cloud Storage o MinIO local).

---

### Ficha Técnica COD-06: Acumulación Descontrolada de Archivos en Disco (Disk Bloat en `data/ops`)
- **ID:** `COD-06`
- **Severidad:** **BAJA**
- **Categoría:** Calidad de Código / Operación
- **Archivo y Línea:** `auditoria/auditor_veracidad.py:1138`
- **Descripción del Problema:**
  Generación continua de archivos con segundo exacto en `data/ops/auditoria_corte_*.json` sin política de retención.
- **Impacto Técnico:**
  Saturación progresiva del sistema de archivos en servidores de producción a largo plazo.
- **Recomendación Concreta de Remediación:**
  Implementar una función de rotación que conserve únicamente las últimas N auditorías (e.g. últimos 30 cortes) y elimine automáticamente las anteriores.

---

### Ficha Técnica COD-07: Duplicación Completa de Código en Frontend de Auditoría
- **ID:** `COD-07`
- **Severidad:** **BAJA**
- **Categoría:** Calidad de Código / Estructura de Proyecto
- **Archivo y Línea:** `tablero/auditoria/` vs `auditoria/`
- **Descripción del Problema:**
  Duplicación exacta de archivos HTML, CSS y JS entre dos directorios del proyecto.
- **Impacto Técnico:**
  Sobrecarga de mantenimiento y riesgo de divergencias en correcciones de interfaz.
- **Recomendación Concreta de Remediación:**
  Eliminar la carpeta duplicada `tablero/auditoria/` y configurar el servidor web en `servidor_tablero.py` para enrutar `/auditoria/` directamente a la carpeta fuente original `auditoria/`.

---

## 9. Plan Priorizado de Remediación por Fases

Para subsanar las 20 deficiencias identificadas de manera metódica y minimizar el riesgo de regresiones operativas, se define un plan de remediación estructurado en tres fases secuenciales:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FASE 1: INMEDIATA / SEGURIDAD Y ESTABILIDAD CRÍTICA (Semanas 1 y 2)         │
│ • Cierre de vulnerabilidades de ciberseguridad y aislamiento de pruebas     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 2: ROBUSTEZ, CALIDAD DE CÓDIGO E INTEGRIDAD DE DATOS (Semanas 3 y 4)   │
│ • Corrección de conectores reales, eliminación de magic numbers y DRY       │
├─────────────────────────────────────────────────────────────────────────────┤
│ FASE 3: INDUSTRIALIZACIÓN, CI/CD Y MANTENIBILIDAD (Semanas 5 y 6)           │
│ • Automatización de pipelines, gestión de dependencias y limpieza de Git    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Fase 1: Inmediata / Seguridad y Estabilidad Crítica (Semanas 1 - 2)
El objetivo primordial de esta fase es cerrar brechas de seguridad explotables y estabilizar el entorno básico de ejecución.

| Hallazgo ID | Acción Técnica de Remediación | Entregable / Archivo Modificado |
|---|---|---|
| **SEC-01** | Habilitar la verificación estricta de TLS en `SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py`, eliminando `CERT_NONE` y `check_hostname = False`. | `ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py` |
| **SEC-02** | Incorporar reglas de exclusión para `.env`, llaves criptográficas, venvs e IDEs en `.gitignore`. | `.gitignore` |
| **SEC-03** | Proteger el endpoint `/api/semanal/actualizar` con token secreto de administración y verificación de origen anti-CSRF. | `servidor_tablero.py` |
| **SEC-04** | Implementar función `escaparHtml()` en JavaScript y reemplazar concatenaciones directas en `innerHTML`. | `tablero/js/app.js`, `auditoria.js` |
| **SEC-06** | Crear la plantilla `.env.example` con la especificación de tokens y puertos. | `.env.example` |
| **TST-01** | Refactorizar las pruebas de `test_indice_riesgo.py` para invocar directamente los métodos de `PipelineCorte`. | `ingesta/tests/test_indice_riesgo.py` |
| **TST-02** | Introducir mocks con `unittest.mock` en `test_conectores.py` para aislar las pruebas de la red externa. | `ingesta/tests/test_conectores.py` |

### 9.2 Fase 2: Robustez, Calidad de Código e Integridad de Datos (Semanas 3 - 4)
El objetivo de esta fase es asegurar que los datos calculados reflejen la realidad operativa de los municipios y eliminar vicios de arquitectura.

| Hallazgo ID | Acción Técnica de Remediación | Entregable / Archivo Modificado |
|---|---|---|
| **COD-01** | Integrar el procesamiento dinámico del payload Socrata en UNGRD e IDEAM, dejando los JSON de configuración solo como respaldo documentado. | `conector_ungrd_minvivienda.py`, `conector_ideam.py` |
| **COD-04** | Preservar `None` ante la ausencia de dato crudo en el pipeline, permitiendo que la regla `RF-ICR-04` evalúe la cobertura real de información. | `ingesta/pipeline_corte.py` |
| **COD-03** | Extraer las fórmulas de normalización a un módulo centralizado `ingesta/normalizadores.py` (Principio DRY). | `ingesta/normalizadores.py`, `conector_sui.py`, `pipeline_corte.py` |
| **COD-02** | Reemplazar los 17 bloques de captura silente de excepciones por excepciones tipadas con registro obligatorio en `logger.error`. | 17 archivos afectados |
| **COD-05** | Anclar las rutas de archivo al directorio raíz del proyecto con `Path(__file__).resolve()`. | `ingesta/cli.py` |
| **COD-06** | Implementar rotación automática en `AuditorVeracidad` conservando solo los últimos 30 reportes históricos en `data/ops/`. | `auditoria/auditor_veracidad.py` |
| **COD-07** | Eliminar la carpeta redundante `tablero/auditoria/` y servir los archivos desde `auditoria/`. | `tablero/auditoria/`, `servidor_tablero.py` |
| **SEC-05** | Agregar cabeceras `Content-Security-Policy` y `X-Frame-Options: DENY` en el servidor web. | `servidor_tablero.py` |

### 9.3 Fase 3: Industrialización, CI/CD y Mantenibilidad Continua (Semanas 5 - 6)
El objetivo de esta fase es alcanzar los estándares de madurez técnica necesarios para una operación institucional continua.

| Hallazgo ID | Acción Técnica de Remediación | Entregable / Archivo Modificado |
|---|---|---|
| **CICD-01** | Diseñar y desplegar el pipeline de integración continua con GitHub Actions (`ci.yml`) ejecutando linters y pruebas. | `.github/workflows/ci.yml` |
| **DEP-01** | Fijar límites superiores de versión en `requirements.txt`, segregar `requirements-dev.txt` y compilar `requirements.lock`. | `ingesta/requirements.txt`, `requirements.lock` |
| **DEP-02** | Estandarizar la comunicación de red en `httpx`, eliminando `requests` y llamadas directas a `urllib.request`. | Todos los conectores de ingesta |
| **DEP-03** | Crear `package.json` para gestionar librerías cliente (Leaflet, ECharts) mediante npm y empaquetador Vite. | `package.json`, `package-lock.json` |
| **TST-03** | Desarrollar pruebas unitarias completas con fixtures para los 5 conectores faltantes (NOAA, IDEAM, NASA, SIVICAP, SUI). | `ingesta/tests/test_conectores.py` |
| **TST-04** | Parametrizar las pruebas de auditoría para validar consistencia lógica desacoplada de cantidades fijas de archivos. | `ingesta/tests/test_auditoria.py` |
| **REP-01** | Migrar los 305 archivos de datos fuera de Git hacia almacenamiento de objetos o Git LFS, dejando solo `data/seed/`. | `.gitignore`, historial de Git |
| **DOC-01** | Redactar el archivo `README.md` institucional en la raíz del repositorio. | `README.md` |

---

## 10. Guía de Verificación Técnica y Reproducción

Para permitir la verificación independiente por parte de auditores forenses, equipos de QA o interventoría técnica, a continuación se detallan los comandos de PowerShell para reproducir de forma directa los hallazgos reportados.

### 10.1 Verificación de la Vulnerabilidad SSL/TLS (SEC-01)
```powershell
Select-String -Path "ingesta\queries_sui\SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py" -Pattern "(CERT_NONE|check_hostname)"
```
*Evidencia esperada:* Salida que muestra las líneas 42 y 43 con `check_hostname = False` y `verify_mode = ssl.CERT_NONE`.

### 10.2 Verificación de Pruebas Tautológicas (TST-01)
```powershell
Get-Content -Path "ingesta\tests\test_indice_riesgo.py" | Select-Object -Index (13..25)
```
*Evidencia esperada:* La prueba `test_escenario_continuidad_entre_umbrales` no ejecuta ningún método de `pipeline`, sino que calcula localmente `puntaje = round(...)`.

### 10.3 Verificación de Conectores Descartando Consultas HTTP (COD-01)
```powershell
Select-String -Path "ingesta\conectores\conector_ungrd_minvivienda.py" -Pattern "(_consultar_emergencias_socrata|actos_administrativos_verificados\.json)"
Select-String -Path "ingesta\conectores\conector_ideam.py" -Pattern "(_consultar_estaciones_socrata|catalogo_municipios_ideam\.json)"
```
*Evidencia esperada:* Las funciones de consulta a Socrata se invocan en vacío sin asignar su retorno, y los datos se cargan desde archivos JSON estáticos en `data/config/`.

### 10.4 Verificación de Fallas en Suite de Pruebas (TST-04)
```powershell
python -m pytest -v ingesta/tests/test_auditoria.py
```
*Evidencia esperada:* Dos fallos con `AssertionError: assert 'CON_DISCREPANCIAS' == 'VERIFICADO_100_PCT'` y `assert 'CON_OBSERVACIONES' == 'CERTIFICADO_FEHACIENTE'`.

### 10.5 Verificación de Archivos de Datos Versionados en Git (REP-01)
```powershell
(git ls-files data/).Count
```
*Evidencia esperada:* Retorno numérico de `305` archivos rastreados en Git bajo el directorio `data/`.

---

## 11. Dictamen Técnico Final de la Auditoría

Con base en la evidencia empírica recolectada, analizada y contrastada contra los estándares internacionales de ingeniería de software y las directrices regulatorias de la Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA), se concluye:

1. **Estado del Arte Técnico:** El proyecto posee un diseño conceptual adecuado para el monitoreo de acueductos, pero su implementación actual adolece de atajos de desarrollo (*shortcuts*), simulación de datos en conectores críticos y vulnerabilidades de seguridad inaceptables en un entorno gubernamental.
2. **Recomendación de Certificación:** Se dictamina **RECHAZO TÉCNICO PARA DESPLIEGUE EN PRODUCCIÓN** hasta tanto no se complete íntegramente la **Fase 1** del plan de remediación (eliminación de bypass SSL, protección de endpoints, corrección de pruebas unitarias y actualización de reglas de gitignore).
3. **Hoja de Ruta:** La ejecución secuencial del plan de remediación en sus 3 fases permitirá transformar el prototipo actual en una solución industrializada, auditable y verdaderamente conectada a las fuentes dinámicas del sector hídrico nacional.
