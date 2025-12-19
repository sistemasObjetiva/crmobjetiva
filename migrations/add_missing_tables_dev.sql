-- ============================================
-- AGREGAR TABLAS FALTANTES AL PROYECTO DEV
-- ============================================
-- Ejecuta este archivo en el SQL Editor del proyecto DEV
-- https://supabase.com/dashboard/project/qdinhxiufvtcehbubvsw/sql/new

-- ============================================
-- TABLA: prospectos
-- ============================================
CREATE TABLE IF NOT EXISTS public.prospectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellido TEXT,
    email TEXT,
    telefono TEXT,
    telefono_secundario TEXT,
    empresa TEXT,
    puesto TEXT,
    origen TEXT,
    estado TEXT DEFAULT 'nuevo',
    prioridad TEXT DEFAULT 'media',
    notas TEXT,
    userid UUID REFERENCES public.users(id),
    proyecto_id UUID REFERENCES public.proyectos(id),
    fecha_contacto TIMESTAMPTZ DEFAULT NOW(),
    fecha_seguimiento TIMESTAMPTZ,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS PARA PROSPECTOS
-- ============================================
ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prospectos" ON public.prospectos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGER PARA UPDATED_AT
-- ============================================
CREATE TRIGGER update_prospectos_updated_at BEFORE UPDATE ON public.prospectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_prospectos_userid ON public.prospectos(userid);
CREATE INDEX idx_prospectos_proyecto ON public.prospectos(proyecto_id);
CREATE INDEX idx_prospectos_estado ON public.prospectos(estado);
CREATE INDEX idx_prospectos_fecha_seguimiento ON public.prospectos(fecha_seguimiento);

-- ============================================
-- VERIFICAR OTRAS TABLAS QUE PUEDAN FALTAR
-- ============================================

-- Si tienes tabla de presupuestos/cotizaciones adicionales
-- CREATE TABLE IF NOT EXISTS public.presupuestos (...);

-- ✅ LISTO!
-- Ahora prospectos funcionará correctamente
