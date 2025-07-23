import React from 'react';
import {
  Box, Typography, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, IconButton, Stack, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PlanPago } from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';
import CurrencyFormatCustom from '../general/InputMoneda';

export interface CustomPayment {
  mes: string;
  monto: number;
  manual?: boolean;
}

interface SelectorPlanPagoProps {
  paymentPlans: PlanPago[];
  precioLista: number;
  selectedPlan: PlanPago | null;
  isCustomPlan: boolean;
  customPayments: CustomPayment[];
  customPrecioPlan: number;
  customPagoInicial: number;
  customContraEntrega: number;
  restante: number;
  onPlanSelected: (
    plan: PlanPago | null,
    isCustom: boolean,
    customPayments?: CustomPayment[],
    customPrecioPlan?: number,
    customPagoInicial?: number,
    customContraEntrega?: number
  ) => void;
  onCustomPaymentsChange: (payments: CustomPayment[]) => void;
  onCustomPrecioPlanChange: (precio: number) => void;
  onCustomPagoInicialChange: (monto: number) => void;
  onCustomContraEntregaChange: (monto: number) => void;
  onSelectedPlanChange: (plan: PlanPago | null) => void;
  onIsCustomPlanChange: (isCustom: boolean) => void;
}

const parseNumber = (value: string | number) => {
  if (typeof value === "number") return value;
  const clean = value.replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
};

