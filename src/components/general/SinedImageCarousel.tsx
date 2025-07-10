import React, { useState, useEffect } from 'react';
import { Box, IconButton, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import SignedImage from './SignedImage';
import type { Document } from '../../config/types';

interface SignedImageCarouselProps {
  items?: Document[];
  width?: number | string;     // <-- permite string también!
  height?: number | string;
}

const SignedImageCarousel: React.FC<SignedImageCarouselProps> = ({
  items = [],
  width = '100%',   // <-- default 100%
  height = 200,
}) => {
  const theme = useTheme();
  const [images, setImages] = useState<Document[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setImages(items);
    setCurrent(0);
  }, [items]);

  const prev = () => {
    setCurrent(i => (i - 1 + images.length) % images.length);
  };
  const next = () => {
    setCurrent(i => (i + 1) % images.length);
  };

  if (!images.length) return null;

  return (
    <Box
      position="relative"
      sx={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        maxWidth: '100%',
      }}
    >
      {images.length > 1 && (
        <>
          <IconButton
            size="small"
            onClick={prev}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 4,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.7)'
            }}
          >
            <ChevronLeft fontSize="small" htmlColor={theme.palette.primary.main} />
          </IconButton>
          <IconButton
            size="small"
            onClick={next}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 4,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.7)'
            }}
          >
            <ChevronRight fontSize="small" htmlColor={theme.palette.primary.main} />
          </IconButton>
        </>
      )}

      <SignedImage
        path={images[current].path || images[current].url || ''}
        bucket={images[current].bucket || ''}
        alt={images[current].nombre}
        sx={{
          objectFit: 'cover',
          borderRadius: 2,
          width: '100%', // <-- siempre 100% respecto al Box
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: 80
        }}
      />

      {images.length > 1 && (
        <Box
          position="absolute"
          bottom={8}
          left="50%"
          sx={{ transform: 'translateX(-50%)' }}
          display="flex"
          gap={0.5}
        >
          {images.map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor:
                  idx === current
                    ? theme.palette.primary.main
                    : theme.palette.action.disabled
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SignedImageCarousel;
