---
id: spec-modelo-territorial
tipo: spec
proyecto: vigia-nino-acueductos
estado: borrador
actualizado: 2026-11-07
fuentes: [prototipo (drill Nación → Departamento → Municipio), ADR-0002, ADR-0006, DANE DIVIPOLA y MGN, IDEAM Zonificación Hidrográfica 2025]
---

# Spec — Modelo territorial

## Propósito

Definir la jerarquía territorial, cómo se asigna cada dato de fuente a un municipio y cómo se agregan los resultados. NO cubre la fórmula de cada indicador (`specs/indicadores.md`).

## Contexto relevante

- Decisión: `adr/ADR-0002-divipola-llave-territorial.md`
- Términos: `docs/glosario.md` → Municipio, ANM, DIVIPOLA, APS, Prestador

## Jerarquía

```
Nación (CO)
└── Departamento (cod_depto, 2 dígitos; Bogotá D.C. = 11)
    └── Municipio / ANM (divipola, 5 dígitos)
        └── APS (divipola + id_prestador_rups)

Jerarquía hidrográfica (IDEAM), paralela a la política-administrativa:
Área hidrográfica (5) └── Zona hidrográfica └── Subzona hidrográfica ← municipio por su cabecera
```

Decisión (ADR-0006, resuelve Q-TER-01): la agregación oficial es por **departamento** y, para el análisis del agua, por **zonificación hidrográfica del IDEAM**. La región natural (Caribe, Andina, Pacífica…) se conserva solo como etiqueta descriptiva del tablero interno; no se agrega por ella.

## Requisitos funcionales

### RF-TER-01 — Dimensión territorial desde DIVIPOLA

El sistema DEBE construir `oro.dim_territorio` exclusivamente a partir de la versión vigente de DIVIPOLA del DANE, con `divipola` como texto de 5 caracteres con ceros a la izquierda.

```gherkin
Escenario: Código con cero inicial
  Dado el municipio Medellín con código DIVIPOLA 5001 en un archivo de fuente
  Cuando se normaliza en plata
  Entonces su divipola es "05001"
```

**Prioridad:** debe

### RF-TER-02 — Resolución de territorio por nombre

SI una fuente identifica el municipio solo por nombre, ENTONCES el sistema DEBE resolver el código comparando nombre de municipio y departamento normalizados (minúsculas, sin tildes, sin signos) contra DIVIPOLA y sus nombres alternos registrados en `config.alias_territorio`, y NO DEBE asignar por similitud aproximada.

```gherkin
Escenario: Nombre con tilde
  Dado un registro "Cajicá, Cundinamarca"
  Cuando se resuelve el territorio
  Entonces su divipola es "25126"

Escenario: Nombre ambiguo sin departamento
  Dado un registro "San Andrés" sin departamento
  Cuando se resuelve el territorio
  Entonces queda con estado "territorio_no_resuelto"
  Y aparece en el reporte de no resueltos para ACT-ADMIN-DATOS
```

**Prioridad:** debe

### RF-TER-03 — Agregación de APS a municipio

CUANDO un indicador de servicio se reporta por APS, el sistema DEBE agregarlo al municipio ponderando por número de suscriptores de cada APS en el mismo periodo.

```gherkin
Escenario: Dos prestadores en un municipio
  Dado el municipio "47001" con APS-1 de 9.000 suscriptores y continuidad 20 h
  Y APS-2 de 1.000 suscriptores y continuidad 10 h
  Cuando se agrega S-1 al municipio
  Entonces la continuidad municipal es 19,0 h/día
```

**Prioridad:** debe

### RF-TER-04 — Asignación de estaciones de lluvia

El sistema DEBE calcular la precipitación municipal diaria como el promedio de las estaciones IDEAM ubicadas dentro del polígono MGN del municipio con dato válido ese día. SI no hay ninguna, ENTONCES DEBE usar el inverso de la distancia al cuadrado de las 3 estaciones válidas más cercanas en un radio de 50 km desde el centroide; si no hay 3, el valor es `sin_dato`.

> **ASUNCIÓN (sin validar):** El método de interpolación (IDW, 3 estaciones, 50 km) es un punto de partida. Origen: práctica hidrológica común. Validar con un hidrólogo o con IDEAM; alternativa: producto grillado CHIRPS (Q-TER-02).

```gherkin
Escenario: Municipio sin estación
  Dado el municipio "94001" sin estaciones dentro del polígono
  Y solo 2 estaciones válidas a menos de 50 km
  Cuando se calcula la precipitación diaria
  Entonces el valor es sin_dato
```

**Prioridad:** debe

### RF-TER-05 — Fuente abastecedora y estación hidrológica

