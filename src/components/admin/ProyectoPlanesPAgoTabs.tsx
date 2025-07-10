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
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Proyecto, PlanPago } from '../../config/types';

interface ProyectoPlanesPagoTabProps {
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

const ProyectoPlanesPagoTab: React.FC<ProyectoPlanesPagoTabProps> = ({
  proyecto,
  handleDeliveryDateChange,
  handleAddPaymentPlanRow,
  handlePaymentPlanChange,
  handleParcialidadChange,
  handleDeletePaymentPlanRow,
}) => {
  const plans = proyecto.paymentPlans || [];
  const maxInstallments = plans.length
    ? Math.max(
        ...plans.map((plan) =>
          plan.mensualidades && plan.mensualidades > 0
            ? plan.mensualidades
            : plan.parcialidades.length
        )
      )
    : 0;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Fecha de Entrega
      </Typography>

      <TextField
        type="date"
        value={proyecto.fechaEntrega || ''}
        onChange={(e) => handleDeliveryDateChange(e.target.value)}
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

      {plans.length > 0 && (
        <Box sx={{ overflowX: 'auto', mt: 3 }}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{minWidth:220}}>Nombre del Plan</TableCell>
                  <TableCell rowSpan={2} sx={{minWidth:120}}>% Descuento</TableCell>
                  <TableCell rowSpan={2} sx={{minWidth:120}}>Enganche</TableCell>
                  {Array.from({ length: maxInstallments }).map((_, idx) => (
                    <TableCell key={`header-month-${idx}`} align="center" sx={{minWidth:120}}>
                      Mes {idx + 2}
                    </TableCell>
                  ))}
                  <TableCell rowSpan={2}>Liquidación / Contraentrega</TableCell>
                  <TableCell rowSpan={2}>Acciones</TableCell>
                </TableRow>
                <TableRow>
                  {Array.from({ length: maxInstallments }).map((_, idx) => (
                    <TableCell key={`sub-header-${idx}`} align="center">
                      % P
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan, planIndex) => {
                  const installmentsCount =
                    plan.mensualidades && plan.mensualidades > 0
                      ? plan.mensualidades
                      : plan.parcialidades.length;
                  return (
                    <TableRow key={planIndex}>
                      <TableCell>
                        <TextField
                          value={plan.name}
                          onChange={(e) =>
                            handlePaymentPlanChange(
                              planIndex,
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
                          onChange={(e) =>
                            handlePaymentPlanChange(
                              planIndex,
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
                          onChange={(e) =>
                            handlePaymentPlanChange(
                              planIndex,
                              'pInicial',
                              parseFloat(e.target.value)
                            )
                          }
                          fullWidth
                        />
                      </TableCell>

                      {Array.from({ length: maxInstallments }).map((_, monthIndex) =>
                        monthIndex < installmentsCount ? (
                            <TableCell key={`plan_${planIndex}_month_${monthIndex}`}>  {/* quité la llave extra */}
                            <TextField
                                type="number"
                                value={plan.parcialidades[monthIndex]?.value ?? 0}
                                onChange={(e) =>
                                handleParcialidadChange(
                                    planIndex,
                                    monthIndex,
                                    parseFloat(e.target.value)
                                )
                                }
                                fullWidth
                            />
                            </TableCell>
                        ) : (
                          <TableCell key={`empty_${planIndex}_${monthIndex}`} />
                        )
                      )}

                      <TableCell>
                        <TextField
                          type="number"
                          value={plan.contraentrega}
                          onChange={(e) =>
                            handlePaymentPlanChange(
                              planIndex,
                              'contraentrega',
                              parseFloat(e.target.value)
                            )
                          }
                          fullWidth
                        />
                      </TableCell>

                      <TableCell>
                        <IconButton onClick={() => handleDeletePaymentPlanRow(planIndex)}>
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
