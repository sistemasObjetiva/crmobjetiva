// src/components/unidades/UnidadImagenes.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import SignedImage from '../general/SignedImage';
import SignedImageCarousel from '../general/SinedImageCarousel';
import type { Unidad } from '../../config/types';

interface UnidadImagenesProps {
  unidad: Unidad;
}

const UnidadImagenes: React.FC<UnidadImagenesProps> = ({ unidad }) => (
  <>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        mb: 3,
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      {unidad.isometrico && unidad.isometrico.path && (
        <Box sx={{ textAlign: 'center' }}>
          <SignedImage
            path={unidad.isometrico.path}
            bucket={unidad.isometrico.bucket!}
            alt="Isométrico"
          />
          <Typography variant="caption">Isométrico</Typography>
        </Box>
      )}
      {unidad.render && unidad.render.path && (
        <Box sx={{ textAlign: 'center' }}>
          <SignedImage
            path={unidad.render.path}
            bucket={unidad.render.bucket!}
            alt="Render"
          />
          <Typography variant="caption">Render</Typography>
        </Box>
      )}
      {unidad.plano && unidad.plano.path && (
        <Box sx={{ textAlign: 'center' }}>
          <SignedImage
            path={unidad.plano.path}
            bucket={unidad.plano.bucket!}
            alt="Plano"
          />
          <Typography variant="caption">Plano</Typography>
        </Box>
      )}
    </Box>

    {unidad.imagenes && Array.isArray(unidad.imagenes) && unidad.imagenes.length > 0 && (
      <Box sx={{
        my: 2,
        width: '100%',
        maxWidth: 380,
        mx: 'auto',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <SignedImageCarousel
          items={unidad.imagenes}
          width="100%"
          height={280}
        />
      </Box>
    )}
  </>
);

export default UnidadImagenes;
