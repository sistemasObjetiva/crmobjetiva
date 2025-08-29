import React, { useEffect, useState, ChangeEvent } from 'react';
import { Box, Button, IconButton, Typography, useTheme } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getSignedUrl } from '../../hooks/useUtilsFunctions';
import { Document } from '../../config/types';

interface FileUploadCarouselProps {
  value?: Document | Document[];
  onChange: (file: File | File[]) => void;
  onDelete?: (doc: Document) => void;
  multiple?: boolean;
  accept?: string;
  width?: number;                     // usado si responsive=false
  height?: number | 'auto';           // <-- ahora acepta 'auto'
  maxHeight?: number;                 // límite superior cuando height='auto'
  disabled?: boolean;
  responsive?: boolean;               // 100% del ancho del contenedor
  fit?: 'contain' | 'cover';          // cómo ajustar (con height numérico)
  showCounter?: boolean;
}

const FileUploadCarouselPreview: React.FC<FileUploadCarouselProps> = ({
  value,
  onChange,
  onDelete,
  accept = 'image/*,.pdf',
  width = 600,
  height = 'auto',                    // <-- por defecto auto
  maxHeight,
  multiple = false,
  disabled = false,
  responsive = true,
  fit = 'contain',
  showCounter = true,
}) => {
  const theme = useTheme();
  const [items, setItems] = useState<Document[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normaliza value a array
  useEffect(() => {
    const arr = Array.isArray(value) ? value : value ? [value] : [];
    setItems(arr);
    setCurrentIndex(0);
  }, [value]);

  // URLs firmadas
  useEffect(() => {
    items.forEach((val) => {
      if (val.path && val.bucket && !(val.file instanceof File)) {
        getSignedUrl(val.path, val.bucket)
          .then((url) => { if (url) setSignedUrls((p) => ({ ...p, [val.id]: url })); })
          .catch(console.error);
      }
    });
  }, [items]);

  const handlePrev = () => setCurrentIndex((i) => (i - 1 + items.length) % items.length);
  const handleNext = () => setCurrentIndex((i) => (i + 1) % items.length);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files) onChange(multiple ? Array.from(files) : files[0]);
  };

  const current = items[currentIndex];
  const localUrl = current?.file instanceof File ? URL.createObjectURL(current.file) : '';
  const previewUrl = localUrl || (current && signedUrls[current.id]) || '';
  const isPDF = current?.nombre?.toLowerCase?.().endsWith('.pdf');

  const boxWidth = responsive ? '100%' : width;
  const auto = height === 'auto';
  const pdfHeight = auto ? (maxHeight || 480) : (height as number);

  return (
    <Box>
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        disabled={disabled}
        sx={{
          textTransform: 'none',
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          mb: 1,
        }}
      >
        Subir archivo{multiple ? 's' : ''}
        <input
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileSelect}
        />
      </Button>

      {items.length > 0 ? (
        <Box
          sx={{
            position: 'relative',
            width: boxWidth,
            height: auto ? 'auto' : (height as number),
            maxHeight: auto && maxHeight ? maxHeight : undefined,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: auto
              ? 'transparent'
              : (theme.palette.mode === 'light'
                  ? theme.palette.grey[100]
                  : theme.palette.background.default),
            display: auto ? 'block' : 'grid',
            placeItems: auto ? undefined : 'center',
          }}
        >
          {/* Controles */}
          {items.length > 1 && (
            <>
              <IconButton
                size="small"
                onClick={handlePrev}
                sx={{
                  position: 'absolute', top: '50%', left: 6, transform: 'translateY(-50%)',
                  zIndex: 2, bgcolor: 'rgba(255,255,255,0.85)',
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleNext}
                sx={{
                  position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)',
                  zIndex: 2, bgcolor: 'rgba(255,255,255,0.85)',
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}

          {/* Borrar */}
          {onDelete && current && (
            <IconButton
              size="small"
              onClick={() => onDelete(current)}
              sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.9)', zIndex: 3, p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}

          {/* Contador */}
          {showCounter && items.length > 1 && (
            <Box
              sx={{
                position: 'absolute', top: 6, left: 6, zIndex: 3,
                px: 1, py: 0.25, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12,
              }}
            >
              {currentIndex + 1}/{items.length}
            </Box>
          )}

          {/* Vista */}
          {previewUrl ? (
            isPDF ? (
              <object
                data={previewUrl}
                type="application/pdf"
                width="100%"
                height={pdfHeight}
              >
                <Typography variant="caption" sx={{ p: 2 }}>PDF no compatible</Typography>
              </object>
            ) : (
              <Box
                component="img"
                src={previewUrl}
                alt={current?.nombre || 'imagen'}
                sx={{
                  width: '100%',
                  height: auto ? 'auto' : '100%',
                  objectFit: auto ? 'contain' : fit,
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            )
          ) : (
            <Typography
              variant="caption"
              sx={{ width: '100%', height: auto ? 'auto' : '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Cargando...
            </Typography>
          )}

          {/* Indicadores */}
          {items.length > 1 && (
            <Box position="absolute" bottom={6} left="50%" sx={{ transform: 'translateX(-50%)' }} display="flex" gap={0.75} zIndex={2}>
              {items.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    bgcolor: idx === currentIndex ? theme.palette.primary.main : theme.palette.action.disabled,
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      ) : null}
    </Box>
  );
};

export default FileUploadCarouselPreview;
