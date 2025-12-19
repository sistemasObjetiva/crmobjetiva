import React from 'react'
import {
  Modal,
  Box,
  Typography,
  Grid,
  Divider,
  IconButton,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Paper,
  TableContainer,
  Button,
  Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SignedAvatar from '../general/SignedAvatar'
import SignedImage from '../general/SignedImage'
import SignedImageCarousel from '../general/SinedImageCarousel'
import { formatoMoneda } from '../../hooks/useUtilsFunctions'
import { Proyecto, Unidad } from '../../config/types'

// 👇 Importa el modal separado
import StackingViewerModal from './StakingViewerModal'

interface ProyectoViewModalProps {
  open: boolean
  onClose: () => void
  proyecto: Proyecto | null
  onCotizarUnidad: (unidad: Unidad, proyecto: Proyecto) => void
}

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

const ProyectoViewModal: React.FC<ProyectoViewModalProps> = ({
  open,
  onClose,
  proyecto,
  onCotizarUnidad
}) => {
  if (!proyecto) return null

  const camposBasicos = [
    { label: 'Nombre', value: proyecto.nombre },
    { label: 'Estatus', value: proyecto.estatus },
    { label: 'Fecha de entrega', value: proyecto.fechaEntrega && new Date(proyecto.fechaEntrega).toLocaleDateString() },
    { label: 'Amenidades', value: (proyecto.amenidades || []).length > 0 ? (proyecto.amenidades || []).join(', ') : null },
    { label: 'Unidades', value: proyecto.unidades?.length ?? 0 },
    { label: 'Planes de pago', value: proyecto.paymentPlans?.length ?? 0 },
  ]
  const maxMeses = Math.max(0, ...(proyecto.paymentPlans || []).map(p => p.months || 0))

  // Para habilitar/deshabilitar el botón “Ver stacking”
  const nodesCount = ((proyecto as any).stacking?.nodes ?? []).length

  // Estado del modal de stacking
  const [openStacking, setOpenStacking] = React.useState(false)

  return (
    <>
      <Modal open={open} onClose={onClose} aria-labelledby="modal-proyecto-view" aria-describedby="modal-proyecto-view-content">
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'white',
            borderRadius: 3,
            boxShadow: 24,
            width: { xs: '95%', sm: 960 },
            maxHeight: '95vh',
            outline: 'none',
            p: 4,
            overflow: 'auto',
          }}
        >
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12 }}>
            <CloseIcon />
          </IconButton>

          {/* Encabezado con logo/render */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              mb: 2,
              flexWrap: 'wrap',
              minHeight: 88
            }}
          >
            {proyecto.logo && (
              <SignedAvatar
                value={proyecto.logo}
                alt="logo"
                sx={{
                  width: { xs: 60, sm: 70, md: 80 },
                  height: { xs: 60, sm: 70, md: 80 },
                  border: '2px solid #eee',
                  boxShadow: 1,
                  background: '#fff'
                }}
              />
            )}
            {proyecto.render && (
              <SignedImage
                path={proyecto.render.path!}
                bucket={proyecto.render.bucket!}
                alt="render"
                sx={{
                  width: { xs: 110, sm: 140, md: 180 },
                  height: { xs: 74, sm: 90, md: 110 },
                  borderRadius: 3,
                  border: '2px solid #eee',
                  boxShadow: 1,
                  objectFit: 'cover',
                  background: '#fff',
                  ml: proyecto.logo ? 2 : 0
                }}
              />
            )}
          </Box>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'var(--primary-color)', textAlign: 'center' }}>
              {proyecto.nombre}
            </Typography>

            <Tooltip title={nodesCount ? 'Abrir stacking en un modal' : 'Aún no hay stacking guardado'}>
              <span>
                <Button
                  variant="contained"
                  onClick={() => setOpenStacking(true)}
                  disabled={!nodesCount}
                >
                  Ver stacking
                </Button>
              </span>
            </Tooltip>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {camposBasicos.map(
              (campo, i) =>
                campo.value && (
                  <Grid item xs={12} sm={6} key={campo.label + i}>
                    <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                      {campo.label}
                    </Typography>
                    {campo.label === 'Amenidades' ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {(proyecto.amenidades || []).map((am, idx) => (
                          <Chip key={am + idx} label={am} color="secondary" size="small" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ color: '#555', mb: 1 }}>{campo.value}</Typography>
                    )}
                  </Grid>
                )
            )}
          </Grid>

          {proyecto.descripcion && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 1 }}>
                Descripción
              </Typography>
              <Typography sx={{ color: '#444', whiteSpace: 'pre-line' }}>
                {proyecto.descripcion}
              </Typography>
            </>
          )}

          {proyecto.imagenesProyecto && proyecto.imagenesProyecto.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ color: 'var(--primary-color)', fontWeight: 500, mb: 1 }}>
                Imágenes del Proyecto
              </Typography>
              <Box sx={{ mb: 2, width: '100%', maxWidth: 380, mx: 'auto', display: 'flex', justifyContent: 'center' }}>
                <SignedImageCarousel items={Array.isArray(proyecto.imagenesProyecto) ? proyecto.imagenesProyecto : []} width="100%" height={180} />
              </Box>
            </>
          )}

          {/* Unidades */}
          {proyecto.unidades && proyecto.unidades.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 2 }}>
                Unidades
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>No. Unidad</TableCell>
                    <TableCell>Privativa</TableCell>
                    <TableCell>Precio lista</TableCell>
                    <TableCell>Estatus</TableCell>
                    <TableCell align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyecto.unidades.map((u, idx) => {
                    const chip = unidadChipProps(u.estatus)
                    const hidePrice = ocultarPrecioPorEstatus(u.estatus)
                    return (
                      <TableRow key={u.id || idx}>
                        <TableCell>{u.numerounidad}</TableCell>
                        <TableCell>{u.unidadprivativa}</TableCell>
                        <TableCell>
                          {hidePrice ? (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          ) : (
                            formatoMoneda(u.preciolista)
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={chip.label} color={chip.color} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="info"
                            onClick={() => chip.label !== 'Vendido' && onCotizarUnidad(u, proyecto)}
                            disabled={chip.label === 'Vendido'}
                          >
                            {chip.label === 'Vendido' ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          )}

          {/* Planes de pago */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 600, mb: 2 }}>
            Planes de Pago
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  {(proyecto.paymentPlans || []).map((plan, idx) => (
                    <TableCell key={idx} align="right">{plan.name}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Pago inicial</TableCell>
                  {(proyecto.paymentPlans || []).map((plan, idx) => (
                    <TableCell key={idx} align="right">
                      {plan.pInicial ? `%${plan.pInicial.toLocaleString()}` : '-'}
                    </TableCell>
                  ))}
                </TableRow>

                {Array.from({ length: maxMeses }).map((_, rowIdx) => (
                  <TableRow key={rowIdx}>
                    <TableCell sx={{ fontWeight: 600 }}>{`Mes ${rowIdx + 1}`}</TableCell>
                    {(proyecto.paymentPlans || []).map((plan, colIdx) => {
                      const parcialidad = plan.parcialidades.find(p => p.month === rowIdx + 1)
                      return (
                        <TableCell key={colIdx} align="right">
                          {parcialidad ? `%${parcialidad.value.toLocaleString()}` : '-'}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}

                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Contraentrega</TableCell>
                  {(proyecto.paymentPlans || []).map((plan, idx) => (
                    <TableCell key={idx} align="right">
                      {plan.contraentrega ? `%${plan.contraentrega.toLocaleString()}` : '-'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>

      {/* Modal separado del viewer */}
      <StackingViewerModal
        open={openStacking}
        onClose={() => setOpenStacking(false)}
        proyecto={proyecto}
      />
    </>
  )
}

export default ProyectoViewModal
