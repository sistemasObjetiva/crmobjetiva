-- ============================================
-- MIGRACIÓN COMPLETA: Ajustar schema a modelo original
-- Agregar columnas faltantes y metadata de sync
-- ============================================

-- Agregar columnas que faltaban en proyectos
ALTER TABLE public.proyectos 
ADD COLUMN IF NOT EXISTS userid UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS unidades JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS paymentPlans JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stacking JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS imagenesProyecto JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS logo JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS render JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fechaEntrega TEXT,
ADD COLUMN IF NOT EXISTS extrasOrder JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS estatus TEXT DEFAULT 'activo';

-- Agregar columnas de metadata para sincronización offline
ALTER TABLE public.proyectos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

-- Comentario: imagenesProyecto es diferente de imagenes
-- imagenesProyecto: array de objetos Document con {name, url, path, etc}
-- imagenes: array simple de URLs (lo que teníamos antes)

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_proyectos_userid ON public.proyectos(userid);
CREATE INDEX IF NOT EXISTS idx_proyectos_estatus ON public.proyectos(estatus);
CREATE INDEX IF NOT EXISTS idx_proyectos_deleted ON public.proyectos(_deleted) WHERE _deleted = false;
CREATE INDEX IF NOT EXISTS idx_proyectos_synced ON public.proyectos(_last_synced_at);

-- Agregar trigger para incrementar _version en cada update
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW._version = OLD._version + 1;
    NEW._last_synced_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS proyectos_increment_version ON public.proyectos;
CREATE TRIGGER proyectos_increment_version 
BEFORE UPDATE ON public.proyectos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- TABLA: PROPIEDADES (Casas, terrenos individuales - NO unidades de proyectos)
-- ============================================
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS codigo CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS nombre CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS nivel CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS torre CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS m2_construccion CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS m2_terreno CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS recamaras CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS banos CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS estacionamientos CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS precio CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS precio_m2 CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS estado CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS descripcion CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS caracteristicas CASCADE;
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS planos CASCADE;

-- Agregar columnas correctas según el modelo original
ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS userid UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS "tituloPropiedad" TEXT NOT NULL DEFAULT 'Sin título',
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS estatus TEXT DEFAULT 'disponible' CHECK (estatus IN ('disponible', 'vendido', 'apartado')),
ADD COLUMN IF NOT EXISTS venta BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "precioVenta" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "comisionVenta" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS renta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "precioRenta" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "comisionRenta" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pais TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS ciudad TEXT,
ADD COLUMN IF NOT EXISTS colonia TEXT,
ADD COLUMN IF NOT EXISTS calle TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS interior TEXT,
ADD COLUMN IF NOT EXISTS esquina TEXT,
ADD COLUMN IF NOT EXISTS "codigoPostal" TEXT,
ADD COLUMN IF NOT EXISTS exclusividad BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "comisionCompartida" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comparte50 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "condicionesCompartir" TEXT,
ADD COLUMN IF NOT EXISTS amenidades TEXT[],
ADD COLUMN IF NOT EXISTS imagenes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "fechaActualizacion" TIMESTAMPTZ DEFAULT NOW();

-- Eliminar proyecto_id si existe (propiedades NO están ligadas a proyectos)
ALTER TABLE public.propiedades DROP COLUMN IF EXISTS proyecto_id CASCADE;

-- Renombrar activo a estatus activo/inactivo no es lo mismo que disponible/vendido
-- Ya tenemos estatus, no necesitamos activo

COMMENT ON TABLE public.propiedades IS 'Propiedades individuales (casas, terrenos) - NO son unidades de proyectos';
COMMENT ON COLUMN public.propiedades.imagenes IS 'Array JSONB de objetos Document';
COMMENT ON COLUMN public.propiedades.variables IS 'Campos dinámicos adicionales por propiedad';

-- ============================================
-- TABLA: PROSPECTOS
-- ============================================
-- Eliminar tabla clientes si existe (en el modelo original son prospectos)
DROP TABLE IF EXISTS public.clientes CASCADE;

-- Eliminar tabla prospectos si ya existe para recrearla correctamente
DROP TABLE IF EXISTS public.prospectos CASCADE;

