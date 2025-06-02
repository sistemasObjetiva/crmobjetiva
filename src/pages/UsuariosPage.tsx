import React, { useState } from "react";
import { useAuthRole } from "../config/auth.tsx";
import { deleteUsuario,  useFetchUsuarios } from "../hooks/useFetchFunctions.tsx"; 

import {
  Tabs,Tab,Box,Table,Toolbar,IconButton,TableContainer,TableBody,TableCell,TableRow,TableHead,Paper,Typography,Alert, // Importa el componente Alert de MUI
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";
import CreateIcon from "@mui/icons-material/Create";
import HeaderContainer from "../components/Header";
import FooterContainer from "../components/Footer";
import UsuarioModal from "../components/UsuarioModal.tsx";
import DialogComponent from "../components/DialogComponent";
import CustomButton from '../components/CustomButton.tsx';
import { icons } from "../config/variables";
import { Usuario } from "../types/types.tsx"; 

import '../styles/global.css';
import '../styles/UsuariosPage.css';

const title = "Usuarios";


const Usuarios: React.FC = () => {
    const { usuarios, fetchUsuarios } = useFetchUsuarios();
    const { role, loading } = useAuthRole();

    const [selectedView, setSelectedView] = useState<number>(0);
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    const [isNewUser, setIsNewUser] = useState<boolean>(false); // Estado para controlar si es nuevo usuario
    const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState<boolean>(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  //--------------------------ALERTAS-------------------------------------------------
   // Estados para las alertas en la página Usuarios
   const [showAlert, setShowAlert] = useState<boolean>(false);
   const [alertMessage, setAlertMessage] = useState<string>("");
   const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("info");
  //-------------------------------------------------------------------------------------------------
  
  
    if (loading) return <p>Cargando...</p>;
  // Función para mostrar una alerta en la página padre
  const showAlertMessage = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000); // La alerta se cierra después de 3 segundos
  };

  // Función para cambiar la pestaña seleccionada
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

  // Abrir modal para nuevo usuario
  const openUsuarioModal = () => {
    setUsuario({ id: "", nombreCompleto: "", correoElectronico: "", rol: "Usuario",empresa:"",contrasena:"" });
    setIsNewUser(true); // Indicamos que es un nuevo usuario
    setIsUsuarioModalOpen(true);
  };

  // Abrir modal de usuario existente
  const handleAbrirUsuario = (usuario: Usuario) => {
    setUsuario(usuario);
    setIsNewUser(false); // Indicamos que no es un nuevo usuario (es edición)
    setIsUsuarioModalOpen(true);
  };

  // Cerrar modal de usuario
  const closeUsuarioModal = (success?: boolean, message?: string) => {
    fetchUsuarios();
    setIsUsuarioModalOpen(false);
    setUsuario(null);
    setIsNewUser(false); // Resetear el estado de nuevo usuario al cerrar la modal
    if (success && message) {
      showAlertMessage(message, "success");
    } else if (!success && message) {
      showAlertMessage(message, "error");
    }
  };

  // Confirmar eliminación
  const handleOpenConfirmDialog = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setUsuarioToDelete(null);
  };
  const handleDeleteUsuario = async () => {
    if (!usuarioToDelete) return;

    const result = await deleteUsuario(usuarioToDelete.id);
    if (result?.success) {
      fetchUsuarios();
      showAlertMessage("Usuario eliminado correctamente", "success");
    } else if (result?.message) {
      showAlertMessage(`Error al eliminar usuario: ${result.message}`, "error");
    } else {
      showAlertMessage("Error al eliminar el usuario", "error");
    }
  setOpenConfirmDialog(false);
  };
  
  return (
    <>
      <div className="mainContainer">
        <HeaderContainer title={title} icon={icons.iconoUsuarios} userRole={role} />

        <div className="contentContainer">
          <div className="tabSelector-container-fixed">
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={selectedView} onChange={handleViewChange} variant="scrollable" scrollButtons="auto">
                <Tab label="Usuarios" sx={{textTransform: 'none' }}/>
              </Tabs>
            </Box>
          </div>
          {showAlert && (
            <Alert severity={alertSeverity} onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
              {alertMessage}
            </Alert>
          )}
          {selectedView === 0 && (
            <>
              <Box className="usuarios-list" sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
                  <CustomButton
                    onClick={openUsuarioModal}
                    text="Nuevo usuario"
                    icon={<span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>}
                    sx={{ textTransform: 'none' ,
                      '&:focus': { // Estilos para cuando el botón tiene el foco
                        outline: 'none', // Opcional: quitar el outline predeterminado
                      } }} />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', padding: 1 }}>
                <TableContainer component={Paper} className="user-table" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <Table stickyHeader>
                    <TableHead className="sticky-header" >
                      <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '16px', color: 'white', backgroundColor: '#002855' } }}>
                        <TableCell>Nombre completo</TableCell>
                        <TableCell>Correo electrónico</TableCell>
                        <TableCell>Celular</TableCell>
                        {role === "Gerente" && <TableCell>Rol</TableCell>}
                        {role === "Gerente" && <TableCell>Acciones</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usuarios.map((usuario) => (
                        <TableRow key={usuario.id} onClick={() => handleAbrirUsuario(usuario)} style={{ cursor: "pointer" }}>
                          <TableCell>{usuario.nombreCompleto}</TableCell>
                          <TableCell>{usuario.correoElectronico}</TableCell>
                          <TableCell>{usuario.celular || "N/A"}</TableCell>
                          {role === "Gerente" && <TableCell>{usuario.rol}</TableCell>}
                          {role === "Gerente" && (
                            <TableCell>
                              <IconButton color="inherit" onClick={() => handleAbrirUsuario(usuario)}>
                                <CreateIcon />
                              </IconButton>
                              <IconButton color="error" onClick={(event) => {
                                event.stopPropagation(); // Detiene la propagación del evento
                                handleOpenConfirmDialog(usuario);
                              }}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <UsuarioModal 
                  usuario={usuario} 
                  open={isUsuarioModalOpen} 
                  onClose={closeUsuarioModal} 
                  setUsuario={setUsuario}  
                  fetchUsuarios={fetchUsuarios} 
                  isNewUser={isNewUser} // Pasamos la prop isNewUser
                />

              </Box>

              <DialogComponent
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                onConfirm={handleDeleteUsuario}
                title="¿Estás seguro de eliminar este usuario?"
                message={`Esta acción eliminará permanentemente a ${usuarioToDelete?.nombreCompleto}. ¿Deseas continuar?`}
              />
            </>
          )}
        </div>
        <FooterContainer />
      </div>
    </>
  );
};

export default Usuarios;
