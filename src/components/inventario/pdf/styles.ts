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

  // Detalles (caja full width)
  detailsBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#0f766e', marginBottom: 6 },
  detailRow: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 130, color: '#374151' },
  value: { color: '#111827' },

  otrosDetallesTitle: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 700,
    color: '#0f766e',
  },
  otrosDetallesRow: { flexDirection: 'row', marginBottom: 3 },
  otrosDetallesCol1: { width: 150, color: '#374151' },
  otrosDetallesCol2: { flexGrow: 1, color: '#111827' },

  // Galería (grid 3xN paginado)
  galleryWrapper: { marginTop: 4, marginBottom: 6 },
  galleryTitle: { fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 6 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  galleryItem: { width: 170, marginRight: 12, marginBottom: 10 },
  galleryImg: {
    width: 170,
    height: 110,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
  },
  galleryCaption: { textAlign: 'center', fontSize: 9, color: '#6b7280', marginTop: 3 },

  // Tabla planes
  plansWrapper: { marginTop: 6 },
  plansTitle: { fontSize: 13, fontWeight: 700, color: '#0f766e', marginBottom: 6 },

  matrixHeaderRow: { flexDirection: 'row' },
  conceptHeaderCell: {
    width: 140, padding: 6, fontSize: 10, fontWeight: 700,
    backgroundColor: '#0f766e', color: 'white', borderTopLeftRadius: 4,
  },
  matrixHeaderCell: {
    flex: 1, padding: 6, fontSize: 10, fontWeight: 700,
    backgroundColor: '#0f766e', color: 'white', textAlign: 'center',
  },

  matrixRow: { flexDirection: 'row' },
  conceptCell: {
    width: 140, padding: 6, fontSize: 10, borderWidth: 1, borderColor: '#bcd', color: '#111827',
  },
  matrixCell: {
    flex: 1, padding: 6, fontSize: 10, textAlign: 'center', borderWidth: 1, borderColor: '#bcd', color: '#111827',
  },
  selectedHeaderCol: { backgroundColor: '#115e59' },
  selectedCol: { backgroundColor: '#eefcf9' },
  altRow: { backgroundColor: '#f9fafb' },

  // Footer
  footerSection: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  footerText: { fontSize: 9, color: '#6b7280', marginBottom: 2, textAlign: 'center' },
  legalNote: { fontSize: 8, color: '#9ca3af', marginTop: 2, textAlign: 'center' },

  // Watermark
  watermark: {
    position: 'absolute', top: 240, left: 120, width: 360, height: 360, opacity: 0.06,
  },
})
