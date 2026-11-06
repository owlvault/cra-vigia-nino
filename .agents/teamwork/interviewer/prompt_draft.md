Analizar a fondo el proyecto vigia-nino-acueductos para generar un diagnóstico técnico interno, un plan de conexión y adquisición automatizada de datos reales, y una auditoría técnica completa del repositorio.

Working directory: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos
Integrity mode: development

## Requirements

### R1. Estado del arte y diagnóstico técnico del proyecto
Elaborar un análisis exhaustivo del estado actual del proyecto `vigia-nino-acueductos`, identificando el propósito del sistema, la arquitectura actual implementada, el stack tecnológico, el grado de avance/madurez frente a soluciones similares en el sector de acueductos y alertas tempranas frente a eventos climáticos (El Niño), y las brechas técnicas existentes.

### R2. Plan de conexión y adquisición automatizada de datos reales
Diseñar una hoja de ruta técnica detallada para automatizar la ingestión de datos reales relevantes para el monitoreo de acueductos y eventos climáticos. El plan debe identificar fuentes y entidades oficiales pertinentes (tales como IDEAM, SUI / Superservicios, u otras fuentes climáticas o hidrológicas aplicables), especificar métodos de ingestión (APIs, scraping estructurado, feeds o webhooks), frecuencia de actualización, manejo de autenticación/credenciales, esquemas de almacenamiento y estrategias de resiliencia frente a fallos.

### R3. Auditoría técnica integral del proyecto
Realizar una auditoría técnica rigurosa de todo el código base, configuraciones, dependencias, seguridad (manejo de secretos y variables de entorno), calidad de código, documentación y cobertura de pruebas del repositorio. El informe de auditoría debe clasificar cada hallazgo por severidad (crítico, alto, medio, bajo) y proporcionar una recomendación técnica concreta y accionable para resolverlo.

### R4. Organización y entrega de reportes
Entregar los resultados estructurados en reportes independientes en formato Markdown dentro del directorio `docs/auditoria/`:
- `docs/auditoria/01_estado_del_arte_y_diagnostico.md`
- `docs/auditoria/02_plan_adquisicion_datos_reales.md`
- `docs/auditoria/03_resultado_auditoria_tecnica.md`
- `docs/auditoria/README.md` (resumen ejecutivo y guía de navegación de la auditoría)

## Acceptance Criteria

### Estructura y Entregables
- [ ] Existen los archivos `docs/auditoria/01_estado_del_arte_y_diagnostico.md`, `docs/auditoria/02_plan_adquisicion_datos_reales.md`, `docs/auditoria/03_resultado_auditoria_tecnica.md` y `docs/auditoria/README.md` con contenido completo y sin secciones vacías ni placeholders `TODO`.
- [ ] `docs/auditoria/README.md` contiene un resumen ejecutivo con el índice de hallazgos y enlaces relativos válidos hacia cada uno de los reportes.

### Diagnóstico y Estado del Arte
- [ ] El documento de estado del arte documenta el inventario de componentes actuales del repositorio, la arquitectura detectada, el stack tecnológico y una matriz de madurez técnica del sistema actual frente a su objetivo de monitoreo.

### Plan de Adquisición Automatizada de Datos
- [ ] El plan de adquisición identifica al menos 2 fuentes o entidades de datos reales oficiales pertinentes para acueductos o clima (tales como IDEAM, SUI/Superservicios u homólogos).
- [ ] Para cada fuente de datos identificada, el plan documenta: endpoints/mecanismo de acceso, frecuencia de actualización, esquema o formato de datos (JSON, CSV, etc.), requerimientos de autenticación y estrategia de tolerancia a fallos.
- [ ] Incluye una arquitectura o flujo conceptual del pipeline de ingestión automatizada propuesto y el orden de implementación recomendado.

### Auditoría Técnica
- [ ] El informe de auditoría técnica cubre: análisis de dependencias (versiones y vulnerabilidades potenciales), análisis estático/calidad de código, gestión de secretos/configuraciones, y cobertura de pruebas/documentación.
- [ ] Cada hallazgo registrado incluye severidad asignada (crítica, alta, media o baja), ubicación/archivo de referencia y recomendación técnica de remediación.