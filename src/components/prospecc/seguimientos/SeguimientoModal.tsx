// src/components/prospecc/seguimientos/SeguimientoModal.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  IconButton,
  Typography,
  Chip,
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
  Avatar,
  Paper,
  Tooltip,
  FormHelperText, // ⬅️ para mensajes de error
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import EventIcon from '@mui/icons-material/Event'
import UpdateIcon from '@mui/icons-material/Update'

import SignedAvatar from '../../general/SignedAvatar'
import CotizadorPropiedadModal from '../../inventario/CotizadorPropiedadModal'
import CotizadorModal from '../../inventario/CotizadorModal'
import DocumentUploadList from '../../general/DocumentUploadList'

import {
  Propiedad,
  Prospecto,
  Proyecto,
  Seguimiento,
  Document,
  CotizadorOption,
  ESTATUS_OPCIONES,
  MOTIVOS_DESCARTE,
  MOTIVOS_INTERACCION,
} from '../../../config/types'
import { ListasDesplegables } from '../../../config/variables'
import { getEstatusChip } from '../../../hooks/useUtilsFunctions'

interface Props {
  open: boolean
  seguimiento: Seguimiento | null
  proyectos: Proyecto[]
  propiedades: Propiedad[]
  prospectos: Prospecto[]
  onChange: (field: keyof Seguimiento, value: any) => void
  onClose: () => void
  onSave: (P: Seguimiento) => void
  readOnly?: boolean
}

// ---------- helpers ----------
const formatDateFull = (iso?: string) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const full = d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    const diffMs = Date.now() - d.getTime()
    const min = Math.round(diffMs / 60000)
    const hr = Math.round(min / 60)
    const day = Math.round(hr / 24)
    let rel = ''
    if (Math.abs(min) < 60) rel = `${min} min ago`
    else if (Math.abs(hr) < 24) rel = `${hr} h ago`
    else if (Math.abs(day) < 7) rel = `${day} día${Math.abs(day) === 1 ? '' : 's'} ago`
    return rel ? `${full} · ${rel}` : full
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

