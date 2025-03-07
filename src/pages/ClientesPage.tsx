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
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import { icons } from '../config/variables.tsx';
import HeaderContainer from '../components/Header.tsx';
import FooterContainer from '../components/Footer.tsx';
import ClienteModal from '../components/ClienteModal.tsx';
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

  const openClienteModal = () => {
    setCliente({
      id:  '',
      nombreCompleto: '',
      celular: '',
      correoElectronico: '',
    });
    setIsClienteModalOpen(true);
    fetchClientes(); 
  };

  const handleAbrirCliente = (cliente: any) => {
    setCliente(cliente);
    setIsClienteModalOpen(true);
    fetchClientes(); 
  };

  const closeClienteModal = () => {
    setIsClienteModalOpen(false);
    setCliente(null);
    fetchClientes(); 
  };

  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [clienteToDelete, setClienteToDelete] = useState<any>(null);

  const handleOpenConfirmDialog = (cliente: any) => {
    setClienteToDelete(cliente);
    setOpenConfirmDialog(true);
    fetchClientes(); 
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setClienteToDelete(null);
    fetchClientes(); 
  };

  const handleDeleteCliente = async () => {
    if (!clienteToDelete) return;

    try {
      await deleteCliente(clienteToDelete.id); // Eliminamos el cliente de Firebase
      alert(`Cliente ${clienteToDelete.nombreCompleto} eliminado correctamente.`);
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      alert("Error al eliminar el cliente.");
    } finally {
      handleCloseConfirmDialog(); // Cerramos el diálogo después de eliminar
    }
    handleCloseConfirmDialog()
    fetchClientes(); 
  };
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
              <Tab label="Clientes" />
              {role === 'Gerente' && <Tab label="Clientes General" />}
            </Tabs>
          </Box>
        </div>

        {selectedView === 0 && (
          <Box className="usuarios-list">
            <Toolbar className="barra-iconos">
              <IconButton onClick={openClienteModal} className="icono-usuario">
                <PersonIcon style={{ color: 'white' }} />
                <Typography style={{ color: 'white' }}>Nuevo Cliente</Typography>
              </IconButton>
            </Toolbar>

            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow>
                    <TableCell>Nombre Completo</TableCell>
                    <TableCell>Correo Electrónico</TableCell>
                    <TableCell>Celular</TableCell>
                    {role === 'Gerente' && <TableCell></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientesFiltrados.map((cliente) => (
                    <TableRow key={cliente.id} onClick={() => handleAbrirCliente(cliente)} style={{ cursor: 'pointer' }}>
                      <TableCell>{cliente.nombreCompleto}</TableCell>
                      <TableCell>{cliente.correoElectronico}</TableCell>
                      <TableCell>{cliente.celular}</TableCell>
                      {role === 'Gerente' && (
                        <TableCell>
                          <IconButton color="error" onClick={() => handleOpenConfirmDialog(cliente)}>
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
        {selectedView === 1 && role=='Gerente'&&(
          <Box className="usuarios-list">
            <Toolbar className="barra-iconos">
            </Toolbar>

            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow>
                    <TableCell>Nombre Completo</TableCell>
                    <TableCell>Correo Electrónico</TableCell>
                    <TableCell>Celular</TableCell>
                    {role === 'Gerente' && <TableCell></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} onClick={() => handleAbrirCliente(cliente)} style={{ cursor: 'pointer' }}>
                      <TableCell>{cliente.nombreCompleto}</TableCell>
                      <TableCell>{cliente.correoElectronico}</TableCell>
                      <TableCell>{cliente.celular}</TableCell>
                      {role === 'Gerente' && (
                        <TableCell>
                          <IconButton color="error" onClick={() => handleOpenConfirmDialog(cliente)}>
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
          setCliente={setCliente} 
          email={user.email} 
        />
      )}


            <DialogComponent
              open={openConfirmDialog}
              onClose={handleCloseConfirmDialog}
              onConfirm={handleDeleteCliente}
              title="¿Estás seguro?"
              message={`¿Estás seguro de que deseas eliminar a ${clienteToDelete?.nombreCompleto}? Esta acción no se puede deshacer.`}
              />
      <FooterContainer />
    </div>
  );
};

export default Page;
