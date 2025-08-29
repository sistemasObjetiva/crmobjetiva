import React, { useMemo, useEffect } from 'react';
import {
  Box, Typography, TextField, IconButton, Tooltip,
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, Stack
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Proyecto, PlanPago } from '../../config/types';

// (…tus utilidades y helpers: clamp, round2, sum, evenSplit, baseMensualidades, reprogramRight, redistributeAll, normalizeParcialidades, getMonthsArray, getTotals, remainingForPI, remainingForCE…)
// Pegamos exactamente las funciones que ya tienes en tu componente actual, sin alterarlas.

const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

function evenSplit(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((total / count) * 100) / 100;
  const arr = Array(count).fill(base);
  const s = arr.reduce((a: number, b: number) => a + b, 0);
  const diff = round2(total - s);
  arr[count - 1] = round2(arr[count - 1] + diff);
  return arr;
}
function baseMensualidades(plan: PlanPago) { return round2(100 - (plan.pInicial || 0) - (plan.contraentrega || 0)); }
function reprogramRight(plan: PlanPago, monthIndex: number, newValueRaw: number, monthsCount: number): number[] {
  const n = monthsCount;
  const base = baseMensualidades(plan);
  const parcs = Array.from({ length: n }, (_, i) => round2(plan.parcialidades?.[i]?.value ?? 0));
  const leftSum = round2(sum(parcs.slice(0, monthIndex)));
  const maxForEdited = round2(base - leftSum);
  const edited = Math.max(0, Math.min(round2(newValueRaw || 0), Math.max(0, maxForEdited)));
  parcs[monthIndex] = edited;
  const used = round2(leftSum + edited);
  const remaining = round2(base - used);
  const rightCount = n - (monthIndex + 1);
  if (rightCount > 0) {
    const right = evenSplit(Math.max(0, remaining), rightCount);
    for (let i = 0; i < rightCount; i++) parcs[monthIndex + 1 + i] = right[i];
  }
  return parcs.slice(0, n).map(round2);
}
function redistributeAll(plan: PlanPago, monthsCount: number): number[] {
  const base = baseMensualidades(plan);
  return evenSplit(Math.max(0, base), monthsCount);
}
function normalizeParcialidades(plan: PlanPago, monthsCount: number): number[] {
  const n = monthsCount;
  const base = baseMensualidades(plan);
  const current = (plan.parcialidades || []).map(p => round2(p.value || 0));
  const currLen = current.length;
  if (currLen === 0) return evenSplit(Math.max(0, base), n);
  if (currLen === n) return current;
  if (currLen < n) {
    const leftSum = round2(sum(current));
    const remaining = round2(Math.max(0, base - leftSum));
    const extra = evenSplit(remaining, n - currLen);
    return [...current, ...extra];
  }
  const cut = current.slice(0, n);
  const s = round2(sum(cut));
  if (s > base) {
    const factor = base === 0 ? 0 : base / s;
    const scaled = cut.map(v => round2(v * factor));
    const diff = round2(base - sum(scaled));
    scaled[n - 1] = round2(scaled[n - 1] + diff);
    return scaled;
  }
  return cut;
}
function getMonthsArray(plan: PlanPago, monthsCount: number) {
  return Array.from({ length: monthsCount }, (_, i) => round2(plan.parcialidades?.[i]?.value ?? 0));
}
function getTotals(plan: PlanPago, monthsCount: number) {
  const pI = round2(plan.pInicial ?? 0);
  const ce = round2(plan.contraentrega ?? 0);
  const parcs = getMonthsArray(plan, monthsCount);
  const mSum = round2(sum(parcs));
  const total = round2(pI + mSum + ce);
  return { pI, ce, parcs, mSum, total };
}
function remainingForPI(plan: PlanPago) { const ce = round2(plan.contraentrega ?? 0); return round2(Math.max(0, 100 - ce)); }
function remainingForCE(plan: PlanPago) { const pI = round2(plan.pInicial ?? 0); return round2(Math.max(0, 100 - pI)); }

interface Props {
  proyecto: Proyecto;
  handleDeliveryDateChange: (newDate: string) => void;
  handleAddPaymentPlanRow: () => void;
  handlePaymentPlanChange: (planIndex: number, field: keyof PlanPago, value: any) => void;
  handleParcialidadChange: (planIndex: number, monthIndex: number, value: number) => void;
  handleDeletePaymentPlanRow: (index: number) => void;
}

