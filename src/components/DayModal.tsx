import React from "react";
import {
  Modal,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Temporal } from "@js-temporal/polyfill";


import { Seguimiento } from "../types/types.tsx"; 

interface DayModalProps {
  open: boolean;
  onClose: () => void;
  date: string | Temporal.PlainDate;
  seguimientos: Seguimiento[];
}

const DayModal: React.FC<DayModalProps> = ({ open, onClose, date, seguimientos }) => {
  const normalizedDate = typeof date === "string" ? Temporal.PlainDate.from(date) : date;


  const filteredSeguimientos = seguimientos.filter((seguimiento) => {
    if (!seguimiento.fechaProximoSeguimiento) return false;

    try {
      const seguimientoDate = Temporal.PlainDate.from(seguimiento.fechaProximoSeguimiento);
      return normalizedDate.equals(seguimientoDate);
    } catch (error) {
      console.error("Error procesando fecha de seguimiento:", seguimiento.fechaProximoSeguimiento, error);
      return false;
    }
  });

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          width: "80%",
          maxHeight: "80%",
          overflowY: "auto",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">
            Seguimientos para el día: {normalizedDate.toString()}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {filteredSeguimientos.length > 0 ? (
          <Table component={Paper}>
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Correo Vendedor</TableCell>
                <TableCell>Comentarios</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSeguimientos.map((seguimiento) => (
                <TableRow key={seguimiento.id}>
                  <TableCell>{seguimiento.cliente}</TableCell>
                  <TableCell>{seguimiento.correoUsuario}</TableCell>
                  <TableCell>{seguimiento.comentarios}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography>No hay seguimientos para este día.</Typography>
        )}
      </Box>
    </Modal>
  );
};

export default DayModal;
