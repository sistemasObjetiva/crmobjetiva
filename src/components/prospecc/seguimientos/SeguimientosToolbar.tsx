import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'

export default function SeguimientosToolbar({
  usuarios, filtroUsuarioId, setUsuarioId,
  onExportExcel, onExportFilteredExcel, onExportFilteredCSV,
  onOpenImport,
  getUserLabelById, getUserId,
}: {
  usuarios: any[]
  filtroUsuarioId: string
  setUsuarioId: (id: string) => void
  onExportExcel: () => void
  onExportFilteredExcel: () => void
  onExportFilteredCSV: () => void
  onOpenImport: () => void
  getUserLabelById: (id: string) => string
  getUserId: (u: any) => string | null
}) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
      <Typography variant="h6" fontWeight={700} color="primary">Seguimientos</Typography>
      <Box display="flex" gap={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="filter-user-label">Filtrar por usuario</InputLabel>
          <Select
            labelId="filter-user-label"
            label="Filtrar por usuario"
            value={filtroUsuarioId}
            onChange={(e) => setUsuarioId(String(e.target.value))}
          >
            <MenuItem value=""><em>Todos</em></MenuItem>
            {(usuarios ?? []).map(u => {
              const id = getUserId(u)
              if (id == null) return null
              return (
                <MenuItem key={String(id)} value={String(id)}>
                  {getUserLabelById(String(id))}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={onExportFilteredExcel}>Descargar filtrado</Button>
        <Button variant="outlined" onClick={onExportFilteredCSV}>Descargar filtrado (CSV)</Button>
        <Button variant="outlined" color="primary" onClick={onExportExcel}>Descargar Excel</Button>
        <Button variant="contained" onClick={onOpenImport}>Importar CSV</Button>
      </Box>
    </Box>
  )
}
