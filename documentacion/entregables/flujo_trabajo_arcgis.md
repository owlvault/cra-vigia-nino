# Flujo de Trabajo Técnico: Interoperabilidad Bidireccional Tablero Web CRA ⇄ ArcGIS Pro (Desktop)

**Proyecto:** Vigía El Niño · Acueductos  
**Entidad:** Comisión de Regulación de Agua Potable y Saneamiento Básico (CRA)  
**Estado:** Especificación e Implementación Técnica Oficial  
**Fecha:** 2026-10-08  
**Sistemas Involucrados:** Tablero Web Analítico (Leaflet + ECharts) y Esri ArcGIS Pro 3.x (Licencia Desktop)

---

## 1. Justificación y Viabilidad Técnica Objetiva

### 1.1 Diagnóstico del Estado Actual
El tablero web de *Vigía El Niño · Acueductos* cuenta actualmente con:
- Capa coroplética a nivel departamental basada en `colombia_deptos.geojson` (DANE MGN 2018 simplificado).
- Ubicación de municipios monitoreados representada mediante **marcadores circulares puntuales (`L.circleMarker`)** a partir de centroides `(lat, lon)`.
- Ausencia de geometrías de polígonos municipales, cuencas hidrográficas aportantes y capas biofísicas de contexto.

### 1.2 Evaluación de Viabilidad
El flujo de trabajo bidireccional propuesto es **100 % viable técnicamente**, dado que:
1. **ArcGIS Pro** dispone de soporte nativo para importar y exportar **GeoJSON** (estándar IETF RFC 7946 en WGS84 EPSG:4326) mediante las herramientas de geoprocesamiento *JSON To Features* y *Features To JSON*.
2. El visor web basado en **Leaflet 1.9.4** procesa capas poligonales complejas (`Polygon` y `MultiPolygon`) de forma nativa mediante `L.geoJSON`, permitiendo pasar de una representación puntual a una **representación coroplética municipal de alta precisión** sin dependencias externas.
3. El esquema territorial del proyecto está anclado en el código **DIVIPOLA de 5 caracteres** (`specs/modelo-territorial.md`), lo que garantiza una llave primaria espacial única y libre de ambigüedades tanto en PostgreSQL/PostGIS como en las geodatabases de Esri.

---

## 2. Paso 1: Exportación de Datos desde el Tablero hacia ArcGIS Pro

El tablero web implementa dos formatos de exportación limpios, optimizados para su consumo inmediato en el entorno de escritorio de ArcGIS Pro:

### 2.1 Formato A: Esri-Ready GeoJSON (`FeatureCollection`)
* **Extensión:** `.geojson`
* **Sistema de Coordenadas de Referencia (CRS):** WGS84 (EPSG:4326), coordenadas `[longitud, latitud]`.
* **Codificación:** UTF-8 sin BOM.
* **Estructura de Atributos:** Diccionario plano de propiedades sin anidamientos complejos para evitar pérdidas de tipos en ArcGIS Pro.

#### Contrato de Datos GeoJSON Exportado:
```json
{
  "type": "FeatureCollection",
  "name": "vigia_el_nino_corte_20261008_arcgis",
  "crs": {
    "type": "name",
    "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-72.015, 11.713]
      },
      "properties": {
        "DIVIPOLA": "44847",
        "MUNICIPIO": "Uribia",
        "DEPARTAMENTO": "La Guajira",
        "COD_DEPTO": "44",
        "REGION": "Caribe",
        "POBLACION": 196000,
        "ICR": 85.8,
        "NIVEL_ALERTA": "roja",
        "SUB_AMENAZA": 94.17,
        "SUB_VULNERABILIDAD": 78.33,
        "SUB_SERVICIO": 76.23,
        "SUB_RESPUESTA": 100.0,
        "S1_CONTINUIDAD_H": 8.0,
        "S2_IRCA_PTS": 38.5,
        "A3_DEFICIT_LLUVIA_PCT": -88.5,
        "A4_DIAS_SECOS": 48,
        "A5_FOCOS_CALOR_7D": 42,
        "H1_CAUDAL_PCT": 15.0,
        "R3_RACIONAMIENTO": 1,
        "R4_CALAMIDAD": 1,
        "FECHA_CORTE": "2026-10-08"
      }
    }
  ]
}
```

### 2.2 Formato B: CSV Georreferenciado para ArcGIS (`XY Table To Point`)
* **Extensión:** `.csv`
* **Codificación:** UTF-8 con BOM (`\uFEFF`) para que ArcGIS Pro y Microsoft Excel reconozcan tildes y caracteres especiales.
* **Campos clave:**
  - `DIVIPOLA_TXT`: Formateado explícitamente entre comillas dobles (ej. `"05001"`) para evitar que el software elimine el cero a la izquierda.
  - `X_LON` y `Y_LAT`: Decimales con punto en WGS84.
  - Todos los 20 indicadores en columnas independientes con valores nulos como cadenas vacías (nunca como ceros).

