import { Temporal } from '@js-temporal/polyfill'
import type { Seguimiento } from '../config/types'
import { ESTATUS_LIST } from '../config/seguimientos.constants'

export const sameDay = (iso1?: string, iso2?: string) => {
  if (!iso1 || !iso2) return false
  const d1 = Temporal.PlainDate.from(iso1.slice(0, 10))
  const d2 = Temporal.PlainDate.from(iso2.slice(0, 10))
  return d1.equals(d2)
}

export function getSeguimientosPorDia(seguimientos: Seguimiento[]) {
  const hoy = Temporal.Now.plainDateISO()
  return Array.from({ length: 7 }).map((_, i) => {
    const fecha = hoy.add({ days: i }).toString()
    const obj: any = { fecha }
    ESTATUS_LIST.forEach((estatus) => {
      obj[estatus] = seguimientos.filter(
        (s) => s.fechaProximoSeguimiento?.slice(0, 10) === fecha && s.estatusSeguimiento === estatus
      ).length
    })
    return obj
  })
}
