import React from 'react';
import {
  Document as PDFDocument,
  Page,
  View,
  Text,
  Image,
} from '@react-pdf/renderer';
import { Proyecto, Unidad, PlanPago } from '../../config/types';
import { formatoMoneda } from '../../hooks/useUtilsFunctions';
import {  styles } from '../../styles/pdfStyles';


// Helper seguro para estilos condicionales
function styleArr(...args: any[]): any[] {
  return args.filter(Boolean);
}




function PDFHeader({ logoUrl, proyecto }: { logoUrl?: string, proyecto: Proyecto }) {
  return (
    <View style={styles.header} wrap={false}>
      {logoUrl && <Image src={logoUrl} style={styles.logo} />}
      <View style={styles.headerMain}>
        <Text style={styles.title}>Cotización de Unidad</Text>
        <Text style={styles.projectName}>{proyecto.nombre}</Text>
        <Text style={styles.headerContact}>www.objetiva.mx  |  contacto@objetiva.mx</Text>
      </View>
    </View>
  );
}

function PDFInfoUnidad({ unidad }: { unidad: Unidad }) {
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0;
  const fmt = (n: number) =>
    formatoMoneda ? formatoMoneda(n) : '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <View style={styles.detailsBox}>
      {/* Título más grande y separado */}
      <Text style={styles.sectionTitle}>Detalles de la Unidad</Text>
      
      <View style={styles.detailRow}>
        <Text style={styles.label}>Número:</Text>
        <Text style={styles.value}>{unidad.numerounidad}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Privativa (m²):</Text>
        <Text style={styles.value}>{unidad.unidadprivativa}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.label}>Precio Lista:</Text>
        <Text style={styles.value}>{fmt(precioLista)}</Text>
      </View>
      
      {/* Otros detalles */}
      {unidad.extras && Object.keys(unidad.extras).length > 0 && (
        <>
          <Text style={styles.otrosDetallesTitle}>Otros Detalles</Text>
          <View style={styles.otrosDetallesTable}>
            {Object.entries(unidad.extras).map(([k, v]) => (
              <View key={k} style={styles.otrosDetallesRow}>
                <Text style={styles.otrosDetallesCol1}>{k}:</Text>
                <Text style={styles.otrosDetallesCol2}>{String(v)}</Text>
              </View>
            ))}
          </View>

        </>
      )}
    </View>
  );
}



function PDFImagenes({
  renderUrl, isometricoUrl, planoUrl, galeriaUrls
}: { renderUrl?: string, isometricoUrl?: string, planoUrl?: string, galeriaUrls?: string[] }) {
  const imgLabels = ['Render', 'Isométrico', 'Plano', ...(galeriaUrls || []).map(() => 'Vista')];

  return (
    <View style={styles.imagesBox} wrap>
      {[renderUrl, isometricoUrl, planoUrl, ...(galeriaUrls || [])]
        .filter(Boolean)
        .slice(0, 4)
        .map((url, i) => (
          <View key={i} style={styles.imgContainer}>
            <Image src={url as string} style={styles.imgPreview} />
            <Text style={styles.imgCaption}>{imgLabels[i] || 'Vista'}</Text>
          </View>
        ))}
    </View>
  );
}

function getMonthLabels(start: Date, count: number) {
  const labels = [];
  let date = new Date(start);
  for (let i = 0; i < count; i++) {
    const label = `${date.toLocaleString('es-MX', { month: 'short', year: 'numeric' })}`;
    labels.push(label[0].toUpperCase() + label.slice(1));
    date.setMonth(date.getMonth() + 1);
  }
  return labels;
}

function PDFTablaPlanes({
  columnas, filas, selectedName, esPersonalizado
}: {
  columnas: any[],
  filas: any[],
  selectedName: string,
  esPersonalizado?: boolean
}) {
  return (
    <View style={styles.plansWrapper} wrap={false}>
      <Text style={styles.plansTitle}>Comparativa de Planes</Text>
      <View style={styles.matrixHeaderRow}>
        <Text style={[styles.matrixHeaderCell, styles.conceptHeaderCell]}>Concepto</Text>
        {columnas.map((c, i) => (
          <Text
            key={c.plan.name + i}
            style={styleArr(
              styles.matrixHeaderCell,
              c.plan.name === selectedName ? styles.selectedHeaderCol : undefined,
            )}
          >
            {c.plan.name}
          </Text>
        ))}
      </View>
      <View style={styles.matrixContainer}>
        {filas.map((fila, rIdx) => (
          <View
            key={fila.label}
            style={styleArr(
              styles.matrixRow,
              rIdx % 2 === 1 ? styles.altRow : undefined,
            )}
          >
            <Text style={styles.conceptCell}>{fila.label}</Text>
            {columnas.map((c, ci) => (
              <Text
                key={fila.label + ci}
                style={styleArr(
                  c.plan.name === selectedName ? styles.selectedCol : undefined,
                  styles.matrixCell,
                  fila.render(c) === '—'
                    ? { color: '#c3c3c3', fontStyle: 'italic' }
                    : undefined,
                )}
              >
                {typeof fila.render(c) === 'object'
                  ? fila.render(c)
                  : fila.render(c)}
              </Text>
            ))}
          </View>
        ))}
      </View>
      {esPersonalizado && (
        <Text style={styles.personalizadoNote}>
          * Incluye plan personalizado seleccionado.
        </Text>
      )}
    </View>
  );
}



