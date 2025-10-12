import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import { getPageHeightPts, getPageTopBottom, styleArr } from './helper'

export default function PDFTablaPlanesOnePage({
  columnas, filas, selectedName, esPersonalizado, precioListaFmt, pageSize = 'A4',
}: {
  columnas: any[]
  filas: any[]
  selectedName?: string
  esPersonalizado?: boolean
  precioListaFmt?: string
  pageSize?: any
}) {
  if (!columnas || columnas.length === 0) return null

  // Capacidad de FILAS para UNA sola página
  const PAGE_H = getPageHeightPts(pageSize)
  const SAFE_H = PAGE_H - getPageTopBottom()
  const TITLE_H = 18
  const PRICE_LINE_H = precioListaFmt ? 16 : 0
  const HEADER_H = 24
  const ROW_H = 18
  const GAP_TOP = 6
  const FOOTNOTE_H = 12 // espacio para nota "Se muestran N de M"

  // Reservamos todo para una sola página
  const AVAILABLE = SAFE_H - (GAP_TOP + TITLE_H + PRICE_LINE_H + HEADER_H + FOOTNOTE_H)
  const rowsPerPage = Math.max(1, Math.floor(AVAILABLE / ROW_H))
  const visibleRows = filas.slice(0, rowsPerPage)
  const trimmed = filas.length - visibleRows.length

  const Header = () => (
    <View style={styles.matrixHeaderRow}>
      <Text style={styles.conceptHeaderCell}>Concepto</Text>
      {columnas.map((c, i) => (
        <Text
          key={c.plan.name + i}
          style={styleArr(
            styles.matrixHeaderCell,
            selectedName && c.plan.name === selectedName ? styles.selectedHeaderCol : undefined
          )}
        >
          {c.plan.name}
        </Text>
      ))}
    </View>
  )

  const Rows = () => (
    <>
      {visibleRows.map((fila, rIdx) => (
        <View
          key={fila.label + rIdx}
          style={styleArr(styles.matrixRow, rIdx % 2 ? styles.altRow : undefined)}
          wrap={false} // una fila no se parte
        >
          <Text style={styles.conceptCell}>{fila.label}</Text>
          {columnas.map((c: any, ci: number) => {
            const val = fila.render(c)
            const isDash = val === '—'
            return (
              <Text
                key={fila.label + ci}
                style={styleArr(
                  styles.matrixCell,
                  selectedName && c.plan.name === selectedName ? styles.selectedCol : undefined,
                  isDash ? { color: '#9ca3af', fontStyle: 'italic' } : undefined
                )}
              >
                {String(val)}
              </Text>
            )
          })}
        </View>
      ))}
    </>
  )

  return (
    <View style={styles.plansWrapper}>
      <Text style={styles.plansTitle}>Comparativa de Planes</Text>
      {precioListaFmt ? (
        <Text style={{ fontSize: 11, color: '#065f46', marginTop: 2, marginBottom: 6, fontWeight: 700 }}>
          Precio de lista de la unidad: {precioListaFmt}
        </Text>
      ) : null}
      <Header />
      <Rows />
      {trimmed > 0 ? (
        <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
          * Se muestran {visibleRows.length} de {filas.length} filas. Solicita la versión extendida si deseas ver todas.
        </Text>
      ) : null}
      {esPersonalizado ? (
        <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
          * Incluye plan personalizado seleccionado.
        </Text>
      ) : null}
    </View>
  )
}
