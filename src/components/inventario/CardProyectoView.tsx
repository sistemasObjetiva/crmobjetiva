import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import ImageIcon from '@mui/icons-material/Image'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { Proyecto } from '../../config/types'
import SignedImage from '../general/SignedImage'
import SignedAvatar from '../general/SignedAvatar'
import { formatoMoneda } from '../../hooks/useUtilsFunctions'

interface CardProyectoVisorProps {
  proyecto: Proyecto
  onView: (proyecto: Proyecto) => void
}

const estatusColor: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  activo: 'success',
  inactivo: 'warning',
  terminado: 'info',
  cancelado: 'error'
}

/** Mismas reglas/colores que en el modal */
function unidadChipProps(raw?: string): { label: 'Disponible' | 'Apartado' | 'Vendido'; color: 'success' | 'info' | 'warning' } {
  const s = (raw ?? '').trim().toLowerCase()
  if (s === 'disponible') return { label: 'Disponible', color: 'success' }
  if (s === 'apartado')   return { label: 'Apartado',   color: 'info' }
  return { label: 'Vendido', color: 'warning' }
}
function ocultarPrecioPorEstatus(raw?: string): boolean {
  const { label } = unidadChipProps(raw)
  return label === 'Vendido' || label === 'Apartado'
}

const CardProyectoVisor: React.FC<CardProyectoVisorProps> = ({ proyecto, onView }) => {
  const logoDoc = proyecto.logo ?? null

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform .15s',
        '&:hover': { transform: 'scale(1.03)' }
      }}
    >
      {/* Imagen principal */}
      {proyecto.render?.path && proyecto.render?.bucket ? (
        <SignedImage
          path={proyecto.render.path}
          bucket={proyecto.render.bucket}
          alt={proyecto.nombre}
          sx={{
            width: '100%',
            height: 140,
            objectFit: 'cover',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}
        />
      ) : (
        <Box
          height={140}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            background: 'linear-gradient(90deg, #f5f7fa, #c3cfe2)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16
          }}
        >
          <ImageIcon fontSize="large" color="disabled" />
        </Box>
      )}

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          {/* Logo */}
          {logoDoc && logoDoc.path && logoDoc.bucket ? (
            <SignedAvatar
              value={logoDoc}
              alt={proyecto.nombre}
              sx={{
                width: 44,
                height: 44,
                border: '2px solid #fff',
                boxShadow: 2,
                mr: 1
              }}
            />
          ) : (
            <Box width={44} height={44} mr={1} />
          )}

          <Box flex="1">
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {proyecto.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: 32 }}>
              {proyecto.descripcion || <span style={{ color: '#aaa' }}>Sin descripción</span>}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={proyecto.estatus || 'activo'}
            color={estatusColor[proyecto.estatus!] || 'success'}
            sx={{ ml: 1 }}
          />
        </Box>

        {/* Mini tabla de unidades */}
        {proyecto.unidades && proyecto.unidades.length > 0 && (
          <Box
            sx={{
              maxHeight: 180,
              overflowY: 'auto',
              mt: 1,
              bgcolor: 'rgba(0,0,0,0.01)',
              borderRadius: 1,
              border: '1px solid #eee'
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Unidad</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Estatus</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyecto.unidades.map((u) => {
                  const chip = unidadChipProps(u.estatus)
                  const hidePrice = ocultarPrecioPorEstatus(u.estatus)
                  return (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontSize: 13 }}>{u.numerounidad}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {hidePrice ? (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        ) : (
                          formatoMoneda(u.preciolista)
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        <Chip
                          size="small"
                          label={chip.label}
                          color={chip.color}
                          variant="filled"
                          sx={{ fontWeight: 700, minWidth: 90, justifyContent: 'center' }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}

      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Ver información">
          <IconButton color="primary" onClick={() => onView(proyecto)}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}

export default CardProyectoVisor
