import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { Unidad } from "../../config/types";
import { formatoMoneda } from "../../hooks/useUtilsFunctions";

interface UnidadInfoProps {
  unidad: Unidad;
  /** Orden de los extras proveniente del proyecto */
  extrasOrder?: string[];
}

const UnidadInfo: React.FC<UnidadInfoProps> = ({ unidad, extrasOrder }) => {
  const extras = unidad.extras || {};
  const keysOrdenadas = (extrasOrder?.length ? extrasOrder : Object.keys(extras))
    // solo mantenemos claves que existan en esta unidad
    .filter(k => k in extras)
    // opcional: si quieres esconder valores vacíos
    .filter(k => String(extras[k] ?? "").trim() !== "");

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: "#f5f5f5",
        boxShadow: 1,
        mb: 3,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        justifyContent: "space-between",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h6" sx={{ color: "var(--primary-color)", fontWeight: 700 }}>
          Unidad: {unidad.numerounidad}
        </Typography>
        <Typography>Privativa: {unidad.unidadprivativa}</Typography>
        <Typography sx={{ color: "var(--primary-color)", fontWeight: 500 }}>
          Precio de lista: <b>{formatoMoneda(unidad.preciolista)}</b>
        </Typography>

        {keysOrdenadas.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "var(--primary-color)", fontWeight: 700 }}>
              Características adicionales:
            </Typography>
            <Stack spacing={0.5} sx={{ ml: 1 }}>
              {keysOrdenadas.map((label) => (
                <Typography key={label}>
                  <b>{label}: </b>
                  {String(extras[label])}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default UnidadInfo;
