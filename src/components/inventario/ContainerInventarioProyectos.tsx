import React, { useState } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { Proyecto, Unidad } from '../../config/types'
import ProyectoViewModal from './ModalProyectoView'
import CardProyectoVisor from './CardProyectoView'
import { useFetchProyects } from '../../hooks/useFetchFunctions'
import CotizadorModal from './CotizadorModal'

const ContainerProyectosView: React.FC = () => {
    const {proyectos}=useFetchProyects()
  const [proyectoView, setProyectoView] = useState<Proyecto | null>(null)
    const [cotizadorUnidad, setCotizadorUnidad] = useState<Unidad | null>(null);
    const [cotizadorProyecto, setCotizadorProyecto] = useState<Proyecto | null>(null);
    const [cotizadorOpen, setCotizadorOpen] = useState(false);

    const handleCotizarUnidad = (unidad: Unidad, proyecto: Proyecto) => {
    setCotizadorUnidad(unidad);
    setCotizadorProyecto(proyecto);
    setCotizadorOpen(true);
    };
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
                onView={setProyectoView}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de vista */}
      <ProyectoViewModal
        open={!!proyectoView}
        onClose={() => setProyectoView(null)}
        proyecto={proyectoView}
        onCotizarUnidad={handleCotizarUnidad}
      />
      {cotizadorUnidad && cotizadorProyecto && (
        <CotizadorModal
            open={cotizadorOpen}
            onClose={() => setCotizadorOpen(false)}
            unidad={cotizadorUnidad}
            proyecto={cotizadorProyecto}
        />
        )}
    </Box>
  )
}

export default ContainerProyectosView
