# 🚀 Arquitectura Offline-First - Guía de Uso

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación y Setup](#instalación-y-setup)
3. [Uso Básico](#uso-básico)
4. [Repositorios](#repositorios)
5. [Sincronización](#sincronización)
6. [Notificaciones](#notificaciones)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

El CRM ahora funciona **offline-first** con:
- ✅ **IndexedDB** (Dexie) para almacenamiento local
- ✅ **Sincronización automática** con Supabase
- ✅ **Auditoría completa** (created_by, updated_by, deleted_at)
- ✅ **Soft delete** en todas las entidades
- ✅ **PWA** instalable
- ✅ **Notificaciones** de sync y negocio

---

## 📦 Instalación y Setup

### 1. Ejecutar Migraciones en DEV

```sql
-- En Supabase SQL Editor (DEV):
-- https://supabase.com/dashboard/project/qdinhxiufvtcehbubvsw/sql/new

-- 1. Agregar tabla prospectos (si no existe)
-- Ejecutar: migrations/add_missing_tables_dev.sql

-- 2. Agregar campos de auditoría
-- Ejecutar: migrations/add_audit_fields_optional.sql
```

### 2. Configurar Provider en App

```tsx
// src/App.tsx
import { OfflineProvider } from './config/context/OfflineContext';

function App() {
  return (
    <OfflineProvider>
      {/* Tu app aquí */}
    </OfflineProvider>
  );
}
```

### 3. Agregar Badge de Estado

```tsx
// src/components/general/Layout.tsx
import { OfflineStatusBadge } from './OfflineStatusBadge';

<AppBar>
  <Toolbar>
    {/* ... otros componentes ... */}
    <OfflineStatusBadge />
  </Toolbar>
</AppBar>
```

---

## 🔧 Uso Básico

### Importar Repositorios

```typescript
import { repositories } from '@/repositories';

const { proyectos, unidades, prospectos } = repositories;
```

### CRUD Básico

```typescript
// ✅ CREATE
const result = await proyectos.create({
  nombre: 'Proyecto Ejemplo',
  userid: 'user-id',
  descripcion: 'Descripción del proyecto',
  estatus: 'activo',
  // created_at, created_by se agregan automáticamente
});

if (result.success) {
  console.log('Proyecto creado:', result.data);
  console.log('Offline?', result.offline); // true si se guardó localmente
}

// ✅ READ
const proyecto = await proyectos.getById('proyecto-id');
const todosProyectos = await proyectos.getAll();
const proyectosActivos = await proyectos.findActivos();

// ✅ UPDATE
await proyectos.update('proyecto-id', {
  nombre: 'Nuevo nombre',
  descripcion: 'Nueva descripción',
  // updated_at, updated_by se agregan automáticamente
});

// ✅ DELETE (soft delete)
await proyectos.delete('proyecto-id');
// El registro NO se elimina, solo se marca con deleted_at

// ✅ FILTROS
const proyectosNoEliminados = await proyectos.getAll({
  include_deleted: false, // default
});

const proyectosCreadosPorMi = await proyectos.getAll({
  created_by: 'mi-user-id',
});
```

---

## 📚 Repositorios Disponibles

### UsersRepository

```typescript
const { users } = repositories;

// Métodos específicos
await users.findByEmail('email@example.com');
await users.findByEmpresa('empresa-id');
```

### ProyectosRepository

```typescript
const { proyectos } = repositories;

await proyectos.findByUser('user-id');
await proyectos.findActivos();
```

### UnidadesRepository

```typescript
const { unidades } = repositories;

await unidades.findByProyecto('proyecto-id');
await unidades.findByEstatus('disponible');
await unidades.findDisponiblesByProyecto('proyecto-id');
```

### PropiedadesRepository

```typescript
const { propiedades } = repositories;

await propiedades.findByUser('user-id');
await propiedades.findByTipo('Casa');
await propiedades.findDisponibles();
```

### ProspectosRepository

```typescript
const { prospectos } = repositories;

await prospectos.findByUser('user-id');
await prospectos.findActivos(); // Sin estatusBaja
```

### SeguimientosRepository

```typescript
const { seguimientos } = repositories;

await seguimientos.findByProspecto('prospecto-id');
await seguimientos.findByUser('user-id');
await seguimientos.findByEstatus('cotizacion');
```

---

## 🔄 Sincronización

### Hook useOffline

```tsx
import { useOffline } from '@/config/context/OfflineContext';

function MiComponente() {
  const {
    isOnline,      // boolean - ¿Está conectado?
    isSyncing,     // boolean - ¿Está sincronizando?
    pendingCount,  // number - Operaciones pendientes
    lastSync,      // Date - Última sincronización
    syncNow,       // function - Forzar sync
    syncResult,    // SyncResult - Resultado última sync
  } = useOffline();

  return (
    <div>
      {!isOnline && <Alert>Modo offline</Alert>}
      {pendingCount > 0 && (
        <Button onClick={syncNow}>
          Sincronizar {pendingCount} cambios
        </Button>
      )}
    </div>
  );
}
```

### Sincronización Automática

- ✅ Auto-sync cada **5 minutos** (si está online)
- ✅ Sync inmediato al **detectar conexión**
- ✅ Reintentos exponenciales en errores
- ✅ Manejo de conflictos (last-write-wins)

### Sincronización Manual

```typescript
import { syncService } from '@/services/SyncService';

// Forzar sync
const result = await syncService.forceSync();

console.log('Uploaded:', result.uploaded);
console.log('Downloaded:', result.downloaded);
console.log('Errors:', result.errors);

// Obtener contador de pendientes
const count = await syncService.getPendingOperationsCount();

// Suscribirse a eventos
const unsubscribe = syncService.subscribe((result) => {
  console.log('Sync completed:', result);
});

// Cleanup
unsubscribe();
```

---

## 🔔 Notificaciones

### Solicitar Permiso

```typescript
import { notificationService } from '@/services/NotificationService';

// Al iniciar la app o en settings
const granted = await notificationService.requestPermission();

if (granted) {
  console.log('Notificaciones habilitadas');
}
```

### Notificaciones Automáticas

Ya configuradas:
- ✅ Sync exitoso
- ✅ Errores de sync
- ✅ Modo offline/online
- ✅ Operaciones pendientes

### Notificaciones de Negocio

```typescript
// Al crear prospecto
await notificationService.notifyNewProspecto('Juan Pérez');

// Al crear seguimiento
await notificationService.notifyNewSeguimiento('Juan Pérez');

// Recordatorio
await notificationService.notifyProximoSeguimiento(
  'Juan Pérez',
  '15/12/2025'
);

// Venta cerrada
await notificationService.notifyVentaCerrada(
  'Residencial Las Palmas',
  'Unidad 101'
);
```

---

## 💡 Mejores Prácticas

### 1. Siempre usar Repositorios

```typescript
// ❌ NO hacer
await supabase.from('proyectos').insert(data);

// ✅ SÍ hacer
await repositories.proyectos.create(data);
```

### 2. Manejo de Errores

```typescript
const result = await proyectos.create(data);

if (result.success) {
  // ✅ Éxito
  toast.success('Proyecto creado');
} else {
  // ❌ Error
  toast.error(result.error);
}

// Verificar si fue offline
if (result.offline) {
  toast.info('Guardado localmente. Se sincronizará automáticamente.');
}
```

### 3. Auditoría Automática

```typescript
// Los campos de auditoría se agregan automáticamente:
// - created_at, created_by (en CREATE)
// - updated_at, updated_by (en UPDATE)
// - deleted_at, deleted_by (en DELETE)

// NO necesitas agregarlos manualmente
```

### 4. Soft Delete

```typescript
// Obtener solo activos (default)
const activos = await proyectos.getAll();

// Incluir eliminados si necesitas
const todos = await proyectos.getAll({ include_deleted: true });

// Verificar si está eliminado
import { isDeleted } from '@/utils/audit.utils';

if (isDeleted(proyecto)) {
  console.log('Proyecto eliminado');
}
```

### 5. Performance

```typescript
// Usar índices de Dexie para búsquedas rápidas
await unidades.findBy('proyectoid', 'proyecto-id'); // ⚡ Rápido
await unidades.findBy('estatus', 'disponible');     // ⚡ Rápido

// Evitar filtros en campos no indexados
const unidades = await unidades.getAll();
const filtradas = unidades.filter(u => u.preciolista > 1000000); // 🐌 Lento
```

### 6. PWA - Instalar App

```typescript
// La app es automáticamente instalable en:
// - Chrome/Edge: Botón "Instalar" en la barra de direcciones
// - Safari iOS: Compartir > Agregar a pantalla de inicio
// - Android: Banner automático de instalación

// Configuración en vite.config.ts
```

### 7. Debug en Desarrollo

```typescript
// Acceso a instancias globales en consola del navegador:
window.db;                    // Dexie database
window.repositories;          // Repositorios
window.syncService;           // Servicio de sync
window.notificationService;   // Servicio de notificaciones

// Ver estado de DB
await db.getStats();

// Ver operaciones pendientes
await db.pending_operations.toArray();

// Limpiar DB
await db.clearAll();
```

---

## 🐛 Troubleshooting

### Error: "Table not found"

```bash
# Ejecutar migrations en Supabase
migrations/add_audit_fields_optional.sql
```

### Error: "Notification permission denied"

```typescript
// Solicitar permiso manualmente
await notificationService.requestPermission();
```

### Sincronización no funciona

```typescript
// Verificar conectividad
const isOnline = syncService.getOnlineStatus();

// Ver operaciones pendientes
const pending = await db.pending_operations.toArray();
console.log('Pending ops:', pending);

// Forzar sync
await syncService.forceSync();
```

### IndexedDB llena

```typescript
// Limpiar datos locales (requiere re-sync)
await db.clearAll();
localStorage.removeItem('lastSyncTimestamp');

// Luego sincronizar
await syncService.forceSync();
```

---

## 📊 Estadísticas de DB

```typescript
import { db } from '@/db/schema';

const stats = await db.getStats();
console.log(stats);
/*
{
  users: 5,
  empresas: 2,
  proyectos: 10,
  unidades: 250,
  propiedades: 30,
  prospectos: 150,
  seguimientos: 400,
  pending_operations: 5,
  total: 847
}
*/
```

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar migraciones en DEV
2. ✅ Probar CRUD offline
3. ✅ Probar sincronización
4. ✅ Configurar notificaciones
5. ✅ Testing completo
6. ✅ PR a main cuando esté listo
7. ✅ Ejecutar migrations en PROD
8. ✅ Deploy

---

## 📚 Recursos

- [Dexie.js Docs](https://dexie.org/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
