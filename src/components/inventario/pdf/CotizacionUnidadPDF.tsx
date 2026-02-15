import React from 'react'
import { Document as PDFDocument, Page, Image, View, Text } from '@react-pdf/renderer'
import type { Proyecto, Unidad, PlanPago } from '../../../config/types'
import type { PageProps } from '@react-pdf/renderer'
import { styles } from './styles'
import { getMonthLabels, safeMoney } from './helper'

import PDFHeader from './PDFHeader'
import PDFInfoUnidad from './PDFInfoUnidad'
import PDFGaleriaCompacta from './PDFGaleriaMejorada'
import PDFTablaPlanesOnePage from './PDFTablaPlanesPaged'

type PDFPageSize = PageProps['size']

export interface PDFProps {
  proyecto: Proyecto
  unidad: Unidad
  planSeleccionado?: PlanPago | null
  planes?: PlanPago[]
  logoUrl?: string
  renderUrl?: string
  isometricoUrl?: string
  planoUrl?: string
  galeriaUrls?: string[]
  esPersonalizado?: boolean
  userEmail?: string
  userPhone?: string
  extrasOrder?: string[]
  pageSize?: PDFPageSize
}

const CotizacionPDFCompacto: React.FC<PDFProps> = ({
  proyecto,
  unidad,
  planSeleccionado,
  planes = [],
  logoUrl,
  renderUrl,
  isometricoUrl,
  planoUrl,
  galeriaUrls = [],
  esPersonalizado,
  userEmail,
  userPhone,
  extrasOrder,
  pageSize = 'A4',
}) => {
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0

  // Cálculos por plan (columnas)
  const columnas = (planes || []).map((p) => {
    const descuento = p.descuento || 0
    const base = precioLista * (1 - descuento / 100)
    const engPct = p.pInicial || 0
    const contraPct = p.contraentrega || 0
    const mensualidades = p.mensualidades || p.parcialidades?.length || 0

    let pagosArray: number[] = []
    const tieneMontosAbsolutos =
      p.parcialidades?.some((par) => (par as any)?.isAbsolute) ||
      (p as any).precioBase !== undefined ||
      (p as any).engancheMonto !== undefined ||
      (p as any).contraentregaMonto !== undefined
    
    // 👇 Si el plan trae montos absolutos (plan personalizado), incluso sin mensualidades
    if (tieneMontosAbsolutos) {
      pagosArray = (p.parcialidades || []).map((par) => par.value) // Ya son montos
      
      // Usar montos absolutos para enganche y contraentrega también
      const engancheMonto = (p as any).engancheMonto || base * (engPct / 100)
      const contraMonto = (p as any).contraentregaMonto || base * (contraPct / 100)
      const sumaMensualidades = pagosArray.reduce((a, b) => a + b, 0)
      const precioBasePersonalizado = (p as any).precioBase || base

      return { 
        plan: p, 
        base: precioBasePersonalizado, 
        descuento, 
        engPct, 
        contraPct, 
        mensualidades, 
        engancheMonto, 
        contraMonto, 
        sumaMensualidades, 
        pagosArray 
      }
    }
    
    // 👇 Flujo normal: calcular desde porcentajes
    if (p.parcialidades?.length) {
      pagosArray = p.parcialidades.map((par) => base * (par.value / 100))
    } else if (mensualidades > 0) {
      const pctRestante = Math.max(0, 100 - engPct - contraPct)
      const pctCada = mensualidades > 0 ? pctRestante / mensualidades : 0
      pagosArray = Array.from({ length: mensualidades }, () => base * (pctCada / 100))
    }

    const engancheMonto = base * (engPct / 100)
    const contraMonto = base * (contraPct / 100)
    const sumaMensualidades = pagosArray.reduce((a, b) => a + b, 0)

    return { plan: p, base, descuento, engPct, contraPct, mensualidades, engancheMonto, contraMonto, sumaMensualidades, pagosArray }
  })

  const selectedName = planSeleccionado?.name
  const hoy = new Date()
  const maxMensualidades = columnas.length > 0 ? Math.max(...columnas.map((c) => c.mensualidades || 0)) : 0
  const mensualidadLabels = maxMensualidades > 0 ? getMonthLabels(hoy, maxMensualidades) : []

  // Filas de la tabla
  const filas =
    columnas.length === 0
      ? []
      : (() => {
          const filaDescuento = { label: 'Descuento (%)', render: (c: any) => (c.descuento ? `${c.descuento.toFixed(2)}%` : '—') }
          const filaPrecioConDescuento = { label: 'Precio con Descuento', render: (c: any) => safeMoney(c.base) }
          const filaEnganche = { label: 'Enganche (% / $)', render: (c: any) => `${c.engPct.toFixed(2)}% / ${safeMoney(c.engancheMonto)}` }
          const filasMensualidades = mensualidadLabels.map((m, i) => ({
            label: `Mensualidad ${i + 1} (${m})`,
            render: (c: any) => (c.pagosArray && c.pagosArray[i] !== undefined ? safeMoney(c.pagosArray[i]) : '—'),
          }))
          const filaTotalMensualidades = { label: 'Total Mensualidades', render: (c: any) => (c.mensualidades ? safeMoney(c.sumaMensualidades) : '—') }
          const filaContraentrega = { label: 'Contraentrega (% / $)', render: (c: any) => `${c.contraPct.toFixed(2)}% / ${safeMoney(c.contraMonto)}` }
          return [filaDescuento, filaPrecioConDescuento, filaEnganche, ...filasMensualidades, filaTotalMensualidades, filaContraentrega]
        })()

  /* ==================== RENDER ==================== */
  return (
    <PDFDocument>
      {/* --------- PÁGINA 1: Solo Información --------- */}
      <Page size={pageSize} style={styles.page}>
        {logoUrl ? <Image src={logoUrl} style={styles.watermark} /> : null}

        <PDFHeader logoUrl={logoUrl} proyecto={proyecto} userEmail={userEmail} userPhone={userPhone} />

        {/* Solo detalles de unidad - página completa para información */}
        <PDFInfoUnidad unidad={unidad} extrasOrder={extrasOrder} />
      </Page>

      {/* --------- PÁGINA 2: Solo Imágenes Grandes --------- */}
      <Page size={pageSize} style={styles.page}>
        <PDFGaleriaCompacta
          renderUrl={renderUrl}
          isometricoUrl={isometricoUrl}
          planoUrl={planoUrl}
          galeriaUrls={galeriaUrls}
        />
      </Page>

      {/* --------- PÁGINA 3: Solo Tabla de Planes + Footer --------- */}
      <Page size={pageSize} style={styles.page}>
        <PDFTablaPlanesOnePage
          columnas={columnas}
          filas={filas}
          selectedName={selectedName}
          esPersonalizado={!!esPersonalizado}
          precioListaFmt={safeMoney(precioLista)}
          pageSize={pageSize}
        />

        {/* Footer en la página de planes */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            Documento generado el {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')} | Vigencia de la oferta: 10 días. Precios sujetos a cambio sin previo aviso.
          </Text>
          <Text style={styles.footerText}>Consultas: ecalderon@objetiva.mx | (33) 1850-8214 | www.objetiva.mx</Text>
          <Text style={styles.legalNote}>
            *Este documento es informativo y no representa un compromiso contractual. Las imágenes son ilustrativas.
          </Text>
        </View>
      </Page>
    </PDFDocument>
  )
}

export default CotizacionPDFCompacto
