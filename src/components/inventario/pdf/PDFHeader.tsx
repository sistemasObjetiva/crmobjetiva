import { View, Image, Text } from '@react-pdf/renderer'
import { styles } from './styles'
import type { Proyecto } from '../../../config/types'

export default function PDFHeader({
  logoUrl, proyecto, userEmail, userPhone,
}: { logoUrl?: string, proyecto: Proyecto, userEmail?: string, userPhone?: string }) {
  const contactLine = (userEmail || userPhone)
    ? [userEmail, userPhone].filter(Boolean).join('  |  ')
    : 'www.objetiva.mx  |  contacto@objetiva.mx'

  return (
    <View style={styles.header} wrap={false}>
      {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
      <View style={styles.headerMain}>
        <Text style={styles.title}>Cotización de Unidad</Text>
        <Text style={styles.projectName}>{proyecto.nombre}</Text>
        <Text style={styles.headerContact}>{contactLine}</Text>
      </View>
    </View>
  )
}
