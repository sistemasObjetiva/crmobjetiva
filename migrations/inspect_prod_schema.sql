-- ========================================
-- EJECUTA ESTO EN SUPABASE PROD SQL EDITOR
-- Te mostrará la estructura real de las tablas
-- ========================================

-- Ver todas las tablas
SELECT 
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver columnas de cada tabla principal
SELECT 
    'proyectos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'proyectos'
ORDER BY ordinal_position;

SELECT 
    'propiedades' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'propiedades'
ORDER BY ordinal_position;

SELECT 
    'prospectos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'prospectos'
ORDER BY ordinal_position;

SELECT 
    'seguimientos' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'seguimientos'
ORDER BY ordinal_position;

SELECT 
    'empresas' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'empresas'
ORDER BY ordinal_position;

SELECT 
    'users' as tabla,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
