/**
 * ============================================
 * BASE TYPES - Sistema de Auditoría
 * ============================================
 * Tipos base para todas las entidades con:
 * - Trazabilidad completa
 * - Borrado lógico
 * - Campos de auditoría automáticos
 */

/**
 * Interfaz base para todas las entidades
 * Todos los modelos deben extender de esta interfaz
 * 
 * NOTA: Campos opcionales para mantener compatibilidad con datos existentes
 * Los triggers de Supabase los rellenarán automáticamente en nuevos registros
 */
export interface BaseEntity {
  id: string;
  created_at?: string;  // Opcional para compatibilidad
  updated_at?: string;  // Opcional para compatibilidad
  created_by?: string;  // UUID del usuario que creó (opcional)
  updated_by?: string;  // UUID del último usuario que modificó (opcional)
  deleted_at?: string | null;  // Borrado lógico
  deleted_by?: string | null;  // Usuario que eliminó
}

/**
 * Estado de sincronización para modo offline
 */
export type SyncStatus = 'synced' | 'pending' | 'error' | 'conflict';

/**
 * Metadata adicional para sincronización offline
 */
export interface SyncMetadata {
  sync_status: SyncStatus;
  last_sync_at?: string;
  sync_attempts?: number;
  sync_error?: string;
  local_version?: number;  // Para resolver conflictos
  server_version?: number;
}

/**
 * Entidad completa con metadata de sincronización
 */
export interface SyncableEntity extends BaseEntity, SyncMetadata {}

/**
 * Operación pendiente de sincronización
 */
export interface PendingOperation {
  id: string;
  table_name: string;
  operation_type: 'create' | 'update' | 'delete';
  entity_id: string;
  data: any;
  created_at: string;
  attempts: number;
  last_attempt_at?: string;
  error?: string;
}

/**
 * Helper type para crear entidades (sin campos auto-generados)
 */
export type CreateEntity<T extends BaseEntity> = Omit<
  T,
  'id' | 'created_at' | 'updated_at' | 'created_by'
> & {
  id?: string;  // Opcional para UUID pre-generado
};

/**
 * Helper type para actualizar entidades (solo campos modificables)
 */
export type UpdateEntity<T extends BaseEntity> = Partial<
  Omit<T, 'id' | 'created_at' | 'created_by'>
>;

/**
 * Filtros de consulta con soporte para borrado lógico
 */
export interface QueryFilters {
  include_deleted?: boolean;  // Por defecto false
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  created_by?: string;
}

/**
 * Resultado de operación con metadata
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  affected_rows?: number;
  offline?: boolean;  // Indica si se guardó offline
}
