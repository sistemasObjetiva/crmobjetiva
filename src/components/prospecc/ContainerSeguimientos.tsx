import React, { useState } from 'react'
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material'
import SeguimientosTab from './SeguimientosTabs'
import SeguimientosGeneralTab from './SeguimientosGeneralTabs'

interface Props {
  userid: string
}

const ContainerSeguimientos: React.FC<Props> = ({ userid }) => {
  const [tab, setTab] = useState(0)

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', py: 3 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          color: 'var(--primary-color)',
          fontWeight: 700,
        }}
      >
        Seguimientos
      </Typography>
      <Paper sx={{ borderRadius: 4, boxShadow: 2, p: 0 }}>
        <Box sx={{ px: { xs: 1, sm: 3 }, pt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              borderRadius: 3,
              bgcolor: '#fafbfc',
              minHeight: 48,
              '.MuiTab-root': { fontWeight: 600, fontSize: 16 }
            }}
            variant="fullWidth"
          >
            <Tab label="Seguimientos" />
            <Tab label="Seguimientos general" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <SeguimientosTab userid={userid!} />
          )}
          {tab === 1 && (
            <Typography color="text.secondary">
              <SeguimientosGeneralTab userid={userid!} />
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ContainerSeguimientos
