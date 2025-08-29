// src/pages/config/InteresadosPage.tsx (o el archivo donde tengas handleInactivar)
import React, { useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'

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

// Importa el hook que escribimos
import { useStatusChip } from '../../config/context/useStatusChip'
const InteresadosPage: React.FC = () => {
  const { user } = useAuthRole()
  
  const { usuarios } = useFetchUsuarios()
  const { empresas } = useFetchEmpresas()

  const [modalOpenUsuario, setModalOpenUsuario] = useState(false)
  const [modalOpenEmpresa, setModalOpenEmpresa] = useState(false)

  const [usuario, setUsuario] = useState<User | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(false)

  // Extraemos showStatus y el componente StatusChip
  const { showStatus } = useStatusChip()

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
      showStatus(
        err?.message
          ? `Error al guardar empresa: ${err.message}`
          : 'Error al guardar empresa',
        'error'
      )
    } finally {
      setModalOpenEmpresa(false)
      setEmpresa(null)
      setLoading(false)
    }
  }

  const handleSaveUsuario = async (u: User) => {
    console.log(u)
    setLoading(true)
    try {
      await actualizarUsuario(u)
      showStatus('Usuario guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(
        err?.message
          ? `Error al guardar usuario: ${err.message}`
          : 'Error al guardar usuario',
        'error'
      )
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

  return (
    <>
      {loading && <Spinner open={true} />}


      <Box display="flex" justifyContent="end" mb={2}>
        <Tooltip title="Agregar Empresa">
          <IconButton onClick={handleAgregarEmpresa} color="primary">
            <AddBusinessIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
         

      <TableContainer component={Paper} sx={{ minWidth: '90vw' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'var(--primary-color)' }}>
              <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white' }}>Correo</TableCell>
              <TableCell sx={{ color: 'white' }}>Rol</TableCell>
              <TableCell sx={{ color: 'white' }} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map(emp => {
              const usuariosDeEmpresa = usuarios.filter(
                u => u.empresaid === emp.id
              )
              return (
                <React.Fragment key={emp.id}>
                  <TableRow
                    sx={{
                      backgroundColor: 'var(--secondary-color)',
                      color: 'white',
                    }}
                  >
                    <TableCell
                      colSpan={4}
                      sx={{ color: 'white', fontWeight: 'bold' }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography sx={{ color: 'white' }}>
                          {emp.nombre}
                        </Typography>
                        <Box>
                          <Tooltip title="Ver Empresa">
                            <IconButton
                              onClick={() => handleEditEmpresa(emp)}
                              sx={{ color: 'white' }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Agregar Usuario">
                            <IconButton
                              onClick={() => {
                                const nuevo: User = {
                                  id: crypto.randomUUID(),
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
                        <TableCell>
                          {typeof u.role === 'string'
                            ? u.role
                            : u.role?.tipo ?? '—'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleEditUsuario(u)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ color: '#666', fontStyle: 'italic' }}
                      >
                        No hay usuarios registrados para esta empresa.
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
          onClose={() => {
            setModalOpenEmpresa(false)
            setEmpresa(null)
          }}
          empresa={empresa}
          setEmpresa={setEmpresa}
          onSave={handleSaveEmpresa}
        />
      )}

      {usuario && (
        <ModalUsuario
          open={modalOpenUsuario}
          onClose={() => {
            setModalOpenUsuario(false)
            setUsuario(null)
          }}
          usuario={usuario}
          setUsuario={setUsuario}
          onSave={handleSaveUsuario}
          empresas={empresas}
        />
      )}
    </>
  )
}

export default InteresadosPage
