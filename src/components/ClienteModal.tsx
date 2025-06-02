import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Paper,
  Table,
  Button,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ListasDesplegables } from '../config/variables';
import CustomButton from './CustomButton';
import { Cliente } from '../types/types';
import SaveIcon from '@mui/icons-material/Save';
import { useFetchProyectos,useFetchSeguimientos,actualizarCliente } from "../hooks/useFetchFunctions.tsx"; 

interface ClienteModalProps {
  cliente: Cliente | null;
  email: string | null;
  open: boolean;
  onClose: (success?: boolean, message?: string) => void; 
  fetchClientes: () => void;
  setCliente: React.Dispatch<React.SetStateAction<Cliente | null>>;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, open, onClose, fetchClientes, setCliente,email }) => {

  const { proyectos = [] } = useFetchProyectos();
  const { seguimientos = [] } = useFetchSeguimientos();
  //----------**ALERTAS**-------------------------------------------------------------
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setWarningMessage(null); // limpia el mensaje al abrir el modal
      setErrorMessage(null);
    }
  }, [open]);
  //----------------**TERMINAN ALERTAS**------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (cliente) {
      setCliente({ ...cliente, [name]: value });
    }
  };
  
  const handleActualizarCliente = async (cliente: Cliente) => {
    if (!cliente || !email) return;
    if (!cliente.nombreCompleto || !cliente.celular || !email) {
      setWarningMessage("Por favor completa todos los campos obligatorios (*)");
        return;
    }
    try {
      console.log(cliente, email);
      const result = await actualizarCliente(cliente, email); // Llamamos la función de actualización
      if (result) {
        if (result.success) {
          fetchClientes(); // Asumo que tienes una función para recargar la lista de clientes
          onClose(true, "Cliente actualizado correctamente"); // Cierra el modal con mensaje de éxito
          setErrorMessage(null);
        } else if (result.message) {
          setErrorMessage(result.message);
          onClose(false, result.message); // Cierra el modal con mensaje de error
        }
      } else {
        // Manejamos el caso donde result es null
        console.error("La función actualizarCliente devolvió null.");
        setErrorMessage("Error al procesar la respuesta del servidor.");
        onClose(false, "Error al procesar la respuesta del servidor.");
      }
    } catch (error: any) {
      setErrorMessage(`Hubo un error al actualizar el cliente: ${error.message}`);
      console.error("Error al actualizar cliente:", error);
      onClose(false, `Hubo un error al actualizar el cliente: ${error.message}`);
    }
  };

  const handleProyectoChange = (nombreProyecto: string) => {
    setCliente((prevCliente) => {
      if (!prevCliente) return prevCliente; // Si prevCliente es null, no hacer nada
      const proyectosInteres: string[] = prevCliente.proyectosInteres || [];
      return {
        ...prevCliente,
        proyectosInteres: proyectosInteres.includes(nombreProyecto)
          ? proyectosInteres.filter((proyecto: string) => proyecto !== nombreProyecto) // Asegurar que proyecto es string
          : [...proyectosInteres, nombreProyecto], // Si no está, lo agrega
      };
    });
  };
  
  const [seguimientosCliente, setSeguimientosCliente] = useState<typeof seguimientos>([]);

  useEffect(() => {
    if (cliente?.id) {
      const seguimientosFiltrados = seguimientos.filter((s) => s.idCliente === cliente.id);
      setSeguimientosCliente(seguimientosFiltrados);
    } else {
      setSeguimientosCliente([]); // Si no hay cliente, reseteamos la lista
    }
  }, [cliente, seguimientos]);

  console.log(seguimientosCliente);

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return; // Evitar cierre por clic en el fondo
        onClose(false);
      }}
      disableEnforceFocus 
    >
      <Box
        sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', bgcolor: 'white', boxShadow: 24, p: 4, borderRadius: 2, outline: 'none', maxHeight: '80%', overflowY: 'auto', }}
        onClick={(event) => event.stopPropagation()}
      >        
        <IconButton sx={{ position: 'absolute', top: 8, right: 8,}}
          onClick={() => onClose(false)}         
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center",  marginTop: "20px",  color: "red", fontWeight: "bold", }} >
            <Typography  sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)' ,fontWeight: 'bold' }}>
            {cliente?.nombreCompleto || "Cliente"}
            </Typography>
        </Box>
        {/* Alerta si hay error */}
          {warningMessage && (
            <Alert severity="warning" onClose={() => setWarningMessage(null)} sx={{ mb: 2 }}>
              {warningMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

        <Box sx={{ textAlign: "center", marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <Box sx={{ padding: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} >
                <TextField
                  fullWidth
                  InputLabelProps={{
                    shrink: true, // Asegura que el label se posicione correctamente
                    sx: { fontSize: "14px" },
                  }}
                  label="Folio cliente"
                  value={cliente?.id}
                  disabled
                  variant="outlined"
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre completo"
                  name="nombreCompleto"
                  required
                  value={cliente?.nombreCompleto || ""}
                  onChange={handleInputChange}
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  name="correoElectronico"
                  value={cliente?.correoElectronico || ""}
                  onChange={handleInputChange}
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Celular"
                  name="celular"
                  required
                  value={cliente?.celular || ""}
                  onChange={handleInputChange}
                  sx={{ mb: "15px" }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
                {/* Ocupación Cliente */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Ocupación cliente"
                    name="ocupacionCliente"
                    value={cliente?.ocupacionCliente || ''}
                    onChange={handleInputChange}
                  >
                    {[
                      "Empleado",
                      "Empresario",
                      "Freelancer",
                      "Jubilado",
                      "Otro",
                    ].map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Estado Civil Cliente */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Estado civil"
                    name="edoCivilCliente"
                    value={cliente?.edoCivilCliente || ''}
                    onChange={handleInputChange}
                  >
                    {ListasDesplegables.EstadoCivil.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Clasificación Cliente */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Clasificación cliente"
                    name="clasificacionCliente"
                    value={cliente?.clasificacionCliente || ''}
                    onChange={handleInputChange}
                  >
                    {ListasDesplegables.ClasificacionCliente.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Medio de Captación */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Medio de captación"
                    name="medioCaptacion"
                    value={cliente?.medioCaptacion || ''}
                    onChange={handleInputChange}
                  >
                    {ListasDesplegables.MedioDeCaptacion.map((option, index) => (
                      <MenuItem key={index} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
          </Box>
        </Box>
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color:'var(--primary-color)' }}>
            Seleccionar proyectos de interés
          </Typography>
          {proyectos.map((proyecto, index:number) => (
            <FormControlLabel sx={{
              '& .MuiFormControlLabel-label': {
                color: 'var(--primary-color)', // Cambia este valor por el color deseado
              },
            }}
              key={index}
              control={
                <Checkbox
                  checked={cliente?.proyectosInteres?.includes(proyecto.nombreProyecto) || false} // Verifica si está seleccionado
                  onChange={() => handleProyectoChange(proyecto.nombreProyecto)} // Cambia el estado al hacer clic
                />
              }
              label={proyecto.nombreProyecto} // Muestra el nombre del proyecto
            />
          ))}
        </Box>
        {seguimientosCliente.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Seguimientos del cliente
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '14px', color: 'white', backgroundColor: '#002855' } }}>
                    <TableCell align="center">Folio</TableCell>
                    <TableCell align="center">Fecha creacion</TableCell>
                    <TableCell align="center">Comentarios</TableCell>
                    <TableCell align="center">Fecha seguimiento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimientosCliente.map((seguimiento) => (
                    <TableRow key={seguimiento.id}>
                      <TableCell>{seguimiento.id}</TableCell>
                      <TableCell align="center">{new Date(seguimiento.fechaCreacion).toLocaleDateString()}</TableCell>
                      <TableCell>{seguimiento.comentarios || "Sin comentarios"}</TableCell>
                      <TableCell align="center">{seguimiento.fechaProximoSeguimiento || "Sin registro"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Box sx={{ textAlign: "center",  marginTop: "20px",  color: "red", fontWeight: "bold", }} >
            <CustomButton 
                onClick={() => cliente && handleActualizarCliente(cliente)} icon={<SaveIcon />}
                text="Guardar cliente" sx={{ minWidth: '150px', padding: '8px 10px', textTransform: 'none',
                  backgroundColor: '#2ca58d', '&:hover': {
                    backgroundColor: '#002855', // Un tono más oscuro al pasar el ratón
                  },
                 }}/>
            <Button onClick={() => onClose()} sx={{ fontWeight: 'bold', fontSize: '16px',mr: 2, textTransform: 'none' }}> Cancelar</Button>
        </Box>


      </Box>
    </Modal>
  );
};

export default ClienteModal;
