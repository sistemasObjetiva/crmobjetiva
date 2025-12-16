-- ============================================
-- MIGRACIÓN COMPLETA: PROD → DEV
-- ============================================
-- Ejecuta este archivo completo en el SQL Editor de tu proyecto DEV
-- https://supabase.com/dashboard/project/qdinhxiufvteehbubvsw/sql/new

-- ============================================
-- 1. EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. TABLA: users (información adicional de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    role JSONB NOT NULL,  -- JSON para mantener compatibilidad con prod
    empresa TEXT,  -- Nombre de empresa en texto
    empresaid UUID,  -- ID de empresa
    estatus TEXT DEFAULT 'activo',
    avatar_url TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: empresas
-- ============================================
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    rfc TEXT UNIQUE,
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: proyectos
-- ============================================
CREATE TABLE IF NOT EXISTS public.proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    ciudad TEXT,
    estado TEXT,
    codigo_postal TEXT,
    tipo TEXT CHECK (tipo IN ('residencial', 'comercial', 'mixto', 'industrial')),
    estado_proyecto TEXT DEFAULT 'activo' CHECK (estado_proyecto IN ('planeacion', 'construccion', 'activo', 'completado', 'suspendido')),
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    empresa_id UUID REFERENCES public.empresas(id),
    logo_url TEXT,
    imagenes JSONB DEFAULT '[]'::jsonb,
    amenidades TEXT[],
    total_unidades INTEGER DEFAULT 0,
    unidades_disponibles INTEGER DEFAULT 0,
    precio_desde DECIMAL(15,2),
    precio_hasta DECIMAL(15,2),
    configuracion JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABLA: propiedades/unidades
-- ============================================
CREATE TABLE IF NOT EXISTS public.propiedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT,
    tipo TEXT CHECK (tipo IN ('casa', 'departamento', 'local', 'oficina', 'terreno', 'bodega')),
    nivel TEXT,
    torre TEXT,
    m2_construccion DECIMAL(10,2),
    m2_terreno DECIMAL(10,2),
    recamaras INTEGER,
    banos INTEGER,
    estacionamientos INTEGER,
    precio DECIMAL(15,2) NOT NULL,
    precio_m2 DECIMAL(10,2),
    estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'apartado', 'vendido', 'bloqueado')),
    descripcion TEXT,
    caracteristicas JSONB DEFAULT '{}'::jsonb,
    imagenes JSONB DEFAULT '[]'::jsonb,
    planos JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(proyecto_id, codigo)
);

-- ============================================
-- 6. TABLA: clientes/prospectos
-- ============================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT,
    telefono TEXT NOT NULL,
    telefono_secundario TEXT,
    rfc TEXT,
    curp TEXT,
    fecha_nacimiento DATE,
    ocupacion TEXT,
    empresa TEXT,
    ingreso_mensual DECIMAL(15,2),
    direccion TEXT,
    ciudad TEXT,
    estado TEXT,
    codigo_postal TEXT,
    tipo TEXT DEFAULT 'prospecto' CHECK (tipo IN ('prospecto', 'cliente', 'lead')),
    origen TEXT CHECK (origen IN ('referido', 'web', 'redes_sociales', 'evento', 'llamada', 'walk_in', 'otro')),
    prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
    notas TEXT,
    usuario_asignado_id UUID REFERENCES public.users(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLA: seguimientos
-- ============================================
CREATE TABLE IF NOT EXISTS public.seguimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.users(id),
    tipo TEXT CHECK (tipo IN ('llamada', 'email', 'whatsapp', 'visita', 'reunion', 'nota')),
    estado TEXT CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
    descripcion TEXT,
    fecha_programada TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ,
    resultado TEXT,
    proximo_seguimiento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABLA: cotizaciones
-- ============================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio TEXT UNIQUE NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    propiedad_id UUID REFERENCES public.propiedades(id),
    usuario_id UUID REFERENCES public.users(id),
    precio_base DECIMAL(15,2) NOT NULL,
    descuento DECIMAL(15,2) DEFAULT 0,
    extras JSONB DEFAULT '[]'::jsonb,
    subtotal DECIMAL(15,2),
    total DECIMAL(15,2) NOT NULL,
    plan_pago TEXT CHECK (plan_pago IN ('contado', 'credito', 'financiamiento', 'mixto')),
    enganche DECIMAL(15,2),
    plazo_meses INTEGER,
    mensualidad DECIMAL(15,2),
    estado TEXT DEFAULT 'vigente' CHECK (estado IN ('borrador', 'vigente', 'aprobada', 'rechazada', 'vencida')),
    vigencia_dias INTEGER DEFAULT 30,
    fecha_vencimiento DATE,
    notas TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TABLA: operaciones/ventas
-- ============================================
CREATE TABLE IF NOT EXISTS public.operaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio TEXT UNIQUE NOT NULL,
    tipo TEXT CHECK (tipo IN ('venta', 'apartado', 'renta')),
    cliente_id UUID REFERENCES public.clientes(id),
    propiedad_id UUID REFERENCES public.propiedades(id),
    cotizacion_id UUID REFERENCES public.cotizaciones(id),
    vendedor_id UUID REFERENCES public.users(id),
    precio_final DECIMAL(15,2) NOT NULL,
    comision DECIMAL(15,2),
    estado TEXT DEFAULT 'proceso' CHECK (estado IN ('apartado', 'proceso', 'escriturado', 'completado', 'cancelado')),
    fecha_apartado DATE,
    fecha_venta DATE,
    fecha_escrituracion DATE,
    fecha_entrega DATE,
    forma_pago TEXT,
    plan_pago JSONB,
    documentos JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TABLA: pagos
-- ============================================
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operacion_id UUID REFERENCES public.operaciones(id) ON DELETE CASCADE,
    numero_pago INTEGER,
    concepto TEXT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    fecha_programada DATE,
    fecha_pago DATE,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'vencido', 'cancelado')),
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'credito')),
    referencia TEXT,
    comprobante_url TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. TABLA: documentos
