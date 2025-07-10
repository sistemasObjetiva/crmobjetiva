import React, { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, TextField, IconButton, Typography, Autocomplete, Stack, Chip, MenuItem, Switch, FormControlLabel
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

// Tipos de campo
type TipoCampo = 'texto' | 'numero' | 'rango' | 'opciones' | 'boolean' | 'multiopciones'
interface MetaCampoFiltro {
  key: string
  label: string
  tipo: TipoCampo
  opciones?: (string | number | boolean)[]
}

// Define aquí tus campos y tipos de filtro
const META_CAMPOS_FILTRO: MetaCampoFiltro[] = [
  { key: 'estatus', label: 'Estatus', tipo: 'opciones', opciones: ['disponible', 'vendido', 'apartado'] },
  { key: 'precioVenta', label: 'Precio de Venta', tipo: 'rango' },
  { key: 'precioRenta', label: 'Precio de Renta', tipo: 'rango' },
  { key: 'comisionVenta', label: 'Comisión Venta', tipo: 'numero' },
  { key: 'amenidades', label: 'Amenidades', tipo: 'multiopciones', opciones: ['Alberca', 'Jardín', 'Gimnasio', 'Roof', 'Elevador'] },
  { key: 'exclusividad', label: 'Exclusividad', tipo: 'boolean' },
  { key: 'tituloPropiedad', label: 'Título', tipo: 'texto' },
  { key: 'metrosConstruccion', label: 'M2 Construcción', tipo: 'rango' },
  // ... agrega más campos según tus necesidades
]

interface ModalFiltroInventarioProps {
  open: boolean
  onClose: () => void
  allKeys?: string[]
  onApply: (filtros: Record<string, any>) => void
  valoresActuales: Record<string, any>
}

const ModalFiltroInventario: React.FC<ModalFiltroInventarioProps> = ({
  open, onClose, onApply, valoresActuales
}) => {
  const [filtros, setFiltros] = useState<Record<string, any>>(valoresActuales || {})
  const [campo, setCampo] = useState<string>('')
  const [valor, setValor] = useState<any>('')
  const [valorRango, setValorRango] = useState<{ min?: string, max?: string }>({})

  // Opciones que no han sido seleccionadas aún
  const opcionesRestantes = useMemo(
    () => META_CAMPOS_FILTRO.filter(k => !(k.key in filtros)),
    [filtros]
  )

  const metaCampo = META_CAMPOS_FILTRO.find(f => f.key === campo)

  // AGREGAR FILTRO
  const handleAddFiltro = () => {
    if (!campo || !metaCampo) return
    let filtroVal: any = valor
    if (metaCampo.tipo === 'rango') {
      if (!valorRango.min && !valorRango.max) return
      filtroVal = { min: valorRango.min, max: valorRango.max }
    }
    if (metaCampo.tipo === 'boolean') {
      filtroVal = !!valor
    }
    if (metaCampo.tipo === 'multiopciones' && Array.isArray(valor) && valor.length === 0) return

    setFiltros(prev => ({ ...prev, [campo]: filtroVal }))
    setCampo('')
    setValor('')
    setValorRango({})
  }

  // REMOVER FILTRO
  const handleRemoveFiltro = (k: string) => {
    setFiltros(prev => {
      const f = { ...prev }
      delete f[k]
      return f
    })
  }

  // INPUT SEGÚN TIPO DE CAMPO
  const campoInput = () => {
    if (!metaCampo) return null
    switch (metaCampo.tipo) {
      case 'opciones':
        return (
          <TextField
            select
            label={metaCampo.label}
            value={valor}
            onChange={e => setValor(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            {metaCampo.opciones?.map(opt =>
            <MenuItem key={String(opt)} value={typeof opt === 'boolean' ? String(opt) : opt}>
                {String(opt)}
              </MenuItem>
            )}
          </TextField>
        )
      case 'multiopciones':
        return (
          <Autocomplete
            multiple
            options={metaCampo.opciones as string[] || []}
            value={valor || []}
            onChange={(_, nv) => setValor(nv)}
            renderInput={params => <TextField {...params} label={metaCampo.label} size="small" />}
            sx={{ minWidth: 200 }}
          />
        )
      case 'rango':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Mín"
              type="number"
              value={valorRango.min ?? ''}
              onChange={e => setValorRango(r => ({ ...r, min: e.target.value }))}
              size="small"
              sx={{ width: 100 }}
            />
            <Typography>-</Typography>
            <TextField
              label="Máx"
              type="number"
              value={valorRango.max ?? ''}
              onChange={e => setValorRango(r => ({ ...r, max: e.target.value }))}
              size="small"
              sx={{ width: 100 }}
            />
          </Box>
        )
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!valor}
                onChange={e => setValor(e.target.checked)}
              />
            }
            label={metaCampo.label}
          />
        )
      case 'numero':
        return (
          <TextField
            label={metaCampo.label}
            type="number"
            value={valor}
            onChange={e => setValor(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          />
        )
      case 'texto':
      default:
        return (
          <TextField
            label={metaCampo.label}
            value={valor}
            onChange={e => setValor(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          />
        )
    }
  }

  // Etiqueta legible para chips de filtro activo
  const renderChipLabel = (k: string, v: any) => {
    const campo = META_CAMPOS_FILTRO.find(f => f.key === k)
    if (typeof v === 'object' && v?.min !== undefined) {
      return `${campo?.label ?? k}: ${v.min ?? '-'} a ${v.max ?? '-'}`
    }
    if (Array.isArray(v)) {
      return `${campo?.label ?? k}: ${v.join(', ')}`
    }
    if (typeof v === 'boolean') {
      return `${campo?.label ?? k}: ${v ? 'Sí' : 'No'}`
    }
    return `${campo?.label ?? k}: ${String(v)}`
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Filtrar Inventario</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {/* Selector de campo y value */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Autocomplete
              options={opcionesRestantes}
              getOptionLabel={o => o.label}
              value={metaCampo ?? null}
              onChange={(_, v) => {
                setCampo(v?.key ?? '')
                setValor('')
                setValorRango({})
              }}
              renderInput={params => <TextField {...params} label="Campo" size="small" />}
              size="small"
              sx={{ minWidth: 180 }}
            />
            {campo && campoInput()}
            <Button
              variant="contained"
              size="small"
              onClick={handleAddFiltro}
              disabled={
                !campo ||
                (metaCampo?.tipo === 'rango'
                  ? (!valorRango.min && !valorRango.max)
                  : (valor == null || valor === '' || (Array.isArray(valor) && !valor.length))
                )
              }
              sx={{ height: 40 }}
            >
              Agregar filtro
            </Button>
          </Box>
          {/* Filtros activos */}
          {Object.keys(filtros).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography fontWeight={500} fontSize={16} mb={1}>Filtros activos:</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Object.entries(filtros).map(([k, v]) => (
                  <Chip
                    key={k}
                    label={renderChipLabel(k, v)}
                    onDelete={() => handleRemoveFiltro(k)}
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => { onApply(filtros); onClose() }}
        >
          Aplicar filtros
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ModalFiltroInventario
