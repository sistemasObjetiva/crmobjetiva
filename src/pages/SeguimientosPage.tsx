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
  Autocomplete,
  Alert, 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateIcon from "@mui/icons-material/Create";
import CustomButton from '../components/CustomButton.tsx';
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

    // Estados para las alertas en la página
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

    const openSeguimientoModal = () => {
        setSeguimiento({
            id: '', 
            cliente: '',
            correoUsuario: user?.email || '',
            fechaCreacion: (fechaActual),
            fechaActualizacion: (fechaActual),
            fechaProximoSeguimiento: (fechaActual),
            unidadInteres: '',
            formaDePago: '',
            temperaturaInteres: '',
            estatusSeguimiento:'',
            comentarios: '',
            proyectoInteres:'',
            capacidadDePago:'',
            actualizaciones:[]
        });
        setIsSeguimientoModalOpen(true);
      };
      

  const handleEditarSeguimiento = (seguimientoParaEditar: Seguimiento) => {
    setSeguimiento(seguimientoParaEditar);
    setIsSeguimientoModalOpen(true);
  };

  const closeSeguimientoModal = (success?: boolean, message?: string) => {
    setIsSeguimientoModalOpen(false);
    setSeguimiento(null);
    fetchSeguimientos();
    if (success && message) {
      showAlertMessage(message, "success");
    } else if (!success && message) {
      showAlertMessage(message, "error");
    }
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

  const handleOpenConfirmDialog = (seguimiento: Seguimiento, event: React.MouseEvent) => {
    event.stopPropagation(); // Evita que se ejecute el onClick de la fila
    setSeguimientoToDelete(seguimiento);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setSeguimientoToDelete(null);
    setOpenConfirmDialog(false);
  };

  const handleDeleteSeguimiento = async () => {
    if (!seguimientoToDelete || !seguimientoToDelete.id) return;
  
    try {
      const result = await deleteSeguimiento(seguimientoToDelete.id);
  
      if (result?.success) {
        showAlertMessage(`Seguimiento del cliente ${seguimientoToDelete.cliente} eliminado correctamente.`, "success");
      } else if (result?.message) {
        showAlertMessage(result.message, "error");
      } else {
        showAlertMessage("Error al eliminar el seguimiento.", "error");
      }
      fetchSeguimientos(); // 🔄 Recargar los seguimientos después de eliminar
    } catch (error) {
      showAlertMessage("Error inesperado al eliminar seguimiento: " + error, "error");
    }
    handleCloseConfirmDialog(); // Cerrar el diálogo después de eliminar
  };

    const [busquedaCliente, setBusquedaCliente] = useState<string>("");

    const seguimientosFiltradosBuscador = seguimientosFiltrados.filter(seguimiento =>
      seguimiento.cliente.toLowerCase().includes(busquedaCliente.toLowerCase())
    );
/*
  useEffect(() => {
   console.log(seguimiento)
  }, [role,seguimiento,seguimientos,seguimientosFiltrados,user?.email,clientes]);
*/
  return (
    <div className="mainContainer">
      <HeaderContainer title={title} icon={icons.iconoMuestra} userRole={role} />
      <div className="contentContainer">
        <div className="tabSelector-container-fixed">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedView} onChange={handleViewChange} variant="scrollable" scrollButtons="auto">
              <Tab label="Seguimientos activos" sx={{textTransform: 'none' }}/>
            </Tabs>
          </Box>
        </div>
        {showAlert && (
          <Alert severity={alertSeverity} onClose={() => setShowAlert(false)} sx={{ mb: 2 }}>
            {alertMessage}
          </Alert>
        )}
        {/* Vista de seguimientos activos */}
        {selectedView === 0 && (
          <Box className="usuarios-list">
            <Toolbar className="usuarios-list" sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
            <Typography variant="body1" sx={{ color: "var(--primary-color)", mr: 2 }}>
              Buscar clientes:
            </Typography>
            <Autocomplete
                options={clientes.map((cliente) => cliente.nombreCompleto)}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    placeholder="Buscar seguimiento de cliente"
                    variant="outlined"
                    size="small"
                    sx={{ backgroundColor: "white", borderRadius: 1,  minWidth: 200 }}
                    />
                )}
                value={busquedaCliente}
                onInputChange={(_, newValue) => setBusquedaCliente(newValue)}
                freeSolo
                />
              <Box className="usuarios-list" sx={{ display: 'flex', justifyContent: 'center', padding: 1 }}>
                  <CustomButton
                    onClick={openSeguimientoModal}
                    text="Nuevo seguimiento"
                    icon={<span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>}
                    sx={{ textTransform: 'none' ,
                      '&:focus': { 
                        outline: 'none', 
                      } }} />
              </Box>
            </Toolbar>

            <TableContainer component={Paper} className="user-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <Table stickyHeader>
                <TableHead className="sticky-header">
                  <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', fontSize: '14px', color: 'white', backgroundColor: '#002855' } }}>
                    <TableCell>Folio</TableCell>
                    <TableCell>Nombre cliente</TableCell>
                    <TableCell>Correo vendedor</TableCell>
                    <TableCell>Fecha creación</TableCell>
                    <TableCell>Fecha actualización</TableCell>
                    <TableCell>Unidad interés</TableCell>
                    <TableCell>Forma de pago</TableCell>
                    <TableCell>Temperatura de interés</TableCell>
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
                        <TableCell>{seguimiento.comentarios || "Sin comentarios"}</TableCell>
                        {role === 'Gerente' && (
                          <TableCell onClick={(event) => event.stopPropagation()}> {/* Evita que el onClick de la fila se active */}
                            <IconButton color="inherit" onClick={(event) => {event.stopPropagation();handleEditarSeguimiento(seguimiento)}}>
                              <CreateIcon />
                            </IconButton>
                            <IconButton color="error" onClick={(event) =>  handleOpenConfirmDialog(seguimiento,event)}>
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
            title="¿Estás seguro de eliminar este seguimiento?"
            message={`Esta acción eliminará permanentemene al seguimiento del cliente ${seguimientoToDelete?.cliente}. ¿Deseas continuar?`}
          />
      </div>
      <FooterContainer />
    </div>
  );
};

export default Page;
