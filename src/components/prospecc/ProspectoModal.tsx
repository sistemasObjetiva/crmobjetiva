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
  Autocomplete
} from '@mui/material'
import { Propiedad, Prospecto, Proyecto } from '../../config/types'
import { ListasDesplegables } from '../../config/variables'
import SignedAvatar from '../general/SignedAvatar'
import CloseIcon from '@mui/icons-material/Close'

interface NuevoProspectoModalProps {
  open: boolean
  prospecto: Prospecto | null
  proyectos: Proyecto[]
  propiedades: Propiedad[]
  onChange: (field: keyof Prospecto, value: any) => void
  onClose: () => void
  onSave: (P: Prospecto) => void
  readOnly?: boolean
}

const NuevoProspectoModal: React.FC<NuevoProspectoModalProps> = ({
  open, prospecto, onChange, onClose, onSave, proyectos, propiedades, readOnly = false
}) => {
  // Combina ambas listas con un campo tipo
  const allOptions = [
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]

  // Opciones seleccionadas actuales (por id)
  const selectedOptions = allOptions.filter(opt =>
    (prospecto?.proyectosInteres ?? []).includes(opt.id)
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
        <Typography>Prospecto</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nombre completo"
            value={prospecto?.nombreCompleto}
            onChange={e => onChange('nombreCompleto', e.target.value)}
            fullWidth
            required
            disabled={readOnly}
          />

          <TextField
            label="Correo electrónico"
            value={prospecto?.correoElectronico ?? ''}
            onChange={e => onChange('correoElectronico', e.target.value)}
            fullWidth
            type="email"
            disabled={readOnly}
          />

          <TextField
            label="Celular"
            value={prospecto?.celular ?? ''}
            onChange={e => onChange('celular', e.target.value)}
            fullWidth
            disabled={readOnly}
          />

          {/* Estado Civil */}
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

          {/* Clasificación de Cliente */}
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

          {/* Medio de Captación */}
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

          {/* Ocupación */}
          <TextField
            label="Ocupación"
            value={prospecto?.ocupacionCliente ?? ''}
            onChange={e => onChange('ocupacionCliente', e.target.value)}
            fullWidth
            disabled={readOnly}
          />

          <TextField
            label="Comentarios"
            value={prospecto?.comentarios ?? ''}
            onChange={e => onChange('comentarios', e.target.value)}
            fullWidth
            disabled={readOnly}
          />

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
                    onChange('proyectosInteres', newValue.map(opt => opt.id))
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

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {!readOnly && (
          <Button
            onClick={() => onSave(prospecto!)}
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

export default NuevoProspectoModal