---

## 3. Paso 2: Protocolo Operativo para el Analista Humano en ArcGIS Pro

A continuación se detalla el procedimiento paso a paso que ejecuta el operador SIG en ArcGIS Pro Desktop:

### 3.1 Recepción e Ingesta en ArcGIS Pro
1. **Crear o abrir un proyecto:** Abrir ArcGIS Pro con el sistema de coordenadas de la vista fijado en **MAGNA-SIRGAS 2018 / Origen Nacional (EPSG: 9377)** para análisis de distancia y área métrica precisa en Colombia.
2. **Cargar los datos del Tablero:**
   * **Opción GeoJSON:** En la pestaña *Analysis* → *Tools* (Geoprocessing), buscar y ejecutar **JSON To Features**:
     - *Input JSON*: Seleccionar el archivo `vigia_el_nino_corte_AAAAMMDD_arcgis.geojson` exportado del tablero.
     - *Output Feature Class*: `in_memory\munis_vigia` o en la File Geodatabase del proyecto (`Vigia_CRA.gdb\Munis_Vigia_Puntos`).
   * **Opción CSV:** Ejecutar **XY Table To Point**:
     - *X Field*: `X_LON`
     - *Y Field*: `Y_LAT`
     - *Coordinate System*: `GCS_WGS_1984 (EPSG: 4326)`.

### 3.2 Unir con los Polígonos Oficiales del DANE MGN
Para convertir los puntos en polígonos territoriales completos:
1. Cargar la capa oficial de municipios del DANE: `MGN_MPIO_POLITICO.shp` (Marco Geoestadístico Nacional).
2. Ejecutar la herramienta **Add Join**:
   - *Layer Name and Table View*: `MGN_MPIO_POLITICO`
   - *Input Join Field*: `MPIO_CCDGO` (o `DIVIPOLA`)
   - *Join Table*: `Munis_Vigia_Puntos`
   - *Join Table Field*: `DIVIPOLA`
   - *Keep All Target Features*: Desmarcar si solo se desean conservar los municipios monitoreados en el corte actual.
3. Exportar la capa unida a una nueva clase de entidad: **Copy Features** → `Munis_Vigia_Poligonos`.

### 3.3 Geoprocesamiento y Enriquecimiento Analítico
El analista SIG puede ejecutar las siguientes tareas analíticas de valor agregado:

1. **Intersección con Cuencas y Fuentes Abastecedoras (IDEAM):**
   - Ejecutar **Spatial Join** entre `Munis_Vigia_Poligonos` y la capa de *Zonificación Hidrográfica de Colombia* para asignar la Subzona Hidrográfica (SZH) y calcular la distancia a la fuente principal.
2. **Análisis de Proximidad a Incendios Forestales (NASA FIRMS):**
   - Cargar los puntos de focos de calor activos.
   - Ejecutar **Buffer** de 15 km sobre las microcuencas de bocatoma o polígonos municipales.
   - Ejecutar **Spatial Join** con operación `COUNT` para crear el campo `FOCOS_EN_CUENCA`.
3. **Estadística Zonal de Anomalía de Lluvia (Spatial Analyst):**
   - A partir del ráster interpolado de precipitación IDEAM o CHIRPS, ejecutar **Zonal Statistics as Table** usando `DIVIPOLA` como campo de zona.
4. **Campos Calculados Nuevos en la Tabla de Atributos:**
   En la tabla de atributos de `Munis_Vigia_Poligonos`, agregar y calcular campos enriquecidos:
   - `ARCGIS_RIESGO`: Recálculo o ajuste técnico del riesgo espacial (0 a 100).
   - `CUENCA_APORTANTE`: Nombre de la cuenca o subzona abastecedora.
   - `DIST_EMBALSE_KM`: Distancia métrica en kilómetros al embalse más cercano.
   - `AREA_AFECTADA_HA`: Hectáreas de cuenca bajo sequía severa.
   - `OBS_SIG`: Notas técnicas del analista geoespacial para la CRA.

### 3.4 Simplificación y Exportación hacia el Tablero Web
1. **Generalización Topológica (Opcional pero muy recomendada para rendimiento web):**
   - Ejecutar **Simplify Polygon** (algoritmo *Weighted Area*, tolerancia de 0.002 grados / ~200 metros, marcando `Keep collapsed points` desmarcado y `Resolve topological errors` activo).
