import { View, Text, Image } from '@react-pdf/renderer'
import { styles } from './styles'
import {  getPageHeightPts, getPageTopBottom } from './helper'

export default function PDFGaleriaOnePage({
  renderUrl, isometricoUrl, planoUrl, galeriaUrls = [], pageSize = 'A4',
}: {
  renderUrl?: string
  isometricoUrl?: string
  planoUrl?: string
  galeriaUrls?: string[]
  pageSize?: any
}) {
  const items: { url: string; label: string }[] = []
  if (renderUrl) items.push({ url: renderUrl, label: 'Render' })
  if (isometricoUrl) items.push({ url: isometricoUrl, label: 'Isométrico' })
  if (planoUrl) items.push({ url: planoUrl, label: 'Plano' })
  for (const u of galeriaUrls) items.push({ url: u, label: 'Vista' })
  if (items.length === 0) return null

  // Capacidad calculada para UNA sola página
  const PAGE_H = getPageHeightPts(pageSize)
  const SAFE_H = PAGE_H - getPageTopBottom()
  const TITLE_H = 18
  const ITEM_BLOCK = 110 + 14 // alto img + caption
  const V_GAP = 6
  const GRID_ROWS = Math.max(1, Math.floor((SAFE_H - TITLE_H - 12) / (ITEM_BLOCK + V_GAP)))
  const PER_ROW = 3
  const CAPACITY = Math.max(1, GRID_ROWS * PER_ROW)

  const show = items.slice(0, CAPACITY)
  const hiddenCount = items.length - show.length

  return (
    <View style={styles.galleryWrapper}>
      <Text style={styles.galleryTitle}>Planos e imágenes adicionales</Text>
      <View style={styles.galleryGrid}>
        {show.map((it, i) => (
          <View key={i} style={styles.galleryItem}>
            <Image src={it.url} style={styles.galleryImg} />
            <Text style={styles.galleryCaption}>{it.label}</Text>
          </View>
        ))}
      </View>
      {hiddenCount > 0 ? (
        <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
          * {hiddenCount} imagen(es) adicional(es) no mostrada(s) para mantener el formato en 1 página.
        </Text>
      ) : null}
    </View>
  )
}
