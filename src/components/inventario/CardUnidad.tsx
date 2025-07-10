import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import { Unidad, Proyecto } from '../../config/types'
import SignedAvatar from '../general/SignedAvatar'

interface CardUnidadVisorProps {
  unidad: Unidad
  proyecto: Proyecto
  onView: (unidad: Unidad, proyecto: Proyecto) => void
  onCotizar: (unidad: Unidad, proyecto: Proyecto) => void
}
const estatusColor: Record<string, 'success' | 'error' | 'info'> = {
  disponible: 'success',
  vendido: 'error',
  apartado: 'info',
};

const CardUnidadVisor: React.FC<CardUnidadVisorProps> = ({
  unidad,
  proyecto,
  onView,
  onCotizar
}) => {
  // Imagen principal: el primer render, si no hay, primer isométrico, si no hay, HomeWorkIcon
  const mainImage = unidad.render ?? unidad.isometrico ?? null;
  const logoProyecto = proyecto.logo ?? null;

  const minigallery: { label: string, img?: any }[] = [
    { label: 'Render', img: unidad.render },
    { label: 'Isométrico', img: unidad.isometrico },
    { label: 'Plano', img: unidad.plano },
  ].filter(x => x.img);

  return (
    <Card sx={{
      borderRadius: 4,
      boxShadow: 3,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'transform .15s',
      '&:hover': { transform: 'scale(1.03)' },
      overflow: 'hidden'
    }}>
      <Box
        position="relative"
        sx={{
          width: '100%',
          height: 160,
          bgcolor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {mainImage ? (
          <SignedAvatar
            value={mainImage}
            sx={{
              width: '100%',
              height: 160,
              objectFit: 'cover',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }}
          />
        ) : (
          <HomeWorkIcon sx={{ fontSize: 90, color: '#b0b0b0' }} />
        )}

        {/* Logo proyecto */}
        {logoProyecto && logoProyecto.path && logoProyecto.bucket && (
          <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
            <SignedAvatar
              value={logoProyecto}
              alt={proyecto.nombre}
              sx={{
                width: 44,
                height: 44,
                border: '2px solid #fff',
                boxShadow: 2,
                bgcolor: '#e5e7eb'
              }}
            />
          </Box>
        )}
      </Box>

      {/* Mini galería */}
      {minigallery.length > 1 && (
        <Stack direction="row" spacing={1} px={2} py={1} alignItems="center" justifyContent="center">
          {minigallery.map((mini, idx) =>
            mini.img && (
              <Tooltip title={mini.label} key={idx}>
                <SignedAvatar
                  value={mini.img}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid #fff',
                    boxShadow: 1,
                    bgcolor: '#e5e7eb'
                  }}
                />
              </Tooltip>
            )
          )}
        </Stack>
      )}

      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            Unidad {unidad.numerounidad}
          </Typography>
          <Chip
            size="small"
            label={unidad.estatus.charAt(0).toUpperCase() + unidad.estatus.slice(1)}
            color={estatusColor[unidad.estatus.toLowerCase()] || 'default'}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Proyecto: {proyecto.nombre}
        </Typography>
        <Chip
          label={`Precio: $${Number(unidad.preciolista).toLocaleString()}`}
          color="info"
          size="small"
          sx={{ mb: 1 }}
        />

        {unidad.extras && Object.keys(unidad.extras).length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Extras:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
              {Object.entries(unidad.extras).map(([key, val]) =>
                <Chip key={key} label={`${key}: ${val}`} variant="outlined" size="small" />
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Ver detalles">
          <IconButton color="info" onClick={() => onView(unidad, proyecto)}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cotizar">
          <IconButton color="success" onClick={() => onCotizar(unidad, proyecto)}>
            <RequestQuoteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default CardUnidadVisor;
