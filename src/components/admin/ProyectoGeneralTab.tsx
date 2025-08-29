import React from 'react';
import { Box, Typography, TextField, Paper, Grid } from '@mui/material';
import FileUploadPreview from '../general/FileUploadPreviewFiles';
import { Proyecto, Document } from '../../config/types';

interface ProyectoGeneralTabProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
}

const ProyectoGeneralTab: React.FC<ProyectoGeneralTabProps> = ({ proyecto, setProyecto }) => {
  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)', mb: 2 }}>
        Información general
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nombre del proyecto"
            value={proyecto.nombre}
            onChange={(e) =>
              setProyecto(prev => prev ? { ...prev, nombre: e.target.value } : prev)
            }
            placeholder="Ej. Torre Bosques"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ color: 'var(--primary-color)', mb: 1, fontWeight: 600 }}>
            Logo del proyecto
          </Typography>
          <FileUploadPreview
            value={proyecto.logo ? [proyecto.logo] : []}
            multiple={false}
            width={120}
            height={120}
            onChange={(files) => {
              const file = Array.isArray(files) ? files[0] : files;
              const newLogoDoc: Document = {
                id: crypto.randomUUID(),
                nombre: file.name,
                file,
                url: URL.createObjectURL(file),
              };
              setProyecto(prev => prev ? { ...prev, logo: newLogoDoc } : prev);
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="body2" sx={{ color: 'var(--primary-color)', mb: 1, fontWeight: 600 }}>
            Render del proyecto
          </Typography>
          <FileUploadPreview
            value={proyecto.render ? [proyecto.render] : []}
            multiple={false}
            width={120}
            height={120}
            onChange={(files) => {
              const file = Array.isArray(files) ? files[0] : files;
              const newRenderDoc: Document = {
                id: crypto.randomUUID(),
                nombre: file.name,
                file,
                url: URL.createObjectURL(file),
              };
              setProyecto(prev => prev ? { ...prev, render: newRenderDoc } : prev);
            }}
          />
        </Grid>

        <Grid item xs={12} mt={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Amenidades
          </Typography>

          {proyecto.amenidades.length === 0 && (
            <Typography variant="body2" sx={{ color: 'gray', mb: 2 }}>
              No hay amenidades agregadas.
            </Typography>
          )}

          {proyecto.amenidades.map((amenidad, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <TextField
                fullWidth
                value={amenidad}
                placeholder="Ej. Gimnasio / Alberca / Cowork / Roof Garden"
                onChange={(e) => {
                  const value = e.target.value;
                  setProyecto(prev => {
                    if (!prev) return prev;
                    const updated = [...prev.amenidades];
                    updated[index] = value;
                    return { ...prev, amenidades: updated };
                  });
                }}
              />
              <TextField
                value="Eliminar"
                onClick={() =>
                  setProyecto(prev => prev ? {
                    ...prev,
                    amenidades: prev.amenidades.filter((_, i) => i !== index)
                  } : prev)
                }
                sx={{ width: 1, display: 'none' }}
              />
            </Box>
          ))}

          <Box>
            <Typography
              variant="button"
              sx={{
                mt: 1,
                display: 'inline-block',
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                bgcolor: 'action.hover',
                cursor: 'pointer'
              }}
              onClick={() =>
                setProyecto(prev => prev ? { ...prev, amenidades: [...prev.amenidades, ''] } : prev)
              }
            >
              + Agregar amenidad
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ProyectoGeneralTab;
