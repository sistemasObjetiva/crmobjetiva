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

// === Tipos mínimos locales ===
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
  proyectosInteres?: string[]
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
  users?: UsuarioLite[]
  getEstatus: (s: Seguimiento) => string
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f7f', '#7fb3ff', '#c3e88d', '#ffcc80', '#b39ddb']

// =================== FECHAS ===================
// Si es TRUE, tratamos cualquier timestamp (aunque traiga 'Z') como si ya fuera hora LOCAL MX.
// Útil si tu backend guarda UTC pero tú quieres que "lo de hoy" salga con el día de hoy MX siempre.
const INTERPRET_AS_LOCAL_MX = true
const MX_TZ = 'America/Mexico_City'

const toLocalPlainDateSmart = (isoLike?: string | null): Temporal.PlainDate | null => {
  if (!isoLike) return null

  // Caso YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) {
    try { return Temporal.PlainDate.from(isoLike) } catch { /* noop */ }
  }

  try {
    if (INTERPRET_AS_LOCAL_MX) {
      // 1) Quitamos Z/offset para leerlo como "naive" local
      const cleaned = isoLike.replace(/Z$/i, '').replace(/[+-]\d{2}:\d{2}$/, '')
      const asDateTime = /^\d{4}-\d{2}-\d{2}$/.test(cleaned)
        ? Temporal.PlainDateTime.from(`${cleaned}T00:00:00`)
        : Temporal.PlainDateTime.from(cleaned)

      // 2) Interpretar en MX (ojo: string directo, no objeto)
      const zdt = asDateTime.toZonedDateTime(MX_TZ)
      return zdt.toPlainDate()
    } else {
      // Interpretación “real” UTC/offset -> MX
      const inst = Temporal.Instant.from(isoLike)
      const zdt = inst.toZonedDateTimeISO(MX_TZ)
      return zdt.toPlainDate()
    }
  } catch {
    // Fallback con Date local
    const d = new Date(isoLike)
    if (isNaN(d.getTime())) return null
    return Temporal.PlainDate.from({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })
  }
}


// Formato dd/mm/aaaa
const formatLocalDate = (iso?: string) => {
  const pd = toLocalPlainDateSmart(iso)
  if (!pd) return '—'
  const dd = String(pd.day).padStart(2, '0')
  const mm = String(pd.month).padStart(2, '0')
  const yyyy = String(pd.year)
  return `${dd}/${mm}/${yyyy}`
}

const isSamePlainDate = (a: Temporal.PlainDate, b: Temporal.PlainDate) =>
  a.year === b.year && a.month === b.month && a.day === b.day

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
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCSV(filename: string, rows: Array<Record<string, any>>, headers: string[]) {
  const lines: string[] = []
  lines.push(headers.map(csvEscape).join(','))
  for (const row of rows) lines.push(headers.map(h => csvEscape(row[h])).join(','))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// =================== Componente ===================
const ReporteDetalleModal: React.FC<DetalleModalProps> = ({
  open, onClose, titulo, seguimientos = [], prospectos = [], users = [], getEstatus
}) => {
  const [tab, setTab] = useState(0)

  // Catálogos en mapas
  const usersById = useMemo(() => {
    const m = new Map<string, UsuarioLite>()
    for (const u of users ?? []) if (u?.id) m.set(String(u.id), u)
    return m
  }, [users])

  const prospectosById = useMemo(() => {
    const m = new Map<string, Prospecto>()
    for (const p of prospectos ?? []) if (p?.id) m.set(String(p.id), p)
    return m
  }, [prospectos])

  const getProspectoNombre = (s: Seguimiento) => {
    const p = s?.idprospecto ? prospectosById.get(String(s.idprospecto)) : undefined
    return (p?.nombreCompleto ?? '').trim() || '—'
  }

  // Eventos para Calendar -> fecha LOCAL MX
  const segEvents = useMemo(
    () =>
      (seguimientos ?? []).map((s) => {
        const pd = toLocalPlainDateSmart(s.fechaActualizacion ?? s.fechaCreacion ?? null)
        const y = pd?.year.toString().padStart(4, '0') ?? '0000'
        const m = (pd ? pd.month : 1).toString().padStart(2, '0')
        const d = (pd ? pd.day : 1).toString().padStart(2, '0')
        return { id: String(s.id ?? Math.random()), fecha: `${y}-${m}-${d}` }
      }),
    [seguimientos]
  )

  // Series por día (LOCAL MX)
  const seriePorDia = useMemo(() => {
    const map = new Map<string, number>()
    ;(seguimientos ?? []).forEach((s) => {
      const pd = toLocalPlainDateSmart(s.fechaActualizacion ?? s.fechaCreacion ?? null)
      if (!pd) return
      const key = `${pd.year.toString().padStart(4,'0')}-${String(pd.month).padStart(2,'0')}-${String(pd.day).padStart(2,'0')}`
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

  // ==== CSV ====
  const buildSeguimientosCSV = () => {
    const headers = [
      'id','fecha','estatus','comentarios',
      'idProspecto','prospectoNombre','usuarioId','usuarioNombre','usuarioEmail','proyectoInteres',
    ]
    const rows = (seguimientos ?? []).map((s) => {
      const u = usersById.get(String(s.userid))
      return {
        id: s.id,
        fecha: formatLocalDate(s.fechaActualizacion ?? s.fechaCreacion ?? ''),
        estatus: getEstatus(s),
        comentarios: s.comentarios ?? '',
        idProspecto: s.idprospecto ?? '',
        prospectoNombre: getProspectoNombre(s),
        usuarioId: s.userid ?? '',
        usuarioNombre: (u?.nombre ?? '').trim(),
        usuarioEmail: (u?.email ?? '').trim(),
        proyectoInteres: s.proyectoInteres ?? '',
      }
    })
    return { headers, rows }
  }

  const buildProspectosCSV = () => {
    const headers = ['id','nombreCompleto','usuarioId','usuarioNombre','usuarioEmail','proyectosInteres']
    const rows = (prospectos ?? []).map((p) => {
      const u = usersById.get(String(p.userid))
      const proyectosInteres = Array.isArray(p.proyectosInteres) ? p.proyectosInteres.join(', ') : ''
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

        {(seguimientos?.length ?? 0) > 0 && (
          <Button size="small" startIcon={<DownloadIcon />} onClick={onExportSeguimientos}>
            Seguimientos CSV
          </Button>
        )}
        {(prospectos?.length ?? 0) > 0 && (
          <Button size="small" startIcon={<DownloadIcon />} onClick={onExportProspectos}>
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

        {/* TAB 0: Seguimientos */}
        {tab === 0 && (
          <Paper variant="outlined">
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estatus</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Comentarios</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(seguimientos ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
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

                      const nombrePros = getProspectoNombre(s)

                      return (
                        <TableRow key={i} hover>
                          <TableCell>{formatLocalDate(s?.fechaActualizacion ?? s?.fechaCreacion)}</TableCell>
                          <TableCell><Chip size="small" label={getEstatus(s)} /></TableCell>
                          <TableCell>
                            <Chip
                              variant="outlined"
                              size="small"
                              avatar={<Avatar>{initialsFrom(nombrePros, undefined)}</Avatar>}
                              label={nombrePros}
                              sx={{ maxWidth: 320, '& .MuiChip-label': { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' } }}
                              title={nombrePros}
                            />
                          </TableCell>
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
                  const d = toLocalPlainDateSmart(s?.fechaActualizacion ?? s?.fechaCreacion)
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
