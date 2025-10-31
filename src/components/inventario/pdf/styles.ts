import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 28,
    fontSize: 11,
    color: '#111827',
    fontFamily: 'Helvetica',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: { width: 64, height: 64, objectFit: 'contain', marginRight: 10 },
  headerMain: { flexGrow: 1 },
  title: { fontSize: 18, fontWeight: 700, color: '#0f766e' },
  projectName: { fontSize: 12, marginTop: 2, color: '#374151' },
  headerContact: { marginTop: 2, fontSize: 10, color: '#6b7280' },

  // Detalles (caja con más espacio al tener página completa)
  detailsBox: {
    borderWidth: 2,
    borderColor: '#0f766e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#f0fdfa',
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#0f766e', marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 160, color: '#374151', fontWeight: 600, fontSize: 12 },
  value: { color: '#111827', fontWeight: 700, fontSize: 12 },

  otrosDetallesTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#0f766e',
  },
  otrosDetallesRow: { flexDirection: 'row', marginBottom: 4 },
  otrosDetallesCol1: { width: 160, color: '#374151', fontSize: 11, fontWeight: 600 },
  otrosDetallesCol2: { flexGrow: 1, color: '#111827', fontSize: 11, fontWeight: 500 },

  // Galería con página completa
  galleryWrapper: { marginTop: 8, marginBottom: 8 },
  galleryTitle: { fontSize: 16, fontWeight: 700, color: '#0f766e', marginBottom: 12, textAlign: 'center' },
  
  // Sección principal para plano (imagen destacada)
  mainImageSection: { marginBottom: 12 },
  mainImageContainer: { alignItems: 'center', marginBottom: 8 },
  mainImage: {
    width: 400,
    height: 280,
    objectFit: 'contain',
    borderWidth: 2,
    borderColor: '#0f766e',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  mainImageCaption: { 
    textAlign: 'center', 
    fontSize: 11, 
    color: '#0f766e', 
    fontWeight: 700,
    marginTop: 4 
  },

  // Imágenes secundarias (render, isométrico)
  secondaryImagesRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-around' },
  secondaryImageContainer: { alignItems: 'center', marginHorizontal: 8 },
  secondaryImage: {
    width: 180,
    height: 135,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  secondaryImageCaption: { 
    textAlign: 'center', 
    fontSize: 10, 
    color: '#374151', 
    fontWeight: 600,
    marginTop: 3 
  },

  // Grid para galería adicional (más compacto)
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  galleryItem: { width: 140, marginRight: 8, marginBottom: 8 },
  galleryImg: {
    width: 140,
    height: 95,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
  },
  galleryCaption: { textAlign: 'center', fontSize: 8, color: '#6b7280', marginTop: 2 },

  // Tabla planes con mejor visibilidad
  plansWrapper: { marginTop: 8 },
  plansTitle: { fontSize: 14, fontWeight: 700, color: '#0f766e', marginBottom: 8 },

  matrixHeaderRow: { flexDirection: 'row' },
  conceptHeaderCell: {
    width: 140, padding: 8, fontSize: 10, fontWeight: 700,
    backgroundColor: '#0f766e', color: 'white', borderTopLeftRadius: 6,
  },
  matrixHeaderCell: {
    flex: 1, padding: 8, fontSize: 10, fontWeight: 700,
    backgroundColor: '#0f766e', color: 'white', textAlign: 'center',
  },

  matrixRow: { flexDirection: 'row' },
  conceptCell: {
    width: 140, padding: 8, fontSize: 10, borderWidth: 1, borderColor: '#cbd5e1', 
    color: '#111827', fontWeight: 600, backgroundColor: '#f8fafc',
  },
  matrixCell: {
    flex: 1, padding: 8, fontSize: 10, textAlign: 'center', borderWidth: 1, 
    borderColor: '#cbd5e1', color: '#111827', fontWeight: 500,
  },
  selectedHeaderCol: { backgroundColor: '#0c4a42' },
  selectedCol: { backgroundColor: '#ccfbf1', fontWeight: 700 },
  altRow: { backgroundColor: '#f1f5f9' },

  // Footer
  footerSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  footerText: { fontSize: 9, color: '#6b7280', marginBottom: 2, textAlign: 'center' },
  legalNote: { fontSize: 8, color: '#9ca3af', marginTop: 2, textAlign: 'center' },

  // Watermark
  watermark: {
    position: 'absolute', top: 240, left: 120, width: 360, height: 360, opacity: 0.06,
  },
})
