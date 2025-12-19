-- ============================================
-- RESET COMPLETO: Eliminar todo y crear correcto
-- ============================================

-- Eliminar TODAS las tablas que están mal
DROP TABLE IF EXISTS public.cotizaciones CASCADE;
DROP TABLE IF EXISTS public.custom_notifications CASCADE;
DROP TABLE IF EXISTS public.documentos CASCADE;
DROP TABLE IF EXISTS public.extras CASCADE;
DROP TABLE IF EXISTS public.operaciones CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.planes_pago CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.trole CASCADE;

-- Eliminar las que sí necesitamos pero están mal estructuradas
DROP TABLE IF EXISTS public.seguimientos CASCADE;
DROP TABLE IF EXISTS public.prospectos CASCADE;
DROP TABLE IF EXISTS public.propiedades CASCADE;
DROP TABLE IF EXISTS public.proyectos CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- CREAR TABLAS CORRECTAS (modelo original)
-- ============================================

-- USERS
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    role JSONB NOT NULL,
    empresa TEXT,
    empresaid UUID,
    estatus TEXT DEFAULT 'activo',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- EMPRESAS
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES public.users(id),
    nombre TEXT NOT NULL,
    estatus TEXT DEFAULT 'activo',
    correocontacto TEXT,
    telefono TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- PROYECTOS
CREATE TABLE public.proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES public.users(id),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    logo JSONB,
    render JSONB,
    imagenesProyecto JSONB DEFAULT '[]'::jsonb,
    amenidades TEXT[],
    unidades JSONB DEFAULT '[]'::jsonb,
    paymentPlans JSONB DEFAULT '[]'::jsonb,
    fechaEntrega TEXT,
    estatus TEXT DEFAULT 'activo',
    stacking JSONB,
    extrasOrder JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- PROPIEDADES
CREATE TABLE public.propiedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES public.users(id),
    tituloPropiedad TEXT NOT NULL,
    tipo TEXT,
    descripcion TEXT,
    estatus TEXT DEFAULT 'disponible',
    venta BOOLEAN DEFAULT true,
    precioVenta DECIMAL(15,2),
    comisionVenta DECIMAL(5,2),
    renta BOOLEAN DEFAULT false,
    precioRenta DECIMAL(15,2),
    comisionRenta DECIMAL(5,2),
    pais TEXT,
    estado TEXT,
    ciudad TEXT,
    colonia TEXT,
    calle TEXT,
    numero TEXT,
    interior TEXT,
    esquina TEXT,
    codigoPostal TEXT,
    exclusividad BOOLEAN DEFAULT false,
    comisionCompartida BOOLEAN DEFAULT false,
    comparte50 BOOLEAN DEFAULT false,
    condicionesCompartir TEXT,
    amenidades TEXT[],
    imagenes JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '{}'::jsonb,
    fechaCreacion TIMESTAMPTZ DEFAULT NOW(),
    fechaActualizacion TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- PROSPECTOS
CREATE TABLE public.prospectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES public.users(id),
    nombreCompleto TEXT NOT NULL,
    correoElectronico TEXT,
    celular TEXT,
    ocupacionCliente TEXT,
    edoCivilCliente TEXT,
    clasificacionCliente TEXT,
    medioCaptacion TEXT,
    comentarios TEXT,
    proyectosInteres TEXT[],
    estatusBaja BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- SEGUIMIENTOS
CREATE TABLE public.seguimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idprospecto UUID REFERENCES public.prospectos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.users(id),
    fechaProximoSeguimiento TEXT,
    unidadInteres TEXT,
    formaDePago TEXT,
    temperaturaInteres TEXT,
    comentarios TEXT,
    proyectoInteres TEXT,
    capacidadDePago TEXT,
    estatusSeguimiento TEXT,
    motivo TEXT[],
    historialSeguimiento JSONB DEFAULT '[]'::jsonb,
    pdfCotizaciones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Metadatos sync
    _version INTEGER DEFAULT 1,
    _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    _deleted BOOLEAN DEFAULT false
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_users_empresaid ON public.users(empresaid);
CREATE INDEX idx_users_deleted ON public.users(_deleted) WHERE _deleted = false;

CREATE INDEX idx_empresas_userid ON public.empresas(userid);
CREATE INDEX idx_empresas_deleted ON public.empresas(_deleted) WHERE _deleted = false;

CREATE INDEX idx_proyectos_userid ON public.proyectos(userid);
CREATE INDEX idx_proyectos_deleted ON public.proyectos(_deleted) WHERE _deleted = false;

CREATE INDEX idx_propiedades_userid ON public.propiedades(userid);
CREATE INDEX idx_propiedades_deleted ON public.propiedades(_deleted) WHERE _deleted = false;

CREATE INDEX idx_prospectos_userid ON public.prospectos(userid);
CREATE INDEX idx_prospectos_deleted ON public.prospectos(_deleted) WHERE _deleted = false;

CREATE INDEX idx_seguimientos_prospecto ON public.seguimientos(idprospecto);
CREATE INDEX idx_seguimientos_usuario ON public.seguimientos(usuario_id);
CREATE INDEX idx_seguimientos_deleted ON public.seguimientos(_deleted) WHERE _deleted = false;

-- ============================================
-- TRIGGERS para auto-incrementar _version
-- ============================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW._version = OLD._version + 1;
    NEW._last_synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_increment_version BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER empresas_increment_version BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER proyectos_increment_version BEFORE UPDATE ON public.proyectos
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER propiedades_increment_version BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER prospectos_increment_version BEFORE UPDATE ON public.prospectos
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER seguimientos_increment_version BEFORE UPDATE ON public.seguimientos
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proyectos_updated_at BEFORE UPDATE ON public.proyectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propiedades_updated_at BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospectos_updated_at BEFORE UPDATE ON public.prospectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seguimientos_updated_at BEFORE UPDATE ON public.seguimientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES (autenticación básica)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage users" ON public.users
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage empresas" ON public.empresas
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage proyectos" ON public.proyectos
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage propiedades" ON public.propiedades
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage prospectos" ON public.prospectos
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage seguimientos" ON public.seguimientos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- ✅ LISTO
-- ============================================
-- Tablas creadas:
-- - users
-- - empresas
-- - proyectos
-- - propiedades  
-- - prospectos
-- - seguimientos
--
-- Todas con:
-- ✅ Estructura del modelo original
-- ✅ Metadatos de sync (_version, _last_synced_at, _deleted)
-- ✅ RLS habilitado (autenticación básica)
-- ✅ Triggers automáticos
