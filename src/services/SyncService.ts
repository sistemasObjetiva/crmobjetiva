/**
 * ============================================
 * SYNC SERVICE
 * ============================================
 * Servicio de sincronización bidireccional entre
 * IndexedDB local y Supabase remoto
 * 
 * Características:
 * - Sincronización automática al conectarse
 * - Manejo de conflictos (last-write-wins)
 * - Reintentos exponenciales
 * - Notificaciones de estado
 */

import { supabase } from '../config/supabase';
import { db } from '../db/schema';
import { repositories } from '../repositories';
import type { PendingOperation } from '../config/base.types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  status: SyncStatus;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;
  private listeners: Set<(result: SyncResult) => void> = new Set();

  constructor() {
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Auto-sync cada 5 minutos si está online
    this.startAutoSync();
  }

  /**
   * Iniciar sincronización automática
   */
  private startAutoSync() {
    // DESACTIVADO TEMPORALMENTE - requiere campo updated_at en BD
    console.log('⚠️ Auto-sync disabled - missing updated_at field in database');
    return;
    
    /* this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 5 * 60 * 1000); // 5 minutos */
  }

  /**
   * Handler cuando se conecta a internet
   */
  private async handleOnline() {
    console.log('🌐 Online detected');
    this.isOnline = true;
    // No auto-sincronizar al conectar - desactivado temporalmente
    // await this.sync();
  }

  /**
   * Handler cuando se desconecta de internet
   */
  private handleOffline() {
    console.log('📡 Offline detected');
    this.isOnline = false;
  }

  /**
   * Sincronizar todo: subir cambios locales y descargar cambios remotos
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress');
      return {
        status: 'idle',
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['Sync already in progress'],
      };
    }

    if (!this.isOnline) {
      console.log('📡 Cannot sync - offline');
      return {
        status: 'error',
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        errors: ['No internet connection'],
      };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      status: 'syncing',
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      console.log('🔄 Starting sync...');

      // 1. Subir operaciones pendientes
      const uploadResult = await this.uploadPendingOperations();
      result.uploaded = uploadResult.count;
      result.errors.push(...uploadResult.errors);

      // 2. Descargar cambios del servidor
      const downloadResult = await this.downloadRemoteChanges();
      result.downloaded = downloadResult.count;
      result.errors.push(...downloadResult.errors);

      result.status = result.errors.length > 0 ? 'error' : 'success';
      
      console.log('✅ Sync completed:', result);
    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.status = 'error';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isSyncing = false;
      this.notifyListeners(result);
    }

    return result;
  }

  /**
   * Subir operaciones pendientes a Supabase
   */
  private async uploadPendingOperations(): Promise<{ count: number; errors: string[] }> {
    const operations = await db.pending_operations.toArray();
    let count = 0;
    const errors: string[] = [];

    for (const op of operations) {
      try {
        await this.executeOperation(op);
        await db.pending_operations.delete(op.id);
        count++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${op.table_name}/${op.entity_id}: ${errorMsg}`);
        
        // Actualizar intentos
        await db.pending_operations.update(op.id, {
          attempts: op.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          error: errorMsg,
        });

        // Si ya intentó muchas veces, marcar como error
        if (op.attempts >= 3) {
          const repo = this.getRepository(op.table_name);
          if (repo) {
            await repo.markAsSyncError(op.entity_id, errorMsg);
          }
        }
      }
    }

    return { count, errors };
  }

  /**
   * Ejecutar una operación pendiente en Supabase
   */
  private async executeOperation(op: PendingOperation): Promise<void> {
    const { table_name, operation_type, entity_id, data } = op;

    switch (operation_type) {
      case 'create':
        const { data: created, error: createError } = await supabase
          .from(table_name)
          .insert(data)
          .select()
          .single();
        
        if (createError) throw createError;
        
        // Actualizar local con datos del servidor
        const createRepo = this.getRepository(table_name);
        if (createRepo && created) {
          await createRepo.markAsSynced(entity_id, created.version);
        }
        break;

      case 'update':
        const { data: updated, error: updateError } = await supabase
          .from(table_name)
          .update(data)
          .eq('id', entity_id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        const updateRepo = this.getRepository(table_name);
        if (updateRepo && updated) {
          await updateRepo.markAsSynced(entity_id, updated.version);
        }
        break;

      case 'delete':
        // Soft delete en servidor
        const { error: deleteError } = await supabase
          .from(table_name)
          .update({ 
            deleted_at: data.deleted_at,
            deleted_by: data.deleted_by,
          })
          .eq('id', entity_id);
        
        if (deleteError) throw deleteError;
        
        const deleteRepo = this.getRepository(table_name);
        if (deleteRepo) {
          await deleteRepo.markAsSynced(entity_id);
        }
        break;
    }
  }

  /**
   * Descargar cambios del servidor
   */
  private async downloadRemoteChanges(): Promise<{ count: number; errors: string[] }> {
    let count = 0;
    const errors: string[] = [];

    try {
      // Obtener última sincronización
      // const lastSync = localStorage.getItem('lastSyncTimestamp');
      // const timestamp = lastSync ? new Date(lastSync) : new Date(0);

      // Descargar cada tabla (solo las que existen en Supabase)
      const tables = ['users', 'empresas', 'proyectos', 'propiedades', 'prospectos', 'seguimientos'];
      
      for (const table of tables) {
        try {
          // NOTA: Desactivado temporalmente - requiere campo updated_at en BD
          // Si no existe el campo, traer todo (no recomendado para producción)
          console.log(`⚠️ Skipping download for ${table} - updated_at field not available`);
          continue;
          
          /* const { data, error } = await supabase
            .from(table)
            .select('*')
            .gt('updated_at', timestamp.toISOString());

          if (error) throw error;

          /* const { data, error } = await supabase
            .from(table)
            .select('*')
            .gt('updated_at', timestamp.toISOString());

          if (error) throw error;

          if (data && data.length > 0) {
            const repo = this.getRepository(table);
            if (repo) {
              for (const item of data) {
                // Añadir metadata de sync
                const localItem = {
                  ...item,
                  sync_status: 'synced' as const,
                  last_sync_at: new Date().toISOString(),
                };

                await repo.table.put(localItem);
                count++;
              }
            }
          } */
        } catch (err) {
          errors.push(`${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Actualizar timestamp de última sincronización
      localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return { count, errors };
  }

  /**
   * Obtener repositorio por nombre de tabla
   */
  private getRepository(tableName: string): any {
    const repoMap: Record<string, any> = {
      users: repositories.users,
      empresas: repositories.empresas,
      proyectos: repositories.proyectos,
      // unidades: repositories.unidades, // Deshabilitado: tabla no existe en Supabase DEV
      propiedades: repositories.propiedades,
      prospectos: repositories.prospectos,
      seguimientos: repositories.seguimientos,
    };

    return repoMap[tableName];
  }

  /**
   * Forzar sincronización inmediata
   */
  async forceSync(): Promise<SyncResult> {
    return await this.sync();
  }

  /**
   * Obtener operaciones pendientes
   */
  async getPendingOperationsCount(): Promise<number> {
    return await db.pending_operations.count();
  }

  /**
   * Suscribirse a eventos de sincronización
   */
  subscribe(callback: (result: SyncResult) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notificar a listeners
   */
  private notifyListeners(result: SyncResult) {
    this.listeners.forEach(callback => callback(result));
  }

  /**
   * Obtener estado de conectividad
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Limpiar recursos
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
  }
}

// Singleton instance
export const syncService = new SyncService();

// Exponer en desarrollo
if (import.meta.env.DEV) {
  // @ts-ignore
  window.syncService = syncService;
}
