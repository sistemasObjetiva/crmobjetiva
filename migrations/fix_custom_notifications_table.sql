-- ============================================
-- Arreglar tabla custom_notifications
-- ============================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.custom_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'business',
    recipients UUID[] NOT NULL,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Agregar foreign key si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_notifications_created_by_fkey'
    ) THEN
        ALTER TABLE public.custom_notifications
        ADD CONSTRAINT custom_notifications_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_by 
ON public.custom_notifications(created_by);

CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_at 
ON public.custom_notifications(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.custom_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios autenticados pueden leer notificaciones donde están en recipients
DROP POLICY IF EXISTS "Users can read their notifications" ON public.custom_notifications;
CREATE POLICY "Users can read their notifications" 
ON public.custom_notifications
FOR SELECT
USING (
    auth.uid() = ANY(recipients)
);

-- Policy: Solo GerenteGeneral y Plataforma pueden crear notificaciones
DROP POLICY IF EXISTS "Only admins can create notifications" ON public.custom_notifications;
CREATE POLICY "Only admins can create notifications" 
ON public.custom_notifications
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND (
            (role->>'tipo')::text = 'GerenteGeneral' OR 
            (role->>'tipo')::text = 'Plataforma'
        )
    )
);

-- ✅ LISTO
-- Tabla custom_notifications configurada con:
-- - Foreign key a users
-- - Índices para performance
-- - RLS para seguridad
-- - Solo GerenteGeneral y Plataforma pueden crear
-- - Usuarios solo ven sus propias notificaciones
