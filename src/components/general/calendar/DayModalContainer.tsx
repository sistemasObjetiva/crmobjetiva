import React from "react"
import { Temporal } from "@js-temporal/polyfill"
import DayModal from "./DayModal"
import { Box, Typography, Chip, Paper, Table, TableHead, TableRow, TableCell, TableBody, Stack } from "@mui/material"

// ❌ ELIMINA este tipo local si lo tenías definido aquí
// type Seguimiento = { ... }

export interface DayModalContainerProps {
  date: Temporal.PlainDate
  onClose: () => void
  items?: any[]                               // <- más laxo
  getEstatus?: (s: any) => string             // <- más laxo
}

const DayModalContainer: React.FC<DayModalContainerProps> = ({ date, onClose, items = [], getEstatus }) => {
  const fmtHora = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <DayModal open={true} date={date} onClose={onClose}>
      <Box sx={{ mt: 1 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip label={`Seguimientos del día: ${items.length}`} />
        </Stack>

        <Paper variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Hora</TableCell>
                <TableCell>Estatus</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Comentarios</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">Sin registros</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items
                  .slice()
                  .sort((a, b) =>
                    new Date(b?.fechaActualizacion ?? b?.fechaCreacion ?? 0).getTime() -
                    new Date(a?.fechaActualizacion ?? a?.fechaCreacion ?? 0).getTime()
                  )
                  .map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{fmtHora(s?.fechaActualizacion ?? s?.fechaCreacion)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={getEstatus ? getEstatus(s) : (s?.estatusSeguimiento ?? '—')} />
                      </TableCell>
                      <TableCell>{s?.userid ?? '—'}</TableCell>
                      <TableCell>{s?.comentarios ?? '—'}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </DayModal>
  )
}

export default DayModalContainer
