import React,{useState} from 'react';
import { Modal, Box, Typography, Avatar, IconButton, Select, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Proyecto, Unidad,PaymentPlan } from '../types/types';
import CustomButton from './CustomButton';
import { handleDownloadPDF } from '../hooks/useUtilsFunctions';
interface CotizadorModalProps {
  proyecto: Proyecto;
  unidad: Unidad;
  open: boolean;
  onClose: () => void;
}

const CotizadorModal: React.FC<CotizadorModalProps> = ({ proyecto, unidad, open, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);

  // Función para manejar el cambio de plan seleccionado
  const handlePlanChange = (event: any) => {
    const planSeleccionado = proyecto.paymentPlans.find(plan => plan.name === event.target.value) || null;
    setSelectedPlan(planSeleccionado);
  };

  // Cálculo de valores financieros basado en el plan seleccionado
  const calcularPagos = () => {
    if (!selectedPlan) return { pagoInicial: 0, mensualidad: 0, pagoContraentrega: 0, fechasMensualidades: [] };

    const precioLista = parseFloat(unidad.preciolista) || 0;
    const pagoInicial = (precioLista * selectedPlan.pInicial) / 100;
    const pagoContraentrega = (precioLista * selectedPlan.contraentrega) / 100;
    const montoMensualidad = (precioLista * selectedPlan.mensualidades) / 100 / selectedPlan.months;

    // Generar fechas de mensualidades (considerando el día de inicio como el día actual)
    const fechasMensualidades = Array.from({ length: selectedPlan.months }, (_, i) => {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() + i + 1);
      return { mes: fecha.toLocaleString('default', { month: 'long', year: 'numeric' }), monto: montoMensualidad };
    });

    return { pagoInicial, mensualidad: montoMensualidad, pagoContraentrega, fechasMensualidades };
  };

  const pagosCalculados = calcularPagos();
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
          width: '60%', // Puedes ajustarlo a tu preferencia
          maxHeight: '80vh', // 🔹 Altura máxima del 80% de la pantalla
          bgcolor: 'white',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflowY: 'auto', // 🔹 Habilita el scroll si el contenido es extenso
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
          <Typography  sx={{ color: 'var(--primary-color)' }}>{unidad.numerounidad}</Typography>

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
          <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mb: 1 }}>Selecciona un plan:</Typography>
          <Select
            fullWidth
            value={selectedPlan?.name || ""}
            onChange={handlePlanChange}
            displayEmpty
          >
            <MenuItem value="" disabled>Selecciona un plan</MenuItem>
            {proyecto.paymentPlans.map((plan, index) => (
              <MenuItem key={index} value={plan.name}>{plan.name}</MenuItem>
            ))}
          </Select>

          {/* Resultados financieros */}
          {selectedPlan && (
            <>
              <Box sx={{ mt: 3, p: 2, background: "#f9f9f9", borderRadius: 2, boxShadow: 1 }}>
                <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Pago Inicial:</Typography>
                <Typography>${pagosCalculados.pagoInicial.toFixed(2)}</Typography>

                <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Mensualidad:</Typography>
                <Typography>${pagosCalculados.mensualidad.toFixed(2)}</Typography>

                <Typography sx={{ color: 'var(--primary-color)', fontWeight: 'bold', mt: 1 }}>Pago Contraentrega:</Typography>
                <Typography>${pagosCalculados.pagoContraentrega.toFixed(2)}</Typography>
              </Box>

              {/* Tabla de mensualidades */}
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
                          <TableCell>${pago.monto.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Box>
        <CustomButton
          text="Descargar PDF"
          onClick={() => handleDownloadPDF(proyecto,unidad,selectedPlan)}
        />
      </Box>
    </Modal>
  );
};

export default CotizadorModal;
