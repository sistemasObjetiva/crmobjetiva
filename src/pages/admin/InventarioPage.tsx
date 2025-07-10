// src/pages/config/InventarioPage.tsx
import React, { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import ContainerProyectos from '../../components/admin/ContainerProyectos'
import { useAuthRole } from '../../config/auth'
import Spinner from '../../components/general/Spinner'
import ContainerPropiedades from '../../components/admin/ContainerPropiedades'

const InventarioPage: React.FC = () => {
  const { user, role } = useAuthRole()
  const [selectedView, setSelectedView] = useState(0)

  if (!user) {
    return (
      <Spinner open={true}/>
    )
  }

  const handleViewChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue)
  }

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        mb={2}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedView}
            onChange={handleViewChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Proyectos" />
            <Tab label="Propiedades" />
          </Tabs>
        </Box>
      </Box>

      {selectedView === 0 && (
        <ContainerProyectos userId={user.id} role={role!} />
      )}
      {selectedView === 1 && (
        <ContainerPropiedades userId={user.id} role={role!} />
      )}
    </>
  )
}

export default InventarioPage
