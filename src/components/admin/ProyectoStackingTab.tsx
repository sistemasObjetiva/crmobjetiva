// ProyectoStackingDesignerTab.tsx
import React, { useEffect } from 'react';
import {
  Box, Paper, Typography, Stack, Chip, IconButton, Tooltip, Button,
  Divider, Slider, Switch, FormControlLabel, TextField, Select, MenuItem
} from '@mui/material';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Save from '@mui/icons-material/Save';
import ZoomOutMap from '@mui/icons-material/ZoomOutMap';
import ImageIcon from '@mui/icons-material/Image';
import RemoveCircleOutline from '@mui/icons-material/RemoveCircleOutline';
import type { Proyecto, Unidad, Document as Doc } from '../../config/types';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Rnd } from 'react-rnd';
import { actualizarProyecto } from '../../hooks/useFetchFunctions';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';

// ======================================================
// Constantes / utils
// ======================================================
const GRID = 10;
const CARD_H = 70;
const MIN_W = 120;
const AREA_UNIT = 'm'; // unidad para área (no m²)

const normalize = (s?: string | null) =>
  (s ?? '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const toNumber = (v: any): number => {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const getFirst = <T,>(obj: any, keys: string[], fallback?: T): T | undefined => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return fallback;
};

// Estatus saneado: cualquier cosa que no sea "apartado" o "disponible" => "vendido"
const sanitizeStatus = (s?: string) => {
  const n = normalize(s);
  if (n === 'apartado') return 'apartado';
  if (n === 'disponible') return 'disponible';
  return 'vendido';
};

// Colores por estatus (ya saneado)
const statusColor = (s?: string) =>
  s === 'vendido' ? '#06d6a0' : s === 'apartado' ? '#eab308' : '#ffffff';

// ======================================================
// Tipos locales
// ======================================================
type StackingNode = {
  id: string;  // unidad.id
  x: number;
  y: number;
  w: number;
  h: number;
};

type StackingState = {
  zoom: number;
  nodes: StackingNode[];
  background: Doc[] | null;
  backgroundFit?: 'contain' | 'cover' | 'none';
  backgroundOpacity?: number; // 0..1
};

// ======================================================
// Mapeo de Unidad -> MappedUnit
// ======================================================
type MappedUnit = {
  id: string;
  numero: string;
  torre: string;
  nivel?: number; // solo si existe en extras.nivel/Nivel
  estatus: 'vendido' | 'apartado' | 'disponible';
  area?: number;
  precio?: number;
};

const mapUnidad = (u: Unidad): MappedUnit => {
  const numero = String(u.numerounidad || '');
  const torre =
    (u.unidadprivativa as string) ||
    (getFirst<string>(u.extras || {}, ['torre', 'edificio', 'tower']) ?? 'Torre A');

  // Mostrar "Nivel" solo si viene explícito (nivel / Nivel)
  const nivelVal = toNumber(getFirst<number | string>(u.extras || {}, ['nivel', 'Nivel']));

  const area = toNumber(
    getFirst<number | string>(u.extras || {}, [
      'area', 'm2', 'metros', 'metros2', 'metros_cuadrados', 'superficie'
    ])
  );
  const precio = toNumber(u.preciolista);

  return {
    id: u.id,
    numero,
    torre,
    nivel: Number.isFinite(nivelVal) ? nivelVal : undefined,
    estatus: sanitizeStatus(u.estatus) as MappedUnit['estatus'],
    area: Number.isFinite(area) ? area : undefined,
    precio: Number.isFinite(precio) ? precio : undefined,
  };
};

// Tamaño mínimo según contenido
function minSizeFor(u?: MappedUnit): { w: number; h: number } {
  if (!u) return { w: MIN_W, h: CARD_H };
  const isDisponible = u.estatus === 'disponible';
  let h = 68;                      // número + info + chip
  if (typeof u.area === 'number') h += 4;
  if (isDisponible && u.precio != null) h += 18; // línea de precio
  h = Math.max(GRID, Math.ceil(h / GRID) * GRID); // redondea a la grilla
  return { w: MIN_W, h };
}

// ======================================================
// Drag & Drop
// ======================================================
const DND_TYPES = { UNIT: 'UNIT' } as const;
type DragItem = { type: typeof DND_TYPES.UNIT; unitId: string };

