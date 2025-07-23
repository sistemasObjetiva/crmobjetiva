import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  primary: '#002855',
  secondary: '#2ca58d',
  accent: '#3498db',
  light: '#ace7ca',
  bgDetail: '#f4f9f8',
  grayLine: '#e0ebe8',
  grayText: '#555',
  altRow: '#f5fbf9',
  selected: '#ace7ca',
  ahorro: '#2ca58d',
};

export const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontFamily: 'Helvetica',
        fontSize: 11,
        color: '#333',
        lineHeight: 1.4,
        position: 'relative',
        backgroundColor: '#fff',
    },
  // -------- 1. Header --------
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  logo: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    textAlign: 'left',
    marginBottom: 3,
  },
  projectName: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  headerContact: {
    fontSize: 9,
    color: '#e5fff3',
    marginTop: 2,
    textAlign: 'left',
    letterSpacing: 0.2,
  },

  // -------- 2. Info Unidad y Extras --------
  sectionTitle: {
  fontSize: 15,
  fontFamily: 'Helvetica-Bold',
  color: COLORS.primary,
  marginBottom: 14, // más espacio
  textAlign: 'left',
  letterSpacing: 0.2,
},

detailRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 7, // más espacio vertical
},

label: {
  fontFamily: 'Helvetica-Bold',
  fontSize: 11,
  color: COLORS.primary,
  width: 110,
},

value: {
  fontSize: 11,
  color: COLORS.primary,
  flex: 1,
  textAlign: 'left',
},

// Nuevos para “Otros Detalles”
extraRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 3,
},
extraLabel: {
  fontFamily: 'Helvetica-Bold',
  fontSize: 10.3,
  color: COLORS.primary,
  width: 110,
},
extraValue: {
  fontSize: 10.2,
  color: COLORS.primary,
  flex: 1,
  textAlign: 'left',
},

  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 16,
  },
  detailsBox: {
    flex: 1,
    backgroundColor: COLORS.bgDetail,
    borderRadius: 7,
    padding: 12,
    marginRight: 8,
    minWidth: 190,
  },
  detailIcon: {
    fontSize: 10,
    marginRight: 1,
    width: 14,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 4,
    color: COLORS.accent,
  },
  otrosDetallesTable: {
  marginTop: 4,
  marginBottom: 2,
  // Si quieres que tenga ancho total, puedes poner width: '100%'
},
otrosDetallesRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 7, // Antes era 2
},
otrosDetallesCol1: {
  fontFamily: 'Helvetica-Bold',
  fontSize: 10.5,
  color: COLORS.accent,
  minWidth: 120,      // Antes 90
  textAlign: 'left',
  marginRight: 14,    // Antes 7
},
otrosDetallesCol2: {
  fontSize: 10.5,
  color: COLORS.primary,
  textAlign: 'right',
  minWidth: 48,       // Antes 38
  paddingLeft: 7,
},
otrosDetallesTitle: {
  fontFamily: 'Helvetica-Bold',
  fontSize: 12,
  color: COLORS.accent,
  marginBottom: 6,
  marginTop: 6,
},

  // -------- 3. Imágenes --------
  imagesBox: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    minWidth: 200,
  },
  imgContainer: {
    alignItems: 'center',
    marginRight: 7,
    marginBottom: 10,
  },
  imgPreview: {
    width: 110,
    height: 80,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.grayLine,
    objectFit: 'cover',
  },
  imgCaption: {
    fontSize: 7,
    color: COLORS.grayText,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: 110,
  },

  // -------- 4. Tabla de Planes --------
  plansWrapper: {
    marginTop: 14,
    marginBottom: 16,
  },
  plansTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  matrixContainer: {
    borderWidth: 1.1,
    borderColor: COLORS.secondary,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
  },
  matrixHeaderCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 7,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#23c3b7',
  },
  conceptHeaderCell: {
  flex: 0,
  width: 170,          // Más ancho, ajusta a tu gusto
  minWidth: 170,
  maxWidth: 200,
  textAlign: 'left',
  borderRightWidth: 0,
  fontSize: 11,        // Más grande
  fontFamily: 'Helvetica-Bold',
  color: '#fff',
  paddingVertical: 9,
  paddingHorizontal: 9,
},
  matrixRow: {
    flexDirection: 'row',
    minHeight: 23,
    alignItems: 'center',
  },
  altRow: {
    backgroundColor: COLORS.altRow,
  },
  conceptCell: {
    flex: 0,
    width: 170,           // Igual al header
    minWidth: 170,
    maxWidth: 200,
    backgroundColor: COLORS.light,
    paddingVertical: 9,   // Más espacio
    paddingHorizontal: 9,
    fontSize: 10.5,       // Más grande
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: COLORS.secondary,
    },
  matrixCell: {
    flex: 1,
    alignSelf: 'stretch', // esto es clave
    height: '100%',  
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 8.8,
    textAlign: 'center',
  },
  selectedCol: {
    backgroundColor: COLORS.selected,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  selectedHeaderCol: {
    backgroundColor: COLORS.selected,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.accent,
  },
  pagoFuerte: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
  ahorroCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: COLORS.ahorro,
    backgroundColor: '#e6fbf7',
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayLine,
  },
  personalizadoNote: {
    marginTop: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },

  // -------- 5. Pie de Página --------
  footerSection: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8.6,
    color: COLORS.grayText,
    marginBottom: 2,
  },
  legalNote: {
    fontSize: 7.5,
    color: COLORS.grayText,
    marginTop: 1,
    fontStyle: 'italic',
  },

  // -------- Otros (ej: watermark) --------
  watermark: {
    position: 'absolute',
    opacity: 0.08,
    width: 360,
    left: 130,
    top: 250,
    zIndex: 0,
    transform: 'rotate(-22deg)',
  },
});
