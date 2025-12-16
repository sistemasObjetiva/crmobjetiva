/**
 * ============================================
 * DEXIE DATABASE - IndexedDB Schema
 * ============================================
 * Base de datos local para modo offline
 * Espejo de las tablas de Supabase
 */

import Dexie, { Table } from 'dexie';
import type {
  User,
  Empresa,
  Proyecto,
  Unidad,
  Propiedad,
  Prospecto,
  Seguimiento,
} from '../config/types';
import type { PendingOperation, SyncMetadata } from '../config/base.types';

/**
 * Entidades extendidas con metadata de sincronización
 */
export type LocalUser = User & SyncMetadata;
export type LocalEmpresa = Empresa & SyncMetadata;
export type LocalProyecto = Proyecto & SyncMetadata;
export type LocalUnidad = Unidad & SyncMetadata;
export type LocalPropiedad = Propiedad & SyncMetadata;
export type LocalProspecto = Prospecto & SyncMetadata;
export type LocalSeguimiento = Seguimiento & SyncMetadata;

/**
 * Notificación local
 */
export interface AppNotification {
  id: string;
  type: 'sync' | 'business' | 'system' | 'error';
  title: string;
  body: string;
  icon?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  attachments?: string[]; // URLs de archivos adjuntos
  data?: Record<string, any>;
}

/**
 * Clase principal de la base de datos Dexie
 */
export class CRMDatabase extends Dexie {
  // Tablas principales
  users!: Table<LocalUser, string>;
  empresas!: Table<LocalEmpresa, string>;
  proyectos!: Table<LocalProyecto, string>;
  unidades!: Table<LocalUnidad, string>;
  propiedades!: Table<LocalPropiedad, string>;
  prospectos!: Table<LocalProspecto, string>;
  seguimientos!: Table<LocalSeguimiento, string>;

  // Tabla de operaciones pendientes
  pending_operations!: Table<PendingOperation, string>;
  
  // Tabla de notificaciones
  notifications!: Table<AppNotification, string>;

  constructor() {
    super('CRMObjetivaDB');

    // Version 1: Tablas iniciales
    this.version(1).stores({
      users: 'id, email, empresaid, estatus, sync_status, deleted_at, created_by',
      empresas: 'id, userid, estatus, sync_status, deleted_at, created_by',
      proyectos: 'id, userid, estatus, sync_status, deleted_at, created_by',
      unidades: 'id, proyectoid, estatus, userid, sync_status, deleted_at, created_by',
      propiedades: 'id, userid, estatus, tipo, sync_status, deleted_at, created_by',
      prospectos: 'id, userid, sync_status, deleted_at, created_by',
      seguimientos: 'id, idprospecto, userid, estatusSeguimiento, sync_status, deleted_at, created_by',
      pending_operations: '++id, table_name, entity_id, operation_type, created_at',
    });

    // Version 2: Agregar tabla de notificaciones
    this.version(2).stores({
      notifications: 'id, timestamp, read, type',
    });
  }

  /**
   * Limpiar toda la base de datos
   */
  async clearAll() {
    await this.users.clear();
    await this.empresas.clear();
    await this.proyectos.clear();
    await this.unidades.clear();
    await this.propiedades.clear();
    await this.prospectos.clear();
    await this.seguimientos.clear();
    await this.pending_operations.clear();
    await this.notifications.clear();
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  async getStats() {
    const [
      usersCount,
      empresasCount,
      proyectosCount,
      unidadesCount,
      propiedadesCount,
      prospectosCount,
      seguimientosCount,
      pendingOpsCount,
    ] = await Promise.all([
      this.users.count(),
      this.empresas.count(),
      this.proyectos.count(),
      this.unidades.count(),
      this.propiedades.count(),
      this.prospectos.count(),
      this.seguimientos.count(),
      this.pending_operations.count(),
    ]);

    return {
      users: usersCount,
      empresas: empresasCount,
      proyectos: proyectosCount,
      unidades: unidadesCount,
      propiedades: propiedadesCount,
      prospectos: prospectosCount,
      seguimientos: seguimientosCount,
      pending_operations: pendingOpsCount,
      total:
        usersCount +
        empresasCount +
        proyectosCount +
        unidadesCount +
        propiedadesCount +
        prospectosCount +
        seguimientosCount,
    };
  }
}

// Instancia única de la base de datos
export const db = new CRMDatabase();

// Configuración de Dexie para desarrollo
if (import.meta.env.DEV) {
  // @ts-ignore - Debug mode
  window.db = db;
  console.log('💾 Dexie DB initialized:', db.name);
}