const SeguimientoModal: React.FC<Props> = ({
  open,
  seguimiento,
  prospectos,
  onChange,
  onClose,
  onSave,
  proyectos,
  propiedades,
  readOnly = false,
}) => {
  // --- ESTADOS PARA EL FLUJO DE COTIZADOR ---
  const [cotizadorSelectorOpen, setCotizadorSelectorOpen] = useState(false)
  const [cotizadorSeleccionado, setCotizadorSeleccionado] = useState<any>(null)
  const [openCotizadorPropiedad, setOpenCotizadorPropiedad] = useState(false)
  const [openCotizadorUnidad, setOpenCotizadorUnidad] = useState(false)

  // --- Validación (estatus + motivo obligatorios)
  const [attemptSave, setAttemptSave] = useState(false)

  // --- COMENTARIO: último guardado (solo lectura) + nuevo comentario (draft)
  const [comentarioInput, setComentarioInput] = useState('')
  useEffect(() => {
    if (open) setComentarioInput('') // siempre limpio al abrir o cambiar seguimiento
  }, [open, seguimiento?.id])

  const ultimoComentarioGuardado = useMemo(() => {
    const h = seguimiento?.historialSeguimiento ?? []
    if (h.length) return h[h.length - 1]?.comentarios ?? ''
    return seguimiento?.comentarios ?? ''
  }, [seguimiento])

  // --- MOTIVOS: recordar selección por tipo y limpiar al cambiar estatus ---
  const [motivosDescDraft, setMotivosDescDraft] = useState<string[]>([])
  const [motivosInterDraft, setMotivosInterDraft] = useState<string[]>([])

  // Al cargar/cambiar seguimiento, inicializa borradores desde lo que traiga 'motivo'
  useEffect(() => {
    const current = (seguimiento?.motivo as string[] | undefined) ?? []
    setMotivosDescDraft(current.filter(m => (MOTIVOS_DESCARTE as readonly string[]).includes(m)))
    setMotivosInterDraft(current.filter(m => (MOTIVOS_INTERACCION as readonly string[]).includes(m)))
  }, [open, seguimiento?.id])

  const handleChangeEstatus = (val: string) => {
    onChange('estatusSeguimiento', val)
    if (val === 'descartado') {
      const next = motivosDescDraft.length ? motivosDescDraft : []
      onChange('motivo', next.filter(m => (MOTIVOS_DESCARTE as readonly string[]).includes(m)))
    } else {
      const next = motivosInterDraft.length ? motivosInterDraft : []
      onChange('motivo', next.filter(m => (MOTIVOS_INTERACCION as readonly string[]).includes(m)))
    }
  }

  // --- Opciones para el autocomplete de cotizador ---
  const cotizadorOptions: CotizadorOption[] = [
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const })),
    ...proyectos.flatMap<CotizadorOption>(proy =>
      proy.unidades?.length
        ? proy.unidades.map(u => ({ ...u, proyectoObj: proy, tipo: 'unidad' as const }))
        : [{ ...proy, proyectoObj: proy, tipo: 'proyecto' as const }]
    ),
  ]

  // --- Opciones para intereses ---
  const allOptions = [
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]

  const allPdfsArr: Document[] = [
    ...(seguimiento?.pdfCotizaciones ?? []),
    ...(seguimiento?.historialSeguimiento?.flatMap(h => h.pdfCotizaciones ?? []) ?? [])
  ]
  const allPdfs: Document[] = Array.from(new Map(allPdfsArr.map(doc => [doc.id, doc])).values())

  const selectedOptions = allOptions.filter(opt =>
    (Array.isArray(seguimiento?.proyectoInteres)
      ? (seguimiento?.proyectoInteres ?? []).includes(opt.id)
      : seguimiento?.proyectoInteres === opt.id)
  )

  // --- Fechas (acepta created_at/updated_at o fechaCreacion/fechaActualizacion) ---
  const creado = formatDateFull((seguimiento as any)?.fechaCreacion || (seguimiento as any)?.created_at)
  const actualizado = formatDateFull(
    (seguimiento as any)?.fechaActualizacion ||
    (seguimiento as any)?.updated_at ||
    (seguimiento as any)?.fechaCreacion
  )

  // --- Nombre del prospecto en el header ---
  const prospectoName = useMemo(() => {
    const p = prospectos.find(pp => pp.id === seguimiento?.idprospecto)
    return p?.nombreCompleto
  }, [prospectos, seguimiento?.idprospecto])

  // ======== ListasDesplegables + retrocompatibilidad ========
  const FORMA_DE_PAGO_MAP_OLD_TO_NEW: Record<string, string> = {
    'Contado': 'Un solo pago',
    'Financiamiento': 'Plazos',
    'Crédito': 'Crédito bancario',
  }
  const TEMPERATURA_MAP_OLD_TO_NEW: Record<string, string> = {
    'Alta': '80% (Realiza un apartado)',
    'Media': '60% (Solicita información detallada)',
    'Baja': '40% (Lo consultare con...)',
  }
  const CAPACIDAD_MAP_OLD_TO_NEW: Record<string, string> = {
    'Alta': '4-6 millones',
    'Media': '2-4 millones',
    'Baja': '< 2 millones',
  }

  const canonicalFormaPago =
    ListasDesplegables.FormaDePago.includes(seguimiento?.formaDePago || '')
      ? (seguimiento?.formaDePago || '')
      : (FORMA_DE_PAGO_MAP_OLD_TO_NEW[seguimiento?.formaDePago || ''] || (seguimiento?.formaDePago || ''))

  const canonicalTemperatura =
    ListasDesplegables.TemperaturaDeInteres.includes(seguimiento?.temperaturaInteres || '')
      ? (seguimiento?.temperaturaInteres || '')
      : (TEMPERATURA_MAP_OLD_TO_NEW[seguimiento?.temperaturaInteres || ''] || (seguimiento?.temperaturaInteres || ''))

  const canonicalCapacidad =
    ListasDesplegables.CapacidadDePago.includes(seguimiento?.capacidadDePago || '')
      ? (seguimiento?.capacidadDePago || '')
      : (CAPACIDAD_MAP_OLD_TO_NEW[seguimiento?.capacidadDePago || ''] || (seguimiento?.capacidadDePago || ''))

  // ======== VALIDACIÓN (estatus + motivo obligatorios) ========
  const estatusValue = seguimiento?.estatusSeguimiento ?? ''
  const motivosValue = Array.isArray(seguimiento?.motivo) ? (seguimiento!.motivo as string[]) : []
  const isEstatusValid = !!estatusValue
  const isMotivoValid  = motivosValue.length > 0
  const canSave        = isEstatusValid && isMotivoValid

  return (
    <>
      {/* --- DIALOG PRINCIPAL --- */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
            color: 'white',
            backgroundColor: 'var(--secondary-color)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={800} fontSize={20}>
              {prospectoName ? `Seguimiento: ${prospectoName}` : 'Seguimiento de Prospecto'}
            </Typography>
            {!!(seguimiento?.historialSeguimiento?.length) && (
              <Chip
                size="small"
                label={`${seguimiento!.historialSeguimiento!.length} evento(s)`}
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
              p: 1.5,
              borderRadius: 2,
              mb: 2,
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip icon={<EventIcon />} label={`Creado: ${creado}`} variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip icon={<UpdateIcon />} color="primary" label={`Última actualización: ${actualizado}`} variant="outlined" sx={{ fontWeight: 600 }} />
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {/* --- SECCION PRINCIPAL --- */}
            <SectionCard title="Datos del seguimiento">
              <Stack spacing={1}>
                <Autocomplete
                  options={prospectos}
                  value={prospectos.find(p => p.id === seguimiento?.idprospecto) ?? null}
                  onChange={(_, value) => onChange('idprospecto', value ? value.id : '')}
                  getOptionLabel={option => option.nombreCompleto}
                  disabled={readOnly}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: 'primary.main', fontWeight: 700 }}>
                        {option.nombreCompleto?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </Avatar>
                      <span style={{ fontWeight: 600 }}>{option.nombreCompleto}</span>
                      {option.correoElectronico && (
                        <span style={{ color: '#8a8a8a', marginLeft: 6, fontSize: 13 }}>{option.correoElectronico}</span>
                      )}
                    </li>
                  )}
                  renderInput={params => (
                    <TextField {...params} label="Prospecto" fullWidth required />
                  )}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {/* Forma de pago desde ListasDesplegables */}
                  <FormControl fullWidth>
                    <InputLabel>Forma de Pago</InputLabel>
                    <Select
                      label="Forma de Pago"
                      value={canonicalFormaPago}
                      onChange={e => onChange('formaDePago', e.target.value)}
                      disabled={readOnly}
                    >
                      <MenuItem value=""><em>Selecciona</em></MenuItem>
                      {ListasDesplegables.FormaDePago.map(op => (
                        <MenuItem key={op} value={op}>{op}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Temperatura de interés desde ListasDesplegables */}
                  <FormControl fullWidth>
                    <InputLabel>Temperatura de Interés</InputLabel>
                    <Select
                      label="Temperatura de Interés"
                      value={canonicalTemperatura}
                      onChange={e => onChange('temperaturaInteres', e.target.value)}
                      disabled={readOnly}
                    >
                      <MenuItem value=""><em>Selecciona</em></MenuItem>
                      {ListasDesplegables.TemperaturaDeInteres.map(op => (
                        <MenuItem key={op} value={op}>{op}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {/* Capacidad de pago desde ListasDesplegables */}
                  <FormControl fullWidth>
                    <InputLabel>Capacidad de Pago</InputLabel>
                    <Select
                      label="Capacidad de Pago"
                      value={canonicalCapacidad}
                      onChange={e => onChange('capacidadDePago', e.target.value)}
                      disabled={readOnly}
                    >
                      <MenuItem value=""><em>Selecciona</em></MenuItem>
                      {ListasDesplegables.CapacidadDePago.map(op => (
                        <MenuItem key={op} value={op}>{op}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Estatus (OBLIGATORIO) */}
                  <FormControl fullWidth error={attemptSave && !isEstatusValid}>
                    <InputLabel shrink>Estatus</InputLabel>
                    {!readOnly ? (
                      <Select
                        label="Estatus"
                        value={estatusValue || ''}
                        onChange={e => handleChangeEstatus(String(e.target.value))}
                        renderValue={value => getEstatusChip(value as string)}
                        required
                      >
                        {ESTATUS_OPCIONES.map(e => (
                          <MenuItem value={e.value} key={e.value}>
                            {getEstatusChip(e.value)}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Box mt={1}>{getEstatusChip(estatusValue)}</Box>
                    )}
                    {attemptSave && !isEstatusValid && (
                      <FormHelperText>El estatus es obligatorio.</FormHelperText>
                    )}
                  </FormControl>

                  {/* Motivos (OBLIGATORIO según estatus) */}
                  {seguimiento?.estatusSeguimiento === 'descartado' ? (
                    <Autocomplete
                      multiple
                      options={MOTIVOS_DESCARTE}
                      value={motivosValue}
                      onChange={(_, value) => {
                        setMotivosDescDraft(value as string[])
                        onChange('motivo', value)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Motivos de descarte"
                          placeholder="Selecciona motivo(s)"
                          error={attemptSave && !isMotivoValid}
                          helperText={attemptSave && !isMotivoValid ? 'Debes seleccionar al menos un motivo.' : undefined}
                          required
                        />
                      )}
                      fullWidth
                    />
                  ) : (
                    <Autocomplete
                      multiple
                      options={MOTIVOS_INTERACCION}
                      value={motivosValue}
                      onChange={(_, value) => {
                        setMotivosInterDraft(value as string[])
                        onChange('motivo', value)
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Motivos de interacción"
                          placeholder="Selecciona motivo(s)"
                          error={attemptSave && !isMotivoValid}
                          helperText={attemptSave && !isMotivoValid ? 'Debes seleccionar al menos un motivo.' : undefined}
                          required
                        />
                      )}
                      fullWidth
                    />
                  )}
                </Stack>
              </Stack>
            </SectionCard>

            {/* --- INTERESES Y UNIDAD --- */}
            <SectionCard title="Intereses y unidad">
              <Stack spacing={1}>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={allOptions}
                    value={selectedOptions}
                    getOptionLabel={option => (option.tipo === 'proyecto' ? option.nombre : option.tituloPropiedad)}
                    onChange={(_, newValue) => onChange('proyectoInteres', newValue.map(opt => opt.id))}
                    disabled={readOnly}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox checked={selected} disabled={readOnly} sx={{ mr: 1 }} />
                        {option.tipo === 'proyecto' && option.logo ? (
                          <SignedAvatar value={option.logo} alt={option.nombre} sx={{ width: 32, height: 32, mr: 1, display: 'inline-flex' }} />
                        ) : null}
                        {option.tipo === 'propiedad' && option.imagenes?.length ? (
                          <SignedAvatar value={option.imagenes[0]} alt={option.tituloPropiedad} sx={{ width: 32, height: 32, mr: 1, display: 'inline-flex' }} />
                        ) : null}
                        <ListItemText
                          primary={
                            <>
                              {option.tipo === 'proyecto' ? option.nombre : option.tituloPropiedad}
                              <span style={{ fontSize: 12, marginLeft: 8, color: option.tipo === 'proyecto' ? 'var(--primary-color)' : 'var(--secondary-color)', fontWeight: 600 }}>
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
                              <span style={{ fontSize: 11, color: option.tipo === 'proyecto' ? 'var(--primary-color)' : 'var(--secondary-color)', marginLeft: 4, fontWeight: 700 }}>
                                {option.tipo === 'proyecto' ? 'P' : 'U'}
                              </span>
                            </>
                          }
                          avatar={
                            option.tipo === 'proyecto' && option.logo ? (
                              <SignedAvatar value={option.logo} alt={option.nombre} sx={{ width: 24, height: 24 }} />
                            ) : option.tipo === 'propiedad' && option.imagenes?.length ? (
                              <SignedAvatar value={option.imagenes[0]} alt={option.tituloPropiedad} sx={{ width: 24, height: 24 }} />
                            ) : undefined
                          }
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Proyectos o propiedades de interés"
                        placeholder="Buscar y seleccionar"
                        fullWidth
                      />
                    )}
                  />
                </FormControl>

                <TextField
                  label="Unidad de interés"
                  value={seguimiento?.unidadInteres ?? ''}
                  onChange={e => onChange('unidadInteres', e.target.value)}
                  fullWidth
                  disabled={readOnly}
                />
              </Stack>
            </SectionCard>

            {/* --- NOTAS --- */}
            <SectionCard title="Notas y próxima acción">
              {/* SOLO LECTURA: Último comentario guardado */}
              <TextField
                label="Último comentario (no se guarda)"
                value={ultimoComentarioGuardado}
                fullWidth
                multiline
                minRows={2}
                disabled
                sx={{ mb: 1 }}
              />

              {/* NUEVO comentario (se guarda) */}
              <TextField
                label="Nuevo comentario"
                value={comentarioInput}
                onChange={(e) => {
                  setComentarioInput(e.target.value)
                  onChange('comentarios', e.target.value)
                }}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                disabled={readOnly}
                placeholder="Escribe el comentario de esta actualización…"
                sx={{ mb: 1 }}
              />

              <TextField
                label="Fecha próximo seguimiento"
                type="date"
                value={seguimiento?.fechaProximoSeguimiento ? seguimiento.fechaProximoSeguimiento.slice(0, 10) : ''}
                onChange={e => onChange('fechaProximoSeguimiento', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
              />
            </SectionCard>

            {/* --- HISTORIAL --- */}
            {!!(seguimiento?.historialSeguimiento?.length) && (
              <SectionCard
                title={<Typography component="span">Historial de Seguimiento</Typography>}
                right={<Chip size="small" label={seguimiento!.historialSeguimiento!.length} />}
              >
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 280, overflow: 'auto' }}>
                  <Table size="small" stickyHeader aria-label="tabla historial">
                    <TableHead>
                      <TableRow sx={{ background: '#e8f5e9' }}>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Temperatura</TableCell>
                        <TableCell>Estatus</TableCell>
                        <TableCell>Comentario</TableCell>
                        <TableCell>Próx. Seguimiento</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {seguimiento!.historialSeguimiento!.map((h, idx) => (
                        <TableRow key={h.id ?? idx} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateFull(h.fechaCreacion)}</TableCell>
                          <TableCell>{h.temperaturaInteres || '—'}</TableCell>
                          <TableCell>{getEstatusChip(h.estatusSeguimiento || '')}</TableCell>
                          <TableCell>
                            <Tooltip title={h.comentarios || ''}>
                              <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
                                {h.comentarios || '—'}
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {h.fechaProximoSeguimiento ? formatDateFull(h.fechaProximoSeguimiento) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            )}

            {/* --- ARCHIVOS/COTIZACIONES --- */}
            <SectionCard
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Cotizaciones y documentos</Typography>
                  {!!allPdfs.length && <Chip size="small" label={allPdfs.length} />}
                </Stack>
              }
              right={
                <Button startIcon={<ReceiptLongIcon />} onClick={() => setCotizadorSelectorOpen(true)} sx={{ fontWeight: 700 }}>
                  Cotizar
                </Button>
              }
            >
              <DocumentUploadList
                documents={allPdfs}
                onUpload={async () => {}}
                onDelete={async () => {}}
                maxFiles={10}
              />
            </SectionCard>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'flex-end', pb: 2, pt: 1 }}>
          <Button onClick={onClose} variant="outlined">Cancelar</Button>
          {!readOnly && (
            <Button
              onClick={() => {
                if (!canSave) {
                  setAttemptSave(true)
                  return
                }
                onSave(seguimiento!)
              }}
              variant="contained"
              color="primary"
              sx={{ fontWeight: 700 }}
              disabled={!canSave}
            >
              Guardar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* --- DIALOG SELECTOR DE PROPIEDAD O UNIDAD --- */}
      <Dialog open={cotizadorSelectorOpen} onClose={() => setCotizadorSelectorOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Selecciona una propiedad o unidad para cotizar</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={cotizadorOptions}
            groupBy={option => option.tipo === 'propiedad' ? 'Propiedades' : option.tipo === 'unidad' ? 'Unidades' : 'Proyectos'}
            getOptionLabel={option => option.tipo === 'propiedad' ? option.tituloPropiedad : option.tipo === 'unidad' ? `${option.proyectoObj?.nombre || ''} / ${option.numerounidad || ''}`.trim() : option.nombre}
            renderOption={(props, option) => (
              <li {...props}>
                <Box display="flex" alignItems="center">
                  {option.tipo === 'propiedad' && Array.isArray(option.imagenes) && option.imagenes.length > 0 && (
                    <SignedAvatar value={option.imagenes[0]} alt={option.tituloPropiedad} sx={{ width: 28, height: 28, mr: 1 }} />
                  )}
                  {option.tipo !== 'propiedad' && option.proyectoObj.logo && (
                    <SignedAvatar value={option.proyectoObj.logo} alt={option.proyectoObj.nombre} sx={{ width: 28, height: 28, mr: 1 }} />
                  )}
                  <Typography fontWeight={600} fontSize={15}>
                    {option.tipo === 'propiedad' ? option.tituloPropiedad : option.tipo === 'unidad' ? `${option.proyectoObj?.nombre || ''} / ${option.numerounidad || ''}` : option.nombre}
                  </Typography>
                  <Chip size="small" label={option.tipo === 'propiedad' ? 'Propiedad' : option.tipo === 'unidad' ? 'Unidad' : 'Proyecto'} sx={{ ml: 2, bgcolor: option.tipo === 'propiedad' ? 'secondary.main' : 'primary.main', color: '#fff', fontWeight: 700 }} />
                </Box>
              </li>
            )}
            renderInput={params => <TextField {...params} label="Buscar" fullWidth />}
            onChange={(_, value) => {
              setCotizadorSeleccionado(value)
              setCotizadorSelectorOpen(false)
              if (value) {
                if (value.tipo === 'propiedad') setOpenCotizadorPropiedad(true)
                else if (value.tipo === 'unidad') setOpenCotizadorUnidad(true)
              }
            }}
            autoHighlight
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCotizadorSelectorOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* --- MODAL DE COTIZADOR DE PROPIEDAD --- */}
      {cotizadorSeleccionado?.tipo === 'propiedad' && (
        <CotizadorPropiedadModal
          propiedad={cotizadorSeleccionado}
          open={openCotizadorPropiedad}
          onClose={() => setOpenCotizadorPropiedad(false)}
          onAsignarCotizacion={doc => {
            onChange('pdfCotizaciones', [...(seguimiento!.pdfCotizaciones || []), doc])
          }}
        />
      )}

      {/* --- MODAL DE COTIZADOR DE UNIDAD/PROYECTO --- */}
      {cotizadorSeleccionado?.tipo === 'unidad' && (
        <CotizadorModal
          proyecto={cotizadorSeleccionado.proyectoObj}
          unidad={cotizadorSeleccionado}
          open={openCotizadorUnidad}
          onClose={() => setOpenCotizadorUnidad(false)}
          onAsignarCotizacion={doc => {
            onChange('pdfCotizaciones', [...(seguimiento!.pdfCotizaciones || []), doc])
          }}
        />
      )}
    </>
  )
}

export default SeguimientoModal
