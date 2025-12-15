-- ========================================
-- MIGRACIÓN: Agregar borrado lógico a usuarios
-- ========================================

-- 1. Agregar columna deleted_at a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_users_deleted_at 
ON users(deleted_at) 
WHERE deleted_at IS NULL;

-- 3. Comentar la columna para documentación
COMMENT ON COLUMN users.deleted_at IS 'Timestamp de cuando se eliminó el usuario (borrado lógico). NULL = activo';

-- 4. (Opcional) Crear vista de usuarios activos
CREATE OR REPLACE VIEW users_active AS
SELECT * FROM users
WHERE deleted_at IS NULL;

-- 5. (Opcional) Crear vista de usuarios eliminados (para auditoría)
CREATE OR REPLACE VIEW users_deleted AS
SELECT * FROM users
WHERE deleted_at IS NOT NULL;

-- ========================================
-- INSTRUCCIONES:
-- ========================================
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia y pega este SQL
-- 3. Click en "Run"
-- ========================================
