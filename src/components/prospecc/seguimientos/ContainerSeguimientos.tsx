import React, { useMemo, useState, useEffect } from 'react'
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material'
import SeguimientosTab from './SeguimientosTabs'
import SeguimientosGeneralTab from './SeguimientosGeneralTabs'

interface Props {
  userid: string
  /** Rol del usuario actual: 'admin' | 'gerencia' | 'operacion' | 'usuario' */
  userRole?: string
}

type TabKey = 'seg' | 'seg_gen'

const ContainerSeguimientos: React.FC<Props> = ({ userid, userRole }) => {
  const canViewGeneral = (userRole ?? '').toLowerCase() !== 'usuario'

  const tabs = useMemo(
    () => [
      { key: 'seg' as TabKey, label: 'Seguimientos' },
      ...(canViewGeneral ? [{ key: 'seg_gen' as TabKey, label: 'Seguimientos general' }] : []),
    ],
    [canViewGeneral]
  )

  const [active, setActive] = useState<TabKey>(tabs[0].key)

  useEffect(() => {
    if (!tabs.find(t => t.key === active)) setActive(tabs[0].key)
  }, [tabs, active])

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', py: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, color: 'var(--primary-color)', fontWeight: 700 }}>
        Seguimientos
      </Typography>

      <Paper sx={{ borderRadius: 4, boxShadow: 2, p: 0 }}>
        <Box sx={{ px: { xs: 1, sm: 3 }, pt: 2 }}>
          <Tabs
            value={tabs.findIndex(t => t.key === active)}
            onChange={(_, idx) => setActive(tabs[idx].key)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              borderRadius: 3,
              bgcolor: '#fafbfc',
              minHeight: 48,
              '.MuiTab-root': { fontWeight: 600, fontSize: 16 },
            }}
            variant="fullWidth"
          >
            {tabs.map(t => (
              <Tab key={t.key} label={t.label} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {active === 'seg' && <SeguimientosTab userid={userid} />}

          {active === 'seg_gen' && canViewGeneral && (
            <SeguimientosGeneralTab  />
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ContainerSeguimientos
