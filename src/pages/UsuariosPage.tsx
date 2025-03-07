import React, { useState } from "react";
import { useAuthRole } from "../config/auth.tsx";
import { deleteUsuario,  useFetchUsuarios } from "../hooks/useFetchFunctions.tsx"; 

import {
  Tabs,
  Tab,
  Box,
  Table,
  Toolbar,
  IconButton,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Paper,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from "@mui/icons-material/Delete";

import HeaderContainer from "../components/Header";
import FooterContainer from "../components/Footer";
import UsuarioModal from "../components/UsuarioModal.tsx";
import DialogComponent from "../components/DialogComponent";
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

    
    const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState<boolean>(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
    const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  
  
    if (loading) return <p>Cargando...</p>;

  // Función para cambiar la pestaña seleccionada
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

  // Abrir modal para nuevo usuario
  const openUsuarioModal = () => {
    setUsuario({ id: "", nombreCompleto: "", correoElectronico: "", rol: "Usuario",empresa:"",contrasena:"" });
    setIsUsuarioModalOpen(true);
  };

  // Abrir modal de usuario existente
  const handleAbrirUsuario = (usuario: Usuario) => {
    setUsuario(usuario);
    setIsUsuarioModalOpen(true);
  };

  // Cerrar modal de usuario
  const closeUsuarioModal = () => {
    fetchUsuarios();
    setIsUsuarioModalOpen(false);
    setUsuario({
        id:"",
        nombreCompleto: "",
        correoElectronico: "",
        celular: "",
        rol: "Usuario",
        empresa:"",
        contrasena:"" 
      });
       
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

     await deleteUsuario(usuarioToDelete.id);
     fetchUsuarios(); 
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
                <Tab label="Usuarios" />
              </Tabs>
            </Box>
          </div>

          {selectedView === 0 && (
            <>
              <Box className="usuarios-list">
                <Toolbar className="barra-iconos">
                  <IconButton onClick={openUsuarioModal} className="icono-usuario">
                    <PersonIcon style={{ color: "white" }} />
                    <Typography style={{ color: "white" }}>Nuevo Usuario</Typography>
                  </IconButton>
                </Toolbar>

                <TableContainer component={Paper} className="user-table" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <Table stickyHeader>
                    <TableHead className="sticky-header">
                      <TableRow>
                        <TableCell>Nombre Completo</TableCell>
                        <TableCell>Correo Electrónico</TableCell>
                        <TableCell>Celular</TableCell>
                        {role === "Gerente" && <TableCell>Rol</TableCell>}
                        {role === "Gerente" && <TableCell></TableCell>}
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
                              <IconButton color="error" onClick={() => handleOpenConfirmDialog(usuario)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <UsuarioModal usuario={usuario} open={isUsuarioModalOpen} onClose={closeUsuarioModal} setUsuario={setUsuario}  fetchUsuarios={fetchUsuarios} />

              </Box>

              <DialogComponent
                open={openConfirmDialog}
                onClose={handleCloseConfirmDialog}
                onConfirm={handleDeleteUsuario}
                title="¿Estás seguro?"
                message={`¿Seguro que deseas eliminar a ${usuarioToDelete?.nombreCompleto}? Esta acción no se puede deshacer.`}
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
