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
    const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
    const [isCustomPlan, setIsCustomPlan] = useState(false);
    const [customPayments, setCustomPayments] = useState<{ mes: string; monto: number }[]>([]);
    const [customPrecioPlan, setCustomPrecioPlan] = useState<number>(0);
    const [customPagoInicial, setCustomPagoInicial] = useState<number>(0);
    const [customContraEntrega, setCustomContraEntrega] = useState<number>(0);

    // Manejo del cambio en el select de planes
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
      console.log(unidad);
    };

    // Funciones para manejar la tabla del plan personalizado
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

    // Cálculo de valores financieros basado en el plan predefinido
    const calcularPagos = () => {
      if (!selectedPlan) return { pagoInicial: 0, mensualidad: 0, pagoContraentrega: 0, fechasMensualidades: [] };
      const precioLista = typeof unidad.preciolista === 'string'
        ? unidad.preciolista.replace(/[$,]/g, '')
        : unidad.preciolista;
      const pagoInicial = (parseFloat(precioLista) * selectedPlan.pInicial) / 100;
      const pagoContraentrega = (parseFloat(precioLista) * selectedPlan.contraentrega) / 100;
      const montoMensualidad = (parseFloat(precioLista) * selectedPlan.parcialidades) / 100 / selectedPlan.months;

      // Generar fechas de mensualidades (considerando el día actual como inicio)
      const fechasMensualidades = Array.from({ length: selectedPlan.months }, (_, i) => {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() + i + 1);
        return { mes: fecha.toLocaleString('default', { month: 'long', year: 'numeric' }), monto: montoMensualidad };
      });

      return { pagoInicial, mensualidad: montoMensualidad, pagoContraentrega, fechasMensualidades };
    };

    const pagosCalculados = calcularPagos();

    // Calcular el monto restante en el plan personalizado
    const totalCustomMonthly = customPayments.reduce((sum, payment) => sum + Number(payment.monto), 0);
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
          id="modal-content"
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

          {/* Encabezado: Logo + Fachada */}
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

          {/* Datos de la Unidad */}
          <Box sx={{ p: 2, borderRadius: 2, background: "#f5f5f5", boxShadow: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'var(--primary-color)', fontWeight: 'bold' }}>
              Detalles de la Unidad
            </Typography>
            <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>No Unidad:</Typography>
            <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.numerounidad}</Typography>
            <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Unidad Privativa:</Typography>
            <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.unidadprivativa}</Typography>
            <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Precio de Lista:</Typography>
            <Typography sx={{ color: 'var(--primary-color)' }}>{unidad.preciolista}</Typography>

            {/* Extras de la Unidad */}
            {unidad.extras && Object.keys(unidad.extras).length > 0 && (
              <>
                {Object.entries(unidad.extras).map(([key, value], index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{key}:</Typography>
                    <Typography sx={{ color: 'var(--primary-color)' }}>{value}</Typography>
                  </Box>
                ))}
              </>
            )}
          </Box>

          {/* Imágenes de la Unidad */}
          {unidad.imagenes && unidad.imagenes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
                Imágenes de la Unidad
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {unidad.imagenes.map((img, index) => (
                  <img
                    key={index}
                    src={typeof img === 'string' ? img : img.data}
                    alt={`Imagen ${index}`}
                    style={{ width: "100px", height: "80px", borderRadius: "4px", objectFit: "cover", boxShadow: "2px 2px 5px rgba(0,0,0,0.2)" }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
              Información Financiera
            </Typography>

            {/* Select para elegir plan de pago */}
            <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 1 }}>
              Selecciona un plan:
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

            {/* Información para plan predefinido */}
            {selectedPlan && !isCustomPlan && (
              <>
                <Box sx={{ mt: 3, p: 2, background: "#f9f9f9", borderRadius: 2, boxShadow: 1 }}>
                  <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    Pago Inicial:
                  </Typography>
                  <Typography sx={{ color: 'var(--primary-color)' }}>
                    {formatoMoneda(pagosCalculados.pagoInicial)}
                  </Typography>
                  <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>
                    Mensualidad:
                  </Typography>
                  <Typography sx={{ color: 'var(--primary-color)' }}>
                    {formatoMoneda(pagosCalculados.mensualidad)}
                  </Typography>
                  <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>
                    Pago Contraentrega:
                  </Typography>
                  <Typography sx={{ color: 'var(--primary-color)' }}>
                    {formatoMoneda(pagosCalculados.pagoContraentrega)}
                  </Typography>
                </Box>

                {/* Calendario de pagos para plan predefinido */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
                    Calendario de Pagos
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mes</TableCell>
                          <TableCell>Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagosCalculados.fechasMensualidades.map((pago, index) => (
                          <TableRow key={index}>
                            <TableCell>{pago.mes}</TableCell>
                            <TableCell>{formatoMoneda(pago.monto)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </>
            )}

            {/* Sección para el plan de pago personalizado */}
            {isCustomPlan && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 2 }}>
                  Plan de pago personalizado
                </Typography>
                {/* Campos para ingresar Precio Plan, Pago Inicial y Contra Entrega */}
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

                {/* Botón para agregar mes */}
                <Button variant="outlined" onClick={handleAddCustomPayment} sx={{ mt: 2 }}>
                  Agregar Mes
                </Button>

                {/* Tabla para registrar mensualidades */}
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

                {/* Si el remainingAmount es menor que 0, significa que el usuario se pasó */}
                {remainingAmount < 0 && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    Te has excedido en {formatoMoneda(Math.abs(remainingAmount))} del precio total.
                  </Typography>
                )}

                {/* Si el remainingAmount es 0, significa que ya está cuadrado */}
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
