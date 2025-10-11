const OWNER_FIELDS = ['userid', 'vendedorid', 'asignadoA'] as const

export function belongsToUser(obj: Record<string, any>, userid?: string) {
  if (!userid) return false
  for (const f of OWNER_FIELDS) {
    const v = obj?.[f]
    if (typeof v === 'string' && v === userid) return true
    if (typeof v === 'number' && String(v) === String(userid)) return true
  }
  return false
}
