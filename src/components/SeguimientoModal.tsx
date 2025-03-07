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
  TableHead
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';


import CustomButton from '../components/CustomButton';

import { ListasDesplegables } from '../config/variables';
import { useFetchClientes,useFetchProyectos,actualizarSeguimiento } from "../hooks/useFetchFunctions.tsx"; 

import  { fechaActual } from '../hooks/useDateUtils';
import { Seguimiento } from '../types/types';

interface SeguimientoModalProps {
  seguimiento: Seguimiento | null;
  email:string | null;
  role:string | null;
  open: boolean;
  onClose: () => void;
  setSeguimiento: (seguimiento: Seguimiento | null) => void;
}


const SeguimientoModal: React.FC<SeguimientoModalProps> = ({ seguimiento, open, onClose, setSeguimiento, email,role }) => {

    const { clientes = [] } = useFetchClientes();

    const { proyectos = [] } = useFetchProyectos();

    const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);

    useEffect(() => {
      if (role === "Gerente") {
        setClientesFiltrados(clientes); // Muestra todos los clientes si es Gerente
      } else {
        setClientesFiltrados(clientes.filter(cliente => cliente.correoUsuario === email));
      }
    }, [clientes, role, email]); // 🔄 Se ejecuta cada vez que cambian los clientes, el rol o el email


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setSeguimiento(seguimiento ? { ...seguimiento, [name]: value } : null);
    };

  const handleActualizarSeguimiento = async (seguimiento: Seguimiento,  email: string) => {
  if (!seguimiento) {
    alert("❌ No hay usuario autenticado o seguimiento no válido.");
    return;
  }

  // ✅ Respeta el correoUsuario si ya existe, de lo contrario usa el email proporcionado
  const correoUsuarioFinal = seguimiento.correoUsuario || email;

  const updatedSeguimiento: Seguimiento = {
    ...seguimiento,
    correoUsuario: correoUsuarioFinal, // 👈 Mantiene el original o asigna el nuevo
    fechaCreacion: seguimiento.fechaCreacion || fechaActual,
    fechaActualizacion: fechaActual,
    fechaProximoSeguimiento: seguimiento.fechaProximoSeguimiento
      ? (seguimiento.fechaProximoSeguimiento)
      : "",
  };

  try {
    const result = await actualizarSeguimiento(updatedSeguimiento);
    if (result.error) {
      alert(`❌ ${result.error}`);
    } else {
      alert(`✅ ${result.success}`);
      onClose();
    }
  } catch (error) {
    alert("❌ Error inesperado al guardar el seguimiento: " + error);
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
        <IconButton sx={{ position: 'absolute', top: 8, right: 8 }} onClick={onClose}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center", marginTop: "20px" }}>
          <Typography sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Seguimiento
          </Typography>
        </Box>

        <Box sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
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
          </Grid>

          {/* Select de Cliente */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} sx={{ mb: "15px" }}>
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
                    label="Seleccionar Cliente"
                    variant="outlined"
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
                  label="Seleccionar Proyecto"
                  variant="outlined"
                />
              )}
            />

            </Grid>
            <Grid item xs={12} sm={6} sx={{ mb: "15px" }}>
              <TextField
                fullWidth
                label="Unidad Interes"
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
                label="Forma de Pago"
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
                label="Capacidad de Pago"
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
            <Grid item xs={12} sm={12} sx={{ mb: "15px" }}>
              <TextField
                select
                fullWidth
                label="Temperatura Interés"
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
                label="Fecha Próximo Seguimiento"
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
                Historial de Actualizaciones
              </Typography>
              <TableContainer component={Paper} style={{ maxHeight: "300px", overflowY: "auto" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Comentarios</TableCell>
                      <TableCell>Temperatura</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seguimiento?.actualizaciones?.map((actualizacion, index) => (
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

        {/* Botón Actualizar */}
        <Box sx={{ textAlign: "center", marginTop: "20px" }}>
          <CustomButton
            onClick={() => {
              if (seguimiento&&email) {
                handleActualizarSeguimiento(seguimiento, email);
              } else {
                alert("❌ No hay seguimiento válido.");
              }
            }}
            text={"Actualizar Seguimiento"}
          />

        </Box>
      </Box>
    </Modal>
  );
};

export default SeguimientoModal;
