# 🎯 Estrategia de Migración: Backward Compatibility

## 📋 Objetivo

Implementar nueva arquitectura offline-first con auditoría **SIN romper datos existentes**.

---

## ✅ Principios Clave

1. **Campos opcionales** → Datos viejos siguen funcionando sin `created_by`/`updated_by`
2. **Triggers solo para nuevos registros** → No modifican datos históricos
3. **Compatibilidad 100%** → App funciona con y sin campos de auditoría
4. **Migración gradual** → Tabla por tabla, sin prisa

---

## 🔄 Flujo de Implementación

### **Fase 1: Desarrollo en DEV (Ahora)**

```
Branch: crmpwa
Supabase: DEV (qdinhxiufvtcehbubvsw)

✅ Agregar campos opcionales de auditoría
✅ Implementar offline-first (Dexie + BaseRepository)
✅ Testing con datos de prueba
✅ Validar que funciona con y sin campos audit
```

**Archivos a ejecutar en DEV:**
- ✅ `migrations/add_missing_tables_dev.sql` (tabla prospectos)
- ✅ `migrations/add_audit_fields_optional.sql` (campos de auditoría)

### **Fase 2: Testing Completo**

```
Escenarios a probar:
1. ✅ Crear registros NUEVOS → Deben tener created_by/updated_by
2. ✅ Leer registros SIN audit → Deben funcionar normal
3. ✅ Actualizar registros SIN audit → Solo updated_by se llena
4. ✅ Soft delete → deleted_at y deleted_by
5. ✅ Offline mode → Sync cuando vuelva online
6. ✅ Conflictos → Resolver correctamente
```

### **Fase 3: Preparar PROD**

```
Cuando todo funcione en DEV:

1. PR: crmpwa → main
2. Code review
3. Ejecutar migrations/add_audit_fields_optional.sql en PROD
4. Verificar que NO rompe nada
5. Merge PR
6. Deploy automático
```

### **Fase 4: Migración Gradual de Datos (Opcional)**

```sql
-- Después del deploy, OPCIONALMENTE rellenar datos históricos
-- Tabla por tabla, sin prisa

-- Ejemplo: Rellenar created_by en users usando userid
UPDATE public.users 
SET 
  created_by = id,
  updated_by = id
WHERE created_by IS NULL;

-- Ejemplo: Rellenar created_by en proyectos usando userid
UPDATE public.proyectos 
SET 
  created_by = userid,
  updated_by = userid
WHERE created_by IS NULL;

-- Y así con cada tabla...
```

---

## 🛡️ Garantías de Compatibilidad

### **Código Frontend:**

```typescript
// ✅ FUNCIONA con datos viejos (sin created_by)
const proyecto: Proyecto = {
  id: '123',
  nombre: 'Proyecto Viejo',
  userid: 'user-456',
  // created_by: undefined ← No existe, pero no importa
};

// ✅ FUNCIONA con datos nuevos (con created_by)
const proyectoNuevo: Proyecto = {
  id: '789',
  nombre: 'Proyecto Nuevo',
  userid: 'user-456',
  created_by: 'user-456', // ← Automático del trigger
  updated_by: 'user-456',
};

// ✅ Utility functions manejan ambos casos
const auditInfo = getAuditInfo(proyecto);
// Si no existe created_by, retorna undefined
// App sigue funcionando
```

### **Base de Datos:**

```sql
-- ✅ Campos opcionales (NOT NULL = false)
created_by UUID REFERENCES auth.users(id),  -- Puede ser NULL
updated_by UUID REFERENCES auth.users(id),  -- Puede ser NULL
deleted_by UUID REFERENCES auth.users(id),  -- Puede ser NULL

-- ✅ Triggers usan COALESCE para no sobrescribir
NEW.created_by = COALESCE(NEW.created_by, auth.uid());
-- Si ya existe created_by, lo preserva
-- Si es NULL, lo llena con auth.uid()
```

