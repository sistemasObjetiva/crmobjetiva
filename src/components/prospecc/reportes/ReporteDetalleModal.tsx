import React, { useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Chip,
  Tabs, Tab, Paper, Stack, Divider, Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
}

type DetalleModalProps = {
  open: boolean
  onClose: () => void
  titulo: string
  seguimientos: Seguimiento[]
  prospectos: Prospecto[]
  // Devuelve el estatus presentable de un seguimiento
  getEstatus: (s: Seguimiento) => string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#7fb3ff', '#c3e88d', '#ffcc80', '#b39ddb']

// Utilidades
const toPlainDate = (isoLike?: string | null) => {
  if (!isoLike) return null
  const ymd = isoLike.slice(0, 10) // YYYY-MM-DD
  try { return Temporal.PlainDate.from(ymd) } catch { return null }
}
const isSamePlainDate = (a: Temporal.PlainDate, b: Temporal.PlainDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'

// Componente
const ReporteDetalleModal: React.FC<DetalleModalProps> = ({
  open, onClose, titulo, seguimientos = [], prospectos = [], getEstatus
}) => {
  const [tab, setTab] = useState(0)

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {titulo}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 10 }} aria-label="Cerrar">
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
                    .map((s, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{formatDateTime(s?.fechaActualizacion ?? s?.fechaCreacion)}</TableCell>
                        <TableCell><Chip size="small" label={getEstatus(s)} /></TableCell>
                        <TableCell>{s?.userid ?? '—'}</TableCell>
                        <TableCell>{s?.comentarios ?? '—'}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* TAB 1: Calendario (tu componente) */}
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
