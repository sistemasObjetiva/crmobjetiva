import React, {  useMemo, useState } from 'react'
import { Box, Typography, Button, Stack, Chip } from '@mui/material'
import CardPropiedadVisor from './CardPropiedadView'
import CardUnidadVisor from './CardUnidad'
import { useFetchPropiedades, useFetchProyects } from '../../hooks/useFetchFunctions'
import Spinner from '../general/Spinner'
import ModalFiltroInventario from '../admin/ModalFiltroInventario'
import { Unidad, Proyecto, Propiedad } from '../../config/types'
import { useNavigate } from 'react-router-dom'

const ContainerInventario: React.FC = () => {
  const { propiedades, loading: loadingPropiedades } = useFetchPropiedades()
  const { proyectos, loading: loadingProyectos } = useFetchProyects()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [filtros, setFiltros] = useState<Record<string, any>>({})

  // Junta propiedades y todas las unidades de todos los proyectos
  const items = useMemo(() => [
    ...propiedades.map(p => ({ tipo: 'propiedad' as const, propiedad: p })),
    ...proyectos.flatMap(proyecto =>
      (proyecto.unidades ?? []).map(u => ({
        tipo: 'unidad' as const,
        unidad: u,
        proyecto,
      }))
    )
  ], [propiedades, proyectos])

  // ... Filtros (igual que ya tienes) ...

  const itemsFiltrados = useMemo(() => {
  if (!Object.keys(filtros).length) return items

  return items.filter(item => {
    for (const [key, val] of Object.entries(filtros)) {
      if (val == null || val === '' || (Array.isArray(val) && !val.length)) continue

      // Para propiedades
      if (item.tipo === 'propiedad') {
        const propiedad = item.propiedad

        // 1. ¿Es campo fijo?
        if (key in propiedad) {
          // @ts-ignore forzamos porque sabemos que existe
          const value = propiedad[key] ?? ''
          if (!value?.toString().toLowerCase().includes(val.toString().toLowerCase())) return false
        }
        // 2. ¿Está en variables?
        else if (propiedad.variables && key in propiedad.variables) {
          const value = propiedad.variables[key] ?? ''
          if (!value?.toString().toLowerCase().includes(val.toString().toLowerCase())) return false
        }
      }

      // Para unidades
      if (item.tipo === 'unidad') {
        const unidad = item.unidad

        if (key in unidad) {
          // @ts-ignore
          const value = unidad[key] ?? ''
          if (!value?.toString().toLowerCase().includes(val.toString().toLowerCase())) return false
        } else if (unidad.extras && key in unidad.extras) {
          const value = unidad.extras[key] ?? ''
          if (!value?.toString().toLowerCase().includes(val.toString().toLowerCase())) return false
        }
      }
    }
    return true
  })
}, [items, filtros])



  // Handler para abrir el cotizador (recibe unidad y proyecto)
  const handleCotizarUnidad = (unidad: Unidad, proyecto: Proyecto) => {
    navigate(`/productos/cotizar/unidad/${proyecto.id}/${unidad.id}`)
  }



  // ... allKeys y resto igual ...
  const handleVerUnidad = (unidad: Unidad, proyecto: Proyecto) => {
    navigate(`/productos/unidad/${proyecto.id}/${unidad.id}`)
  };

  const handleVerPropiedad = (propiedad: Propiedad) => {
    navigate(`/productos/propiedad/${propiedad.id}`)
  }

  const handleCotizarPropiedad = (propiedad: Propiedad) => {
    navigate(`/productos/cotizar/propiedad/${propiedad.id}`)
  }

  // RENDER
  if (loadingPropiedades || loadingProyectos) return <Spinner open />

  return (
    <Box>
      {/* ... filtros, chips, etc igual ... */}
      <Box display="flex" alignItems="center" mb={2} gap={2}>
        <Button variant="outlined" onClick={() => setModalOpen(true)}>🔍 Filtrar inventario</Button>
        <Stack direction="row" spacing={1}>
          {Object.entries(filtros).map(([key, value]) => (
            <Chip
              key={key}
              label={
                typeof value === 'object' && value !== null && ('min' in value || 'max' in value)
                  ? `${key}: ${value.min ?? '-'} a ${value.max ?? '-'}`
                  : `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
              }
              onDelete={() => setFiltros(f => {
                const c = { ...f }; delete c[key]; return c;
              })}
              color="primary"
            />
          ))}
        </Stack>
      </Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: 'var(--primary-color)' }}>Inventario Total</Typography>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}
        gap={2}
        p={2}
      >
        {itemsFiltrados.map((item) =>
          item.tipo === 'propiedad' ? (
            <CardPropiedadVisor
                key={`prop-${item.propiedad!.id}`}
                propiedad={item.propiedad!}
                onView={handleVerPropiedad}
                onCotizar={handleCotizarPropiedad}
              />
          ) : (
            <CardUnidadVisor
              key={`uni-${item.unidad!.id}`}
              unidad={item.unidad!}
              proyecto={item.proyecto!}
              onCotizar={handleCotizarUnidad}
              onView={handleVerUnidad}
            />
          )
        )}
      </Box>
      {/* Modal de filtros */}
      <ModalFiltroInventario
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        allKeys={[]} // O tu allKeys calculado
        onApply={setFiltros}
        valoresActuales={filtros}
      />

    </Box>
  )
}

export default ContainerInventario
