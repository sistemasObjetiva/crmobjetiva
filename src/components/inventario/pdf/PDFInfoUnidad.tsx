import { View, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import type { Unidad } from '../../../config/types'
import { safeMoney } from './helper'

export default function PDFInfoUnidad({
  unidad, extrasOrder,
}: { unidad: Unidad, extrasOrder?: string[] }) {
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0
  const extras = (unidad.extras as Record<string, any>) || {}
  const keysOrdenadas = (extrasOrder?.length ? extrasOrder : Object.keys(extras))
    .filter(k => k in extras)
    .filter(k => String(extras[k] ?? '').trim() !== '')

  return (
    <View style={styles.detailsBox}>
      <Text style={styles.sectionTitle}>Detalles de la Unidad</Text>

      <View style={styles.detailRow}><Text style={styles.label}>Número:</Text><Text style={styles.value}>{unidad.numerounidad}</Text></View>
      <View style={styles.detailRow}><Text style={styles.label}>Privativa (m²):</Text><Text style={styles.value}>{unidad.unidadprivativa}</Text></View>
      <View style={styles.detailRow}><Text style={styles.label}>Precio Lista:</Text><Text style={styles.value}>{safeMoney(precioLista)}</Text></View>

      {keysOrdenadas.length > 0 && (
        <>
          <Text style={styles.otrosDetallesTitle}>Otros Detalles</Text>
          {keysOrdenadas.map(k => (
            <View key={k} style={styles.otrosDetallesRow} wrap={false}>
              <Text style={styles.otrosDetallesCol1}>{k}:</Text>
              <Text style={styles.otrosDetallesCol2}>{String(extras[k])}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  )
}
