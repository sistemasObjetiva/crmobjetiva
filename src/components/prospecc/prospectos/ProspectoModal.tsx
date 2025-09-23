import React, { useMemo, useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, Button, MenuItem, Select, InputLabel, FormControl,
  Checkbox, ListItemText, IconButton, Typography, Chip, Autocomplete,
  Paper, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import CommentIcon from '@mui/icons-material/Comment'
import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'
import UpdateIcon from '@mui/icons-material/Update'
import FlagIcon from '@mui/icons-material/Flag'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'

import { Propiedad, Prospecto, Proyecto, Seguimiento } from '../../../config/types'
import { ListasDesplegables } from '../../../config/variables'
import SignedAvatar from '../../general/SignedAvatar'
import { getEstatusChip } from '../../../hooks/useUtilsFunctions'

// ⚠️ Ajusta la ruta según tu estructura
import SeguimientoModal from '../seguimientos/SeguimientoModal'

// ===================== Props =====================
interface NuevoProspectoModalProps {
  open: boolean
  prospecto: Prospecto | null
  proyectos: Proyecto[]
  propiedades: Propiedad[]
  onChange: (field: keyof Prospecto, value: any) => void
  onClose: () => void
  onSave: (P: Prospecto) => void
  readOnly?: boolean
  seguimientos?: Seguimiento[]
  /** Opcional: persiste el seguimiento al guardar (Supabase o lo que uses). */
  onSaveSeguimiento?: (s: Seguimiento) => Promise<void> | void
}

// ===================== Helpers =====================
const formatDate = (iso?: string) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const full = d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.round(diffMs / 60000)
    const diffHr = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHr / 24)
    let relative = ''
    if (Math.abs(diffMin) < 60) relative = `${diffMin} min${Math.abs(diffMin) === 1 ? '' : 's'} ago`
    else if (Math.abs(diffHr) < 24) relative = `${diffHr} h ago`
    else if (Math.abs(diffDay) < 7) relative = `${diffDay} día${Math.abs(diffDay) === 1 ? '' : 's'} ago`
    return relative ? `${full} · ${relative}` : full
  } catch {
    return iso || '—'
  }
}

