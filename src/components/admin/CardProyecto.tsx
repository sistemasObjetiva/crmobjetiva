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
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageIcon from '@mui/icons-material/Image'
import { Proyecto } from '../../config/types'
import SignedImage from '../general/SignedImage'
import SignedAvatar from '../general/SignedAvatar'
import { formatoMoneda } from '../../hooks/useUtilsFunctions'

interface CardProyectoProps {
  proyecto: Proyecto
  onEdit: (proyecto: Proyecto) => void
  onDelete: (proyecto: Proyecto) => void
}

const estatusColor: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  activo: 'success',
  inactivo: 'warning',
  terminado: 'info',
  cancelado: 'error'
}
const unidadEstatusColor: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  disponible: 'success',
  vendido: 'warning',
  apartado: 'info'
}

const CardProyecto: React.FC<CardProyectoProps> = ({ proyecto, onEdit, onDelete }) => {
  // Logo del proyecto
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
      {/* Imagen principal con SignedImage */}
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
          {/* Logo con SignedAvatar */}
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
                maxHeight: 180,           // Ajusta la altura máxima a lo que necesites
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
                {proyecto.unidades.map((u) => (
                    <TableRow key={u.id}>
                    <TableCell sx={{ fontSize: 13 }}>{u.numerounidad}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                        {formatoMoneda(u.preciolista)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                        <Chip
                        size="small"
                        label={u.estatus.charAt(0).toUpperCase() + u.estatus.slice(1)}
                        variant="filled"
                        color={unidadEstatusColor[(u.estatus).toLocaleLowerCase()] || 'default'}
                        sx={{
                            fontWeight: 700,
                            minWidth: 75,
                            justifyContent: 'center'
                        }}
                        />
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </Box>
        )}

      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Editar">
          <IconButton color="primary" onClick={() => onEdit(proyecto)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton color="error" onClick={() => onDelete(proyecto)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}

export default CardProyecto
