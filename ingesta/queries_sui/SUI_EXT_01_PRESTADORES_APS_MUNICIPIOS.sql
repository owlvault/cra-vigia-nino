-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_01_PRESTADORES_APS_MUNICIPIOS
-- VERSION: 1.0.0
-- DOMINIO: CATASTRO_PRESTADORES_APS
-- FUENTE: SUI Oracle (SSPD) - Esquema SUI_AAA
-- INDICADORES ASOCIADOS: dim_prestador, dim_territorio, base para S-1, S-3, S-4, R-1
-- DESCRIPCIÓN:
--   Extrae el catastro oficial del Registro Único de Prestadores de Servicios (RUPS),
--   las Áreas de Prestación de Servicio (APS) activas para el servicio de acueducto,
--   y su vinculación exacta con los códigos DIVIPOLA de 5 caracteres del DANE.
--
-- REGLAS DE NEGOCIO (specs/modelo-territorial.md):
--   - Todo código municipal debe formatearse a 5 dígitos con ceros a la izquierda (LPAD).
--   - Filtra exclusivamente prestadores con servicio de Acueducto ('ACU').
--   - Maneja prestadores con múltiples APS en un mismo municipio o que operan en varios municipios.
--
-- PARÁMETROS:
--   :period_id        -> Periodo de consulta en formato 'YYYY-MM' (ej. '2026-08')
--   :cod_departamento -> Filtro opcional de departamento a 2 dígitos o 'TODOS'
-- =============================================================================

SELECT 
    -- Identificación del prestador
    p.ID_EMPRESA                                        AS id_prestador_rups,
    TRIM(p.NIT)                                         AS nit_prestador,
    TRIM(p.NOMBRE_COMERCIAL)                            AS nombre_prestador,
    TRIM(p.RAZON_SOCIAL)                               AS razon_social,
    p.NATURALEZA_JURIDICA                               AS naturaleza_juridica,
    p.ESTADO_EMPRESA                                    AS estado_empresa,        -- 'ACTIVA', 'EN_LIQUIDACION', etc.
    p.SEGMENTO_TAMANO                                   AS segmento_prestador,     -- 'PRIMER_SEGMENTO', 'SEGUNDO_SEGMENTO', 'RURAL'
    
    -- Área de Prestación de Servicio (APS)
    aps.ID_APS                                          AS id_aps,
    TRIM(aps.NOMBRE_APS)                                AS nombre_aps,
    aps.TIPO_AREA                                       AS tipo_area,             -- 'URBANA', 'RURAL', 'MIXTA'
    aps.SERVICIO                                        AS codigo_servicio,       -- 'ACU'
    
    -- Ubicación territorial y DIVIPOLA
    LPAD(TRIM(aps.CODIGO_DANE_DEPTO), 2, '0')           AS cod_depto,
    LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola,
    TRIM(m.NOMBRE_MUNICIPIO)                            AS nombre_municipio,
    TRIM(d.NOMBRE_DEPARTAMENTO)                         AS nombre_departamento,
    
    -- Dimensión operativa
    NVL(aps.TOTAL_SUSCRIPTORES, 0)                      AS suscriptores_aps,
    NVL(aps.POBLACION_ATENDIDA, 0)                      AS poblacion_atendida_aps,
    
    -- Metadatos de auditoría y captura
    :period_id                                          AS periodo_reporte,
    SYSDATE                                             AS fecha_extraccion_sui,
    'SUI_AAA.EMPRESAS_PRESTADORAS'                      AS tabla_origen
FROM SUI_AAA.EMPRESAS_PRESTADORAS p
JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
    ON p.ID_EMPRESA = aps.ID_EMPRESA
LEFT JOIN SUI_AAA.DIVIPOLA_MUNICIPIOS m 
    ON LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0') = LPAD(TRIM(m.CODIGO_MUNICIPIO), 5, '0')
LEFT JOIN SUI_AAA.DIVIPOLA_DEPARTAMENTOS d 
    ON LPAD(TRIM(aps.CODIGO_DANE_DEPTO), 2, '0') = LPAD(TRIM(d.CODIGO_DEPARTAMENTO), 2, '0')
WHERE aps.SERVICIO = 'ACU'
  AND p.ESTADO_EMPRESA = 'ACTIVA'
  AND (aps.PERIODO_VIGENCIA = :period_id OR aps.PERIODO_VIGENCIA IS NULL)
  AND (:cod_departamento = 'TODOS' OR LPAD(TRIM(aps.CODIGO_DANE_DEPTO), 2, '0') = :cod_departamento)
ORDER BY 
    divipola, 
    id_prestador_rups, 
    id_aps;
