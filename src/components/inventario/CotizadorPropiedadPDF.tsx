// CotizacionPropiedadPDF.tsx
import React from 'react';
import {
  Document as PDFDocument,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { Propiedad } from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';

interface PDFProps {
  propiedad: Propiedad;
  imagenesBase: string[];
}

// Colores en RGB según variables CSS
const COLORS = {
  primary: '0,40,85',
  secondary: '44,165,141',
  light: '172,231,202',
  accent: '52,152,219',
  textDark: '#333',
  textLight: '#fff',
  gray: '#777',
};

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 11, color: COLORS.textDark, lineHeight: 1.4 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: `rgb(${COLORS.secondary})`, padding: 10, borderRadius: 6, marginBottom: 16 },
  title: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 18, color: COLORS.textLight, textAlign: 'center' },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 20 },
  detailsBox: { backgroundColor: `rgb(${COLORS.light})`, borderRadius: 6, padding: 8, flex: 1, minWidth: '45%' },
  imagesBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', flex: 1, minWidth: '45%' },
  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 13, marginBottom: 6, color: `rgb(${COLORS.primary})` },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: '40%', fontFamily: 'Helvetica-Bold', color: `rgb(${COLORS.primary})` },
  value: { width: '60%' },
  footer: { position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: COLORS.gray },
});

const CotizacionPropiedadPDF: React.FC<PDFProps> = ({ propiedad, imagenesBase }) => (
  <PDFDocument>
    <Page size="A4" style={styles.page} wrap>
      {/* Header */}
      <View style={styles.header} wrap={false}>
        <Text style={styles.title}>Cotización de Propiedad</Text>
      </View>

      {/* Top section */}
      <View style={styles.topSection} wrap>
        {/* Detalles */}
        <View style={styles.detailsBox} break>
          <Text style={styles.sectionTitle}>Detalles de la Propiedad</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>{propiedad.tituloPropiedad}</Text>
          </View>
          {propiedad.descripcion && (
            <View style={styles.row}>
              <Text style={styles.label}>Descripción:</Text>
              <Text style={styles.value}>{propiedad.descripcion}</Text>
            </View>
          )}
          {propiedad.venta && propiedad.precioVenta != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Precio Venta:</Text>
              <Text style={styles.value}>{formatoMoneda(propiedad.precioVenta)}</Text>
            </View>
          )}
          {propiedad.renta && propiedad.precioRenta != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Precio Renta:</Text>
              <Text style={styles.value}>{formatoMoneda(propiedad.precioRenta)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Ubicación:</Text>
            <Text style={styles.value}>{[
              propiedad.calle, propiedad.numero, propiedad.interior && `Int. ${propiedad.interior}`,
              propiedad.colonia, propiedad.ciudad, propiedad.estado
            ].filter(Boolean).join(', ')}</Text>
          </View>
          {propiedad.variables && Object.keys(propiedad.variables).length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Características Adicionales</Text>
              {Object.entries(propiedad.variables!).map(([key, val]) => (
                <View style={styles.row} key={key}>
                  <Text style={styles.label}>{key}:</Text>
                  <Text style={styles.value}>{String(val)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {/* Imágenes */}
        <View style={styles.imagesBox} wrap>
          {imagenesBase.slice(0,5).map((b64, i) => (
            <Image key={i} src={b64} style={{ width: 120, height: 80, borderRadius: 4 }} />
          ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Generado el {new Date().toLocaleString()}</Text>
    </Page>
  </PDFDocument>
);

export default CotizacionPropiedadPDF;
