// hooks/seguimientos/useSeguimientosFilters.ts
import { create } from 'zustand'

export type SeguimientosFilters = {
  nombre: string
  correo: string
  temperatura: string
  unidad: string
  proyectoTexto: string
  fechaProximo: string // YYYY-MM-DD
  fechaActualizacion: string // YYYY-MM-DD
  comentarios: string
}

const DEFAULT_FILTERS: SeguimientosFilters = {
  nombre: '',
  correo: '',
  temperatura: '',
  unidad: '',
  proyectoTexto: '',
  fechaProximo: '',
  fechaActualizacion: '',
  comentarios: '',
}

type State = {
  filters: SeguimientosFilters
  setFilters: (updater: Partial<SeguimientosFilters> | ((f: SeguimientosFilters)=>SeguimientosFilters)) => void
  clearFilters: () => void
}

export const useSeguimientosFilters = create<State>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (updater) =>
    set((s) => ({
      filters: typeof updater === 'function' ? updater(s.filters) : { ...s.filters, ...updater },
    })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
