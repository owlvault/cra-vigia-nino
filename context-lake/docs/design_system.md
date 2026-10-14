---
id: design-system
tipo: arquitectura
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-10-08
fuentes: [CRA DES-MAN04 Manual de Identidad Visual V02 (jul-2024) en documentacion/fuentes/marca/, prototipo documentacion/fuentes/prototipo-tablero.html, ADR-0004]
---

# Sistema de diseño — Vigía El Niño · Acueductos

Imagen institucional según el **Manual de Identidad Visual de la CRA, código DES-MAN04, versión 02** (en adelante "el manual"). Este archivo es la única fuente de tokens visuales: `web/` DEBE generar `web/src/theme/tokens.ts` a partir de estas tablas y NO DEBE usar colores literales en componentes. Ante conflicto entre este archivo y el manual, prevalece el manual y se abre un ADR.

## Logo

| Elemento | Regla | Origen |
|---|---|---|
| Composición | Escudo de armas de Colombia + "CRA" en Nunito Sans Bold + franja con la bandera debajo | Manual pp. 6 y 9 |
| Versión a usar en el tablero | Logo reducido "CRA" a color (`#43B2D7`) sobre fondo blanco | Manual p. 9 |
| Versión sobre fondo oscuro | Negativo: escudo y "CRA" en blanco, franja de bandera a color | Manual p. 9 |
| Versión con nombre completo | NO DEBE usarse sin aprobación de la Secretaría para las Comunicaciones y Prensa | Manual p. 9, nota |
| Aplicación horizontal | NO DEBE usarse sin aprobación de la Secretaría para las Comunicaciones y Prensa | Manual p. 10 |
| Área de reserva | Respetar la mesa de trabajo de la planimetría; el logo nunca toca el borde ni otros elementos | Manual p. 16 |
| Usos incorrectos | NO DEBE deformarse, recolorearse fuera de las versiones, escribirse "Cra", rotarse ni ponerse sobre fondos que reduzcan su lectura | Manual p. 11 |
| Co-branding | Con otra entidad: logos separados por línea vertical, misma altura | Manual p. 21 |
| Archivo | `documentacion/fuentes/marca/logo-cra-color.png` (recorte del manual, solo para prototipos). Producción DEBE usar el archivo vectorial original (Q-DIS-01) | — |

## Tokens de color

### Institucionales (del manual)

| Token | Hex | RGB | Uso | Origen |
|---|---|---|---|---|
| `--cra-cian` | `#43B2D7` | 67 178 215 | Color asignado de la CRA: logo, barra inferior de página, bordes de acento, íconos, selección activa, primera serie de gráficos | Manual p. 9 |
| `--bandera-amarillo` | `#FFC800` | 255 200 0 | Solo en la franja de bandera (50 % del ancho) | Manual p. 7 |
| `--bandera-azul` | `#003189` | 0 49 137 | Franja de bandera (25 %); también texto de alto énfasis y títulos | Manual p. 7 |
| `--bandera-rojo` | `#D80025` | 216 0 37 | Solo en la franja de bandera (25 %) | Manual p. 7 |

### Derivados para pantalla (no están en el manual)

| Token | Hex | Uso | Razón |
|---|---|---|---|
| `--cra-cian-texto` | `#17729A` | Enlaces, títulos de sección, texto en color institucional | `#43B2D7` tiene contraste 2,45:1 sobre blanco y NO DEBE usarse para texto; este tono del mismo matiz da 5,37:1 (AA) |
| `--cra-cian-suave` | `#E6F5FA` | Fondos de selección, filas resaltadas | Tinte del cian institucional |
| `--texto` | `#5B5B5B` | Texto de cuerpo | Gris del manual en textos de muestra; 6,79:1 sobre blanco |
| `--texto-fuerte` | `#1F2A36` | Cifras, títulos de tarjeta | 14,56:1 |
| `--superficie` | `#FFFFFF` | Fondo de página y tarjetas | El manual usa fondo blanco en todas las piezas digitales |
| `--tinte` | `#F4F6F8` | Encabezados de tabla, bandas | — |
| `--linea` | `#D9D9D9` | Filetes y bordes (el manual enmarca títulos con filetes grises finos) | Manual pp. 4 y 35 |

> **ASUNCIÓN (sin validar):** El manual no define colores de texto, fondos ni una paleta digital extendida; los derivados se construyeron a partir del cian institucional y de las muestras del manual. Confirmar con Comunicaciones (Q-DIS-04).

### Semánticos de alerta

Separados de la paleta institucional. Son los únicos colores que comunican riesgo.

| Token | Hex | Texto sobre él | Nivel |
|---|---|---|---|
| `--alerta-sin` | `#2E7D4F` | blanco (5,05:1) | Sin alerta (ICR < 40) |
| `--alerta-amarilla` | `#F2C200` | `--texto-fuerte` (8,66:1) | Amarilla (40 ≤ ICR < 60) |
| `--alerta-naranja` | `#E07A10` | `--texto-fuerte` (4,82:1) | Naranja (60 ≤ ICR < 75) |
| `--alerta-roja` | `#B3261E` | blanco (6,54:1) | Roja (ICR ≥ 75) |
| `--alerta-sin-dato` | `#B9C4CC` | `--texto-fuerte` | Sin dato suficiente |

Reglas:

