/**
 * ============================================
 * BASE REPOSITORY
 * ============================================
 * Clase base para todos los repositorios
 * Proporciona CRUD genérico con:
 * - Soporte offline-first
 * - Soft delete
 * - Auditoría automática
 * - Cola de sincronización
 */

import { Table } from 'dexie';
import { db } from '../db/schema';
import type { BaseEntity, CreateEntity, UpdateEntity, QueryFilters, OperationResult, SyncMetadata } from '../config/base.types';
import { addCreateAudit, addUpdateAudit, markAsDeleted, filterDeleted } from '../utils/audit.utils';
import { v4 as uuidv4 } from 'uuid';

export type LocalEntity<T extends BaseEntity> = T & SyncMetadata;

export abstract class BaseRepository<T extends BaseEntity> {
  protected table: Table<LocalEntity<T>, string>;
  protected tableName: string;

  constructor(table: Table<LocalEntity<T>, string>, tableName: string) {
    this.table = table;
    this.tableName = tableName;
  }

  /**
   * Crear una nueva entidad (offline-first)
   */
  async create(data: CreateEntity<T>): Promise<OperationResult<LocalEntity<T>>> {
    try {
      const id = data.id || uuidv4();
      
      // Añadir campos de auditoría
      const auditedData = addCreateAudit(data);

      // Añadir metadata de sincronización
      const localEntity: LocalEntity<T> = {
        ...auditedData,
        id,
        sync_status: 'pending',
        local_version: 1,
      } as LocalEntity<T>;

      // Guardar en IndexedDB
      await this.table.add(localEntity);

      // Añadir a cola de sincronización
      await db.pending_operations.add({
        id: uuidv4(),
        table_name: this.tableName,
        entity_id: id,
        operation_type: 'create',
        data: localEntity,
        created_at: new Date().toISOString(),
        attempts: 0,
      });

      return {
        success: true,
        data: localEntity,
        offline: true,
      };
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener entidad por ID
   */
  async getById(id: string, includeDeleted = false): Promise<LocalEntity<T> | undefined> {
    const entity = await this.table.get(id);
    
    if (!entity) return undefined;
    if (!includeDeleted && entity.deleted_at) return undefined;
    
    return entity;
  }

  /**
   * Obtener todas las entidades
   */
  async getAll(filters?: QueryFilters): Promise<LocalEntity<T>[]> {
    let collection = this.table.toCollection();

    // Aplicar filtros
    if (filters?.created_by) {
      collection = collection.filter(e => e.created_by === filters.created_by);
    }

    const entities = await collection.toArray();

    // Filtrar eliminados
    return filterDeleted(entities, filters?.include_deleted);
  }

  /**
   * Actualizar entidad
   */
  async update(id: string, data: UpdateEntity<T>): Promise<OperationResult<LocalEntity<T>>> {
    try {
      const existing = await this.table.get(id);
      
      if (!existing) {
        return {
          success: false,
          error: 'Entity not found',
        };
      }

      // Añadir campos de auditoría
      const auditedData = addUpdateAudit(data);

      // Incrementar versión local
      const updatedEntity: LocalEntity<T> = {
        ...existing,
        ...auditedData,
        sync_status: 'pending',
        local_version: (existing.local_version || 0) + 1,
      };

      // Actualizar en IndexedDB
      await this.table.put(updatedEntity);

      // Añadir a cola de sincronización
      await db.pending_operations.add({
        id: uuidv4(),
        table_name: this.tableName,
        entity_id: id,
        operation_type: 'update',
        data: updatedEntity,
        created_at: new Date().toISOString(),
        attempts: 0,
      });

      return {
        success: true,
        data: updatedEntity,
        offline: true,
      };
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Eliminar entidad (soft delete)
   */
  async delete(id: string): Promise<OperationResult<LocalEntity<T>>> {
    try {
      const existing = await this.table.get(id);
      
      if (!existing) {
        return {
          success: false,
          error: 'Entity not found',
        };
      }

      // Marcar como eliminado
      const deletedFields = markAsDeleted();
      
      const deletedEntity: LocalEntity<T> = {
        ...existing,
        ...deletedFields,
        sync_status: 'pending',
        local_version: (existing.local_version || 0) + 1,
      };

      // Actualizar en IndexedDB
      await this.table.put(deletedEntity);

      // Añadir a cola de sincronización
      await db.pending_operations.add({
        id: uuidv4(),
        table_name: this.tableName,
        entity_id: id,
        operation_type: 'delete',
        data: deletedEntity,
        created_at: new Date().toISOString(),
        attempts: 0,
      });

      return {
        success: true,
        data: deletedEntity,
        offline: true,
      };
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Buscar entidades por campo
   */
  async findBy<K extends keyof LocalEntity<T>>(
    field: K,
    value: LocalEntity<T>[K]
  ): Promise<LocalEntity<T>[]> {
    return await this.table.where(field as string).equals(value as any).toArray();
  }

  /**
   * Contar entidades
   */
  async count(filters?: QueryFilters): Promise<number> {
    const entities = await this.getAll(filters);
    return entities.length;
  }

  /**
   * Marcar entidad como sincronizada
   */
  async markAsSynced(id: string, serverVersion?: number): Promise<void> {
    const entity = await this.table.get(id);
    if (entity) {
      await this.table.update(id, {
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        server_version: serverVersion,
      } as any);
    }
  }

  /**
   * Marcar entidad con error de sincronización
   */
  async markAsSyncError(id: string, error: string): Promise<void> {
    const entity = await this.table.get(id);
    if (entity) {
      await this.table.update(id, {
        sync_status: 'error',
        sync_error: error,
        sync_attempts: (entity.sync_attempts || 0) + 1,
      } as any);
    }
  }
}
