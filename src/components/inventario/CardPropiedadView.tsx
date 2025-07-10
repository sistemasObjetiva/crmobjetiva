import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import { Propiedad } from '../../config/types';
import SignedAvatar from '../general/SignedAvatar';

interface CardPropiedadVisorProps {
  propiedad: Propiedad;
  onView: (propiedad: Propiedad) => void;
  onCotizar?: (propiedad: Propiedad) => void;
}

const estatusColor: Record<string, 'success' | 'error' | 'info'> = {
  disponible: 'success',
  vendido: 'error',
  apartado: 'info',
};

const CardPropiedadVisor: React.FC<CardPropiedadVisorProps> = ({
  propiedad,
  onView,
  onCotizar,
}) => {
  // Imagen principal
  const mainImage = propiedad.imagenes?.[0] ?? null;

  // Dirección completa
  const direccion = [
    propiedad.calle,
    propiedad.numero,
    propiedad.interior ? `Int. ${propiedad.interior}` : '',
    propiedad.colonia,
    propiedad.ciudad,
    propiedad.estado,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform .15s',
        '&:hover': { transform: 'scale(1.03)' },
      }}
    >
      {/* Imagen principal */}
      {mainImage ? (
        <SignedAvatar
          value={mainImage}
          alt={propiedad.tituloPropiedad}
          sx={{
            width: '100%',
            height: 140,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            objectFit: 'cover',
            fontSize: 60,
            bgcolor: '#e5e7eb',
          }}
        />
      ) : (
        <Box
          height={140}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            background: 'linear-gradient(90deg, #f5f7fa, #c3cfe2)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <ImageIcon fontSize="large" color="disabled" />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            {propiedad.tituloPropiedad}
          </Typography>
          <Chip
            size="small"
            label={propiedad.estatus.charAt(0).toUpperCase() + propiedad.estatus.slice(1)}
            color={estatusColor[propiedad.estatus] || 'default'}
            sx={{ ml: 1, fontWeight: 700 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {propiedad.descripcion || <span style={{ color: '#aaa' }}>Sin descripción</span>}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {propiedad.venta && propiedad.precioVenta && (
            <Chip
              label={`Venta: $${Number(propiedad.precioVenta).toLocaleString()}`}
              color="success"
              size="small"
            />
          )}
          {propiedad.renta && propiedad.precioRenta && (
            <Chip
              label={`Renta: $${Number(propiedad.precioRenta).toLocaleString()}`}
              color="info"
              size="small"
            />
          )}
          {propiedad.exclusividad && (
            <Tooltip title="Exclusividad">
              <StarIcon sx={{ color: '#FFB300' }} fontSize="small" />
            </Tooltip>
          )}
        </Stack>
        {/* Ubicación */}
        {direccion && (
          <Box display="flex" alignItems="center" mb={1}>
            <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: '#5c6bc0' }} />
            <Typography variant="body2" color="text.secondary" noWrap title={direccion}>
              {direccion}
            </Typography>
          </Box>
        )}
        {/* Amenidades */}
        {propiedad.amenidades && propiedad.amenidades.length > 0 && (
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Amenidades:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
              {propiedad.amenidades.slice(0, 4).map((a, i) => (
                <Chip key={i} size="small" label={a} variant="outlined" />
              ))}
              {propiedad.amenidades.length > 4 && (
                <Chip
                  size="small"
                  label={`+${propiedad.amenidades.length - 4} más`}
                  variant="filled"
                  color="secondary"
                />
              )}
            </Stack>
          </Box>
        )}
        {/* Mini galería de imágenes extra */}
        {propiedad.imagenes && propiedad.imagenes.length > 1 && (
          <Stack direction="row" spacing={1} mt={1}>
            {propiedad.imagenes.slice(1, 4).map((img, i) => (
              <SignedAvatar
                key={i}
                value={img}
                sx={{
                  width: 44,
                  height: 44,
                  border: '2px solid #fff',
                  boxShadow: 2,
                  bgcolor: '#e5e7eb',
                }}
              />
            ))}
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Ver detalles">
          <IconButton color="info" onClick={() => onView(propiedad)}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cotizar">
          <IconButton color="success" onClick={() => onCotizar && onCotizar(propiedad)}>
            <RequestQuoteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default CardPropiedadVisor;
