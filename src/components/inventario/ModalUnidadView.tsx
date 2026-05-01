import React from 'react'
import { Modal, Box, Typography, Grid, IconButton, Chip, Stack, Divider } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SignedImage from '../general/SignedImage'
import SignedAvatar from '../general/SignedAvatar'
import SignedImageCarousel from '../general/SinedImageCarousel'
import { Unidad, Proyecto } from '../../config/types'

interface ModalUnidadViewProps {
  open: boolean
  onClose: () => void
  unidad: Unidad | null
  proyecto: Proyecto | null
  asPage?: boolean
}

const ModalUnidadView: React.FC<ModalUnidadViewProps> = ({
  open,
  onClose,
  unidad,
  proyecto,
  asPage = false
}) => {
  if (!unidad || !proyecto) return null

  const content = (
    <Box sx={{
      position: asPage ? 'static' : 'absolute',
      top: asPage ? undefined : '50%',
      left: asPage ? undefined : '50%',
      transform: asPage ? undefined : 'translate(-50%, -50%)',
      bgcolor: 'white',
      borderRadius: 3,
      boxShadow: asPage ? 2 : 24,
      width: asPage ? '100%' : { xs: '95%', sm: '85%', md: '75%', lg: '65%' },
      maxWidth: 1200,
      maxHeight: asPage ? 'none' : '94vh',
      outline: 'none',
      p: 4,
      overflow: 'auto',
      mx: asPage ? 'auto' : undefined
    }}>
      {!asPage && (
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
          <CloseIcon />
        </IconButton>
      )}

      {/* Logo proyecto */}
      {proyecto.logo && (
        <Stack alignItems="center" sx={{ mb: 2 }}>
          <SignedAvatar
            value={proyecto.logo}
            alt={proyecto.nombre}
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              mb: 1,
              boxShadow: 2,
              bgcolor: '#e5e7eb'
            }}
          />
        </Stack>
      )}

      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--primary-color)', mb: 2, textAlign: 'center' }}>
        Unidad {unidad.numerounidad}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
        <Chip label={unidad.estatus.charAt(0).toUpperCase() + unidad.estatus.slice(1)} color="primary" />
        <Chip label={proyecto.nombre} color="secondary" />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Precio: ${Number(unidad.preciolista).toLocaleString()}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Renders principales */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {unidad.render && (
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Render</Typography>
            <SignedImage
              path={unidad.render.path!}
              bucket={unidad.render.bucket!}
              alt="Render"
              sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 100 }}
            />
          </Grid>
        )}
        {unidad.isometrico && (
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Isométrico</Typography>
            <SignedImage
              path={unidad.isometrico.path!}
              bucket={unidad.isometrico.bucket!}
              alt="Isométrico"
              sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 100 }}
            />
          </Grid>
        )}
        {unidad.plano && (
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Plano</Typography>
            <SignedImage
              path={unidad.plano.path!}
              bucket={unidad.plano.bucket!}
              alt="Plano"
              sx={{ width: '100%', borderRadius: 2, objectFit: 'cover', maxHeight: 100 }}
            />
          </Grid>
        )}
      </Grid>

      {/* Carrusel de imágenes */}
      {unidad.imagenes && unidad.imagenes.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Imágenes adicionales:</Typography>
          <SignedImageCarousel items={unidad.imagenes} width={100} height={100} />
        </>
      )}

      {/* Extras */}
      {unidad.extras && Object.keys(unidad.extras).length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Extras</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {Object.entries(unidad.extras).map(([key, val]) =>
              <Chip key={key} label={`${key}: ${val}`} variant="outlined" />
            )}
          </Stack>
        </>
      )}
    </Box>
  )

  if (asPage) {
    return content
  }

  return (
    <Modal open={open} onClose={onClose}>
      {content}
    </Modal>
  )
}

export default ModalUnidadView
