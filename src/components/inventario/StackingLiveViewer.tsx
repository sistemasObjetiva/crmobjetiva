// StackingLiveViewer.tsx
import React from 'react';
import { Box, Paper, Stack, Typography, Slider, Switch, FormControlLabel, Button } from '@mui/material';
import type { Proyecto, Unidad, Document as Doc } from '../../config/types';

// Usa tu CanvasNodes existente (el que ya arreglamos con scale en Rnd)
import { CanvasNodes } from '../admin/ProyectoStackingTab'; // ajusta la ruta real

const CANVAS_W = 2400;
const CANVAS_H = 1400;

// === Funciones que debes inyectar desde tu app ===
// fetchProyecto: Trae { id, stacking, unidades } del backend
// subscribeProyecto: (opcional) suscribe a cambios en tiempo real y devuelve un unsubscribe()
type LiveProyecto = Pick<Proyecto, 'id' | 'stacking' | 'unidades'>;

type Props = {
  proyectoId: string;
  fetchProyecto: (id: string) => Promise<LiveProyecto>;
  subscribeProyecto?: (id: string, cb: (p: LiveProyecto) => void) => () => void;
};

const normalize = (s?: string | null) =>
  (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const toNumber = (v: any): number => {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const sanitizeStatus = (s?: string) => {
  const n = normalize(s);
  if (n === 'apartado') return 'apartado';
  if (n === 'disponible') return 'disponible';
  return 'vendido';
};

// Mapeo mínimo (igual al del diseñador)
type MappedUnit = {
  id: string;
  numero: string;
  torre: string;
  nivel?: number;
  estatus: 'vendido' | 'apartado' | 'disponible';
  area?: number;
  precio?: number;
};
const mapUnidad = (u: Unidad): MappedUnit => {
  const nivelVal = toNumber(u.extras?.nivel ?? u.extras?.Nivel);
  const precio = toNumber(u.preciolista);
  const area = toNumber(
    u.extras?.area ?? u.extras?.m2 ?? u.extras?.metros ?? u.extras?.metros2 ?? u.extras?.metros_cuadrados ?? u.extras?.superficie
  );
  return {
    id: u.id,
    numero: String(u.numerounidad || ''),
    torre: (u.unidadprivativa as string) || 'Torre A',
    nivel: Number.isFinite(nivelVal) ? nivelVal : undefined,
    estatus: sanitizeStatus(u.estatus) as MappedUnit['estatus'],
    area: Number.isFinite(area) ? area : undefined,
    precio: Number.isFinite(precio) ? precio : undefined,
  };
};

const StackingLiveViewer: React.FC<Props> = ({ proyectoId, fetchProyecto, subscribeProyecto }) => {
  const [proyecto, setProyecto] = React.useState<LiveProyecto | null>(null);

  // UI
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState(true);
  const [zoom, setZoom] = React.useState(1);

  // cargar inicial
  React.useEffect(() => {
    fetchProyecto(proyectoId).then(setProyecto).catch(console.error);
  }, [proyectoId, fetchProyecto]);

  // realtime si existe subscribeProyecto
  React.useEffect(() => {
    if (!subscribeProyecto) return;
    const off = subscribeProyecto(proyectoId, setProyecto);
    return () => off?.();
  }, [proyectoId, subscribeProyecto]);

  // fallback polling si NO hay subscribeProyecto
  React.useEffect(() => {
    if (subscribeProyecto) return;
    const t = setInterval(() => {
      fetchProyecto(proyectoId).then(setProyecto).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [proyectoId, fetchProyecto, subscribeProyecto]);

  // Fit-to-window (recalcula zoom cuando cambia tamaño/fit)
  React.useLayoutEffect(() => {
    if (!fit) return;
    const update = () => {
      const w = containerRef.current?.clientWidth || 0;
      const h = containerRef.current?.clientHeight || 0;
      if (w && h) setZoom(Math.min(w / CANVAS_W, h / CANVAS_H));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [fit]);

  if (!proyecto?.stacking) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Typography>Cargando stacking…</Typography>
      </Paper>
    );
  }

  const stacking = proyecto.stacking as any;
  const nodes = stacking.nodes || [];
  const backgroundDocs = (stacking.background as Doc[] | null) ?? null;
  const bgFit = stacking.backgroundFit ?? 'contain';
  const bgOpacity = typeof stacking.backgroundOpacity === 'number' ? stacking.backgroundOpacity : 0.6;

  const allUnits: MappedUnit[] = (proyecto.unidades ?? []).map(mapUnidad);
  const unitById = React.useMemo(() => {
    const m = new Map<string, MappedUnit>();
    allUnits.forEach(u => m.set(u.id, u));
    return m;
  }, [allUnits]);

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={800}>Stacking (en vivo)</Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          <FormControlLabel
            control={<Switch checked={fit} onChange={(_, v) => setFit(v)} />}
            label="Ajustar a ventana"
          />
          <Stack direction="row" alignItems="center" gap={1} sx={{ width: 220 }}>
            <Typography variant="caption">Zoom</Typography>
            <Slider
              min={0.4} max={2} step={0.05}
              value={zoom}
              onChange={(_, v) => setZoom(v as number)}
              valueLabelDisplay="auto"
              disabled={fit}
            />
          </Stack>
          <Button variant="outlined" onClick={() => fetchProyecto(proyectoId).then(setProyecto)}>
            Refrescar ahora
          </Button>
        </Stack>
      </Stack>

      {/* Contenedor que controla el fit */}
      <Box ref={containerRef} sx={{ height: 'calc(100vh - 220px)' }}>
        <CanvasNodes
          zoom={zoom}
          editMode={false}           // 👈 sólo lectura
          nodes={nodes}
          setNodes={() => {}}       // no-op
          unitById={unitById}
          scrollRef={scrollRef}
          backgroundDocs={backgroundDocs}
          backgroundFit={bgFit}
          backgroundOpacity={bgOpacity}
          showDetails={true}
        />
      </Box>
    </Paper>
  );
};

export default StackingLiveViewer;
