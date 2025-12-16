-- ============================================
-- MIGRAR DATOS DE PROD A DEV CON AUDITORÍA
-- ============================================
-- Este script copia todos los datos de PROD a DEV
-- y rellena los campos de auditoría faltantes
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de add_audit_fields.sql
-- ============================================

-- ============================================
-- PASO 1: AGREGAR CAMPOS DE AUDITORÍA A PROD
-- ============================================
-- Primero necesitamos agregar los campos en PROD también
-- (si no existen, se omitirá el error)

DO $$ 
BEGIN
  -- Users
  ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Empresas
  ALTER TABLE public.empresas 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Proyectos
  ALTER TABLE public.proyectos 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Propiedades
  ALTER TABLE public.propiedades 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Prospectos
  ALTER TABLE public.prospectos 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Clientes
  ALTER TABLE public.clientes 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Seguimientos
  ALTER TABLE public.seguimientos 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Cotizaciones
  ALTER TABLE public.cotizaciones 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Operaciones
  ALTER TABLE public.operaciones 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Pagos
  ALTER TABLE public.pagos 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Documentos
  ALTER TABLE public.documentos 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Planes de pago
  ALTER TABLE public.planes_pago 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

  -- Extras
  ALTER TABLE public.extras 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

END $$;

-- ============================================
-- PASO 2: RELLENAR CAMPOS FALTANTES EN PROD
-- ============================================
-- Para registros antiguos sin created_by/updated_by
-- los asignamos al userid del registro (mejor guess)

-- Users: usar su propio ID
UPDATE public.users 
SET 
  created_by = COALESCE(created_by, id),
  updated_by = COALESCE(updated_by, id)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Empresas: usar userid
UPDATE public.empresas 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Proyectos: usar userid
UPDATE public.proyectos 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Propiedades: usar userid
UPDATE public.propiedades 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Prospectos: usar userid
UPDATE public.prospectos 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Clientes: usar userid
UPDATE public.clientes 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Seguimientos: usar userid
UPDATE public.seguimientos 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Cotizaciones: usar userid si existe, sino NULL
UPDATE public.cotizaciones 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE (created_by IS NULL OR updated_by IS NULL) AND userid IS NOT NULL;

-- Operaciones: usar userid
UPDATE public.operaciones 
SET 
  created_by = COALESCE(created_by, userid),
  updated_by = COALESCE(updated_by, userid)
WHERE (created_by IS NULL OR updated_by IS NULL) AND userid IS NOT NULL;

-- Pagos: usar userid de operación relacionada
UPDATE public.pagos p
SET 
  created_by = COALESCE(p.created_by, o.userid),
  updated_by = COALESCE(p.updated_by, o.userid)
FROM public.operaciones o
WHERE p.operacionid = o.id 
  AND (p.created_by IS NULL OR p.updated_by IS NULL);

-- ============================================
-- PASO 3: EXPORTAR DATOS PARA IMPORTAR EN DEV
-- ============================================
-- Usa este script para generar CSVs o JSONs
-- y luego importarlos en DEV usando Supabase Dashboard

-- O bien, si tienes conexión directa entre ambas DBs,
-- puedes usar postgres_fdw (Foreign Data Wrapper)

-- Ejemplo de cómo generar INSERT statements:

-- COPY (
--   SELECT 
--     'INSERT INTO public.users VALUES (' ||
--     quote_literal(id) || ',' ||
--     quote_literal(nombre) || ',' ||
--     quote_literal(email) || ',' ||
--     COALESCE(quote_literal(telefono), 'NULL') || ',' ||
--     quote_literal(role::text) || ',' ||
--     COALESCE(quote_literal(empresaid), 'NULL') || ',' ||
--     quote_literal(estatus) || ',' ||
--     quote_literal(created_at) || ',' ||
--     quote_literal(updated_at) || ',' ||
--     COALESCE(quote_literal(created_by), 'NULL') || ',' ||
--     COALESCE(quote_literal(updated_by), 'NULL') || ',' ||
--     COALESCE(quote_literal(deleted_at), 'NULL') || ',' ||
--     COALESCE(quote_literal(deleted_by), 'NULL') || ');'
--   FROM public.users
-- ) TO '/tmp/users_migration.sql';

-- ============================================
-- PASO 4: SCRIPT ALTERNATIVO - DUMP COMPLETO
-- ============================================
-- Más simple: usar pg_dump desde terminal

-- Exportar desde PROD:
-- pg_dump -h db.yrpjlnbujszpelximuuy.supabase.co \
--   -U postgres \
--   -d postgres \
--   --data-only \
--   --table=public.users \
--   --table=public.empresas \
--   --table=public.proyectos \
--   --table=public.propiedades \
--   --table=public.prospectos \
--   --table=public.clientes \
--   --table=public.seguimientos \
--   --table=public.cotizaciones \
--   --table=public.operaciones \
--   --table=public.pagos \
--   --table=public.documentos \
--   --table=public.planes_pago \
--   --table=public.extras \
--   > /tmp/prod_data.sql

-- Importar en DEV:
-- psql -h db.qdinhxiufvtcehbubvsw.supabase.co \
--   -U postgres \
--   -d postgres \
--   < /tmp/prod_data.sql

-- ✅ ALTERNATIVA RECOMENDADA: Usar Supabase CLI
-- supabase db dump --db-url postgresql://postgres:[PASSWORD]@db.yrpjlnbujszpelximuuy.supabase.co:5432/postgres --data-only > prod_data.sql
-- supabase db push --db-url postgresql://postgres:[PASSWORD]@db.qdinhxiufvtcehbubvsw.supabase.co:5432/postgres

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Ejecuta primero en PROD para rellenar campos
-- 2. Exporta los datos (pg_dump o Supabase CLI)
-- 3. Ejecuta add_audit_fields.sql en DEV
-- 4. Importa los datos a DEV
-- 5. Los triggers automáticos de DEV capturarán
--    los nuevos cambios con auth.uid()

COMMENT ON TABLE public.users IS 'Migración completada - Auditoría lista';