DONDE exista en `config.fuente_abastecedora` el vínculo entre el municipio, su fuente abastecedora principal y una estación IDEAM de caudal, el sistema DEBE calcular H-1 con esa estación. Para municipios sin vínculo, H-1 es `sin_dato`.

**Prioridad:** debe
**Depende de:** Q-TER-03

### RF-TER-06 — Agregación departamental y nacional

El sistema DEBE calcular para cada departamento y para la Nación: (a) ICR medio ponderado por población proyectada DANE del año del corte, (b) número de municipios en cada nivel de alerta, (c) población en municipios con nivel naranja o rojo.

```gherkin
Escenario: Conteo departamental
  Dado un departamento con 10 municipios: 2 rojos, 3 naranja, 5 sin alerta
  Cuando se agrega el corte
  Entonces fct_icr_departamento registra 2 rojos, 3 naranja, 0 amarillos y 5 sin alerta
```

**Prioridad:** debe

### RF-TER-08 — Zonificación hidrográfica del municipio

El sistema DEBE asignar a cada municipio el área, la zona y la subzona hidrográfica del IDEAM que contienen el punto de su cabecera municipal publicado por el DANE, consultando la versión vigente de la zonificación. SI el punto no cae en exactamente una subzona, ENTONCES el municipio DEBE quedar `no_resuelto` y NO DEBE asignarse por nombre ni por cercanía.

```gherkin
Escenario: Cabecera dentro de una subzona
  Dado la cabecera de Medellín ("05001") en el punto DANE (-75,581775; 6,246631)
  Cuando se consulta la Zonificación Hidrográfica 2025
  Entonces su área es "Magdalena Cauca", su zona "Nechí" y su subzona "2701 Río Porce"

Escenario: Punto fuera de toda subzona
  Dado una cabecera cuyo punto no intersecta ninguna subzona
  Cuando se consulta la zonificación
  Entonces el municipio queda con estado "no_resuelto"
```

Implementación v1: `ingesta/territorio/cruce_hidrografico.py` → `data/config/territorio_hidrografico.json`.

**Prioridad:** debe

> Implementación v1 de RF-TER-06: la población por año sale de `data/config/poblacion_dane.json`, extraída de las proyecciones municipales PPED 2018-2042 del DANE (`ingesta/territorio/poblacion_dane.py`). Cada municipio del corte registra `fuente_poblacion`.

### RF-TER-07 — Geometrías

El sistema DEBE servir geometrías de municipios y departamentos del MGN del DANE simplificadas a no más de 5 MB en total para el tablero, y NO DEBE servir geometrías sin simplificar al navegador.

**Prioridad:** debe

## Requisitos no funcionales

### RNF-TER-01 — Cobertura de resolución

Al menos el 99 % de las filas de plata de fuentes con código DIVIPOLA DEBEN resolverse; al menos el 95 % de las de fuentes por nombre.

## Reglas de negocio

| ID | Regla | Aplica a |
|---|---|---|
| RN-TER-01 | Las ANM se tratan como municipios en todo el sistema | todos |
| RN-TER-02 | Cambios de DIVIPOLA (municipios nuevos) se cargan como nueva versión; los cortes antiguos conservan la versión con que se calcularon | RF-TER-01 |

## Casos borde y errores

| Situación | Comportamiento esperado |
|---|---|
| Municipio creado después de un dato histórico | El dato histórico queda en el municipio de origen según la versión DIVIPOLA de su fecha |
| Prestador que atiende varios municipios | Se cuenta en cada APS con sus suscriptores de ese municipio |
| Bogotá D.C. | Departamento 11 y municipio 11001 |

## Fuera de alcance de esta spec

Cuencas como unidad de análisis principal (se usan solo para H-2, H-3 y A-5 vía subzona hidrográfica).

## Preguntas abiertas

| ID | Pregunta | Bloquea | Responsable |
|---|---|---|---|
| Q-TER-01 | ~~¿Regionalización oficial que usa la CRA?~~ Resuelta 2026-11-07: departamento + zonificación hidrográfica IDEAM (ADR-0006) | — | — |
| Q-TER-02 | ¿IDW con estaciones o producto grillado (CHIRPS) para lluvia municipal? | RF-TER-04 | Hidrólogo / IDEAM |
| Q-TER-03 | ¿Existe en la CRA, SSPD o MinVivienda un inventario de fuentes abastecedoras por municipio con coordenadas de bocatoma? | RF-TER-05, H-1 | CRA / MinVivienda |

## Historial

| Fecha | Cambio | Origen |
|---|---|---|
| 2026-10-08 | Versión inicial | Prototipo |
| 2026-11-07 | Q-TER-01 resuelta; RF-TER-08 zonificación hidrográfica | ADR-0006 |
