---
id: spec-ingesta-fuentes
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo (catálogo de fuentes), NOAA CPC, MinVivienda, Superservicios circular 20261000000624]
---

# Spec — Ingesta de fuentes

## Propósito

Descargar de forma automática y trazable los datos de cada fuente oficial y dejarlos inmutables en la zona bronce. NO cubre validación de contenido ni normalización (ver `specs/calidad-datos.md` y `specs/modelo-territorial.md`) ni cálculo de indicadores (`specs/indicadores.md`).

## Contexto relevante

- Flujo: `docs/business_context.md` → FL-01
- Decisiones: `adr/ADR-0003-arquitectura-medallon.md`, `adr/ADR-0005-stack-open-source-on-premise.md`
- Términos: `docs/glosario.md` → SUI, RUPS, Bronce, Corte

## Catálogo de fuentes

El catálogo vive en `config.fuente` y es editable por ACT-ADMIN-DATOS. Valores iniciales:

| ID | Fuente | Entidad | Contenido | Acceso | Frecuencia de captura | Alimenta |
|---|---|---|---|---|---|---|
| FTE-CPC-SEM | Índices Niño semanales | NOAA CPC | Niño 1+2, 3, 3.4, 4 | Archivo de texto `https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for` | Semanal, lunes 12:00 | A-1 |
| FTE-CPC-ONI | ONI / RONI | NOAA CPC | Índices trimestrales | `https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt` y página RONI | Mensual, día 10 | A-1 |
| FTE-CPC-PROB | Probabilidades ENSO y discusión | NOAA CPC | Probabilidades por trimestre e intensidad, estado de alerta | Página `enso_advisory/ensodisc.shtml` y tablas de probabilidades | Mensual, segundo jueves +1 día | A-2 |
| FTE-IDEAM-PREC | Precipitación diaria por estación | IDEAM | Lluvia diaria | DHIME / datos.gov.co | Diaria 05:00 | A-3, A-4 |
| FTE-IDEAM-CAUD | Caudales y niveles | IDEAM | Caudal medio diario por estación | DHIME | Diaria 05:00 | H-1 |
| FTE-IDEAM-ENA | Estudio Nacional del Agua | IDEAM | IUA, IVH por subzona hidrográfica | Descarga manual de capas | Por edición | H-2, H-3 |
| FTE-SUI-CONT | Continuidad acueducto | SSPD SUI | Horas de servicio por APS | SUI / datos.gov.co | Mensual, día 15 | S-1 |
| FTE-SUI-COM | Comercial y operativo acueducto | SSPD SUI | Suscriptores, consumo facturado, IANC/IPUF, cobertura | SUI / datos.gov.co | Mensual, día 15 | S-3, S-4, S-6 |
| FTE-SUI-PQR | Peticiones, quejas y reclamos | SSPD SUI | PQR por causal | SUI | Mensual, día 15 | S-5 |
| FTE-SUI-RUPS | Prestadores | SSPD RUPS | Prestadores de acueducto por municipio | SUI / datos.gov.co | Semanal | dim_prestador |
| FTE-SUI-PEC | Planes de emergencia y contingencia | SSPD / MinVivienda | Reporte de PEC por prestador | Q-ING-02 | Semanal | R-1 |
| FTE-INS-IRCA | IRCA | INS SIVICAP | IRCA mensual por municipio | datos.gov.co / SIVICAP | Mensual, día 20 | S-2 |
| FTE-UNGRD | Consolidado de emergencias | UNGRD | Eventos, calamidades públicas | Archivo publicado en portal UNGRD | Diaria 07:00 | R-2, R-4 |
| FTE-MVCT-RIESGO | Nivel de riesgo El Niño agua y saneamiento | MinVivienda | Nivel de riesgo de desabastecimiento por municipio (DIVIPOLA) | ArcGIS público `MpiosAfectadosNino/FeatureServer/1` (verificado 2026-11-09) | Diaria con la captura R | Contexto del municipio (no entra al ICR) |
| FTE-MVCT-AFECT | Reportes de afectación | MinVivienda (Survey123) | Reportes de sequía con afectación de acueducto (DIVIPOLA, fecha) | ArcGIS público `Reporte_de_Emergencias-Gestores_Prestadores` y `-PDAs` (verificado 2026-11-09), sin campos personales; seguimiento El Niño con token: Q-ING-04 | Diaria | R-3 |
| FTE-DANE | DIVIPOLA, MGN, proyecciones de población | DANE | Llave territorial, geometrías, población | Descarga de archivos oficiales | Trimestral | `specs/modelo-territorial.md` |
| FTE-XM | Nivel de embalses | XM Sinergox | Volumen útil diario | API pública XM | Diaria 06:00 | H-5 |
| FTE-FIRMS | Focos de calor | NASA FIRMS | Detecciones VIIRS (NRT), conteo por polígono municipal | API con MAP_KEY | Diaria 04:00 | A-5 |
| FTE-CHIRPS | Precipitación satelital con estaciones (respaldo de A-3/A-4, ADR-0007) | Climate Hazards Center UCSB / USGS | Lluvia diaria 0,05° (prelim y final) y mensual 1991-2020 | Lectura remota por ventana de GeoTIFF (`data.chc.ucsb.edu`) | Diaria 06:00 | A-3, A-4 (solo donde IDEAM no da valor) |
| FTE-IDEAM-GEO | Polígonos municipales, zonificación hidrográfica y capas ENA | IDEAM | Geometrías (descarga en bloque) | ArcGIS REST paginado → `data/config/geo/` | Por edición | RF-TER-04, H-2, H-3 |

> **ASUNCIÓN (sin validar):** Las URLs de archivo de NOAA CPC listadas son las publicadas históricamente por CPC. Origen: conocimiento previo. Verificar al construir el conector antes de implementar RF-ING-01 para FTE-CPC-SEM y FTE-CPC-ONI.

> **ASUNCIÓN (sin validar):** SUI e IRCA tienen conjuntos de datos en datos.gov.co consultables por SoQL. Origen: práctica conocida del portal. Los identificadores de cada conjunto se fijan en `config.fuente` tras verificación (Q-ING-01).

## Requisitos funcionales

### RF-ING-01 — Captura programada por fuente

CUANDO se cumple el horario configurado de una fuente activa en `config.fuente`, el ACT-ORQUESTADOR DEBE ejecutar su conector y registrar una fila en `ops.captura` con `id_fuente`, `inicio`, `fin`, `estado`, `filas`, `bytes`, `hash_sha256` y `url_origen`.

```gherkin
Escenario: Captura exitosa
  Dado la fuente FTE-CPC-SEM activa con horario lunes 12:00 America/Bogota
  Cuando el reloj marca lunes 2026-10-12 12:00
  Entonces existe una fila en ops.captura con id_fuente "FTE-CPC-SEM" y estado "exitosa"
  Y el archivo crudo queda en bronce con el hash registrado

Escenario: Fuente inactiva
  Dado la fuente FTE-XM con activa = false
  Cuando se cumple su horario
  Entonces no se ejecuta el conector
  Y no se crea fila en ops.captura
```

**Prioridad:** debe
**Origen:** solicitud de automatizar la recopilación (2026-10-08)

### RF-ING-02 — Crudo inmutable

El sistema DEBE guardar el contenido descargado sin modificaciones en `bronce`, junto con `_captura_id`, `_capturado_en` (UTC), `_hash` y `_url_origen`, y NO DEBE actualizar ni borrar filas o archivos de bronce.

```gherkin
Escenario: Intento de modificación
  Dado una captura existente en bronce.cpc_semanal
  Cuando un proceso intenta ejecutar UPDATE sobre esa tabla
  Entonces la base de datos rechaza la operación por permisos
```

**Prioridad:** debe
**Depende de:** ADR-0003

### RF-ING-03 — Idempotencia por hash

CUANDO una captura produce un `hash_sha256` igual al de la última captura exitosa de la misma fuente, el sistema DEBE registrar la captura con estado `sin_cambios` y NO DEBE insertar de nuevo el contenido en bronce.

```gherkin
Escenario: Archivo sin cambios
  Dado la última captura exitosa de FTE-CPC-ONI con hash "a1b2"
  Cuando la nueva descarga produce hash "a1b2"
  Entonces ops.captura registra estado "sin_cambios"
  Y bronce.cpc_oni no recibe filas nuevas
```

**Prioridad:** debe

### RF-ING-04 — Reintentos ante falla de red

SI la descarga falla por timeout, error de conexión o respuesta HTTP 5xx, ENTONCES el ACT-ORQUESTADOR DEBE reintentar hasta 3 veces con espera de 2, 8 y 32 minutos, y registrar cada intento.

```gherkin
Escenario: Falla transitoria
  Dado FTE-IDEAM-PREC responde 503 en el primer intento y 200 en el segundo
  Cuando se ejecuta la captura
  Entonces ops.captura registra 2 intentos y estado final "exitosa"

Escenario: Error del cliente
  Dado FTE-FIRMS responde 401
  Cuando se ejecuta la captura
  Entonces no se reintenta
  Y la captura queda en estado "fallida" con el código 401
```

**Prioridad:** debe

### RF-ING-05 — Notificación de falla persistente

