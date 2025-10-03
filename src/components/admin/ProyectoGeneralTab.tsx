import React, { useState, useMemo } from 'react'
import {
  Box, Typography, TextField, Paper, Grid, Chip, Stack, IconButton, InputAdornment, Tooltip, Button
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import BackspaceIcon from '@mui/icons-material/Backspace'
import FileUploadPreview from '../general/FileUploadPreviewFiles'
import { Proyecto, Document } from '../../config/types'

interface ProyectoGeneralTabProps {
  proyecto: Proyecto
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>
}

const SUGERENCIAS_AMENIDADES = [
  'Gimnasio', 'Alberca', 'Cowork', 'Roof Garden', 'Lobby',
  'Elevador', 'Vigilancia 24/7', 'Pet friendly', 'Terraza',
  'Estacionamiento techado', 'Área de juegos', 'Sala de cine',
  'Asadores', 'Bodega', 'Business center'
]

const ProyectoGeneralTab: React.FC<ProyectoGeneralTabProps> = ({ proyecto, setProyecto }) => {
  const [amenidadInput, setAmenidadInput] = useState('')

  const amenidades = useMemo(() => proyecto.amenidades ?? [], [proyecto.amenidades])

  const addAmenidad = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    const exists = amenidades.some(a => a.toLowerCase() === value.toLowerCase())
    if (exists) return
    setProyecto(prev => prev ? { ...prev, amenidades: [...amenidades, value] } : prev)
    setAmenidadInput('')
  }

  const removeAmenidad = (index: number) => {
    setProyecto(prev => prev ? {
      ...prev,
      amenidades: prev.amenidades.filter((_, i) => i !== index)
    } : prev)
  }

  const quickAdd = (label: string) => addAmenidad(label)

  const clearAll = () => {
    setProyecto(prev => prev ? { ...prev, amenidades: [] } : prev)
  }



  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)', mb: 2 }}>
        Información general
      </Typography>

      <Grid container spacing={2}>
        {/* Nombre */}
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

        {/* Logo */}
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
              const file = Array.isArray(files) ? files[0] : files
              const newLogoDoc: Document = {
                id: (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
                nombre: file.name,
                file,
                url: URL.createObjectURL(file),
              }
              setProyecto(prev => prev ? { ...prev, logo: newLogoDoc } : prev)
            }}
          />
        </Grid>

        {/* Render */}
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
              const file = Array.isArray(files) ? files[0] : files
              const newRenderDoc: Document = {
                id: (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now()),
                nombre: file.name,
                file,
                url: URL.createObjectURL(file),
              }
              setProyecto(prev => prev ? { ...prev, render: newRenderDoc } : prev)
            }}
          />
        </Grid>

        {/* Amenidades */}
        <Grid item xs={12} mt={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Amenidades
            </Typography>
            {amenidades.length > 0 && (
              <Tooltip title="Quitar todas">
                <Button size="small" color="inherit" startIcon={<BackspaceIcon />} onClick={clearAll}>
                  Limpiar
                </Button>
              </Tooltip>
            )}
          </Stack>

          {/* Chips actuales */}
          {amenidades.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              No hay amenidades agregadas.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                pb: 1,
                mb: 1,
                borderBottom: theme => `1px dashed ${theme.palette.divider}`
              }}
            >
              {amenidades.map((a, idx) => (
                <Chip
                  key={`${a}-${idx}`}
                  label={a}
                  variant="outlined"
                  onDelete={() => removeAmenidad(idx)}
                  onDoubleClick={() => { // “editar”: pasa al input y la quita
                    setAmenidadInput(a)
                    removeAmenidad(idx)
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input para agregar */}
          <TextField
            fullWidth
            label="Agregar amenidad"
            placeholder="Ej. Gimnasio / Alberca / Cowork / Roof Garden"
            value={amenidadInput}
            onChange={(e) => setAmenidadInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addAmenidad(amenidadInput)
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={() => addAmenidad(amenidadInput)}
                    edge="end"
                    aria-label="agregar amenidad"
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Sugerencias rápidas */}
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            Sugerencias (clic para agregar)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {SUGERENCIAS_AMENIDADES.map(s => (
              <Chip
                key={s}
                size="small"
                label={s}
                onClick={() => quickAdd(s)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled' }}>
            Tip: haz <strong>doble clic</strong> en una amenidad para editarla rápidamente.
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default ProyectoGeneralTab
