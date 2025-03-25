import React, { useState } from 'react';
import { useAuthRole } from "../config/auth.tsx";
import { useFetchProyectos , useFetchPropiedades} from "../hooks/useFetchFunctions.tsx"; 

import {
  Tabs,
  Tab,
  Box,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Avatar,
  Typography,
} from '@mui/material';
import '../styles/global.css';
import HeaderContainer from '../components/Header.tsx';
import FooterContainer from '../components/Footer.tsx';
import CustomButton from '../components/CustomButton.tsx';
import ProyectoModal from '../components/ProyectoControlModal.tsx';
import PropiedadControlModal from '../components/PropiedadControl.tsx';
import icon from '../assets/icons/iconoMuestra.png';
import { Proyecto, Propiedad } from '../types/types.tsx';

const title = "Inventario";

const Page: React.FC = () => {
    const { role,user} = useAuthRole();
  const [selectedView, setSelectedView] = useState<number>(0);
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState<boolean>(false);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);

  const handleNuevoProyecto = () => {
    setProyecto({
      id: "",
      nombreProyecto: "",
      logo: "",
      fachada: "",
      imagenesProyecto: [],
      amenidades: [],
      unidades: [],
      paymentPlans: [
        {
          name: "Contado",
          descuento: 6.0,
          pInicial: 100.0,
          mensualidades: 0.0,
          months: 1,
          parcialidades: 0.0,
          contraentrega: 0.0,
        },
        {
          name: "ContadoComercial",
          descuento: 4.0,
          pInicial: 33.33,
          mensualidades: 66.67,
          months: 3,
          parcialidades: 33.33,
          contraentrega: 33.33,
        },
        {
          name: "Crédito",
          descuento: 0.0,
          pInicial: 20.0,
          mensualidades: 50.0,
          months: 0,
          parcialidades: -50.0,
          contraentrega: 30.0,
        },
      ],
    });
    setIsProyectoModalOpen(true);
  };

  const { proyectos = [],fetchProyectos } = useFetchProyectos();

  const handleVerProyecto = (proyecto: Proyecto) => {
    setProyecto(proyecto);
    setIsProyectoModalOpen(true);
  };

  const [isPropiedadModalOpen, setIsPropiedadModalOpen] = useState<boolean>(false);
  const [propiedad, setPropiedad] = useState<Propiedad>({
    tituloPropiedad: "",
    tipo: "",
    descripcion: "",
    venta: false,
    precioVenta: 0,
    comisionVenta: 0,
    renta: false,
    precioRenta: 0,
    comisionRenta: 0,
  });

  const handleNuevaPropiedad = () => {
    setPropiedad({
      tituloPropiedad: "",
      tipo: "",
      descripcion: "",
      venta: false,
      precioVenta: 0,
      comisionVenta: 0,
      renta: false,
      precioRenta: 0,
      comisionRenta: 0,
    });
    setIsPropiedadModalOpen(true);
  };
  const handleVerPropiedad = (propiedad: Propiedad) => {
    setPropiedad(propiedad);
    setIsPropiedadModalOpen(true);
  };
  
  const { propiedades = [], } = useFetchPropiedades();

    const handleCloseModalProyecto = ()=>{
      console.log("hola")
      setIsProyectoModalOpen(false)
      fetchProyectos()
    }
  return (
    <>
      <div className="mainContainer">
        <HeaderContainer title={title} icon={icon} userRole={role} />
        <div className="contentContainer">
          <div className="tabSelector-container-fixed">
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={selectedView}
                onChange={handleViewChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Scrollable tabs for navigation"
              >
                <Tab label="Proyectos" />
                <Tab label="Propiedades" />
                <Tab label="Inventario General" />
              </Tabs>
            </Box>
          </div>
          {selectedView === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
                <CustomButton
                  onClick={handleNuevoProyecto}
                  text="Nuevo Proyecto"
                  icon={<span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</span>}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', padding: 2 }}>
                {proyectos.length > 0 ? (
                  proyectos.map((proyecto, index) => (
                    <Card key={index} sx={{ width: 300, boxShadow: 3, borderRadius: 2 }}>
                      <CardActionArea onClick={() => handleVerProyecto(proyecto)}>
                        {proyecto.fachada ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={proyecto.fachada}
                            alt={`Fachada de ${proyecto.nombreProyecto}`}
                          />
                        ) : (
                          <Box sx={{ height: 140, bgcolor: "grey.300", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Typography variant="body2">Sin Imagen</Typography>
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {proyecto.logo ? (
                              <Avatar src={proyecto.logo} alt={proyecto.nombreProyecto} sx={{ width: 40, height: 40 }} />
                            ) : (
                              <Avatar sx={{ bgcolor: "grey.400", width: 40, height: 40 }}>?</Avatar>
                            )}
                            <Typography variant="h6">{proyecto.nombreProyecto || "Sin Nombre"}</Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                ) : (
                  <Typography sx={{ textAlign: "center", padding: 2 }}>No hay proyectos dados de alta.</Typography>
                )}
              </Box>
            </>
          )}
          {selectedView === 1 && (
            <>
              <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
                <CustomButton onClick={handleNuevaPropiedad} text="Nueva Propiedad" icon={<span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>+</span>} />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center", padding: 2 }}>
                {propiedades.length > 0 ? (
                  propiedades.map((propiedad, index) => (
                    <Card key={index} sx={{ width: 300, boxShadow: 3, borderRadius: 2 }}>
                      <CardActionArea onClick={() => handleVerPropiedad(propiedad)}>
                        {/* 🔹 Mostrar la primera imagen de la propiedad como fachada */}
                        {Array.isArray(propiedad.imagenes) && propiedad.imagenes.length > 0 ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={propiedad.imagenes[0]} // ✅ Usa la primera imagen guardada
                            alt={`Imagen de ${propiedad.tituloPropiedad}`}
                          />
                        ) : (
                          <Box sx={{ height: 140, bgcolor: "grey.300", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Typography variant="body2">Sin Imagen</Typography>
                          </Box>
                        )}

                        <CardContent>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            {/* 🔹 Mostrar logo si existe, sino mostrar un Avatar con el título */}
                            {propiedad.logo ? (
                              <Avatar src={propiedad.logo} alt={propiedad.tituloPropiedad} sx={{ width: 40, height: 40 }} />
                            ) : (
                              <Avatar sx={{ bgcolor: "grey.400", width: 40, height: 40 }}>
                                {propiedad.tituloPropiedad?.charAt(0) || "?"}
                              </Avatar>
                            )}
                            <Typography variant="h6">{propiedad.tituloPropiedad || "Sin Nombre"}</Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  ))
                ) : (
                  <Typography sx={{ textAlign: "center", padding: 2 }}>No hay propiedades dadas de alta.</Typography>
                )}
              </Box>

              <PropiedadControlModal open={isPropiedadModalOpen} onClose={() => setIsPropiedadModalOpen(false)} propiedad={propiedad} setPropiedad={setPropiedad} userID={user?.id} />
            </>
          )}
        </div>
        <FooterContainer />
      </div>
      {proyecto && (
        <ProyectoModal proyecto={proyecto} open={isProyectoModalOpen} onClose={handleCloseModalProyecto} setProyecto={setProyecto} user={user} />
      )}
    </>
  );
};

export default Page;
