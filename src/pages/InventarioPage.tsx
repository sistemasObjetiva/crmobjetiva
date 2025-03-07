import React, { useState, useEffect } from 'react';
import {useAuthRole} from '../config/auth';
import {useFetchProyectos} from '../hooks/useFetchFunctions';
import { Tabs, Tab, Box, Typography, Card, CardActionArea, CardMedia, CardContent, Avatar } from '@mui/material';
import '../styles/global.css';

import HeaderContainer from '../components/Header';
import FooterContainer from '../components/Footer';
import ProyectoModal from '../components/ProyectoModal';

import icon from '../assets/icons/iconoMuestra.png';
import { Proyecto } from '../types/types'; // Asegúrate de tener esta interfaz

const title = "Inventario";

const Page: React.FC = () => {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [selectedView, setSelectedView] = useState<number>(0);
  const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedView(newValue);
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const {role} = useAuthRole();

  useEffect(() => {
    const gestionarElementosGerente = () => {
      if (role !== "gerente") {
        document.querySelectorAll('.btnGerente').forEach(boton => {
          (boton as HTMLButtonElement).disabled = true;
          (boton as HTMLButtonElement).style.opacity = "0.5";
          (boton as HTMLButtonElement).style.cursor = "not-allowed";
        });

        document.querySelectorAll('.rndGerente').forEach(elemento => {
          (elemento as HTMLElement).style.display = "none";
        });
      }
    };
    gestionarElementosGerente();
  }, [role]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const [isProyectoModalOpen, setIsProyectoModalOpen] = useState<boolean>(false);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const { proyectos = [] } = useFetchProyectos(); 

  const handleVerProyecto = (proyecto: Proyecto) => {
    setProyecto(proyecto);
    setIsProyectoModalOpen(true);
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      <div className="mainContainer">
        <HeaderContainer title={title} icon={icon} userRole={role} />
        
        <div className="contentContainer">
          <div className="tabSelector-container-fixed">
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={selectedView} onChange={handleViewChange} variant="scrollable" scrollButtons="auto">
                <Tab label="Proyectos" />
                <Tab label="Propiedades" />
                <Tab label="Inventario General" />
              </Tabs>
            </Box>
          </div>

          {selectedView === 0 && (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', padding: 2 }}>
                {proyectos.length > 0 ? (
                  proyectos.map((proyecto) => (
                    <Card key={proyecto.id} sx={{ width: 300, boxShadow: 3, borderRadius: 2 }}>
                      <CardActionArea onClick={() => handleVerProyecto(proyecto)}>
                        {proyecto.fachada ? (
                          <CardMedia component="img" height="140" image={proyecto.fachada} alt={`Fachada de ${proyecto.nombreProyecto}`} />
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
        </div>

        <FooterContainer />
      </div>

      {proyecto && (
        <ProyectoModal proyecto={proyecto} open={isProyectoModalOpen} onClose={() => setIsProyectoModalOpen(false)}  />
      )}
    </>
  );
};

export default Page;
