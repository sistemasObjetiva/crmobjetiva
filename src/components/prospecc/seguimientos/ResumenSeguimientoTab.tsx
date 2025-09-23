import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Temporal } from '@js-temporal/polyfill';
import type { Seguimiento, Prospecto } from '../../../config/types';
import Calendar from '../../general/calendar/Calendar';
import {
  useFetchSeguimientos,
  useFetchProspectos,
} from '../../../hooks/useFetchFunctions';

// Estatus y colores
const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido',
];
const STATUS_COLORS = [
  '#3b82f6',
  '#14b8a6',
  '#6366f1',
  '#f59e42',
  '#06d6a0',
  '#eab308',
  '#ef4444',
];

interface Props {
  userid?: string; // id del usuario logueado
  userRole?: string; // 'admin' | 'gerencia' | 'operacion' | 'usuario'
}

// === Helpers de filtrado ===
const ownerFields = ['userid', 'vendedorid', 'asignadoA'] as const;

function belongsToUser(obj: Record<string, any>, userid?: string) {
  if (!userid) return false;
  for (const f of ownerFields) {
    const v = obj?.[f];
    if (typeof v === 'string' && v === userid) return true;
    if (typeof v === 'number' && String(v) === String(userid)) return true;
  }
  return false;
}

const perteneceAlUsuario = (s: Seguimiento, userid?: string) =>
  belongsToUser(s as any, userid);

const prospectoPerteneceAlUsuario = (p: Prospecto, userid?: string) =>
  belongsToUser(p as any, userid);

// === Helpers visuales ===
const toNice = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const safeColorFor = (estatus: string) => {
  const idx = ESTATUS_LIST.indexOf(estatus as any);
  return idx >= 0 ? STATUS_COLORS[idx] : '#94a3b8'; // gris fallback
};

const sameDay = (iso1?: string, iso2?: string) => {
  if (!iso1 || !iso2) return false;
  const d1 = Temporal.PlainDate.from(iso1.slice(0, 10));
  const d2 = Temporal.PlainDate.from(iso2.slice(0, 10));
  return d1.equals(d2);
};

// === Datos de charts ===
function getSeguimientosPorDia(seguimientos: Seguimiento[]) {
  const hoy = Temporal.Now.plainDateISO();
  return Array.from({ length: 7 }).map((_, i) => {
    const fecha = hoy.add({ days: i }).toString();
    const obj: any = { fecha };
    ESTATUS_LIST.forEach((estatus) => {
      obj[estatus] = seguimientos.filter(
        (s) =>
          (s.fechaProximoSeguimiento?.slice(0, 10) === fecha) &&
          s.estatusSeguimiento === estatus
      ).length;
    });
    return obj;
  });
}

