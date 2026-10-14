-- =============================================================================
-- PROYECTO: Vigía El Niño · Acueductos (CRA)
-- QUERY_ID: SUI_EXT_03_COMERCIAL_SUSCRIPTORES_COBERTURA
-- VERSION: 1.0.0
-- DOMINIO: COMERCIAL_SUSCRIPTORES
-- FUENTE: SUI Oracle (SSPD) - Formato de Facturación Comercial
-- INDICADORES ASOCIADOS: 
--   S-3: Cobertura Urbana de Acueducto (%)
--   S-6: Consumo Facturado por Suscriptor (m³/suscriptor/mes)
-- DESCRIPCIÓN:
--   Extrae el número de suscriptores facturados y volúmenes de agua consumidos,
--   desagregados por clase de uso (Residencial estratos 1 a 6, Comercial, Industrial,
--   Oficial) y por zona (Urbana vs Rural). Cruza con la proyección de hogares del DANE
--   para calcular el indicador S-3 de cobertura efectiva.
--
-- REGLAS DE PRIVACIDAD Y SEGURIDAD:
--   - No extrae información de identificación de usuarios finales (nombres, cédulas,
--     direcciones físicas). Solo datos estadísticos agregados por estrato y APS.
--
-- PARÁMETROS:
--   :period_id -> Periodo mensual en formato 'YYYY-MM' (ej. '2026-08')
--   :vigencia_ano -> Año calendario para proyecciones DANE (ej. 2026)
-- =============================================================================

WITH comercial_estratificado AS (
    SELECT 
        c.ID_EMPRESA                                        AS id_prestador_rups,
        c.ID_APS                                            AS id_aps,
        LPAD(TRIM(aps.CODIGO_DANE_MUN), 5, '0')             AS divipola,
        c.PERIODO                                           AS periodo_reporte,
        c.USO_TARIFA                                        AS uso_tarifa,            -- 'RESIDENCIAL', 'COMERCIAL', 'INDUSTRIAL', 'OFICIAL'
        c.ESTRATO                                           AS estrato,               -- 1 a 6
        c.ZONA                                              AS zona,                  -- 'URBANA', 'RURAL'
        NVL(c.SUSCRIPTORES_FACTURADOS, 0)                   AS suscriptores_facturados,
        NVL(c.VOLUMEN_FACTURADO_M3, 0)                      AS volumen_facturado_m3,
        NVL(c.VALOR_FACTURADO_PESOS, 0)                     AS valor_facturado_pesos,
        NVL(c.SUBSIDIOS_APLICADOS_PESOS, 0)                 AS subsidios_pesos,
        NVL(c.CONTRIBUCIONES_PESOS, 0)                      AS contribuciones_pesos
    FROM SUI_AAA.CAR_COMERCIAL_RESUMEN c
    JOIN SUI_AAA.AREAS_PRESTACION_SERVICIO aps 
        ON c.ID_EMPRESA = aps.ID_EMPRESA AND c.ID_APS = aps.ID_APS
    WHERE c.PERIODO = :period_id
      AND c.SERVICIO = 'ACU'
),
agregado_municipal AS (
    SELECT 
        divipola,
        periodo_reporte,
        
        -- Totales Residenciales Urbanos (base para Cobertura S-3)
        SUM(CASE WHEN uso_tarifa = 'RESIDENCIAL' AND zona = 'URBANA' THEN suscriptores_facturados ELSE 0 END) 
            AS suscriptores_residenciales_urbanos,
            
        -- Totales Residenciales Globales
        SUM(CASE WHEN uso_tarifa = 'RESIDENCIAL' THEN suscriptores_facturados ELSE 0 END) 
            AS suscriptores_residenciales_total,
            
        -- Volúmenes residenciales (base para Consumo S-6)
        SUM(CASE WHEN uso_tarifa = 'RESIDENCIAL' THEN volumen_facturado_m3 ELSE 0 END) 
            AS volumen_residencial_m3,
            
        -- No residenciales (Comercial, Industrial, Oficial)
        SUM(CASE WHEN uso_tarifa != 'RESIDENCIAL' THEN suscriptores_facturados ELSE 0 END) 
            AS suscriptores_no_residenciales,
        SUM(CASE WHEN uso_tarifa != 'RESIDENCIAL' THEN volumen_facturado_m3 ELSE 0 END) 
            AS volumen_no_residencial_m3,
            
        -- Gran total
        SUM(suscriptores_facturados)                        AS gran_total_suscriptores,
        SUM(volumen_facturado_m3)                           AS gran_total_volumen_m3
    FROM comercial_estratificado
    GROUP BY divipola, periodo_reporte
),
hogares_dane AS (
    SELECT 
        LPAD(TRIM(CODIGO_MUNICIPIO), 5, '0')                AS divipola,
        NVL(TOTAL_HOGARES_URBANOS, 1)                       AS hogares_urbanos_proyectados,
        NVL(TOTAL_POBLACION_CABECERA, 1)                    AS poblacion_urbana_proyectada
    FROM SUI_AAA.DANE_PROYECCIONES_HOGARES
    WHERE VIGENCIA = :vigencia_ano
)
SELECT 
    m.divipola,
    m.periodo_reporte,
    m.suscriptores_residenciales_urbanos,
    d.hogares_urbanos_proyectados,
    
    -- Indicador S-3: Cobertura Urbana de Acueducto (%)
    -- Acotado a un máximo de 100% en caso de sobre-suscripción por micropolígonos
    LEAST(
        ROUND((m.suscriptores_residenciales_urbanos / NULLIF(d.hogares_urbanos_proyectados, 0)) * 100, 2),
        100.00
    )                                                       AS valor_indicador_s3_cobertura_pct,
    
    -- Indicador S-6: Consumo Facturado Promedio (m³/suscriptor/mes)
    ROUND(
        m.volumen_residencial_m3 / NULLIF(m.suscriptores_residenciales_total, 0),
        2
    )                                                       AS valor_indicador_s6_consumo_medio,
    
    m.gran_total_suscriptores,
    m.gran_total_volumen_m3,
    
    -- Banda de alerta S-3 según umbrales CRA (specs/indicadores.md)
    -- Óptimo: 100% -> 0; Amarilla: 95% -> 40; Naranja: 85% -> 60; Roja: 70% -> 75; Extremo: 40% -> 100
    CASE 
        WHEN (m.suscriptores_residenciales_urbanos / NULLIF(d.hogares_urbanos_proyectados, 0)) * 100 >= 95.0 THEN 'SIN_ALERTA'
        WHEN (m.suscriptores_residenciales_urbanos / NULLIF(d.hogares_urbanos_proyectados, 0)) * 100 >= 85.0 THEN 'AMARILLA'
        WHEN (m.suscriptores_residenciales_urbanos / NULLIF(d.hogares_urbanos_proyectados, 0)) * 100 >= 70.0 THEN 'NARANJA'
        WHEN (m.suscriptores_residenciales_urbanos / NULLIF(d.hogares_urbanos_proyectados, 0)) * 100 < 70.0  THEN 'ROJA'
        ELSE 'SIN_DATO'
    END                                                     AS banda_alerta_s3,
    
    SYSDATE                                                 AS fecha_extraccion_sui
FROM agregado_municipal m
LEFT JOIN hogares_dane d 
    ON m.divipola = d.divipola
ORDER BY m.divipola;
