---
id: spec-seguridad-acceso
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [decisión uso interno CRA 2026-10-08, docs/architecture.md]
---

# Spec — Seguridad y acceso

## Propósito

Autenticación, roles, permisos y auditoría. NO cubre seguridad de infraestructura (red, sistema operativo), que es responsabilidad de TI CRA.

## Contexto relevante

- Actores: `docs/business_context.md` → Actores
- Arquitectura: `docs/architecture.md` → Identidad (Keycloak)

## Matriz de permisos

| Permiso | ACT-COMISIONADO | ACT-ANALISTA | ACT-ADMIN-DATOS |
|---|---|---|---|
| Ver vistas V-01 a V-07 | sí | sí | sí |
| Exportar | sí | sí | sí |
| Revisar alertas y anotar | no | sí | sí |
| Gestionar suscripciones propias | sí | sí | sí |
| Subir archivos de fuente (RF-ING-06) | no | no | sí |
| Editar pesos, umbrales, fuentes y acciones sugeridas | no | no | sí |
| Ordenar reproceso de un corte | no | no | sí |
| Gestionar usuarios y roles | no | no | sí |

## Requisitos funcionales

### RF-SEG-01 — Autenticación institucional

El sistema DEBE autenticar a todo usuario mediante OIDC contra Keycloak federado al directorio de la CRA, y NO DEBE mantener contraseñas propias.

```gherkin
Escenario: Usuario sin sesión
  Dado un usuario no autenticado
  Cuando abre /territorio/44
  Entonces es redirigido al inicio de sesión institucional
  Y tras autenticarse vuelve a /territorio/44
```

**Prioridad:** debe
**Depende de:** Q-ARQ-01

### RF-SEG-02 — Autorización por rol

La API DEBE validar el rol en cada solicitud según la matriz de permisos y responder 403 a operaciones no permitidas.

```gherkin
Escenario: Analista intenta cambiar un peso
  Dado un usuario con rol ACT-ANALISTA
  Cuando envía PUT /config/pesos
  Entonces la API responde 403 y registra el intento en ops.auditoria
```

**Prioridad:** debe

### RF-SEG-03 — Usuario autenticado sin rol

SI un usuario se autentica pero no tiene ningún rol del sistema, ENTONCES el sistema DEBE mostrar "No tienes acceso a Vigía El Niño. Solicítalo a TI de la CRA." y NO DEBE mostrar datos.

**Prioridad:** debe

### RF-SEG-04 — Auditoría

El sistema DEBE registrar en `ops.auditoria` (append-only) inicio de sesión, exportaciones, cambios de configuración, cargas de archivos y reprocesos, con usuario, fecha UTC, IP y detalle.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-SEG-01 — Sesión

Las sesiones DEBEN expirar tras 8 horas o 60 minutos de inactividad.

### RNF-SEG-02 — Transporte

Todo el tráfico de usuario DEBE ir por HTTPS con TLS 1.2 o superior; cabeceras HSTS, CSP sin orígenes externos y X-Frame-Options DENY.

### RNF-SEG-03 — Secretos

Credenciales de fuentes, SMTP y base de datos NO DEBEN estar en el repositorio.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-SEG-01 | El sistema no almacena datos personales de usuarios de servicios públicos; solo agregados municipales y datos de prestadores | todos |
| RN-SEG-02 | Las notas de revisión de alertas son información interna de la CRA | RF-ALE-05 |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Keycloak caído | La web muestra mensaje de servicio no disponible; las cargas programadas siguen ejecutándose |
| Usuario dado de baja en el directorio | Pierde acceso en el siguiente inicio de sesión o al expirar el token |

## Fuera de alcance de esta spec

Acceso de entidades externas y público (RES-02); API pública.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-SEG-01 | ¿Clasificación de la información del tablero según el esquema de activos de información de la CRA (pública, clasificada, reservada)? | RN-SEG-02 | Oficina de Planeación y TIC CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Decisión uso interno |
