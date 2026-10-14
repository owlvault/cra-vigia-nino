---
id: spec-tablero-ui
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [prototipo documentacion/fuentes/prototipo-tablero.html, docs/design_system.md, Manual DES-MAN04 V02]
---

# Spec — Tablero web

## Propósito

Definir vistas, navegación, contenidos y comportamiento del tablero. La apariencia la define `docs/design_system.md`. NO cubre cálculo de datos.

## Contexto relevante

- Flujo: `docs/business_context.md` → FL-02
- Prototipo de referencia: `documentacion/fuentes/prototipo-tablero.html` (los valores territoriales del prototipo son de ejemplo)
- Diseño: `docs/design_system.md`; decisión: `adr/ADR-0004-imagen-institucional-cra.md`
- Términos: `docs/glosario.md` → Corte, Nivel de alerta, Frescura

## Vistas

| ID | Vista | Contenido mínimo |
|---|---|---|
| V-01 | Resumen | Fecha y estado del corte; conteo de municipios por nivel; población en naranja y roja; escalamientos del día; estado NOAA |
| V-02 | Amenaza | A-1 y A-2: barras de índices Niño (1+2, 3, 3.4, 4) con umbral +0,5 °C; serie de Niño 3.4 desde 2026-01; probabilidades por trimestre; señales atmosféricas de la discusión CPC |
| V-03 | Territorio | Mapa coloreable por ICR o por indicador; navegación Nación → Departamento → Municipio con migas; ranking en tabla |
| V-04 | Ficha municipal | Encabezado con nivel, ICR, prestadores y suscriptores; aporte por capa; los 20 indicadores con valor, medidor, fuente, fecha del dato y frescura; acción sugerida; historial del ICR; alertas del municipio |
| V-05 | Indicadores | Catálogo de indicadores con definición, umbrales y versión de configuración vigente |
| V-06 | Alertas | Lista filtrable de alertas con estado de revisión |
| V-07 | Fuentes | Estado de cada fuente: última captura exitosa, frescura, errores |

## Requisitos funcionales

### RF-UI-01 — Navegación territorial

CUANDO ACT-ANALISTA selecciona un departamento en el mapa o en la tabla, el sistema DEBE mostrar los municipios de ese departamento con sus niveles, y CUANDO selecciona un municipio DEBE abrir V-04. Las migas Colombia › Departamento › Municipio DEBEN permitir volver a cualquier nivel.

```gherkin
Escenario: Drill a municipio
  Dado V-03 en nivel Nación
  Cuando ACT-ANALISTA selecciona "La Guajira"
  Entonces el mapa hace zoom al departamento y la tabla lista sus municipios ordenados por ICR descendente
  Y las migas muestran "Colombia › La Guajira"
```

**Prioridad:** debe

### RF-UI-02 — Selector de indicador del mapa

El sistema DEBE permitir colorear el mapa por ICR (por defecto), S-1, A-3 o S-2, mostrando la leyenda con los cortes de la escala usada.

**Prioridad:** debe

### RF-UI-03 — Enlace profundo

Cada vista territorial DEBE tener URL propia (`/territorio/44`, `/municipio/44847`) para compartir dentro de la CRA.

**Prioridad:** debe

### RF-UI-04 — Selector de corte

El sistema DEBE mostrar por defecto el último corte publicado y permitir elegir un corte anterior; MIENTRAS se vea un corte anterior, DEBE mostrarse una banda indicando la fecha consultada.

**Prioridad:** debería

### RF-UI-05 — Transparencia de datos

Todo valor de indicador DEBE mostrar al pasar el cursor o al tocar: fuente, fecha del dato y frescura (RF-CAL-05). Valores `sin_dato` DEBEN verse como "Sin dato" con rayado, nunca como 0.

```gherkin
Escenario: Indicador sin dato
  Dado H-4 sin_dato para "25126"
  Cuando ACT-ANALISTA abre la ficha
  Entonces H-4 muestra "Sin dato" con el patrón rayado
  Y no aparece ningún número
```

**Prioridad:** debe

### RF-UI-06 — Exportación

El sistema DEBE permitir exportar la tabla de la vista actual a CSV y XLSX, y la ficha municipal a PDF con el encabezado institucional.

**Prioridad:** debe

### RF-UI-07 — Aviso de desactualización

MIENTRAS el último corte publicado tenga más de 36 horas, el sistema DEBE mostrar en todas las vistas el aviso de frescura del sistema de diseño.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-UI-01 — Rendimiento

V-01 y V-03 nivel Nación DEBEN cargar en menos de 3 s (p95) en la red interna de la CRA con un navegador de escritorio actual; cambios de nivel territorial en menos de 1 s.

### RNF-UI-02 — Responsive

Las vistas DEBEN ser usables desde 360 px de ancho sin desplazamiento horizontal de la página (las tablas desplazan en su propio contenedor).

### RNF-UI-03 — Accesibilidad

Cumplir WCAG 2.1 AA según `docs/design_system.md`.

### RNF-UI-04 — Navegadores

Últimas 2 versiones de Edge, Chrome y Firefox.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-UI-01 | Toda vista muestra la fecha del corte y la leyenda "Uso interno CRA" | todas |
| RN-UI-02 | El tablero NO DEBE mostrar datos de ejemplo en producción; el prototipo es solo referencia de diseño | todas |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| API no disponible | Mensaje "No pudimos cargar los datos. Intenta de nuevo en unos minutos; si persiste, avisa a TI." con botón Reintentar |
| Municipio sin ICR | Ficha visible con indicadores disponibles y nivel "Sin dato" |
| Sesión expirada | Redirección al inicio de sesión conservando la URL de destino |

## Fuera de alcance de esta spec

Edición de datos desde el tablero; vistas para alcantarillado y aseo; acceso público.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-UI-01 | ¿El PDF de ficha municipal debe seguir el formato de documento corporativo del manual (p. 31-33)? | RF-UI-06 | Comunicaciones CRA |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo y manual |
