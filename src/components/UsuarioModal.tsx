import React from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CustomButton from "./CustomButton";
import { Usuario } from "../types/types.tsx"; 
import { useAuthRole } from "../config/auth.tsx";
import { actualizarUsuario } from "../hooks/useFetchFunctions.tsx"; 

// Definimos los props del componente
interface UsuarioModalProps {
  usuario: Usuario | null;
  open: boolean;
  onClose: () => void;
  setUsuario: React.Dispatch<React.SetStateAction<Usuario | null>>; 
  fetchUsuarios: () => void; 
}


const UsuarioModal: React.FC<UsuarioModalProps> = ({ usuario, open, onClose, setUsuario,fetchUsuarios }) => {
  const { role } = useAuthRole();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!usuario) return;
    const { name, value } = e.target;
    setUsuario((prevUsuario) => prevUsuario ? { ...prevUsuario, [name]: value } : prevUsuario);

  };
  

  const handleActualizarUsuario = async () => {
    if (!usuario || !role) return;
    console.log(usuario)
   await actualizarUsuario(usuario,role);
    fetchUsuarios()
    onClose()
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
        <IconButton sx={{ position: "absolute", top: 8, right: 8 }} onClick={onClose}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ textAlign: "center", marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <Typography sx={{ mb: 2, textAlign: "center", color: "var(--primary-color)", fontWeight: "bold" }}>
            {usuario?.nombreCompleto || "Usuario"}
          </Typography>
        </Box>

        <Box sx={{ padding: 2 }}>
          <Grid container spacing={2}>
            {/* Primera columna */}
            <Grid item xs={12} sm={6}>
              <TextField sx={{ mb: 2 }} label="Folio Usuario" value={usuario?.id || ""} disabled variant="outlined" fullWidth />
              <TextField
                sx={{ mb: 2 }}
                label="Nombre Completo"
                name="nombreCompleto"
                value={usuario?.nombreCompleto || ""}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>

            {/* Segunda columna */}
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{ mb: 2 }}
                label="Correo Electrónico"
                name="correoElectronico"
                value={usuario?.correoElectronico || ""}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                sx={{ mb: 2 }}
                label="Celular"
                name="celular"
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
            <TextField
              sx={{ mb: 2 }}
              label="Contraseña"
              name="contrasena"
              value={usuario?.contrasena || ""}
              onChange={handleInputChange}
              fullWidth
            />
            </Grid>

            {/* Sección de Rol */}
            <Grid item xs={12}>
              <Typography sx={{ color: "var(--primary-color)", mb: 1, fontSize: "14px", fontWeight: "bold" }}>Rol</Typography>
              <FormGroup row>
              <FormControlLabel
                  sx={{ color: "var(--primary-color)" }}
                  control={
                    <Checkbox
                      checked={usuario?.rol === "Gerente"}
                      onChange={() => usuario && setUsuario({ ...usuario, rol: "Gerente" })}
                      name="rol"
                    />
                  }
                  label="Gerente"
                />
                <FormControlLabel
                  sx={{ color: "var(--primary-color)" }}
                  control={
                    <Checkbox
                      checked={usuario?.rol === "Usuario"}
                      onChange={() => usuario && setUsuario({ ...usuario, rol: "Usuario" })}
                      name="rol"
                    />
                  }
                  label="Usuario"
                />

              </FormGroup>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ textAlign: "center", marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <CustomButton onClick={handleActualizarUsuario} text="Actualizar Usuario" />
        </Box>
      </Box>
    </Modal>
  );
};

export default UsuarioModal;
