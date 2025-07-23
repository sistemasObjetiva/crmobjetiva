import React from 'react'
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
  Divider,
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Avatar,
} from '@mui/material'
import { Propiedad, Prospecto, Proyecto, Seguimiento } from '../../config/types'
import SignedAvatar from '../general/SignedAvatar'
import CloseIcon from '@mui/icons-material/Close'

// NUEVOS ESTATUS EN ESPAÑOL Y SUS COLORES
const ESTATUS_OPCIONES = [
  { value: 'contactado', label: 'Contactado', color: 'info.main' },
  { value: 'interaccion', label: 'Interacción', color: 'primary.main' },
  { value: 'cotizacion', label: 'Cotización', color: 'secondary.main' },
  { value: 'visita', label: 'Visita', color: 'success.main' },
  { value: 'posible', label: 'Posible', color: 'warning.main' },
  { value: 'apartado', label: 'Apartado', color: 'purple.main' },
  { value: 'vendido', label: 'Vendido', color: 'grey.900' },
];

const getEstatusChip = (estatus: string) => {
  const found = ESTATUS_OPCIONES.find(e => e.value === estatus);
  return found ? (
    <Chip
      label={found.label}
      sx={{
        bgcolor: found.color,
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
        px: 2,
        height: 30,
        borderRadius: 2,
        letterSpacing: 1,
      }}
    />
  ) : (
    <Chip label={estatus} />
  );
};

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

const SeguimientoModal: React.FC<Props> = ({
  open, seguimiento, prospectos, onChange, onClose, onSave, proyectos, propiedades, readOnly = false
}) => {
  const allOptions = [
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]

  const selectedOptions = allOptions.filter(opt =>
    (Array.isArray(seguimiento?.proyectoInteres)
      ? seguimiento.proyectoInteres.includes(opt.id)
      : seguimiento?.proyectoInteres === opt.id)
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
        <Typography fontWeight={700} fontSize={19}>Seguimiento de Prospecto</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>

          {/* --- SECCION PRINCIPAL --- */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            Datos del seguimiento
          </Typography>
          <Stack spacing={1}>
            <Autocomplete
              options={prospectos}
              value={prospectos.find(p => p.id === seguimiento?.idprospecto) ?? null}
              onChange={(_, value) => onChange('idprospecto', value ? value.id : '')}
              getOptionLabel={option => option.nombreCompleto}
              disabled={readOnly}
              renderOption={(props, option) => (
            <li {...props}>
              <Avatar sx={{ width: 28, height: 28, mr: 1, bgcolor: "primary.main", fontWeight: 700 }}>
                {option.nombreCompleto?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
              </Avatar>
              <span style={{ fontWeight: 600 }}>{option.nombreCompleto}</span>
              {option.correoElectronico ? (
                <span style={{ color: "#8a8a8a", marginLeft: 6, fontSize: 13 }}>{option.correoElectronico}</span>
              ) : ''}
            </li>
          )}
              renderInput={params => (
                <TextField {...params} label="Prospecto" fullWidth required />
              )}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Forma de Pago</InputLabel>
                <Select
                  label="Forma de Pago"
                  value={seguimiento?.formaDePago ?? ''}
                  onChange={e => onChange('formaDePago', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value=""><em>Selecciona</em></MenuItem>
                  <MenuItem value="Contado">Contado</MenuItem>
                  <MenuItem value="Financiamiento">Financiamiento</MenuItem>
                  <MenuItem value="Crédito">Crédito</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Temperatura de Interés</InputLabel>
                <Select
                  label="Temperatura de Interés"
                  value={seguimiento?.temperaturaInteres ?? ''}
                  onChange={e => onChange('temperaturaInteres', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value=""><em>Selecciona</em></MenuItem>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Capacidad de Pago</InputLabel>
                <Select
                  label="Capacidad de Pago"
                  value={seguimiento?.capacidadDePago ?? ''}
                  onChange={e => onChange('capacidadDePago', e.target.value)}
                  disabled={readOnly}
                >
                  <MenuItem value=""><em>Selecciona</em></MenuItem>
                  <MenuItem value="Alta">Alta</MenuItem>
                  <MenuItem value="Media">Media</MenuItem>
                  <MenuItem value="Baja">Baja</MenuItem>
                </Select>
              </FormControl>

              {/* Estatus NUEVO */}
              <FormControl fullWidth>
                <InputLabel shrink>Estatus</InputLabel>
                {!readOnly ? (
                  <Select
                    label="Estatus"
                    value={seguimiento?.estatusSeguimiento ?? 'contactado'}
                    onChange={e => onChange('estatusSeguimiento', e.target.value)}
                    renderValue={value => getEstatusChip(value as string)}
                  >
                    {ESTATUS_OPCIONES.map(e => (
                      <MenuItem value={e.value} key={e.value}>
                        {getEstatusChip(e.value)}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <Box mt={1}>
                    {getEstatusChip(seguimiento?.estatusSeguimiento ?? '')}
                  </Box>
                )}
              </FormControl>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* --- INTERESES Y UNIDAD --- */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            Intereses y unidad
          </Typography>
          <Stack spacing={1}>
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
                  onChange('proyectoInteres', newValue.map(opt => opt.id))
                }
                disabled={readOnly}
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

          <TextField
            label="Comentarios"
            value={seguimiento?.comentarios ?? ''}
            onChange={e => onChange('comentarios', e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            disabled={readOnly}
          />

          <TextField
            label="Fecha próximo seguimiento"
            type="date"
            value={seguimiento?.fechaProximoSeguimiento
              ? seguimiento.fechaProximoSeguimiento.slice(0, 10)
              : ''}
            onChange={e => onChange('fechaProximoSeguimiento', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={readOnly}
          />

          {/* --- HISTORIAL --- */}
          {(seguimiento?.historialSeguimiento && seguimiento.historialSeguimiento.length > 0) && (
            <Box mt={4}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" fontSize={18} fontWeight={700} mb={1} color="primary">
                Historial de Seguimiento
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#e8f5e9" }}>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Temperatura</TableCell>
                    <TableCell>Comentario</TableCell>
                    <TableCell>Próx. Seguimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimiento.historialSeguimiento.map((h, idx) => (
                    <TableRow key={h.id ?? idx}>
                      <TableCell>
                        {h.fechaCreacion ? new Date(h.fechaCreacion).toLocaleDateString() : ''}
                      </TableCell>
                      <TableCell>{h.temperaturaInteres}</TableCell>
                      <TableCell>{h.comentarios}</TableCell>
                      <TableCell>
                        {h.fechaProximoSeguimiento
                          ? new Date(h.fechaProximoSeguimiento).toLocaleDateString()
                          : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', pb: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        {!readOnly && (
          <Button
            onClick={() => onSave(seguimiento!)}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 700 }}
          >
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SeguimientoModal
