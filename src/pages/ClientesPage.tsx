import React, { useState } from 'react';
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
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { icons } from '../config/variables.tsx';
import CreateIcon from "@mui/icons-material/Create";
import HeaderContainer from '../components/Header.tsx';
import FooterContainer from '../components/Footer.tsx';
import ClienteModal from '../components/ClienteModal.tsx';
import CustomButton from '../components/CustomButton.tsx';
import DialogComponent from '../components/DialogComponent.tsx';

import { useAuthRole } from "../config/auth.tsx";
import { useFetchClientes,deleteCliente } from "../hooks/useFetchFunctions.tsx"; 

import '../styles/global.css';
import '../styles/UsuariosPage.css';

const title = 'Clientes';

const Page: React.FC = () => {
   const { role, user} = useAuthRole();
  const { clientes = [],fetchClientes } = useFetchClientes();

  const [selectedView, setSelectedView] = useState<number>(0);
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };
  
  const [cliente, setCliente] = useState<any>(null);
  const [isClienteModalOpen, setIsClienteModalOpen] = useState<boolean>(false);
  const [isNewCliente, setIsNewCliente] = useState<boolean>(false); // Para distinguir entre crear y editar

  // Estados para las alertas
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "warning" | "info">("info");

  const showAlertMessage = (message: string, severity: "success" | "error" | "warning" | "info") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const openClienteModal = () => {
    setCliente({
      id:  '',
      nombreCompleto: '',
      celular: '',
      correoElectronico: '',
      proyectosInteres: []
    });
    setIsNewCliente(true);
    setIsClienteModalOpen(true);
  };

  const handleAbrirCliente = (clienteParaEditar: any) => {
    setCliente(clienteParaEditar);
    setIsNewCliente(false);
    setIsClienteModalOpen(true);
  };

  const closeClienteModal = (success?: boolean, message?: string) => {
    setIsClienteModalOpen(false);
    setCliente(null);
    fetchClientes();
    if (success && message) {
      showAlertMessage(message, "success");
    } else if (!success && message) {
      showAlertMessage(message, "error");
    }
    setIsNewCliente(false); // Resetear el estado de nuevo cliente
  };

  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [clienteToDelete, setClienteToDelete] = useState<any>(null);

  const handleOpenConfirmDialog = (clienteParaEliminar: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Evita que se ejecute el onClick de la fila
    setClienteToDelete(clienteParaEliminar);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setClienteToDelete(null);
  };

  const handleDeleteCliente = async () => {
    if (!clienteToDelete) return;

    try {
      const result = await deleteCliente(clienteToDelete.id);
      if (result?.success) {
        showAlertMessage(`Cliente ${clienteToDelete.nombreCompleto} eliminado correctamente.`, "success");
      } else if (result?.message) {
        showAlertMessage(`Error al eliminar cliente: ${result.message}`, "error");
      } else {
        showAlertMessage("Error al eliminar el cliente.", "error");
      }
    } catch (error: any) {
      console.error("Error al eliminar el cliente:", error);
      showAlertMessage("Error al eliminar el cliente.", "error");
    } finally {
      handleCloseConfirmDialog();
      fetchClientes();
    }
  };
  const [busquedaCliente, setBusquedaCliente] = useState<string>("");
  const clientesFiltrados = user
    ? clientes.filter((cliente) => cliente.correoUsuario === user.email)
    : [];

  return (
    <div className="mainContainer">
      <HeaderContainer title={title} icon={icons.iconoClientes} userRole={role} />
      <div className="contentContainer">
        <div className="tabSelector-container-fixed">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedView} onChange={handleViewChange} variant="scrollable" scrollButtons="auto">
              <Tab label="Mis clientes" sx={{textTransform: 'none' }}/>
              {role === 'Gerente' && <Tab label="Todos los clientes" sx={{textTransform: 'none' }}/>}
            </Tabs>
          </Box>
        </div>
        {showAlert && (
          <Alert severity={alertSeverity} onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
            {alertMessage}
          </Alert>
        )}
        {selectedView === 0 && (
          <div>
          <Box className="usuarios-list" sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
              <CustomButton
                onClick={openClienteModal}
                text="Nuevo cliente"
                icon={<span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>}
                sx={{ textTransform: 'none' ,
                  '&:focus': { 
                    outline: 'none', 
                  } }} />
          </Box>
          <Box className="usuarios-list">
            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '16px', color: 'white', backgroundColor: '#002855' } }}>
                    <TableCell>Nombre completo</TableCell>
                    <TableCell>Correo electrónico</TableCell>
                    <TableCell>Celular</TableCell>
                    {role === 'Gerente' && <TableCell>Acciones</TableCell>}
                    
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} onClick={() => handleAbrirCliente(cliente)} style={{ cursor: 'pointer' }}>
                      <TableCell>{cliente.nombreCompleto}</TableCell>
                      <TableCell>{cliente.correoElectronico}</TableCell>
                      <TableCell>{cliente.celular}</TableCell>
                      {role === 'Gerente' && (
                        <TableCell onClick={(event) => event.stopPropagation()}> {/* Evita que el onClick de la fila se active */}
                        <IconButton color="inherit" onClick={(event) => {
                          event.stopPropagation();
                          handleAbrirCliente(cliente);
                        }}>
                          <CreateIcon />
                          </IconButton>
                          <IconButton color="error" onClick={(event) => handleOpenConfirmDialog(cliente, event)}>
                              <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          </div>
        )}
        {selectedView === 1 && role=='Gerente'&&(
          <Box className="usuarios-list" sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
          
            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow  sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '16px', color: 'white', backgroundColor: '#002855' } }}>
                    <TableCell>Nombre completo</TableCell>
                    <TableCell>Correo electrónico</TableCell>
                    <TableCell>Celular</TableCell>
                    <TableCell>Vendedor</TableCell>
                    {role === 'Gerente' && <TableCell>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} onClick={() => handleAbrirCliente(cliente)} style={{ cursor: 'pointer' }}>
                      <TableCell>{cliente.nombreCompleto}</TableCell>
                      <TableCell>{cliente.correoElectronico}</TableCell>
                      <TableCell>{cliente.celular}</TableCell>
                      <TableCell>{cliente.correoUsuario}</TableCell>
                      {role === 'Gerente' && (
                        <TableCell onClick={(event) => event.stopPropagation()}> {/* Evita que el onClick de la fila se active */}
                        <IconButton color="inherit" onClick={(event) => {
                          event.stopPropagation();
                          handleAbrirCliente(cliente);
                        }}>
                          <CreateIcon />
                        </IconButton>
                        <IconButton color="error" onClick={(event) => handleOpenConfirmDialog(cliente, event)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
        )}
      </div>
      {user && (
        <ClienteModal 
          cliente={cliente} 
          open={isClienteModalOpen} 
          onClose={closeClienteModal} 
          fetchClientes={fetchClientes}
          setCliente={setCliente} 
          email={user.email} 
        />
      )}
            <DialogComponent
              open={openConfirmDialog}
              onClose={handleCloseConfirmDialog}
              onConfirm={handleDeleteCliente}
              title="¿Estás seguro de eliminar este cliente?"
              message={`Esta acción eliminará permanentemente a ${clienteToDelete?.nombreCompleto}. ¿Deseas continuar?`}
              />
      <FooterContainer />
    </div>
  );
};

export default Page;