const SectionCard: React.FC<{ title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }>
  = ({ title, right, children }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {right}
    </Stack>
    {children}
  </Paper>
)

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ===================== Component =====================
const NuevoProspectoModal: React.FC<NuevoProspectoModalProps> = ({
  open, prospecto, onChange, onClose, onSave, proyectos, propiedades, readOnly = false,
  seguimientos, onSaveSeguimiento
}) => {
  // Opciones combinadas (proyectos y propiedades)
  const allOptions = useMemo(() => ([
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]), [proyectos, propiedades])

  const selectedOptions = useMemo(
    () => allOptions.filter(opt => (prospecto?.proyectosInteres ?? []).includes(opt.id)),
    [allOptions, prospecto?.proyectosInteres]
  )

  const creado = formatDate(prospecto?.fechaCreacion)
  const actualizado = formatDate(prospecto?.fechaActualizacion ?? prospecto?.fechaCreacion)

  // Mapa id -> { label, tipo } para chips en tabla de seguimientos
  const idToMeta = useMemo(() => {
    const m = new Map<string, { label: string, tipo: 'proyecto' | 'propiedad' }>()
    proyectos.forEach(p => m.set(p.id, { label: p.nombre, tipo: 'proyecto' }))
    propiedades.forEach(p => m.set(p.id, { label: p.tituloPropiedad, tipo: 'propiedad' }))
    return m
  }, [proyectos, propiedades])

  // ===== Filtrar seguimientos SOLO del prospecto actual =====
  const segsDeEsteProspecto = useMemo(
    () => (seguimientos ?? []).filter(s => s.idprospecto === prospecto?.id),
    [seguimientos, prospecto?.id]
  )

  const seguimientosOrdenados = useMemo(() => {
    const arr = [...segsDeEsteProspecto]
    const toTime = (s: any) =>
      new Date(s?.created_at || s?.fecha || s?.fechaCreacion || 0).getTime() || 0
    return arr.sort((a, b) => toTime(b) - toTime(a))
  }, [segsDeEsteProspecto])

  // ====== Estado para abrir SeguimientoModal dentro ======
  const [segModalOpen, setSegModalOpen] = useState(false)
  const [segEdit, setSegEdit] = useState<Seguimiento | null>(null)

  // Cierra/limpia modal de seguimiento si cambia el prospecto
  useEffect(() => {
    setSegModalOpen(false)
    setSegEdit(null)
  }, [prospecto?.id])

  const handleOpenSeg = (s: Seguimiento) => {
    setSegEdit({ ...s })
    setSegModalOpen(true)
  }

  const handleNewSeg = () => {
    const nuevo: Seguimiento = {
      id: genId(),
      idprospecto: prospecto?.id || '',
      estatusSeguimiento: 'contactado',
      motivo: [],
      proyectoInteres: prospecto?.proyectosInteres ?? [],
      unidadInteres: '',
      comentarios: '',
      formaDePago: '',
      capacidadDePago: '',
      temperaturaInteres: '',
      fechaProximoSeguimiento: '',
      pdfCotizaciones: [],
      historialSeguimiento: [],
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    } as any
    setSegEdit(nuevo)
    setSegModalOpen(true)
  }

  const handleCloseSeg = () => {
    setSegModalOpen(false)
    setSegEdit(null)
  }

  const handleChangeSeg = (field: keyof Seguimiento, value: any) => {
    setSegEdit(prev => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSaveSeg = async () => {
    if (!segEdit) return
    try {
      if (onSaveSeguimiento) await onSaveSeguimiento(segEdit)
      // Aquí podrías optimistamente refrescar la lista local si lo deseas.
    } finally {
      handleCloseSeg()
    }
  }

  return (
    <>
      <Dialog
        key={prospecto?.id ?? 'nuevo'}  // <-- fuerza remount para limpiar estados al cambiar de prospecto
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: 'white', background: 'var(--secondary-color)'
          }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={800} fontSize={20}>
              {prospecto?.nombreCompleto || 'Registro de Prospecto'}
            </Typography>
            {!!segsDeEsteProspecto.length && (
              <Chip
                size="small"
                icon={<FlagIcon />}
                label={`${segsDeEsteProspecto.length} seguimiento${segsDeEsteProspecto.length === 1 ? '' : 's'}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            )}
          </Stack>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {/* METADATA sticky */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5, borderRadius: 2, mb: 2,
              position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper'
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip icon={<EventIcon />} label={`Creado: ${creado}`} variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip icon={<UpdateIcon />} color="primary" label={`Última actualización: ${actualizado}`} variant="outlined" sx={{ fontWeight: 600 }} />
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {/* DATOS GENERALES */}
            <SectionCard title="Datos generales">
              <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
                <TextField
                  label="Nombre completo"
                  value={prospecto?.nombreCompleto || ''}
                  onChange={e => onChange('nombreCompleto', e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  placeholder="Ej. Juan Pérez"
                  disabled={readOnly}
                  InputProps={{ style: { fontWeight: 600 } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Correo electrónico"
                  value={prospecto?.correoElectronico ?? ''}
                  onChange={e => onChange('correoElectronico', e.target.value)}
                  fullWidth
                  type="email"
                  placeholder="Ej. juan@email.com"
                  disabled={readOnly}
                  InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} color="primary" /> }}
                />
                <TextField
                  label="Celular"
                  value={prospecto?.celular ?? ''}
                  onChange={e => onChange('celular', e.target.value)}
                  fullWidth
                  placeholder="Ej. 3312345678"
                  disabled={readOnly}
                  InputProps={{ startAdornment: <PhoneIphoneIcon sx={{ mr: 1 }} color="primary" /> }}
                />
              </Stack>
            </SectionCard>

            {/* OTROS DATOS */}
            <SectionCard title="Información adicional">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Estado civil</InputLabel>
                  <Select
                    label="Estado civil"
                    value={prospecto?.edoCivilCliente ?? ''}
                    onChange={e => onChange('edoCivilCliente', e.target.value)}
                    disabled={readOnly}
                  >
                    {ListasDesplegables.EstadoCivil.map(e => (
                      <MenuItem key={e} value={e}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Clasificación</InputLabel>
                  <Select
                    label="Clasificación"
                    value={prospecto?.clasificacionCliente ?? ''}
                    onChange={e => onChange('clasificacionCliente', e.target.value)}
                    disabled={readOnly}
                  >
                    {ListasDesplegables.ClasificacionCliente.map(e => (
                      <MenuItem key={e} value={e}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Medio de captación</InputLabel>
                  <Select
                    label="Medio de captación"
                    value={prospecto?.medioCaptacion ?? ''}
                    onChange={e => onChange('medioCaptacion', e.target.value)}
                    disabled={readOnly}
                  >
                    {ListasDesplegables.MedioDeCaptacion.map(e => (
                      <MenuItem key={e} value={e}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Ocupación"
                  value={prospecto?.ocupacionCliente ?? ''}
                  onChange={e => onChange('ocupacionCliente', e.target.value)}
                  fullWidth
                  placeholder="Ej. Ingeniero, Arquitecto..."
                  disabled={readOnly}
                  InputProps={{ startAdornment: <WorkOutlineIcon sx={{ mr: 1 }} color="primary" /> }}
                />
                <TextField
                  label="Comentarios"
                  value={prospecto?.comentarios ?? ''}
                  onChange={e => onChange('comentarios', e.target.value)}
                  fullWidth
                  placeholder="Anota aquí cualquier observación relevante"
                  disabled={readOnly}
                  multiline
                  minRows={2}
                  InputProps={{ startAdornment: <CommentIcon sx={{ mr: 1 }} color="primary" /> }}
                />
              </Stack>
            </SectionCard>

            {/* INTERESES */}
            <SectionCard title="Proyectos y propiedades de interés">
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={allOptions}
                  value={selectedOptions}
                  getOptionLabel={option =>
                    option.tipo === 'proyecto'
                      ? option.nombre
                      : option.tituloPropiedad
                  }
                  onChange={(_, newValue) =>
                    onChange('proyectosInteres', newValue.map(opt => opt.id))
                  }
                  disabled={readOnly}
                  sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 2 }}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} disabled={readOnly} sx={{ mr: 1 }} />
                      {option.tipo === 'proyecto' && option.logo ? (
                        <SignedAvatar
                          value={option.logo}
                          alt={option.nombre}
                          sx={{ width: 32, height: 32, mr: 1, display: 'inline-flex' }}
                        />
                      ) : null}
                      {option.tipo === 'propiedad' && option.imagenes?.length ? (
                        <SignedAvatar
                          value={option.imagenes[0]}
                          alt={option.tituloPropiedad}
                          sx={{ width: 32, height: 32, mr: 1, display: 'inline-flex' }}
                        />
                      ) : null}
                      <ListItemText
                        primary={
                          <>
                            {option.tipo === 'proyecto' ? option.nombre : option.tituloPropiedad}
                            <span style={{
                              fontSize: 12,
                              marginLeft: 8,
                              color: option.tipo === 'proyecto'
                                ? 'var(--primary-color)'
                                : 'var(--secondary-color)',
                              fontWeight: 600
                            }}>
                              {option.tipo === 'proyecto' ? 'Proyecto' : 'Propiedad'}
                            </span>
                          </>
                        }
                      />
                    </li>
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        label={
                          <>
                            {option.tipo === 'proyecto' ? option.nombre : option.tituloPropiedad}
                            <span style={{
                              fontSize: 11,
                              color: option.tipo === 'proyecto'
                                ? 'var(--primary-color)'
                                : 'var(--secondary-color)',
                              marginLeft: 4,
                              fontWeight: 700
                            }}>
                              {option.tipo === 'proyecto' ? 'P' : 'U'}
                            </span>
                          </>
                        }
                        avatar={
                          option.tipo === 'proyecto' && option.logo ? (
                            <SignedAvatar
                              value={option.logo}
                              alt={option.nombre}
                              sx={{ width: 24, height: 24 }}
                            />
                          ) : option.tipo === 'propiedad' && option.imagenes?.length ? (
                            <SignedAvatar
                              value={option.imagenes[0]}
                              alt={option.tituloPropiedad}
                              sx={{ width: 24, height: 24 }}
                            />
                          ) : undefined
                        }
                        key={option.id}
                      />
                    ))
                  }
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Selecciona proyectos o propiedades"
                      placeholder="Buscar y seleccionar"
                      fullWidth
                    />
                  )}
                />
              </FormControl>
            </SectionCard>

            {/* SEGUIMIENTOS */}
            <SectionCard
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Seguimientos</Typography>
                  {!!seguimientosOrdenados.length && (
                    <Chip size="small" label={seguimientosOrdenados.length} />
                  )}
                </Stack>
              }
              right={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleNewSeg}
                  disabled={readOnly || !prospecto?.id}
                >
                  Nuevo seguimiento
                </Button>
              }
            >
              {seguimientosOrdenados.length > 0 ? (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    maxHeight: 280,
                    overflow: 'auto',
                    '& .MuiTableRow-root:nth-of-type(odd)': {
                      bgcolor: (t) => t.palette.action.hover
                    },
                    '& .MuiTableCell-root': {
                      borderBottom: (t) => `1px solid ${t.palette.divider}`
                    }
                  }}
                >
                  <Table size="small" stickyHeader aria-label="tabla de seguimientos">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'nowrap', width: 220 }}>Fecha</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', width: 180 }}>Interés</TableCell>
                        <TableCell>Comentario</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', width: 140 }} align="center">Estatus</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', width: 70 }} align="center">Ver</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {seguimientosOrdenados.map((s, idx) => {
                        const fecha = (s as any).created_at || (s as any).fecha || (s as any).fechaCreacion
                        const comentario = (s as any).comentario || (s as any).nota || ''
                        const estatusVal = (s as any).estatusSeguimiento || (s as any).estatus || (s as any).estado || ''
                        const interesIds: string[] =
                          Array.isArray((s as any).proyectoInteres)
                            ? (s as any).proyectoInteres
                            : ((s as any).proyectoInteres ? [(s as any).proyectoInteres] : [])

                        return (
                          <TableRow
                            key={idx}
                            hover
                            onDoubleClick={() => handleOpenSeg(s)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(fecha)}</TableCell>

                            <TableCell>
                              {interesIds.length ? (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  {interesIds.map(id => {
                                    const meta = idToMeta.get(id)
                                    const label = meta?.label ?? id
                                    const isProyecto = meta?.tipo === 'proyecto'
                                    return (
                                      <Chip
                                        key={id}
                                        size="small"
                                        label={label}
                                        variant="outlined"
                                        sx={{
                                          bgcolor: 'transparent',
                                          borderColor: isProyecto ? 'primary.main' : 'secondary.main',
                                          color: isProyecto ? 'primary.main' : 'secondary.main'
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                              ) : '—'}
                            </TableCell>

                            <TableCell>
                              <Tooltip title={comentario || '—'}>
                                <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {comentario || '—'}
                                </Box>
                              </Tooltip>
                            </TableCell>

                            <TableCell align="center">
                              {estatusVal ? getEstatusChip(estatusVal) : <Chip size="small" label="—" />}
                            </TableCell>

                            <TableCell align="center">
                              <Tooltip title="Ver seguimiento">
                                <span>
                                  <IconButton size="small" onClick={() => handleOpenSeg(s)}>
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                // EMPTY STATE
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fafafa',
                    borderStyle: 'dashed'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Aún no hay seguimientos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Crea el primero para comenzar a registrar el avance con este prospecto.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewSeg}
                    disabled={readOnly || !prospecto?.id}
                    sx={{ mt: 1.5, fontWeight: 700 }}
                  >
                    Crear seguimiento
                  </Button>
                </Paper>
              )}
            </SectionCard>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', pb: 2, pt: 1 }}>
          <Box />
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose} variant="outlined">Cancelar</Button>
            {!readOnly && (
              <Button onClick={() => onSave(prospecto!)} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
                Guardar
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ===== Modal de Seguimiento embebido ===== */}
      {segEdit && (
        <SeguimientoModal
          open={segModalOpen}
          seguimiento={segEdit}
          onChange={handleChangeSeg}
          onClose={handleCloseSeg}
          onSave={() => handleSaveSeg()}
          readOnly={readOnly}
          proyectos={proyectos}
          propiedades={propiedades}
          // Pasamos al menos el prospecto actual para el Autocomplete del seguimiento:
          prospectos={prospecto ? [prospecto] : []}
        />
      )}
    </>
  )
}

export default NuevoProspectoModal
