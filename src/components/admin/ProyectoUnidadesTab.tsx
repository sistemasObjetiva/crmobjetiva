import React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  Alert,
  Stack,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'


import FileUploadPreview from '../general/FileUploadPreviewFiles';
import FileUploadCarouselPreview from '../general/FileUploadCarouselPreview';
import SignedImageCarousel from '../general/SinedImageCarousel';
import { Proyecto, Unidad, Document } from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';
import * as XLSX from 'xlsx';
import SignedImage from '../general/SignedImage';

type ImportMode = 'append' | 'replace' | 'merge';

interface ProyectoUnidadesTabProps {
  proyecto: Proyecto;
  unidad: Unidad | null;
  extrasKeys: string[];
  handleChangeUnidad: <K extends keyof Unidad>(field: K, value: Unidad[K]) => void;
  handleAddExtraKey: () => void;
  handleChangeExtraKey: (index: number, newKey: string) => void;
  handleChangeExtraValue: (key: string, value: string) => void;
  handleRemoveExtraKey: (index: number) => void;
  handleReorderExtraKeys: (from: number, to: number) => void;
  handleFileChange: (
    unidadId: string,
    field: keyof Pick<Unidad, 'render' | 'isometrico' | 'plano' | 'imagenes'>,
    files: File | File[]
  ) => void;
  handleFileRemove: (
    unidadId: string,
    field: keyof Pick<Unidad, 'render' | 'isometrico' | 'plano' | 'imagenes'>,
    docId: string
  ) => void;
  handleAddUnidad: () => void;
  handleEditUnidad: (index: number) => void;
  handleDeleteUnidad: (index: number) => void;
  userid: string;
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;
}

const PREVIEW_W = 220;
const PREVIEW_H = 160;
const GALLERY_W = 128;
const GALLERY_H = 900;

