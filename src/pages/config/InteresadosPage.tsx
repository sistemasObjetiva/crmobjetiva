// src/pages/config/InteresadosPage.tsx
import React, { useMemo, useState } from 'react'
import {
  Box, Typography, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  LinearProgress, Stack, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'

import { useAuthRole } from '../../config/auth'
import { Empresa, ROLES, User } from '../../config/types'
import {
  actualizarEmpresa,
  actualizarUsuario,
  useFetchEmpresas,
  useFetchUsuarios,
} from '../../hooks/useFetchFunctions'
import Spinner from '../../components/general/Spinner'
import ModalEmpresa from '../../components/config/ModalEmpresa'
import ModalUsuario from '../../components/config/ModalUsuario'
import { useStatusChip } from '../../config/context/useStatusChip'

const InteresadosPage: React.FC = () => {
  const { user } = useAuthRole()
  const { usuarios } = useFetchUsuarios()
  const { empresas } = useFetchEmpresas()

  const [modalOpenUsuario, setModalOpenUsuario] = useState(false)
  const [modalOpenEmpresa, setModalOpenEmpresa] = useState(false)

  const [usuario, setUsuario] = useState<User | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading,   setLoading] = useState(false)

  const { showStatus } = useStatusChip()

  // === IMPORT CSV (state) ===
  const [importOpen, setImportOpen] = useState(false)
  const [empresaImport, setEmpresaImport] = useState<Empresa | null>(null)
  const [csvName, setCsvName] = useState<string>('')
  const [rows, setRows] = useState<Array<{ nombre: string; email: string }>>([])
  const [badRows, setBadRows] = useState<Array<{ raw: string; reason: string }>>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [okCount, setOkCount] = useState(0)
  const [errCount, setErrCount] = useState(0)
  const [skipCount, setSkipCount] = useState(0)

  // === FILTROS ===
  const [empresaQuery, setEmpresaQuery] = useState('')
  const [usuarioQuery, setUsuarioQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // helpers
  const emailRegex = useMemo(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/, [])
  const norm = (s?: string) => (s ?? '').toString().trim().toLowerCase()

  const handleAgregarEmpresa = () => {
    const nuevo: Empresa = {
      id: crypto.randomUUID(),
      nombre: '',
      userid: user.id,
      correocontacto: '',
      telefono: '',
      estatus: 'activo',
    }
    setEmpresa(nuevo)
    setModalOpenEmpresa(true)
  }

  const handleSaveEmpresa = async (e: Empresa) => {
    setLoading(true)
    try {
      await actualizarEmpresa(e)
      showStatus('Empresa guardada exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(err?.message ? `Error al guardar empresa: ${err.message}` : 'Error al guardar empresa', 'error')
    } finally {
      setModalOpenEmpresa(false)
      setEmpresa(null)
      setLoading(false)
    }
  }

  const handleSaveUsuario = async (u: User) => {
    setLoading(true)
    try {
      await actualizarUsuario(u)
      showStatus('Usuario guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(err?.message ? `Error al guardar usuario: ${err.message}` : 'Error al guardar usuario', 'error')
    } finally {
      setModalOpenUsuario(false)
      setUsuario(null)
      setLoading(false)
    }
  }

  const handleEditUsuario = (u: User) => {
    setUsuario(u)
    setModalOpenUsuario(true)
  }

  const handleEditEmpresa = (e: Empresa) => {
    setEmpresa(e)
    setModalOpenEmpresa(true)
  }

  // === IMPORT CSV (open per company) ===
  const handleOpenImport = (emp: Empresa) => {
    setEmpresaImport(emp)
    setImportOpen(true)
    setCsvName('')
    setRows([])
    setBadRows([])
    setProgress(0)
    setOkCount(0)
    setErrCount(0)
    setSkipCount(0)
  }

  // === IMPORT CSV: parse file ===
  const handleReadFile = async (file: File) => {
    setCsvName(file.name)
    const text = await file.text()

    // Detectar delimitador: , ; o tab
    const firstLine = text.split(/\r?\n/)[0] || ''
    const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(';') ? ';' : ',')
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)

    if (lines.length === 0) {
      setRows([])
      return
    }

    // Header flexible: nombre,email (case-insensitive)
    const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase())
    const idxNombre = header.findIndex(h => ['nombre','name','nombre completo'].includes(h))
    const idxEmail  = header.findIndex(h => ['email','correo','mail'].includes(h))
    const start = (idxNombre >= 0 && idxEmail >= 0) ? 1 : 0

    const rawRows = lines.slice(start).map(raw => {
      const parts = raw.split(delimiter).map(s => s.trim())
      const nombre = idxNombre >= 0 ? (parts[idxNombre] || '') : (parts[0] || '')
      const email  = idxEmail  >= 0 ? (parts[idxEmail]  || '') : (parts[1] || '')
      return { raw, nombre, email }
    })

    // limpieza + validaciones
    const seen = new Set<string>()
    const good: Array<{ nombre: string; email: string }> = []
    const bad: Array<{ raw: string; reason: string }> = []

    for (const r of rawRows) {
      const nombre = (r.nombre || '').trim()
      const email  = (r.email  || '').trim().toLowerCase()
      if (!emailRegex.test(email)) { bad.push({ raw: r.raw, reason: 'email inválido' }); continue }
      if (seen.has(email)) { bad.push({ raw: r.raw, reason: 'duplicado email' }); continue }
      seen.add(email)
      good.push({ nombre, email })
    }

    setRows(good)
    setBadRows(bad)
  }

  // === IMPORT CSV: run import ===
  const runImport = async () => {
    if (!empresaImport || rows.length === 0) return
    setImporting(true)
    setProgress(0)
    setOkCount(0)
    setErrCount(0)
    setSkipCount(badRows.length)

    let done = 0
    for (const r of rows) {
      try {
        const u: User = {
          id: '' as any,                                 // fuerza creación en Auth (se ignora)
          nombre: r.nombre || '',
          email: r.email,
          telefono: '',
          role: ROLES.Usuario,
          empresaid: empresaImport.id,
          estatus: 'activo',
        }
        await actualizarUsuario(u)
        setOkCount(prev => prev + 1)
      } catch (e) {
        console.error('Import usuario error', r.email, e)
        setErrCount(prev => prev + 1)
      } finally {
        done += 1
        setProgress(Math.round((done / rows.length) * 100))
      }
    }

    setImporting(false)
    showStatus(`Importación terminada: OK ${okCount}/${rows.length} (saltados ${badRows.length}, errores ${errCount})`, 'success')
  }

  // === APLICAR FILTROS ===
  const empresasFiltradas = useMemo(() => {
    const q = norm(empresaQuery)
    if (!q) return empresas
    return empresas.filter(e => norm(e.nombre).includes(q))
  }, [empresas, empresaQuery])

  const usuariosPorEmpresaFiltrados = useMemo(() => {
    const qU = norm(usuarioQuery)
    const selectedRole = roleFilter
    // construimos un mapa empresaId -> usuarios filtrados
    const map = new Map<string, User[]>()
    for (const emp of empresasFiltradas) {
      const list = usuarios.filter(u => u.empresaid === emp.id).filter(u => {
        const matchesUser =
          !qU ||
          norm(u.nombre).includes(qU) ||
          norm(u.email).includes(qU)
        const curRole = typeof u.role === 'string' ? u.role : (u.role?.tipo ?? '')
        const matchesRole = selectedRole === 'all' || norm(curRole) === norm(selectedRole)
        return matchesUser && matchesRole
      })
      map.set(emp.id, list)
    }
    return map
  }, [empresasFiltradas, usuarios, usuarioQuery, roleFilter])

  const totalUsuariosFiltrados = useMemo(() => {
    let sum = 0
    usuariosPorEmpresaFiltrados.forEach(arr => { sum += arr.length })
    return sum
  }, [usuariosPorEmpresaFiltrados])

  return (
    <>
      {loading && <Spinner open={true} />}

      {/* Barra superior con botón claro */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={800}>
          Empresas y Usuarios
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
          <TextField
            size="small"
            label="Filtrar empresa"
            value={empresaQuery}
            onChange={(e) => setEmpresaQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            label="Filtrar usuario (nombre o correo)"
            value={usuarioQuery}
            onChange={(e) => setUsuarioQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="role-filter-label"><FilterListIcon sx={{ mr: 1 }} /> Rol</InputLabel>
            <Select
              labelId="role-filter-label"
              label="Rol"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="gerencia">Gerencia</MenuItem>
              <MenuItem value="operacion">Operación</MenuItem>
              <MenuItem value="usuario">Usuario</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Crear nueva empresa">
            <span>
              <Button
                onClick={handleAgregarEmpresa}
                variant="contained"
                startIcon={<AddBusinessIcon />}
                sx={{ fontWeight: 800 }}
              >
                Nueva Empresa
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Resumen filtros */}
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
        <Chip label={`Empresas: ${empresasFiltradas.length}`} size="small" />
        <Chip label={`Usuarios visibles: ${totalUsuariosFiltrados}`} size="small" />
        {empresaQuery && <Chip label={`Filtro empresa: "${empresaQuery}"`} size="small" color="info" />}
        {usuarioQuery && <Chip label={`Filtro usuario: "${usuarioQuery}"`} size="small" color="info" />}
        {roleFilter !== 'all' && <Chip label={`Rol: ${roleFilter}`} size="small" color="warning" />}
      </Stack>

      <TableContainer component={Paper} sx={{ minWidth: '90vw' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'var(--primary-color)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Correo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresasFiltradas.map(emp => {
              const usuariosDeEmpresa = usuariosPorEmpresaFiltrados.get(emp.id) ?? []
              return (
                <React.Fragment key={emp.id}>
                  <TableRow sx={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
                    <TableCell colSpan={4} sx={{ color: 'white', fontWeight: 'bold' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: 'white' }}>{emp.nombre}</Typography>
                          <Chip
                            size="small"
                            label={`${usuariosDeEmpresa.length} usuario${usuariosDeEmpresa.length === 1 ? '' : 's'}`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        </Stack>
                        <Box>
                          <Tooltip title="Ver Empresa">
                            <IconButton onClick={() => handleEditEmpresa(emp)} sx={{ color: 'white' }}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Importar usuarios (CSV)">
                            <IconButton onClick={() => handleOpenImport(emp)} sx={{ color: 'white' }}>
                              <UploadFileIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Agregar Usuario">
                            <IconButton
                              onClick={() => {
                                const nuevo: User = {
                                  id: '' as any, // ← sin id para que se cree en Auth
                                  nombre: '',
                                  email: '',
                                  telefono: '',
                                  role: ROLES.Usuario,
                                  empresaid: emp.id,
                                  estatus: 'activo',
                                }
                                setUsuario(nuevo)
                                setModalOpenUsuario(true)
                              }}
                              sx={{ color: 'white' }}
                            >
                              <PersonAddIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {usuariosDeEmpresa.length > 0 ? (
                    usuariosDeEmpresa.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.nombre}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{typeof u.role === 'string' ? u.role : u.role?.tipo ?? '—'}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleEditUsuario(u)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: '#666', fontStyle: 'italic' }}>
                        No hay usuarios con los filtros aplicados para esta empresa.
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {empresa && (
        <ModalEmpresa
          open={modalOpenEmpresa}
          onClose={() => { setModalOpenEmpresa(false); setEmpresa(null) }}
          empresa={empresa}
          setEmpresa={setEmpresa}
          onSave={handleSaveEmpresa}
        />
      )}

      {usuario && (
        <ModalUsuario
          open={modalOpenUsuario}
          onClose={() => { setModalOpenUsuario(false); setUsuario(null) }}
          usuario={usuario}
          setUsuario={setUsuario}
          onSave={handleSaveUsuario}
          empresas={empresas}
        />
      )}

      {/* === IMPORT CSV: Dialog === */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar usuarios a: {empresaImport?.nombre ?? '—'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
              disabled={importing}
            >
              Seleccionar CSV
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleReadFile(f)
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Formato: columnas <b>nombre,email</b> (delimitador <b>,</b>, <b>;</b> o <b>tab</b>).
            </Typography>

            {csvName && (
              <Typography variant="body2">
                Archivo: <b>{csvName}</b> — registros válidos: <b>{rows.length}</b>, inválidos/duplicados: <b>{badRows.length}</b>
              </Typography>
            )}

            {importing && (
              <>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption">Progreso: {progress}% — OK: {okCount} · Errores: {errCount} · Saltados: {skipCount}</Typography>
              </>
            )}

            {!importing && rows.length > 0 && (
              <Box sx={{ p: 1, border: '1px solid #eee', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Vista previa (primeros 10)</Typography>
                {rows.slice(0, 10).map((r, i) => (
                  <Typography key={i} variant="body2">• {r.nombre || '(sin nombre)'} — {r.email}</Typography>
                ))}
              </Box>
            )}

            {!importing && badRows.length > 0 && (
              <Typography variant="caption" color="error">
                {badRows.length} registros se omitirán (email inválido o duplicado).
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>Cerrar</Button>
          <Button
            onClick={runImport}
            variant="contained"
            disabled={importing || rows.length === 0 || !empresaImport}
          >
            Importar {rows.length} usuarios
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default InteresadosPage
