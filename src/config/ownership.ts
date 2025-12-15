/**
 * Utilidades para verificar propiedad de recursos por usuario
 */

const OWNER_FIELDS = ['userid', 'vendedorid', 'asignadoA'] as const

/**
 * Verifica si un objeto pertenece a un usuario específico
 * @param obj - Objeto con propiedad userid, vendedorid o asignadoA
 * @param userid - ID del usuario a verificar
 * @returns true si el objeto pertenece al usuario, false si userid no está definido o no coincide
 */
export function belongsToUser(obj: Record<string, any>, userid?: string): boolean {
  if (!userid) return false
  for (const f of OWNER_FIELDS) {
    const v = obj?.[f]
    if (typeof v === 'string' && v === userid) return true
    if (typeof v === 'number' && String(v) === String(userid)) return true
  }
  return false
}

/**
 * Filtra un array de objetos por userid
 * @param items - Array de objetos a filtrar
 * @param userid - ID del usuario para filtrar
 * @returns Array filtrado por propiedad del usuario
 */
export function filterByUser<T extends Record<string, any>>(
  items: T[],
  userid?: string
): T[] {
  if (!userid) return items
  return items.filter(item => belongsToUser(item, userid))
}
