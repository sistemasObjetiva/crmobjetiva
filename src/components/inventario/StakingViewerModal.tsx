import React from 'react'
import {
  Modal,
  Box,
  Typography,
  Paper,
  Stack,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { Proyecto, Unidad, Document as Doc } from '../../config/types'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

// 👇 Asegúrate de exportar CanvasNodes desde tu diseñador y corrige esta ruta
import { CanvasNodes } from '../admin/ProyectoStackingTab'

const CANVAS_W = 2400
const CANVAS_H = 1400

// ===== Helpers (mismo criterio que en el diseñador) =====
const normalize = (s?: string | null) =>
  (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const toNumber = (v: any): number => {
  if (v == null) return NaN
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : NaN
}

const sanitizeStatus = (s?: string) => {
  const n = normalize(s)
  if (n === 'apartado') return 'apartado'
  if (n === 'disponible') return 'disponible'
  return 'vendido'
}

type MappedUnit = {
  id: string
  numero: string
  torre: string
  nivel?: number
  estatus: 'vendido' | 'apartado' | 'disponible'
  area?: number
  precio?: number
}

const mapUnidad = (u: Unidad): MappedUnit => {
  const nivelVal = toNumber(u.extras?.nivel ?? u.extras?.Nivel)
  const precio = toNumber(u.preciolista)
  const area = toNumber(
    u.extras?.area ??
      u.extras?.m2 ??
      u.extras?.metros ??
      u.extras?.metros2 ??
      u.extras?.metros_cuadrados ??
      u.extras?.superficie
  )
  return {
    id: u.id,
    numero: String(u.numerounidad || ''),
    torre: (u.unidadprivativa as string) || 'Torre A',
    nivel: Number.isFinite(nivelVal) ? nivelVal : undefined,
    estatus: sanitizeStatus(u.estatus) as MappedUnit['estatus'],
    area: Number.isFinite(area) ? area : undefined,
    precio: Number.isFinite(precio) ? precio : undefined,
  }
}

// ===== Props =====
type StackingViewerModalProps = {
  open: boolean
  onClose: () => void
  proyecto: Proyecto | null
}

const StackingViewerModal: React.FC<StackingViewerModalProps> = ({ open, onClose, proyecto }) => {
  // Datos desde el proyecto
  const stack = (proyecto as any)?.stacking || {}
  const nodes = stack?.nodes ?? []
  const backgroundDocs = (stack?.background as Doc[] | null) ?? null
  const bgFit = stack?.backgroundFit ?? 'contain'
  const bgOpacity = typeof stack?.backgroundOpacity === 'number' ? stack.backgroundOpacity : 0.6

  const allUnits: MappedUnit[] = React.useMemo(
    () => (proyecto?.unidades ?? []).map(mapUnidad),
    [proyecto?.unidades]
  )
  const unitById = React.useMemo(() => {
    const m = new Map<string, MappedUnit>()
    allUnits.forEach(u => m.set(u.id, u))
    return m
  }, [allUnits])

  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [fit, setFit] = React.useState(true)
  const [zoom, setZoom] = React.useState(1)

  React.useLayoutEffect(() => {
    if (!fit || !open) return
    const update = () => {
      const w = containerRef.current?.clientWidth || 0
      const h = containerRef.current?.clientHeight || 0
      if (w && h) setZoom(Math.min(w / CANVAS_W, h / CANVAS_H))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [fit, open])

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="modal-stacking-viewer">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: 24,
          width: { xs: '96vw', md: '90vw' },
          height: { xs: '88vh', md: '85vh' },
          outline: 'none',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={800}>Stacking</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>

        <Stack direction="row" alignItems="center" gap={2}>
          <FormControlLabel
            control={<Switch checked={fit} onChange={(_, v) => setFit(v)} />}
            label="Ajustar a ventana"
          />
          <Stack direction="row" alignItems="center" gap={1} sx={{ width: 260 }}>
            <Typography variant="caption">Zoom</Typography>
            <Slider
              min={0.4} max={2} step={0.05}
              value={zoom}
              onChange={(_, v) => setZoom(v as number)}
              valueLabelDisplay="auto"
              disabled={fit}
            />
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: 2, p: 1, flex: 1, minHeight: 300 }}>
          {!nodes?.length ? (
            <Box py={6} textAlign="center" sx={{ opacity: 0.7 }}>
              Aún no hay un layout de stacking guardado en el proyecto.
            </Box>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <Box ref={containerRef} sx={{ height: '100%' }}>
                <CanvasNodes
                  zoom={zoom}
                  editMode={false}
                  nodes={nodes}
                  setNodes={() => {}}
                  unitById={unitById}
                  scrollRef={scrollRef}
                  backgroundDocs={backgroundDocs}
                  backgroundFit={bgFit}
                  backgroundOpacity={bgOpacity}
                />
              </Box>
            </DndProvider>
          )}
        </Paper>
      </Box>
    </Modal>
  )
}

export default StackingViewerModal
