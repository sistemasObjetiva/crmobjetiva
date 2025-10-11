import React from 'react'
import {
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  useTheme,
} from '@mui/material'

import { sameDay } from '../../../config/date'
import { toNice, safeColorFor } from '../../../config/seguimientos.constants'
import type { Seguimiento, Prospecto } from '../../../config/types'
import Calendar from '../../general/calendar/Calendar'

// Auto-fetch si no mandas props:
import {
  useFetchProyects,
  useFetchPropiedades,
  useFetchProspectos,
} from '../../../hooks/useFetchFunctions'

/** Catálogos mínimos para resolver nombres */
type ProyectoLite = { id: string | number; nombre: string }
type PropiedadLite = { id: string | number; tituloPropiedad: string }

type Props = {
  /** Seguimientos a pintar en el calendario */
  seguimientos: Seguimiento[]
  /** Opcional, para mostrar nombre del prospecto en el modal */
  prospectos?: Prospecto[]
  /** Opcional, para resolver nombre de proyecto */
  proyectos?: ProyectoLite[]
  /** Opcional, para resolver nombre de unidad/propiedad */
  propiedades?: PropiedadLite[]
  /** Título arriba del calendario */
  title?: string
  /** Ancho del recuadro interno (cuando hideFrame=false) */
  maxWidth?: number
  /** Si true, no dibuja borde/paper (útil en IndexPage) */
  hideFrame?: boolean
}

/** Detecta si el string parece un UUID */
const uuidLike = (t: string) => /^[0-9a-f-]{8,}$/i.test(t)

/** Parse seguro: acepta 'uuid', '["uuid"]', array, o texto libre.
 *  Si es texto libre, regresa "__TEXT__:..." para mantener el display.
 */
function pickFirstId(raw?: any): string | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    // Si viene como JSON '["uuid"]'
    if (t.startsWith('[')) {
      try {
        const arr = JSON.parse(t)
        if (Array.isArray(arr) && arr.length) return String(arr[0])
      } catch {
        return null
      }
    }
    // Si es uuid, úsalo; si es texto normal, regresa marcador
    return uuidLike(t) ? t : `__TEXT__:${t}`
  }
  if (Array.isArray(raw) && raw.length) return String(raw[0])
  // Si ya viene como objeto {id, nombre} no lo tocamos aquí
  return null
}

/** Resuelve nombre de prospecto */
function resolveProspectName(s: any, pById: Map<string | number, Prospecto>): string {
  // campos de id comunes
  const pid =
    s.idprospecto ??
    s.idProspecto ??
    s.prospectoId ??
    s.prospectoid ??
    s.prospecto_id ??
    null

  // campos de nombre directos
  const directName =
    s.prospectoNombre ??
    s.nombreProspecto ??
    s.clienteNombre ??
    s.nombreCliente ??
    null

  if (directName && String(directName).trim()) return String(directName)

  if (pid != null && pById.has(pid)) {
    const p = pById.get(pid)!
    return (
      (p as any).nombreCompleto ??
      (p as any).name ??
      (p as any).nombre ??
      (p as any).fullName ??
      'Sin nombre'
    )
  }
  return 'Sin nombre'
}

/** Resuelve qué nombre mostrar para el seguimiento (unidad/proyecto/propiedad) */
function resolveTargetLabel(
  s: any,
  proyectosById: Map<string, ProyectoLite>,
  propiedadesById: Map<string, PropiedadLite>
) {
  // Si ya viene un nombre legible en el seguimiento, úsalo
  const direct =
    s.unidadInteresNombre ||
    s.proyectoInteresNombre ||
    s.propiedadNombre ||
    s.unidadNombre ||
    s.proyectoNombre ||
    s.tituloPropiedad ||
    s.objetivoNombre ||
    null
  if (direct && String(direct).trim()) return String(direct)

  // Intenta con posibles IDs en distintos campos
  const unitId = pickFirstId(s.unidadInteres ?? s.unidadId ?? s.idUnidad)
  const projId = pickFirstId(s.proyectoInteres ?? s.proyectoId ?? s.idProyecto)
  const propId = pickFirstId(s.propiedadId ?? s.idPropiedad)

  // Si pickFirstId detectó texto libre, úsalo (mostrar tal cual)
  if (unitId?.startsWith('__TEXT__:')) return unitId.replace('__TEXT__:', '')
  if (projId?.startsWith('__TEXT__:')) return projId.replace('__TEXT__:', '')
  if (propId?.startsWith('__TEXT__:')) return propId.replace('__TEXT__:', '')

  // Busca en catálogos
  if (unitId && propiedadesById.has(unitId)) return propiedadesById.get(unitId)!.tituloPropiedad
  if (propId && propiedadesById.has(propId)) return propiedadesById.get(propId)!.tituloPropiedad
  if (projId && proyectosById.has(projId)) return proyectosById.get(projId)!.nombre

  // Si ninguno resolvió, intenta mostrar campo crudo legible
  const rawText =
    [s.unidadInteres, s.proyectoInteres, s.propiedadId, s.unidadId, s.proyectoId]
      .map((x: any) => (typeof x === 'string' ? x.trim() : ''))
      .find((t: string) => !!t && !uuidLike(t) && !t.startsWith('['))
  if (rawText) return rawText

  return '—'
}

