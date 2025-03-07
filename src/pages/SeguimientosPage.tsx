import React, { useState, useEffect } from 'react';
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
  TextField,
  Typography,
  Autocomplete
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';



import HeaderContainer from '../components/Header';
import FooterContainer from '../components/Footer';
import SeguimientoModal from '../components/SeguimientoModal.tsx';
import DialogComponent from "../components/DialogComponent"; 

import { icons } from '../config/variables';

import '../styles/UsuariosPage.css';
import '../styles/global.css';

import { Seguimiento } from '../types/types';

import { useAuthRole } from "../config/auth.tsx";
import { useFetchClientes, useFetchSeguimientos,deleteSeguimiento} from "../hooks/useFetchFunctions.tsx"; 

import  {  fechaActual }  from '../hooks/useDateUtils';

const title = "Seguimientos";

const Page: React.FC = () => {
  // Estado para la vista seleccionada
  const [selectedView, setSelectedView] = useState<number>(0);
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

    const { role, user } = useAuthRole(); 

    const { clientes = [] } = useFetchClientes();

    const { seguimientos = [] , fetchSeguimientos } = useFetchSeguimientos();

  // Estado para el seguimiento
    const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
    const [isSeguimientoModalOpen, setIsSeguimientoModalOpen] = useState<boolean>(false);

    const openSeguimientoModal = () => {
        
        setSeguimiento({
            id: '', // Asignar un ID único si es necesario
            cliente: '',
            correoUsuario: user?.email || '', // Si ya tienes el email del usuario autenticado, lo asignas
            fechaCreacion: (fechaActual),
            fechaActualizacion: (fechaActual),
            fechaProximoSeguimiento: (fechaActual),
            unidadInteres: '',
            formaDePago: '',
            temperaturaInteres: '',
            comentarios: '',
            proyectoInteres:'',
            capacidadDePago:'',
            actualizaciones:[]
        });
        setIsSeguimientoModalOpen(true);
      };
      

  const handleEditarSeguimiento = (seguimiento: Seguimiento) => {
    setSeguimiento(seguimiento);
    setIsSeguimientoModalOpen(true);
  };

  const closeSeguimientoModal = () => {
    setIsSeguimientoModalOpen(false);
    setSeguimiento(null);
    fetchSeguimientos()
  };

  const [seguimientosFiltrados, setSeguimientosFiltrados] = useState<Seguimiento[]>([]);

  useEffect(() => {
      if (user?.email) {
        setSeguimientosFiltrados(seguimientos.filter(seguimiento =>
          seguimiento.correoUsuario.toLowerCase() === user?.email.toLowerCase()
        ));
      } else {
        setSeguimientosFiltrados([]); 
      }

  }, [seguimientos,user?.email]);

  // Estado para la eliminación de seguimientos
  const [openConfirmDialog, setOpenConfirmDialog] = useState<boolean>(false);
  const [seguimientoToDelete, setSeguimientoToDelete] = useState<Seguimiento | null>(null);

  const handleOpenConfirmDialog = (seguimiento: Seguimiento) => {
    setSeguimientoToDelete(seguimiento);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setSeguimientoToDelete(null);
    setOpenConfirmDialog(false);
    fetchSeguimientos()
  };

  const handleDeleteSeguimiento = async () => {
    if (!seguimientoToDelete|| !seguimientoToDelete.id) return;
  
    try {
      const result = await deleteSeguimiento(seguimientoToDelete?.id);
  
      if (result.error) {
        alert(`❌ ${result.error}`);
      } else {
        alert(`✅ ${result.success}`);
        fetchSeguimientos(); // 🔄 Recargar los seguimientos después de eliminar
      }
    } catch (error) {
      alert("❌ Error inesperado al eliminar seguimiento: " + error);
    }
  
    handleCloseConfirmDialog(); // Cerrar el diálogo después de eliminar
  };
  

    const [busquedaCliente, setBusquedaCliente] = useState<string>("");

    const seguimientosFiltradosBuscador = seguimientosFiltrados.filter(seguimiento =>
      seguimiento.cliente.toLowerCase().includes(busquedaCliente.toLowerCase())
    );

  useEffect(() => {
   console.log(seguimiento)
  }, [role,seguimiento,seguimientos,seguimientosFiltrados,user?.email,clientes]);

  return (
    <div className="mainContainer">
      <HeaderContainer title={title} icon={icons.iconoMuestra} userRole={role} />
      <div className="contentContainer">
        <div className="tabSelector-container-fixed">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedView} onChange={handleViewChange} variant="scrollable" scrollButtons="auto">
              <Tab label="Seguimientos Activos" />
            </Tabs>
          </Box>
        </div>

        {/* Vista de seguimientos activos */}
        {selectedView === 0 && (
          <Box className="usuarios-list">
            <Toolbar className="barra-iconos">
            <Autocomplete
                options={clientes.map((cliente) => cliente.nombreCompleto)}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    placeholder="Buscar Cliente"
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: "white", borderRadius: 1, mr: 2, minWidth: 200 }}
                    />
                )}
                value={busquedaCliente}
                onInputChange={(_, newValue) => setBusquedaCliente(newValue)}
                freeSolo
                />
              <IconButton onClick={openSeguimientoModal} className="icono-usuario">
                <PersonIcon style={{ color: 'white' }} />
                <Typography style={{ color: 'white' }}>Nuevo Seguimiento</Typography>
              </IconButton>
            </Toolbar>

            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow>
                    <TableCell>Folio</TableCell>
                    <TableCell>Nombre Cliente</TableCell>
                    <TableCell>Correo Vendedor</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell>Fecha Actualización</TableCell>
                    <TableCell>Unidad Interés</TableCell>
                    <TableCell>Forma de Pago</TableCell>
                    <TableCell>Temperatura de Interés</TableCell>
                    <TableCell>Comentarios</TableCell>
                    {role === 'Gerente' && <TableCell>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seguimientosFiltradosBuscador.length > 0 ? (
                    seguimientosFiltradosBuscador.map((seguimiento) => (
                      <TableRow key={seguimiento.id} onClick={() => handleEditarSeguimiento(seguimiento)}>
                        <TableCell>{seguimiento.id}</TableCell>
                        <TableCell>{seguimiento.cliente}</TableCell>
                        <TableCell>{seguimiento.correoUsuario}</TableCell>
                        <TableCell>{new Date(seguimiento.fechaCreacion).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(seguimiento.fechaActualizacion).toLocaleDateString()}</TableCell>
                        <TableCell>{seguimiento.unidadInteres}</TableCell>
                        <TableCell>{seguimiento.formaDePago}</TableCell>
                        <TableCell>{seguimiento.temperaturaInteres}</TableCell>
                        <TableCell>{seguimiento.comentarios}</TableCell>
                        {role === 'Gerente' && (
                          <TableCell>
                            <IconButton  onClick={() => handleOpenConfirmDialog(seguimiento)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} style={{ textAlign: "center" }}>No hay seguimientos disponibles</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        <SeguimientoModal seguimiento={seguimiento} open={isSeguimientoModalOpen} onClose={closeSeguimientoModal} setSeguimiento={setSeguimiento} email={user?.email} role={role}/>
        <DialogComponent
            open={openConfirmDialog}
            onClose={handleCloseConfirmDialog}
            onConfirm={handleDeleteSeguimiento}
            title="¿Estás seguro?"
            message={`¿Estás seguro de que deseas eliminar el seguimiento con folio ${seguimientoToDelete?.id}? Esta acción no se puede deshacer.`}
          />
      </div>
      <FooterContainer />
    </div>
  );
};

export default Page;
