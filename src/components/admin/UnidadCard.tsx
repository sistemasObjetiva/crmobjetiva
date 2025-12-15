import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  IconButton,
  Box,
  Tooltip,
  Divider,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Unidad } from '../../config/types';
import SignedImage from '../general/SignedImage';

interface UnidadCardProps {
  unidad: Unidad;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

const UnidadCard: React.FC<UnidadCardProps> = ({ unidad, onEdit, onDelete, index }) => {
  const getStatusColor = (estatus?: string) => {
    switch (estatus?.toLowerCase()) {
      case 'disponible':
        return 'success';
      case 'apartado':
        return 'warning';
      case 'vendido':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (estatus?: string) => {
    switch (estatus?.toLowerCase()) {
      case 'disponible':
        return '✅';
      case 'apartado':
        return '⏳';
      case 'vendido':
        return '🔒';
      default:
        return '❓';
    }
  };

  const formatPrice = (price: any) => {
    const num = parseFloat(String(price || 0).replace(/[, ]/g, ''));
    return Number.isFinite(num) ? `$${num.toLocaleString('es-MX')}` : '-';
  };

  const hasImages = !!(
    unidad.render ||
    unidad.isometrico ||
    unidad.plano ||
    (unidad.imagenes && unidad.imagenes.length > 0)
  );

  const imageCount =
    (unidad.render ? 1 : 0) +
    (unidad.isometrico ? 1 : 0) +
    (unidad.plano ? 1 : 0) +
    (unidad.imagenes?.length || 0);

  const extrasCount = unidad.extras ? Object.keys(unidad.extras).length : 0;

  // Obtener la primera imagen disponible para mostrar
  const firstImage = unidad.render || unidad.isometrico || unidad.plano || unidad.imagenes?.[0];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Imagen preview */}
      {firstImage && (
        <Box
          sx={{
            height: 180,
            backgroundColor: 'grey.100',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {firstImage.path && firstImage.bucket ? (
            <SignedImage
              path={firstImage.path}
              bucket={firstImage.bucket}
              alt={`Unidad ${unidad.numerounidad}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : firstImage.url ? (
            <img
              src={firstImage.url}
              alt={`Unidad ${unidad.numerounidad}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : null}
          <Chip
            label={`#${index + 1}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 'bold',
              backgroundColor: 'rgba(255,255,255,0.9)',
            }}
          />
        </Box>
      )}

      {!firstImage && (
        <Box
          sx={{
            height: 180,
            backgroundColor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <ImageIcon sx={{ fontSize: 64, color: 'grey.400' }} />
          <Chip
            label={`#${index + 1}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 'bold',
            }}
          />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Número de unidad */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <HomeIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />
          {unidad.numerounidad || 'Sin número'}
        </Typography>

        {/* Estatus */}
        <Chip
          label={`${getStatusIcon(unidad.estatus)} ${unidad.estatus || 'desconocido'}`}
          color={getStatusColor(unidad.estatus)}
          size="small"
          sx={{ mb: 1.5, fontWeight: 'bold' }}
        />

        <Divider sx={{ my: 1 }} />

        {/* Información principal */}
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Precio Lista:
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                <AttachMoneyIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {formatPrice(unidad.preciolista)}
              </Typography>
            </Stack>
          </Grid>

          {unidad.unidadprivativa && (
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Unidad Privativa:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {unidad.unidadprivativa}
                </Typography>
              </Stack>
            </Grid>
          )}

          {/* Extras (mostrar primeros 2) */}
          {unidad.extras && Object.keys(unidad.extras).length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Extras ({extrasCount}):
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {Object.entries(unidad.extras)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                {extrasCount > 2 && (
                  <Chip
                    label={`+${extrasCount - 2} más`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
              </Stack>
            </Grid>
          )}

          {/* Imágenes */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasImages ? (
                <>
                  <CheckCircleIcon fontSize="small" color="success" />
                  <Typography variant="body2" color="text.secondary">
                    {imageCount} imagen{imageCount !== 1 ? 'es' : ''}
                  </Typography>
                </>
              ) : (
                <>
                  <ImageIcon fontSize="small" color="disabled" />
                  <Typography variant="body2" color="text.secondary">
                    Sin imágenes
                  </Typography>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Tooltip title="Editar unidad">
          <IconButton size="small" color="primary" onClick={onEdit}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar unidad">
          <IconButton size="small" color="error" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default React.memo(UnidadCard);
