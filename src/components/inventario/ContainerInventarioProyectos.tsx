import React from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { Proyecto, Unidad } from '../../config/types'
import CardProyectoVisor from './CardProyectoView'
import { useFetchProyects } from '../../hooks/useFetchFunctions'
import { useNavigate } from 'react-router-dom'

const ContainerProyectosView: React.FC = () => {
    const {proyectos}=useFetchProyects()
    const navigate = useNavigate()

    const handleCotizarUnidad = (unidad: Unidad, proyecto: Proyecto) => {
      navigate(`/productos/cotizar/unidad/${proyecto.id}/${unidad.id}`)
    };

    const handleViewProyecto = (proyecto: Proyecto) => {
      navigate(`/productos/proyecto/${proyecto.id}`)
    }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {proyectos.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
          No hay proyectos registrados.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {proyectos.map(proyecto => (
            <Grid item xs={12} sm={6} md={4} key={proyecto.id}>
              <CardProyectoVisor
                proyecto={proyecto}
                onView={handleViewProyecto}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default ContainerProyectosView
