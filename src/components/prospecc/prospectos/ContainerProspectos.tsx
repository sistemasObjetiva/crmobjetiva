import React, { useMemo, useState } from 'react'
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material'
import ProspectosTab from './ProspectosTab'
import ProspectosGeneralTab from './ProspectosGeneralTab'

interface ContainerProspectosProps {
  userid: string
  /** Rol del usuario actual. Ejemplos: 'admin' | 'gerencia' | 'operacion' | 'usuario' */
  userRole?: string
}

type TabKey = 'pros' | 'pros_gen'

const ContainerProspectos: React.FC<ContainerProspectosProps> = ({ userid, userRole }) => {
  // Si no te pasan el rol, asume que NO es "usuario" para no bloquear por defecto
  console.log(userRole)
  const canViewGeneral = (userRole ?? '').toLowerCase() !== 'usuario'

  const tabs = useMemo(
    () =>
      [
        { key: 'pros' as TabKey, label: 'Prospectos' },
        ...(canViewGeneral
          ? [{ key: 'pros_gen' as TabKey, label: 'Prospectos general' }]
          : []),
      ],
    [canViewGeneral]
  )

  const [active, setActive] = useState<TabKey>(tabs[0].key)

  // Si cambia el permiso y la pestaña activa ya no existe, regresa a la primera
  React.useEffect(() => {
    if (!tabs.find(t => t.key === active)) setActive(tabs[0].key)
  }, [tabs, active])

  return (
    <Box sx={{ width: '100%',  mx: 'auto', py: 3 }}>
      <Typography
        variant="h5"
        sx={{ mb: 2, color: 'var(--primary-color)', fontWeight: 700 }}
      >
        Prospectos
      </Typography>

      <Paper sx={{ borderRadius: 4, boxShadow: 2, p: 0,width: "100%" }}>
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
              '.MuiTab-root': { fontWeight: 600, fontSize: 16 }
            }}
            variant="fullWidth"
          >
            {tabs.map(t => (
              <Tab key={t.key} label={t.label} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {active === 'pros' && <ProspectosTab userid={userid} />}

          {active === 'pros_gen' && canViewGeneral && (
            <ProspectosGeneralTab userid={userid} />
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export default ContainerProspectos
