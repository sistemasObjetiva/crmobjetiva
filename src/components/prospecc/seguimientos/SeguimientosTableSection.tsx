
import {
  Box, CircularProgress, IconButton, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, TablePagination, Tooltip, Typography, TableSortLabel
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash'

import { OrderByKey } from '../../../hooks/seguimientos/useSeguimientosViewModel'
import { getEstatusChip } from '../../../hooks/useUtilsFunctions'
import ProyectosInteresChips from './ProyectoInteresChip'
import SeguimientosFiltersRow from './SeguimientoFiltersRow'

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '')

export interface SeguimientosTableSectionProps {
  estatusValue: string
  allRows: any[]
  page: number
  rowsPerPage: number
  onPageChange: (newPage: number) => void
  onRowsPerPageChange: (rpp: number) => void
  orderBy: OrderByKey
  order: 'asc' | 'desc'
  onRequestSort: (key: OrderByKey) => void
  loading: boolean

  // filtros (fila de filtros)
  usuarios: any[]
  filters: any
  setFilters: (updater: any) => void
  clearAllFilters: () => void
  setUsuarioId: (id: string) => void
  getUserId: (u: any) => string | null
  getUserEmail: (u: any) => string

  // mapas / datos auxiliares
  prospectosById: Map<string, any>
  usuariosById: Map<string, any>
  proyectos: any[]
  propiedades: any[]

  // acciones
  onView: (s: any) => void

  // NUEVO: baja/restaurar (borrado lógico en Prospecto.estatusBaja)
  onToggleBaja: (prospectoId: string, next: boolean) => void
}

export default function SeguimientosTableSection({
  estatusValue,
  allRows,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  orderBy,
  order,
  onRequestSort,
  loading,
  // filters row
  usuarios,
  filters,
  setFilters,
  clearAllFilters,
  setUsuarioId,
  getUserId,
  getUserEmail,
  // maps
  prospectosById,
  usuariosById,
  proyectos,
  propiedades,
  // actions
  onView,
  onToggleBaja,
}: SeguimientosTableSectionProps) {
  const start = page * rowsPerPage
  const pageRows = allRows.slice(start, start + rowsPerPage)

  return (
    <Box mb={4}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        mb={1}
        sx={{ textTransform: 'uppercase', letterSpacing: 1, minHeight: 40 }}
      >
        {getEstatusChip(estatusValue)}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          color="text.secondary"
          sx={{ lineHeight: 1, mb: 0, fontSize: 17 }}
        >
          ({allRows.length})
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{ mb: 2, borderLeft: '5px solid var(--primary-color, #1976d2)', overflowX: 'auto' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {[
                { key: 'usuario', label: 'Usuario (email)' },
                { key: 'nombre', label: 'Nombre' },
                { key: 'correo', label: 'Correo' },
                { key: 'estatus', label: 'Estatus', sortable: false },
                { key: 'temperatura', label: 'Temperatura' },
                { key: 'proyectos', label: 'Proyectos/Propiedades interés', sortable: false },
                { key: 'fechaProximo', label: 'Fecha Próx. Seguimiento' },
                { key: 'fechaActualizacion', label: 'Fecha actualización' },
                { key: 'comentarios', label: 'Comentarios', sortable: false },
                { key: 'ver', label: 'Ver', sortable: false, align: 'center' },
                // NUEVA columna de baja/restaurar
                { key: 'baja', label: 'Baja', sortable: false, align: 'center' },
              ].map(col => (
                <TableCell
                  key={col.key}
                  sortDirection={(col.sortable !== false && orderBy === (col.key as OrderByKey)) ? order : false}
                  align={col.align as any}
                >
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === (col.key as OrderByKey)}
                      direction={orderBy === (col.key as OrderByKey) ? order : 'asc'}
                      onClick={() => onRequestSort(col.key as OrderByKey)}
                    >
                      {col.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Filtros inline */}
            <SeguimientosFiltersRow
              usuarios={usuarios}
              filters={filters}
              setFilters={setFilters}
              clearAll={clearAllFilters}
              setUsuarioId={setUsuarioId}
              getUserId={getUserId}
              getUserEmail={getUserEmail}
            />
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <Box p={4} display="flex" justifyContent="center">
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12}>
                  <Typography color="text.secondary" align="center" fontSize={14}>
                    {allRows.length ? 'Sin resultados en esta página/filtros' : 'Sin seguimientos en este estatus'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((s: any) => {
                const prospecto = prospectosById.get(s.idprospecto)
                const usuario = usuariosById.get(String(s.userid))
                const isBaja = Boolean(prospecto?.estatusBaja)

                return (
                  <TableRow
                    key={s.id}
                    sx={
                      isBaja
                        ? {
                            opacity: 0.6,
                            '& td': {
                              textDecoration: 'line-through',
                              textDecorationThickness: '1px',
                            },
                          }
                        : undefined
                    }
                  >
                    <TableCell>{getUserEmail(usuario)}</TableCell>
                    <TableCell>{prospecto?.nombreCompleto ?? ''}</TableCell>
                    <TableCell>{prospecto?.correoElectronico ?? ''}</TableCell>
                    <TableCell>{getEstatusChip(s.estatusSeguimiento)}</TableCell>
                    <TableCell>{s.temperaturaInteres}</TableCell>
                    <TableCell>
                      <ProyectosInteresChips
                        ids={prospecto?.proyectosInteres}
                        proyectos={proyectos}
                        propiedades={propiedades}
                      />
                    </TableCell>
                    <TableCell>{fmtDate(s.fechaProximoSeguimiento)}</TableCell>
                    <TableCell>{fmtDate(s.fechaActualizacion)}</TableCell>
                    <TableCell>{s.comentarios}</TableCell>

                    <TableCell align="center">
                      <Tooltip title="Ver seguimiento">
                        <IconButton onClick={() => onView(s)} size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Baja / Restaurar */}
                    <TableCell align="center">
                      {prospecto ? (
                        isBaja ? (
                          <Tooltip title="Restaurar (quitar baja)">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Restaurar a ${prospecto.nombreCompleto || 'prospecto'}?`
                                  )
                                ) {
                                  onToggleBaja(prospecto.id, false)
                                }
                              }}
                            >
                              <RestoreFromTrashIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Dar de baja (borrado lógico)">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Dar de baja a ${prospecto.nombreCompleto || 'prospecto'}?`
                                  )
                                ) {
                                  onToggleBaja(prospecto.id, true)
                                }
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Paginación por estatus */}
        <Box sx={{ px: 1 }}>
          <TablePagination
            component="div"
            count={allRows.length}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página"
          />
        </Box>
      </Paper>
    </Box>
  )
}
