// src/components/general/ProyectoSelector.tsx
import React, { useState, MouseEvent } from 'react'
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
  Fade,
} from '@mui/material'
import SignedImage from './SignedImage'
import type { Proyecto } from '../../config/types'

interface ProyectoSelectorProps {
  proyectos: Proyecto[]
  selectedProyecto: Proyecto | null
  onSelect: (proyecto: Proyecto) => void
}

const ProyectoSelector: React.FC<ProyectoSelectorProps> = ({
  proyectos,
  selectedProyecto,
  onSelect,
}) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleSelect = (proyecto: Proyecto) => {
    onSelect(proyecto)
    handleCloseMenu()
  }

  return (
    <>
      {selectedProyecto && (
        <Tooltip title={selectedProyecto.nombre} arrow>
          <Box
            onClick={handleOpenMenu}
            sx={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'pointer',
              border: `2px solid ${theme.palette.primary.contrastText}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.background.paper,
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'scale(1.05)',
              },
              transition: theme.transitions.create(['transform', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            {selectedProyecto.logo?.path ? (
              <SignedImage
                path={selectedProyecto.logo.path}
                bucket="proyectos"
                alt={selectedProyecto.nombre}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                {selectedProyecto.nombre.charAt(0).toUpperCase()}
              </Avatar>
            )}
          </Box>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[5],
          },
        }}
      >
        {proyectos.map((proy) => (
          <MenuItem
            key={proy.id}
            onClick={() => handleSelect(proy)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {proy.logo?.path ? (
                <SignedImage
                  path={proy.logo.path}
                  bucket="proyectos"
                  alt={proy.nombre}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  }}
                >
                  {proy.nombre.charAt(0).toUpperCase()}
                </Avatar>
              )}
            </Box>
            <Typography variant="body2">{proy.nombre}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ProyectoSelector
