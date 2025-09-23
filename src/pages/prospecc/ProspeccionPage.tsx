import React, { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material'
import ContainerProspectos from '../../components/prospecc/prospectos/ContainerProspectos'
import { useAuthRole } from '../../config/auth'
import Spinner from '../../components/general/Spinner'
import ContainerSeguimientos from '../../components/prospecc/seguimientos/ContainerSeguimientos'
import ResumenSeguimientosTab from '../../components/prospecc/seguimientos/ResumenSeguimientoTab'

const ProspeccionPage: React.FC = () => {
  const { user, loading,roleObject } = useAuthRole()
  const [tab, setTab] = useState(0)

  // Si aún está cargando o no hay usuario, muestra spinner (previene errores)
  if (loading || !user) return <Spinner open />

  const userid = user.id

  return (
    <Box sx={{
      px: { xs: 1, sm: 3 },
      pt: 2,
      pb: 1
    }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Resumen" />
        <Tab label="Prospectos" />
        <Tab label="Seguimientos" />
      </Tabs>

      {/* Contenido de los tabs */}
      {tab === 0 && (
        <ResumenSeguimientosTab userid={userid} userRole={roleObject!.tipo!} />
      )}
      {tab === 1 && (
        <ContainerProspectos userid={userid} userRole={roleObject!.tipo!} />
      )}
      {tab === 2 && (
        <ContainerSeguimientos userid={userid}  userRole={roleObject!.tipo!}/>
      )}
    </Box>
  )
}

export default ProspeccionPage
