// components/seguimientos/SeguimientosFiltersBar.tsx
import { Box, TextField, Tooltip, IconButton } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import { useSeguimientosFilters } from '../../../hooks/seguimientos/useSeguimientosFilter'

export default function SeguimientosFiltersBar() {
  const { filters, setFilters, clearFilters } = useSeguimientosFilters()

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(160px,1fr)) auto', gap: 1, mb: 2, overflowX: 'auto' }}>
      <TextField size="small" label="Nombre" value={filters.nombre}
        onChange={e=>setFilters({ nombre: e.target.value })} />
      <TextField size="small" label="Correo" value={filters.correo}
        onChange={e=>setFilters({ correo: e.target.value })} />
      <TextField size="small" label="Temperatura" value={filters.temperatura}
        onChange={e=>setFilters({ temperatura: e.target.value })} />
      <TextField size="small" label="Unidad/Proyecto" value={filters.unidad}
        onChange={e=>setFilters({ unidad: e.target.value })} />
      <TextField size="small" label="Proyecto/Propiedad (chips)" value={filters.proyectoTexto}
        onChange={e=>setFilters({ proyectoTexto: e.target.value })} />
      <TextField size="small" type="date" label="Fecha Próx." InputLabelProps={{ shrink: true }}
        value={filters.fechaProximo}
        onChange={e=>setFilters({ fechaProximo: e.target.value })} />
      <TextField size="small" type="date" label="Fecha Actualización" InputLabelProps={{ shrink: true }}
        value={filters.fechaActualizacion}
        onChange={e=>setFilters({ fechaActualizacion: e.target.value })} />
      <TextField size="small" label="Comentarios" value={filters.comentarios}
        onChange={e=>setFilters({ comentarios: e.target.value })} />
      <Tooltip title="Limpiar filtros">
        <IconButton onClick={clearFilters}><ClearIcon /></IconButton>
      </Tooltip>
    </Box>
  )
}
