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
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadPreview from '../general/FileUploadPreviewFiles';
import FileUploadCarouselPreview from '../general/FileUploadCarouselPreview';
import SignedImageCarousel from '../general/SinedImageCarousel';
import { Proyecto, Unidad ,Document} from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';
import * as XLSX from 'xlsx';
import SignedImage from '../general/SignedImage';

interface ProyectoUnidadesTabProps {
  proyecto: Proyecto;
  unidad: Unidad | null; // Cambiado para aceptar null
  extrasKeys: string[];
  handleChangeUnidad: <K extends keyof Unidad>(field: K, value: Unidad[K]) => void;
  handleAddExtraKey: () => void;
  handleChangeExtraKey: (index: number, newKey: string) => void;
  handleChangeExtraValue: (key: string, value: string) => void;
  handleRemoveExtraKey: (index: number) => void;
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
  userid:string
  setProyecto: React.Dispatch<React.SetStateAction<Proyecto | null>>;

}

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
  setProyecto,
  userid
}) => {

  
const [openPrecioDialog, setOpenPrecioDialog] = React.useState(false);
const [porcentajeAumento, setPorcentajeAumento] = React.useState(0);
const handleAumentarPrecios = () => {
  setProyecto(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      unidades: prev.unidades.map(u => {
        if (u.estatus === "disponible" || u.estatus === "apartado") {
          return {
            ...u,
            preciolista: (
              (parseFloat(String(u.preciolista)) || 0) *
              (1 + porcentajeAumento / 100)
            ).toFixed(2)
          };
        }
        // Si es cualquier otro estatus, NO cambia el precio
        return u;
      }),
    };
  });
  setOpenPrecioDialog(false);
  setPorcentajeAumento(0);
};


    const downloadUnidadesTemplate = () => {
    const wsData = [
        [
        'numerounidad',
        'unidadprivativa',
        'preciolista',
        'estatus'
        // El usuario puede agregar columnas extra aquí manualmente.
        ],
        ['Ej: 101', 'Ej: Torre A', '1000000','disponible'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unidades');
    XLSX.writeFile(wb, 'plantilla_unidades.xlsx');
    };

    function unidadesFromExcel(file: File, userId: string, proyectoId: string): Promise<Unidad[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
            try {
                const data = new Uint8Array((e.target?.result as ArrayBuffer));
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                const COLUMNAS_BASE = ['numerounidad', 'unidadprivativa', 'preciolista', 'estatus'];
                const unidades: Unidad[] = (json as any[]).map((row, _) => {
                const base: any = {};
                const extras: any = {};

                for (const key in row) {
                    if (COLUMNAS_BASE.includes(key)) {
                    base[key] = row[key];
                    } else {
                    extras[key] = row[key];
                    }
                }

                return {
                    id: crypto.randomUUID(),
                    userid: userId,
                    proyectoid: proyectoId,
                    numerounidad: base.numerounidad || '',
                    unidadprivativa: base.unidadprivativa || '',
                    preciolista: base.preciolista || '',
                    extras,
                    imagenes: [],
                    estatus: (base.estatus?.toLowerCase?.() || 'disponible'),

                };
                });
                resolve(unidades);
            } catch (err) {
                reject(err);
            }
            };
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(file);
        });
        }

        const renderPreview = (doc?: Document, alt = '') => {
          if (!doc) return null;
          if (doc.file && doc.url) {
            // Archivo local, mostrar preview temporal
            return (
              <img
                src={doc.url}
                alt={alt}
                style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }}
              />
            );
          }
          if (doc.path && doc.bucket) {
            // Ya subido a Supabase, mostrar con SignedImage
            return (
              <SignedImage
                path={doc.path}
                bucket={doc.bucket}
                alt={alt}
                sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
              />
            );
          }
          return null;
        };

  return (
    <>
      <Typography variant="body1" sx={{ mb: 2, color: 'var(--primary-color)' }}>
        Agregar Unidades
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <Button onClick={downloadUnidadesTemplate} variant="outlined">
            Descargar Plantilla Excel
        </Button>
        <label htmlFor="carga-unidades-excel">
            <Button variant="contained" component="span">
            Cargar Unidades por Excel
            </Button>
            <input
            type="file"
            accept=".xlsx,.xls"
            id="carga-unidades-excel"
            style={{ display: 'none' }}
            onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !proyecto) return;
                try {
                const nuevasUnidades = await unidadesFromExcel(file, userid, proyecto.id);
                setProyecto(prev => prev ? { ...prev, unidades: [...prev.unidades, ...nuevasUnidades] } : prev);
                } catch (err) {
                alert('Error leyendo archivo: ' + err);
                }
            }}
 // Lo de arriba
            />
        </label>
        </Box>
      {unidad && (
        <>
          <TextField
            fullWidth
            label="Número de Unidad"
            value={unidad.numerounidad}
            onChange={(e) => handleChangeUnidad('numerounidad', e.target.value as any)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Unidad Privativa"
            value={unidad.unidadprivativa}
            onChange={(e) => handleChangeUnidad('unidadprivativa', e.target.value as any)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Precio Lista"
            value={unidad.preciolista}
            onChange={(e) => handleChangeUnidad('preciolista', e.target.value as any)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Estatus</InputLabel>
            <Select
              label="Estatus"
              value={unidad.estatus ?? 'disponible'}
              onChange={e => handleChangeUnidad('estatus', e.target.value as 'disponible' | 'vendido' | 'apartado')}
            >
              <MenuItem value="disponible">Disponible</MenuItem>
              <MenuItem value="vendido">Vendido</MenuItem>
              <MenuItem value="apartado">Apartado</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" alignItems="center" mt={1}>
            <Tooltip title="Agregar Extra">
              <IconButton color="primary" onClick={handleAddExtraKey}>
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="button" sx={{ ml: 1 }}>
              Agregar Extra
            </Typography>
          </Box>

          {extrasKeys.map((key, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                fullWidth
                label="Variable"
                value={key}
                onChange={(e) => handleChangeExtraKey(idx, e.target.value)}
                />
                <TextField
                fullWidth
                label="Valor"
                value={unidad?.extras[key] || ''}
                onChange={(e) => handleChangeExtraValue(key, e.target.value)}
                />
                <IconButton onClick={() => handleRemoveExtraKey(idx)}>
                <DeleteIcon />
                </IconButton>
            </Box>
            ))}

          <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
            Render de la unidad:
          </Typography>
          <FileUploadPreview
            value={unidad.render}
            onChange={(files) => handleFileChange(unidad.id, 'render', files)}
            onDelete={(doc) => handleFileRemove(unidad.id, 'render', doc.id)}
            multiple={false}
            accept="image/*"
            width={120}
            height={120}
          />

          <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
            Isométrico de la unidad:
          </Typography>
          <FileUploadPreview
            value={unidad.isometrico}
            onChange={(files) => handleFileChange(unidad.id, 'isometrico', files)}
            onDelete={(doc) => handleFileRemove(unidad.id, 'isometrico', doc.id)}
            multiple={false}
            accept="image/*"
            width={120}
            height={120}
          />

          <Typography variant="body1" sx={{ mb: 2 }}>
            Plano de la unidad:
          </Typography>
          <FileUploadPreview
            value={unidad.plano}
            onChange={(files) => handleFileChange(unidad.id, 'plano', files)}
            onDelete={(doc) => handleFileRemove(unidad.id, 'plano', doc.id)}
            multiple={false}
            accept="image/*"
            width={120}
            height={120}
          />

          <Typography variant="body1" sx={{ mb: 2 }}>
            Subir imágenes de la unidad:
          </Typography>
          <FileUploadCarouselPreview
            value={unidad.imagenes ?? []}
            onChange={(files) => handleFileChange(unidad.id, 'imagenes', files)}
            onDelete={(doc) => handleFileRemove(unidad.id, 'imagenes', doc.id)}
            multiple
            accept="image/*"
            width={100}
            height={100}
          />

          <Box display="flex" alignItems="center" mt={2}>
            <Tooltip title="Agregar Unidad">
              <IconButton color="primary" onClick={handleAddUnidad}>
                <AddCircleIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="button" sx={{ ml: 1 }}>
              Agregar Unidad
            </Typography>
          </Box>
        </>
      )}

      <Typography variant="h6" sx={{ mt: 4 }}>
        Unidades Agregadas
      </Typography>
      <Tooltip title="Subir precios de lista (%)">
      <IconButton
        color="primary"
        onClick={() => setOpenPrecioDialog(true)}
        sx={{ ml: 1 }}
      >
        {/* Usa el icono que quieras, aquí una flecha hacia arriba */}
        <span role="img" aria-label="Up">⬆️</span>
      </IconButton>
    </Tooltip>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número Unidad</TableCell>
              <TableCell>Unidad Privativa</TableCell>
              <TableCell>Precio Lista</TableCell>
              <TableCell>Estatus</TableCell>
              {extrasKeys.map((key) => (
                <TableCell key={key}>{key}</TableCell>
              ))}
              <TableCell>Render</TableCell>
              <TableCell>Isométrico</TableCell>
              <TableCell>Plano</TableCell>
              <TableCell>Imágenes</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proyecto.unidades.map((uni, idx) => (
                <TableRow key={uni.id || idx}>
                    <TableCell>{uni.numerounidad}</TableCell>
                    <TableCell>{uni.unidadprivativa}</TableCell>
                    <TableCell>{formatoMoneda(uni.preciolista)}</TableCell>
                    <TableCell>
                      <Chip
                        label={uni.estatus.charAt(0).toUpperCase() + uni.estatus.slice(1)}
                        variant="outlined"
                        color={
                          uni.estatus === 'disponible'   ? 'success' :
                          uni.estatus === 'apartado'     ? 'warning' :
                          uni.estatus === 'vendido'      ? 'error' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    {extrasKeys.map((key, i) => (
                    <TableCell key={`${idx}_${i}`}>{uni.extras[key] || ''}</TableCell>
                    ))}
                    <TableCell>
                      {renderPreview(uni.render, "Render")}
                    </TableCell>
                    <TableCell>
                      {renderPreview(uni.isometrico, "Isométrico")}
                    </TableCell>
                    <TableCell>
                      {renderPreview(uni.plano, "Plano")}
                    </TableCell>
                    {/* Imágenes generales */}
                    <TableCell>
                    <SignedImageCarousel items={uni.imagenes ?? []} width={80} height={80} />
                    </TableCell>
                    <TableCell>
                    <IconButton onClick={() => handleEditUnidad(idx)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUnidad(idx)}>
                        <DeleteIcon />
                    </IconButton>
                    </TableCell>
                </TableRow>
                ))}

          </TableBody>
        </Table>
      </TableContainer>
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
            <Button
              onClick={handleAumentarPrecios}
              variant="contained"
              color="primary"
              disabled={porcentajeAumento === 0}
            >
              Aplicar
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default ProyectoUnidadesTab;
