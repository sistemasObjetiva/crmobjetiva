import React from 'react';
import {
  Box, Typography, Paper,  Stack, Button,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Temporal } from '@js-temporal/polyfill';
import type { Seguimiento } from '../../config/types';
import Calendar from '../general/calendar/Calendar';
import {
  useFetchSeguimientos,
  useFetchProspectos
} from '../../hooks/useFetchFunctions';

// Los nuevos estatus y colores
const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido'
];
const STATUS_COLORS = [
  '#3b82f6', // contactado - azul
  '#14b8a6', // interaccion - turquesa
  '#6366f1', // cotizacion - indigo
  '#f59e42', // visita - naranja
  '#06d6a0', // posible - verde
  '#eab308', // apartado - amarillo
  '#ef4444', // vendido - rojo
];

function getSeguimientosPorDia(seguimientos: Seguimiento[]) {
  const hoy = Temporal.Now.plainDateISO();
  return Array.from({ length: 7 }).map((_, i) => {
    const fecha = hoy.add({ days: i }).toString();
    const obj: any = { fecha };
    ESTATUS_LIST.forEach((estatus) => {
      obj[estatus] = seguimientos.filter(
        (s) =>
          s.fechaProximoSeguimiento?.slice(0, 10) === fecha &&
          s.estatusSeguimiento === estatus
      ).length;
    });
    return obj;
  });
}

interface Props {
  userid: string;
}

const ResumenSeguimientosTab: React.FC<Props> = ({ }) => {
  const { seguimientos } = useFetchSeguimientos();
  const { prospectos } = useFetchProspectos();

  // PieChart: cuenta por estatus
  const pieData = ESTATUS_LIST.map((estatus, i) => ({
    name: estatus.charAt(0).toUpperCase() + estatus.slice(1),
    value: seguimientos.filter(s => s.estatusSeguimiento === estatus).length,
    color: STATUS_COLORS[i]
  }));

  const porDia = getSeguimientosPorDia(seguimientos);

  // Para calendario (solo los que tengan fecha y no estén vendidos)
  const calendarEvents = seguimientos
    .filter(s => s.fechaProximoSeguimiento && s.estatusSeguimiento !== 'vendido')
    .map(s => ({
      id: s.id,
      fecha: s.fechaProximoSeguimiento,
      label: s.estatusSeguimiento
    }));

  // Función para comparar días
  const esMismoDia = (f1: string, f2: string) =>
    Temporal.PlainDate.from(f1).equals(Temporal.PlainDate.from(f2));

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
        Resumen de Seguimientos
      </Typography>

      {/* Gráfica pastel por estatus */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Seguimientos por Estatus
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={50}
              outerRadius={85}
              label={({ name, percent }) =>
                `${name} (${Math.round(percent * 100)}%)`
              }
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" />
            <ReTooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Gráfica barras: próximos seguimientos 7 días por estatus */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
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
            />
            <YAxis allowDecimals={false} />
            <ReTooltip />
            <Legend verticalAlign="top" height={36} />
            {ESTATUS_LIST.map((estatus, idx) => (
              <Bar
                key={estatus}
                dataKey={estatus}
                name={estatus.charAt(0).toUpperCase() + estatus.slice(1)}
                stackId="a"
                fill={STATUS_COLORS[idx]}
                radius={idx === ESTATUS_LIST.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Calendario de próximos seguimientos */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Calendario de Seguimientos
        </Typography>
        <Calendar
          events={calendarEvents}
          renderDayModal={(date, close) => {
            const fechaStr = date.toString();
            const seguimientosDia = seguimientos.filter(
              s => esMismoDia(s.fechaProximoSeguimiento, fechaStr)
            );
            return (
              <Dialog open onClose={close} maxWidth="sm" fullWidth>
                <DialogTitle>Seguimientos para el {fechaStr}</DialogTitle>
                <DialogContent>
                  {seguimientosDia.length === 0 ? (
                    <Typography color="text.secondary">
                      No hay seguimientos para este día
                    </Typography>
                  ) : (
                    <Stack spacing={2} mt={1}>
                      {seguimientosDia.map(s => (
                        <Box key={s.id} sx={{ borderBottom: '1px solid #eee', pb: 1 }}>
                          <Typography fontWeight={700}>
                            {prospectos.find(p => p.id === s.idprospecto)
                              ?.nombreCompleto ?? 'Sin nombre'}
                          </Typography>
                          <Typography variant="body2">
                            Unidad/Proyecto: {s.unidadInteres || s.proyectoInteres}
                          </Typography>
                          <Typography variant="body2">
                            Estatus: <b style={{ color: STATUS_COLORS[ESTATUS_LIST.indexOf(s.estatusSeguimiento as any)] }}>
                              {s.estatusSeguimiento.charAt(0).toUpperCase() + s.estatusSeguimiento.slice(1)}
                            </b>
                          </Typography>
                          <Typography variant="body2">
                            Comentario: {s.comentarios}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={close} variant="contained">
                    Cerrar
                  </Button>
                </DialogActions>
              </Dialog>
            );
          }}
        />
      </Paper>
    </Box>
  );
};

export default ResumenSeguimientosTab;
