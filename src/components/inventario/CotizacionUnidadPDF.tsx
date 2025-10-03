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
import { styles } from '../../styles/pdfStyles';

// Combinar estilos condicionalmente
function styleArr(...args: any[]): any[] {
  return args.filter(Boolean);
}

/* ---------------------- Secciones ---------------------- */

function PDFHeader({
  logoUrl,
  proyecto,
  userEmail,
  userPhone,
}: {
  logoUrl?: string;
  proyecto: Proyecto;
  userEmail?: string;
  userPhone?: string;
}) {
  // línea de contacto: si hay datos del vendedor úsalos; si no, el fallback corporativo
  const contactLine = (userEmail || userPhone)
    ? [userEmail, userPhone].filter(Boolean).join('  |  ')
    : 'www.objetiva.mx  |  contacto@objetiva.mx';

  return (
    <View style={styles.header} wrap={false}>
      {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
      <View style={styles.headerMain}>
        <Text style={styles.title}>Cotización de Unidad</Text>
        <Text style={styles.projectName}>{proyecto.nombre}</Text>
        <Text style={styles.headerContact}>{contactLine}</Text>
      </View>
    </View>
  );
}

function PDFInfoUnidad({
  unidad,
  extrasOrder,
}: {
  unidad: Unidad;
  /** Orden deseado para extras (proyecto.extrasOrder) */
  extrasOrder?: string[];
}) {
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0;
  const fmt = (n: number) =>
    formatoMoneda ? formatoMoneda(n) : '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Ordenar extras según extrasOrder, mostrando solo los que existan en esta unidad
  const extras = unidad.extras || {};
  const keysOrdenadas = (extrasOrder?.length ? extrasOrder : Object.keys(extras))
    .filter(k => k in extras)
    .filter(k => String((extras as any)[k] ?? '').trim() !== '');

  return (
    <View style={styles.detailsBox}>
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

      {keysOrdenadas.length > 0 ? (
        <>
          <Text style={styles.otrosDetallesTitle}>Otros Detalles</Text>
          <View style={styles.otrosDetallesTable}>
            {keysOrdenadas.map((k) => (
              <View key={k} style={styles.otrosDetallesRow}>
                <Text style={styles.otrosDetallesCol1}>{k}:</Text>
                <Text style={styles.otrosDetallesCol2}>{String((extras as any)[k])}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

/* ---------------------- Imágenes (principal + galería) ---------------------- */

// Decide principal (preferentemente el render) y las restantes
function splitImages(
  renderUrl?: string,
  isometricoUrl?: string,
  planoUrl?: string,
  galeriaUrls: string[] = []
) {
  const list: { url: string; label: string }[] = [];
  if (renderUrl) list.push({ url: renderUrl, label: 'Render' });
  if (isometricoUrl) list.push({ url: isometricoUrl, label: 'Isométrico' });
  if (planoUrl) list.push({ url: planoUrl, label: 'Plano' });
  for (const u of galeriaUrls) list.push({ url: u, label: 'Vista' });

  const principal = list[0];            // el primero disponible será el principal
  const secundarios = principal ? list.slice(1) : [];

  return { principal, secundarios };
}

// Imagen principal (arriba, a la derecha del panel de detalles)
function PDFImagenPrincipal({
  renderUrl,
  isometricoUrl,
  planoUrl,
  galeriaUrls,
}: {
  renderUrl?: string;
  isometricoUrl?: string;
  planoUrl?: string;
  galeriaUrls?: string[];
}) {
  const { principal } = splitImages(renderUrl, isometricoUrl, planoUrl, galeriaUrls || []);
  if (!principal) return null;

  const S: Record<string, any> = {
    container: {
      flex: 1,
      width: '48%',     // ancho frente al panel de detalles
      minWidth: 260,
      marginLeft: 8,
    },
    mainImg: {
      width: '100%',
      height: 270,
      objectFit: 'cover',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    caption: { textAlign: 'center', fontSize: 10, color: '#6b7280', marginTop: 4 },
  };

  return (
    <View style={S.container} wrap={false}>
      <Image src={principal.url} style={S.mainImg} />
      <Text style={S.caption}>{principal.label}</Text>
    </View>
  );
}

// Galería secundaria (abajo, a todo lo ancho)
function PDFGaleriaSecundaria({
  renderUrl,
  isometricoUrl,
  planoUrl,
  galeriaUrls,
  title = 'Planos e imágenes adicionales',
}: {
  renderUrl?: string;
  isometricoUrl?: string;
  planoUrl?: string;
  galeriaUrls?: string[];
  title?: string;
}) {
  const { secundarios } = splitImages(renderUrl, isometricoUrl, planoUrl, galeriaUrls || []);
  if (secundarios.length === 0) return null;

  const S: Record<string, any> = {
    wrapper: { marginTop: 10 },
    heading: { fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    item: { width: '31%', marginRight: '3.5%', marginBottom: 8 }, // 3 por fila
    img: {
      width: '100%',
      height: 120,
      objectFit: 'cover',
      borderRadius: 5,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    caption: { textAlign: 'center', fontSize: 9, color: '#6b7280', marginTop: 3 },
  };

  return (
    <View style={S.wrapper} wrap>
      <Text style={S.heading}>{title}</Text>
      <View style={S.grid} wrap>
        {secundarios.map((it, i) => (
          <View key={`sec-${i}`} style={S.item}>
            <Image src={it.url} style={S.img} />
            <Text style={S.caption}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------------------- Tabla de planes ---------------------- */

function getMonthLabels(start: Date, count: number) {
  const labels: string[] = [];
  const date = new Date(start);
  for (let i = 0; i < count; i++) {
    const label = `${date.toLocaleString('es-MX', { month: 'short', year: 'numeric' })}`;
    labels.push(label[0].toUpperCase() + label.slice(1));
    date.setMonth(date.getMonth() + 1);
  }
  return labels;
}

function PDFTablaPlanes({
  columnas,
  filas,
  selectedName,
  esPersonalizado,
  precioListaFmt,
}: {
  columnas: any[];
  filas: any[];
  selectedName?: string;
  esPersonalizado?: boolean;
  precioListaFmt?: string;
}) {
  if (!columnas || columnas.length === 0) return null;

  return (
    <View style={styles.plansWrapper} wrap={false}>
      <Text style={styles.plansTitle}>Comparativa de Planes</Text>

      {precioListaFmt ? (
        <Text
          style={{
            fontSize: 11,
            color: '#065f46',
            marginTop: 2,
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          Precio de lista de la unidad: {precioListaFmt}
        </Text>
      ) : null}

      <View style={styles.matrixHeaderRow}>
        <Text style={[styles.matrixHeaderCell, styles.conceptHeaderCell]}>Concepto</Text>
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

      <View style={styles.matrixContainer}>
        {filas.map((fila, rIdx) => (
          <View
            key={fila.label}
            style={styleArr(styles.matrixRow, rIdx % 2 === 1 ? styles.altRow : undefined)}
          >
            <Text style={styles.conceptCell}>{fila.label}</Text>
            {columnas.map((c, ci) => {
              const val = fila.render(c);
              const isDash = val === '—';
              return (
                <Text
                  key={fila.label + ci}
                  style={styleArr(
                    selectedName && c.plan.name === selectedName ? styles.selectedCol : undefined,
                    styles.matrixCell,
                    isDash ? { color: '#c3c3c3', fontStyle: 'italic' } : undefined
                  )}
                >
                  {val}
                </Text>
              );
            })}
          </View>
        ))}
      </View>

      {esPersonalizado ? (
        <Text style={styles.personalizadoNote}>* Incluye plan personalizado seleccionado.</Text>
      ) : null}
    </View>
  );
}

function PDFFooter() {
  const ahora = new Date();
  const fecha = `${ahora.toLocaleDateString('es-MX')} ${ahora.toLocaleTimeString('es-MX')}`;
  return (
    <View style={styles.footerSection} wrap={false}>
      <Text style={styles.footerText}>
        Documento generado el {fecha} | Vigencia de la oferta: 10 días. Precios sujetos a cambio sin previo aviso.
      </Text>
      <Text style={styles.footerText}>Consultas: ventas@objetiva.mx | (33) 1234-5678 | www.objetiva.mx</Text>
      <Text style={styles.legalNote}>
        *Este documento es informativo y no representa un compromiso contractual. Las imágenes son ilustrativas.
      </Text>
    </View>
  );
}

/* ---------------------- Componente principal ---------------------- */

export interface PDFProps {
  proyecto: Proyecto;
  unidad: Unidad;
  /** Puede venir vacío: el PDF debe seguir generándose */
  planSeleccionado?: PlanPago | null;
  /** Si no llega, no se renderiza la tabla de comparación */
  planes?: PlanPago[];
  logoUrl?: string;
  renderUrl?: string;
  isometricoUrl?: string;
  planoUrl?: string;
  galeriaUrls?: string[];
  esPersonalizado?: boolean;

  /** Nuevo: info del vendedor para el header */
  userEmail?: string;
  userPhone?: string;

  /** Nuevo: orden de extras */
  extrasOrder?: string[];
}

const CotizacionPDF: React.FC<PDFProps> = ({
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
}) => {
  // Precio base
  const precioLista = Number(String(unidad.preciolista).replace(/[$,]/g, '')) || 0;
  const fmt = (n: number) =>
    formatoMoneda ? formatoMoneda(n) : '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Columnas por plan (si no hay planes, la tabla no se mostrará)
  const columnas = (planes || []).map((p) => {
    const descuento = p.descuento || 0;
    const base = precioLista * (1 - descuento / 100);
    const engPct = p.pInicial || 0;
    const contraPct = p.contraentrega || 0;
    const mensualidades = p.mensualidades || p.parcialidades?.length || 0;

    let pagosArray: number[] = [];
    if (p.parcialidades?.length) {
      pagosArray = p.parcialidades.map((par) => base * (par.value / 100));
    } else if (mensualidades > 0) {
      const pctRestante = Math.max(0, 100 - engPct - contraPct);
      const pctCada = mensualidades > 0 ? pctRestante / mensualidades : 0;
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
      pagosArray,
    };
  });

  const selectedName = planSeleccionado?.name;
  const hoy = new Date();
  const maxMensualidades =
    columnas.length > 0 ? Math.max(...columnas.map((c) => c.mensualidades || 0)) : 0;
  const mensualidadLabels = maxMensualidades > 0 ? getMonthLabels(hoy, maxMensualidades) : [];

  const filas =
    columnas.length === 0
      ? []
      : (() => {
          const filaDescuento = {
            label: 'Descuento (%)',
            render: (c: any) => (c.descuento ? c.descuento.toFixed(2) + '%' : '—'),
          };

          const filaPrecioConDescuento = {
            label: 'Precio con Descuento',
            render: (c: any) => fmt(c.base),
          };

          const filaEnganche = {
            label: 'Enganche (% / $)',
            render: (c: any) => `${c.engPct.toFixed(2)}% / ${fmt(c.engancheMonto)}`,
          };

          const filasMensualidades = mensualidadLabels.map((monthLabel, idx) => ({
            label: `Mensualidad ${idx + 1} (${monthLabel})`,
            render: (c: any) =>
              c.pagosArray && c.pagosArray[idx] !== undefined ? fmt(c.pagosArray[idx]) : '—',
          }));

          const filaTotalMensualidades = {
            label: 'Total Mensualidades',
            render: (c: any) => (c.mensualidades ? fmt(c.sumaMensualidades) : '—'),
          };

          const filaContraentrega = {
            label: 'Contraentrega (% / $)',
            render: (c: any) => `${c.contraPct.toFixed(2)}% / ${fmt(c.contraMonto)}`,
          };

          // Orden solicitado:
          return [
            filaDescuento,
            filaPrecioConDescuento,
            filaEnganche,
            ...filasMensualidades,
            filaTotalMensualidades,
            filaContraentrega,
          ];
        })();

  return (
    <PDFDocument>
      <Page size="A4" style={styles.page} wrap>
        {/* Marca de agua */}
        {logoUrl ? <Image src={logoUrl} style={styles.watermark} /> : null}

        {/* Header */}
        <PDFHeader logoUrl={logoUrl} proyecto={proyecto} userEmail={userEmail} userPhone={userPhone} />

        {/* Bloque superior: detalles + imagen principal */}
        <View style={styles.topSection} wrap>
          <PDFInfoUnidad unidad={unidad} extrasOrder={extrasOrder} />
          <PDFImagenPrincipal
            renderUrl={renderUrl}
            isometricoUrl={isometricoUrl}
            planoUrl={planoUrl}
            galeriaUrls={galeriaUrls}
          />
        </View>

        {/* Galería secundaria (debajo del bloque superior) */}
        <PDFGaleriaSecundaria
          renderUrl={renderUrl}
          isometricoUrl={isometricoUrl}
          planoUrl={planoUrl}
          galeriaUrls={galeriaUrls}
        />

        {/* Tabla de Planes (opcional) */}
        <PDFTablaPlanes
          columnas={columnas}
          filas={filas}
          selectedName={selectedName}
          esPersonalizado={esPersonalizado}
          precioListaFmt={fmt(precioLista)}
        />

        {/* Footer */}
        <PDFFooter />
      </Page>
    </PDFDocument>
  );
};

export default CotizacionPDF;
