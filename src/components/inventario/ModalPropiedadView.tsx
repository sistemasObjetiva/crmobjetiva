import React from 'react'
import {
  Modal,
  Box,
  Typography,
  Grid,
  Divider,
  IconButton,
  Chip,
  Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SignedImage from '../general/SignedImage'
import { Propiedad } from '../../config/types'

interface PropiedadViewModalProps {
  open: boolean
  onClose: () => void
  propiedad: Propiedad | null
}

const PropiedadViewModal: React.FC<PropiedadViewModalProps> = ({
  open,
  onClose,
  propiedad
}) => {
  if (!propiedad) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-propiedad-view"
      aria-describedby="modal-propiedad-view-content"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: 24,
          width: { xs: '95%', sm: 540 },
          maxHeight: '94vh',
          outline: 'none',
          p: 4,
          overflow: 'auto',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>

        {/* Título */}
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--primary-color)', mb: 2, textAlign: 'center' }}>
          {propiedad.tituloPropiedad}
        </Typography>

        {/* Estado/estatus */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Chip
            label={propiedad.estatus}
            color={
              propiedad.estatus === 'vendido'
                ? 'error'
                : propiedad.estatus === 'apartado'
                ? 'warning'
                : 'success'
            }
            sx={{ fontWeight: 600, fontSize: 18 }}
          />
        </Box>

        {/* Amenidades */}
        {propiedad.amenidades && propiedad.amenidades.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, justifyContent: 'center' }}>
            {propiedad.amenidades.map((am, idx) => (
              <Chip key={am + idx} label={am} color="secondary" size="small" />
            ))}
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Características principales */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Tipo
            </Typography>
            <Typography sx={{ color: '#555', mb: 1 }}>
              {propiedad.tipo}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Creación
            </Typography>
            <Typography sx={{ color: '#555', mb: 1 }}>
              {propiedad.fechaCreacion ? new Date(propiedad.fechaCreacion).toLocaleDateString() : '-'}
            </Typography>
          </Grid>
          {(propiedad.venta || propiedad.precioVenta) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                Precio Venta
              </Typography>
              <Typography sx={{ color: '#555', mb: 1 }}>
                {propiedad.precioVenta ? `$${Number(propiedad.precioVenta).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
          )}
          {(propiedad.renta || propiedad.precioRenta) && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                Precio Renta
              </Typography>
              <Typography sx={{ color: '#555', mb: 1 }}>
                {propiedad.precioRenta ? `$${Number(propiedad.precioRenta).toLocaleString()}` : '-'}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Ubicación */}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 1 }}>
          Ubicación
        </Typography>
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {[
            ['País', propiedad.pais],
            ['Estado', propiedad.estado],
            ['Ciudad', propiedad.ciudad],
            ['Colonia', propiedad.colonia],
            ['Calle', propiedad.calle],
            ['Número', propiedad.numero],
            ['Interior', propiedad.interior],
            ['Esquina', propiedad.esquina],
            ['Código Postal', propiedad.codigoPostal],
          ].map(([label, value]) =>
            value ? (
              <Grid item xs={12} sm={6} key={label}>
                <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)' }}>
                  {label}
                </Typography>
                <Typography sx={{ color: '#555', mb: 1 }}>{value}</Typography>
              </Grid>
            ) : null
          )}
        </Grid>

        {/* Exclusividad y colaboración */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 1 }}>
          Exclusividad y Colaboración
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Exclusividad</Typography>
            <Typography>{propiedad.exclusividad ? 'Sí' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Comisión compartida</Typography>
            <Typography>{propiedad.comisionCompartida ? 'Sí' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2">Comparte 50%</Typography>
            <Typography>{propiedad.comparte50 ? 'Sí' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Condiciones para compartir</Typography>
            <Typography>{propiedad.condicionesCompartir || '-'}</Typography>
          </Grid>
        </Grid>

        {/* Características adicionales */}
        {propiedad.variables && Object.keys(propiedad.variables).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 1 }}>
              Características Adicionales
            </Typography>
            <Grid container spacing={1}>
              {Object.entries(propiedad.variables).map(([label, value]) =>
                value !== null && value !== '' ? (
                  <Grid item xs={12} sm={6} key={label}>
                    <Typography variant="subtitle2">{label}</Typography>
                    <Typography>{String(value)}</Typography>
                  </Grid>
                ) : null
              )}
            </Grid>
          </>
        )}

        {/* Descripción */}
        {propiedad.descripcion && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 1 }}>
              Descripción
            </Typography>
            <Typography sx={{ color: '#444', whiteSpace: 'pre-line' }}>
              {propiedad.descripcion}
            </Typography>
          </>
        )}

        {/* Imágenes */}
        {propiedad.imagenes && propiedad.imagenes.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ color: 'var(--primary-color)', fontWeight: 500, mb: 1 }}>
              Imágenes
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              {propiedad.imagenes.map((img, i) =>
                img?.path && img?.bucket ? (
                  <SignedImage
                    key={i}
                    path={img.path}
                    bucket={img.bucket}
                    alt={`Imagen ${i + 1}`}
                    sx={{
                      width: { xs: 100, sm: 140 },
                      height: { xs: 70, sm: 100 },
                      borderRadius: 2,
                      border: '1px solid #eee',
                      objectFit: 'cover',
                      background: '#fafafa'
                    }}
                  />
                ) : null
              )}
            </Box>
          </>
        )}
      </Box>
    </Modal>
  )
}

export default PropiedadViewModal
