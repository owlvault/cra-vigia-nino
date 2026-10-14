-- =============================================================================
-- Modelo de almacenamiento — Comparativo semanal El Niño (V-08)
-- Proyecto: Vigía El Niño · Acueductos (CRA)
-- Spec: context-lake/specs/comparativo-semanal.md
-- Decisión: ADR-0003 (medallón bronce/plata/oro + config versionada)
--
-- Destino objetivo PostgreSQL 16. La v1 materializa estas mismas entidades en
-- JSON bajo data/<zona>/semanal/ (ver ingesta/semanal/modelo_semanal.py).
-- Fechas en UTC (timestamptz); presentación en America/Bogota.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS config;
CREATE SCHEMA IF NOT EXISTS plata;
CREATE SCHEMA IF NOT EXISTS oro;
CREATE SCHEMA IF NOT EXISTS ops;

-- -----------------------------------------------------------------------------
-- CONFIG — catálogo versionado (cada cambio crea fila nueva con vigente_desde)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config.variable_semanal (
    codigo              varchar(40)   NOT NULL,
    vigente_desde       timestamptz   NOT NULL,
    version_config      varchar(40)   NOT NULL,
    grupo               varchar(20)   NOT NULL CHECK (grupo IN ('amenaza','colombia','riesgo')),
    nombre              varchar(120)  NOT NULL,
    descripcion         text,
    unidad              varchar(20)   NOT NULL,
    decimales           smallint      NOT NULL DEFAULT 1,
    fuente              varchar(120)  NOT NULL,
    origen              varchar(40)   NOT NULL,          -- noaa_semanal | noaa_oni | bronce_xm | bronce_ideam | bronce_firms | oro_corte
    campo               varchar(80)   NOT NULL,
    agregacion          varchar(30)   NOT NULL CHECK (agregacion IN ('ultimo','promedio','suma_ultima_captura','arrastre')),
    direccion           varchar(20)   NOT NULL CHECK (direccion IN ('sube_empeora','baja_empeora')),
    tolerancia_estable  numeric(14,4) NOT NULL DEFAULT 0,
    en_analogos         boolean       NOT NULL DEFAULT false,
    niveles             jsonb         NOT NULL DEFAULT '[]'::jsonb,  -- [{desde,hasta,etiqueta,riesgo}]
    PRIMARY KEY (codigo, vigente_desde)
);

