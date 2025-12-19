/**
 * ============================================
 * AUDIT UTILITIES
 * ============================================
 * Funciones para manejo de auditoría y trazabilidad
 */

import { BaseEntity, CreateEntity, UpdateEntity } from '../config/base.types';

/**
 * Obtiene el ID del usuario actual desde el contexto de autenticación
 */
export const getCurrentUserId = (): string | undefined => {
  // Obtener del context de auth o localStorage
  const user = JSON.parse(localStorage.getItem('sb-auth-token') || '{}');
  return user?.user?.id;
};

/**
 * Añade campos de auditoría al crear una entidad
 * Solo agrega campos si están disponibles (compatibilidad con datos viejos)
 */
export const addCreateAudit = <T extends BaseEntity>(
  data: CreateEntity<T>
): CreateEntity<T> & Partial<BaseEntity> => {
  const userId = getCurrentUserId();
  const now = new Date().toISOString();

  return {
    ...data,
    created_at: (data as any).created_at || now,  // Preservar si ya existe
    updated_at: (data as any).updated_at || now,  // Preservar si ya existe
    created_by: (data as any).created_by || userId,  // Preservar si ya existe
    updated_by: (data as any).updated_by || userId,  // Preservar si ya existe
    deleted_at: null,
    deleted_by: null,
  };
};

/**
 * Añade campos de auditoría al actualizar una entidad
 */
export const addUpdateAudit = <T extends BaseEntity>(
  data: UpdateEntity<T>
): UpdateEntity<T> & Partial<BaseEntity> => {
  const userId = getCurrentUserId();
  const now = new Date().toISOString();

  return {
    ...data,
    updated_at: now,
    updated_by: userId,
  };
};

/**
 * Marca una entidad como eliminada (soft delete)
 */
export const markAsDeleted = (): Partial<BaseEntity> => {
  const userId = getCurrentUserId();
  const now = new Date().toISOString();

  return {
    deleted_at: now,
    deleted_by: userId,
    updated_at: now,
    updated_by: userId,
  };
};

/**
 * Verifica si una entidad está eliminada
 * Compatible con registros antiguos sin deleted_at
 */
export const isDeleted = (entity: BaseEntity): boolean => {
  if (!entity) return false;
  return entity.deleted_at !== null && entity.deleted_at !== undefined;
};

/**
 * Filtra entidades eliminadas de un array
 */
export const filterDeleted = <T extends BaseEntity>(
  entities: T[],
  includeDeleted: boolean = false
): T[] => {
  if (includeDeleted) return entities;
  return entities.filter(entity => !isDeleted(entity));
};

/**
 * Valida que los campos de auditoría estén presentes
 * Retorna true si AL MENOS tiene created_at o id (compatibilidad)
 */
export const validateAuditFields = (entity: BaseEntity): boolean => {
  return !!(entity.id && (entity.created_at || entity.updated_at));
};

/**
 * Obtiene información de auditoría de una entidad
 */
export const getAuditInfo = (entity: BaseEntity) => {
  return {
    created: {
      at: entity.created_at,
      by: entity.created_by,
    },
    updated: {
      at: entity.updated_at,
      by: entity.updated_by,
    },
    deleted: entity.deleted_at ? {
      at: entity.deleted_at,
      by: entity.deleted_by,
    } : null,
    isDeleted: isDeleted(entity),
  };
};
