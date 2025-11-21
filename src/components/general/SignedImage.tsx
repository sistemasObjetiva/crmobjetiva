import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getSignedUrl } from '../../hooks/useUtilsFunctions';

interface SignedImageProps {
  path: string;            // Ruta relativa dentro del bucket, o URL firmada
  bucket: string;          // Nombre del bucket
  alt: string;
  sx?: any;
  onClick?: () => void;
}

const SignedImage: React.FC<SignedImageProps> = ({ path, bucket, alt, sx, onClick }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!path) {
      setUrl(null);
      return;
    }

    // 1. Si la imagen ya es una URL local o un dataURL, úsala directamente
    if (
      path.startsWith('blob:') ||
      path.startsWith('data:') ||
      (path.startsWith('http') && !bucket) // Si es un link externo sin bucket, úsalo directo
    ) {
      setUrl(path);
      return;
    }

    // 2. Si es un path relativo (de Supabase) → pide el signedUrl
    const resolveInternalPath = (): string => {
      if (!path.startsWith('http')) return path; // path ya es relativo

      try {
        const u = new URL(path);
        const parts = u.pathname.split('/');
        const bucketIdx = parts.findIndex(p => p === bucket);
        if (bucketIdx >= 0) {
          return parts.slice(bucketIdx + 1).join('/');
        }
      } catch (err) {
        console.warn('SignedImage: URL inválida:', path);
      }

      return ''; // fallback
    };

    const internalKey = resolveInternalPath();
    if (!internalKey) return;

    setLoading(true);
    getSignedUrl(internalKey, bucket)
      .then(signed => {
        if (mounted) setUrl(signed);
      })
      .catch(err => {
        console.error('SignedImage error:', err);
        setUrl(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [path, bucket]);

  if (loading) return <CircularProgress size={24} />;
  if (!url) return null;

  return (
    <Box
      component="img"
      src={url}
      alt={alt}
      sx={sx}
      onClick={onClick}
    />
  );
};

export default React.memo(SignedImage, (prevProps, nextProps) => {
  return (
    prevProps.path === nextProps.path &&
    prevProps.bucket === nextProps.bucket
  )
});
