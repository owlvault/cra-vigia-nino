// Datos Maestros Integrados — Vigía El Niño · Acueductos
window.VIGIA_DATA = { corte: {
  "metadata_corte": {
    "fecha_corte": "2026-11-09",
    "generado_en": "2026-11-09T01:04:15.569781+00:00",
    "version_configuracion": "v1.2.0-20261108",
    "estado_calidad": "PUBLICADO_VALIDO",
    "motivos_rechazo": [],
    "total_municipios_evaluados": 23,
    "icr_nacional_ponderado": 34.6,
    "poblacion_en_riesgo_critico": 456709,
    "conteo_niveles_nacional": {
      "roja": 1,
      "naranja": 3,
      "amarilla": 9,
      "sin_alerta": 10,
      "sin_dato": 0
    }
  },
  "amenaza_global": {
    "fuente": "NOAA Climate Prediction Center",
    "url_origen": "https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for",
    "fecha_captura": "2026-11-09T01:03:07.634935+00:00",
    "estado_alerta_noaa": "Advertencia de El Niño (El Niño Advisory)",
    "indices_semanales": {
      "fecha_semana": "28OCT2026",
      "nino12_sst": 26.7,
      "nino12_anomalia": 5.4,
      "nino3_sst": 29.5,
      "nino3_anomalia": 4.4,
      "nino34_sst": 30.2,
      "nino34_anomalia": 3.4,
      "nino4_sst": 30.1,
      "nino4_anomalia": 1.4
    },
    "indice_oni_trimestral": {
      "trimestre": "ASO",
      "ano": 2026,
      "temperatura_media": 29.23,
      "oni_anomalia": 2.46,
      "intensidad_evento": "Muy Fuerte (Histórico)"
    },
    "indicador_a1_nino34": 3.4,
    "indicador_a2_probabilidad_muy_fuerte_pct": 83.0,
    "fecha_boletin_enso": "2026-10-10",
    "umbral_critico_superado": true
  },
  "municipios": [
    {
      "divipola": "44847",
      "nombre": "Uribia",
      "departamento": "La Guajira",
      "cod_depto": "44",
      "poblacion": 208712,
      "icr": 64.7,
      "nivel_alerta": "naranja",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 22.65,
        "vulnerabilidad_H": 79.44,
        "servicio_S": 76.23,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -25.3,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 45.3,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 4.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 83.33,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 4.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 98.44,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 1.8,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 14.4,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 42.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 98.33,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 64.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 92.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 120.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 77.5,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 8.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": 1,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": 1,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": 80.0,
          "frescura": "desactualizado"
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 15,
      "zona_hidrografica": "Caribe - Guajira",
      "cod_subzona_hidrografica": "1507",
      "subzona_hidrografica": "Directos Caribe - Ay.Sharimahana Alta Guajira",
      "lat": 11.711904,
      "lon": -72.265906
    },
    {
      "divipola": "44430",
      "nombre": "Maicao",
      "departamento": "La Guajira",
      "cod_depto": "44",
      "poblacion": 218184,
      "icr": 56.9,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 76.67,
        "servicio_S": 75.7,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 0.8,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 6.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 75.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 7.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 90.62,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 8.1,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 46.89,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 58.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 85.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 56.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 82.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 95.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 73.5,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 11.2,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 15,
      "zona_hidrografica": "Caribe - Guajira",
      "cod_subzona_hidrografica": "1508",
      "subzona_hidrografica": "Río Carraipia - Paraguachon, Directos al Golfo Maracaibo",
      "lat": 11.378535,
      "lon": -72.242738
    },
    {
      "divipola": "44001",
      "nombre": "Riohacha",
      "departamento": "La Guajira",
      "cod_depto": "44",
      "poblacion": 211811,
      "icr": 41.2,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.9,
        "vulnerabilidad_H": 78.33,
        "servicio_S": 69.77,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -0.9,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 1.8,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 8.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 9.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 82.81,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 10.2,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 51.56,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 71.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 74.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 52.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 77.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 60.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 63.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 15,
      "zona_hidrografica": "Caribe - Guajira",
      "cod_subzona_hidrografica": "1506",
      "subzona_hidrografica": "Río Ranchería",
      "lat": 11.528588,
      "lon": -72.911795
    },
    {
      "divipola": "44560",
      "nombre": "Manaure",
      "departamento": "La Guajira",
      "cod_depto": "44",
      "poblacion": 98481,
      "icr": 81.2,
      "nivel_alerta": "roja",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 70.0,
      "subindices_capa": {
        "amenaza_A": null,
        "vulnerabilidad_H": 79.44,
        "servicio_S": 71.91,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": null,
          "puntaje": null,
          "frescura": null
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": null,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": null,
          "puntaje": null,
          "frescura": null
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": null,
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 4.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 83.33,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 5.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 96.88,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.7,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 5.6,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 48.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 93.33,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 60.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 87.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 110.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 76.25,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 9.0,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": 1,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": 1,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": 80.0,
          "frescura": "desactualizado"
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 15,
      "zona_hidrografica": "Caribe - Guajira",
      "cod_subzona_hidrografica": "1507",
      "subzona_hidrografica": "Directos Caribe - Ay.Sharimahana Alta Guajira",
      "lat": 11.773767,
      "lon": -72.438739
    },
    {
      "divipola": "47001",
      "nombre": "Santa Marta",
      "departamento": "Magdalena",
      "cod_depto": "47",
      "poblacion": 588662,
      "icr": 35.3,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 66.67,
        "servicio_S": 61.28,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 17.0,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 8.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 11.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 78.12,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 2.1,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 16.8,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 76.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 69.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 49.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 73.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 80.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 69.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 14.2,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 15,
      "zona_hidrografica": "Caribe - Guajira",
      "cod_subzona_hidrografica": "1501",
      "subzona_hidrografica": "Río  Piedras - Río Manzanares",
      "lat": 11.204679,
      "lon": -74.199829
    },
    {
      "divipola": "47555",
      "nombre": "Plato",
      "departamento": "Magdalena",
      "cod_depto": "47",
      "poblacion": 75598,
      "icr": 53.5,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 68.33,
        "servicio_S": 71.95,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 6.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 75.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 8.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 87.5,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 6.5,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 43.33,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 62.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 81.67,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 55.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 81.25,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 70.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 66.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 12.8,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 29,
      "zona_hidrografica": "Bajo Magdalena",
      "cod_subzona_hidrografica": "2907",
      "subzona_hidrografica": "Directos Bajo Magdalena entre El Banco y El Plato",
      "lat": 9.796713,
      "lon": -74.784549
    },
    {
      "divipola": "13244",
      "nombre": "El Carmen de Bolívar",
      "departamento": "Bolívar",
      "cod_depto": "13",
      "poblacion": 77564,
      "icr": 64.3,
      "nivel_alerta": "naranja",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 26.6,
        "vulnerabilidad_H": 80.0,
        "servicio_S": 69.1,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -33.2,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 53.2,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 6.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 75.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 6.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 92.19,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.0,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 54.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 88.33,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 58.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 85.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 140.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 80.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 10.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 29,
      "zona_hidrografica": "Bajo Magdalena",
      "cod_subzona_hidrografica": "2901",
      "subzona_hidrografica": "Directos al Bajo Magdalena entre El Plato y Calamar (MI)",
      "lat": 9.718653,
      "lon": -75.121178
    },
    {
      "divipola": "13430",
      "nombre": "Magangué",
      "departamento": "Bolívar",
      "cod_depto": "13",
      "poblacion": 152489,
      "icr": 32.8,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 3.7,
        "vulnerabilidad_H": 56.67,
        "servicio_S": 58.9,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -3.7,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 7.4,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Moderado",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 10.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 65.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 13.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 72.5,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 3.0,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 24.0,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 72.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 73.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 46.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 69.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 45.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 56.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.4,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 25,
      "zona_hidrografica": "Bajo Magdalena- Cauca -San Jorge",
      "cod_subzona_hidrografica": "2502",
      "subzona_hidrografica": "Bajo San Jorge - La Mojana",
      "lat": 9.263799,
      "lon": -74.766742
    },
    {
      "divipola": "13001",
      "nombre": "Cartagena de Indias",
      "departamento": "Bolívar",
      "cod_depto": "13",
      "poblacion": 1010995,
      "icr": 40.0,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 37.91,
        "vulnerabilidad_H": 71.67,
        "servicio_S": 28.64,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -61.0,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 75.83,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 18.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 50.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 22.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 30.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 2.9,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 23.2,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 96.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 32.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 31.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 42.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 10.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 16.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 14.0,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 1,
      "area_hidrografica": "Caribe",
      "cod_zona_hidrografica": 12,
      "zona_hidrografica": "Caribe - Litoral",
      "cod_subzona_hidrografica": "1206",
      "subzona_hidrografica": "Arroyos Directos al Caribe",
      "lat": 10.385126,
      "lon": -75.496269
    },
    {
      "divipola": "20001",
      "nombre": "Valledupar",
      "departamento": "Cesar",
      "cod_depto": "20",
      "poblacion": 629217,
      "icr": 45.0,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 28.8,
        "vulnerabilidad_H": 75.0,
        "servicio_S": 55.24,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -33.6,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 53.6,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 1.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 4.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 12.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 14.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 2.4,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 19.2,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 84.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 61.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 44.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 66.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 50.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 14.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 28,
      "zona_hidrografica": "Cesar",
      "cod_subzona_hidrografica": "2801",
      "subzona_hidrografica": "Alto Cesar",
      "lat": 10.460472,
      "lon": -73.259398
    },
    {
      "divipola": "20011",
      "nombre": "Aguachica",
      "departamento": "Cesar",
      "cod_depto": "20",
      "poblacion": 137624,
      "icr": 55.2,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 30.27,
        "vulnerabilidad_H": 50.0,
        "servicio_S": 64.61,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -40.7,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 60.53,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Medio",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Moderado",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 8.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 9.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 84.38,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 1.7,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 13.6,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 66.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 78.33,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 51.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 76.25,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 85.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.5,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 12.0,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Caribe",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 23,
      "zona_hidrografica": "Medio Magdalena",
      "cod_subzona_hidrografica": "2321",
      "subzona_hidrografica": "Quebrada El Carmen y Otros Directos al Magdalena",
      "lat": 8.306811,
      "lon": -73.614027
    },
    {
      "divipola": "68079",
      "nombre": "Barichara",
      "departamento": "Santander",
      "cod_depto": "68",
      "poblacion": 13156,
      "icr": 30.8,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 41.67,
        "servicio_S": 73.16,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 92.6,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Bajo",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 15.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Moderado",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 8.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 6.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 93.75,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 23.2,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 66.57,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 82.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 63.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 47.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 70.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 90.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 72.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 11.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 24,
      "zona_hidrografica": "Sogamoso",
      "cod_subzona_hidrografica": "2401",
      "subzona_hidrografica": "Río Suárez",
      "lat": 6.634111,
      "lon": -73.223047
    },
    {
      "divipola": "68679",
      "nombre": "San Gil",
      "departamento": "Santander",
      "cod_depto": "68",
      "poblacion": 71064,
      "icr": 22.6,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 37.22,
        "servicio_S": 45.88,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 102.7,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Medio",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Bajo",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 15.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 14.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 56.67,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 16.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 65.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.8,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 6.4,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 89.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 52.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 39.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 58.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 35.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 48.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 12.8,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 24,
      "zona_hidrografica": "Sogamoso",
      "cod_subzona_hidrografica": "2402",
      "subzona_hidrografica": "Río Fonce",
      "lat": 6.551952,
      "lon": -73.134776
    },
    {
      "divipola": "68001",
      "nombre": "Bucaramanga",
      "departamento": "Santander",
      "cod_depto": "68",
      "poblacion": 618548,
      "icr": 18.0,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 50.56,
        "servicio_S": 11.2,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 40.2,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Medio",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 20.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 46.67,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 23.8,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 4.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 1.5,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 12.0,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 99.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 8.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 26.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 24.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 5.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 8.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 12.5,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 23,
      "zona_hidrografica": "Medio Magdalena",
      "cod_subzona_hidrografica": "2319",
      "subzona_hidrografica": "Río Lebrija y otros directos al Magdalena",
      "lat": 7.11647,
      "lon": -73.132562
    },
    {
      "divipola": "11001",
      "nombre": "Bogotá, D.C.",
      "departamento": "Bogotá, D.C.",
      "cod_depto": "11",
      "poblacion": 7945996,
      "icr": 37.0,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 29.1,
        "vulnerabilidad_H": 68.33,
        "servicio_S": 31.16,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -34.2,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 54.2,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 1.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 4.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 24.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 40.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": 68.7,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": "vigente"
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 21.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 45.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 1.1,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 8.8,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 99.5,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 4.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 33.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 46.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 40.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 52.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 10.4,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2120",
      "subzona_hidrografica": "Río Bogotá",
      "lat": 4.649251,
      "lon": -74.106992
    },
    {
      "divipola": "25307",
      "nombre": "Girardot",
      "departamento": "Cundinamarca",
      "cod_depto": "25",
      "poblacion": 104326,
      "icr": 48.9,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 41.46,
        "vulnerabilidad_H": 75.0,
        "servicio_S": 55.87,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -69.5,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 82.92,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 12.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": 65.2,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": "vigente"
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 13.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 71.25,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 1.7,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 13.6,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 86.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 58.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 48.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 72.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 65.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 64.5,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.8,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2120",
      "subzona_hidrografica": "Río Bogotá",
      "lat": 4.313069,
      "lon": -74.798201
    },
    {
      "divipola": "25126",
      "nombre": "Cajicá",
      "departamento": "Cundinamarca",
      "cod_depto": "25",
      "poblacion": 126436,
      "icr": 36.5,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 30.34,
        "vulnerabilidad_H": 72.78,
        "servicio_S": 22.29,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -40.9,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 60.67,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 16.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 53.33,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 23.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 10.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 5.3,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 40.67,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 98.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 16.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 28.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 32.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 8.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 12.8,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 11.1,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2120",
      "subzona_hidrografica": "Río Bogotá",
      "lat": 4.920009,
      "lon": -74.02298
    },
    {
      "divipola": "73001",
      "nombre": "Ibagué",
      "departamento": "Tolima",
      "cod_depto": "73",
      "poblacion": 557317,
      "icr": 38.5,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 10.2,
        "vulnerabilidad_H": 70.56,
        "servicio_S": 57.28,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -10.2,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 20.4,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 14.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 56.67,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 17.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 61.25,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 28.2,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 70.14,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 91.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 48.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 42.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 63.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 30.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 44.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.1,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2124",
      "subzona_hidrografica": "Río Totare",
      "lat": 4.432248,
      "lon": -75.19425
    },
    {
      "divipola": "73268",
      "nombre": "Espinal",
      "departamento": "Tolima",
      "cod_depto": "73",
      "poblacion": 71952,
      "icr": 62.3,
      "nivel_alerta": "naranja",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 31.23,
        "vulnerabilidad_H": 76.67,
        "servicio_S": 59.7,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -43.3,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 62.47,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 10.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 65.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": 50.7,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": "vigente"
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 10.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 81.25,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.0,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 74.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 71.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 53.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 78.75,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 75.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 67.5,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.6,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2118",
      "subzona_hidrografica": "Río Luisa y otros directos al Magdalena",
      "lat": 4.151314,
      "lon": -74.885446
    },
    {
      "divipola": "41001",
      "nombre": "Neiva",
      "departamento": "Huila",
      "cod_depto": "41",
      "poblacion": 408218,
      "icr": 42.5,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 28.8,
        "vulnerabilidad_H": 71.67,
        "servicio_S": 49.48,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -37.6,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 57.6,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 12.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 60.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 15.0,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 67.5,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.8,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 6.4,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 88.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 54.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 45.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 67.5,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 40.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 52.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 14.1,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 21,
      "zona_hidrografica": "Alto Magdalena",
      "cod_subzona_hidrografica": "2111",
      "subzona_hidrografica": "Rio Fortalecillas y otros",
      "lat": 2.935432,
      "lon": -75.277327
    },
    {
      "divipola": "15837",
      "nombre": "Tuta",
      "departamento": "Boyacá",
      "cod_depto": "15",
      "poblacion": 8196,
      "icr": 53.6,
      "nivel_alerta": "amarilla",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 21.9,
        "vulnerabilidad_H": 56.67,
        "servicio_S": 60.03,
        "respuesta_R": 100.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -23.8,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 43.8,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Medio",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 10.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 65.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 11.5,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 76.56,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 2.2,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 17.6,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 70.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 75.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 50.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 75.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 45.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 56.0,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 8.9,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 0,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 100.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 24,
      "zona_hidrografica": "Sogamoso",
      "cod_subzona_hidrografica": "2403",
      "subzona_hidrografica": "Río Chicamocha",
      "lat": 5.689082,
      "lon": -73.230285
    },
    {
      "divipola": "05001",
      "nombre": "Medellín",
      "departamento": "Antioquia",
      "cod_depto": "05",
      "poblacion": 2526795,
      "icr": 22.0,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 6.5,
        "vulnerabilidad_H": 58.89,
        "servicio_S": 9.68,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": -6.5,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 13.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Medio",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 40.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Muy Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 90.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 20.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 46.67,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 23.9,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 2.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.7,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 5.6,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 99.0,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 8.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 27.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 28.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 3.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 4.8,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 12.2,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Andina",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 27,
      "zona_hidrografica": "Nechí",
      "cod_subzona_hidrografica": "2701",
      "subzona_hidrografica": "Río Porce",
      "lat": 6.246631,
      "lon": -75.581775
    },
    {
      "divipola": "76001",
      "nombre": "Cali",
      "departamento": "Valle del Cauca",
      "cod_depto": "76",
      "poblacion": 2269983,
      "icr": 25.1,
      "nivel_alerta": "sin_alerta",
      "nivel_por_regla": false,
      "cobertura_datos_pct": 100.0,
      "subindices_capa": {
        "amenaza_A": 0.0,
        "vulnerabilidad_H": 71.67,
        "servicio_S": 14.48,
        "respuesta_R": 0.0
      },
      "indicadores": {
        "A-1": {
          "nombre": "ONI / Niño 3.4",
          "valor": 3.4,
          "unidad": "°C",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-28",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-2": {
          "nombre": "Probabilidad Niño Muy Fuerte",
          "valor": 83.0,
          "unidad": "%",
          "fuente": "NOAA CPC",
          "fecha_dato": "2026-10-10",
          "puntaje": null,
          "frescura": "vigente"
        },
        "A-3": {
          "nombre": "Anomalía Precipitación 30d",
          "valor": 117.0,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-4": {
          "nombre": "Días Consecutivos sin Lluvia",
          "valor": 0.0,
          "unidad": "días",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "A-5": {
          "nombre": "Focos de Calor (7d)",
          "valor": null,
          "unidad": "conteo",
          "fuente": "NASA FIRMS",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "H-1": {
          "nombre": "Caudal Fuente Abastecedora",
          "valor": null,
          "unidad": "%",
          "fuente": "IDEAM",
          "fecha_dato": "2026-11-07",
          "puntaje": null,
          "frescura": null
        },
        "H-2": {
          "nombre": "Vulnerabilidad Hídrica ENA",
          "valor": "Alto",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2010 (año seco)",
          "fecha_dato": "2010-12-31",
          "puntaje": 65.0,
          "frescura": "vigente"
        },
        "H-3": {
          "nombre": "Uso del Agua ENA (IUA)",
          "valor": "Crítico",
          "unidad": "categoría",
          "fuente": "IDEAM ENA 2014 (año seco)",
          "fecha_dato": "2014-12-31",
          "puntaje": 100.0,
          "frescura": "vigente"
        },
        "H-4": {
          "nombre": "Autonomía Almacenamiento",
          "valor": 18.0,
          "unidad": "horas",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 50.0,
          "frescura": "desactualizado"
        },
        "H-5": {
          "nombre": "Volumen Útil Embalse",
          "valor": null,
          "unidad": "%",
          "fuente": "XM Sinergox",
          "fecha_dato": "2026-11-09",
          "puntaje": null,
          "frescura": null
        },
        "S-1": {
          "nombre": "Continuidad",
          "valor": 23.7,
          "unidad": "h/día",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 6.0,
          "frescura": "desactualizado"
        },
        "S-2": {
          "nombre": "Calidad del Agua (IRCA)",
          "valor": 0.1,
          "unidad": "%",
          "fuente": "INS SIVICAP",
          "fecha_dato": "2024-12-31",
          "puntaje": 0.8,
          "frescura": "desactualizado"
        },
        "S-3": {
          "nombre": "Cobertura Urbana",
          "valor": 98.5,
          "unidad": "%",
          "fuente": "SSPD SUI / DANE",
          "fecha_dato": "2026-08-31",
          "puntaje": 12.0,
          "frescura": "vigente"
        },
        "S-4": {
          "nombre": "Agua No Contabilizada (IANC)",
          "valor": 32.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 44.0,
          "frescura": "vigente"
        },
        "S-5": {
          "nombre": "Variación PQR por Servicio",
          "valor": 6.0,
          "unidad": "%",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": 9.6,
          "frescura": "desactualizado"
        },
        "S-6": {
          "nombre": "Consumo Medio Facturado",
          "valor": 13.9,
          "unidad": "m³/susc/mes",
          "fuente": "SSPD SUI",
          "fecha_dato": "2026-08-31",
          "puntaje": null,
          "frescura": "desactualizado"
        },
        "R-1": {
          "nombre": "PEC Reportado Vigente",
          "valor": 1,
          "unidad": "binario",
          "fuente": "SSPD / MinVivienda",
          "fecha_dato": "2026-08-31",
          "puntaje": 0.0,
          "frescura": "desactualizado"
        },
        "R-2": {
          "nombre": "Abastecimiento Alterno Activo",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-3": {
          "nombre": "Racionamiento Reportado",
          "valor": null,
          "unidad": "binario",
          "fuente": "MinVivienda Survey123",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        },
        "R-4": {
          "nombre": "Calamidad Pública Vigente",
          "valor": null,
          "unidad": "binario",
          "fuente": "UNGRD Sala de Crisis",
          "fecha_dato": "2026-10-14",
          "puntaje": null,
          "frescura": null
        }
      },
      "config_version": "v1.2.0-20261108",
      "region": "Pacífica",
      "fuente_poblacion": "DANE PPED 2018-2042, proyección 2026 (Actualizado el 30 de Julio de 2025)",
      "cod_area_hidrografica": 2,
      "area_hidrografica": "Magdalena Cauca",
      "cod_zona_hidrografica": 26,
      "zona_hidrografica": "Cauca",
      "cod_subzona_hidrografica": "2630",
      "subzona_hidrografica": "Ríos Lilí, Melendez y Canaveralejo",
      "lat": 3.413686,
      "lon": -76.52133
    }
  ],
  "departamentos": [
    {
      "cod_depto": "44",
      "departamento": "La Guajira",
      "total_municipios": 4,
      "icr_medio_ponderado": 57.8,
      "poblacion_total": 737188,
      "poblacion_naranja_roja": 307193,
      "conteo_niveles": {
        "roja": 1,
        "naranja": 1,
        "amarilla": 2,
        "sin_alerta": 0,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "15",
      "departamento": "Boyacá",
      "total_municipios": 1,
      "icr_medio_ponderado": 53.6,
      "poblacion_total": 8196,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 1,
        "sin_alerta": 0,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "20",
      "departamento": "Cesar",
      "total_municipios": 2,
      "icr_medio_ponderado": 46.8,
      "poblacion_total": 766841,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 2,
        "sin_alerta": 0,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "41",
      "departamento": "Huila",
      "total_municipios": 1,
      "icr_medio_ponderado": 42.5,
      "poblacion_total": 408218,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 1,
        "sin_alerta": 0,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "25",
      "departamento": "Cundinamarca",
      "total_municipios": 2,
      "icr_medio_ponderado": 42.1,
      "poblacion_total": 230762,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 1,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "73",
      "departamento": "Tolima",
      "total_municipios": 2,
      "icr_medio_ponderado": 41.2,
      "poblacion_total": 629269,
      "poblacion_naranja_roja": 71952,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 1,
        "amarilla": 0,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "13",
      "departamento": "Bolívar",
      "total_municipios": 3,
      "icr_medio_ponderado": 40.6,
      "poblacion_total": 1241048,
      "poblacion_naranja_roja": 77564,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 1,
        "amarilla": 1,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "47",
      "departamento": "Magdalena",
      "total_municipios": 2,
      "icr_medio_ponderado": 37.4,
      "poblacion_total": 664260,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 1,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "11",
      "departamento": "Bogotá, D.C.",
      "total_municipios": 1,
      "icr_medio_ponderado": 37.0,
      "poblacion_total": 7945996,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 0,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "76",
      "departamento": "Valle del Cauca",
      "total_municipios": 1,
      "icr_medio_ponderado": 25.1,
      "poblacion_total": 2269983,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 0,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "05",
      "departamento": "Antioquia",
      "total_municipios": 1,
      "icr_medio_ponderado": 22.0,
      "poblacion_total": 2526795,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 0,
        "sin_alerta": 1,
        "sin_dato": 0
      }
    },
    {
      "cod_depto": "68",
      "departamento": "Santander",
      "total_municipios": 3,
      "icr_medio_ponderado": 18.7,
      "poblacion_total": 702768,
      "poblacion_naranja_roja": 0,
      "conteo_niveles": {
        "roja": 0,
        "naranja": 0,
        "amarilla": 0,
        "sin_alerta": 3,
        "sin_dato": 0
      }
    }
  ],
  "alertas_activas": [
    {
      "id_alerta": "ALT-20261109-0001",
      "divipola": "44847",
      "municipio": "Uribia",
      "departamento": "La Guajira",
      "nivel": "naranja",
      "icr": 64.7,
      "motivo": "ICR crítico por déficit hídrico extremo",
      "estado_revision": "PENDIENTE_REVISION_CRA",
      "fecha_emision": "2026-11-09T01:04:15.569781+00:00",
      "prioridad": "MEDIA"
    },
    {
      "id_alerta": "ALT-20261109-0002",
      "divipola": "44560",
      "municipio": "Manaure",
      "departamento": "La Guajira",
      "nivel": "roja",
      "icr": 81.2,
      "motivo": "ICR crítico por déficit hídrico extremo",
      "estado_revision": "PENDIENTE_REVISION_CRA",
      "fecha_emision": "2026-11-09T01:04:15.569781+00:00",
      "prioridad": "ALTA"
    },
    {
      "id_alerta": "ALT-20261109-0003",
      "divipola": "13244",
      "municipio": "El Carmen de Bolívar",
      "departamento": "Bolívar",
      "nivel": "naranja",
      "icr": 64.3,
      "motivo": "ICR crítico por déficit hídrico extremo",
      "estado_revision": "PENDIENTE_REVISION_CRA",
      "fecha_emision": "2026-11-09T01:04:15.569781+00:00",
      "prioridad": "MEDIA"
    },
    {
      "id_alerta": "ALT-20261109-0004",
      "divipola": "73268",
      "municipio": "Espinal",
      "departamento": "Tolima",
      "nivel": "naranja",
      "icr": 62.3,
      "motivo": "ICR crítico por déficit hídrico extremo",
      "estado_revision": "PENDIENTE_REVISION_CRA",
      "fecha_emision": "2026-11-09T01:04:15.569781+00:00",
      "prioridad": "MEDIA"
    }
  ]
} };
