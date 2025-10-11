export const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido',
] as const
export type EstatusKey = typeof ESTATUS_LIST[number]

export const STATUS_LABEL: Record<EstatusKey, string> = {
  contactado: 'Contactado',
  interaccion: 'Interacción',
  cotizacion: 'Cotización',
  visita: 'Visita',
  posible: 'Posible',
  apartado: 'Apartado',
  vendido: 'Vendido',
}

export const STATUS_COLORS = [
  '#3b82f6', '#14b8a6', '#6366f1', '#f59e42', '#06d6a0', '#eab308', '#ef4444',
]

export const CHART_COLORS = STATUS_COLORS // alias por compat
export const toNice = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const safeColorFor = (estatus: string) => {
  const idx = ESTATUS_LIST.indexOf(estatus as EstatusKey)
  return idx >= 0 ? STATUS_COLORS[idx] : '#94a3b8'
}