const ResumenSeguimientosTab: React.FC<Props> = ({ userid, userRole }) => {
  const theme = useTheme();
  const { seguimientos } = useFetchSeguimientos();
  const { prospectos } = useFetchProspectos();

  const role = (userRole ?? '').toLowerCase();
  console.log(role)
  const isUsuario = role === 'usuario'; // o agrega 'operacion'

  // Filtrado local
  const segFiltrados = React.useMemo(
    () =>
      isUsuario
        ? seguimientos.filter((s) => perteneceAlUsuario(s, userid))
        : seguimientos,
    [isUsuario, seguimientos, userid]
  );

  const prospectosFiltrados = React.useMemo(
    () =>
      isUsuario
        ? prospectos.filter((p) => prospectoPerteneceAlUsuario(p, userid))
        : prospectos,
    [isUsuario, prospectos, userid]
  );

  const prospectoById = React.useMemo(() => {
    const map = new Map<string | number, Prospecto>();
    for (const p of prospectosFiltrados) {
      map.set((p as any).id, p);
    }
    return map;
  }, [prospectosFiltrados]);

  // Pie: datos por estatus
  const pieData = ESTATUS_LIST.map((estatus) => ({
    name: toNice(estatus),
    value: segFiltrados.filter((s) => s.estatusSeguimiento === estatus).length,
    color: safeColorFor(estatus),
  }));

  const porDia = getSeguimientosPorDia(segFiltrados);

  const calendarEvents = segFiltrados
    .filter(
      (s) => s.fechaProximoSeguimiento && s.estatusSeguimiento !== 'vendido'
    )
    .map((s) => ({
      id: s.id,
      fecha: s.fechaProximoSeguimiento!,
      label: s.estatusSeguimiento,
    }));

  return (
    <Box
      sx={{
        background: '#f5f7fa',
        minHeight: '100vh',
        py: { xs: 1, md: 3 },
        px: { xs: 0.5, md: 5 },
      }}
    >
      <Typography
        variant="h5"
        fontWeight={800}
        color="primary"
        mb={2}
        letterSpacing={0.5}
      >
        Resumen de Seguimientos
      </Typography>

      <Stack spacing={3}>
        {/* Pie Chart */}
        <Paper
          elevation={2}
          sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos por Estatus
          </Typography>
          {segFiltrados.length === 0 ? (
            <Typography color="text.secondary">
              No tienes seguimientos asignados.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={100}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
                    if (percent < 0.07) return '';
                    const RADIAN = Math.PI / 180;
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.68;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={theme.palette.grey[900]}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight={700}
                        style={{ pointerEvents: 'none' }}
                      >
                        {`${name} (${Math.round(percent * 100)}%)`}
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{
                    right: 15,
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '28px',
                  }}
                  formatter={(value, _, i) => (
                    <span style={{ color: pieData[i].color, fontWeight: 700 }}>
                      {value}
                    </span>
                  )}
                />
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Bar Chart */}
        <Paper
          elevation={2}
          sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos próximos 7 días (por Estatus)
          </Typography>
          {segFiltrados.length === 0 ? (
            <Typography color="text.secondary">
              No tienes seguimientos próximos.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart
                data={porDia}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="fecha"
                  tickFormatter={(v) => {
                    const d = Temporal.PlainDate.from(v);
                    return `${d.day}/${d.month}`;
                  }}
                  tick={{ fontWeight: 600, fontSize: 13 }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontWeight: 600, fontSize: 13 }}
                />
                <ReTooltip />
                <Legend verticalAlign="top" height={32} iconType="circle" />
                {ESTATUS_LIST.map((estatus) => (
                  <Bar
                    key={estatus}
                    dataKey={estatus}
                    name={toNice(estatus)}
                    stackId="a"
                    fill={safeColorFor(estatus)}
                    maxBarSize={35}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Calendario */}
        <Paper
          elevation={2}
          sx={{ p: { xs: 1.5, md: 3 }, background: '#f9fafb' }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Calendario de Seguimientos
          </Typography>
          <Box
            sx={{
              mx: 'auto',
              maxWidth: 410,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              background: '#fff',
            }}
          >
            <Calendar
              events={calendarEvents}
              renderDayModal={(date, close) => {
                const fechaStr = date.toString();
                const seguimientosDia = segFiltrados.filter((s) =>
                  sameDay(s.fechaProximoSeguimiento, fechaStr)
                );
                return (
                  <Dialog open onClose={close} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800 }}>
                      Seguimientos para el {fechaStr}
                    </DialogTitle>
                    <DialogContent>
                      {seguimientosDia.length === 0 ? (
                        <Typography color="text.secondary" sx={{ mt: 2 }}>
                          No hay seguimientos para este día.
                        </Typography>
                      ) : (
                        <Stack spacing={2} mt={1}>
                          {seguimientosDia.map((s) => {
                            const p =
                              prospectoById.get(
                                (s as any).idprospecto ??
                                  (s as any).idProspecto
                              ) ?? null;
                            return (
                              <Box
                                key={s.id}
                                sx={{ borderBottom: '1px solid #eee', pb: 1 }}
                              >
                                <Typography fontWeight={700} fontSize={17}>
                                  {p?.nombreCompleto ?? 'Sin nombre'}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  Unidad/Proyecto:{' '}
                                  <span
                                    style={{
                                      color: theme.palette.primary.main,
                                    }}
                                  >
                                    {s.unidadInteres || s.proyectoInteres}
                                  </span>
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  Estatus:{' '}
                                  <span
                                    style={{
                                      color: safeColorFor(
                                        s.estatusSeguimiento
                                      ),
                                    }}
                                  >
                                    {toNice(s.estatusSeguimiento)}
                                  </span>
                                </Typography>
                                <Typography variant="body2">
                                  Comentario:{' '}
                                  <span style={{ color: '#222' }}>
                                    {s.comentarios}
                                  </span>
                                </Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button
                        onClick={close}
                        variant="contained"
                        sx={{ fontWeight: 700 }}
                      >
                        Cerrar
                      </Button>
                    </DialogActions>
                  </Dialog>
                );
              }}
            />
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
};

export default ResumenSeguimientosTab;