const ProyectoUnidadesTab: React.FC<ProyectoUnidadesTabProps> = ({
  proyecto,
  unidad,
  extrasKeys,
  handleChangeUnidad,
  handleAddExtraKey,
  handleChangeExtraKey,
  handleChangeExtraValue,
  handleRemoveExtraKey,
  handleFileChange,
  handleFileRemove,
  handleAddUnidad,
  handleEditUnidad,
  handleDeleteUnidad,
  handleReorderExtraKeys,
  setProyecto,
  userid,
}) => {
  // ---- UI/UX state ----
  const [autoSave, setAutoSave] = React.useState(true);
  const [savedFlash, setSavedFlash] = React.useState(false);

  // Aumentar precios
  const [openPrecioDialog, setOpenPrecioDialog] = React.useState(false);
  const [porcentajeAumento, setPorcentajeAumento] = React.useState(0);

  // Importación por Excel/CSV
  const [openImportDialog, setOpenImportDialog] = React.useState(false);
  const [importPreview, setImportPreview] = React.useState<Unidad[]>([]);
  const [importMode, setImportMode] = React.useState<ImportMode>('append');
  const [importWarnings, setImportWarnings] = React.useState<string[]>([]);

  const [importExtrasOrder, setImportExtrasOrder] = React.useState<string[] | null>(null);

  // ---- Helpers ----
  const requiredOk = (u?: Unidad | null) =>
    !!u?.numerounidad &&
    String(u?.numerounidad).trim() !== '' &&
    u?.preciolista !== undefined &&
    String(u?.preciolista).trim() !== '';

  const flashSaved = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };


  const upsertUnidadIntoProyecto = React.useCallback(
    (u: Unidad) => {
      setProyecto(prev => {
        if (!prev) return prev;
        const idx = prev.unidades.findIndex(x => x.id === u.id);
        if (idx >= 0) {
          const copy = [...prev.unidades];
          copy[idx] = { ...u };
          return { ...prev, unidades: copy };
        }
        if (requiredOk(u)) {
          return { ...prev, unidades: [...prev.unidades, { ...u }] };
        }
        return prev;
      });
      flashSaved();
    },
    [setProyecto]
  );

  React.useEffect(() => {
    if (!autoSave || !unidad) return;
    upsertUnidadIntoProyecto(unidad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidad, autoSave]);

  // ---- Importación por Excel/CSV ----
  const downloadUnidadesTemplate = () => {
  const base = ['numerounidad', 'unidadprivativa', 'preciolista', 'estatus'];
  const extrasHeader = proyecto.extrasOrder?.length ? proyecto.extrasOrder : extrasKeys;
  const header = [...base, ...extrasHeader];

  const wsData = [
    header,
    // fila de ejemplo
    ['Ej: 101', 'Ej: 1', '1000000', 'disponible', ...extrasHeader.map(() => '')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Unidades');
  XLSX.writeFile(wb, 'plantilla_unidades.xlsx');
};



  function unidadesFromExcel(
    file: File,
    userId: string,
    proyectoId: string
  ): Promise<{ unidades: Unidad[]; warnings: string[]; extrasOrder: string[] }> {
    return new Promise((resolve, reject) => {
      const isCsv =
        file.name.toLowerCase().endsWith('.csv') ||
        (file.type && file.type.toLowerCase().includes('csv'));

      const reader = new FileReader();
      reader.onload = e => {
        try {
          // 1) Leer el workbook
          const wb = isCsv
            ? XLSX.read(String(e.target?.result || ''), { type: 'string' })
            : XLSX.read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });

          const sheet = wb.Sheets[wb.SheetNames[0]];

          // 2) Encabezados en orden (AOA)
          const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' }) as any[];
          const headerRow: string[] = Array.isArray(aoa?.[0]) ? aoa[0].map(String) : [];

          const COLUMNAS_BASE = ['numerounidad', 'unidadprivativa', 'preciolista', 'estatus'];

          // 3) Orden de extras proveniente del archivo
          const extrasOrder = headerRow.filter(h => h && !COLUMNAS_BASE.includes(h));

          // 4) Datos por filas (objetos)
          const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

          const warnings: string[] = [];
          const unidades: Unidad[] = (json as any[]).map((row, idx) => {
            const base: any = {};
            const extras: any = {};

            for (const key in row) {
              if (COLUMNAS_BASE.includes(key)) base[key] = row[key];
              else extras[key] = row[key];
            }

            // Convertir unidadprivativa a número si se puede
            const upNum = (() => {
              const v = base.unidadprivativa;
              if (typeof v === 'number' && Number.isFinite(v)) return v;
              if (typeof v === 'string') {
                const trimmed = v.trim();
                if (!trimmed) return null;
                const m = trimmed.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
                if (!m) return null;
                const n = Number(m[0]);
                return Number.isFinite(n) ? n : null;
              }
              return null;
            })();

            let unidadprivativaFinal = base.unidadprivativa ?? '';
            if (upNum !== null) {
              unidadprivativaFinal = String(upNum);
            } else if (String(unidadprivativaFinal).trim() !== '') {
              const fila = idx + 2; // cabecera en 1
              warnings.push(
                `Fila ${fila}: "unidadprivativa" = "${String(unidadprivativaFinal)}" no es numérica; se conservó sin cambios.`
              );
            }

            return {
              id: crypto.randomUUID(),
              userid: userId,
              proyectoid: proyectoId,
              numerounidad: base.numerounidad || '',
              unidadprivativa: unidadprivativaFinal,
              preciolista: base.preciolista || '',
              extras,
              imagenes: [],
              estatus: base.estatus?.toLowerCase?.() || 'disponible',
            } as Unidad;
          });

          resolve({ unidades, warnings, extrasOrder });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);

      if (isCsv) reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    });
  }


  

  // en handleExcelSelected:
  const handleExcelSelected = async (file?: File) => {
    if (!file || !proyecto) return;
    try {
      const { unidades, warnings, extrasOrder } = await unidadesFromExcel(file, userid, proyecto.id);
      setImportPreview(unidades);
      setImportMode('append');
      setImportWarnings(warnings || []);
      setImportExtrasOrder(extrasOrder ?? []);
      setOpenImportDialog(true);
    } catch (err) {
      alert('Error leyendo archivo: ' + err);
    }
  };
  // helper para fusionar órdenes (prioriza el orden importado y conserva los existentes al final)
const mergeExtrasOrder = (current: string[], incoming: string[]) => {
  const out: string[] = [];
  const seen = new Set<string>();
  const pushAll = (arr: string[]) => arr.forEach(k => {
    const kk = String(k || '').trim();
    if (kk && !seen.has(kk)) { seen.add(kk); out.push(kk); }
  });
  pushAll(incoming);
  pushAll(current);
  return out;
};

const applyImport = () => {
  if (!importPreview.length) {
    setOpenImportDialog(false);
    setImportWarnings([]);
    return;
  }

  setProyecto(prev => {
    if (!prev) return prev;

    let nextUnidades: Unidad[] = prev.unidades;
    if (importMode === 'replace') {
      nextUnidades = [...importPreview];
    } else if (importMode === 'append') {
      nextUnidades = [...prev.unidades, ...importPreview];
    } else if (importMode === 'merge') {
      const byNum = new Map(prev.unidades.map(u => [String(u.numerounidad).trim(), u]));
      const merged: Unidad[] = [...prev.unidades];
      for (const nu of importPreview) {
        const key = String(nu.numerounidad).trim();
        if (byNum.has(key)) {
          const current = byNum.get(key)!;
          const updated: Unidad = {
            ...current,
            unidadprivativa: nu.unidadprivativa ?? current.unidadprivativa,
            preciolista: nu.preciolista ?? current.preciolista,
            estatus: nu.estatus ?? current.estatus,
            extras: { ...current.extras, ...nu.extras },
          };
          const idx = merged.findIndex(x => x.id === current.id);
          if (idx >= 0) merged[idx] = updated;
        } else {
          merged.push(nu);
        }
      }
      nextUnidades = merged;
    }

    // Actualiza extrasOrder
    const currentOrder = prev.extrasOrder ?? [];
    const incomingOrder = importExtrasOrder ?? [];

    let nextExtrasOrder: string[];
    if (importMode === 'replace') {
      nextExtrasOrder = incomingOrder.length ? incomingOrder : currentOrder;
    } else {
      nextExtrasOrder = mergeExtrasOrder(currentOrder, incomingOrder);
    }

    return { ...prev, unidades: nextUnidades, extrasOrder: nextExtrasOrder };
  });

  setOpenImportDialog(false);
  setImportPreview([]);
  setImportWarnings([]);
  setImportExtrasOrder(null);
};

  // ---- Aumentar precios ----
  const handleAumentarPrecios = () => {
    setProyecto(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        unidades: prev.unidades.map(u => {
          if (u.estatus === 'disponible' || u.estatus === 'apartado') {
            return {
              ...u,
              preciolista: (
                (parseFloat(String(u.preciolista)) || 0) *
                (1 + porcentajeAumento / 100)
              ).toFixed(2),
            };
          }
          return u;
        }),
      };
    });
    setOpenPrecioDialog(false);
    setPorcentajeAumento(0);
  };

  // ---- Stats (resumen) ----
  const stats = React.useMemo(() => {
    const list = proyecto.unidades || [];
    const cleanNumber = (x: any) => {
      const n = parseFloat(String(x).toString().replace(/[, ]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const total = list.length;
    const disponibles = list.filter(u => u.estatus === 'disponible').length;
    const apartados = list.filter(u => u.estatus === 'apartado').length;
    const vendidos = list.filter(u => u.estatus === 'vendido').length;

    const precios = list.map(u => cleanNumber(u.preciolista)).filter(n => n > 0);
    const suma = precios.reduce((a, b) => a + b, 0);
    const promedio = precios.length ? suma / precios.length : 0;
    const min = precios.length ? Math.min(...precios) : 0;
    const max = precios.length ? Math.max(...precios) : 0;

    const conRender = list.filter(u => !!u.render).length;
    const conIsometrico = list.filter(u => !!u.isometrico).length;
    const conPlano = list.filter(u => !!u.plano).length;
    const totalImagenes = list.reduce((acc, u) => acc + (u.imagenes?.length || 0), 0);

    return {
      total,
      disponibles,
      apartados,
      vendidos,
      promedio,
      min,
      max,
      conRender,
      conIsometrico,
      conPlano,
      totalImagenes,
    };
  }, [proyecto.unidades]);

  // ---- Render helpers ----
  const renderPreview = (doc?: Document, alt = '') => {
    if (!doc) return null;
    if (doc.file && doc.url) {
      return (
        <img
          src={doc.url}
          alt={alt}
          style={{ width: 90, height: 90, borderRadius: 8, objectFit: 'cover' }}
        />
      );
    }
    if (doc.path && doc.bucket) {
      return (
        <SignedImage
          path={doc.path}
          bucket={doc.bucket}
          alt={alt}
          sx={{ width: 90, height: 90, borderRadius: 1, objectFit: 'cover' }}
        />
      );
    }
    return null;
  };

  // ---- UI ----
  return (
    <>
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)' }}>
            Resumen de unidades
          </Typography>

          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip label={`Total: ${stats.total}`} color="default" variant="outlined" />
            <Chip label={`Disponibles: ${stats.disponibles}`} color="success" variant="outlined" />
            <Chip label={`Apartados: ${stats.apartados}`} color="warning" variant="outlined" />
            <Chip label={`Vendidos: ${stats.vendidos}`} color="error" variant="outlined" />
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          }}
        >
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Precio promedio</Typography>
            <Typography fontWeight={700}>{formatoMoneda(stats.promedio)}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Rango de precios</Typography>
            <Typography fontWeight={700}>
              {formatoMoneda(stats.min)} – {formatoMoneda(stats.max)}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Cobertura de archivos</Typography>
            <Typography fontWeight={700}>
              Render {stats.conRender}/{stats.total} · Iso {stats.conIsometrico}/{stats.total} · Plano {stats.conPlano}/{stats.total}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Imágenes en galería</Typography>
            <Typography fontWeight={700}>{stats.totalImagenes}</Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Header acciones */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)' }}>
              Alta y edición de unidades
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Completa los datos y, si el auto-guardado está activo, tus cambios se aplican a la tabla automáticamente.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Button variant="outlined" onClick={downloadUnidadesTemplate}>
              Plantilla Excel
            </Button>

            <label htmlFor="carga-unidades-excel">
              <input
                id="carga-unidades-excel"
                type="file"
                accept=".xlsx,.xls,.csv"    // <— ahora acepta CSV
                style={{ display: 'none' }}
                onChange={e => handleExcelSelected(e.target.files?.[0] || undefined)}
              />
              <Button variant="contained" component="span">
                Importar Excel/CSV…
              </Button>
            </label>

            <Tooltip title="Subir precios de lista (%)">
              <Button variant="outlined" onClick={() => setOpenPrecioDialog(true)}>
                Aumentar precios
              </Button>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <FormControlLabel
              control={<Switch checked={autoSave} onChange={(_, v) => setAutoSave(v)} />}
              label="Guardar automáticamente"
            />
            {savedFlash && <Chip label="Guardado" color="success" variant="outlined" size="small" />}
          </Stack>
        </Stack>
      </Paper>

      {/* Formulario de la unidad */}
      {unidad && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Unidad en edición
            </Typography>
            {!autoSave && (
              <Stack direction="row" gap={1}>
                <Button onClick={handleAddUnidad} startIcon={<AddCircleIcon />} variant="contained">
                  {proyecto.unidades.some(u => u.id === unidad.id) ? 'Actualizar' : 'Agregar'}
                </Button>
              </Stack>
            )}
          </Stack>

          <Alert severity="info" sx={{ mb: 2 }}>
            Con <b>Guardar automáticamente</b>, al escribir se actualiza la tabla. Desactívalo si prefieres confirmar con el botón.
          </Alert>

          {/* Datos principales */}
          <Box
            sx={{
              mb: 1,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                md: '2fr 3fr 2fr 2fr',
              },
            }}
          >
            <TextField
              label="Número de Unidad"
              value={unidad.numerounidad}
              onChange={e => handleChangeUnidad('numerounidad', e.target.value as any)}
            />
            <TextField
              label="Unidad Privativa"
              value={unidad.unidadprivativa}
              onChange={e => handleChangeUnidad('unidadprivativa', e.target.value as any)}
            />
            <TextField
              label="Precio Lista"
              value={unidad.preciolista}
              onChange={e => handleChangeUnidad('preciolista', e.target.value as any)}
            />
            <FormControl>
              <InputLabel>Estatus</InputLabel>
              <Select
                label="Estatus"
                value={unidad.estatus ?? 'disponible'}
                onChange={e =>
                  handleChangeUnidad('estatus', e.target.value as 'disponible' | 'vendido' | 'apartado')
                }
              >
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="vendido">Vendido</MenuItem>
                <MenuItem value="apartado">Apartado</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Extras */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Extras
              </Typography>
              <Tooltip title="Agregar extra">
                <IconButton color="primary" onClick={handleAddExtraKey} size="small">
                  <AddCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {extrasKeys.length === 0 && (
              <Typography variant="body2" sx={{ opacity: 0.6, mb: 2 }}>
                No hay extras. Agrega variables personalizadas (p. ej., “Cajón de estacionamiento”, “Vista”, etc.).
              </Typography>
            )}

            {extrasKeys.map((key, idx) => (
              <Stack key={`${key}-${idx}`} direction={{ xs: 'column', md: 'row' }} gap={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  label="Variable"
                  value={key}
                  onChange={e => handleChangeExtraKey(idx, e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Valor"
                  value={unidad?.extras[key] || ''}
                  onChange={e => handleChangeExtraValue(key, e.target.value)}
                />
                <Stack direction="row" alignItems="center" sx={{ minWidth: 112 }}>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton
                        size="small"
                        disabled={idx === 0}
                        onClick={() => handleReorderExtraKeys(idx, idx - 1)}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Bajar">
                    <span>
                      <IconButton
                        size="small"
                        disabled={idx === extrasKeys.length - 1}
                        onClick={() => handleReorderExtraKeys(idx, idx + 1)}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleRemoveExtraKey(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            ))}
          </Box>

          {/* Archivos */}
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              alignItems: 'stretch',
            }}
          >
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardHeader title="Render de la unidad" titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }} />
              <CardContent sx={{ display: 'grid', placeItems: 'center' }}>
                <FileUploadPreview
                  value={unidad.render}
                  onChange={files => handleFileChange(unidad.id, 'render', files)}
                  onDelete={doc => handleFileRemove(unidad.id, 'render', doc.id)}
                  multiple={false}
                  accept="image/*"
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                />
                <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                  Recomendado: {PREVIEW_W}×{PREVIEW_H}px
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardHeader title="Isométrico" titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }} />
              <CardContent sx={{ display: 'grid', placeItems: 'center' }}>
                <FileUploadPreview
                  value={unidad.isometrico}
                  onChange={files => handleFileChange(unidad.id, 'isometrico', files)}
                  onDelete={doc => handleFileRemove(unidad.id, 'isometrico', doc.id)}
                  multiple={false}
                  accept="image/*"
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                />
                <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                  Recomendado: {PREVIEW_W}×{PREVIEW_H}px
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardHeader title="Plano" titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }} />
              <CardContent sx={{ display: 'grid', placeItems: 'center' }}>
                <FileUploadPreview
                  value={unidad.plano}
                  onChange={files => handleFileChange(unidad.id, 'plano', files)}
                  onDelete={doc => handleFileRemove(unidad.id, 'plano', doc.id)}
                  multiple={false}
                  accept="image/*"
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                />
                <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                  Recomendado: {PREVIEW_W}×{PREVIEW_H}px
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Galería */}
          <Box sx={{ mt: 2 }}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2" fontWeight={700}>
                      Galería de imágenes
                    </Typography>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={`${unidad.imagenes?.length || 0} imagen${(unidad.imagenes?.length || 0) === 1 ? '' : 'es'}`}
                    />
                  </Stack>
                }
              />
              <CardContent>
                <FileUploadCarouselPreview
                  value={unidad.imagenes ?? []}
                  onChange={files => handleFileChange(unidad.id, 'imagenes', files)}
                  onDelete={doc => handleFileRemove(unidad.id, 'imagenes', doc.id)}
                  multiple
                  accept="image/*"
                  width={GALLERY_W}
                  height={GALLERY_H}
                />
              </CardContent>
            </Card>
          </Box>

          {!autoSave && (
            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <Button onClick={handleAddUnidad} startIcon={<AddCircleIcon />} variant="contained">
                {proyecto.unidades.some(u => u.id === unidad.id) ? 'Actualizar' : 'Agregar'}
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      {/* Tabla de unidades */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)' }}>
        Unidades
      </Typography>
      <Typography variant="body2" sx={{ mb: 1, opacity: 0.7 }}>
        {autoSave
          ? 'Los cambios se aplican en tiempo real a estas filas.'
          : 'Recuerda presionar “Agregar/Actualizar” para reflejar cambios en la tabla.'}
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 1, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Unidad Privativa</TableCell>
              <TableCell>Precio Lista</TableCell>
              <TableCell>Estatus</TableCell>
              {extrasKeys.map(key => (
                <TableCell key={key}>{key}</TableCell>
              ))}
              <TableCell>Render</TableCell>
              <TableCell>Isométrico</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Galería</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proyecto.unidades.map((uni, idx) => (
              <TableRow key={uni.id || idx} hover>
                <TableCell>{uni.numerounidad}</TableCell>
                <TableCell>{uni.unidadprivativa}</TableCell>
                <TableCell>{formatoMoneda(uni.preciolista)}</TableCell>
                <TableCell>
                  <Chip
                    label={uni.estatus.charAt(0).toUpperCase() + uni.estatus.slice(1)}
                    variant="outlined"
                    color={
                      uni.estatus === 'disponible'
                        ? 'success'
                        : uni.estatus === 'apartado'
                        ? 'warning'
                        : uni.estatus === 'vendido'
                        ? 'error'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>

                {extrasKeys.map((key, i) => (
                  <TableCell key={`${idx}_${i}`}>{uni.extras[key] || ''}</TableCell>
                ))}

                <TableCell>{renderPreview(uni.render, 'Render')}</TableCell>
                <TableCell>{renderPreview(uni.isometrico, 'Isométrico')}</TableCell>
                <TableCell>{renderPreview(uni.plano, 'Plano')}</TableCell>
                <TableCell>
                  <SignedImageCarousel items={uni.imagenes ?? []} width={80} height={80} />
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleEditUnidad(idx)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton onClick={() => handleDeleteUnidad(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {proyecto.unidades.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box py={3} textAlign="center" sx={{ opacity: 0.7 }}>
                    Aún no hay unidades cargadas.
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo: Aumentar precios */}
      <Dialog open={openPrecioDialog} onClose={() => setOpenPrecioDialog(false)}>
        <Box sx={{ p: 3, minWidth: 320 }}>
          <Typography fontWeight={700} fontSize={18} mb={2}>
            Aumentar precios de lista
          </Typography>
          <TextField
            fullWidth
            label="Porcentaje de aumento (%)"
            type="number"
            value={porcentajeAumento}
            onChange={e => setPorcentajeAumento(Number(e.target.value))}
            InputProps={{ inputProps: { min: 0 } }}
            sx={{ mb: 3 }}
          />
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={() => setOpenPrecioDialog(false)}>Cancelar</Button>
            <Button onClick={handleAumentarPrecios} variant="contained" color="primary" disabled={porcentajeAumento === 0}>
              Aplicar
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Diálogo: Importar Excel/CSV */}
      <Dialog open={openImportDialog} onClose={() => { setOpenImportDialog(false); setImportWarnings([]); }} maxWidth="sm" fullWidth>
        <DialogTitle>Importar unidades desde Excel/CSV</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Se detectaron <b>{importPreview.length}</b> filas en el archivo.
          </Typography>

          {importWarnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography fontWeight={700} gutterBottom>
                Se encontraron {importWarnings.length} advertencia(s):
              </Typography>
              <Box sx={{ maxHeight: 160, overflow: 'auto', pl: 1 }}>
                {importWarnings.slice(0, 20).map((w, i) => (
                  <Typography key={i} variant="caption" display="block">
                    • {w}
                  </Typography>
                ))}
                {importWarnings.length > 20 && (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    ...y {importWarnings.length - 20} más.
                  </Typography>
                )}
              </Box>
            </Alert>
          )}

          <FormControl sx={{ mt: 2 }}>
            <RadioGroup value={importMode} onChange={(_, v) => setImportMode(v as ImportMode)}>
              <FormControlLabel value="append" control={<Radio />} label="Agregar al final (no modifica las existentes)" />
              <FormControlLabel value="replace" control={<Radio />} label="Reemplazar todo (borra la lista actual y carga la del archivo)" />
              <FormControlLabel value="merge" control={<Radio />} label="Actualizar por Número de Unidad (si coincide, actualiza; si no, agrega)" />
            </RadioGroup>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            Para “Actualizar por Número de Unidad”, el archivo debe traer la columna <b>numerounidad</b>.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenImportDialog(false); setImportWarnings([]); }}>Cancelar</Button>
          <Button variant="contained" onClick={applyImport}>
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProyectoUnidadesTab;
