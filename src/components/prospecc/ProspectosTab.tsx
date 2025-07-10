import React, { useState } from 'react'
import {
  Box, Typography, IconButton, Paper, Tooltip, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress,
  Chip
} from '@mui/material'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { updateProspecto, useFetchPropiedades, useFetchProspectosUser, useFetchProyects } from '../../hooks/useFetchFunctions'
import { Prospecto } from '../../config/types'
import NuevoProspectoModal from './ProspectoModal'
import { useStatusChip } from '../../config/context/useStatusChip'
import Spinner from '../general/Spinner'
import SignedAvatar from '../general/SignedAvatar'

interface ProspectosTabProps {
  userid: string
}

const ProspectosTab: React.FC<ProspectosTabProps> = ({ userid }) => {
  const { showStatus } = useStatusChip()
  const { prospectos, loading: loadingProspectos } = useFetchProspectosUser(userid)
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const [modalOpen, setModalOpen] = useState(false)
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState<Prospecto | null>(null)
  const [loading, setLoading] = useState(false)

  // Factory para prospecto limpio
  const initialProspecto = (): Prospecto => ({
    id: crypto.randomUUID(),
    userid,
    nombreCompleto: '',
    correoElectronico: '',
    celular: '',
    ocupacionCliente: '',
    edoCivilCliente: '',
    clasificacionCliente: '',
    medioCaptacion: '',
    proyectosInteres: [],
  })

  const handleAbrirModalNuevo = () => {
    setProspectoSeleccionado(initialProspecto())
    setModalOpen(true)
  }

  const handleAbrirModalVer = (prospecto: Prospecto) => {
    setProspectoSeleccionado(prospecto)
    setModalOpen(true)
  }

  const handleGuardarProspecto = async (p: Prospecto) => {
    setLoading(true)
    try {
      await updateProspecto(p)
      showStatus('Prospecto guardado exitosamente', 'success')
    } catch (err: any) {
      console.error(err)
      showStatus(
        err?.message
          ? `Error al guardar prospecto: ${err.message}`
          : 'Error al guardar prospecto',
        'error'
      )
    } finally {
      setModalOpen(false)
      setProspectoSeleccionado(null)
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Prospecto, value: any) => {
    setProspectoSeleccionado(prev => prev ? { ...prev, [field]: value } : null)
  }

  return (
    <Box>
      {loading && <Spinner open={true} />}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Lista de prospectos
        </Typography>
        <Tooltip title="Agregar prospecto">
          <IconButton color="primary" onClick={handleAbrirModalNuevo} size="large" sx={{ borderRadius: 2 }}>
            <PersonAddAltIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Box>
      <Paper variant="outlined">
        {loadingProspectos ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Celular</TableCell>
                <TableCell>Clasificación</TableCell>
                <TableCell>Proyecto(s) interés</TableCell>
                <TableCell>Fecha creación</TableCell>
                <TableCell align="center">Ver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!prospectos || prospectos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" align="center">
                      Sin prospectos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prospectos
                  .filter(Boolean)
                  .map((p) => (
                    <TableRow key={p.id ?? p.correoElectronico ?? Math.random()}>
                      <TableCell>{p.nombreCompleto}</TableCell>
                      <TableCell>{p.correoElectronico}</TableCell>
                      <TableCell>{p.celular}</TableCell>
                      <TableCell>{p.clasificacionCliente}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(p.proyectosInteres ?? []).map((id) => {
                            // Buscar si es un proyecto
                            const proy = proyectos.find(x => x.id === id)
                            if (proy) {
                                return (
                                <Chip
                                    key={id}
                                    label={proy.nombre}
                                    avatar={
                                    proy.logo && (
                                        <SignedAvatar
                                        value={proy.logo}
                                        alt={proy.nombre}
                                        sx={{ width: 24, height: 24 }}
                                        />
                                    )
                                    }
                                    size="small"
                                    sx={{ mr: 0.5,bgcolor: 'transparent', }}
                                />
                                )
                            }
                            // Si no, buscar si es una propiedad
                            const prop = propiedades.find(x => x.id === id)
                            if (prop) {
                                return (
                                <Chip
                                    key={id}
                                    label={prop.tituloPropiedad}
                                    avatar={
                                    prop.imagenes?.length ? (
                                        <SignedAvatar
                                        value={prop.imagenes[0]}
                                        alt={prop.tituloPropiedad}
                                        sx={{ width: 24, height: 24,    }}
                                        />
                                    ) : undefined
                                    }
                                    size="small"
                                    sx={{ mr: 0.5 ,bgcolor: 'transparent',}}
                                    
                                />
                                )
                            }
                            return null // Si no encontró nada
                            })}
                        </Box>
                        </TableCell>
                      <TableCell>
                        {p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString() : ''}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver prospecto">
                          <IconButton onClick={() => handleAbrirModalVer(p)} size="small">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <NuevoProspectoModal
        open={modalOpen}
        prospecto={prospectoSeleccionado || initialProspecto()}
        onChange={handleChange}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardarProspecto}
        proyectos={proyectos}
        propiedades={propiedades}
        readOnly={false}
      />
    </Box>
  )
}

export default ProspectosTab