2. **Exportar a GeoJSON estándar:**
   - Ejecutar la herramienta de geoprocesamiento **Features To JSON**:
     - *Input Features*: `Munis_Vigia_Poligonos`
     - *Output JSON*: Guardar como `vigia_corte_procesado_arcgis.geojson`
     - *GeoJSON Formatted*: **MARCAR OBLIGATORIAMENTE (Checked)**
     - *Project to WGS84*: Marcar si el mapa estaba en MAGNA-SIRGAS Origen Nacional.

---

## 4. Paso 3: Ingesta, Validación y Renderizado en el Tablero Web

El tablero web incorpora un motor de importación en `tablero/js/app.js` que:

### 4.1 Validador de Estructura y Esquema
Al recibir el archivo mediante el modal de interoperabilidad:
1. Verifica que el archivo sea JSON válido con propiedad `"type": "FeatureCollection"`.
2. Inspecciona el array `features`:
   - Detecta si las geometrías son `Point` o `Polygon`/`MultiPolygon`.
   - Si contiene polígonos, activa el **Modo Coroplético Poligonal Municipal**.
3. Mapea la llave DIVIPOLA buscando variantes comunes de nombres de campo generadas por Esri (`DIVIPOLA`, `MPIO_CCDGO`, `divipola`, `COD_MUNICIPIO`).
4. Extrae campos enriquecidos específicos de ArcGIS (`ARCGIS_RIESGO`, `CUENCA_APORTANTE`, `DIST_EMBALSE_KM`, `AREA_AFECTADA_HA`, `OBS_SIG`, etc.).

### 4.2 Comportamiento Visual en el Mapa Leaflet
* **Polígonos Municipales:** Dibuja los límites reales de cada municipio con estilos coropléticos acordes al semáforo oficial CRA:
  - Rojo: `ICR >= 75` (Relleno `#B3261E`)
  - Naranja: `60 <= ICR < 75` (Relleno `#E07A10`)
  - Amarillo: `40 <= ICR < 60` (Relleno `#F2C200`)
  - Verde: `ICR < 40` (Relleno `#2E7D4F`)
* **Interactividad Avanzada:**
  - *Hover:* Resalta el borde del municipio con `#003189` (Azul institucional) y grosor 3px.
  - *Tooltip Flotante:* Muestra el nombre del municipio, departamento, ICR procesado en ArcGIS y cuenca abastecedora.
  - *Click / Popup:* Despliega una tarjeta con los datos de riesgo, la sección **"🛰️ Datos Enriquecidos ArcGIS Pro"** con métricas biofísicas calculadas, y botón de navegación directa a la Ficha Municipal (V-04).
* **Actualización Dinámica de Tablas y KPIs:**
  - La tabla de ranking territorial y los contadores de alerta se sincronizan inmediatamente con los valores calculados en ArcGIS.
* **Banner de Trazabilidad y Reversibilidad:**
  - Se activa una barra de notificación superior:
    `🛰️ Capa ArcGIS Pro Activa (XX municipios) — [✕ Revertir a Capa Base]`
  - Permite al usuario regresar a los datos originales del corte con un solo clic sin recargar la página.

---

## 5. Matriz de Compatibilidad y Mapeo de Atributos

| Campo Tablero Web | Campo ArcGIS Pro (Esri) | Tipo de Dato | Propósito |
|---|---|---|---|
| `m.divipola` | `DIVIPOLA` / `MPIO_CCDGO` | String (5 char) | Llave primaria de unión espacial |
| `m.nombre` | `MUNICIPIO` / `MPIO_CNMBR` | String | Nombre oficial del municipio |
| `m.departamento` | `DEPARTAMENTO` / `DPTO_CNMBR` | String | Nombre del departamento |
| `m.icr` | `ICR` o `ARCGIS_RIESGO` | Float / Double | Índice Compuesto de Riesgo (0-100) |
| `m.nivel_alerta` | `NIVEL_ALERTA` | String | roja, naranja, amarilla, sin_alerta |
| `m.poblacion` | `POBLACION` | Integer / Long | Población urbana y rural |
| `m.indicadores['S-1'].valor` | `S1_CONTINUIDAD_H` | Float | Continuidad de agua potable (horas/día) |
| `m.indicadores['S-2'].valor` | `S2_IRCA_PTS` | Float | Calidad de agua (IRCA 0-100) |
| `m.indicadores['A-3'].valor` | `A3_DEFICIT_LLUVIA_PCT` | Float | Anomalía de lluvia a 30 días (%) |
| *Nuevo campo ArcGIS* | `CUENCA_APORTANTE` | String | Cuenca o subzona hidrográfica IDEAM |
| *Nuevo campo ArcGIS* | `DIST_EMBALSE_KM` | Float | Distancia mínima al embalse más cercano |
| *Nuevo campo ArcGIS* | `AREA_AFECTADA_HA` | Float | Hectáreas de cuenca bajo sequía |
| *Nuevo campo ArcGIS* | `OBS_SIG` | String | Concepto técnico del analista SIG |