// ------------------------------------------------------
// Palette Card (draggable)
// ------------------------------------------------------
const PaletteCard: React.FC<{ u: MappedUnit }> = React.memo(({ u }) => {
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: DND_TYPES.UNIT,
    item: () => ({ type: DND_TYPES.UNIT, unitId: u.id }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [u.id]);

  const bg = statusColor(u.estatus);
  const isWhiteBg = bg === '#ffffff';

  return (
    <Paper
      ref={drag}
      sx={{
        p: 1,
        borderRadius: 2,
        bgcolor: isDragging ? 'action.selected' : 'background.paper',
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: 1,
      }}
    >
      <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{u.numero || 'UN'}</Typography>
      <Typography variant="caption">
        {String(u.torre)}
        {typeof u.nivel === 'number' ? ` · Nivel ${u.nivel}` : ''}
      </Typography>
      <Chip
        label={u.estatus.toUpperCase()}
        size="small"
        sx={{
          mt: 0.5,
          bgcolor: isWhiteBg ? 'rgba(0,0,0,0.06)' : bg,
          color: isWhiteBg ? '#111' : '#fff',
          fontWeight: 700
        }}
      />
    </Paper>
  );
});
PaletteCard.displayName = 'PaletteCard';

// ------------------------------------------------------
// NodeCard (componente hijo por nodo)
// ------------------------------------------------------
type NodeCardProps = {
  n: StackingNode;
  u: MappedUnit;
  editMode: boolean;
  setNodes: React.Dispatch<React.SetStateAction<StackingNode[]>>;
  unitById: Map<string, MappedUnit>;
  scale: number; // <— importante para que Rnd sincronice con el zoom
};

const NodeCard: React.FC<NodeCardProps> = React.memo(({ n, u, editMode, setNodes, unitById, scale }) => {
  const isDisponible = u.estatus === 'disponible';
  const bg = statusColor(u.estatus);
  const isWhiteBg = bg === '#ffffff';
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // Auto-grow si el contenido necesita más alto por wrap
  React.useLayoutEffect(() => {
    const scrollH = bodyRef.current?.scrollHeight ?? 0;
    if (scrollH && scrollH > n.h) {
      const needed = Math.ceil(scrollH / GRID) * GRID;
      setNodes(prev => prev.map(nn => nn.id === n.id ? { ...nn, h: needed } : nn));
    }
  }, [n.id, n.h, n.w, u.estatus, u.area, u.precio, setNodes]);

  const info: string[] = [String(u.torre)];
  if (typeof u.nivel === 'number') info.push(`Nivel ${u.nivel}`);if (typeof u.area === 'number')
  info.push(`${(Math.round(u.area * 100) / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${AREA_UNIT}`);


  const body = (
    <Paper
      ref={bodyRef}
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 2,
        bgcolor: bg,
        color: isWhiteBg ? '#111' : '#fff',
        border: isWhiteBg ? '1px solid #e5e7eb' : 'none',
        display: 'flex',
        flexDirection: 'column',
        p: 1,
        gap: 0.5,
        boxShadow: 2,
        userSelect: 'none',
        overflow: 'hidden',
        wordBreak: 'break-word',
        willChange: 'transform',
      }}
      elevation={3}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          {u.numero || 'UN'}
        </Typography>
        {editMode && (
          <Tooltip title="Quitar del canvas">
            <IconButton
              size="small"
              sx={{ color: isWhiteBg ? '#111' : '#fff' }}
              onClick={(e) => {
                e.stopPropagation();
                setNodes(prev => prev.filter(nn => nn.id !== n.id));
              }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Info: Torre · (Nivel) · (Área m) */}
      <Typography variant="caption">{info.join(' · ')}</Typography>

      {/* Precio SOLO si está disponible */}
      {isDisponible && u.precio != null && (
        <Typography variant="body2" sx={{ fontWeight: 800, mt: 0.25 }}>
          {formatoMoneda(u.precio)}
        </Typography>
      )}

      <Chip
        label={u.estatus.toUpperCase()}
        size="small"
        sx={{
          mt: 'auto',
          bgcolor: isWhiteBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.25)',
          color: isWhiteBg ? '#111' : '#fff',
          fontWeight: 700
        }}
      />
    </Paper>
  );

  if (!editMode) {
    return (
      <Box sx={{ position: 'absolute', left: n.x, top: n.y, width: n.w, height: n.h }}>
        {body}
      </Box>
    );
  }

  return (
    <Rnd
      size={{ width: n.w, height: n.h }}
      position={{ x: n.x, y: n.y }}
      bounds="parent"
      dragGrid={[GRID, GRID]}
      resizeGrid={[GRID, GRID]}
      minWidth={MIN_W}
      minHeight={minSizeFor(unitById.get(n.id)).h}
      scale={scale} // <<< CORRECCIÓN CLAVE DEL PROBLEMA DE ZOOM
      onDragStop={(_, d) => {
        setNodes(prev => prev.map(nn => nn.id === n.id ? { ...nn, x: d.x, y: d.y } : nn));
      }}
      onResizeStop={(_, __, ref, ___, pos) => {
        const uMap = unitById.get(n.id);
        const min = minSizeFor(uMap);
        const w = Math.max(min.w, Math.round(ref.offsetWidth  / GRID) * GRID);
        const h = Math.max(min.h, Math.round(ref.offsetHeight / GRID) * GRID);
        setNodes(prev => prev.map(nn =>
          nn.id === n.id ? { ...nn, x: pos.x, y: pos.y, w, h } : nn
        ));
      }}
      enableResizing={{
        bottomRight: true, bottom: true, right: true,
        bottomLeft: true, topRight: true, top: true, left: true, topLeft: true
      }}
    >
      {body}
    </Rnd>
  );
});
NodeCard.displayName = 'NodeCard';

