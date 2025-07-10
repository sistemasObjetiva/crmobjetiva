import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthRole } from "../../config/auth.tsx";

import { routesNav } from "../../config/routes.tsx";
import { Box, IconButton, Typography } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business"; // Icono por defecto
import { Route } from "../../config/types.tsx";
import Spinner from "../../components/general/Spinner.tsx";

const ConfiguracionPage: React.FC = () => {
  const { role, loading} = useAuthRole(); 
  const navigate = useNavigate();
  
  if (loading) return <Spinner open={true}/>;

  const operacionNav = routesNav.find((nav) => nav.name === "Configuración");
  const availableRoutes = (operacionNav?.children ?? []) as Route[];
  const routesToShow = availableRoutes.filter(
  (r) =>
    (!r.rol || r.rol.includes(role || ''))
);


  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={20} mb={1} sx={{ p: 2 , textAlign: 'center'}} justifyItems="center" >
      {routesToShow.map((r, index) => (
        <Box key={index}>
          <IconButton
            onClick={() => navigate(r.path)}
            className="gridButtonOperacion"
            sx={{ flexDirection: 'column' /* para que el ícono y el texto queden uno sobre otro */ }}
          >
            {r.icon ? (
              <r.icon fontSize="large" />
            ) : (
              <BusinessIcon fontSize="large" />
            )}
            <Typography
              variant="h6"
              align="center"
              sx={{ color: 'var(--primary-color)', mt: 0.5 }}
            >
              {r.name}
            </Typography>
          </IconButton>
        </Box>
      ))}
    </Box>

  );
};

export default ConfiguracionPage;
