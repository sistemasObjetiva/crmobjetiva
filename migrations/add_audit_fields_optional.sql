-- ============================================
-- AGREGAR CAMPOS DE AUDITORÍA (OPCIONALES)
-- ============================================
-- Versión compatible con datos existentes
-- Los campos son opcionales y se rellenan automáticamente
-- con triggers solo para NUEVOS registros
--
-- Ejecutar en DEV primero, luego en PROD cuando hagamos PR
-- ============================================

-- ============================================
-- FUNCIÓN HELPER PARA AGREGAR CAMPOS
-- ============================================
CREATE OR REPLACE FUNCTION add_audit_fields_to_table(table_name TEXT)
RETURNS void AS $$
BEGIN
  -- Agregar campos si no existen (todos opcionales)
  EXECUTE format('
    ALTER TABLE %I 
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id)
  ', table_name);
  
  RAISE NOTICE 'Campos de auditoría agregados a tabla: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APLICAR A TODAS LAS TABLAS
-- ============================================

SELECT add_audit_fields_to_table('users');
SELECT add_audit_fields_to_table('empresas');
SELECT add_audit_fields_to_table('proyectos');
SELECT add_audit_fields_to_table('propiedades');
SELECT add_audit_fields_to_table('prospectos');
SELECT add_audit_fields_to_table('clientes');
SELECT add_audit_fields_to_table('seguimientos');
SELECT add_audit_fields_to_table('cotizaciones');
SELECT add_audit_fields_to_table('operaciones');
SELECT add_audit_fields_to_table('pagos');
SELECT add_audit_fields_to_table('documentos');
SELECT add_audit_fields_to_table('planes_pago');
SELECT add_audit_fields_to_table('extras');

-- ============================================
-- TRIGGER AUTOMÁTICO SOLO PARA NUEVOS REGISTROS
-- ============================================
-- Este trigger NO modifica registros existentes
-- Solo captura auth.uid() en INSERT/UPDATE nuevos

CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- En INSERT: establecer created_by y updated_by si auth.uid() existe
  IF TG_OP = 'INSERT' THEN
    -- Solo establecer si hay usuario autenticado
    IF auth.uid() IS NOT NULL THEN
      NEW.created_by = COALESCE(NEW.created_by, auth.uid());
      NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
    END IF;
    
    -- Timestamps automáticos (preservar si ya existen)
    NEW.created_at = COALESCE(NEW.created_at, NOW());
    NEW.updated_at = COALESCE(NEW.updated_at, NOW());
  END IF;

  -- En UPDATE: actualizar updated_by solo si hay cambios
  IF TG_OP = 'UPDATE' THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.updated_by = auth.uid();
    END IF;
    NEW.updated_at = NOW();
    -- Preservar created_by y created_at originales
    NEW.created_by = OLD.created_by;
    NEW.created_at = OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APLICAR TRIGGER A TODAS LAS TABLAS
-- ============================================

-- Drop triggers si existen (para evitar duplicados)
DROP TRIGGER IF EXISTS audit_users ON public.users;
DROP TRIGGER IF EXISTS audit_empresas ON public.empresas;
DROP TRIGGER IF EXISTS audit_proyectos ON public.proyectos;
DROP TRIGGER IF EXISTS audit_propiedades ON public.propiedades;
DROP TRIGGER IF EXISTS audit_prospectos ON public.prospectos;
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
DROP TRIGGER IF EXISTS audit_seguimientos ON public.seguimientos;
DROP TRIGGER IF EXISTS audit_cotizaciones ON public.cotizaciones;
DROP TRIGGER IF EXISTS audit_operaciones ON public.operaciones;
DROP TRIGGER IF EXISTS audit_pagos ON public.pagos;
DROP TRIGGER IF EXISTS audit_documentos ON public.documentos;
DROP TRIGGER IF EXISTS audit_planes_pago ON public.planes_pago;
DROP TRIGGER IF EXISTS audit_extras ON public.extras;

-- Crear triggers nuevos
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
-- Solo para optimizar queries cuando los campos existen

CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users(created_by) 
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proyectos_created_by ON public.proyectos(created_by) 
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proyectos_deleted_at ON public.proyectos(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_propiedades_created_by ON public.propiedades(created_by) 
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_propiedades_deleted_at ON public.propiedades(deleted_at) 
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prospectos_created_by ON public.prospectos(created_by) 
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospectos_deleted_at ON public.prospectos(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver todas las tablas con campos de auditoría
SELECT 
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('created_by', 'updated_by', 'deleted_by', 'deleted_at')
ORDER BY table_name, column_name;

-- Ver todos los triggers de auditoría
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_%'
ORDER BY event_object_table;

-- ✅ LISTO! 
-- Registros existentes: Sin cambios, siguen funcionando
-- Registros nuevos: Auditoría automática completa
-- Compatibilidad: 100% backward compatible
