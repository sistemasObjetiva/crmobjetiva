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
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from '@mui/material'
import { Propiedad, Prospecto, Proyecto, Seguimiento } from '../../config/types'
import { ListasDesplegables } from '../../config/variables'
import SignedAvatar from '../general/SignedAvatar'
import CloseIcon from '@mui/icons-material/Close'

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
  open, seguimiento, prospectos,  onChange, onClose, onSave, proyectos, propiedades, readOnly = false
}) => {
  const allOptions = [
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]

  // Opciones seleccionadas actuales (por id)
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
        <Typography>Seguimiento</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>          
          <Autocomplete
            options={prospectos}
            value={prospectos.find(p => p.id === seguimiento?.idprospecto) ?? null}
            onChange={(_, value) => onChange('idprospecto', value ? value.id : '')}
            getOptionLabel={option => option.nombreCompleto}
            disabled={readOnly}
            renderOption={(props, option) => (
              <li {...props}>
                {option.nombreCompleto}
                {option.correoElectronico ? ` (${option.correoElectronico})` : ''}
              </li>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label="Prospecto"
                fullWidth
                required
              />
            )}
          />
          <FormControl fullWidth>
            <InputLabel>Forma de Pago</InputLabel>
            <Select
              label="Forma de Pago"
              value={seguimiento?.formaDePago ?? ''}
              onChange={e => onChange('formaDePago', e.target.value)}
              disabled={readOnly}
            >
              {ListasDesplegables.FormaDePago.map(e => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Temperatura Interes</InputLabel>
            <Select
              label="Temperatura Interes"
              value={seguimiento?.temperaturaInteres ?? ''}
              onChange={e => onChange('temperaturaInteres', e.target.value)}
              disabled={readOnly}
            >
              {ListasDesplegables.TemperaturaDeInteres.map(e => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Capacidad de Pago</InputLabel>
            <Select
              label="Capacidad de Pago"
              value={seguimiento?.capacidadDePago ?? ''}
              onChange={e => onChange('capacidadDePago', e.target.value)}
              disabled={readOnly}
            >
              {ListasDesplegables.CapacidadDePago.map(e => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Proyectos y Propiedades de Interés */}
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
                  <Checkbox
                    checked={selected}
                    disabled={readOnly}
                    sx={{ mr: 1 }}
                  />
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
            label="Unidad Interes"
            value={seguimiento?.unidadInteres ?? ''}
            onChange={e => onChange('unidadInteres', e.target.value)}
            fullWidth
            disabled={readOnly}
          />
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
          <FormControl fullWidth>
            <InputLabel shrink>Estatus</InputLabel>
            {!readOnly ? (
                <Select
                label="Estatus"
                value={seguimiento?.estatusSeguimiento ?? 'activo'}
                onChange={e => onChange('estatusSeguimiento', e.target.value)}
                renderValue={value => (
                    <Chip
                    label={value === 'cerrado' ? 'Cerrado' : 'Activo'}
                    sx={{
                        bgcolor: value === 'cerrado' ? 'grey.900' : 'success.main',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 15,
                        px: 2,
                        height: 32,
                        borderRadius: 1.5,
                    }}
                    />
                )}
                >
                <MenuItem value="activo">
                    <Chip
                    label="Activo"
                    sx={{
                        bgcolor: 'success.main',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 15,
                        px: 2,
                        height: 28,
                        borderRadius: 1.5,
                    }}
                    />
                </MenuItem>
                <MenuItem value="cerrado">
                    <Chip
                    label="Cerrado"
                    sx={{
                        bgcolor: 'grey.900',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 15,
                        px: 2,
                        height: 28,
                        borderRadius: 1.5,
                    }}
                    />
                </MenuItem>
                </Select>
            ) : (
                <Box mt={1}>
                <Chip
                    label={seguimiento?.estatusSeguimiento === 'cerrado' ? 'Cerrado' : 'Activo'}
                    sx={{
                    bgcolor: seguimiento?.estatusSeguimiento === 'cerrado'
                        ? 'error.main'
                        : 'success.main',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 15,
                    px: 2,
                    height: 32,
                    borderRadius: 1.5,
                    }}
                />
                </Box>
            )}
            </FormControl>


        </Stack>

        {/* Tabla historial */}
        {(seguimiento?.historialSeguimiento && seguimiento.historialSeguimiento.length > 0) && (
          <Box mt={4}>
            <Typography variant="h6" fontSize={18} fontWeight={700} mb={1} color="primary">
              Historial de Seguimiento
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Temperatura</TableCell>
                  <TableCell>Comentario</TableCell>
                  <TableCell>Próximo Seguimiento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {seguimiento.historialSeguimiento.map((h, idx) => (
                  <TableRow key={h.id ?? idx}>
                    <TableCell>
                      {h.fechaCreacion ? new Date(h.fechaCreacion).toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      {h.temperaturaInteres}
                    </TableCell>
                    <TableCell>
                      {h.comentarios}
                    </TableCell>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {!readOnly && (
          <Button
            onClick={() => onSave(seguimiento!)}
            variant="contained"
            color="primary"
          >
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default SeguimientoModal
