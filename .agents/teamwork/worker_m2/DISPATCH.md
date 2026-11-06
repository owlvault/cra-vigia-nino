## 2026-11-06T14:44:01Z
You are Worker M2 (Specialist in Plan de Adquisición de Datos Reales).
Your working directory is: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\worker_m2\

MANDATORY REQUIREMENTS:
1. Read the original requirements at: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope at: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\orchestrator\PROJECT.md
3. Read the Explorer 2 handoff report at: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\explorer_survey_2\handoff.md

FILE WRITE OWNERSHIP:
You have exclusive write ownership of:
`docs/auditoria/02_plan_adquisicion_datos_reales.md`
Do NOT modify any other files in the project.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK OBJECTIVE:
Draft the comprehensive, professional report `docs/auditoria/02_plan_adquisicion_datos_reales.md` fulfilling Requirement R2 and all acceptance criteria:
- Identificación exhaustiva de fuentes y entidades oficiales reales pertinentes para el monitoreo de acueductos y eventos climáticos: IDEAM (precipitación, estaciones, cuasi-real), SUI / Superservicios (bodega Oracle, extractos oficiales, RUPS), XM Sinergox (API REST diaria de embalses SIN), INS SIVICAP (IRCA vía Socrata), UNGRD / MinVivienda (emergencias y actos administrativos), NOAA CPC (anomalías semanales y ONI), NASA FIRMS (focos de calor), y CHIRPS (mallas satelitales).
- Para cada fuente: endpoints y mecanismos de acceso (REST API, Socrata SoQL, queries Oracle SQL, scraping/feeds), frecuencia de actualización, esquemas y formatos de datos (JSON, CSV, NetCDF), requerimientos de autenticación/credenciales, cuotas/rate limits y modos de fallo típicos con resiliencia.
- Arquitectura y flujo conceptual del pipeline de ingestión automatizada (zonas Medallón Bronce, Plata, Oro, Ops), cronograma de ejecución escalonado (03:00 - 06:15 COT), políticas de resiliencia y circuit breaker, manejo de caídas y degradación controlada (`sin_dato` con redistribución de pesos RF-ICR-04).
- Hoja de ruta técnica de implementación por fases y orden recomendado (Fase 1 Quick Wins -> Fase 2 Formalización Interinstitucional -> Fase 3 Mallas Satelitales -> Fase 4 Industrialización CI/CD).
- Absolutamente SIN secciones vacías ni placeholders `TODO`.

When complete, write your handoff report to `g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\worker_m2\handoff.md` and send a message back to the orchestrator with the summary and verification details.