const SeguimientosCalendar: React.FC<Props> = ({
  seguimientos,
  prospectos: prospectosProp = [],
  proyectos: proyectosProp = [],
  propiedades: propiedadesProp = [],
  title = 'Calendario de Seguimientos',
  maxWidth = 410,
  hideFrame = false,
}) => {
  const theme = useTheme()

  // Auto-fetch catálogos si NO llegan por props
  const { proyectos: proyectosHook } = useFetchProyects()
  const { propiedades: propiedadesHook } = useFetchPropiedades()
  const { prospectos: prospectosHook } = useFetchProspectos()

  const proyectos = proyectosProp.length ? proyectosProp : (proyectosHook as any[] ?? [])
  const propiedades = propiedadesProp.length ? propiedadesProp : (propiedadesHook as any[] ?? [])
  const prospectos = prospectosProp.length ? prospectosProp : (prospectosHook as any[] ?? [])

  // Mapas para resolver nombres
  const pById = React.useMemo(() => {
    const m = new Map<string | number, Prospecto>()
    for (const p of prospectos) m.set((p as any).id, p)
    return m
  }, [prospectos])

  const proyectosById = React.useMemo(() => {
    const m = new Map<string, ProyectoLite>()
    for (const p of proyectos) m.set(String((p as any).id), { id: (p as any).id, nombre: (p as any).nombre })
    return m
  }, [proyectos])

  const propiedadesById = React.useMemo(() => {
    const m = new Map<string, PropiedadLite>()
    for (const pr of propiedades)
      m.set(String((pr as any).id), { id: (pr as any).id, tituloPropiedad: (pr as any).tituloPropiedad })
    return m
  }, [propiedades])

  // Eventos del calendario
  const calendarEvents = React.useMemo(
    () =>
      seguimientos
        .filter((s) => s.fechaProximoSeguimiento && s.estatusSeguimiento !== 'vendido')
        .map((s) => ({
          id: s.id,
          fecha: s.fechaProximoSeguimiento!,
          label: toNice(s.estatusSeguimiento),
        })),
    [seguimientos]
  )

  // Marco opcional
  const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    hideFrame ? (
      <>{children}</>
    ) : (
      <Box
        sx={{
          mx: 'auto',
          maxWidth,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          background: '#fff',
        }}
      >
        {children}
      </Box>
    )

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
          {title}
        </Typography>
      )}

      <Frame>
        <Calendar
          events={calendarEvents}
          renderDayModal={(date, close) => {
            const fechaStr = date.toString()
            const delDia = seguimientos.filter((s) => sameDay(s.fechaProximoSeguimiento, fechaStr))

            return (
              <Dialog
                open
                keepMounted
                disableEscapeKeyDown
                // Ignora cierres por backdrop o Escape; solo cierra con el botón
                onClose={(_e, reason) => {
                  if (reason === 'backdropClick' || reason === 'escapeKeyDown') return
                  close()
                }}
              >
                <DialogTitle
                  sx={{ fontWeight: 800 }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  Seguimientos para el {fechaStr}
                </DialogTitle>

                <DialogContent
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {delDia.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      No hay seguimientos para este día.
                    </Typography>
                  ) : (
                    <Stack spacing={2} mt={1}>
                      {delDia.map((s) => {
                        const prospectoName = resolveProspectName(s, pById)
                        const targetLabel = resolveTargetLabel(s, proyectosById, propiedadesById)

                        return (
                          <Box key={s.id} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                            <Typography fontWeight={700} fontSize={17}>
                              {prospectoName}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              Unidad/Proyecto:{' '}
                              <span style={{ color: theme.palette.primary.main }}>
                                {targetLabel}
                              </span>
                            </Typography>

                            <Typography variant="body2" fontWeight={700}>
                              Estatus:{' '}
                              <span style={{ color: safeColorFor(s.estatusSeguimiento) }}>
                                {toNice(s.estatusSeguimiento)}
                              </span>
                            </Typography>

                            <Typography variant="body2">
                              Comentario:{' '}
                              <span style={{ color: '#222' }}>{s.comentarios || '—'}</span>
                            </Typography>
                          </Box>
                        )
                      })}
                    </Stack>
                  )}
                </DialogContent>

                <DialogActions
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    onClick={() => {
                      // cierre explícito únicamente con tu botón
                      close()
                    }}
                    variant="contained"
                    sx={{ fontWeight: 700 }}
                  >
                    Cerrar
                  </Button>
                </DialogActions>
              </Dialog>
            )
          }}
        />
      </Frame>
    </Box>
  )
}

export default SeguimientosCalendar
