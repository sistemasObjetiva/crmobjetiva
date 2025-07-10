import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material'
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
  Legend
} from 'recharts'
import { Temporal } from '@js-temporal/polyfill'
import type { Seguimiento } from '../../config/types'
import Calendar from '../general/calendar/Calendar'
import {
  useFetchSeguimientos,
  useFetchProspectos
} from '../../hooks/useFetchFunctions'

// Colores para el PieChart
const PIE_COLORS = ['#2ca58d', '#aaa']
interface SeguimientosPorDia {
  fecha: string;      // YYYY-MM-DD
  activos: number;
  cerrados: number;
  pendientes: number;
}
function getSeguimientosPorDia(seguimientos: Seguimiento[]): SeguimientosPorDia[] {
  const hoy = Temporal.Now.plainDateISO();

  return Array.from({ length: 7 }).map((_, i) => {
   const fecha = hoy.add({ days: i }).toString();   // "2025-07-09"

    const activos = seguimientos.filter(s => {
    // si tu s.fechaProximoSeguimiento = "2025-07-09T14:32:00Z"
    const soloFecha = s.fechaProximoSeguimiento.slice(0, 10); // "2025-07-09"
    return soloFecha === fecha && s.estatusSeguimiento === "activo";
    }).length;


    const cerrados = seguimientos.filter(
      (s) =>
        s.fechaProximoSeguimiento === fecha &&
        s.estatusSeguimiento === "cerrado"
    ).length;

    // “Pendientes” = todos los que no están cerrados ni activos (ajusta según tu lógica)
    const totalDelDia = seguimientos.filter(
      (s) => s.fechaProximoSeguimiento === fecha
    ).length;
    const pendientes = totalDelDia - activos - cerrados;

    return {
      fecha,
      activos,
      cerrados,
      pendientes: pendientes > 0 ? pendientes : 0,
    };
  });
}
interface Props {
  userid: string
}

const ResumenSeguimientosTab: React.FC<Props> = ({  }) => {
  const { seguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()

  const activos = seguimientos.filter(s => s.estatusSeguimiento === 'activo')
  const cerrados = seguimientos.filter(s => s.estatusSeguimiento === 'cerrado')
  const porDia = getSeguimientosPorDia(seguimientos)

  // Datos para PieChart
  const pieData = [
    { name: 'Activos', value: activos.length },
    { name: 'Cerrados', value: cerrados.length }
  ]

  // Función para comparar días con Temporal
  const esMismoDia = (f1: string, f2: string) =>
    Temporal.PlainDate.from(f1).equals(Temporal.PlainDate.from(f2))

  // Eventos para calendario
  const calendarEvents = activos.map(s => ({
    id: s.id,
    fecha: s.fechaProximoSeguimiento,
    label: 'Seguimiento'
  }))

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
        Resumen de Seguimientos
      </Typography>

      {/* Gráfica comparativa Activos vs Cerrados */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Activos vs Cerrados
        </Typography>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={PIE_COLORS[idx]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" />
            <ReTooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Gráfica de barra de próximos seguimientos */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Seguimientos Siguientes 7 Días (Activos vs Cerrados)
        </Typography>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={porDia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="fecha"
              tickFormatter={v => {
                const d = Temporal.PlainDate.from(v)
                return `${d.day}/${d.month}`
              }}
            />
            <YAxis allowDecimals={false} />
            <ReTooltip
              formatter={(value: any, name: any) => [value, name === 'activos' ? 'Activos' : 'Cerrados']}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="activos" name="Activos" fill="#2ca58d" />
            <Bar dataKey="cerrados" name="Cerrados" fill="#aaa" />
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
            const fechaStr = date.toString()
            const seguimientosDia = activos.filter(
              s => esMismoDia(s.fechaProximoSeguimiento, fechaStr)
            )
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
                          <Typography variant="body2">Comentario: {s.comentarios}</Typography>
                          <Chip
                            label={s.temperaturaInteres}
                            color={
                              s.temperaturaInteres === 'Alta'
                                ? 'error'
                                : s.temperaturaInteres === 'Media'
                                ? 'warning'
                                : 'default'
                            }
                            size="small"
                          />
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
            )
          }}
        />
      </Paper>
    </Box>
  )
}

export default ResumenSeguimientosTab