1. Los colores de bandera NO DEBEN usarse para codificar datos ni alertas. Su amarillo y rojo se confundirían con los niveles de alerta.
2. El nivel de alerta NUNCA se comunica solo con color: todo chip o celda lleva el texto del nivel; "sin dato" lleva además un rayado.
3. `--cra-cian` es el color de la primera serie de gráficos; las series adicionales usan `--bandera-azul` y grises, nunca colores de alerta.

## Tipografía

| Rol | Familia | Pesos | Tamaños | Origen |
|---|---|---|---|---|
| Toda la interfaz | Nunito Sans | 300, 400, 600, 700, 800 | 12, 14, 16, 20, 24, 32 px | Manual p. 13: tipografía principal |
| Títulos de bloque | Nunito Sans 400-600 | — | 20 px | Manual p. 35: "fuente para títulos 20 px" |
| Texto corrido | Nunito Sans 400 | — | 16 px | Manual p. 35 |
| Cifras y tablas | Nunito Sans 700 con `tabular-nums` | — | 14, 24, 32 px | — |
| Exportes Office y correos de alerta | Verdana | — | 11-12 pt | Manual p. 14: complementaria solo para mailings y documentos Office |

Nunito Sans (licencia SIL OFL) DEBE empaquetarse en `web/public/fonts/` y servirse localmente. Verdana NO DEBE usarse en la interfaz web (el manual la excluye de diagramación).

## Estructura de página

1. **Barra GOV.CO** superior (fondo `#3366CC`, logo GOV.CO enlazado a `https://www.gov.co`), altura 40 px.
2. **Encabezado institucional** en fondo blanco: logo CRA reducido a color a la izquierda respetando el área de reserva; a la derecha el nombre del sistema, la fecha del corte vigente y su estado de frescura.
3. **Títulos de sección** centrados o alineados a la izquierda, enmarcados por filetes `--linea` finos y la franja de bandera en miniatura (24 × 3 px) bajo el título principal de cada vista, como en las portadas del manual.
4. **Contenido** en rejilla de 12 columnas, máximo 1.280 px, margen lateral mínimo 16 px, fondo blanco.
5. **Barra inferior** de 8 px en `--cra-cian` al pie de cada vista, como en todas las piezas del manual.
6. **Pie** con logos CRA y GOV.CO, dirección de la CRA y la sede electrónica `www.cra.gov.co`.

> **ASUNCIÓN (sin validar):** La barra superior GOV.CO no está en el manual de la CRA; se toma de los lineamientos de sitios .gov.co observados en cra.gov.co. Confirmar si aplica a un sistema interno (Q-DIS-02).

## Componentes

| Componente | Especificación |
|---|---|
| Tarjeta de cifra | Fondo blanco, filete `--linea`, borde superior 3 px en `--cra-cian` (informativa) o color de nivel (riesgo), cifra 24-32 px `--texto-fuerte`, etiqueta 14 px `--texto`, fuente y fecha del dato en 12 px |
| Chip de nivel | Radio 4 px, texto 11 px peso 800 en mayúsculas, color según tabla semántica, siempre con texto |
| Mapa | MapLibre con geometrías MGN simplificadas; relleno por nivel o por indicador; borde `--linea`; selección con borde 2 px `--bandera-azul` |
| Tabla | Encabezado `--tinte` 12 px peso 700 `--texto-fuerte`, filas 40 px, números a la derecha, fila seleccionada en `--cra-cian-suave` |
| Medidor de indicador | Barra 6 px sobre `--linea` con relleno del color de nivel y marca del umbral |
| Botón primario | Fondo `--cra-cian-texto`, texto blanco, radio 4 px, foco visible 2 px `--bandera-azul` con separación 2 px |
| Botón secundario | Borde 1 px `--cra-cian-texto`, texto `--cra-cian-texto`, fondo blanco |
| Aviso de frescura | Banda `--alerta-amarilla` con texto `--texto-fuerte` cuando el corte vigente tiene más de 36 h |

## Accesibilidad

- Contraste mínimo WCAG 2.1 AA: 4,5:1 texto normal, 3:1 texto grande y componentes gráficos (valores ya calculados en las tablas).
- Navegación completa por teclado; foco visible; el mapa DEBE tener equivalente en tabla.
- Control de tamaño de texto (A+/A-) y modo alto contraste, como en cra.gov.co.
- Idioma `es-CO`; separador de miles `.` y decimal `,`.

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-DIS-01 | Entrega de los archivos vectoriales (SVG/AI) del logo CRA reducido en sus versiones color y negativo | Paso a producción de `web/` | Comunicaciones CRA |
| Q-DIS-02 | ¿Los sistemas internos deben llevar barra y pie GOV.CO? | Estructura de página | Comunicaciones CRA / TI |
| Q-DIS-03 | ¿Se requiere modo oscuro en la v1? El manual solo define versión negativa del logo | `specs/tablero-ui.md` | Camilo |
| Q-DIS-04 | ¿Aprueba Comunicaciones los colores derivados para pantalla (`--cra-cian-texto`, grises)? | Estado `validado` | Secretaría para las Comunicaciones y Prensa |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial con colores tomados de cra.gov.co | Inspección del sitio |
| 2026-10-08 | Paleta, logo y tipografía corregidos según el manual DES-MAN04 V02: cian `#43B2D7`, bandera, Nunito Sans y Verdana complementaria; se descartan `#3366CC` como primario y Montserrat | Manual entregado por Camilo |