// ------------------------------------------------------
// CanvasNodes
// ------------------------------------------------------
export const CanvasNodes: React.FC<{
  zoom: number;
  editMode: boolean;
  nodes: StackingNode[];
  setNodes: React.Dispatch<React.SetStateAction<StackingNode[]>>;
  unitById: Map<string, MappedUnit>;
  scrollRef: React.RefObject<HTMLDivElement>;
  backgroundDocs: Doc[] | null;
  backgroundFit: 'contain' | 'cover' | 'none';
  backgroundOpacity: number;
}> = ({ zoom, editMode, nodes, setNodes, unitById, scrollRef, backgroundDocs, backgroundFit, backgroundOpacity }) => {
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem>(() => ({
    accept: DND_TYPES.UNIT,
    drop: (item, monitor) => {
      const client = monitor.getClientOffset();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!client || !rect) return;

      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const scrollTop  = scrollRef.current?.scrollTop  ?? 0;

      // Coords relativas al canvas (incluye zoom + scroll)
      const rx = (client.x - rect.left + scrollLeft) / zoom;
      const ry = (client.y - rect.top  + scrollTop ) / zoom;

      const x = Math.round(rx / GRID) * GRID;
      const y = Math.round(ry / GRID) * GRID;

      // Tamaño base según contenido
      const uDropped = unitById.get(item.unitId);
      const base = minSizeFor(uDropped);

      setNodes(prev => {
        const idx = prev.findIndex(n => n.id === item.unitId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], x, y };
          return copy;
        }
        return [...prev, { id: item.unitId, x, y, w: base.w, h: base.h }];
      });
    },
  }), [zoom, setNodes, unitById, scrollRef]);

  drop(canvasRef);

  // Resuelve la URL del fondo (tomamos el primer doc)
  const bgDoc = backgroundDocs?.[0];
  const bgSrc = bgDoc?.url || bgDoc?.path || '';

  return (
    <Paper
      ref={scrollRef}
      variant="outlined"
      sx={{
        position: 'relative',
        borderRadius: 3,
        p: 0,
        overflow: 'auto',
        height: '70vh',
      }}
    >
      <Box
        ref={canvasRef}
        sx={{
          position: 'relative',
          width: '2400px',
          height: '1400px',
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
          // Grid por encima del fondo
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID}px ${GRID}px, ${GRID}px ${GRID}px`,
        }}
      >
        {/* Fondo de imagen (debajo de los nodos) */}
        {!!bgSrc && (
          <Box
            component="img"
            src={bgSrc}
            alt={bgDoc?.nombre || 'background'}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: backgroundFit,
              opacity: backgroundOpacity,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}

        {nodes.map(n => {
          const u = unitById.get(n.id);
          if (!u) return null;
          return (
            <NodeCard
              key={n.id}
              n={n}
              u={u}
              editMode={editMode}
              setNodes={setNodes}
              unitById={unitById}
              scale={zoom}   // <- pasamos el zoom al Rnd
            />
          );
        })}
      </Box>
    </Paper>
  );
};

// ======================================================
// Componente principal
// ======================================================
interface Props {
  proyecto: Proyecto;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
  readOnly?: boolean;
}

const ProyectoStackingDesignerTab: React.FC<Props> = ({ proyecto, setProyecto, readOnly }) => {
  const allUnits = React.useMemo<MappedUnit[]>(
    () => (proyecto.unidades ?? []).map(mapUnidad),
    [proyecto.unidades]
  );

  const initial = React.useMemo<StackingState>(() => {
    const s = (proyecto as any).stacking as StackingState | undefined;
    return {
      zoom: s?.zoom ?? 1,
      nodes: s?.nodes ?? [],
      background: s?.background ?? null,
      backgroundFit: s?.backgroundFit ?? 'contain',
      backgroundOpacity: typeof s?.backgroundOpacity === 'number' ? s.backgroundOpacity : 0.6,
    };
  }, [proyecto]);

  const [zoom, setZoom] = React.useState<number>(initial.zoom);
  const [nodes, setNodes] = React.useState<StackingNode[]>(initial.nodes);
  const [backgroundDocs, setBackgroundDocs] = React.useState<Doc[] | null>(initial.background);
  const [bgFit, setBgFit] = React.useState<'contain' | 'cover' | 'none'>(initial.backgroundFit ?? 'contain');
  const [bgOpacity, setBgOpacity] = React.useState<number>(initial.backgroundOpacity ?? 0.6);
  const [editMode, setEditMode] = React.useState<boolean>(!readOnly);

  // Filtros
  const [search, setSearch] = React.useState('');
  const [filterTorre, setFilterTorre] = React.useState<string>('');
  const [filterStatus, setFilterStatus] = React.useState<string>('');

  const placed = React.useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);

  const torres = React.useMemo(() => {
    const s = new Set<string>();
    allUnits.forEach(u => s.add(u.torre || 'Torre A'));
    return Array.from(s).sort((a, b) => String(a).localeCompare(String(b), 'es', { numeric: true }));
  }, [allUnits]);

  const available = React.useMemo(() => {
    return allUnits
      .filter(u => !placed.has(u.id))
      .filter(u => (filterTorre ? String(u.torre) === filterTorre : true))
      .filter(u => (filterStatus ? u.estatus === filterStatus : true))
      .filter(u => {
        if (!search) return true;
        const n = normalize(search);
        return normalize(u.numero).includes(n) || normalize(u.torre).includes(n);
      })
      .sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'es', { numeric: true }));
  }, [allUnits, placed, filterTorre, filterStatus, search]);

  // id -> unidad
  const unitById = React.useMemo(() => {
    const m = new Map<string, MappedUnit>();
    allUnits.forEach(u => m.set(u.id, u));
    return m;
  }, [allUnits]);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const saveIntoProject = () => {
    setProyecto(prev => {
      if (!prev) return prev;
      const next: any = { ...prev };
      next.stacking = {
        zoom,
        nodes,
        background: backgroundDocs,
        backgroundFit: bgFit,
        backgroundOpacity: bgOpacity,
      };
      return next;
    });
  };

  // Autosave (debounce)
  useEffect(() => {
    if (!editMode) return;
    const t = setTimeout(() => {
      actualizarProyecto({
        ...proyecto,
        stacking: {
          zoom,
          nodes,
          background: backgroundDocs,
          backgroundFit: bgFit,
          backgroundOpacity: bgOpacity,
        }
      }).catch(err => console.error('autosave stacking error', err));
    }, 800);
    return () => clearTimeout(t);
  }, [zoom, nodes, backgroundDocs, bgFit, bgOpacity, editMode, proyecto]);

  // ---- Subir/Quitar imagen de fondo ----
  const onPickBackground = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const dataURL = await fileToDataURL(file);
    const doc: Doc = {
      id: crypto.randomUUID(),
      nombre: file.name,
      file,
      url: dataURL, // render inmediato
    };
    setBackgroundDocs([doc]);
  };
  const clearBackground = () => setBackgroundDocs(null);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2 }}>
        {/* Sidebar */}
        <Paper sx={{ p: 2, borderRadius: 3, height: '70vh', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" fontWeight={900}>Paleta de unidades</Typography>

          <TextField
            size="small"
            label="Buscar (número / torre)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <Select size="small" value={filterTorre} onChange={(e) => setFilterTorre(String(e.target.value))} displayEmpty>
            <MenuItem value=""><em>Todas las torres</em></MenuItem>
            {torres.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>

          <Select size="small" value={filterStatus} onChange={(e) => setFilterStatus(String(e.target.value))} displayEmpty>
            <MenuItem value=""><em>Todos los estatus</em></MenuItem>
            <MenuItem value="disponible">DISPONIBLE</MenuItem>
            <MenuItem value="apartado">APARTADO</MenuItem>
            <MenuItem value="vendido">VENDIDO</MenuItem>
          </Select>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ overflow: 'auto', flex: 1, pr: 0.5 }}>
            <Stack spacing={1}>
              {available.map(u => <PaletteCard key={u.id} u={u} />)}
              {available.length === 0 && (
                <Typography variant="body2" color="text.secondary">Sin unidades disponibles en la paleta.</Typography>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Fondo del canvas */}
          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={800}>Fondo del canvas</Typography>
              <FormControlLabel
                control={<Switch checked={editMode} onChange={(_, v) => setEditMode(v)} />}
                label="Modo edición"
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<ImageIcon />}
                component="label"
                disabled={!editMode}
              >
                Elegir imagen
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickBackground(f);
                    e.currentTarget.value = '';
                  }}
                />
              </Button>

              <Tooltip title="Quitar imagen de fondo">
                <span>
                  <IconButton onClick={clearBackground} disabled={!backgroundDocs || !editMode}>
                    <RemoveCircleOutline />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {backgroundDocs?.[0] && (
              <>
                <Typography variant="caption" color="text.secondary" noWrap title={backgroundDocs[0].nombre}>
                  {backgroundDocs[0].nombre}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" width={60}>Fit:</Typography>
                  <Select
                    size="small"
                    value={bgFit}
                    onChange={(e) => setBgFit(e.target.value as any)}
                    disabled={!editMode}
                    sx={{ flex: 1 }}
                  >
                    <MenuItem value="contain">contain</MenuItem>
                    <MenuItem value="cover">cover</MenuItem>
                    <MenuItem value="none">none</MenuItem>
                  </Select>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" width={60}>Opacidad:</Typography>
                  <Slider
                    min={0} max={100} step={1}
                    value={Math.round((bgOpacity ?? 1) * 100)}
                    onChange={(_, v) => setBgOpacity((v as number) / 100)}
                    valueLabelDisplay="auto"
                    disabled={!editMode}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </>
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" alignItems="center" gap={1}>
            <ZoomOutMap fontSize="small" />
            <Slider min={0.5} max={2} step={0.1} value={zoom} onChange={(_, v) => setZoom(v as number)} valueLabelDisplay="auto" />
          </Stack>

          <Stack direction="row" gap={1}>
            <Tooltip title="Limpiar canvas (quitar todas)">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<RestartAlt />}
                  onClick={() => setNodes([])}
                  disabled={!editMode}
                  fullWidth
                >
                  Limpiar
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Guardar layout en el proyecto">
              <span>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={saveIntoProject}
                  disabled={!editMode}
                  fullWidth
                >
                  Guardar
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Paper>

        {/* Canvas */}
        <CanvasNodes
          zoom={zoom}
          editMode={editMode}
          nodes={nodes}
          setNodes={setNodes}
          unitById={unitById}
          scrollRef={scrollRef}
          backgroundDocs={backgroundDocs}
          backgroundFit={bgFit}
          backgroundOpacity={bgOpacity}
        />
      </Box>

      <Box mt={1} color="text.secondary">
        <Typography variant="caption">
          Arrastra una tarjeta desde la paleta y suéltala en el canvas. Luego puedes moverla o redimensionarla.
          El diseño se guarda dentro de <code>proyecto.stacking</code>.
        </Typography>
      </Box>
    </DndProvider>
  );
};

export default ProyectoStackingDesignerTab;

// ======================================================
// Helpers
// ======================================================
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
