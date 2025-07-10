// src/components/FooterContainer.tsx
import React from "react";

import {  Box } from "@mui/material";
import logo from "../../assets/logos/logoObjetiva.png";

const FooterContainer: React.FC = () => {
  

  return (
    <Box
      className="footerContainer"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        borderTop: "1px solid #ddd",
      }}
    >
      <img src={logo} alt="Logo" className="logo" />
    </Box>
  );
};

export default FooterContainer;
