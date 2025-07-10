import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Button, Table, TableContainer,
  TableHead, TableRow, TableCell, TableBody, Paper, Select,
  MenuItem, TextField, Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Proyecto, Unidad, PlanPago } from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';
import SignedAvatar from '../general/SignedAvatar';
import SignedImage from '../general/SignedImage';
import SignedImageCarousel from '../general/SinedImageCarousel';

interface CotizadorModalProps {
  proyecto: Proyecto;
  unidad: Unidad;
  open: boolean;
  onClose: () => void;
}

const CotizadorModal: React.FC<CotizadorModalProps> = ({
  proyecto,
  unidad,
  open,
  onClose
}) => {
  // --------- ESTADOS ---------
  const [selectedPlan, setSelectedPlan] = useState<PlanPago | null>(null);
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPayments, setCustomPayments] = useState<{ mes: string; monto: number }[]>([]);
  const [customPrecioPlan, setCustomPrecioPlan] = useState<number>(() => {
    // por default igual al precio de lista
    const num = parseFloat(String(unidad.preciolista).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
  });
  const [customPagoInicial, setCustomPagoInicial] = useState<number>(0);
  const [customContraEntrega, setCustomContraEntrega] = useState<number>(0);

  // --------- MANEJADORES ---------
  const handlePlanChange = (e: any) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomPlan(true);
      setSelectedPlan(null);
    } else {
      const plan = proyecto.paymentPlans.find(p => p.name === value) || null;
      setSelectedPlan(plan);
      setIsCustomPlan(false);
    }
  };

  const handleAddCustomPayment = () =>
    setCustomPayments(payments => [...payments, { mes: '', monto: 0 }]);

  const handleCustomPaymentChange = (
    index: number,
    field: 'mes' | 'monto',
    value: string | number
  ) => {
    setCustomPayments(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveCustomPayment = (index: number) => {
    setCustomPayments(prev => prev.filter((_, i) => i !== index));
  };

  // --------- UTILS ---------
  const precioLista = useMemo(() => {
    const num = parseFloat(String(unidad.preciolista).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [unidad.preciolista]);

  const maxInstallments = useMemo(() => {
  if (!proyecto.paymentPlans?.length) return 0;
  const lengths = proyecto.paymentPlans.map(
    plan =>
      (plan.mensualidades && plan.mensualidades > 0)
        ? plan.mensualidades
        : (Array.isArray(plan.parcialidades) ? plan.parcialidades.length : 0)
  );
  const max = Math.max(...lengths);
  return Number.isFinite(max) && max > 0 ? max : 0;
}, [proyecto.paymentPlans]);


  const calcularValoresPlan = (plan: PlanPago) => {
    const base = precioLista * ((100 - plan.descuento) / 100);
    const enganche = base * (plan.pInicial / 100);
    const liquidacion = base * (plan.contraentrega / 100);
    const pagosMensuales = plan.parcialidades.map(p =>
      base * (p.value / 100)
    );
    return { enganche, liquidacion, pagosMensuales };
  };

  // Plan personalizado, suma totales
  const totalCustomMonthly = customPayments.reduce((sum, p) => sum + Number(p.monto), 0);
  const totalProgramado = customPagoInicial + customContraEntrega + totalCustomMonthly;
  const restante = customPrecioPlan - totalProgramado;
console.log(unidad)
  // --------- RENDER ---------
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {/* HEADER */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          color: 'white',
          background: 'var(--secondary-color)'
        }}
      >
        <Typography variant="h6">
          Cotización {proyecto.nombre}
        </Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* LOGO & FACHADA */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
          <SignedAvatar
            value={proyecto.logo!}
            alt="Logo del Proyecto"
            sx={{ width: 90, height: 90, boxShadow: 2 }}
          />
          {proyecto.render && (
            <SignedImage
              path={proyecto.render.path!}
              bucket={proyecto.render.bucket!}
              alt="Fachada del Proyecto"
              sx={{
                width: 200,
                height: 120,
                borderRadius: 2,
                boxShadow: '2px 2px 10px rgba(0,0,0,0.13)'
              }}
            />
          )}
        </Box>
        {/* DATOS UNIDAD */}
        <Box sx={{
          p: 2,
          borderRadius: 2,
          background: "#f5f5f5",
          boxShadow: 1,
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          justifyContent: 'space-between'
        }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>
              Unidad: {unidad.numerounidad}
            </Typography>
            <Typography>Privativa: {unidad.unidadprivativa}</Typography>
            <Typography sx={{ color: 'var(--primary-color)', fontWeight: 500 }}>
              Precio de lista: <b>{formatoMoneda(unidad.preciolista)}</b>
            </Typography>
            {unidad.extras && Object.keys(unidad.extras).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                  Características adicionales:
                </Typography>
                <Stack spacing={0.5} sx={{ ml: 1 }}>
                  {Object.entries(unidad.extras).map(([label, value]) => (
                    <Typography key={label}>
                      <b>{label}: </b>{String(value)}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            mb: 3,
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {unidad.isometrico && unidad.isometrico.path && (
            <Box sx={{ textAlign: 'center' }}>
              <SignedImage
                path={unidad.isometrico.path}
                bucket={unidad.isometrico.bucket!}
                alt="Isométrico"
              />
              <Typography variant="caption">Isométrico</Typography>
            </Box>
          )}
          {unidad.render && unidad.render.path && (
            <Box sx={{ textAlign: 'center' }}>
              <SignedImage
                path={unidad.render.path}
                bucket={unidad.render.bucket!}
                alt="Render"
              />
              <Typography variant="caption">Render</Typography>
            </Box>
          )}
          {unidad.plano && unidad.plano.path && (
            <Box sx={{ textAlign: 'center' }}>
              <SignedImage
                path={unidad.plano.path}
                bucket={unidad.plano.bucket!}
                alt="Plano"
              />
              <Typography variant="caption">Plano</Typography>
            </Box>
          )}
        </Box>

        {unidad.imagenes && Array.isArray(unidad.imagenes) && unidad.imagenes.length > 0 && (
          <Box sx={{ my: 2, width: '100%', maxWidth: 380, mx: 'auto', display: 'flex', justifyContent: 'center' }}>
            <SignedImageCarousel
              items={unidad.imagenes}
              width="100%"
              height={280}
            />
          </Box>
        )}


        {/* SELECCIÓN PLAN DE PAGO */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 700 }}>
            Selecciona un plan de pago
          </Typography>
          <Select
            fullWidth
            value={isCustomPlan ? "custom" : (selectedPlan?.name || "")}
            onChange={handlePlanChange}
            displayEmpty
            sx={{ my: 2, bgcolor: '#fff' }}
          >
            <MenuItem value="" disabled>Selecciona un plan</MenuItem>
            {proyecto.paymentPlans.map((plan, idx) =>
              <MenuItem key={plan.name + idx} value={plan.name}>
                {plan.name}
              </MenuItem>
            )}
            <MenuItem value="custom"><b>Personalizado</b></MenuItem>
          </Select>
        </Box>

        {/* TABLA DE PLANES */}
        {!isCustomPlan && proyecto.paymentPlans && (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell>
                  <TableCell>% Desc.</TableCell>
                  <TableCell>Enganche</TableCell>
                  {Array.from({ length: maxInstallments }).map((_, i) => (
                    <TableCell key={i} align="center">Mes {i + 2}</TableCell>
                  ))}
                  <TableCell>Contraentrega</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyecto.paymentPlans.map((plan, planIndex) => {
                  const { enganche, liquidacion, pagosMensuales } = calcularValoresPlan(plan);
                  const installmentsCount = plan.mensualidades && plan.mensualidades > 0
                    ? plan.mensualidades
                    : plan.parcialidades.length;
                  return (
                    <TableRow
                      key={planIndex}
                      hover
                      sx={selectedPlan && selectedPlan.name === plan.name
                        ? { backgroundColor: '#e9ffe1', cursor: 'pointer' }
                        : { cursor: 'pointer' }
                      }
                      onClick={() => { setSelectedPlan(plan); setIsCustomPlan(false); }}
                    >
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.descuento}%</TableCell>
                      <TableCell>{formatoMoneda(enganche)}</TableCell>
                      {Array.from({ length: maxInstallments }).map((_, idx) => (
                        <TableCell key={idx} align="center">
                          {idx < installmentsCount
                            ? formatoMoneda(pagosMensuales[idx] || 0)
                            : ''}
                        </TableCell>
                      ))}
                      <TableCell>{formatoMoneda(liquidacion)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* PLAN PERSONALIZADO */}
        {isCustomPlan && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 700, mb: 2 }}>
              Plan personalizado
            </Typography>
            <Stack direction="row" gap={2} mb={2} flexWrap="wrap">
              <TextField
                label="Precio total del plan"
                variant="outlined"
                type="number"
                value={customPrecioPlan}
                onChange={e => setCustomPrecioPlan(Number(e.target.value))}
                sx={{ minWidth: 160 }}
              />
              <TextField
                label="Pago inicial"
                variant="outlined"
                type="number"
                value={customPagoInicial}
                onChange={e => setCustomPagoInicial(Number(e.target.value))}
                sx={{ minWidth: 140 }}
              />
              <TextField
                label="Contra entrega"
                variant="outlined"
                type="number"
                value={customContraEntrega}
                onChange={e => setCustomContraEntrega(Number(e.target.value))}
                sx={{ minWidth: 140 }}
              />
            </Stack>
            <Button variant="outlined" onClick={handleAddCustomPayment} sx={{ mb: 1 }}>
              + Agregar mes
            </Button>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mes</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customPayments.map((pago, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          size="small"
                          value={pago.mes}
                          onChange={e => handleCustomPaymentChange(idx, 'mes', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="outlined"
                          size="small"
                          type="number"
                          value={pago.monto}
                          onChange={e => handleCustomPaymentChange(idx, 'monto', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleRemoveCustomPayment(idx)} color="error">
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
              <Typography fontWeight={600} color={restante < 0 ? "error" : restante === 0 ? "primary" : "inherit"}>
                {restante < 0
                  ? `Te has excedido en ${formatoMoneda(Math.abs(restante))} del precio total`
                  : restante === 0
                  ? "¡El total programado coincide con el precio del plan!"
                  : `Falta por programar: ${formatoMoneda(restante)}`
                }
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {/* Aquí puedes poner un botón para "Guardar Cotización" si lo requieres */}
      </DialogActions>
    </Dialog>
  );
};

export default CotizadorModal;