const SelectorPlanPago: React.FC<SelectorPlanPagoProps> = ({
  paymentPlans, precioLista,
  selectedPlan, isCustomPlan,
  customPayments, customPrecioPlan,
  customPagoInicial, customContraEntrega,
  restante,
  onPlanSelected,
  onCustomPaymentsChange,
  onCustomPrecioPlanChange,
  onCustomPagoInicialChange,
  onCustomContraEntregaChange,
  onSelectedPlanChange,
  onIsCustomPlanChange
}) => {
  // Máximo de mensualidades para la tabla
  const maxInstallments = React.useMemo(() => {
    if (!paymentPlans?.length) return 0;
    const lengths = paymentPlans.map(
      plan =>
        (plan.mensualidades && plan.mensualidades > 0)
          ? plan.mensualidades
          : (Array.isArray(plan.parcialidades) ? plan.parcialidades.length : 0)
    );
    const max = Math.max(...lengths);
    return Number.isFinite(max) && max > 0 ? max : 0;
  }, [paymentPlans]);

  // Cambio de plan seleccionado
  const handlePlanChange = (e: any) => {
    const value = e.target.value;
    if (value === 'custom') {
      onSelectedPlanChange(null);
      onIsCustomPlanChange(true);
      onPlanSelected(
        null, true,
        customPayments, customPrecioPlan, customPagoInicial, customContraEntrega
      );
    } else {
      const plan = paymentPlans.find(p => p.name === value) || null;
      onSelectedPlanChange(plan);
      onIsCustomPlanChange(false);
      onPlanSelected(plan, false);
    }
  };

  // Calcular valores de un plan predeterminado
  const calcularValoresPlan = (plan: PlanPago) => {
    const base = precioLista * ((100 - plan.descuento) / 100);
    const enganche = base * (plan.pInicial / 100);
    const liquidacion = base * (plan.contraentrega / 100);
    const pagosMensuales = plan.parcialidades.map(p =>
      base * (p.value / 100)
    );
    return { enganche, liquidacion, pagosMensuales };
  };

  // ------ PLAN PERSONALIZADO --------
  // Toma el precio total y RESTA inicial y contraentrega antes de repartir entre los meses automáticos.
  const reprogramarPagos = (
    payments: CustomPayment[],
    total: number,
    inicial: number,
    contra: number
  ): CustomPayment[] => {
    const totalManual = payments.reduce((sum, p) => p.manual ? sum + Number(p.monto) : sum, 0);
    const autoCount = payments.filter(p => !p.manual).length;
    // Restar inicial y contraentrega antes de repartir
    const restante = total - totalManual - inicial - contra;
    return payments.map(p =>
      p.manual ? p : { ...p, monto: autoCount ? Math.max(0, restante / autoCount) : 0 }
    );
  };

  // Handlers para cada campo
  const handlePrecioPlanChange = (e: any) => {
    const val = parseNumber(e.target.value);
    onCustomPrecioPlanChange(val);
  };

  const handlePagoInicialChange = (e: any) => {
    const val = parseNumber(e.target.value);
    onCustomPagoInicialChange(val);
  };

  const handleContraEntregaChange = (e: any) => {
    const val = parseNumber(e.target.value);
    onCustomContraEntregaChange(val);
  };

  // Agrega mensualidad automática
  const handleAddCustomPayment = () => {
    const pagos = [
      ...customPayments,
      { mes: `Mes ${customPayments.length + 1}`, monto: 0, manual: false }
    ];
    onCustomPaymentsChange(reprogramarPagos(pagos, customPrecioPlan, customPagoInicial, customContraEntrega));
  };

  // Edita monto/mes de mensualidad
  const handleCustomPaymentChange = (idx: number, campo: string, valor: any) => {
    let pagos = [...customPayments];
    if (campo === "monto") {
      pagos[idx].monto = parseNumber(valor);
      pagos[idx].manual = true;
      // Reprograma solo los posteriores a este
      const nextIdx = idx + 1;
      let prevManual = pagos.slice(0, nextIdx);
      let after = pagos.slice(nextIdx).map(p => ({ ...p, manual: false }));
      onCustomPaymentsChange(
        reprogramarPagos([...prevManual, ...after], customPrecioPlan, customPagoInicial, customContraEntrega)
      );
    } else if (campo === "mes") {
      pagos[idx].mes = valor;
      onCustomPaymentsChange(pagos);
    }
  };

  // Quita mensualidad
  const handleRemoveCustomPayment = (index: number) => {
    const newPagos = customPayments.filter((_, i) => i !== index);
    onCustomPaymentsChange(
      reprogramarPagos(newPagos, customPrecioPlan, customPagoInicial, customContraEntrega)
    );
  };

  // Si cambia el precio total, inicial o contraentrega, recalcula mensualidades automáticas
  React.useEffect(() => {
    if (isCustomPlan) {
      onCustomPaymentsChange(
        reprogramarPagos(customPayments, customPrecioPlan, customPagoInicial, customContraEntrega)
      );
    }
    // eslint-disable-next-line
  }, [customPrecioPlan, customPagoInicial, customContraEntrega]);

  // ------ RENDER --------
  return (
    <>
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
          {paymentPlans.map((plan, idx) =>
            <MenuItem key={plan.name + idx} value={plan.name}>
              {plan.name}
            </MenuItem>
          )}
          <MenuItem value="custom"><b>Personalizado</b></MenuItem>
        </Select>
      </Box>

      {/* TABLA DE PLANES */}
      {!isCustomPlan && paymentPlans && (
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
              {paymentPlans.map((plan, planIndex) => {
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
                    onClick={() => {
                      onSelectedPlanChange(plan);
                      onIsCustomPlanChange(false);
                      onPlanSelected(plan, false);
                    }}
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
              value={customPrecioPlan}
              name="customPrecioPlan"
              onChange={handlePrecioPlanChange}
              InputProps={{
                inputComponent: CurrencyFormatCustom as any,
              }}
              sx={{ minWidth: 160 }}
            />
            <TextField
              label="Pago inicial"
              variant="outlined"
              value={customPagoInicial}
              name="customPagoInicial"
              onChange={handlePagoInicialChange}
              InputProps={{
                inputComponent: CurrencyFormatCustom as any,
              }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              label="Contra entrega"
              variant="outlined"
              value={customContraEntrega}
              name="customContraEntrega"
              onChange={handleContraEntregaChange}
              InputProps={{
                inputComponent: CurrencyFormatCustom as any,
              }}
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
                        value={pago.monto}
                        name={`pago_monto_${idx}`}
                        onChange={e => handleCustomPaymentChange(idx, 'monto', e.target.value)}
                        InputProps={{
                          inputComponent: CurrencyFormatCustom as any,
                        }}
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
    </>
  );
};

export default SelectorPlanPago;