-- ============================================
CREATE TABLE IF NOT EXISTS public.documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_entidad TEXT CHECK (tipo_entidad IN ('cliente', 'operacion', 'propiedad', 'proyecto')),
    entidad_id UUID NOT NULL,
    tipo_documento TEXT NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    archivo_url TEXT NOT NULL,
    mime_type TEXT,
    tamano_bytes BIGINT,
    usuario_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. TABLA: planes_pago (configuraciones de proyectos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.planes_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT CHECK (tipo IN ('contado', 'credito', 'financiamiento', 'construccion')),
    enganche_porcentaje DECIMAL(5,2),
    enganche_minimo DECIMAL(15,2),
    plazo_meses INTEGER,
    tasa_interes DECIMAL(5,2),
    configuracion JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. TABLA: extras (acabados, mejoras, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS public.extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID REFERENCES public.proyectos(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    precio DECIMAL(15,2) NOT NULL,
    disponible BOOLEAN DEFAULT true,
    imagen_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. STORAGE: Configuración de buckets
-- ============================================
-- Ejecuta esto después en el dashboard de Storage:
-- Bucket: avatars (público)
-- Bucket: logos (público)
-- Bucket: propiedades (público)
-- Bucket: documentos (privado con RLS)

-- ============================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - SIMPLIFICADAS
-- Solo validan autenticación, permisos en código
-- ============================================

-- USERS
CREATE POLICY "Authenticated users can read users" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update users" ON public.users
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete users" ON public.users
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- EMPRESAS
CREATE POLICY "Authenticated users can manage empresas" ON public.empresas
    FOR ALL USING (auth.uid() IS NOT NULL);

-- PROYECTOS
CREATE POLICY "Authenticated users can manage proyectos" ON public.proyectos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- PROPIEDADES
CREATE POLICY "Authenticated users can manage propiedades" ON public.propiedades
    FOR ALL USING (auth.uid() IS NOT NULL);

-- CLIENTES
CREATE POLICY "Authenticated users can manage clientes" ON public.clientes
    FOR ALL USING (auth.uid() IS NOT NULL);

-- SEGUIMIENTOS
CREATE POLICY "Authenticated users can manage seguimientos" ON public.seguimientos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- COTIZACIONES
CREATE POLICY "Authenticated users can manage cotizaciones" ON public.cotizaciones
    FOR ALL USING (auth.uid() IS NOT NULL);

-- OPERACIONES
CREATE POLICY "Authenticated users can manage operaciones" ON public.operaciones
    FOR ALL USING (auth.uid() IS NOT NULL);

-- PAGOS
CREATE POLICY "Authenticated users can manage pagos" ON public.pagos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- DOCUMENTOS
CREATE POLICY "Authenticated users can manage documentos" ON public.documentos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- PLANES_PAGO
CREATE POLICY "Authenticated users can manage planes_pago" ON public.planes_pago
    FOR ALL USING (auth.uid() IS NOT NULL);

-- EXTRAS
CREATE POLICY "Authenticated users can manage extras" ON public.extras
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- 16. TRIGGERS PARA UPDATED_AT
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

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seguimientos_updated_at BEFORE UPDATE ON public.seguimientos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON public.cotizaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operaciones_updated_at BEFORE UPDATE ON public.operaciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON public.pagos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 17. ÍNDICES PARA MEJOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users USING GIN(role);
CREATE INDEX idx_users_empresa ON public.users(empresaid);
CREATE INDEX idx_users_deleted ON public.users(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_propiedades_proyecto ON public.propiedades(proyecto_id);
CREATE INDEX idx_propiedades_estado ON public.propiedades(estado);
CREATE INDEX idx_propiedades_codigo ON public.propiedades(codigo);

CREATE INDEX idx_clientes_usuario ON public.clientes(usuario_asignado_id);
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo);

CREATE INDEX idx_seguimientos_cliente ON public.seguimientos(cliente_id);
CREATE INDEX idx_seguimientos_usuario ON public.seguimientos(usuario_id);
CREATE INDEX idx_seguimientos_fecha ON public.seguimientos(fecha_programada);

CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_propiedad ON public.cotizaciones(propiedad_id);
CREATE INDEX idx_cotizaciones_estado ON public.cotizaciones(estado);

CREATE INDEX idx_operaciones_cliente ON public.operaciones(cliente_id);
CREATE INDEX idx_operaciones_propiedad ON public.operaciones(propiedad_id);
CREATE INDEX idx_operaciones_vendedor ON public.operaciones(vendedor_id);

CREATE INDEX idx_pagos_operacion ON public.pagos(operacion_id);
CREATE INDEX idx_pagos_estado ON public.pagos(estado);

-- ============================================
-- ✅ LISTO!
-- ============================================
-- Ahora solo necesitas:
-- 1. Crear tu usuario en Auth (puedes hacerlo desde el dashboard)
-- 2. Insertar tu registro en la tabla users (ver siguiente paso)
-- 3. Desplegar las Edge Functions
-- 4. Configurar los buckets de Storage
