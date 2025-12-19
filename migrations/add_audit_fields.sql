-- ============================================
-- AGREGAR CAMPOS DE AUDITORÍA A TODAS LAS TABLAS
-- ============================================
-- Ejecuta este archivo en el SQL Editor del proyecto DEV
-- https://supabase.com/dashboard/project/qdinhxiufvtcehbubvsw/sql/new

-- ============================================
-- FUNCIÓN HELPER PARA AGREGAR CAMPOS
-- ============================================
CREATE OR REPLACE FUNCTION add_audit_fields_to_table(table_name TEXT)
RETURNS void AS $$
BEGIN
  -- Agregar created_by si no existe
  EXECUTE format('
    ALTER TABLE %I 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id)
  ', table_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APLICAR A TODAS LAS TABLAS
-- ============================================

-- Users
SELECT add_audit_fields_to_table('users');

-- Empresas
SELECT add_audit_fields_to_table('empresas');

-- Proyectos
SELECT add_audit_fields_to_table('proyectos');

-- Propiedades
SELECT add_audit_fields_to_table('propiedades');

-- Prospectos
SELECT add_audit_fields_to_table('prospectos');

-- Clientes
SELECT add_audit_fields_to_table('clientes');

-- Seguimientos
SELECT add_audit_fields_to_table('seguimientos');

-- Cotizaciones
SELECT add_audit_fields_to_table('cotizaciones');

-- Operaciones
SELECT add_audit_fields_to_table('operaciones');

-- Pagos
SELECT add_audit_fields_to_table('pagos');

-- Documentos
SELECT add_audit_fields_to_table('documentos');

-- Planes de pago
SELECT add_audit_fields_to_table('planes_pago');

-- Extras
SELECT add_audit_fields_to_table('extras');

-- ============================================
-- TRIGGER AUTOMÁTICO PARA AUDIT FIELDS
-- ============================================
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- En INSERT: establecer created_by y updated_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.updated_at = NOW();
  END IF;

  -- En UPDATE: actualizar updated_by
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    -- Preservar created_by original
    NEW.created_by = OLD.created_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APLICAR TRIGGER A TODAS LAS TABLAS
-- ============================================
CREATE TRIGGER audit_users BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_empresas BEFORE INSERT OR UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_proyectos BEFORE INSERT OR UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_propiedades BEFORE INSERT OR UPDATE ON public.propiedades
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_prospectos BEFORE INSERT OR UPDATE ON public.prospectos
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_clientes BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_seguimientos BEFORE INSERT OR UPDATE ON public.seguimientos
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_cotizaciones BEFORE INSERT OR UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_operaciones BEFORE INSERT OR UPDATE ON public.operaciones
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_pagos BEFORE INSERT OR UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_documentos BEFORE INSERT OR UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_planes_pago BEFORE INSERT OR UPDATE ON public.planes_pago
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

CREATE TRIGGER audit_extras BEFORE INSERT OR UPDATE ON public.extras
  FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- ============================================
-- ÍNDICES PARA QUERIES DE AUDITORÍA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON public.users(updated_by);

CREATE INDEX IF NOT EXISTS idx_proyectos_created_by ON public.proyectos(created_by);
CREATE INDEX IF NOT EXISTS idx_propiedades_created_by ON public.propiedades(created_by);
CREATE INDEX IF NOT EXISTS idx_prospectos_created_by ON public.prospectos(created_by);
CREATE INDEX IF NOT EXISTS idx_clientes_created_by ON public.clientes(created_by);

-- ✅ LISTO! 
-- Todas las tablas ahora tienen:
-- - created_by, updated_by, deleted_by
-- - Triggers automáticos
-- - deleted_at ya existía
-- - Trazabilidad completa
