import React from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material"
import { Temporal } from "@js-temporal/polyfill"

// ✅ Ahora el tipo acepta children
export type DayModalProps = React.PropsWithChildren<{
  open: boolean
  date: Temporal.PlainDate
  onClose: () => void
}>

const DayModal: React.FC<DayModalProps> = ({ open, date, onClose, children }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Día seleccionado: {date.day}/{date.month}/{date.year}
      </DialogTitle>
      <DialogContent dividers>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DayModal
