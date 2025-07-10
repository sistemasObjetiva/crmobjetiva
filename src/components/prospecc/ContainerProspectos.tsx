import React, { useState } from 'react'
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material'
import ProspectosTab from './ProspectosTab'
import ProspectosGeneralTab from './ProspectosGeneralTab'

interface ContainerProspectosProps {
  userid: string
}

const ContainerProspectos: React.FC<ContainerProspectosProps> = ({ userid }) => {
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
        Prospectos
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
            <Tab label="Prospectos" />
            <Tab label="Prospectos general" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <ProspectosTab userid={userid!} />
          )}
          {tab === 1 && (
            <Typography color="text.secondary">
              <ProspectosGeneralTab userid={userid!} />
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ContainerProspectos
