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
import ProyectoViewModal from '../../components/inventario/ModalProyectoView'

const InventarioProyectoDetallePage: React.FC = () => {
  const { proyectoId } = useParams<{ proyectoId: string }>()
  const navigate = useNavigate()
  const { proyectos, loading } = useFetchProyects()

  if (loading) return <Spinner open />

  const proyecto = proyectos.find((item) => item.id === proyectoId)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <MUILink component={RouterLink} underline="hover" color="inherit" to="/productos">
          Inventario General
        </MUILink>
        <Typography color="text.primary">Ver proyecto</Typography>
      </Breadcrumbs>

      {!proyecto ? (
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Proyecto no encontrado
          </Typography>
          <Button variant="contained" onClick={() => navigate('/productos')}>
            Volver a Inventario General
          </Button>
        </Box>
      ) : (
        <ProyectoViewModal
          open={true}
          onClose={() => navigate('/productos')}
          proyecto={proyecto}
          onCotizarUnidad={(unidad, currentProyecto) =>
            navigate(`/productos/cotizar/unidad/${currentProyecto.id}/${unidad.id}`)
          }
          asPage
        />
      )}
    </Box>
  )
}

export default InventarioProyectoDetallePage
