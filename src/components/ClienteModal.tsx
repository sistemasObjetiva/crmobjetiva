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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ListasDesplegables } from '../config/variables';
import CustomButton from './CustomButton';
import { Cliente } from '../types/types';

import { useFetchProyectos,useFetchSeguimientos,actualizarCliente } from "../hooks/useFetchFunctions.tsx"; 

interface ClienteModalProps {
  cliente: Cliente | null;
  email: string | null;
  open: boolean;
  onClose: () => void;
  setCliente: React.Dispatch<React.SetStateAction<Cliente | null>>;
}

const ClienteModal: React.FC<ClienteModalProps> = ({ cliente, open, onClose, setCliente,email }) => {

    const { proyectos = [] } = useFetchProyectos();
console.log(proyectos )
    const { seguimientos = [] } = useFetchSeguimientos();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (cliente) {
      setCliente({ ...cliente, [name]: value });
    }
  };
  
  const handleActualizarCliente = async (cliente: Cliente) => {
    console.log(cliente)
    if (!cliente || !email) return;

    try {
      await actualizarCliente(cliente,email); // Llamamos la función de actualización
      alert("Cliente actualizado correctamente."); // Mensaje de éxito
      onClose(); // Cierra el modal después de actualizar
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      alert("Error al actualizar el cliente.");
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
        onClose();
      }}
      disableEnforceFocus 
    >
      <Box
        sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', bgcolor: 'white', boxShadow: 24, p: 4, borderRadius: 2, outline: 'none', maxHeight: '80%', overflowY: 'auto', }}
        onClick={(event) => event.stopPropagation()}
      >        
        <IconButton sx={{ position: 'absolute', top: 8, right: 8,}}
          onClick={onClose}          
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center",  marginTop: "20px",  color: "red", fontWeight: "bold", }} >
            <Typography  sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)' ,fontWeight: 'bold' }}>
            {cliente?.nombreCompleto || "Cliente"}
            </Typography>
        </Box>

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
                  label="Folio Cliente"
                  value={cliente?.id}
                  disabled
                  variant="outlined"
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  InputLabelProps={{
                    shrink: true, // Asegura que el label se posicione correctamente
                    sx: { fontSize: "14px" },
                  }}
                  label="Nombre Completo"
                  name="nombreCompleto"
                  value={cliente?.nombreCompleto || ""}
                  onChange={handleInputChange}
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  InputLabelProps={{
                    shrink: true, // Asegura que el label se posicione correctamente
                    sx: { fontSize: "14px" },
                  }}
                  label="Correo Electrónico"
                  name="correoElectronico"
                  value={cliente?.correoElectronico || ""}
                  onChange={handleInputChange}
                  sx={{ mb: "15px" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  InputLabelProps={{
                    shrink: true, // Asegura que el label se posicione correctamente
                    sx: { fontSize: "14px" },
                  }}
                  label="Celular"
                  name="celular"
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
                    label="Ocupación Cliente"
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
                    label="Estado Civil Cliente"
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
                    label="Clasificación Cliente"
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
                    label="Medio de Captación"
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
            Seleccionar Proyectos
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
              Seguimientos del Cliente
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Folio</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Comentarios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimientosCliente.map((seguimiento) => (
                    <TableRow key={seguimiento.id}>
                      <TableCell>{seguimiento.id}</TableCell>
                      <TableCell>{new Date(seguimiento.fechaCreacion).toLocaleDateString()}</TableCell>
                      <TableCell>{seguimiento.comentarios || "Sin comentarios"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}


        
        
        <Box sx={{ textAlign: "center",  marginTop: "20px",  color: "red", fontWeight: "bold", }} >
            <CustomButton 
                onClick={() => cliente && handleActualizarCliente(cliente)} 
                text="Actualizar Cliente"
            />
        </Box>


      </Box>
    </Modal>
  );
};

export default ClienteModal;
