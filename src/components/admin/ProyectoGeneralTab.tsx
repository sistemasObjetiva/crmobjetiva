import React from 'react';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import FileUploadPreview from '../general/FileUploadPreviewFiles';
import { Proyecto, Document } from '../../config/types';

interface ProyectoGeneralTabProps {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
}

const ProyectoGeneralTab: React.FC<ProyectoGeneralTabProps> = ({ proyecto, setProyecto }) => {
  return (
    <>
      <Typography variant="body1" sx={{ mb: 2, color: 'var(--primary-color)' }}>
        Nombre del proyecto:
      </Typography>
      <TextField
        fullWidth
        value={proyecto.nombre}
        onChange={(e) =>
          setProyecto((prev) =>
            prev ? { ...prev, nombre: e.target.value } : prev
          )
        }
        placeholder="Nombre del proyecto"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {/* Logo del Proyecto */}
        <Box sx={{ flex: 1, mb: 2 }}>
          <Typography variant="body1" sx={{ color: 'var(--primary-color)', mb: 1 }}>
            Logo del proyecto:
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
              setProyecto((prev) =>
                prev ? { ...prev, logo: newLogoDoc } : prev
              );
            }}
          />
        </Box>

        {/* Render del Proyecto */}
        <Box sx={{ flex: 1, mb: 2 }}>
          <Typography variant="body1" sx={{ color: 'var(--primary-color)', mb: 1 }}>
            Render del proyecto:
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
              setProyecto((prev) =>
                prev ? { ...prev, render: newRenderDoc } : prev
              );
            }}
          />
        </Box>
      </Box>

      <Typography variant="body1" sx={{ mb: 2, color: 'var(--primary-color)' }}>
        Amenidades:
      </Typography>
      {proyecto.amenidades.length > 0 ? (
        proyecto.amenidades.map((amenidad, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TextField
              fullWidth
              value={amenidad}
              onChange={(e) => {
                const value = e.target.value;
                setProyecto((prev) => {
                  if (!prev) return prev;
                  const updated = [...prev.amenidades];
                  updated[index] = value;
                  return { ...prev, amenidades: updated };
                });
              }}
              placeholder="Nueva amenidad"
            />
            <IconButton
              onClick={() => {
                setProyecto((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    amenidades: prev.amenidades.filter((_, i) => i !== index),
                  };
                });
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ))
      ) : (
        <Typography variant="body2" sx={{ color: 'gray', mb: 2 }}>
          No hay amenidades agregadas.
        </Typography>
      )}

      <Box display="flex" alignItems="center" mt={1}>
        <Tooltip title="Agregar Amenidad">
          <IconButton
            color="primary"
            onClick={() =>
              setProyecto((prev) =>
                prev
                  ? { ...prev, amenidades: [...prev.amenidades, ''] }
                  : prev
              )
            }
          >
            <AddCircleIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="button" sx={{ ml: 1 }}>
          Agregar Amenidad
        </Typography>
      </Box>
    </>
  );
};

export default ProyectoGeneralTab;