CREATE TABLE IF NOT EXISTS config.evento_analogo (
    id_evento      varchar(20)  PRIMARY KEY,           -- '2015-16'
    nombre         varchar(80)  NOT NULL,
    desde          date         NOT NULL,              -- ventana de búsqueda del inicio
    hasta          date         NOT NULL,
    oni_pico       numeric(4,2),
    nota           text,
    vigente_desde  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config.parametro_semanal (
    clave          varchar(60)  NOT NULL,              -- umbral_inicio_c, semanas_consecutivas_inicio, semana_inicio_seguimiento...
    valor          jsonb        NOT NULL,
    vigente_desde  timestamptz  NOT NULL,
    PRIMARY KEY (clave, vigente_desde)
);

-- -----------------------------------------------------------------------------
-- ORO — dimensión semana (ISO-8601, lunes a domingo, America/Bogota)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oro.dim_semana (
    semana_iso     char(8)   PRIMARY KEY,              -- '2026-W41'
    anio_iso       smallint  NOT NULL,
    numero         smallint  NOT NULL CHECK (numero BETWEEN 1 AND 53),
    inicio         date      NOT NULL,                 -- lunes
    fin            date      NOT NULL,                 -- domingo
    UNIQUE (anio_iso, numero)
);

-- -----------------------------------------------------------------------------
-- PLATA — observación semanal agregada (reconstruible desde bronce y cortes oro)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plata.obs_variable_semana (
    semana_iso       char(8)       NOT NULL REFERENCES oro.dim_semana(semana_iso),
    codigo           varchar(40)   NOT NULL,
    ambito           varchar(20)   NOT NULL DEFAULT 'nacional',   -- nacional | muestra | cod_depto | divipola
    valor            numeric(16,4),                               -- NULL = sin_dato (nunca 0)
    estado_dato      varchar(12)   NOT NULL CHECK (estado_dato IN ('dato','arrastre','sin_dato')),
    fecha_dato       date,
    n_obs            integer       NOT NULL DEFAULT 0,
    tamano_muestra   integer,                                     -- n.º de municipios cuando ambito='muestra'
    fuente           varchar(120)  NOT NULL,
    origen_bronce    text,                                        -- ruta/_captura_id del crudo usado
    calculado_en     timestamptz   NOT NULL DEFAULT now(),
    PRIMARY KEY (semana_iso, codigo, ambito),
    CHECK ((estado_dato = 'sin_dato') = (valor IS NULL))
);

-- -----------------------------------------------------------------------------
-- ORO — corte semanal (versión publicada del comparativo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oro.corte_semanal (
    semana_iso       char(8)       PRIMARY KEY REFERENCES oro.dim_semana(semana_iso),
    generado_en      timestamptz   NOT NULL,
    version_config   varchar(40)   NOT NULL,
    hash_entradas    char(64)      NOT NULL,
    estado           varchar(12)   NOT NULL CHECK (estado IN ('abierta','cerrada','rechazada')),
    inicio_evento    char(8),                                     -- semana ISO de inicio del evento vigente
    id_ejecucion     uuid
);

CREATE TABLE IF NOT EXISTS oro.fct_variable_semana (
    semana_iso         char(8)       NOT NULL REFERENCES oro.dim_semana(semana_iso),
    codigo             varchar(40)   NOT NULL,
    semana_evento      smallint,
    valor              numeric(16,4),
    estado_dato        varchar(12)   NOT NULL,
    semana_referencia  char(8),                                   -- por defecto semana anterior
    valor_referencia   numeric(16,4),
    delta_abs          numeric(16,4),
    delta_pct          numeric(10,2),
    tendencia          varchar(10)   NOT NULL CHECK (tendencia IN ('empeora','mejora','estable','sin_dato')),
    nivel_etiqueta     varchar(40),
    nivel_riesgo       varchar(10),                               -- sin | amarilla | naranja | roja
    fecha_dato         date,
    fuente             varchar(120)  NOT NULL,
    version_config     varchar(40)   NOT NULL,
    PRIMARY KEY (semana_iso, codigo)
);

CREATE TABLE IF NOT EXISTS oro.fct_analogo_semana (
    id_evento      varchar(20)  NOT NULL REFERENCES config.evento_analogo(id_evento),
    codigo         varchar(40)  NOT NULL,
    semana_evento  smallint     NOT NULL,
    semana_iso     char(8)      NOT NULL,                         -- semana histórica original
    valor          numeric(8,2) NOT NULL,
    PRIMARY KEY (id_evento, codigo, semana_evento)
);

CREATE TABLE IF NOT EXISTS oro.fct_depto_semana (
    semana_iso             char(8)      NOT NULL REFERENCES oro.dim_semana(semana_iso),
    cod_depto              char(2)      NOT NULL,
    departamento           varchar(80)  NOT NULL,
    fecha_corte            date         NOT NULL,                 -- corte diario usado (último de la semana)
    icr_medio_ponderado    numeric(5,1),
    poblacion_total        bigint,
    poblacion_naranja_roja bigint,
    total_municipios       integer,
    conteo_niveles         jsonb        NOT NULL,
    PRIMARY KEY (semana_iso, cod_depto)
);

CREATE INDEX IF NOT EXISTS ix_fct_variable_semana_codigo ON oro.fct_variable_semana (codigo, semana_iso);
CREATE INDEX IF NOT EXISTS ix_fct_depto_semana_depto     ON oro.fct_depto_semana (cod_depto, semana_iso);

-- -----------------------------------------------------------------------------
-- OPS — bitácora append-only del botón «Actualizar datos»
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ops.ejecucion_semanal (
    id_ejecucion   uuid          PRIMARY KEY,
    modo           varchar(12)   NOT NULL CHECK (modo IN ('completo','recalculo')),
    solicitado_por varchar(120),                                  -- usuario OIDC cuando exista Keycloak
    inicio         timestamptz   NOT NULL,
    fin            timestamptz,
    estado         varchar(12)   NOT NULL CHECK (estado IN ('en_ejecucion','exitoso','parcial','fallido')),
    pasos          jsonb         NOT NULL DEFAULT '[]'::jsonb,
    hash_entradas  char(64),
    semana_publicada char(8),
    mensaje        text
);

-- Solo una ejecución activa a la vez (AGENTS.md: máx. 1 ejecución activa)
CREATE UNIQUE INDEX IF NOT EXISTS ux_ejecucion_semanal_activa
    ON ops.ejecucion_semanal ((estado)) WHERE estado = 'en_ejecucion';

-- -----------------------------------------------------------------------------
-- Vista de consumo para la API: comparativo de la semana foco vs la referencia
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW oro.v_comparativo_semanal AS
SELECT f.semana_iso, d.inicio, d.fin, f.codigo, v.nombre, v.unidad, v.grupo,
       f.valor, f.valor_referencia, f.delta_abs, f.delta_pct, f.tendencia,
       f.nivel_etiqueta, f.nivel_riesgo, f.estado_dato, f.fecha_dato, f.fuente
FROM oro.fct_variable_semana f
JOIN oro.dim_semana d USING (semana_iso)
JOIN LATERAL (
    SELECT * FROM config.variable_semanal c
    WHERE c.codigo = f.codigo
    ORDER BY c.vigente_desde DESC LIMIT 1
) v ON true;
