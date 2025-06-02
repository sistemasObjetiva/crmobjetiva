import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close"; 
import CheckIcon from "@mui/icons-material/Check";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, onClose, onConfirm, title, message }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{fontWeight: 'bold', fontSize: '16px', textTransform: 'none'}}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} autoFocus color="error" sx={{fontWeight: 'bold', fontSize: '16px', textTransform: 'none'}}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