function PDFFooter() {
  return (
    <View style={styles.footerSection} wrap={false}>
      <Text style={styles.footerText}>
        Documento generado el {new Date().toLocaleString()} | Vigencia de la oferta: 10 días. Precios sujetos a cambio sin previo aviso.
      </Text>
      <Text style={styles.footerText}>
        Consultas: ventas@objetiva.mx | (33) 1234-5678 | www.objetiva.mx
      </Text>
      <Text style={styles.legalNote}>
        *Este documento es informativo y no representa un compromiso contractual. Las imágenes son ilustrativas.
      </Text>
    </View>
  );
}
export interface PDFProps {
  proyecto: Proyecto;
  unidad: Unidad;
  planSeleccionado: PlanPago;
  planes: PlanPago[];
  enganche: number;
  liquidacion: number;
  pagosMensuales: number[];
  logoUrl?: string;
  renderUrl?: string;
  isometricoUrl?: string;
  planoUrl?: string;
  galeriaUrls?: string[];
  esPersonalizado?: boolean;
}

const CotizacionPDF: React.FC<PDFProps> = (props) => {
  const {
    proyecto,
    unidad,
    planSeleccionado,
    planes,
    logoUrl,
    renderUrl,
    isometricoUrl,
    planoUrl,
    galeriaUrls = [],
    esPersonalizado,
  } = props;

  // -------- Lógica de planes --------
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0;
  const fmt = (n: number) =>
    formatoMoneda ? formatoMoneda(n) : '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const columnas = planes.map((p) => {
    const descuento = p.descuento || 0;
    const base = precioLista * (1 - descuento / 100);
    const engPct = p.pInicial || 0;
    const contraPct = p.contraentrega || 0;
    const mensualidades = p.mensualidades || p.parcialidades?.length || 0;

    let pagosArray: number[] = [];
    if (p.parcialidades?.length) {
      pagosArray = p.parcialidades.map(par => base * (par.value / 100));
    } else if (mensualidades > 0) {
      const pctRestante = Math.max(0, 100 - engPct - contraPct);
      const pctCada = pctRestante / mensualidades;
      pagosArray = Array.from({ length: mensualidades }, () => base * (pctCada / 100));
    }

    const engancheMonto = base * (engPct / 100);
    const contraMonto = base * (contraPct / 100);
    const sumaMensualidades = pagosArray.reduce((a, b) => a + b, 0);
    const pagoMensualProm = mensualidades ? sumaMensualidades / mensualidades : 0;
    const ahorro = precioLista - base;

    return {
      plan: p,
      base,
      descuento,
      engPct,
      contraPct,
      mensualidades,
      engancheMonto,
      contraMonto,
      sumaMensualidades,
      pagoMensualProm,
      ahorro,
      pagosArray, // <-- AGREGA ESTA LÍNEA
    };
  });


  const selectedName = planSeleccionado.name;

  const hoy = new Date();
  const maxMensualidades = Math.max(...columnas.map(c => c.mensualidades || 0));
  const mensualidadLabels = getMonthLabels(hoy, maxMensualidades);

  const filas = [
    {
      label: 'Descuento (%)',
      render: (c: any) => c.descuento ? c.descuento.toFixed(2) + '%' : '—',
    },
    {
      label: 'Enganche (% / $)',
      render: (c: any) => `${c.engPct.toFixed(2)}% / ${fmt(c.engancheMonto)}`,
    },
    {
      label: 'Contraentrega (% / $)',
      render: (c: any) => `${c.contraPct.toFixed(2)}% / ${fmt(c.contraMonto)}`,
    },
     ...mensualidadLabels.map((monthLabel, idx) => ({
    label: `Mensualidad ${idx + 1} (${monthLabel})`,
    render: (c: any) =>
      c.pagosArray && c.pagosArray[idx] !== undefined
        ? fmt(c.pagosArray[idx])
        : '—'
  })),
    {
      label: 'Total Mensualidades',
      render: (c: any) => (c.mensualidades ? fmt(c.sumaMensualidades) : '—'),
    },
    {
      label: 'Total con Descuento',
      render: (c: any) => fmt(c.base),
    },
  ];


  // ------ Render principal ------
  return (
    <PDFDocument>
      <Page size="A4" style={styles.page} wrap>
        {/* Marca de agua */}
        {logoUrl && (
          <Image src={logoUrl} style={styles.watermark} />
        )}

        {/* 1. Header */}
        <PDFHeader logoUrl={logoUrl} proyecto={proyecto} />

        {/* 2-3. Info unidad + imágenes */}
        <View style={styles.topSection} wrap>
          <PDFInfoUnidad unidad={unidad} />
          <PDFImagenes renderUrl={renderUrl} isometricoUrl={isometricoUrl} planoUrl={planoUrl} galeriaUrls={galeriaUrls} />
        </View>

        {/* 4. Tabla de Planes */}
        <PDFTablaPlanes
          columnas={columnas}
          filas={filas}
          selectedName={selectedName}
          esPersonalizado={esPersonalizado}
        />

        {/* 5. Footer */}
        <PDFFooter />
      </Page>
    </PDFDocument>
  );
};

export default CotizacionPDF;
