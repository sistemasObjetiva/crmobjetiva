import jsPDF from 'jspdf';
import { Proyecto, Unidad, PaymentPlanOrCustom } from '../types/types';

/**
 * Utils
 */
export const formatoMoneda = (value: string | number): string => {
  if (!value) return "";
  const numericValue = value.toString().replace(/[^0-9.]/g, "");
  const parsedValue = parseFloat(numericValue);
  if (isNaN(parsedValue)) return "";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(parsedValue);
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Colors
const PRIMARY_COLOR: RGB = { r: 99, g: 177, b: 144 };
const BOX_BACKGROUND: RGB = { r: 245, g: 245, b: 245 };
const BOX_BORDER: RGB = { r: 200, g: 200, b: 200 };

// Font sizes
const TITLE_FONT_SIZE = 14;
const SUBTITLE_FONT_SIZE = 12;
const REGULAR_FONT_SIZE = 10;

/**
 * Loads an image from base64, returning an HTMLImageElement
 */
async function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

/**
 * Adds an image preserving aspect ratio within (maxWidth, maxHeight).
 * Returns the actual height used.
 */
async function addImageWithAspectRatio(
  pdf: jsPDF,
  base64: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): Promise<number> {
  const img = await loadImage(base64);
  const { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  const displayWidth = width * ratio;
  const displayHeight = height * ratio;
  pdf.addImage(img, "PNG", x, y, displayWidth, displayHeight);
  return displayHeight;
}

/**
 * Draws a filled-and-bordered rectangle. 
 * 'FD' = fill + draw border
 */
function drawFilledBox(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: RGB,
  borderColor: RGB
) {
  pdf.setFillColor(fillColor.r, fillColor.g, fillColor.b);
  pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
  pdf.rect(x, y, w, h, "FD");
}

/**
 * Main function to generate PDF
 */
export async function handleDownloadPDF(
  proyecto: Proyecto,
  unidad: Unidad,
  selectedPlan: PaymentPlanOrCustom | null
) {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Basic measurements
    let cursorY = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 10;
    const contentWidth = pageWidth - marginX * 2;
    const boxPadding = 4;

    // Helper para establecer color primario
    const setPrimaryColor = () => {
      pdf.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    };

    //─────────────────────────────────────────────────────────────────────────────
    // 1) TITLE
    //─────────────────────────────────────────────────────────────────────────────
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(TITLE_FONT_SIZE);
    setPrimaryColor();
    pdf.text(proyecto.nombreProyecto, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 10;

    // Divider line
    pdf.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    pdf.setLineWidth(0.5);
    pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5;

    //─────────────────────────────────────────────────────────────────────────────
    // 2) TOP SECTION: LOGOS
    //─────────────────────────────────────────────────────────────────────────────
    const topSectionY = cursorY;
    const topSectionBoxHeight = 30;
    // Logo left
    if (proyecto.logo) {
      await addImageWithAspectRatio(pdf, proyecto.logo, marginX + boxPadding, topSectionY + boxPadding, 40, 22);
    }
    // Fachada right
    if (proyecto.fachada) {
      await addImageWithAspectRatio(pdf, proyecto.fachada, pageWidth - marginX - 50, topSectionY + boxPadding, 40, 22);
    }
    cursorY += topSectionBoxHeight + 8;

    //─────────────────────────────────────────────────────────────────────────────
    // 3) DETALLES DE LA UNIDAD
    //─────────────────────────────────────────────────────────────────────────────
    const unitBoxTopY = cursorY;
    // Primer render para medir
    let colCursorY = cursorY + boxPadding;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(SUBTITLE_FONT_SIZE);
    setPrimaryColor();
    pdf.text("Detalles de la Unidad", marginX, colCursorY);
    colCursorY += 6;

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(REGULAR_FONT_SIZE);
    setPrimaryColor();
    pdf.text(`No. Unidad: ${unidad.numerounidad || ""}`, marginX, colCursorY);
    colCursorY += 5;
    pdf.text(`Unidad Privativa: ${unidad.unidadprivativa || ""}`, marginX, colCursorY);
    colCursorY += 5;
    pdf.text(`Precio de Lista: ${formatoMoneda(unidad.preciolista)}`, marginX, colCursorY);
    colCursorY += 5;

    if (unidad.extras && Object.keys(unidad.extras).length > 0) {
      pdf.setFont("Helvetica", "bold");
      pdf.text("Extras:", marginX, colCursorY);
      colCursorY += 5;
      pdf.setFont("Helvetica", "normal");
      Object.entries(unidad.extras).forEach(([key, val]) => {
        pdf.text(`- ${key}: ${val}`, marginX + 5, colCursorY);
        colCursorY += 5;
      });
    }

    // Imágenes del lado derecho (primera pasada)
    let rightColY = cursorY + boxPadding + 6;
    if (unidad.imagenes && unidad.imagenes.length > 0) {
      for (let i = 0; i < unidad.imagenes.length && i < 2; i++) {
        const imageItem = unidad.imagenes[i];
        const imgData: string = typeof imageItem === "string" ? imageItem : imageItem.data;
        if (imgData) {
          const usedHeight = await addImageWithAspectRatio(
            pdf,
            imgData,
            pageWidth - marginX - 50,
            rightColY,
            50,
            40
          );
          rightColY += usedHeight + 5;
        }
      }
    }
    const unitBoxBottomY = Math.max(colCursorY, rightColY) + boxPadding;
    // Dibujar recuadro de fondo para Detalles de la Unidad
    drawFilledBox(
      pdf,
      marginX,
      unitBoxTopY,
      contentWidth,
      unitBoxBottomY - unitBoxTopY,
      BOX_BACKGROUND,
      BOX_BORDER
    );
    // Re-imprimir el contenido sobre el recuadro
    let textCursorY = unitBoxTopY + boxPadding + 6;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(SUBTITLE_FONT_SIZE);
    setPrimaryColor();
    pdf.text("Detalles de la Unidad", marginX, textCursorY);
    textCursorY += 6;
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(REGULAR_FONT_SIZE);
    setPrimaryColor();
    pdf.text(`No. Unidad: ${unidad.numerounidad || ""}`, marginX, textCursorY);
    textCursorY += 5;
    pdf.text(`Unidad Privativa: ${unidad.unidadprivativa || ""}`, marginX, textCursorY);
    textCursorY += 5;
    pdf.text(`Precio de Lista: ${formatoMoneda(unidad.preciolista)}`, marginX, textCursorY);
    textCursorY += 5;
    if (unidad.extras && Object.keys(unidad.extras).length > 0) {
      pdf.setFont("Helvetica", "bold");
      pdf.text("Extras:", marginX, textCursorY);
      textCursorY += 5;
      pdf.setFont("Helvetica", "normal");
      Object.entries(unidad.extras).forEach(([key, val]) => {
        pdf.text(`- ${key}: ${val}`, marginX + 5, textCursorY);
        textCursorY += 5;
      });
    }
    // Re-imprimir imágenes del lado derecho
    let rightCol2Y = unitBoxTopY + boxPadding + 6;
    if (unidad.imagenes && unidad.imagenes.length > 0) {
      for (let i = 0; i < unidad.imagenes.length && i < 2; i++) {
        const imageItem = unidad.imagenes[i];
        const imgData: string = typeof imageItem === "string" ? imageItem : imageItem.data;
        if (imgData) {
          const usedHeight = await addImageWithAspectRatio(
            pdf,
            imgData,
            pageWidth - marginX - 50,
            rightCol2Y,
            50,
            40
          );
          rightCol2Y += usedHeight + 5;
        }
      }
    }
    cursorY = unitBoxBottomY + 10;
    
    const finBoxTopY = cursorY;
    let finCursorY = finBoxTopY + boxPadding;
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(SUBTITLE_FONT_SIZE);
    pdf.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    pdf.text("Información Financiera", marginX, finCursorY);
    finCursorY += 8;
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(REGULAR_FONT_SIZE);
    pdf.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);

    setPrimaryColor();

    if (!selectedPlan) {
      pdf.text("No se ha seleccionado un plan de pago.", marginX, finCursorY);
      finCursorY += 6;
    } else if ("customPrecioPlan" in selectedPlan) {
      // Plan personalizado
      pdf.text("Plan de Pago: Personalizado", marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Pago Inicial: ${formatoMoneda(selectedPlan.customPagoInicial)}`, marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Pago Contraentrega: ${formatoMoneda(selectedPlan.customContraEntrega)}`, marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Precio Plan: ${formatoMoneda(selectedPlan.customPrecioPlan)}`, marginX, finCursorY);
      finCursorY += 8;
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(SUBTITLE_FONT_SIZE);
      setPrimaryColor();
      pdf.text("Calendario de Pagos", marginX, finCursorY);
      finCursorY += 6;
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(REGULAR_FONT_SIZE);
      setPrimaryColor();
      selectedPlan.customPayments.forEach((pago) => {
        pdf.text(`${pago.mes}: ${formatoMoneda(pago.monto)}`, marginX + 5, finCursorY);
        finCursorY += 5;
      });
    } else {
      // Plan predefinido (solo el 'selectedPlan')
      const precioLista = parseFloat(
        typeof unidad.preciolista === "string"
          ? unidad.preciolista.replace(/[$,]/g, "")
          : String(unidad.preciolista)
      );
      const precioPlan = precioLista - (precioLista * selectedPlan.descuento) / 100;
      const pagoInicial = (precioPlan * selectedPlan.pInicial) / 100;
      const pagoContraentrega = (precioPlan * selectedPlan.contraentrega) / 100;

      pdf.text(`Plan de Pago: ${selectedPlan.name}`, marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Precio Plan (con descuento): ${formatoMoneda(precioPlan)}`, marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Pago Inicial: ${formatoMoneda(pagoInicial)}`, marginX, finCursorY);
      finCursorY += 5;
      pdf.text(`Pago Contraentrega: ${formatoMoneda(pagoContraentrega)}`, marginX, finCursorY);
      finCursorY += 8;

    }
    
    const finBoxBottomY = finCursorY 
    
    cursorY = finBoxBottomY + 10;
    
if (proyecto?.paymentPlans && proyecto.paymentPlans.length > 0) {
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(SUBTITLE_FONT_SIZE);
  setPrimaryColor();
  pdf.text("Tabla Transpuesta: Planes de Pago", marginX, cursorY);
  cursorY += 8;

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(REGULAR_FONT_SIZE);
  setPrimaryColor();

  // 1) Calcula el precioLista de la unidad
  const precioLista = parseFloat(
    typeof unidad.preciolista === "string"
      ? unidad.preciolista.replace(/[$,]/g, "")
      : String(unidad.preciolista)
  );

  // Determina el máximo de mensualidades/parcialidades
  const maxInstallments = Math.max(
    ...proyecto.paymentPlans.map((plan) =>
      plan.mensualidades && plan.mensualidades > 0
        ? plan.mensualidades
        : plan.parcialidades.length
    )
  );

  // Prepara las filas “transpuestas”
  const rows: {
    label: string;
    type: "name" | "descuento" | "pInicial" | "mes" | "contraentrega";
    mesIndex?: number; // usado si type = "mes"
  }[] = [];

  // Fila 1: Nombre
  rows.push({ label: "Nombre del Plan", type: "name" });
  // Fila 2: Descuento
  rows.push({ label: "Descuento", type: "descuento" });
  // Fila 3: Enganche
  rows.push({ label: "Enganche", type: "pInicial" });
  // Filas 4..N: Meses (en base a la mayor cantidad de parcialidades)
  for (let i = 0; i < maxInstallments; i++) {
    rows.push({ label: `Mes ${i + 2}`, type: "mes", mesIndex: i });
  }
  // Fila Liquidación
  rows.push({ label: "Liquidación / Contraentrega", type: "contraentrega" });

  // Parámetros de layout
  const rowHeight = 6;
  const labelColWidth = 50; // ancho para la primera columna (etiqueta)
  const planColWidth = 30;  // ancho de cada columna de plan
  const spacingX = 5;       // espacio entre col label y col plan
  const bottomMargin = 10;  // para el salto de página
  const startX = marginX;
  let tableCursorY = cursorY;

  function ensureNewPageIfNeeded(extraNeeded = 0) {
    if (tableCursorY + extraNeeded > pageHeight - bottomMargin) {
      pdf.addPage();
      tableCursorY = 10; // reinicia cursor al tope
    }
  }

  // Encabezado de la tabla
  ensureNewPageIfNeeded(rowHeight);
  pdf.setFont("Helvetica", "bold");
  pdf.text("", startX, tableCursorY); // primera celda vacía (col etiqueta)
  let colX = startX + labelColWidth + spacingX;

  // Imprime “nombre del plan” como cabecera de cada columna
  proyecto.paymentPlans.forEach((plan) => {
    pdf.text(plan.name || "", colX, tableCursorY);
    colX += planColWidth;
  });
  tableCursorY += rowHeight;

  // Recorremos cada fila “transpuesta”
  pdf.setFont("Helvetica", "normal");
  rows.forEach((rowItem) => {
    ensureNewPageIfNeeded(rowHeight);

    // Etiqueta de la fila
    pdf.text(rowItem.label, startX, tableCursorY);

    // Por cada plan, calculamos su valor monetario
    colX = startX + labelColWidth + spacingX;
    proyecto.paymentPlans.forEach((plan) => {
      // 2) PrecioPlan = precioLista - descuento (en % sobre precioLista)
      const precioPlan = precioLista - (precioLista * plan.descuento) / 100;
      let val = "";

      switch (rowItem.type) {
        case "name":
          // Mantener el nombre como texto
          val = plan.name || "";
          break;

        case "descuento":
          // Mostramos el descuento en MXN (no el %)
          // Si quieres mostrar "Precio Plan" en lugar de "ahorro", ajusta la lógica
          const descuentoValue = (precioLista * plan.descuento) / 100;
          val = formatoMoneda(descuentoValue);
          break;

        case "pInicial":
          // Enganche en MXN
          const enganche = (precioPlan * plan.pInicial) / 100;
          val = formatoMoneda(enganche);
          break;

        case "mes": {
          const installmentsCount = plan.mensualidades && plan.mensualidades > 0
            ? plan.mensualidades
            : plan.parcialidades.length;

          if ((rowItem.mesIndex ?? 0) < installmentsCount) {
            // parcialidad => valor monetario en base a su % del precioPlan
            const parcialidad = plan.parcialidades[rowItem.mesIndex!] || { value: 0 };
            const mesValue = precioPlan * (parcialidad.value / 100);
            val = formatoMoneda(mesValue);
          } else {
            val = "-";
          }
          break;
        }

        case "contraentrega":
          // Contraentrega en MXN
          const contraEnt = (precioPlan * plan.contraentrega) / 100;
          val = formatoMoneda(contraEnt);
          break;
      }

      // Pintamos la celda correspondiente
      pdf.text(val, colX, tableCursorY);
      colX += planColWidth;
    });

    tableCursorY += rowHeight;
  });

  // Actualizar cursor final
  cursorY = tableCursorY + 10;
}


    pdf.save(`Cotizacion-${unidad.numerounidad}.pdf`);
    
  } catch (error) {
    console.error("❌ Error al generar el PDF:", error);
  }
}
