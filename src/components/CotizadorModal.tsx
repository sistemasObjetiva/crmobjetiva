import React, { useState } from 'react';
import { 
  Modal, Box, Typography, Avatar, IconButton, Select, MenuItem, 
  TableContainer, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, TextField, Button 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Proyecto, Unidad, PaymentPlan } from '../types/types';
import CustomButton from './CustomButton';
import { formatoMoneda, handleDownloadPDF } from '../hooks/useUtilsFunctions';

interface CotizadorModalProps {
  proyecto: Proyecto;
  unidad: Unidad;
  open: boolean;
  onClose: () => void;
}

const CotizadorModal: React.FC<CotizadorModalProps> = ({ proyecto, unidad, open, onClose }) => {
  // Estado para plan seleccionado y personalizado
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPayments, setCustomPayments] = useState<{ mes: string; monto: number }[]>([]);
  const [customPrecioPlan, setCustomPrecioPlan] = useState<number>(0);
  const [customPagoInicial, setCustomPagoInicial] = useState<number>(0);
  const [customContraEntrega, setCustomContraEntrega] = useState<number>(0);

  // Manejo del select de planes
  const handlePlanChange = (event: any) => {
    const value = event.target.value;
    if (value === "custom") {
      setIsCustomPlan(true);
      setSelectedPlan(null);
    } else {
      const planSeleccionado = proyecto.paymentPlans.find(plan => plan.name === value) || null;
      setSelectedPlan(planSeleccionado);
      setIsCustomPlan(false);
    }
  };

  // Para el plan personalizado (funciones para agregar, modificar, quitar pagos)
  const handleAddCustomPayment = () => {
    setCustomPayments([...customPayments, { mes: '', monto: 0 }]);
  };
  const handleCustomPaymentChange = (index: number, field: 'mes' | 'monto', value: any) => {
    const updatedPayments = [...customPayments];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setCustomPayments(updatedPayments);
  };
  const handleRemoveCustomPayment = (index: number) => {
    const updatedPayments = customPayments.filter((_, i) => i !== index);
    setCustomPayments(updatedPayments);
  };

  // --- Tabla de Planes de Pago Predefinidos ---
  // Calcula el valor convertido del precio de lista
  const precioLista = parseFloat(String(unidad.preciolista).replace(/[$,]/g, '')) || 0;

  // Determina el máximo número de mensualidades entre los planes del proyecto
  const maxInstallments = proyecto.paymentPlans && proyecto.paymentPlans.length > 0
    ? Math.max(...proyecto.paymentPlans.map(plan =>
        (plan.mensualidades && plan.mensualidades > 0) ? plan.mensualidades : plan.parcialidades.length
      ))
    : 0;

  // Función para calcular valores financieros de un plan
  const calcularValoresPlan = (plan: PaymentPlan) => {
    const enganche = precioLista * (plan.pInicial / 100) * ((100 - plan.descuento) / 100);
    const liquidacion = precioLista * (plan.contraentrega / 100) * ((100 - plan.descuento) / 100);
    // Para cada mensualidad, se calcula:
    // mensualidad = precioLista * (porcentaje mensual / 100) * ((100 - descuento) / 100)
    const pagosMensuales = plan.parcialidades.map(p => 
      precioLista * (p.value / 100) * ((100 - plan.descuento) / 100)
    );
    return { enganche, liquidacion, pagosMensuales };
  };


  // --- Calcula totales para el plan personalizado (si se utiliza) ---
  const totalCustomMonthly = customPayments.reduce((sum, pago) => sum + Number(pago.monto), 0);
  const remainingAmount = customPrecioPlan - (customPagoInicial + customContraEntrega + totalCustomMonthly);

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEnforceFocus
      aria-labelledby="modal-proyecto"
      aria-describedby="modal-proyecto-tabs"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxHeight: '80vh',
          bgcolor: 'white',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflowY: 'auto',
        }}
      >
        {/* Botón de cierre */}
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon />
        </IconButton>

        {/* Encabezado: Logo y Fachada */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
          <Avatar src={proyecto.logo} sx={{ width: 100, height: 100, boxShadow: 3 }} />
          {proyecto.fachada && (
            <img
              src={proyecto.fachada}
              alt="Fachada del Proyecto"
              style={{ width: "200px", height: "120px", borderRadius: "8px", boxShadow: "2px 2px 10px rgba(0,0,0,0.2)" }}
            />
          )}
        </Box>

        {/* Nombre del Proyecto */}
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 3, color: 'var(--primary-color)', fontWeight: 'bold' }}>
          {proyecto.nombreProyecto}
        </Typography>

        {/* Información de la Unidad */}
        <Box sx={{ p: 2, borderRadius: 2, background: "#f5f5f5", boxShadow: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Detalles de la Unidad
          </Typography>
          <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>No Unidad:</Typography>
          <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.numerounidad}</Typography>
          <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Unidad Privativa:</Typography>
          <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.unidadprivativa}</Typography>
          <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Precio de Lista:</Typography>
          <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.preciolista}</Typography>
        </Box>

        {/* Sección Financiera */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
            Información Financiera
          </Typography>

          {/* Selección de Plan */}
          <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 1 }}>
            Selecciona un plan de pago:
          </Typography>
          <Select
            fullWidth
            value={isCustomPlan ? "custom" : (selectedPlan?.name || "")}
            onChange={handlePlanChange}
            displayEmpty
          >
            <MenuItem value="" disabled>Selecciona un plan</MenuItem>
            {proyecto.paymentPlans.map((plan, index) => (
              <MenuItem key={index} value={plan.name}>{plan.name}</MenuItem>
            ))}
            <MenuItem value="custom">Personalizado</MenuItem>
          </Select>

          {/* Plan predefinido: Muestra la tabla de planes */}
          {proyecto.paymentPlans && !isCustomPlan && (
            <Box sx={{ overflowX: "auto", mt: 3 }}>
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {/* Columnas fijas */}
                      <TableCell>Plan de Pago</TableCell>
                      <TableCell>% Descuento</TableCell>
                      <TableCell>Enganche</TableCell>
                      {/* Se generan dinámicamente las columnas para los pagos mensuales.
                          Supongamos que se muestran desde "Mes 2" hasta "Mes (maxInstallments+1)" */}
                      {Array.from({ length: maxInstallments }).map((_, index) => (
                        <TableCell key={`month-header-${index}`} align="center">
                          Mes {index + 2}
                        </TableCell>
                      ))}
                      <TableCell>Liquidación / Contraentrega</TableCell>
                    </TableRow>
                    <TableRow>
                      {/* Segunda fila de encabezado opcional (puedes eliminarla si no la necesitas) */}
                      {Array.from({ length: maxInstallments + 3 }).map((_, index) => (
                        <TableCell key={`sub-header-${index}`} />
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proyecto.paymentPlans.map((plan, planIndex) => {
                      const { enganche, liquidacion, pagosMensuales } = calcularValoresPlan(plan);
                      // Se determina cuántos pagos mensuales requiere este plan.
                      const installmentsCount = plan.mensualidades && plan.mensualidades > 0 
                        ? plan.mensualidades 
                        : plan.parcialidades.length;
                      return (
                        <TableRow key={planIndex} 
                          sx={ selectedPlan && selectedPlan.name === plan.name ? { backgroundColor: '#d0f0c0' } : {} }
                          onClick={() => setSelectedPlan(plan)}
                        >
                          <TableCell>{plan.name}</TableCell>
                          <TableCell>{plan.descuento}%</TableCell>
                          <TableCell>{formatoMoneda(enganche)}</TableCell>
                          {Array.from({ length: maxInstallments }).map((_, monthIndex) => {
                            if (monthIndex < installmentsCount) {
                              const montoMensual = pagosMensuales[monthIndex] || 0;
                              return (
                                <TableCell key={`plan_${planIndex}_month_${monthIndex}`}>
                                  {formatoMoneda(montoMensual)}
                                </TableCell>
                              );
                            } else {
                              return <TableCell key={`plan_${planIndex}_empty_${monthIndex}`} />;
                            }
                          })}
                          <TableCell>{formatoMoneda(liquidacion)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Plan personalizado */}
          {isCustomPlan && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
                Plan de pago personalizado
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Precio Plan"
                  variant="outlined"
                  type="number"
                  value={customPrecioPlan}
                  onChange={(e) => setCustomPrecioPlan(parseFloat(e.target.value))}
                />
                <TextField
                  label="Pago Inicial"
                  variant="outlined"
                  type="number"
                  value={customPagoInicial}
                  onChange={(e) => setCustomPagoInicial(parseFloat(e.target.value))}
                />
                <TextField
                  label="Contra Entrega"
                  variant="outlined"
                  type="number"
                  value={customContraEntrega}
                  onChange={(e) => setCustomContraEntrega(parseFloat(e.target.value))}
                />
              </Box>

              <Button variant="outlined" onClick={handleAddCustomPayment} sx={{ mt: 2 }}>
                Agregar Mes
              </Button>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customPayments.map((pago, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField 
                            variant="outlined" 
                            size="small" 
                            value={pago.mes} 
                            onChange={(e) => handleCustomPaymentChange(index, 'mes', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField 
                            variant="outlined" 
                            size="small" 
                            type="number" 
                            value={pago.monto} 
                            onChange={(e) => handleCustomPaymentChange(index, 'monto', parseFloat(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveCustomPayment(index)}>
                            <CloseIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Falta por programar:
                </Typography>
                <Typography>
                  {formatoMoneda(remainingAmount)}
                </Typography>
                {remainingAmount < 0 && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    Te has excedido en {formatoMoneda(Math.abs(remainingAmount))} del precio total.
                  </Typography>
                )}
                {remainingAmount === 0 && (
                  <Typography color="primary" sx={{ mt: 1 }}>
                    ¡El total programado coincide exactamente con el precio del plan!
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>

        <CustomButton
          text="Descargar PDF"
          onClick={() =>
            handleDownloadPDF(
              proyecto,
              unidad,
              isCustomPlan
                ? { customPrecioPlan, customPagoInicial, customContraEntrega, customPayments }
                : selectedPlan
            )
          }
        />
      </Box>
    </Modal>
  );
};

export default CotizadorModal;
