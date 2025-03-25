import jsPDF from 'jspdf';
import { Proyecto, Unidad,  PaymentPlanOrCustom } from '../types/types';


export const getRandomInt = (max: number): number => {
    if (typeof max !== "number" || max <= 0) {
      throw new Error("El parámetro 'max' debe ser un número positivo.");
    }
    return Math.floor(Math.random() * max);
  };
  
  // 🔹 Formatea un valor como moneda MXN
  export const formatoMoneda = (value: string | number): string => {
    if (!value) return ""; // Si está vacío, devuelve cadena vacía
  
    // 🔹 Convertir a string y eliminar caracteres no numéricos ni puntos decimales
    const numericValue = value.toString().replace(/[^0-9.]/g, "");
  
    // 🔹 Convertir a número flotante
    const parsedValue = parseFloat(numericValue);
  
    // 🔹 Si el valor es NaN, retorna cadena vacía
    if (isNaN(parsedValue)) return "";
  
    // 🔹 Formatear como moneda MXN
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(parsedValue);
  };
  export const handleDownloadPDF = async (
    proyecto: Proyecto,
    unidad: Unidad,
    selectedPlan: PaymentPlanOrCustom | null
  ) => {
    if (!proyecto || !unidad) {
      console.error("❌ Proyecto o unidad no definidos.");
      return;
    }
  
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let y = 10;
  
      pdf.setFontSize(16);
      pdf.text(proyecto.nombreProyecto, 105, y, { align: 'center' });
      y += 8;
      pdf.setFontSize(12);
      pdf.text(`Unidad: ${unidad.numerounidad}`, 105, y, { align: 'center' });
      y += 10;
  
      if (proyecto.logo) {
        const logo = await loadImage(proyecto.logo);
        pdf.addImage(logo, 'PNG', 15, y, 40, 20);
      }
      if (proyecto.fachada) {
        const fachada = await loadImage(proyecto.fachada);
        pdf.addImage(fachada, 'PNG', 160, y, 40, 20);
      }
      y += 30;
  
      pdf.setFontSize(14);
      pdf.text("Detalles de la Unidad", 15, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.text(`Unidad Privativa: ${unidad.unidadprivativa}`, 15, y);
      y += 6;
      pdf.text(`Precio de Lista: ${formatoMoneda(unidad.preciolista)}`, 15, y);
      y += 6;
  
      if (unidad.extras && Object.keys(unidad.extras).length > 0) {
        pdf.text("Extras:", 15, y);
        y += 6;
        Object.entries(unidad.extras).forEach(([key, value]) => {
          pdf.text(`- ${key}: ${value}`, 20, y);
          y += 6;
        });
      }
      y += 6;
  
      pdf.setFontSize(14);
      pdf.text("Información Financiera", 15, y);
      y += 8;
      pdf.setFontSize(10);
  
      if (selectedPlan) {
        // Verificamos si es un plan personalizado mediante la propiedad 'customPrecioPlan'
        if ("customPrecioPlan" in selectedPlan) {
          // Es un CustomPlan
          pdf.text(`Plan de Pago: Personalizado`, 15, y);
          y += 6;
          pdf.text(`Pago Inicial: ${formatoMoneda(selectedPlan.customPagoInicial)}`, 15, y);
          y += 6;
          pdf.text(`Pago Contraentrega: ${formatoMoneda(selectedPlan.customContraEntrega)}`, 15, y);
          y += 6;
          pdf.text(`Precio Plan: ${formatoMoneda(selectedPlan.customPrecioPlan)}`, 15, y);
          y += 8;
          
          pdf.setFontSize(12);
          pdf.text("Calendario de Pagos", 15, y);
          y += 6;
          pdf.setFontSize(10);
          // Iteramos sobre los pagos personalizados
          selectedPlan.customPayments.forEach((pago) => {
            pdf.text(`${pago.mes}: ${formatoMoneda(pago.monto)}`, 20, y);
            y += 6;
          });
        } else {
          
          // Convertir el precio de lista a número, eliminando $ y comas
          const precioLista = typeof unidad.preciolista === 'string'
            ? parseFloat(unidad.preciolista.replace(/[$,]/g, ''))
            : unidad.preciolista;
            const precioPlan = precioLista - (precioLista * selectedPlan.descuento) / 100;
            
            const pagoInicial = (precioPlan * selectedPlan.pInicial) / 100;
            const pagoContraentrega = (precioPlan * selectedPlan.contraentrega) / 100;
            const monthlyPayment = (precioPlan * selectedPlan.parcialidades) / 100 / selectedPlan.months;

            pdf.text(`Plan de Pago: ${selectedPlan.name}`, 15, y);
            y += 6;
            
            pdf.text(`Precio Plan: ${formatoMoneda(precioPlan)}`, 15, y);
            y += 6;
            
            pdf.text(`Pago Inicial: ${formatoMoneda(pagoInicial)}`, 15, y);
            y += 6;
            
            pdf.text(`Pago Contraentrega: ${formatoMoneda(pagoContraentrega)}`, 15, y);
            y += 6;
            
            pdf.text(
              `Mensualidades (${selectedPlan.months} meses): ${formatoMoneda(monthlyPayment)}`,
              15,
              y
            );
            y += 8;
            
            // Calendario de pagos
            pdf.setFontSize(12);
            pdf.text("Calendario de Pagos", 15, y);
            y += 6;
            pdf.setFontSize(10);
            
            let fecha = new Date();
            for (let i = 1; i <= selectedPlan.months; i++) {
              fecha.setMonth(fecha.getMonth() + 1);
              pdf.text(
                `${fecha.toLocaleString('default', { month: 'long', year: 'numeric' })}: ${formatoMoneda(monthlyPayment)}`,
                20,
                y
              );
              y += 6;
            }
            
        }
      } else {
        pdf.text("No se ha seleccionado un plan de pago.", 15, y);
      }
  
      y += 10;
      if (unidad.imagenes && unidad.imagenes.length > 0) {
        pdf.setFontSize(12);
        pdf.text("Imágenes de la Unidad", 15, y);
        y += 6;
        for (let i = 0; i < unidad.imagenes.length && i < 3; i++) {
          const imgData = typeof unidad.imagenes[i] === 'string' ? unidad.imagenes[i] : unidad.imagenes[i].data;
          if (typeof imgData === 'string') {
            const img = await loadImage(imgData);
            pdf.addImage(img, 'PNG', 15 + (i * 65), y, 50, 40);
          }
        }
      }
  
      pdf.save(`Cotización-${unidad.numerounidad}.pdf`);
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
    }
  };
  
  const loadImage = async (base64: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
    });
  };
  
  