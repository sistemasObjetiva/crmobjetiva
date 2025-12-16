# 📦 Guía de Migración de Datos PROD → DEV

Esta guía te ayuda a migrar todos los datos de producción a desarrollo con los nuevos campos de auditoría.

## 🎯 Objetivo

Copiar todos los datos de **PROD** a **DEV** incluyendo los nuevos campos de auditoría (`created_by`, `updated_by`, `deleted_by`).

---

## 📋 Pre-requisitos

- ✅ Ejecutar `add_audit_fields.sql` en DEV
- ✅ Ejecutar `add_missing_tables_dev.sql` en DEV (tabla prospectos)
- ✅ Tener acceso a ambos proyectos Supabase

---

## 🔄 Opción 1: Migración Manual (Recomendada para primera vez)

### Paso 1: Agregar campos en PROD

```sql
-- Ejecutar en PROD (yrpjlnbujszpelximuuy)
-- https://supabase.com/dashboard/project/yrpjlnbujszpelximuuy/sql/new

-- Solo la primera parte de migrate_prod_to_dev_with_audit.sql
-- (hasta el PASO 2)
```

### Paso 2: Rellenar campos faltantes en PROD

```sql
-- Ejecutar en PROD
-- PASO 2 completo de migrate_prod_to_dev_with_audit.sql
-- Esto asigna created_by/updated_by a registros antiguos
```

### Paso 3: Exportar datos tabla por tabla

#### Opción A: Desde Supabase Dashboard

1. Ve a **Table Editor** en PROD
2. Para cada tabla, haz clic en "..." → "Export to CSV"
3. Guarda los archivos localmente

#### Opción B: Usando SQL (más rápido)

```sql
-- En PROD, ejecuta esto para generar los INSERT statements
-- Copia y pega el resultado para ejecutarlo en DEV

-- Ejemplo para tabla users:
SELECT 
  format(
    'INSERT INTO public.users (id, nombre, email, telefono, role, empresaid, estatus, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, nombre, email, telefono, role::text, empresaid, estatus, created_at, updated_at, created_by, updated_by, deleted_at, deleted_by
  )
FROM public.users
WHERE deleted_at IS NULL; -- Solo registros activos

-- Repite para cada tabla:
-- empresas, proyectos, propiedades, prospectos, clientes, 
-- seguimientos, cotizaciones, operaciones, pagos, documentos, 
-- planes_pago, extras
```

### Paso 4: Importar en DEV

```sql
-- Ejecutar en DEV (qdinhxiufvtcehbubvsw)
-- Pega aquí los INSERT statements generados
```

---

## 🚀 Opción 2: Migración con Supabase CLI (Profesional)

### Instalación

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

### Paso 1: Login y configurar proyectos

```bash
# Login en Supabase
supabase login

# Link proyecto PROD
supabase link --project-ref yrpjlnbujszpelximuuy

# Crear backup de PROD
supabase db dump --data-only --use-copy > prod_backup.sql
```

### Paso 2: Restaurar en DEV

```bash
# Link proyecto DEV
supabase link --project-ref qdinhxiufvtcehbubvsw

# Ejecutar schema primero
supabase db push --file migrations/add_audit_fields.sql

# Importar datos
supabase db push --file prod_backup.sql
```

---

## 🛠️ Opción 3: Migración con pg_dump (Avanzado)

Requiere acceso directo a las bases de datos PostgreSQL.

### Obtener credenciales de conexión

1. Ve a **Settings** → **Database** en cada proyecto
2. Copia las credenciales de conexión

### Comando de exportación

```bash
# Exportar datos de PROD
pg_dump \
  -h db.yrpjlnbujszpelximuuy.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  --data-only \
  --no-owner \
  --no-acl \
  --column-inserts \
  -t public.users \
  -t public.empresas \
  -t public.proyectos \
  -t public.propiedades \
  -t public.prospectos \
  -t public.clientes \
  -t public.seguimientos \
  -t public.cotizaciones \
  -t public.operaciones \
  -t public.pagos \
  -t public.documentos \
  -t public.planes_pago \
  -t public.extras \
  > prod_data_backup.sql

# Importar en DEV
psql \
  -h db.qdinhxiufvtcehbubvsw.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  < prod_data_backup.sql
```

---

## ✅ Verificación Post-Migración

```sql
-- Ejecutar en DEV para verificar
SELECT 
  'users' as tabla, COUNT(*) as registros, 
  COUNT(created_by) as con_audit
FROM public.users
UNION ALL
SELECT 
  'empresas', COUNT(*), COUNT(created_by)
FROM public.empresas
UNION ALL
SELECT 
  'proyectos', COUNT(*), COUNT(created_by)
FROM public.proyectos
UNION ALL
SELECT 
  'propiedades', COUNT(*), COUNT(created_by)
FROM public.propiedades
UNION ALL
SELECT 
  'prospectos', COUNT(*), COUNT(created_by)
FROM public.prospectos;

-- Verificar que los triggers funcionan
INSERT INTO public.users (nombre, email, role, estatus)
VALUES ('Test User', 'test@test.com', 'Usuario', 'activo')
RETURNING id, created_by, updated_by;

-- Debería mostrar created_by = auth.uid() automáticamente
```

---

## 🔒 Seguridad y Limpieza

### Después de la migración:

1. **Eliminar datos sensibles de test:**
   ```sql
   DELETE FROM public.users WHERE email LIKE '%test%';
   ```

2. **Verificar RLS policies:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

3. **Backup de DEV antes de continuar:**
   ```bash
   supabase db dump > dev_backup_$(date +%Y%m%d).sql
   ```

---

## 📊 Orden Recomendado de Migración

Para evitar errores de foreign keys, migra en este orden:

1. ✅ `users` (no tiene dependencias)
2. ✅ `empresas` (depende de users)
3. ✅ `proyectos` (depende de users)
4. ✅ `propiedades` (depende de users)
5. ✅ `prospectos` (depende de users, proyectos)
6. ✅ `clientes` (depende de users)
7. ✅ `seguimientos` (depende de prospectos)
8. ✅ `cotizaciones` (depende de users, proyectos)
9. ✅ `operaciones` (depende de clientes)
10. ✅ `pagos` (depende de operaciones)
11. ✅ `documentos` (sin dependencias fuertes)
12. ✅ `planes_pago` (depende de proyectos)
13. ✅ `extras` (depende de proyectos)

---

## 🆘 Troubleshooting

### Error: "duplicate key value violates unique constraint"

```sql
-- Limpiar tabla en DEV antes de reintentar
TRUNCATE TABLE public.users CASCADE;
```

### Error: "foreign key constraint"

```sql
-- Deshabilitar temporalmente las FK
ALTER TABLE public.empresas DISABLE TRIGGER ALL;
-- ... insertar datos ...
ALTER TABLE public.empresas ENABLE TRIGGER ALL;
```

### Error: "permission denied"

```sql
-- Verificar que estás autenticado correctamente
SELECT auth.uid(); -- Debe retornar tu user ID
```

---

## 🎓 Próximos Pasos

Después de migrar los datos:

1. ✅ Verificar que todos los registros tienen `created_by` y `updated_by`
2. ✅ Probar soft delete con un registro de prueba
3. ✅ Instalar Dexie para offline-first
4. ✅ Implementar BaseRepository con soporte de auditoría
5. ✅ Configurar SyncService
6. ✅ Setup PWA y notificaciones

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Supabase Dashboard
2. Verifica los triggers: `SELECT * FROM pg_trigger WHERE tgname LIKE 'audit%';`
3. Consulta la documentación de Supabase sobre migraciones