-- Crear tabla prospectos con el modelo correcto
CREATE TABLE public.prospectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userid UUID REFERENCES public.users(id),
    "nombreCompleto" TEXT NOT NULL,
    "correoElectronico" TEXT,
    celular TEXT,
    "ocupacionCliente" TEXT,
    "edoCivilCliente" TEXT,
    "clasificacionCliente" TEXT,
    "medioCaptacion" TEXT,
    comentarios TEXT,
    "proyectosInteres" TEXT[], -- Array de IDs de proyectos
    "estatusBaja" BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.prospectos IS 'Prospectos/leads del CRM';
COMMENT ON COLUMN public.prospectos."proyectosInteres" IS 'Array de UUIDs de proyectos de interés';

-- ============================================
-- TABLA: SEGUIMIENTOS
-- ============================================
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS cliente_id CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS tipo CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS estado CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS descripcion CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS fecha_programada CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS fecha_completado CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS resultado CASCADE;
ALTER TABLE public.seguimientos DROP COLUMN IF EXISTS proximo_seguimiento CASCADE;

-- Agregar columnas correctas según el modelo original
ALTER TABLE public.seguimientos
ADD COLUMN IF NOT EXISTS idprospecto UUID REFERENCES public.prospectos(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "fechaProximoSeguimiento" TEXT,
ADD COLUMN IF NOT EXISTS "unidadInteres" TEXT,
ADD COLUMN IF NOT EXISTS "formaDePago" TEXT,
ADD COLUMN IF NOT EXISTS "temperaturaInteres" TEXT,
ADD COLUMN IF NOT EXISTS comentarios TEXT,
ADD COLUMN IF NOT EXISTS "proyectoInteres" TEXT,
ADD COLUMN IF NOT EXISTS "capacidadDePago" TEXT,
ADD COLUMN IF NOT EXISTS "estatusSeguimiento" TEXT CHECK ("estatusSeguimiento" IN ('contactado', 'interaccion', 'cotizacion', 'visita', 'posible', 'apartado', 'vendido', 'descartado')),
ADD COLUMN IF NOT EXISTS motivo TEXT[],
ADD COLUMN IF NOT EXISTS "historialSeguimiento" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "pdfCotizaciones" JSONB DEFAULT '[]'::jsonb;

COMMENT ON TABLE public.seguimientos IS 'Seguimientos de prospectos con historial embebido';
COMMENT ON COLUMN public.seguimientos."historialSeguimiento" IS 'Array JSONB de objetos SeguimientoHistorial';
COMMENT ON COLUMN public.seguimientos."pdfCotizaciones" IS 'Array JSONB de objetos Document con PDFs de cotizaciones';

-- ============================================
-- Agregar metadata de sync a todas las tablas
-- ============================================

-- EMPRESAS
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

-- PROPIEDADES
ALTER TABLE public.propiedades
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_propiedades_deleted ON public.propiedades(_deleted) WHERE _deleted = false;
CREATE INDEX IF NOT EXISTS idx_propiedades_userid ON public.propiedades(userid);

DROP TRIGGER IF EXISTS propiedades_increment_version ON public.propiedades;
CREATE TRIGGER propiedades_increment_version 
BEFORE UPDATE ON public.propiedades
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- PROSPECTOS
ALTER TABLE public.prospectos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_prospectos_deleted ON public.prospectos(_deleted) WHERE _deleted = false;
CREATE INDEX IF NOT EXISTS idx_prospectos_userid ON public.prospectos(userid);
CREATE INDEX IF NOT EXISTS idx_prospectos_estatusbaja ON public.prospectos("estatusBaja");

DROP TRIGGER IF EXISTS prospectos_increment_version ON public.prospectos;
CREATE TRIGGER prospectos_increment_version 
BEFORE UPDATE ON public.prospectos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- SEGUIMIENTOS
ALTER TABLE public.seguimientos
ADD COLUMN IF NOT EXISTS _version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS _last_synced_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_seguimientos_deleted ON public.seguimientos(_deleted) WHERE _deleted = false;
CREATE INDEX IF NOT EXISTS idx_seguimientos_prospecto ON public.seguimientos(idprospecto);
CREATE INDEX IF NOT EXISTS idx_seguimientos_userid ON public.seguimientos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_estatus ON public.seguimientos("estatusSeguimiento");

DROP TRIGGER IF EXISTS seguimientos_increment_version ON public.seguimientos;
CREATE TRIGGER seguimientos_increment_version 
BEFORE UPDATE ON public.seguimientos
FOR EACH ROW 
EXECUTE FUNCTION increment_version();

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Las UNIDADES están embebidas en proyectos.unidades (JSONB)
-- 2. Las PROPIEDADES son una entidad separada (casas, terrenos individuales)
-- 3. paymentPlans y stacking también son JSONB embebidos
-- 4. imagenesProyecto contiene objetos Document completos
-- 5. logo y render son objetos Document únicos
-- 6. _version se incrementa automáticamente en cada update
-- 7. _deleted es soft delete (no eliminar físicamente)
-- 8. _last_synced_at marca última sincronización

COMMENT ON COLUMN public.proyectos.unidades IS 'Array JSONB de unidades del proyecto con su esquema completo';
COMMENT ON COLUMN public.proyectos.paymentPlans IS 'Array JSONB de planes de pago configurados';
COMMENT ON COLUMN public.proyectos.stacking IS 'Objeto JSONB con estado del stacking plan';
COMMENT ON COLUMN public.proyectos.imagenesProyecto IS 'Array JSONB de objetos Document (name, url, path, size, etc)';
COMMENT ON COLUMN public.proyectos.logo IS 'Objeto JSONB Document con logo del proyecto';
COMMENT ON COLUMN public.proyectos.render IS 'Objeto JSONB Document con render del proyecto';
COMMENT ON COLUMN public.proyectos._version IS 'Número de versión para control de conflictos offline';
COMMENT ON COLUMN public.proyectos._deleted IS 'Soft delete flag para sincronización';
COMMENT ON COLUMN public.proyectos._last_synced_at IS 'Timestamp de última sincronización';

-- ============================================
-- POLÍTICAS RLS ACTUALIZADAS
-- ============================================

-- PROPIEDADES
DROP POLICY IF EXISTS "Authenticated users can manage propiedades" ON public.propiedades;
CREATE POLICY "Authenticated users can manage propiedades" ON public.propiedades
    FOR ALL USING (auth.uid() IS NOT NULL);

-- PROSPECTOS
CREATE POLICY "Authenticated users can manage prospectos" ON public.prospectos
    FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================
-- TRIGGER para updated_at en nuevas tablas
-- ============================================
DROP TRIGGER IF EXISTS update_prospectos_updated_at ON public.prospectos;
CREATE TRIGGER update_prospectos_updated_at BEFORE UPDATE ON public.prospectos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_propiedades_updated_at ON public.propiedades;
CREATE TRIGGER update_propiedades_updated_at BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ RESUMEN DE CAMBIOS
-- ============================================
-- 
-- PROYECTOS:
--   ✅ unidades (JSONB) - array embebido con esquema flexible
--   ✅ paymentPlans (JSONB) - planes de pago embebidos
--   ✅ stacking (JSONB) - estado del stacking
--   ✅ imagenesProyecto (JSONB) - array de Document
--   ✅ logo, render (JSONB) - objetos Document
--   ✅ fechaEntrega, extrasOrder, estatus, userid
--   ✅ Metadata: _version, _deleted, _last_synced_at
--
-- PROPIEDADES:
--   ✅ Rediseñada según modelo original
--   ✅ NO está ligada a proyectos (son entidades independientes)
--   ✅ Campos de venta/renta, ubicación, exclusividad
--   ✅ imagenes (JSONB), variables (JSONB)
--   ✅ Metadata de sync
--
-- PROSPECTOS:
--   ✅ Nueva tabla (reemplaza clientes)
--   ✅ Campos según modelo original
--   ✅ proyectosInteres (array de UUIDs)
--   ✅ Metadata de sync
--
-- SEGUIMIENTOS:
--   ✅ Rediseñado según modelo original
--   ✅ Liga a prospectos (no clientes)
--   ✅ historialSeguimiento embebido (JSONB)
--   ✅ pdfCotizaciones (JSONB)
--   ✅ Metadata de sync
--
-- ✅ LISTO - Ahora todas las tablas respetan el modelo original + metadata de sync
