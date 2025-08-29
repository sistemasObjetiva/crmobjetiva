import React from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Button, Stack, Chip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SignedImageCarousel from '../general/SinedImageCarousel'
import { Propiedad, Document } from '../../config/types'
import { pdf } from '@react-pdf/renderer';
import { getSignedUrl, blobToDataURL } from '../../hooks/useUtilsFunctions';
import CotizacionPropiedadPDF from './CotizadorPropiedadPDF'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface CotizadorPropiedadModalProps {
  propiedad: Propiedad
  open: boolean
  onClose: () => void
  onAsignarCotizacion?: (doc: Document) => void
}

const CotizadorPropiedadModal: React.FC<CotizadorPropiedadModalProps> = ({
  propiedad,
  open,
  onClose,
  onAsignarCotizacion,
}) => {
  // Cálculo de comisiones
  const venta = propiedad.venta && propiedad.precioVenta ? Number(propiedad.precioVenta) : null
  const renta = propiedad.renta && propiedad.precioRenta ? Number(propiedad.precioRenta) : null
  const comisionVenta = venta && propiedad.comisionVenta ? venta * (Number(propiedad.comisionVenta) / 100) : null
  const comisionRenta = renta && propiedad.comisionRenta ? renta * (Number(propiedad.comisionRenta) / 100) : null

  // Descargar PDF
  const handleDownloadPdf = async () => {
    const imagenesSigned = await Promise.all(
      (propiedad.imagenes || []).map(img =>
        img.path
          ? getSignedUrl(img.path, img.bucket!)
          : Promise.resolve(null)
      )
    );

    const imagenesBase = await Promise.all(
      imagenesSigned
        .filter((url): url is string => Boolean(url))
        .map(async url => {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return blobToDataURL(blob);
        })
    );

    const blobPdf = await pdf(
      <CotizacionPropiedadPDF
        propiedad={propiedad}
        imagenesBase={imagenesBase}
      />
    ).toBlob();

    const pdfUrl = URL.createObjectURL(blobPdf);
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${propiedad.tituloPropiedad.replace(/\s+/g, '_')}_cotizacion.pdf`;
    a.click();
    URL.revokeObjectURL(pdfUrl);
  };

  // Asignar PDF a seguimiento como Document
  const handleAsignarPdf = async () => {
    const imagenesSigned = await Promise.all(
      (propiedad.imagenes || []).map(img =>
        img.path
          ? getSignedUrl(img.path, img.bucket!)
          : Promise.resolve(null)
      )
    );

    const imagenesBase = await Promise.all(
      imagenesSigned
        .filter((url): url is string => Boolean(url))
        .map(async url => {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return blobToDataURL(blob);
        })
    );

    const blobPdf = await pdf(
      <CotizacionPropiedadPDF
        propiedad={propiedad}
        imagenesBase={imagenesBase}
      />
    ).toBlob();

    const archivoNombre = `${propiedad.tituloPropiedad.replace(/\s+/g, '_')}_cotizacion.pdf`;
    const filePdf = new File([blobPdf], archivoNombre, { type: 'application/pdf' });

    const documento: Document = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      nombre: archivoNombre,
      file: filePdf
    };

    if (onAsignarCotizacion) {
      onAsignarCotizacion(documento);
    }
    onClose()
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* HEADER */}
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1,
        color: 'white',
        background: 'var(--secondary-color)'
      }}>
        <Typography variant="h6">
          Cotización de Propiedad
        </Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Mini-galería o portada */}
        {propiedad.imagenes && propiedad.imagenes.length > 0 && (
          <Box sx={{ my: 2, width: '100%', maxWidth: 320, mx: 'auto', display: 'flex', justifyContent: 'center' }}>
            <SignedImageCarousel
              items={propiedad.imagenes}
              width="100%"
              height={220}
            />
          </Box>
        )}

        <Stack direction="row" spacing={1} mb={2} alignItems="center" justifyContent="center">
          <Chip label={propiedad.estatus.charAt(0).toUpperCase() + propiedad.estatus.slice(1)} color={
            propiedad.estatus === 'vendido' ? 'error' : propiedad.estatus === 'apartado' ? 'warning' : 'success'
          } />
          {propiedad.venta && <Chip label="Venta" color="primary" />}
          {propiedad.renta && <Chip label="Renta" color="info" />}
          {propiedad.exclusividad && <Chip label="Exclusividad" color="secondary" />}
        </Stack>

        <Box sx={{
          p: 2, borderRadius: 2, background: "#f5f5f5", boxShadow: 1, mb: 3
        }}>
          <Typography variant="h5" sx={{ color: 'var(--primary-color)', fontWeight: 700, mb: 1 }}>
            {propiedad.tituloPropiedad}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {propiedad.descripcion || <span style={{ color: '#aaa' }}>Sin descripción</span>}
          </Typography>

          {/* Precios */}
          {venta && (
            <Typography variant="h6" sx={{ mb: 1 }}>
              Precio de Venta: <b>${venta.toLocaleString()}</b>
              {comisionVenta && (
                <span style={{ color: "#2ca58d", fontSize: 16, marginLeft: 12 }}>
                  Comisión: ${comisionVenta.toLocaleString()} ({Number(propiedad.comisionVenta).toFixed(2)}%)
                </span>
              )}
            </Typography>
          )}
          {renta && (
            <Typography variant="h6" sx={{ mb: 1 }}>
              Precio de Renta: <b>${renta.toLocaleString()}</b>
              {comisionRenta && (
                <span style={{ color: "#2ca58d", fontSize: 16, marginLeft: 12 }}>
                  Comisión: ${comisionRenta.toLocaleString()} ({Number(propiedad.comisionRenta).toFixed(2)}%)
                </span>
              )}
            </Typography>
          )}

          {/* Ubicación */}
          <Typography sx={{ mb: 1, mt: 2, color: 'var(--primary-color)', fontWeight: 600 }}>
            Ubicación:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {[
              propiedad.calle, propiedad.numero, propiedad.interior && `Int. ${propiedad.interior}`,
              propiedad.colonia, propiedad.ciudad, propiedad.estado
            ].filter(Boolean).join(', ')}
          </Typography>

          {/* Amenidades */}
          {propiedad.amenidades && propiedad.amenidades.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
              {propiedad.amenidades.slice(0, 4).map((am, i) => (
                <Chip key={am + i} label={am} variant="outlined" color="secondary" />
              ))}
              {propiedad.amenidades.length > 4 && (
                <Chip label={`+${propiedad.amenidades.length - 4} más`} variant="filled" color="secondary" />
              )}
            </Stack>
          )}

          {/* Características adicionales */}
          {propiedad.variables && Object.keys(propiedad.variables).length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                Características adicionales:
              </Typography>
              <Stack spacing={0.5} sx={{ ml: 1 }}>
                {Object.entries(propiedad.variables).map(([label, value]) => (
                  <Typography key={label}>
                    <b>{label}: </b>{String(value)}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownloadPdf}
          sx={{ color: 'var(--primary-color)', borderColor: 'var(--secondary-color)' }}
        >
          Descargar PDF
        </Button>
        {onAsignarCotizacion && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleAsignarPdf}
          >
            Asignar a seguimiento
          </Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CotizadorPropiedadModal
