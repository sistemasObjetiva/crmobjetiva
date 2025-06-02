import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  Autocomplete,
  MenuItem,
  TableContainer,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Button,
  Alert, // Importa Alert
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import CustomButton from '../components/CustomButton';
import SaveIcon from '@mui/icons-material/Save';
import { ListasDesplegables } from '../config/variables';
import { useFetchClientes,useFetchProyectos,actualizarSeguimiento } from "../hooks/useFetchFunctions.tsx"; 

import  { fechaActual } from '../hooks/useDateUtils';
import { Seguimiento } from '../types/types';

interface SeguimientoModalProps {
  seguimiento: Seguimiento | null;
  email:string | null;
  role:string | null;
  open: boolean;
  onClose: (success?: boolean, message?: string) => void; // Modifica el tipo de onClose para recibir parámetros
  setSeguimiento: (seguimiento: Seguimiento | null) => void;
}

const SeguimientoModal: React.FC<SeguimientoModalProps> = ({ seguimiento, open, onClose, setSeguimiento, email,role }) => {

    const { clientes = [] } = useFetchClientes();

    const { proyectos = [] } = useFetchProyectos();

    const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
    // Estados para las alertas dentro del modal
    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const showAlertMessage = (message: string, severity: "success" | "error" | "warning" | "info") => {
      setErrorMessage(severity === 'error' ? message : null);
      setWarningMessage(severity === 'warning' ? message : null);
    };
    useEffect(() => {
      if (open) {
        setWarningMessage(null); // limpia el mensaje al abrir el modal
        setErrorMessage(null);
      }
    }, [open]);
  
    useEffect(() => {
      if (role === "Gerente") {
        setClientesFiltrados(clientes);
      } else {
        setClientesFiltrados(clientes.filter(cliente => cliente.correoUsuario === email));
      }
    }, [clientes, role, email]);
  
    const actualizacionesArray = React.useMemo(() => {
      let val = seguimiento?.actualizaciones;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch (e) {
          console.error("No se pudo parsear actualizaciones:", e);
          val = [];
        }
      }
      return Array.isArray(val) ? val : [];
    }, [seguimiento]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSeguimiento(seguimiento ? { ...seguimiento, [name]: value } : null);
    };

    const handleActualizarSeguimiento = async (seguimientoParaGuardar: Seguimiento, emailUsuario: string) => {
      if (!seguimientoParaGuardar || !emailUsuario) {
        showAlertMessage("No hay usuario autenticado o seguimiento no válido.", "error");
        return;
      }
      if (!seguimientoParaGuardar.cliente || !seguimientoParaGuardar.proyectoInteres || !seguimientoParaGuardar.estatusSeguimiento) {
        showAlertMessage("Por favor completa todos los campos obligatorios (*).", "warning");
        return;
      }
  
      const correoUsuarioFinal = seguimientoParaGuardar.correoUsuario || emailUsuario;
  
      const updatedSeguimiento: Seguimiento = {
        ...seguimientoParaGuardar,
        correoUsuario: correoUsuarioFinal,
        fechaCreacion: seguimientoParaGuardar.fechaCreacion || fechaActual,
        fechaActualizacion: fechaActual,
        fechaProximoSeguimiento: seguimientoParaGuardar.fechaProximoSeguimiento ? (seguimientoParaGuardar.fechaProximoSeguimiento) : "",
      };
  
      try {
        const result = await actualizarSeguimiento(updatedSeguimiento);
        if (result?.error) {
          showAlertMessage(result.error, "error");
        } else if (result?.success) {
          showAlertMessage(result.success, "success");
          onClose(true, result.success); // Llama a onClose con éxito y mensaje
        } else {
          showAlertMessage("Error al guardar el seguimiento.", "error");
          onClose(false, "Error al guardar el seguimiento."); // Llama a onClose con error
        }
      } catch (error: any) {
        showAlertMessage(`Error inesperado al guardar el seguimiento: ${error}`, "error");
        onClose(false, `Error inesperado al guardar el seguimiento: ${error}`); // Llama a onClose con error
      }
    };


  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEnforceFocus
    >
      <Box
        sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80%', bgcolor: 'white', boxShadow: 24, p: 4, borderRadius: 2,
          outline: 'none', maxHeight: '80%', overflowY: 'auto',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={() => onClose(false)} >
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center", marginTop: "20px" }}>
          <Typography sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Seguimiento
          </Typography>
        </Box>
        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {warningMessage && (
          <Alert severity="warning" onClose={() => setWarningMessage(null)} sx={{ mb: 2 }}>
            {warningMessage}
          </Alert>
        )}
        <Box sx={{ padding: 2 }}>
        <Grid container spacing={2}>
          {/* Campo de Folio Seguimiento */}
          <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
            <TextField
              fullWidth
              sx={{ mb: "15px" }}
              InputLabelProps={{
                shrink: true,
                sx: { fontSize: "14px" },
              }}
              label="Folio Seguimiento"
              value={seguimiento?.id || ""}
              disabled
              variant="outlined"
            />
          </Grid>

          {/* Select de Cliente */}
          <Grid item xs={12} sm={6} sx={{ mb: "15px" }}> 
            <Autocomplete
              fullWidth
              options={clientesFiltrados}
              getOptionLabel={(option) => option.nombreCompleto || ""}
              value={clientesFiltrados.find((cliente) => cliente.id === seguimiento?.idCliente) || null} // Busca el cliente en la lista
              onChange={(_, newValue) =>
                setSeguimiento(seguimiento
                  ? { ...seguimiento, idCliente: newValue?.id || "", cliente: newValue?.nombreCompleto || "" }
                  : null
                )
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar cliente"
                  variant="outlined"
                  required
                  InputLabelProps={{
                    shrink: true,
                    sx: { fontSize: "14px" },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

          {/* Proyecto y Unidad de Interés */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
            <Autocomplete
              options={proyectos} // Lista de proyectos
              getOptionLabel={(option) => option.nombreProyecto} // Mostrar el nombre del proyecto
              value={proyectos.find((p) => p.nombreProyecto === seguimiento?.proyectoInteres) || null} // Busca el proyecto actual
              onChange={(_, newValue) => 
                setSeguimiento(seguimiento ? { ...seguimiento, proyectoInteres: newValue?.nombreProyecto || "" } : null)
              } // ✅ Corrige el evento y el valor seleccionado
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Seleccionar proyecto"
                  variant="outlined"
                />
              )}
            />

            </Grid>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                fullWidth
                label="Unidad intéres"
                name="unidadInteres"
                value={seguimiento?.unidadInteres || ""}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>

          {/* Forma de Pago y Capacidad de Pago */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                select
                fullWidth
                label="Forma de pago"
                name="formaDePago"
                value={seguimiento?.formaDePago || ""}
                onChange={handleInputChange}
              >
                {ListasDesplegables.FormaDePago.map((opcion, index) => (
                  <MenuItem key={index} value={opcion}>
                    {opcion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                select
                fullWidth
                label="Capacidad de pago"
                name="capacidadDePago"
                value={seguimiento?.capacidadDePago || ""}
                onChange={handleInputChange}
              >
                {ListasDesplegables.CapacidadDePago.map((opcion, index) => (
                  <MenuItem key={index} value={opcion}>
                    {opcion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                select
                fullWidth
                label="Temperatura de interés"
                name="temperaturaInteres"
                value={seguimiento?.temperaturaInteres || ""}
                onChange={handleInputChange}
              >
                {ListasDesplegables.TemperaturaDeInteres.map((opcion, index) => (
                  <MenuItem key={index} value={opcion}>
                    {opcion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                select
                fullWidth
                label="Estatus del seguimiento"
                name="estatusSeguimiento"
                value={seguimiento?.estatusSeguimiento || ""}
                onChange={handleInputChange}
                required
              >
                {ListasDesplegables.EstatusSeguimiento.map((opcion, index) => (
                  <MenuItem key={index} value={opcion}>
                    {opcion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: "15px" }}>
              <TextField
                fullWidth
                label="Comentarios"
                name="comentarios"
                value={seguimiento?.comentarios || ""}
                multiline
                rows={4}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: "15px" }}>
              <TextField
                fullWidth
                label="Fecha de próximo seguimiento"
                type="date"
                variant="outlined"
                name="fechaProximoSeguimiento"
                value={seguimiento?.fechaProximoSeguimiento ? (seguimiento.fechaProximoSeguimiento) : ""}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ mb: "15px" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Historial de actualizaciones
              </Typography>
              <TableContainer component={Paper} style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '14px', color: 'white', backgroundColor: '#002855' } }}>
                      <TableCell align="center">Fecha</TableCell>
                      <TableCell align="center">Comentarios</TableCell>
                      <TableCell align="center">Temperatura</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                  {actualizacionesArray.map((actualizacion, index) => (
                      <TableRow key={index}>
                        <TableCell>{(actualizacion.fechaActualizacion)}</TableCell>
                        <TableCell>{actualizacion.comentarios}</TableCell>
                        <TableCell>{actualizacion.temperaturaInteres}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ textAlign: "center", marginTop: "20px" }}>
          <CustomButton 
              onClick={() => {
                if (seguimiento&&email) {
                  handleActualizarSeguimiento(seguimiento, email);
                } }} icon={<SaveIcon />}
              text="Guardar seguimiento" sx={{ minWidth: '150px', padding: '8px 10px', textTransform: 'none',
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

export default SeguimientoModal;
