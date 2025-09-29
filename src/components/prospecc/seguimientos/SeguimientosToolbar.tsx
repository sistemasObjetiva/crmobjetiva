import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, ButtonGroup } from '@mui/material'
type Props = {
  usuarios: any[]
  filtroUsuarioId: string
  setUsuarioId: (id: string) => void
  onExportFilteredCSV: () => void
  getUserLabelById: (id: string) => string
  getUserId: (u: any) => string | null
  // opcionales:
  onOpenImport?: () => void
  onExportExcel?: () => void
  onExportFilteredExcel?: () => void
}

export default function SeguimientosToolbar({
  usuarios,
  filtroUsuarioId,
  setUsuarioId,
  onExportFilteredCSV,
  getUserLabelById,
  getUserId,
  onOpenImport,
  onExportExcel,
  onExportFilteredExcel,
}: Props) {
  const showExcel = !!onExportExcel || !!onExportFilteredExcel

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
      <Typography variant="h6" fontWeight={700} color="primary">Seguimientos</Typography>

      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
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

        {/* Exportar CSV (siempre visible) */}
        <Button variant="outlined" onClick={onExportFilteredCSV}>
          Descargar filtrado (CSV)
        </Button>

        {/* Botones de Excel solo si se pasan handlers */}
        {showExcel && (
          <ButtonGroup variant="outlined">
            {onExportFilteredExcel && (
              <Button onClick={onExportFilteredExcel}>Descargar filtrado (Excel)</Button>
            )}
            {onExportExcel && (
              <Button color="primary" onClick={onExportExcel}>Descargar Excel (todo)</Button>
            )}
          </ButtonGroup>
        )}

        {/* Importar CSV (opcional) */}
        {onOpenImport && (
          <Button variant="contained" onClick={onOpenImport}>
            Importar CSV
          </Button>
        )}
      </Box>
    </Box>
  )
}
