import React, { useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Chip, Avatar,
  Tabs, Tab, Paper, Stack, Divider, Table, TableHead, TableRow, TableCell, TableBody, Button
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import { Temporal } from '@js-temporal/polyfill'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts'
import Calendar from '../../general/calendar/Calendar'
import DayModalContainer from '../../general/calendar/DayModalContainer'

// === Tipos mínimos locales (ajusta imports si ya los tienes globales) ===
type Seguimiento = {
  id: string
  idprospecto: string
  userid: string
  fechaCreacion?: string
  fechaActualizacion?: string
  comentarios?: string
  estatusSeguimiento?: string
  proyectoInteres?: string
}

type Prospecto = {
  id: string
  userid: string
  nombreCompleto: string
  proyectosInteres?: string[] // opcional, por si lo tienes
}

type UsuarioLite = {
  id: string
  nombre?: string | null
  email?: string | null
}

type DetalleModalProps = {
  open: boolean
  onClose: () => void
  titulo: string
  seguimientos: Seguimiento[]
  prospectos: Prospecto[]
  users?: UsuarioLite[]                 // catálogo opcional de usuarios
  // Devuelve el estatus presentable de un seguimiento
  getEstatus: (s: Seguimiento) => string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#7fb3ff', '#c3e88d', '#ffcc80', '#b39ddb']

// Utilidades de fecha
const toPlainDate = (isoLike?: string | null) => {
  if (!isoLike) return null
  const ymd = isoLike.slice(0, 10) // YYYY-MM-DD
  try { return Temporal.PlainDate.from(ymd) } catch { return null }
}
const isSamePlainDate = (a: Temporal.PlainDate, b: Temporal.PlainDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const initialsFrom = (name?: string | null, email?: string | null) => {
  const base = (name && name.trim()) || (email && email.split('@')[0]) || ''
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

// ==== CSV helpers ====
const csvEscape = (value: any) => {
  const s = value == null ? '' : String(value)
  // si contiene coma, comillas o salto de línea -> encierra en comillas y duplica comillas internas
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCSV(filename: string, rows: Array<Record<string, any>>, headers: string[]) {
  const lines: string[] = []
  // encabezados
  lines.push(headers.map(csvEscape).join(','))
  // filas
  for (const row of rows) {
    const line = headers.map(h => csvEscape(row[h]))
    lines.push(line.join(','))
  }
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Componente
const ReporteDetalleModal: React.FC<DetalleModalProps> = ({
  open, onClose, titulo, seguimientos = [], prospectos = [], users = [], getEstatus
}) => {
  const [tab, setTab] = useState(0)

  // Mapa de usuarios por id para resolver nombre/correo en tabla y CSV
  const usersById = useMemo(() => {
    const m = new Map<string, UsuarioLite>()
    for (const u of users ?? []) {
      if (!u || !u.id) continue
      m.set(String(u.id), u)
    }
    return m
  }, [users])

  // Eventos para el Calendar (marcar días con actividad)
  const segEvents = useMemo(
    () =>
      (seguimientos ?? []).map((s) => ({
        id: String(s.id ?? Math.random()),
        fecha: (s.fechaActualizacion ?? s.fechaCreacion ?? new Date().toISOString()).slice(0, 10), // YYYY-MM-DD
      })),
    [seguimientos]
  )

  // Series para gráficas
  const seriePorDia = useMemo(() => {
    const map = new Map<string, number>()
    ;(seguimientos ?? []).forEach((s) => {
      const key = (s.fechaActualizacion ?? s.fechaCreacion ?? '').slice(0, 10)
      if (!key) return
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
  }, [seguimientos])

  const seriePorEstatus = useMemo(() => {
    const map = new Map<string, number>()
    ;(seguimientos ?? []).forEach((s) => {
      const e = getEstatus(s) || 'SIN_ESTATUS'
      map.set(e, (map.get(e) ?? 0) + 1)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [seguimientos, getEstatus])

  // ==== Constructores de filas CSV ====
  const buildSeguimientosCSV = () => {
    const headers = [
      'id',
      'fechaCreacion',
      'fechaActualizacion',
      'estatus',
      'comentarios',
      'idProspecto',
      'usuarioId',
      'usuarioNombre',
      'usuarioEmail',
      'proyectoInteres',
    ]
    const rows = (seguimientos ?? []).map((s) => {
      const u = usersById.get(String(s.userid))
      return {
        id: s.id,
        fechaCreacion: s.fechaCreacion ?? '',
        fechaActualizacion: s.fechaActualizacion ?? '',
        estatus: getEstatus(s),
        comentarios: s.comentarios ?? '',
        idProspecto: s.idprospecto ?? '',
        usuarioId: s.userid ?? '',
        usuarioNombre: (u?.nombre ?? '').trim(),
        usuarioEmail: (u?.email ?? '').trim(),
        proyectoInteres: s.proyectoInteres ?? '',
      }
    })
    return { headers, rows }
  }

  const buildProspectosCSV = () => {
    const headers = [
      'id',
      'nombreCompleto',
      'usuarioId',
      'usuarioNombre',
      'usuarioEmail',
      'proyectosInteres', // coma-separado si viene array
    ]
    const rows = (prospectos ?? []).map((p) => {
      const u = usersById.get(String(p.userid))
      const proyectosInteres = Array.isArray(p.proyectosInteres)
        ? p.proyectosInteres.join(', ')
        : ''
      return {
        id: p.id,
        nombreCompleto: p.nombreCompleto ?? '',
        usuarioId: p.userid ?? '',
        usuarioNombre: (u?.nombre ?? '').trim(),
        usuarioEmail: (u?.email ?? '').trim(),
        proyectosInteres,
      }
    })
    return { headers, rows }
  }

  // ==== Handlers de descarga ====
  const onExportSeguimientos = () => {
    const { headers, rows } = buildSeguimientosCSV()
    const safeTitle = titulo.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '_')
    downloadCSV(`seguimientos_${safeTitle || 'detalle'}.csv`, rows, headers)
  }

  const onExportProspectos = () => {
    const { headers, rows } = buildProspectosCSV()
    const safeTitle = titulo.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim().replace(/\s+/g, '_')
    downloadCSV(`prospectos_${safeTitle || 'detalle'}.csv`, rows, headers)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1 }}>{titulo}</Box>

        {/* Botones de exportación (condicionados por contenido) */}
        {(seguimientos?.length ?? 0) > 0 && (
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExportSeguimientos}
          >
            Seguimientos CSV
          </Button>
        )}
        {(prospectos?.length ?? 0) > 0 && (
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExportProspectos}
          >
            Prospectos CSV
          </Button>
        )}

        <IconButton onClick={onClose} sx={{ ml: 1 }} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Chip label={`Prospectos: ${prospectos?.length ?? 0}`} variant="outlined" />
          <Chip label={`Seguimientos: ${seguimientos?.length ?? 0}`} variant="outlined" />
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Seguimientos" />
          <Tab label="Calendario" />
          <Tab label="Gráficas" />
        </Tabs>

        {/* TAB 0: Seguimientos (tabla) */}
        {tab === 0 && (
          <Paper variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estatus</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Comentarios</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(seguimientos ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">Sin seguimientos</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (seguimientos ?? [])
                    .slice()
                    .sort((a, b) =>
                      new Date(b?.fechaActualizacion ?? b?.fechaCreacion ?? 0).getTime()
                      - new Date(a?.fechaActualizacion ?? a?.fechaCreacion ?? 0).getTime()
                    )
                    .map((s, i) => {
                      const u = usersById.get(String(s?.userid))
                      const nombre = u?.nombre?.trim() || undefined
                      const email = u?.email?.trim() || undefined
                      const label =
                        (nombre && email) ? `${nombre} · ${email}` :
                        (nombre || email) ?? String(s?.userid ?? '—')

                      return (
                        <TableRow key={i} hover>
                          <TableCell>{formatDateTime(s?.fechaActualizacion ?? s?.fechaCreacion)}</TableCell>
                          <TableCell><Chip size="small" label={getEstatus(s)} /></TableCell>
                          <TableCell>
                            <Chip
                              variant="outlined"
                              size="small"
                              avatar={<Avatar>{initialsFrom(nombre, email)}</Avatar>}
                              label={label}
                              sx={{ maxWidth: 320, '& .MuiChip-label': { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' } }}
                              title={label}
                            />
                          </TableCell>
                          <TableCell>{s?.comentarios ?? '—'}</TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* TAB 1: Calendario */}
        {tab === 1 && (
          <Box>
            <Calendar
              events={segEvents}
              renderDayModal={(date: Temporal.PlainDate, close: () => void) => {
                const delDia = (seguimientos ?? []).filter((s) => {
                  const d = toPlainDate(s?.fechaActualizacion ?? s?.fechaCreacion)
                  return d ? isSamePlainDate(d, date) : false
                })
                return (
                  <DayModalContainer
                    date={date}
                    onClose={close}
                    items={delDia}
                    getEstatus={getEstatus}
                  />
                )
              }}
            />
          </Box>
        )}

        {/* TAB 2: Gráficas */}
        {tab === 2 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Seguimientos por día</Typography>
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seriePorDia}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Distribución por estatus</Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={seriePorEstatus} dataKey="value" nameKey="name" outerRadius={95} label>
                    {seriePorEstatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ReporteDetalleModal