CUANDO una fuente acumula capturas fallidas durante más tiempo que 2 veces su periodo de captura, el sistema DEBE notificar por correo a los usuarios con rol ACT-ADMIN-DATOS con el ID de fuente, último error y fecha de la última captura exitosa.

```gherkin
Escenario: Fuente diaria caída
  Dado FTE-UNGRD con periodo diario y última captura exitosa 2026-10-06 07:00
  Cuando la captura del 2026-10-08 07:00 falla
  Entonces ACT-ADMIN-DATOS recibe un correo con "FTE-UNGRD" y "2026-10-06 07:00"
```

**Prioridad:** debe

### RF-ING-06 — Carga asistida de archivos

DONDE una fuente esté configurada con `modo = archivo` (sin API estable), el sistema DEBE permitir que ACT-ADMIN-DATOS suba el archivo publicado por la entidad, indicando `id_fuente`, URL de origen y fecha de publicación, y DEBE tratarlo como una captura con los mismos metadatos de RF-ING-01.

```gherkin
Escenario: Carga del listado de riesgo de MinVivienda
  Dado FTE-MVCT-RIESGO con modo "archivo"
  Cuando ACT-ADMIN-DATOS sube "municipios_riesgo_nino_2026.xlsx" con fecha de publicación 2026-09-12
  Entonces se crea una captura con origen "carga_manual" y el usuario que la subió
  Y el archivo queda en bronce sin modificaciones

Escenario: Usuario sin rol
  Dado un usuario con rol ACT-ANALISTA
  Cuando intenta subir un archivo de fuente
  Entonces el sistema responde 403
```

**Prioridad:** debe

### RF-ING-07 — Respeto de términos de uso

El sistema DEBE identificarse con un User-Agent que incluya "CRA-VigiaNino" y un correo de contacto institucional, y NO DEBE superar 1 solicitud por segundo por dominio.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-ING-01 — Duración del ciclo diario

Las capturas diarias de todas las fuentes DEBEN completarse en menos de 60 minutos en el 95 % de los días, medidas entre el inicio de la primera y el fin de la última en `ops.captura`.

### RNF-ING-02 — Retención

La zona bronce DEBE conservar todas las capturas al menos 5 años.

> **ASUNCIÓN (sin validar):** 5 años cubre al menos un ciclo ENOS completo para comparaciones. Confirmar con la tabla de retención documental de la CRA (Q-ING-05).

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-ING-01 | Solo se aceptan fuentes de entidades oficiales u organismos científicos públicos. Medios de prensa NO son fuente. | catálogo |
| RN-ING-02 | Cada fuente tiene un único conector. Dos conectores no escriben en la misma tabla bronce. | RF-ING-01 |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| La fuente cambia de esquema (columnas nuevas o renombradas) | La captura se guarda en bronce; la validación en plata falla y se marca la fuente como `esquema_cambiado` (ver `specs/calidad-datos.md`) |
| Respuesta 200 con cuerpo vacío o HTML de error | Captura `fallida` con motivo `contenido_vacio`; se aplica RF-ING-04 |
| Archivo de más de 500 MB | Q-ING-06 |
| Cambio de hora o zona horaria | Horarios configurados en `America/Bogota`; Colombia no tiene horario de verano |
| Dos ejecuciones simultáneas de la misma fuente | El orquestador NO DEBE permitirlo (máximo 1 ejecución activa por fuente) |

## Fuera de alcance de esta spec

Validación de contenido, normalización, cálculo de indicadores, fuentes de alcantarillado y aseo.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-ING-01 | ¿La CRA tiene acceso institucional a bodegas o servicios del SUI distintos al público (convenio SSPD-CRA)? ¿Identificadores de los conjuntos en datos.gov.co? | FTE-SUI-* | Camilo / TI CRA |
| Q-ING-02 | ¿Dónde se publica el estado de reporte de PEC por prestador y con qué acceso? | R-1 | CRA / SSPD |
| Q-ING-03 | ¿Hay acceso por servicio web a DHIME o solo descarga por interfaz? Parcialmente resuelta 2026-11-08: FTE-IDEAM-PREC se consume de datos.gov.co (red automática `s54a-sgyg` y normales `nsz2-kzcq`); FTE-IDEAM-CAUD sigue sin servicio identificado | FTE-IDEAM-CAUD | TI CRA / IDEAM |
| Q-ING-04 | ¿MinVivienda puede compartir con la CRA el consolidado del Survey123 por convenio? | R-3 | Camilo |
| Q-ING-05 | ¿Tabla de retención documental aplicable? | RNF-ING-02 | Gestión documental CRA |
| Q-ING-06 | ¿Límite de tamaño por captura? | Casos borde | TI CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Catálogo del prototipo |
