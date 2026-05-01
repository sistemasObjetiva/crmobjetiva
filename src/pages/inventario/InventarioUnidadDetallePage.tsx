import React from 'react'
import {
  Box,
  Breadcrumbs,
  Button,
  Link as MUILink,
  Typography,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../../components/general/Spinner'
import { useFetchProyects } from '../../hooks/useFetchFunctions'
import ModalUnidadView from '../../components/inventario/ModalUnidadView'

const InventarioUnidadDetallePage: React.FC = () => {
  const { proyectoId, unidadId } = useParams<{ proyectoId: string; unidadId: string }>()
  const navigate = useNavigate()
  const { proyectos, loading } = useFetchProyects()

  if (loading) return <Spinner open />

  const proyecto = proyectos.find((item) => item.id === proyectoId)
  const unidad = proyecto?.unidades?.find((item) => item.id === unidadId) ?? null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <MUILink component={RouterLink} underline="hover" color="inherit" to="/productos">
          Inventario General
        </MUILink>
        <Typography color="text.primary">Ver unidad</Typography>
      </Breadcrumbs>

      {!proyecto || !unidad ? (
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Unidad no encontrada
          </Typography>
          <Button variant="contained" onClick={() => navigate('/productos')}>
            Volver a Inventario General
          </Button>
        </Box>
      ) : (
        <ModalUnidadView
          open={true}
          onClose={() => navigate('/productos')}
          unidad={unidad}
          proyecto={proyecto}
          asPage
        />
      )}
    </Box>
  )
}

export default InventarioUnidadDetallePage
