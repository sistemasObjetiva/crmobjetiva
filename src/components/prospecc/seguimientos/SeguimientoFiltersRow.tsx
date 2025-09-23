import { IconButton, MenuItem, Select, TableCell, TableRow, TextField, Tooltip } from '@mui/material'

export default function SeguimientosFiltersRow({
  usuarios, filters, setFilters, clearAll, setUsuarioId, getUserId, getUserEmail,
}: {
  usuarios: any[]
  filters: any
  setFilters: (updater: (f: any) => any) => void
  clearAll: () => void
  setUsuarioId: (id: string) => void
  getUserId: (u: any) => string | null
  getUserEmail: (u: any) => string
}) {
  return (
    <TableRow>
      <TableCell>
        <Select
          size="small" fullWidth displayEmpty
          value={filters.usuarioId}
          onChange={e => setUsuarioId(String(e.target.value))}
        >
          <MenuItem value=""><em>Todos</em></MenuItem>
          {(usuarios ?? []).map(u => {
            const id = getUserId(u); if (id == null) return null
            return <MenuItem key={String(id)} value={String(id)}>{getUserEmail(u)}</MenuItem>
          })}
        </Select>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth placeholder="Filtrar nombre…"
          value={filters.nombre} onChange={e => setFilters((f:any) => ({ ...f, nombre: e.target.value }))}/>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth placeholder="Filtrar correo…"
          value={filters.correo} onChange={e => setFilters((f:any) => ({ ...f, correo: e.target.value }))}/>
      </TableCell>
      <TableCell />
      <TableCell>
        <TextField size="small" fullWidth placeholder="Filtrar temperatura…"
          value={filters.temperatura} onChange={e => setFilters((f:any) => ({ ...f, temperatura: e.target.value }))}/>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth placeholder="Proyecto/Propiedad…"
          value={filters.proyectoTexto} onChange={e => setFilters((f:any) => ({ ...f, proyectoTexto: e.target.value }))}/>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth type="date"
          value={filters.fechaProximo} onChange={e => setFilters((f:any) => ({ ...f, fechaProximo: e.target.value }))}/>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth type="date"
          value={filters.fechaActualizacion} onChange={e => setFilters((f:any) => ({ ...f, fechaActualizacion: e.target.value }))}/>
      </TableCell>
      <TableCell>
        <TextField size="small" fullWidth placeholder="Filtrar comentarios…"
          value={filters.comentarios} onChange={e => setFilters((f:any) => ({ ...f, comentarios: e.target.value }))}/>
      </TableCell>
      <TableCell align="center">
        <Tooltip title="Limpiar filtros">
          <IconButton size="small" onClick={clearAll}>
            <span style={{ fontWeight: 700 }}>✕</span>
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
