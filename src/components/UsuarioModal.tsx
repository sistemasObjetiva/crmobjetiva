import React, { useState,useEffect, InputHTMLAttributes }from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  FormGroup,
  FormControlLabel,
  Radio,
  Alert,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomButton from "./CustomButton";
import { Usuario } from "../types/types.tsx"; 
import { useAuthRole } from "../config/auth.tsx";
import { actualizarUsuario } from "../hooks/useFetchFunctions.tsx"; 
import { Radio as RadioIcon  } from "@mui/icons-material";
import SaveIcon from '@mui/icons-material/Save';

// Definimos los props del componente
interface UsuarioModalProps {
  usuario: Usuario | null;
  open: boolean;
  onClose: (success?: boolean, message?: string) => void; 
  setUsuario: React.Dispatch<React.SetStateAction<Usuario | null>>; 
  fetchUsuarios: () => void; 
  isNewUser: boolean; // Nueva prop para indicar si es un nuevo usuario
}


const UsuarioModal: React.FC<UsuarioModalProps> = ({ 
  usuario, 
  open, 
  onClose, 
  setUsuario,
  fetchUsuarios,
  isNewUser, // Recibimos la nueva prop
}) => {
  const { role } = useAuthRole();
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!usuario) return;
    const { name, value } = e.target;
    setUsuario((prevUsuario) => prevUsuario ? { ...prevUsuario, [name]: value } : prevUsuario);

  };
  
  const handleActualizarUsuario = async () => {
    if (!usuario || !role) return;
    if (isNewUser==true){
      if (!usuario.correoElectronico || !usuario.nombreCompleto || !usuario.contrasena) {
        setWarningMessage("Por favor completa todos los campos obligatorios (*)");
        return;
      }
    }
    else{
      if (!usuario.correoElectronico || !usuario.nombreCompleto) {
        setWarningMessage("Por favor completa todos los campos obligatorios (*)");
        return;
      }
    }
    
    try {
      const result = await actualizarUsuario(usuario, role, isNewUser); // Pasamos el valor de isNewUser
      if (result) { // Comprobamos si result no es null
        if (result.success) {
          fetchUsuarios();
          onClose(true, isNewUser ? "Usuario guardado correctamente" : "Usuario actualizado correctamente"); // Llama a onClose con éxito y mensaje
          setErrorMessage(null);
        } else if (result.message) {
            setErrorMessage(result.message);
            onClose(false, result.message); // Llama a onClose con error y mensaje
        }
      } else {
          // Manejamos el caso donde result es null (por ejemplo, debido a la validación en el hook)
          console.error("La función actualizarUsuario devolvió null.");
          setErrorMessage("Error al procesar la respuesta del servidor.");
          onClose(false, "Error al procesar la respuesta del servidor.");
        }
  } catch (error: any) {
      setErrorMessage(`Hubo un error al actualizar el usuario: ${error.message}`);
      onClose(false, `Hubo un error al actualizar el usuario: ${error.message}`);
      }
};

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return; 
        onClose(false);
      }}
      disableEnforceFocus
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          bgcolor: "white",
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          outline: "none",
          maxHeight: "80%",
          overflowY: "auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <IconButton sx={{ position: "absolute", top: 8, right: 8 }} onClick={() => onClose(false)}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center", marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <Typography sx={{ mb: 2, textAlign: "center", color: "var(--primary-color)", fontWeight: "bold" }}>
            {usuario?.nombreCompleto || "Usuario"}
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
        <Box sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            {/* Primera columna */}
            <Grid item xs={12} sm={6}>
              <TextField 
                sx={{ mb: 2 }} 
                label="Folio usuario" 
                value={usuario?.id || ""} 
                disabled 
                variant="outlined" fullWidth />
              <TextField
                sx={{ mb: 2 }}
                label="Nombre completo"
                name="nombreCompleto"
                required
                value={usuario?.nombreCompleto || ""}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                sx={{ mb: 2 }}
                label="Correo electrónico"
                name="correoElectronico"
                required
                value={usuario?.correoElectronico || ""}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            {/* Segunda columna */}
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{ mb: 2 }}
                label="Celular"
                name="celular"
                type="tel"
                value={usuario?.celular || ""}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
              sx={{ mb: 2 }}
              label="Empresa"
              name="empresa"
              value={usuario?.empresa || ""}
              onChange={handleInputChange}
              fullWidth
            />
            {isNewUser && (
            <TextField
              sx={{ mb: 2 }}
              label="Contraseña"
              name="contrasena"
              required
              type="password"
              value={usuario?.contrasena || ""}
              onChange={handleInputChange}
              fullWidth
            />
          )}
            </Grid>

            {/* Sección de Rol */}
            <Grid item xs={12}>
              <Typography sx={{ color: "var(--primary-color)", mb: 1, fontSize: "14px", fontWeight: "bold" }}>Rol</Typography>
              <FormGroup row>
              <FormControlLabel
                  sx={{ color: "var(--primary-color)" }}
                  control={
                    <Radio
                      checked={usuario?.rol === "Gerente"}
                      onChange={() => usuario && setUsuario({ ...usuario, rol: "Gerente" })}
                      value="Gerente"
                      name="rol"
                      inputProps={{ 'aria-label': 'A' }}
                    />
                  }
                  label="Gerente"
                />
                <FormControlLabel
                  sx={{ color: "var(--primary-color)" }}
                  control={
                    <Radio
                      checked={usuario?.rol === "Usuario"}
                      onChange={() => usuario && setUsuario({ ...usuario, rol: "Usuario" })}
                      value="Usuario"
                      name="rol"
                      inputProps={{ 'aria-label': 'A' }}
                    />
                  }
                  label="Vendedor"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ textAlign: "center", marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <CustomButton onClick={handleActualizarUsuario} text="Guardar usuario" icon={<SaveIcon />} 
          sx={{ minWidth: '150px', padding: '8px 10px', textTransform: 'none',
            backgroundColor: '#2ca58d', '&:hover': {
              backgroundColor: '#002855', // Un tono más oscuro al pasar el ratón
            },
           }}/>
          <Button onClick={() => onClose(false)} sx={{ fontWeight: 'bold', fontSize: '16px',mr: 2, textTransform: 'none' }}> Cancelar</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UsuarioModal;
