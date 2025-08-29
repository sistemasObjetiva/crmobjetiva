import React, { useMemo, useEffect } from 'react';
import {
  Box, Typography, TextField, IconButton, Tooltip,
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Paper,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Proyecto, PlanPago } from '../../config/types';

interface Props {
  proyecto: Proyecto;
  handleDeliveryDateChange: (newDate: string) => void;
  handleAddPaymentPlanRow: () => void;
  handlePaymentPlanChange: (
    planIndex: number,
    field: keyof PlanPago,
    value: any
  ) => void;
  handleParcialidadChange: (
    planIndex: number,
    monthIndex: number,
    value: number
  ) => void;
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
  // 1) HeaderMonths: de hoy hasta fechaEntrega
  const headerMonths = useMemo(() => {
    const today = new Date();
    const entrega = proyecto.fechaEntrega
      ? new Date(proyecto.fechaEntrega)
      : today;
    const diff =
      (entrega.getFullYear() - today.getFullYear()) * 12 +
      (entrega.getMonth() - today.getMonth()) +
      1;
    const totalMonths = Math.max(0, diff);
    return Array.from({ length: totalMonths }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth() + idx, 1);
      return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    });
  }, [proyecto.fechaEntrega]);

  // 2) Generamos dynamicPlans con los porcentajes deseados
  const dynamicPlans = useMemo<PlanPago[]>(() => {
    return proyecto.paymentPlans.map(plan => {
       if (plan.name === 'Crédito') {
        const n = headerMonths.length;                // número de meses
        const base = 100 - plan.pInicial - plan.contraentrega; // ej. 100 - 20 - 30 = 50
        const cada = n > 0 ? parseFloat((base / n).toFixed(2)) : 0;
        return {
          ...plan,
          months: n,
          parcialidades: Array.from({ length: n }).map((_, i) => ({
            month: i + 1,        // <= asegúrate de incluir siempre `month`
            value: cada,
          })),
        };
      }
      if (plan.name === 'ContadoComercial') {
        const primera = parseFloat(plan.pInicial.toFixed(2));        // 33.33
        const restante = parseFloat((100 - primera * 2).toFixed(2)); // 33.34
        return {
          ...plan,
          months: 1,
          parcialidades: [{ month: 1, value: primera }],
          contraentrega: restante,
        };
      }
      // Contado u otros planes
      return {
        ...plan,
        months: plan.months,
        parcialidades: plan.parcialidades.map(p => ({
          ...p,
          // en Contado los values serán 0, así que lo dejamos
          value: plan.name === 'Contado' ? 0 : p.value,
        })),
      };
    });
  }, [proyecto.paymentPlans, headerMonths]);

  // 3) Cuando dynamicPlans cambie, “sincroniza” al estado de proyecto
  useEffect(() => {
  dynamicPlans.forEach((plan, pi) => {
    // Sobrescribe la lista completa de parcialidades:
    handlePaymentPlanChange(pi, 'parcialidades', plan.parcialidades);
    // Y el contraentrega:
    handlePaymentPlanChange(pi, 'contraentrega', plan.contraentrega);
  });
}, [dynamicPlans, handlePaymentPlanChange]);

  const maxInstallments = dynamicPlans.length
    ? Math.max(...dynamicPlans.map(p => p.months || p.parcialidades.length))
    : 0;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Fecha de Entrega
      </Typography>
      <TextField
        type="date"
        value={proyecto.fechaEntrega || ''}
        onChange={e => handleDeliveryDateChange(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      <Box display="flex" alignItems="center" mt={1}>
        <Tooltip title="Agregar Plan de Pago">
          <IconButton color="primary" onClick={handleAddPaymentPlanRow}>
            <AddCircleIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="button" sx={{ ml: 1 }}>
          Agregar Plan
        </Typography>
      </Box>

      {dynamicPlans.length > 0 && (
        <Box sx={{ overflowX: 'auto', mt: 3 }}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ minWidth: 220 }}>
                    Nombre del Plan
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 120 }}>
                    % Descuento
                  </TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 120 }}>
                    Enganche
                  </TableCell>

                  {headerMonths.map((label, i) => (
                    <TableCell key={i} align="center" sx={{ minWidth: 120 }}>
                      {label}
                    </TableCell>
                  ))}

                  <TableCell rowSpan={2}>Liquidación / Contraentrega</TableCell>
                  <TableCell rowSpan={2}>Acciones</TableCell>
                </TableRow>
                <TableRow>
                  {headerMonths.map((_, i) => (
                    <TableCell key={i} align="center">
                      % P
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {dynamicPlans.map((plan, pi) => {
                  const count = plan.months || plan.parcialidades.length;
                  return (
                    <TableRow key={pi}>
                      <TableCell>
                        <TextField
                          value={plan.name}
                          onChange={e =>
                            handlePaymentPlanChange(
                              pi,
                              'name',
                              e.target.value
                            )
                          }
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={plan.descuento}
                          onChange={e =>
                            handlePaymentPlanChange(
                              pi,
                              'descuento',
                              parseFloat(e.target.value)
                            )
                          }
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={plan.pInicial}
                          onChange={e =>
                            handlePaymentPlanChange(
                              pi,
                              'pInicial',
                              parseFloat(e.target.value)
                            )
                          }
                          fullWidth
                        />
                      </TableCell>

                      {Array.from({ length: maxInstallments }).map((_, mi) =>
                        mi < count ? (
                          <TableCell key={mi}>
                            <TextField
                              type="number"
                              value={plan.parcialidades[mi]?.value ?? 0}
                              onChange={e =>
                                handleParcialidadChange(
                                  pi,
                                  mi,
                                  parseFloat(e.target.value)
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                        ) : (
                          <TableCell key={mi} />
                        )
                      )}

                      <TableCell>
                        <TextField
                          type="number"
                          value={plan.contraentrega}
                          onChange={e =>
                            handlePaymentPlanChange(
                              pi,
                              'contraentrega',
                              parseFloat(e.target.value)
                            )
                          }
                          fullWidth
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton onClick={() => handleDeletePaymentPlanRow(pi)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </>
  );
};

export default ProyectoPlanesPagoTab;
