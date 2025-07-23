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
  Autocomplete
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CommentIcon from '@mui/icons-material/Comment';
import CloseIcon from '@mui/icons-material/Close'
import { Propiedad, Prospecto, Proyecto } from '../../config/types'
import { ListasDesplegables } from '../../config/variables'
import SignedAvatar from '../general/SignedAvatar'

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
  // Opciones combinadas (proyectos y propiedades)
  const allOptions = [
    ...proyectos.map(p => ({ ...p, tipo: 'proyecto' as const })),
    ...propiedades.map(p => ({ ...p, tipo: 'propiedad' as const }))
  ]
  const selectedOptions = allOptions.filter(opt =>
    (prospecto?.proyectosInteres ?? []).includes(opt.id)
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: 'white', background: 'var(--secondary-color)', mb: 1,
        }}>
        <Typography fontWeight={700} fontSize={19}>Registro de Prospecto</Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {/* DATOS GENERALES */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
            Datos generales
          </Typography>
          <Stack spacing={1} direction={{ xs: "column", sm: "row" }}>
            <TextField
              label="Nombre completo"
              value={prospecto?.nombreCompleto}
              onChange={e => onChange('nombreCompleto', e.target.value)}
              fullWidth
              required
              autoFocus
              placeholder="Ej. Juan Pérez"
              disabled={readOnly}
              InputProps={{
                style: { fontWeight: 600 }
              }}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Correo electrónico"
              value={prospecto?.correoElectronico ?? ''}
              onChange={e => onChange('correoElectronico', e.target.value)}
              fullWidth
              type="email"
              placeholder="Ej. juan@email.com"
              disabled={readOnly}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1 }} color="primary" />
              }}
            />
            <TextField
              label="Celular"
              value={prospecto?.celular ?? ''}
              onChange={e => onChange('celular', e.target.value)}
              fullWidth
              placeholder="Ej. 3312345678"
              disabled={readOnly}
              InputProps={{
                startAdornment: <PhoneIphoneIcon sx={{ mr: 1 }} color="primary" />
              }}
            />
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* OTROS DATOS */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
            Información adicional
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Ocupación"
              value={prospecto?.ocupacionCliente ?? ''}
              onChange={e => onChange('ocupacionCliente', e.target.value)}
              fullWidth
              placeholder="Ej. Ingeniero, Arquitecto..."
              disabled={readOnly}
              InputProps={{
                startAdornment: <WorkOutlineIcon sx={{ mr: 1 }} color="primary" />
              }}
            />
            <TextField
              label="Comentarios"
              value={prospecto?.comentarios ?? ''}
              onChange={e => onChange('comentarios', e.target.value)}
              fullWidth
              placeholder="Anota aquí cualquier observación relevante"
              disabled={readOnly}
              InputProps={{
                startAdornment: <CommentIcon sx={{ mr: 1 }} color="primary" />
              }}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* INTERESES */}
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
            Proyectos y propiedades de interés
          </Typography>
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
              sx={{
                bgcolor: "#f8fafc",
                p: 1,
                borderRadius: 2
              }}
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
                  label="Selecciona proyectos o propiedades"
                  placeholder="Buscar y seleccionar"
                  fullWidth
                />
              )}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', pb: 2, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        {!readOnly && (
          <Button
            onClick={() => onSave(prospecto!)}
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

export default NuevoProspectoModal
