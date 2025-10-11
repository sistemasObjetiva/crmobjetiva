// src/pages/config/InventarioPage.tsx
import React, { useState } from 'react'
import { Box, Tab, Tabs } from '@mui/material'
import { useAuthRole } from '../../config/auth'
import Spinner from '../../components/general/Spinner'
import ContainerProyectosView from '../../components/inventario/ContainerInventarioProyectos'
import ContainerInventario from '../../components/inventario/ContainerInventario'

const InventarioGeneralPage: React.FC = () => {
  const { user } = useAuthRole()
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
            <Tab label="Inventario" />
          </Tabs>
        </Box>
      </Box>

      {selectedView === 0 && (
        <ContainerProyectosView />
      )}      
      {selectedView === 1 && (
        <ContainerInventario />
      )}
    </>
  )
}

export default InventarioGeneralPage
