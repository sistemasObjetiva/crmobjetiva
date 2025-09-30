import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Stack, Divider, Avatar, Card, CardContent,
  Button, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BusinessIcon from '@mui/icons-material/Business';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import TimelineIcon from '@mui/icons-material/Timeline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { Temporal } from '@js-temporal/polyfill';
import { useAuthRole } from '../config/auth';
import { useFetchProspectosUser, useFetchProyects, useFetchPropiedades, useFetchSeguimientos } from '../hooks/useFetchFunctions';
import type {  Proyecto, Propiedad, Seguimiento } from '../config/types';
import SignedImage from '../components/general/SignedImage';
import Calendar from '../components/general/calendar/Calendar';

const ESTATUS_LIST = [
  'contactado',
  'interaccion',
  'cotizacion',
  'visita',
  'posible',
  'apartado',
  'vendido',
] as const;
type EstatusKey = typeof ESTATUS_LIST[number];

const STATUS_LABEL: Record<EstatusKey, string> = {
  contactado: 'Contactado',
  interaccion: 'Interacción',
  cotizacion: 'Cotización',
  visita: 'Visita',
  posible: 'Posible',
  apartado: 'Apartado',
  vendido: 'Vendido',
};

const STATUS_COLORS: Record<EstatusKey, "primary" | "secondary" | "success" | "error" | "warning" | "info" | "default"> = {
  contactado: 'info',
  interaccion: 'primary',
  cotizacion: 'warning',
  visita: 'secondary',
  posible: 'default',
  apartado: 'success',
  vendido: 'error',
};
const CHART_COLORS = [
  '#3b82f6', // contactado - azul
  '#14b8a6', // interaccion - turquesa
  '#6366f1', // cotizacion - indigo
  '#f59e42', // visita - naranja
  '#06d6a0', // posible - verde
  '#eab308', // apartado - amarillo
  '#ef4444', // vendido - rojo
];

const AUTOPLAY_INTERVAL = 4200;

// ---- helpers: pertenencia por usuario ----
const OWNER_FIELDS = ['userid', 'vendedorid', 'asignadoA'] as const;
function belongsToUser(obj: Record<string, any>, userid?: string) {
  if (!userid) return false;
  for (const f of OWNER_FIELDS) {
    const v = obj?.[f];
    if (typeof v === 'string' && v === userid) return true;
    if (typeof v === 'number' && String(v) === String(userid)) return true;
  }
  return false;
}

// fechas seguras (solo día)
const sameDay = (iso1?: string, iso2?: string) => {
  if (!iso1 || !iso2) return false;
  const d1 = Temporal.PlainDate.from(iso1.slice(0,10));
  const d2 = Temporal.PlainDate.from(iso2.slice(0,10));
  return d1.equals(d2);
};

