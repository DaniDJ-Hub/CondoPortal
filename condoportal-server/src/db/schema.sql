-- CondoPortal · esquema PostgreSQL / Supabase
-- Sprint 3 — "Implementación de base de datos real con PostgreSQL/Supabase".
--
-- Aplicar con:  psql "$DATABASE_URL" -f src/db/schema.sql
-- o pegándolo en el SQL Editor de Supabase.

DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS negocios CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS cuotas CASCADE;
DROP TABLE IF EXISTS gastos CASCADE;
DROP TABLE IF EXISTS puntos_interes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  rol           TEXT        NOT NULL DEFAULT 'residente'
                CHECK (rol IN ('admin', 'residente', 'proveedor')),
  unidad        TEXT,
  telefono      TEXT,
  activo        BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gastos (
  id          SERIAL PRIMARY KEY,
  descripcion TEXT           NOT NULL,
  categoria   TEXT           NOT NULL
              CHECK (categoria IN ('mantenimiento', 'servicios', 'seguridad', 'administracion', 'otros')),
  monto       NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  fecha       DATE           NOT NULL,
  proveedor   TEXT,
  creado_por  INTEGER        REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gastos_categoria ON gastos (categoria);
CREATE INDEX idx_gastos_fecha     ON gastos (fecha DESC);

CREATE TABLE cuotas (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  periodo    TEXT           NOT NULL,          -- 'YYYY-MM'
  concepto   TEXT           NOT NULL,
  monto      NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  vence_en   DATE           NOT NULL,
  estatus    TEXT           NOT NULL DEFAULT 'pendiente'
             CHECK (estatus IN ('pendiente', 'parcial', 'pagada', 'vencida'))
);

CREATE INDEX idx_cuotas_usuario ON cuotas (usuario_id, estatus);

CREATE TABLE pagos (
  id         SERIAL PRIMARY KEY,
  usuario_id INTEGER        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cuota_id   INTEGER        REFERENCES cuotas(id) ON DELETE SET NULL,
  monto      NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  concepto   TEXT           NOT NULL,
  metodo     TEXT           NOT NULL DEFAULT 'transferencia'
             CHECK (metodo IN ('transferencia', 'tarjeta', 'efectivo', 'domiciliacion')),
  referencia TEXT,
  estatus    TEXT           NOT NULL DEFAULT 'aplicado'
             CHECK (estatus IN ('aplicado', 'pendiente', 'rechazado')),
  fecha      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_usuario ON pagos (usuario_id, fecha DESC);

CREATE TABLE negocios (
  id           SERIAL PRIMARY KEY,
  proveedor_id INTEGER     REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre       TEXT        NOT NULL,
  categoria    TEXT        NOT NULL,
  descripcion  TEXT        NOT NULL DEFAULT '',
  telefono     TEXT,
  email        TEXT,
  sitio_web    TEXT,
  horario      TEXT,
  emblema      TEXT,
  destacado    BOOLEAN     NOT NULL DEFAULT FALSE,
  activo       BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_negocios_categoria ON negocios (categoria) WHERE activo;

CREATE TABLE resenas (
  id           SERIAL PRIMARY KEY,
  negocio_id   INTEGER     NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  calificacion INTEGER     NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario   TEXT        NOT NULL DEFAULT '',
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (negocio_id, usuario_id)
);

CREATE TABLE puntos_interes (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT    NOT NULL,
  categoria   TEXT    NOT NULL,
  emblema     TEXT,
  descripcion TEXT    NOT NULL DEFAULT '',
  distancia_m INTEGER NOT NULL DEFAULT 0,
  -- Posición en el plano, en porcentaje del ancho / alto (0-100).
  x           NUMERIC(5, 2) NOT NULL,
  y           NUMERIC(5, 2) NOT NULL
);
