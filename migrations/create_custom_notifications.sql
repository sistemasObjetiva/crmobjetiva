-- ============================================
-- TABLA DE NOTIFICACIONES PERSONALIZADAS
-- ============================================
-- Para notificaciones enviadas manualmente por administradores
-- ============================================

CREATE TABLE IF NOT EXISTS public.custom_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('business', 'system', 'error')),
  recipients UUID[] NOT NULL, -- Array de IDs de usuarios destinatarios
  attachments TEXT[], -- Array de URLs de archivos adjuntos
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_by 
  ON public.custom_notifications(created_by);

CREATE INDEX IF NOT EXISTS idx_custom_notifications_created_at 
  ON public.custom_notifications(created_at DESC);

-- Índice GIN para búsqueda en array de recipients
CREATE INDEX IF NOT EXISTS idx_custom_notifications_recipients 
  ON public.custom_notifications USING GIN(recipients);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_notifications_updated_at
  BEFORE UPDATE ON public.custom_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_notifications_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.custom_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios con jerarquía 0 pueden insertar
CREATE POLICY "Admins can insert custom notifications"
  ON public.custom_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (
        (users.role->>'jerarquia')::int = 0
      )
    )
  );

-- Política: Los destinatarios pueden ver sus notificaciones
CREATE POLICY "Users can view their notifications"
  ON public.custom_notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(recipients)
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role->>'jerarquia')::int = 0
    )
  );

-- Política: Creadores pueden ver y editar sus notificaciones
CREATE POLICY "Creators can manage their notifications"
  ON public.custom_notifications
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Comentarios
COMMENT ON TABLE public.custom_notifications IS 'Notificaciones personalizadas enviadas manualmente por administradores';
COMMENT ON COLUMN public.custom_notifications.recipients IS 'Array de UUIDs de usuarios destinatarios';
COMMENT ON COLUMN public.custom_notifications.attachments IS 'Array de URLs de archivos adjuntos desde Supabase Storage';

-- ✅ LISTO!
-- Ejecutar este script en Supabase DEV primero para probar
