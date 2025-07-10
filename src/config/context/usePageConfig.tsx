// src/config/context/usePageConfig.ts
import { Role } from '../../config/types'

export type TabItem = {
  label: string
}

export interface TabDefinition {
  label: string
  visibleFor: (roleObject: Role, nivel: 'Administrador' | 'Usuario') => boolean
  permisoRequirement?: {
    areapermiso: string
    tema: string
  }
}

export const usePageConfig = (
  tabs: TabDefinition[],
  role: Role,
  nivel: 'Administrador' | 'Usuario'
): TabItem[] => {
  return tabs
    .filter(tabDef => tabDef.visibleFor(role, nivel))
    .map(tabDef => ({ label: tabDef.label }))
}
