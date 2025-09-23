import { useMemo, useState } from 'react'
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

import {
  useFetchPropiedades,
  useFetchProspectos,
  useFetchProyects,
  useFetchSeguimientos,
  useFetchUsuarios,
  updateSeguimiento,
  updateProspecto,           // 👈 asegúrate de tener este helper en tus hooks
} from '../../../hooks/useFetchFunctions'

import { useStatusChip } from '../../../config/context/useStatusChip'
import { ESTATUS_OPCIONES, Seguimiento } from '../../../config/types'

import SeguimientosToolbar from './SeguimientosToolbar'
import SeguimientosTableSection from './SeguimientosTableSection'
import SeguimientosCharts from './SeguimientosCharts'
import SeguimientoModal from './SeguimientoModal'

import { useSeguimientosViewModel, DEFAULT_RPP } from '../../../hooks/seguimientos/useSeguimientosViewModel'

const getUserId    = (u: any) => u?.id ?? u?.uid ?? null
const getUserEmail = (u: any) => u?.email ?? u?.correo ?? u?.correoElectronico ?? ''
const getUserName  = (u: any) => u?.nombre ?? u?.displayName ?? u?.name ?? ''

export default function SeguimientosGeneralPage() {
  const { showStatus } = useStatusChip()
  const { seguimientos, loading: loadingSeguimientos } = useFetchSeguimientos()
  const { prospectos } = useFetchProspectos()
  const { proyectos } = useFetchProyects()
  const { propiedades } = useFetchPropiedades()
  const { usuarios } = useFetchUsuarios()

  const usuariosById = useMemo(() => {
    const map = new Map<string, any>()
    ;(usuarios ?? []).forEach(u => { const id = getUserId(u); if (id != null) map.set(String(id), u) })
    return map
  }, [usuarios])

  const idToLabel = useMemo(() => {
    const map = new Map<string, string>()
    proyectos.forEach(p => map.set(p.id, p.nombre))
    propiedades.forEach(p => map.set(p.id, p.tituloPropiedad))
    return map
  }, [proyectos, propiedades])

  const getUsuarioEmailById = (id?: string) => (id ? getUserEmail(usuariosById.get(String(id))) : '')

  const vm = useSeguimientosViewModel({
    seguimientos, prospectos, usuariosById, getUsuarioEmailById, idToLabel
  })

  // ------- Exportadores -------
  const handleExportExcel = () => {
    const all = (seguimientos ?? [])
    const filtered = vm.filtroUsuarioId ? all.filter(s => String(s.userid) === vm.filtroUsuarioId) : all
    const rows = filtered.map(s => {
      const u = usuariosById.get(String(s.userid))
      return { ...s, usuarioEmail: getUserEmail(u) }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Seguimientos')
    XLSX.writeFile(wb, 'seguimientos.xlsx')
  }

  const handleExportFilteredExcel = () => {
    const rows = vm.rowsForCharts.map((s) => {
      const p = (prospectos ?? []).find(pp => pp.id === s.idprospecto)
      const u = usuariosById.get(String(s.userid))
      const proyectosLabels = (p?.proyectosInteres ?? [])
        .map(id => idToLabel.get(id) ?? id)
        .filter(Boolean)
        .join(' | ')
      return {
        id: s.id,
        usuarioEmail: getUserEmail(u),
        usuarioNombre: getUserName(u),
        prospectoNombre: p?.nombreCompleto ?? '',
        prospectoCorreo: p?.correoElectronico ?? '',
        estatus: s.estatusSeguimiento,
        temperatura: s.temperaturaInteres ?? '',
        proyectosInteres: proyectosLabels,
        unidadInteres: s.unidadInteres ?? s.proyectoInteres ?? '',
        formaDePago: s.formaDePago ?? '',
        capacidadDePago: s.capacidadDePago ?? '',
        comentarios: s.comentarios ?? '',
        fechaProximoSeguimiento: s.fechaProximoSeguimiento ?? '',
        fechaActualizacion: s.fechaActualizacion ?? '',
        fechaCreacion: s.fechaCreacion ?? '',
      }
    })
    if (!rows.length) { showStatus('No hay filas con los filtros actuales', 'warning'); return }
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'SeguimientosFiltrados')
    XLSX.writeFile(wb, 'seguimientos_filtrados.xlsx')
  }

  const handleExportFilteredCSV = () => {
    const header = [
      'Consecutivo','Fecha Registro','Nombre Completo Cliente','Celular Cliente','Correo Electrónico Cliente',
      'Ocupación Cliente','Medio de Captación','Vendedor','Ultimo seguimiento','Razón','Estatus',
    ]
    const rowsAOA: (string | number)[][] = [header]
    vm.rowsForCharts.forEach((s, idx) => {
      const p = (prospectos ?? []).find(pp => pp.id === s.idprospecto)
      const u = usuariosById.get(String(s.userid))
      const lastHist = [...(s.historialSeguimiento ?? [])]
        .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
        .at(-1)
      const fechaReg = s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleDateString() : ''
      const vendedor = getUserName(u) || getUserEmail(u)
      rowsAOA.push([
        idx + 1, fechaReg, p?.nombreCompleto ?? '', p?.celular ?? '', p?.correoElectronico ?? '',
        '', '', vendedor, (lastHist?.comentarios || s.comentarios || '').toString(),
        Array.isArray(s.motivo) ? s.motivo.join(' | ') : (s as any)?.razon ?? '',
        s.estatusSeguimiento ?? '',
      ])
    })
    if (rowsAOA.length === 1) { showStatus('No hay filas con los filtros actuales', 'warning'); return }
    const csv = Papa.unparse(rowsAOA)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seguimientos_filtrados.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ------- Modal ver/editar -------
  const [modalOpen, setModalOpen] = useState(false)
  const [seguimientoLocal, setSeguimientoLocal] = useState<Seguimiento | null>(null)
  const handleAbrirModalVer = (s: Seguimiento) => { setSeguimientoLocal(s); setModalOpen(true) }
  const [_, setSaving] = useState(false)
  const handleGuardarSeguimiento = async (s: Seguimiento) => {
    setSaving(true)
    try { await updateSeguimiento(s); showStatus('Seguimiento guardado', 'success') }
    catch (e:any){ showStatus(e?.message || 'Error al guardar', 'error') }
    finally { setSaving(false); setModalOpen(false); setSeguimientoLocal(null) }
  }

  // ------- Baja / restaurar (borrado lógico en Prospecto) -------
  const prospectosById = useMemo(() => new Map(prospectos.map(p => [p.id, p])), [prospectos])

  const onToggleBaja = async (prospectoId: string, next: boolean) => {
    const p = prospectosById.get(prospectoId)
    if (!p) { showStatus('Prospecto no encontrado', 'error'); return }
    try {
      await updateProspecto({
        ...p,
        estatusBaja: next,
        fechaActualizacion: new Date().toISOString(),
      })
      showStatus(next ? 'Prospecto dado de baja' : 'Prospecto restaurado', 'success')
    } catch (e:any) {
      showStatus(e?.message || 'No se pudo actualizar la baja', 'error')
    }
  }

  // ------- Import CSV (abrir diálogo) -------
  const [importOpen, setImportOpen] = useState(false)
  const onOpenImport = () => setImportOpen(true)

  return (
    <Box>
      {/* Toolbar */}
      <SeguimientosToolbar
        usuarios={usuarios}
        filtroUsuarioId={vm.filtroUsuarioId}
        setUsuarioId={vm.setUsuarioId}
        onExportExcel={handleExportExcel}
        onExportFilteredExcel={handleExportFilteredExcel}
        onExportFilteredCSV={handleExportFilteredCSV}
        onOpenImport={onOpenImport}
        getUserLabelById={(id) => {
          const u = usuariosById.get(String(id))
          const name = getUserName(u); const email = getUserEmail(u)
          return name && email ? `${name} (${email})` : (name || email || '—')
        }}
        getUserId={getUserId}
      />

      {/* Gráficas */}
      <SeguimientosCharts
        rows={vm.rowsForCharts}
        usuariosById={usuariosById}
        idToLabel={idToLabel}
        getUserEmailById={(id?: string) => (id ? getUserEmail(usuariosById.get(String(id))) : '')}
        selectedUserId={vm.filtroUsuarioId}
        selectedProjectLabel={vm.filters.proyectoTexto}
        selectedStatus={vm.statusFocus}
        onSelectUser={(userId) => vm.setUsuarioId(userId)}
        onSelectProyecto={(label) => vm.setFilters(f => ({ ...f, proyectoTexto: label }))}
        onSelectStatus={(status) => vm.setStatusFocus(status)}
      />

      {/* Secciones por estatus */}
      {(vm.statusFocus ? ESTATUS_OPCIONES.filter(e => e.value === vm.statusFocus) : ESTATUS_OPCIONES).map(estatus => {
        const estKey = estatus.value
        const allRows = vm.rowsByStatus[estKey] ?? []
        const { page, rowsPerPage } = vm.paging[estKey] ?? { page: 0, rowsPerPage: DEFAULT_RPP }

        return (
          <SeguimientosTableSection
            key={estKey}
            estatusValue={estKey}
            allRows={allRows}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(newPage:number) => vm.onChangePage(estKey, newPage)}
            onRowsPerPageChange={(rpp:number) => vm.onChangeRpp(estKey, rpp)}
            order={vm.order}
            orderBy={vm.orderBy}
            onRequestSort={(k:any)=>vm.handleRequestSort(k)}
            loading={loadingSeguimientos}
            // filters row
            usuarios={usuarios}
            filters={vm.filters}
            setFilters={vm.setFilters}
            clearAllFilters={() => {
              vm.setFilters({
                usuarioId:'', nombre:'', correo:'', temperatura:'', unidad:'', proyectoTexto:'',
                fechaProximo:'', fechaActualizacion:'', comentarios:''
              })
              vm.setUsuarioId('')
            }}
            setUsuarioId={vm.setUsuarioId}
            getUserId={getUserId}
            getUserEmail={getUserEmail}
            // maps
            prospectosById={prospectosById}
            usuariosById={usuariosById}
            proyectos={proyectos}
            propiedades={propiedades}
            // acciones
            onView={handleAbrirModalVer}
            onToggleBaja={onToggleBaja}   
          />
        )
      })}

      {/* Modal ver/editar */}
      <SeguimientoModal
        open={modalOpen}
        seguimiento={seguimientoLocal as Seguimiento}
        prospectos={prospectos}
        onChange={(field, value) => setSeguimientoLocal(prev => prev ? { ...prev, [field]: value } : null)}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardarSeguimiento}
        proyectos={proyectos}
        propiedades={propiedades}
        readOnly={false}
      />

      {/* Diálogo de importación (placeholder) */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar seguimientos (CSV)</DialogTitle>
        <DialogContent>
          <Box py={6} textAlign="center" color="text.secondary">
            (Coloca aquí tu UI de importación existente o muévela a un componente)
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cerrar</Button>
          <Button variant="contained" disabled>
            Importar (pendiente de UI)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
