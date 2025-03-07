import React, { useState } from 'react';
import { Modal, Box, Tabs, Tab, Typography, IconButton, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Proyecto, Unidad } from '../types/types'; // Asegúrate de que esta interfaz existe
import CotizadorModal from './CotizadorModal'; // Importa el nuevo modal

interface ProyectoModalProps {
  proyecto: Proyecto;
  open: boolean;
  onClose: () => void;
}

const ProyectoModal: React.FC<ProyectoModalProps> = ({ proyecto, open, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [cotizadorOpen, setCotizadorOpen] = useState<boolean>(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<Unidad | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleOpenCotizador = (unidad: Unidad) => {
    setUnidadSeleccionada(unidad);
    setCotizadorOpen(true);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          onClose();
        }}
        disableEnforceFocus
        aria-labelledby="modal-proyecto"
        aria-describedby="modal-proyecto-tabs"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            bgcolor: 'white',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            outline: 'none',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <CloseIcon />
          </IconButton>

          <Typography id="modal-proyecto" variant="h4" sx={{ mb: 2, textAlign: 'center', color: 'var(--primary-color)', fontWeight: 'bold' }}>
            {proyecto?.nombreProyecto || "Proyecto"}
          </Typography>

          {/* Logo y Fachada */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
            {proyecto.logo && (
              <Avatar src={proyecto.logo} alt="Logo del Proyecto" sx={{ width: 120, height: 120, boxShadow: 3 }} />
            )}
            {proyecto.fachada && (
              <img src={proyecto.fachada} alt="Fachada del Proyecto" style={{ maxWidth: "250px", borderRadius: "8px", boxShadow: "3px 3px 10px rgba(0,0,0,0.2)" }} />
            )}
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Scrollable tabs for navigation"
          >
            <Tab label="Información General" />
            <Tab label="Unidades" />
            <Tab label="Planes de Pago" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {/* TAB 1: Información General */}
            {selectedTab === 0 && (
              <>
                <Typography variant="h5" sx={{ mb: 2, color: 'var(--primary-color)' }}>
                  Amenidades:
                </Typography>
                {proyecto.amenidades && proyecto.amenidades.length > 0 ? (
                  <ul>
                    {proyecto.amenidades.map((amenidad, index) => (
                      <li key={index} style={{ marginBottom: "5px", fontSize: "16px", color: 'var(--primary-color)' }}>{amenidad}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="textSecondary">No hay amenidades registradas.</Typography>
                )}
              </>
            )}

            {/* TAB 2: Unidades */}
            {selectedTab === 1 && (
              <>
                <Typography variant="h5" sx={{ mb: 2, color: 'var(--primary-color)' }}>
                  Unidades
                </Typography>
                {proyecto.unidades && proyecto.unidades.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Número</TableCell>
                          <TableCell>Unidad Privativa</TableCell>
                          <TableCell>Precio</TableCell>
                          <TableCell>Imágenes</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proyecto.unidades.map((unidad, index) => (
                          <TableRow key={index}>
                            <TableCell>{unidad.numerounidad}</TableCell>
                            <TableCell>{unidad.unidadprivativa}</TableCell>
                            <TableCell>{unidad.preciolista}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {unidad.imagenes?.length > 0 ? (
                                  unidad.imagenes.map((img, imgIndex) => (
                                    <img
                                      key={imgIndex}
                                      src={typeof img === 'string' ? img : img.data}
                                      alt={`Unidad ${index} Img ${imgIndex}`}
                                      style={{ width: "50px", height: "50px", borderRadius: "4px", objectFit: "cover" }}
                                    />
                                  ))
                                ) : (
                                  <Typography variant="caption">Sin imágenes</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton onClick={() => handleOpenCotizador(unidad)}>
                                <VisibilityIcon sx={{ color: "gray" }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">No hay unidades registradas.</Typography>
                )}
              </>
            )}
             {selectedTab === 2 && (
              <>
                <Typography variant="h5" sx={{ mb: 2, color: 'var(--primary-color)' }}>
                  Planes de Pago
                </Typography>
                {proyecto.paymentPlans && proyecto.paymentPlans.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Meses</TableCell>
                          <TableCell>Descuento</TableCell>
                          <TableCell>Pago Inicial (%)</TableCell>
                          <TableCell>Mensualidades (%)</TableCell>
                          <TableCell>Contraentrega (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {proyecto.paymentPlans.map((plan, index) => (
                          <TableRow key={index}>
                            <TableCell>{plan.name}</TableCell>
                            <TableCell>{plan.months}</TableCell>
                            <TableCell>{plan.descuento}%</TableCell>
                            <TableCell>{plan.pInicial}%</TableCell>
                            <TableCell>{plan.mensualidades}%</TableCell>
                            <TableCell>{plan.contraentrega}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">No hay planes de pago registrados.</Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Cotizador Modal */}
      {unidadSeleccionada && (
        <CotizadorModal
          open={cotizadorOpen}
          onClose={() => setCotizadorOpen(false)}
          proyecto={proyecto}
          unidad={unidadSeleccionada}
        />
      )}
    </>
  );
};

export default ProyectoModal;
