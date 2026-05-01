import React, { useState, useMemo } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Button
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'

import { Proyecto, Unidad, PlanPago, Seguimiento, Document } from '../../config/types'
import SignedAvatar from '../general/SignedAvatar'
import SignedImage from '../general/SignedImage'
import CotizacionPDF from './pdf/CotizacionUnidadPDF'

import UnidadInfo from './CotizadorUnidadInfo'
import UnidadImagenes from './CotizadorUnidadImagenes'
import SelectorPlanPago, { CustomPayment } from './CotizadorUnidadSelectorPlant'

import { pdf } from '@react-pdf/renderer'
import { blobToDataURL, getSignedUrl } from '../../hooks/useUtilsFunctions'
import { useAuthRole } from '../../config/auth'
import { useFetchUsuarios } from '../../hooks/useFetchFunctions'

interface CotizadorModalProps {
  proyecto: Proyecto
  unidad: Unidad
  open: boolean
  onClose: () => void
  onAsignarCotizacion?: (doc: Document) => void
  seguimiento?: Seguimiento
  asPage?: boolean
}

const CotizadorModal: React.FC<CotizadorModalProps> = ({
  proyecto, unidad, open, onClose, onAsignarCotizacion, asPage = false,
}) => {
  // ----------------- Estado del plan -----------------
  const [selectedPlan, setSelectedPlan] = useState<PlanPago | null>(null)
  const [isCustomPlan, setIsCustomPlan] = useState(false)
  const [customPayments, setCustomPayments] = useState<CustomPayment[]>([])
  const [customPrecioPlan, setCustomPrecioPlan] = useState<number>(
    parseFloat(String(unidad.preciolista).replace(/[$,]/g, '')) || 0
  )
  const [customPagoInicial, setCustomPagoInicial] = useState<number>(0)
  const [customContraEntrega, setCustomContraEntrega] = useState<number>(0)

  // ----------------- Usuario actual -----------------
  const { user } = useAuthRole()
  const { usuarios } = useFetchUsuarios()

  // Normaliza email/teléfono del vendedor según user.id y catálogo de usuarios
  const { sellerEmail, sellerPhone } = useMemo(() => {
    const authId = String((user as any)?.id ?? (user as any)?.uid ?? '')
    const match = (usuarios ?? []).find(u => String(u.id) === authId)

    const email =
      match?.email ??
      (user as any)?.email ??
      (user as any)?.correo ??
      (user as any)?.correoElectronico ??
      ''

    const phone =
      match?.telefono ??
      (user as any)?.telefono ??
      (user as any)?.phoneNumber ??
      (user as any)?.phone ??
      (user as any)?.celular ??
      ''

    return { sellerEmail: (email || '').trim(), sellerPhone: (phone || '').trim() }
  }, [user, usuarios])

  // ----------------- Derivados -----------------
  const handleSelectedPlanChange = (plan: PlanPago | null) => setSelectedPlan(plan)
  const handleIsCustomPlanChange = (val: boolean) => setIsCustomPlan(val)

  const precioLista = useMemo(() => {
    const num = parseFloat(String(unidad.preciolista).replace(/[$,]/g, ''))
    return isNaN(num) ? 0 : num
  }, [unidad.preciolista])

  const totalCustomMonthly = customPayments.reduce((sum, p) => sum + Number(p.monto), 0)
  const totalProgramado = customPagoInicial + customContraEntrega + totalCustomMonthly
  const restante = customPrecioPlan - totalProgramado

  const handlePlanSelected = (
    plan: PlanPago | null,
    isCustom: boolean,
    customPayments?: CustomPayment[],
    customPrecioPlan?: number,
    customPagoInicial?: number,
    customContraEntrega?: number
  ) => {
    setSelectedPlan(plan)
    setIsCustomPlan(isCustom)
    setCustomPayments(customPayments || [])
    setCustomPrecioPlan(customPrecioPlan ?? precioLista)
    setCustomPagoInicial(customPagoInicial ?? 0)
    setCustomContraEntrega(customContraEntrega ?? 0)
  }

  // ✅ Permite descargar aunque no haya plan (cuando NO es personalizado)
  const canDownload = isCustomPlan
    ? (customPrecioPlan > 0 && restante === 0 && (customPagoInicial + customContraEntrega + customPayments.length > 0))
    : true

  // --- Firmar medios y convertir a base64 para @react-pdf ---
  const prepararMedios = async () => {
    const logoUrl = proyecto.logo?.path
      ? await getSignedUrl(proyecto.logo.path, proyecto.logo.bucket!)
      : undefined
    const renderUrl = unidad.render?.path
      ? await getSignedUrl(unidad.render.path, unidad.render.bucket!)
      : undefined
    const isoUrl = unidad.isometrico?.path
      ? await getSignedUrl(unidad.isometrico.path, unidad.isometrico.bucket!)
      : undefined
    const planoUrl = unidad.plano?.path
      ? await getSignedUrl(unidad.plano.path, unidad.plano.bucket!)
      : undefined
    const galeriaUrlsSigned = await Promise.all(
      (unidad.imagenes || []).map(img => getSignedUrl(img.path!, img.bucket!))
    )

    const urls = [logoUrl, renderUrl, isoUrl, planoUrl, ...galeriaUrlsSigned].filter(Boolean) as string[]
    const bases = await Promise.all(
      urls.map(async url => {
        const resp = await fetch(url)
        const blob = await resp.blob()
        return blobToDataURL(blob)
      })
    )
    const [logoBase, renderBase, isoBase, planoBase, ...galeriaBases] = bases
    return { logoBase, renderBase, isoBase, planoBase, galeriaBases }
  }

  // --- Construir plan personalizado con MONTOS ABSOLUTOS ---
  const buildCustomPlanConMontos = (): PlanPago => {
    // Convertir a porcentajes para mantener compatibilidad con estructura PlanPago
    const totalSeguro = customPrecioPlan > 0 ? customPrecioPlan : 1
    const pInicialPct = (customPagoInicial / totalSeguro) * 100
    const contraPct = (customContraEntrega / totalSeguro) * 100
    
    // Las parcialidades guardan los MONTOS reales, no porcentajes
    const parcialidades = customPayments.map((p, i) => ({
      month: i + 1,
      value: p.monto,  // 👈 MONTO ABSOLUTO, no porcentaje
      isAbsolute: true as const, // 👈 Bandera para que el PDF lo interprete como monto
    }))

    return {
      name: 'Personalizado',
      descuento: 0,
      pInicial: +pInicialPct.toFixed(2),
      contraentrega: +contraPct.toFixed(2),
      mensualidades: customPayments.length,
      months: customPayments.length,
      parcialidades,
      precioBase: customPrecioPlan,  // 👈 Precio total del plan
      engancheMonto: customPagoInicial,  // 👈 Montos absolutos
      contraentregaMonto: customContraEntrega,
    } as PlanPago
  }

  // ----------------- Acciones -----------------
  const handleDownloadPdf = async () => {
    let planParaPdf: PlanPago | null = selectedPlan

    if (isCustomPlan) {
      if (customPrecioPlan <= 0) { alert('Define un precio total > 0 para el plan personalizado.'); return }
      if (restante !== 0) { alert('El total programado no coincide con el precio del plan.'); return }
      const hayPagos = (customPayments.length > 0) || (customContraEntrega > 0) || (customPagoInicial > 0)
      if (!hayPagos) { alert('Agrega al menos un pago al plan personalizado.'); return }
      planParaPdf = buildCustomPlanConMontos()
    }

    const { logoBase, renderBase, isoBase, planoBase, galeriaBases } = await prepararMedios()

    const planesParaPdf = isCustomPlan && planParaPdf
      ? [...(proyecto.paymentPlans || []), planParaPdf]
      : (proyecto.paymentPlans || [])

    const blobPdf = await pdf(
      <CotizacionPDF
        proyecto={proyecto}
        unidad={unidad}
        planSeleccionado={planParaPdf || undefined}
        planes={planesParaPdf}
        logoUrl={logoBase}
        renderUrl={renderBase}
        isometricoUrl={isoBase}
        planoUrl={planoBase}
        galeriaUrls={galeriaBases}
        esPersonalizado={isCustomPlan}
        userEmail={sellerEmail || undefined}
        userPhone={sellerPhone || undefined}
        extrasOrder={proyecto.extrasOrder}   // 👈 NUEVO
      />

    ).toBlob()

    const blobUrl = URL.createObjectURL(blobPdf)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `${proyecto.nombre.replace(/\s+/g, '_')}_cotizacion.pdf`
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  const handleAsignarPdf = async () => {
    let planParaPdf: PlanPago | null = selectedPlan

    if (isCustomPlan) {
      if (customPrecioPlan <= 0 || restante !== 0) return
      const hayPagos = (customPayments.length > 0) || (customContraEntrega > 0) || (customPagoInicial > 0)
      if (!hayPagos) return
      planParaPdf = buildCustomPlanConMontos()
    }

    const { logoBase, renderBase, isoBase, planoBase, galeriaBases } = await prepararMedios()

    const planesParaPdf = isCustomPlan && planParaPdf
      ? [...(proyecto.paymentPlans || []), planParaPdf]
      : (proyecto.paymentPlans || [])

    const blobPdf = await pdf(
      <CotizacionPDF
        proyecto={proyecto}
        unidad={unidad}
        planSeleccionado={planParaPdf || undefined}
        planes={planesParaPdf}
        logoUrl={logoBase}
        renderUrl={renderBase}
        isometricoUrl={isoBase}
        planoUrl={planoBase}
        galeriaUrls={galeriaBases}
        esPersonalizado={isCustomPlan}
        userEmail={sellerEmail || undefined}
        userPhone={sellerPhone || undefined}
        extrasOrder={proyecto.extrasOrder}   // 👈 NUEVO
      />

    ).toBlob()

    const archivoNombre = `${proyecto.nombre.replace(/\s+/g, '_')}_cotizacion.pdf`
    const filePdf = new File([blobPdf], archivoNombre, { type: 'application/pdf' })

    const documento: Document = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now()),
      nombre: archivoNombre,
      file: filePdf
    }

    if (onAsignarCotizacion) onAsignarCotizacion(documento)
    onClose()
  }

  // ----------------- UI -----------------
  const header = (
    <Box
      sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        mb: 1, color: 'white', background: 'var(--secondary-color)', p: 2, borderRadius: asPage ? 2 : 0
      }}
    >
      <Typography variant="h6" component="div">
        Cotización {proyecto.nombre}
      </Typography>
      {!asPage && (
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  )

  const body = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3, flexWrap: 'wrap' }}>
        <SignedAvatar value={proyecto.logo!} alt="Logo del Proyecto" sx={{ width: 90, height: 90, boxShadow: 2 }} />
        {proyecto.render && (
          <SignedImage
            path={proyecto.render.path!}
            bucket={proyecto.render.bucket!}
            alt="Fachada del Proyecto"
            sx={{ width: 260, height: 150, borderRadius: 2, boxShadow: '2px 2px 10px rgba(0,0,0,0.13)' }}
          />
        )}
      </Box>

      <UnidadInfo unidad={unidad} extrasOrder={proyecto.extrasOrder} />
      <UnidadImagenes unidad={unidad} />

      <SelectorPlanPago
        paymentPlans={proyecto.paymentPlans || []}
        precioLista={precioLista}
        selectedPlan={selectedPlan}
        isCustomPlan={isCustomPlan}
        customPayments={customPayments}
        customPrecioPlan={customPrecioPlan}
        customPagoInicial={customPagoInicial}
        customContraEntrega={customContraEntrega}
        restante={restante}
        onPlanSelected={handlePlanSelected}
        onCustomPaymentsChange={setCustomPayments}
        onCustomPrecioPlanChange={setCustomPrecioPlan}
        onCustomPagoInicialChange={setCustomPagoInicial}
        onCustomContraEntregaChange={setCustomContraEntrega}
        onSelectedPlanChange={handleSelectedPlanChange}
        onIsCustomPlanChange={handleIsCustomPlanChange}
      />
    </>
  )

  const actions = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: asPage ? 0 : 2, mt: asPage ? 2 : 0 }}>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        onClick={handleDownloadPdf}
        disabled={!canDownload}
        sx={{ color: 'var(--primary-color)', borderColor: '#fff' }}
      >
        Descargar PDF
      </Button>

      {onAsignarCotizacion && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleAsignarPdf}
          disabled={!canDownload}
        >
          Asignar a seguimiento
        </Button>
      )}

      <Button onClick={onClose}>Cerrar</Button>
    </Box>
  )

  if (asPage) {
    return (
      <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 2, p: 2 }}>
        {header}
        <Box sx={{ px: { xs: 1, md: 2 } }}>
          {body}
          {actions}
        </Box>
      </Box>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { width: 'min(1200px, 96vw)' } }}
    >
      <DialogTitle sx={{ p: 0 }}>
        {header}
      </DialogTitle>

      <DialogContent>
        {body}
      </DialogContent>

      <DialogActions>
        {actions}
      </DialogActions>
    </Dialog>
  )
}

export default CotizadorModal