const IndexPage: React.FC = () => {

  const { user, loading } = useAuthRole();
  const userid =  user?.id;

  // prospectos ya vienen por usuario
  const { prospectos, loading: loadingProspectos } = useFetchProspectosUser(userid);

  // proyectos/propiedades (globales por ahora)
  const { proyectos } = useFetchProyects();
  const { propiedades } = useFetchPropiedades();

  // seguimientos (luego filtramos según rol)
  const { seguimientos } = useFetchSeguimientos();

  // --- rol y filtro de seguimientos ---
  const{role } = useAuthRole();
  const isUsuario = role === 'Usuario';
  // si quieres que "operacion" también vea solo lo suyo:
  // const isUsuario = ['usuario','operacion'].includes(role);

  const seguimientosFiltrados: Seguimiento[] = useMemo(
    () => (isUsuario ? seguimientos.filter(s => belongsToUser(s as any, userid)) : seguimientos),
    [isUsuario, seguimientos, userid]
  );

  // Agrupar seguimientos por estatus (filtrados si es usuario)
  const seguimientosPorEstatus: Record<EstatusKey, number> = useMemo(() => (
    ESTATUS_LIST.reduce((acc, e) => {
      acc[e] = seguimientosFiltrados.filter(s => s.estatusSeguimiento === e).length;
      return acc;
    }, {} as Record<EstatusKey, number>)
  ), [seguimientosFiltrados]);

  // Nombre del usuario (iniciales mayúsculas)
  const toTitleCase = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  // Prioriza distintas fuentes comunes de "nombre"
  const displayNameRaw =
    user?.nombre ??
    (user as any)?.profile?.nombre ??
    user?.user_metadata?.nombre ??
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    user?.app_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Usuario';

  const username = toTitleCase(String(displayNameRaw));

  // ---- CARRUSEL DE PROYECTOS Y PROPIEDADES ----
  type CardType = { tipo: 'proyecto' | 'propiedad'; data: Proyecto | Propiedad };
  function getCardImage(card: CardType): { path: string, bucket: string, alt: string } {
    if(card.tipo === 'proyecto') {
      const p = card.data as Proyecto;
      if(p.render && p.render.path && p.render.bucket) {
        return { path: p.render.path, bucket: p.render.bucket, alt: p.nombre };
      }
      if((p as any).logo && (p as any).logo.path && (p as any).logo.bucket) {
        return { path: (p as any).logo.path, bucket: (p as any).logo.bucket, alt: p.nombre };
      }
      return { path: '', bucket: '', alt: p.nombre };
    } else {
      const pr = card.data as Propiedad;
      if(pr.imagenes && pr.imagenes.length > 0 && pr.imagenes[0].path && pr.imagenes[0].bucket) {
        return { path: pr.imagenes[0].path, bucket: pr.imagenes[0].bucket, alt: pr.tituloPropiedad };
      }
      return { path: '', bucket: '', alt: pr.tituloPropiedad };
    }
  }

  const cards: CardType[] = [
    ...proyectos.map((p) => ({ tipo: 'proyecto' as const, data: p })),
    ...propiedades.map((p) => ({ tipo: 'propiedad' as const, data: p })),
  ];
  const [cardIdx, setCardIdx] = useState(0);

  useEffect(() => {
    if (cards.length < 2) return;
    const id = setInterval(() => {
      setCardIdx((prev) => (prev + 1) % cards.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(id);
  }, [cards.length]);

  // --- GRÁFICAS Y CALENDARIO (con seguimientos filtrados si es usuario) ---
  function getSeguimientosPorDia(segs: Seguimiento[]) {
    const hoy = Temporal.Now.plainDateISO();
    return Array.from({ length: 7 }).map((_, i) => {
      const fecha = hoy.add({ days: i }).toString();
      const obj: any = { fecha };
      ESTATUS_LIST.forEach((estatus) => {
        obj[estatus] = segs.filter(
          (s) =>
            s.fechaProximoSeguimiento?.slice(0, 10) === fecha &&
            s.estatusSeguimiento === estatus
        ).length;
      });
      return obj;
    });
  }

  const seguimientosPieData = ESTATUS_LIST.map((estatus, i) => ({
    name: STATUS_LABEL[estatus],
    value: seguimientosPorEstatus[estatus] ?? 0,
    color: CHART_COLORS[i],
  }));

  const seguimientosPorDia = useMemo(
    () => getSeguimientosPorDia(seguimientosFiltrados),
    [seguimientosFiltrados]
  );

  // Para el calendario (solo los que no estén vendidos)
  const calendarEvents = useMemo(() => (
    seguimientosFiltrados
      .filter(s => s.fechaProximoSeguimiento && s.estatusSeguimiento !== 'vendido')
      .map(s => ({
        id: s.id,
        fecha: s.fechaProximoSeguimiento!,
        label: STATUS_LABEL[s.estatusSeguimiento as EstatusKey]
      }))
  ), [seguimientosFiltrados]);

  const esMismoDia = (f1: string, f2: string) => sameDay(f1, f2);

  if (loading || loadingProspectos) {
    return (
      <Box p={8} display="flex" justifyContent="center">
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: 2, md: 4 },
        backgroundColor: '#fff',
        borderRadius: 4,
        boxShadow: '0 2px 12px 0 rgba(60,60,60,0.12)',
        mx: 'auto',
      }}
    >
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: 28 }}>
          {username ? username[0].toUpperCase() : <EmojiEventsIcon />}
        </Avatar>
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            color="primary"
            sx={{ letterSpacing: 1, mb: 0.3 }}
          >
            ¡Hola, {username || 'Usuario'}!
          </Typography>
          <Typography color="text.secondary" fontSize={17}>
            Este es tu panel de control. Revisa tus métricas y sigue impulsando los resultados.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mt={1} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleAltIcon color="info" sx={{ fontSize: 36 }} />
            <Box>
              <Typography fontWeight={700} fontSize={24}>{prospectos.length}</Typography>
              <Typography variant="caption" color="text.secondary">Prospectos</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <BusinessIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography fontWeight={700} fontSize={24}>{proyectos.length}</Typography>
              <Typography variant="caption" color="text.secondary">Proyectos</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <HomeWorkIcon color="secondary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography fontWeight={700} fontSize={24}>{propiedades.length}</Typography>
              <Typography variant="caption" color="text.secondary">Propiedades</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimelineIcon color="success" sx={{ fontSize: 36 }} />
            <Box>
              <Typography fontWeight={700} fontSize={24}>{seguimientosFiltrados.length}</Typography>
              <Typography variant="caption" color="text.secondary">Seguimientos</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Carrusel de proyectos y propiedades (global por ahora) */}
      {cards.length > 0 && (
        <Box
          sx={{ mt: 3, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 270 }}
        >
          <Box>
            <Card
              sx={{
                width: 420,
                minHeight: 250,
                borderRadius: 4,
                boxShadow: '0 3px 12px 0 rgba(0,0,0,0.12)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 0
              }}
              elevation={4}
            >
              {/* Imagen del card usando SignedImage */}
              {(() => {
                const card = cards[cardIdx];
                const { path, bucket, alt } = getCardImage(card);
                return path && bucket ? (
                  <SignedImage
                    path={path}
                    bucket={bucket}
                    alt={alt}
                    sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
                  />
                ) : (
                  <Box
                    sx={{ width: '100%', height: 150, background: '#f3f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px 16px 0 0' }}
                  >
                    <Typography color="text.secondary">Sin imagen</Typography>
                  </Box>
                );
              })()}
              <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                <Typography variant="h6" color={cards[cardIdx].tipo === 'proyecto' ? 'primary' : 'secondary'} fontWeight={700} mb={1}>
                  {cards[cardIdx].tipo === 'proyecto'
                    ? (cards[cardIdx].data as Proyecto).nombre
                    : (cards[cardIdx].data as Propiedad).tituloPropiedad}
                </Typography>
                <Typography color="text.secondary">
                  {cards[cardIdx].tipo === 'proyecto' ? 'Proyecto inmobiliario' : 'Propiedad disponible'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" fontWeight={700} mb={1}>
        Seguimientos por Estatus
      </Typography>
      <Stack direction="row" gap={1.5} flexWrap="wrap" mb={3}>
        {ESTATUS_LIST.map((estatus) => (
          <Chip
            key={estatus}
            label={`${STATUS_LABEL[estatus]}: ${seguimientosPorEstatus[estatus] ?? 0}`}
            color={STATUS_COLORS[estatus]}
            sx={{ fontWeight: 700, fontSize: 16, px: 2, py: 1.2, borderRadius: 2 }}
          />
        ))}
      </Stack>

      {/* GRÁFICA PIE */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Seguimientos por Estatus (gráfica)
        </Typography>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={seguimientosPieData}
              dataKey="value"
              innerRadius={50}
              outerRadius={85}
              label={({ name, percent }) =>
                `${name} (${Math.round(percent * 100)}%)`
              }
            >
              {seguimientosPieData.map((entry, idx) => (
                <Cell key={entry.name} fill={CHART_COLORS[idx]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" />
            <ReTooltip />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* GRÁFICA DE BARRAS */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Seguimientos próximos 7 días (por Estatus)
        </Typography>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={seguimientosPorDia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                name={STATUS_LABEL[estatus]}
                stackId="a"
                fill={CHART_COLORS[idx]}
                radius={idx === ESTATUS_LIST.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* CALENDARIO */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>
          Calendario de Seguimientos
        </Typography>
        <Calendar
          events={calendarEvents}
          renderDayModal={(date, close) => {
            const fechaStr = date.toString();
            const seguimientosDia = seguimientosFiltrados.filter(
              s => esMismoDia(s.fechaProximoSeguimiento!, fechaStr)
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
                            {s.unidadInteres || s.proyectoInteres}
                          </Typography>
                          <Typography variant="body2">
                            Estatus:{' '}
                            <b style={{ color: CHART_COLORS[Math.max(0, ESTATUS_LIST.indexOf(s.estatusSeguimiento as EstatusKey))] }}>
                              {STATUS_LABEL[s.estatusSeguimiento as EstatusKey]}
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

      <Typography color="text.secondary" mt={2}>
        Recuerda: ¡darle seguimiento a tus prospectos puede marcar la diferencia!
      </Typography>
    </Box>
  );
};

export default IndexPage;
