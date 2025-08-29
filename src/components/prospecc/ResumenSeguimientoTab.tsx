import React from 'react';
import {
  Box, Typography, Paper, Stack, Button, Dialog, DialogActions, DialogContent, DialogTitle, useTheme
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Temporal } from '@js-temporal/polyfill';
import type { Seguimiento, Prospecto } from '../../config/types';
import Calendar from '../general/calendar/Calendar';
import { useFetchSeguimientos, useFetchProspectos } from '../../hooks/useFetchFunctions';

// Estatus y colores
const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido',
  // Si usas 'descartado' en otras vistas, podrías añadirlo aquí también.
];
const STATUS_COLORS = ['#3b82f6','#14b8a6','#6366f1','#f59e42','#06d6a0','#eab308','#ef4444'];

interface Props {
  userid?: string;                 // id del usuario logueado
  userRole?: string;               // 'admin' | 'gerencia' | 'operacion' | 'usuario'
}

/** Retorna true si el seguimiento pertenece al usuario (prueba campos comunes). */
const perteneceAlUsuario = (s: Seguimiento, userid?: string) => {
  if (!userid) return false;
  // Ajusta estos campos a tus nombres reales en DB:
  // ejemplos posibles: s.userid (quien creó), s.vendedorid, s.asignadoA
  return (
    s.userid === userid ||
    (s as any).vendedorid === userid ||
    (s as any).asignadoA === userid
  );
};

/** Idem para prospectos si los muestras por nombre en el modal. */
const prospectoPerteneceAlUsuario = (p: Prospecto, userid?: string) => {
  if (!userid) return false;
  return (
    (p as any).userid === userid ||
    (p as any).vendedorid === userid ||
    (p as any).asignadoA === userid
  );
};

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

  const isUsuario = (userRole ?? '').toLowerCase() === 'usuario';
  // Si quieres que 'operacion' también vea solo lo suyo, agrega aquí:
  // const isUsuario = ['usuario','operacion'].includes((userRole ?? '').toLowerCase());

  // Filtrado local por permisos
  const segFiltrados = isUsuario
    ? seguimientos.filter(s => perteneceAlUsuario(s, userid))
    : seguimientos;

  const prospectosFiltrados = isUsuario
    ? prospectos.filter(p => prospectoPerteneceAlUsuario(p, userid))
    : prospectos;

  // Pie: datos por estatus (con filtrados)
  const pieData = ESTATUS_LIST.map((estatus, i) => ({
    name: estatus.charAt(0).toUpperCase() + estatus.slice(1),
    value: segFiltrados.filter(s => s.estatusSeguimiento === estatus).length,
    color: STATUS_COLORS[i]
  }));

  const porDia = getSeguimientosPorDia(segFiltrados);

  // Eventos calendario (evita 'vendido' si así lo deseas)
  const calendarEvents = segFiltrados
    .filter(s => s.fechaProximoSeguimiento && s.estatusSeguimiento !== 'vendido')
    .map(s => ({
      id: s.id,
      fecha: s.fechaProximoSeguimiento!,
      label: s.estatusSeguimiento
    }));

  const esMismoDia = (f1?: string, f2?: string) => {
    if (!f1 || !f2) return false;
    return Temporal.PlainDate.from(f1).equals(Temporal.PlainDate.from(f2));
  };

  return (
    <Box sx={{ background: "#f5f7fa", minHeight: "100vh", py: { xs: 1, md: 3 }, px: { xs: 0.5, md: 5 } }}>
      <Typography variant="h5" fontWeight={800} color="primary" mb={2} letterSpacing={0.5}>
        Resumen de Seguimientos
      </Typography>

      <Stack spacing={3}>
        {/* Pie Chart */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: "#f9fafb" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos por Estatus
          </Typography>
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
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.68;
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
                wrapperStyle={{ right: 15, fontWeight: 700, fontSize: 14, lineHeight: '28px' }}
                formatter={(value, _, i) => (
                  <span style={{ color: pieData[i].color, fontWeight: 700 }}>{value}</span>
                )}
              />
              <ReTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        {/* Bar Chart */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: "#f9fafb" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Seguimientos próximos 7 días (por Estatus)
          </Typography>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={porDia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="fecha"
                tickFormatter={v => {
                  const d = Temporal.PlainDate.from(v);
                  return `${d.day}/${d.month}`;
                }}
                tick={{ fontWeight: 600, fontSize: 13 }}
              />
              <YAxis allowDecimals={false} tick={{ fontWeight: 600, fontSize: 13 }} />
              <ReTooltip />
              <Legend verticalAlign="top" height={32} iconType="circle" />
              {ESTATUS_LIST.map((estatus, idx) => (
                <Bar
                  key={estatus}
                  dataKey={estatus}
                  name={estatus.charAt(0).toUpperCase() + estatus.slice(1)}
                  stackId="a"
                  fill={STATUS_COLORS[idx]}
                  radius={idx === ESTATUS_LIST.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={35}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Calendario */}
        <Paper elevation={2} sx={{ p: { xs: 1.5, md: 3 }, background: "#f9fafb" }}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            Calendario de Seguimientos
          </Typography>
          <Box sx={{ mx: "auto", maxWidth: 410, borderRadius: 2, border: '1px solid #e0e0e0', background: "#fff" }}>
            <Calendar
              events={calendarEvents}
              renderDayModal={(date, close) => {
                const fechaStr = date.toString();
                const seguimientosDia = segFiltrados.filter(s => esMismoDia(s.fechaProximoSeguimiento, fechaStr));
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
                          {seguimientosDia.map(s => (
                            <Box key={s.id} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                              <Typography fontWeight={700} fontSize={17}>
                                {prospectosFiltrados.find(p => p.id === s.idprospecto)?.nombreCompleto ?? 'Sin nombre'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Unidad/Proyecto: <span style={{ color: theme.palette.primary.main }}>{s.unidadInteres || s.proyectoInteres}</span>
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                Estatus:{' '}
                                <span style={{ color: STATUS_COLORS[ESTATUS_LIST.indexOf(s.estatusSeguimiento as any)] }}>
                                  {s.estatusSeguimiento.charAt(0).toUpperCase() + s.estatusSeguimiento.slice(1)}
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                Comentario: <span style={{ color: "#222" }}>{s.comentarios}</span>
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={close} variant="contained" sx={{ fontWeight: 700 }}>
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
