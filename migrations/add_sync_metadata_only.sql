-- ============================================
-- SOLO AGREGAR METADATOS DE SYNC
-- NO cambiar estructura existente
-- ============================================

-- ============================================
-- FUNCIÓN para incrementar versión
-- ============================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW._version = OLD._version + 1;
    NEW._last_synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EMPRESAS - Solo metadatos
-- ============================================
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_empresas_deleted ON public.empresas(_deleted) WHERE _deleted = false;

DROP TRIGGER IF EXISTS empresas_increment_version ON public.empresas;
CREATE TRIGGER empresas_increment_version 
BEFORE UPDATE ON public.empresas
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- PROYECTOS - Solo metadatos
-- ============================================
ALTER TABLE public.proyectos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_proyectos_deleted ON public.proyectos(_deleted) WHERE _deleted = false;

DROP TRIGGER IF EXISTS proyectos_increment_version ON public.proyectos;
CREATE TRIGGER proyectos_increment_version 
BEFORE UPDATE ON public.proyectos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- PROPIEDADES - Solo metadatos
-- ============================================
ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_propiedades_deleted ON public.propiedades(_deleted) WHERE _deleted = false;

DROP TRIGGER IF EXISTS propiedades_increment_version ON public.propiedades;
CREATE TRIGGER propiedades_increment_version 
BEFORE UPDATE ON public.propiedades
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- PROSPECTOS - Solo metadatos
-- ============================================
ALTER TABLE public.prospectos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prospectos_deleted ON public.prospectos(_deleted) WHERE _deleted = false;

DROP TRIGGER IF EXISTS prospectos_increment_version ON public.prospectos;
CREATE TRIGGER prospectos_increment_version 
BEFORE UPDATE ON public.prospectos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- SEGUIMIENTOS - Solo metadatos
-- ============================================
ALTER TABLE public.seguimientos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_seguimientos_deleted ON public.seguimientos(_deleted) WHERE _deleted = false;

DROP TRIGGER IF EXISTS seguimientos_increment_version ON public.seguimientos;
CREATE TRIGGER seguimientos_increment_version 
BEFORE UPDATE ON public.seguimientos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- ✅ LISTO
-- ============================================
-- Solo se agregaron 3 columnas a cada tabla:
-- - _version: Para control de conflictos
-- - _last_synced_at: Para saber última sync
-- - _deleted: Para soft delete
--
-- Y un trigger que auto-incrementa _version en cada UPDATE