### **Queries:**

```sql
-- ✅ Filtrar solo registros activos (compatible)
SELECT * FROM proyectos 
WHERE deleted_at IS NULL;  -- Funciona siempre

-- ✅ Filtrar por usuario (solo si existe)
SELECT * FROM proyectos 
WHERE created_by = 'user-id' 
   OR created_by IS NULL;  -- Incluye registros viejos

-- ✅ Contar registros con auditoría
SELECT 
  COUNT(*) as total,
  COUNT(created_by) as con_auditoria,
  COUNT(*) - COUNT(created_by) as sin_auditoria
FROM proyectos;
```

---

## 📊 Estado de Cada Tabla

| Tabla | Datos Viejos | Datos Nuevos | Migración Opcional |
|-------|--------------|--------------|-------------------|
| users | Sin audit | Con audit | ✅ Rellenar con `id` |
| empresas | Sin audit | Con audit | ✅ Rellenar con `userid` |
| proyectos | Sin audit | Con audit | ✅ Rellenar con `userid` |
| propiedades | Sin audit | Con audit | ✅ Rellenar con `userid` |
| prospectos | Sin audit | Con audit | ✅ Rellenar con `userid` |
| clientes | Sin audit | Con audit | ✅ Rellenar con `userid` |
| seguimientos | Sin audit | Con audit | ✅ Rellenar con `userid` |
| cotizaciones | Sin audit | Con audit | ✅ Rellenar con `userid` |
| operaciones | Sin audit | Con audit | ✅ Rellenar con `userid` |
| pagos | Sin audit | Con audit | ⚠️ Complejo (via operacion) |
| documentos | Sin audit | Con audit | ⚠️ Sin userid directo |
| planes_pago | Sin audit | Con audit | ⚠️ Embebido en JSON |
| extras | Sin audit | Con audit | ⚠️ Embebido en JSON |

---

## 🚀 Ventajas de Este Enfoque

1. **Zero Downtime** → No hay momento en que la app deje de funcionar
2. **Rollback Fácil** → Si algo falla, solo revertimos el PR
3. **Testing Seguro** → Probamos en DEV con datos reales
4. **Sin Prisa** → Migramos datos históricos cuando queramos
5. **Progresivo** → Tabla por tabla, verificando cada una

---

## ⚠️ Consideraciones

### **NO hacer:**
- ❌ NOT NULL en campos nuevos → Rompe datos viejos
- ❌ Triggers que modifiquen registros existentes → Peligroso
- ❌ Migración masiva sin backup → Riesgo innecesario

### **SÍ hacer:**
- ✅ Campos opcionales
- ✅ Triggers solo en INSERT/UPDATE
- ✅ Backup antes de cada migración
- ✅ Testing exhaustivo en DEV
- ✅ Deploy gradual

---

## 📅 Timeline Sugerido

```
Semana 1-2: Desarrollo offline-first en DEV
  ├─ Dexie + IndexedDB
  ├─ BaseRepository
  ├─ SyncService
  └─ PWA + Notificaciones

Semana 3: Testing en DEV
  ├─ CRUD offline
  ├─ Sincronización
  ├─ Conflictos
  └─ Auditoría

Semana 4: Preparar PROD
  ├─ PR + Code Review
  ├─ Ejecutar migrations en PROD
  ├─ Verificar compatibilidad
  └─ Deploy

Semana 5+: Migración gradual (opcional)
  ├─ Rellenar audit en tabla users
  ├─ Rellenar audit en tabla proyectos
  └─ Continuar tabla por tabla
```

---

## 🎓 Conclusión

Esta estrategia permite:
- ✅ Desarrollar nueva arquitectura sin riesgo
- ✅ Mantener datos históricos intactos
- ✅ Migrar gradualmente cuando estemos listos
- ✅ Rollback fácil si hay problemas
- ✅ Zero downtime en producción

**¿Procedemos con Dexie y la arquitectura offline-first?** 🚀
