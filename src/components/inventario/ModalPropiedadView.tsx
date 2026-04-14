import React, { useState } from 'react'
import {
  Modal,
  Box,
  Typography,
  Grid,
  Divider,
  IconButton,
  Chip,
  Stack,
  Dialog,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!propiedad) return null

  const imagenes = (propiedad.imagenes || []).filter(img => img?.path && img?.bucket)

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagenes.length)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNextImage()
    if (e.key === 'ArrowLeft') handlePrevImage()
  }

  return (
    <>
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
          width: { xs: '95%', sm: '85%', md: '75%', lg: '65%' },
          maxWidth: 1200,
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

        {/* Imágenes */}
        {imagenes.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ color: 'var(--primary-color)', fontWeight: 500, mb: 1 }}>
              Imágenes ({imagenes.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              {imagenes.map((img, i) => (
                <Box 
                  key={i}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.05)' },
                    position: 'relative'
                  }}
                  onClick={() => handleImageClick(i)}
                >
                  <SignedImage
                    path={img.path!}
                    bucket={img.bucket!}
                    alt={`Imagen ${i + 1}`}
                    sx={{
                      width: 120,
                      height: 90,
                      borderRadius: 2,
                      border: '1px solid #eee',
                      objectFit: 'cover',
                      background: '#fafafa'
                    }}
                  />
                  <Typography
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      px: 0.5,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  >
                    {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Modal>

      {/* Lightbox - Carrusel de imágenes */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        onKeyDown={handleKeyDown}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            boxShadow: 24,
          }
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={() => setLightboxOpen(false)}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Contador de imágenes */}
        <Box sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          px: 2,
          py: 1,
          borderRadius: 2,
          zIndex: 10,
          fontWeight: 600
        }}>
          {currentImageIndex + 1} / {imagenes.length}
        </Box>

        {imagenes.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            minHeight: '70vh',
            p: 4
          }}>
            {/* Flecha izquierda */}
            {imagenes.length > 1 && (
              <IconButton
                onClick={handlePrevImage}
                sx={{
                  position: 'absolute',
                  left: 16,
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)', transform: 'scale(1.1)' },
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
              >
                <ArrowBackIosNewIcon />
              </IconButton>
            )}

            {/* Imagen actual */}
            <SignedImage
              path={imagenes[currentImageIndex].path!}
              bucket={imagenes[currentImageIndex].bucket!}
              alt={`Imagen ${currentImageIndex + 1}`}
              sx={{
                maxWidth: '90%',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 1
              }}
            />

            {/* Flecha derecha */}
            {imagenes.length > 1 && (
              <IconButton
                onClick={handleNextImage}
                sx={{
                  position: 'absolute',
                  right: 16,
                  color: 'white',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)', transform: 'scale(1.1)' },
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            )}
          </Box>
        )}

        {/* Miniaturas en la parte inferior */}
        {imagenes.length > 1 && (
          <Box sx={{
            display: 'flex',
            gap: 1,
            p: 2,
            overflowX: 'auto',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            '&::-webkit-scrollbar': {
              height: 8
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 4
            }
          }}>
            {imagenes.map((img, i) => (
              <Box
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                sx={{
                  cursor: 'pointer',
                  opacity: currentImageIndex === i ? 1 : 0.5,
                  border: currentImageIndex === i ? '2px solid white' : '2px solid transparent',
                  borderRadius: 1,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 1 },
                  flexShrink: 0
                }}
              >
                <SignedImage
                  path={img.path!}
                  bucket={img.bucket!}
                  alt={`Miniatura ${i + 1}`}
                  sx={{
                    width: 80,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Dialog>
    </>
  )
}

export default PropiedadViewModal
