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
import { useFetchPropiedades } from '../../hooks/useFetchFunctions'
import PropiedadViewModal from '../../components/inventario/ModalPropiedadView'

const InventarioPropiedadDetallePage: React.FC = () => {
  const { propiedadId } = useParams<{ propiedadId: string }>()
  const navigate = useNavigate()
  const { propiedades, loading } = useFetchPropiedades()

  if (loading) return <Spinner open />

  const propiedad = propiedades.find((item) => item.id === propiedadId) ?? null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <MUILink component={RouterLink} underline="hover" color="inherit" to="/productos">
          Inventario General
        </MUILink>
        <Typography color="text.primary">Ver propiedad</Typography>
      </Breadcrumbs>

      {!propiedad ? (
        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Propiedad no encontrada
          </Typography>
          <Button variant="contained" onClick={() => navigate('/productos')}>
            Volver a Inventario General
          </Button>
        </Box>
      ) : (
        <PropiedadViewModal
          open={true}
          onClose={() => navigate('/productos')}
          propiedad={propiedad}
          asPage
        />
      )}
    </Box>
  )
}

export default InventarioPropiedadDetallePage