const ProyectoPlanesPagoTab: React.FC<Props> = ({
  proyecto,
  handleDeliveryDateChange,
  handleAddPaymentPlanRow,
  handlePaymentPlanChange,
  handleParcialidadChange,
  handleDeletePaymentPlanRow,
}) => {
  const headerMonths = useMemo(() => {
    const today = new Date();
    const entrega = proyecto.fechaEntrega ? new Date(proyecto.fechaEntrega) : today;
    const diff = (entrega.getFullYear() - today.getFullYear()) * 12 + (entrega.getMonth() - today.getMonth()) + 1;
    const totalMonths = Math.max(0, diff);
    return Array.from({ length: totalMonths }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth() + idx, 1);
      return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    });
  }, [proyecto.fechaEntrega]);

  const monthsCount = headerMonths.length;

  const dynamicPlans = useMemo<PlanPago[]>(() => {
    return proyecto.paymentPlans.map(plan => {
      if (plan.name === 'ContadoComercial' && (!plan.parcialidades || plan.parcialidades.length === 0)) {
        const primera = round2(plan.pInicial || 0);
        const restante = round2(100 - primera * 2);
        return {
          ...plan,
          months: 1,
          parcialidades: [{ month: 1, value: primera }],
          contraentrega: restante,
        };
      }
      const normalized = normalizeParcialidades(plan, monthsCount);
      return {
        ...plan,
        months: monthsCount,
        parcialidades: normalized.map((v, i) => ({ month: i + 1, value: v })),
      };
    });
  }, [proyecto.paymentPlans, monthsCount]);

  useEffect(() => {
    dynamicPlans.forEach((plan, pi) => {
      if (proyecto.paymentPlans[pi]?.months !== monthsCount) {
        handlePaymentPlanChange(pi, 'months', monthsCount);
      }
      if (!proyecto.paymentPlans[pi]?.parcialidades?.length && plan.parcialidades.length) {
        handlePaymentPlanChange(pi, 'parcialidades', plan.parcialidades);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsCount]);

  const maxInstallments = dynamicPlans.length
    ? Math.max(...dynamicPlans.map(p => p.months || p.parcialidades.length))
    : 0;

  return (
    <Paper sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--primary-color)' }}>
            Planes de pago
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Distribuye el porcentaje entre enganche, mensualidades y contraentrega. El total siempre debe sumar 100%.
          </Typography>
        </Box>

        <Tooltip title="Agregar Plan de Pago">
          <IconButton color="primary" onClick={handleAddPaymentPlanRow}>
            <AddCircleIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Fecha de entrega</Typography>
        <TextField
          type="date"
          value={proyecto.fechaEntrega || ''}
          onChange={e => handleDeliveryDateChange(e.target.value)}
          fullWidth
        />
      </Box>

      {dynamicPlans.length > 0 && (
        <Box sx={{ overflowX: 'auto', mt: 2 }}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ minWidth: 220 }}>Nombre del Plan</TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 120 }}>% Descuento</TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 120 }}>Enganche</TableCell>
                  {headerMonths.map((label, i) => (
                    <TableCell key={i} align="center" sx={{ minWidth: 120 }}>{label}</TableCell>
                  ))}
                  <TableCell rowSpan={2}>Liquidación / Contraentrega</TableCell>
                  <TableCell rowSpan={2}>Acciones</TableCell>
                </TableRow>
                <TableRow>
                  {headerMonths.map((_, i) => (
                    <TableCell key={i} align="center">% P</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {dynamicPlans.map((plan, pi) => {
                  const count = plan.months || plan.parcialidades.length;
                  const sourcePlan = proyecto.paymentPlans[pi];
                  const { total } = getTotals(sourcePlan, count);
                  const restante = round2(100 - total);

                  return (
                    <TableRow key={pi} hover>
                      <TableCell>
                        <TextField
                          value={plan.name}
                          onChange={e => handlePaymentPlanChange(pi, 'name', e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={sourcePlan.descuento ?? 0}
                          onChange={e => handlePaymentPlanChange(pi, 'descuento', parseFloat(e.target.value || '0'))}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={sourcePlan.pInicial ?? 0}
                          onChange={e => {
                            const raw = parseFloat(e.target.value || '0');
                            const maxPI = remainingForPI(sourcePlan);
                            const pInicial = round2(Math.max(0, Math.min(raw, maxPI)));
                            handlePaymentPlanChange(pi, 'pInicial', pInicial);
                            const newParcs = redistributeAll({ ...sourcePlan, pInicial }, count);
                            handlePaymentPlanChange(pi, 'parcialidades', newParcs.map((v, i) => ({ month: i + 1, value: v })));
                          }}
                          fullWidth
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </TableCell>

                      {Array.from({ length: maxInstallments }).map((_, mi) =>
                        mi < count ? (
                          <TableCell key={mi}>
                            <TextField
                              type="number"
                              value={sourcePlan.parcialidades?.[mi]?.value ?? 0}
                              onChange={e => {
                                const newVal = parseFloat(e.target.value || '0');
                                const newParcs = reprogramRight(sourcePlan, mi, newVal, count);
                                handlePaymentPlanChange(pi, 'parcialidades', newParcs.map((v, i) => ({ month: i + 1, value: v })));
                                handleParcialidadChange(pi, mi, round2(newVal));
                              }}
                              fullWidth
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                        ) : (
                          <TableCell key={mi} />
                        )
                      )}

                      <TableCell>
                        <TextField
                          type="number"
                          value={sourcePlan.contraentrega ?? 0}
                          onChange={e => {
                            const raw = parseFloat(e.target.value || '0');
                            const maxCE = remainingForCE(sourcePlan);
                            const contraentrega = round2(Math.max(0, Math.min(raw, maxCE)));
                            handlePaymentPlanChange(pi, 'contraentrega', contraentrega);
                            const newParcs = redistributeAll({ ...sourcePlan, contraentrega }, count);
                            handlePaymentPlanChange(pi, 'parcialidades', newParcs.map((v, i) => ({ month: i + 1, value: v })));
                          }}
                          fullWidth
                          inputProps={{ min: 0, max: 100 }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                          Restante: {restante}%
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Eliminar">
                          <IconButton onClick={() => handleDeletePaymentPlanRow(pi)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
};

export default ProyectoPlanesPagoTab;
