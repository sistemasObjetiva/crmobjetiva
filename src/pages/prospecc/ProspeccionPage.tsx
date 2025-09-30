// src/pages/prospeccion/ProspeccionPage.tsx
import React, { useState } from 'react'
import { Box, Tabs, Tab } from '@mui/material'
import ContainerProspectos from '../../components/prospecc/prospectos/ContainerProspectos'
import ContainerSeguimientos from '../../components/prospecc/seguimientos/ContainerSeguimientos'
import ResumenSeguimientosTab from '../../components/prospecc/seguimientos/ResumenSeguimientoTab'
import ReportesGerentes from '../../components/prospecc/reportes/ReportesGenerales'
import Spinner from '../../components/general/Spinner'
import { useAuthRole } from '../../config/auth'

const ProspeccionPage: React.FC = () => {
  const { user, loading, roleObject } = useAuthRole()
  const [tab, setTab] = useState(0)

  if (loading || !user) return <Spinner open />

  const userid = user.id
  const userRole = roleObject?.tipo ?? 'operacion'
  const jerarquia = roleObject?.jerarquia ?? 99

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 3 },
        pt: 2,
        pb: 1,
        width: "100%"
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Resumen" />
        <Tab label="Prospectos" />
        <Tab label="Seguimientos" />
        {jerarquia < 2 && <Tab label="Reportes" />}
      </Tabs>

      {tab === 0 && (
        <ResumenSeguimientosTab userid={userid} userRole={userRole} />
      )}
      {tab === 1 && (
        <ContainerProspectos userid={userid} userRole={userRole} />
      )}
      {tab === 2 && (
        <ContainerSeguimientos userid={userid} userRole={userRole} />
      )}
      {tab === 3 && jerarquia < 2 && <ReportesGerentes />}
    </Box>
  )
}

export default ProspeccionPage
