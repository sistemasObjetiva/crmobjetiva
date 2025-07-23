import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { Proyecto, Unidad, PlanPago } from '../../config/types';
import SignedAvatar from '../general/SignedAvatar';
import SignedImage from '../general/SignedImage';
import CotizacionPDF from './CotizacionUnidadPDF';

import UnidadInfo from './CotizadorUnidadInfo';
import UnidadImagenes from './CotizadorUnidadImagenes';
import SelectorPlanPago, { CustomPayment } from './CotizadorUnidadSelectorPlant';

import { pdf } from '@react-pdf/renderer';
import { blobToDataURL, getSignedUrl } from '../../hooks/useUtilsFunctions';

interface CotizadorModalProps {
  proyecto: Proyecto;
  unidad: Unidad;
  open: boolean;
  onClose: () => void;
}

const CotizadorModal: React.FC<CotizadorModalProps> = ({
  proyecto, unidad, open, onClose
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanPago | null>(null);
  const [isCustomPlan, setIsCustomPlan] = useState(false);
  const [customPayments, setCustomPayments] = useState<CustomPayment[]>([]);
  const [customPrecioPlan, setCustomPrecioPlan] = useState<number>(parseFloat(String(unidad.preciolista).replace(/[$,]/g, '')) || 0);
  const [customPagoInicial, setCustomPagoInicial] = useState<number>(0);
  const [customContraEntrega, setCustomContraEntrega] = useState<number>(0);

  // Handlers requeridos por SelectorPlanPago
  const handleSelectedPlanChange = (plan: PlanPago | null) => setSelectedPlan(plan);
  const handleIsCustomPlanChange = (val: boolean) => setIsCustomPlan(val);

  const precioLista = useMemo(() => {
    const num = parseFloat(String(unidad.preciolista).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
  }, [unidad.preciolista]);

  const totalCustomMonthly = customPayments.reduce((sum, p) => sum + Number(p.monto), 0);
  const totalProgramado = customPagoInicial + customContraEntrega + totalCustomMonthly;
  const restante = customPrecioPlan - totalProgramado;

  // Recibe todos los cambios del selector aquí
  const handlePlanSelected = (
    plan: PlanPago | null,
    isCustom: boolean,
    customPayments?: CustomPayment[],
    customPrecioPlan?: number,
    customPagoInicial?: number,
    customContraEntrega?: number
  ) => {
    setSelectedPlan(plan);
    setIsCustomPlan(isCustom);
    setCustomPayments(customPayments || []);
    setCustomPrecioPlan(customPrecioPlan ?? precioLista);
    setCustomPagoInicial(customPagoInicial ?? 0);
    setCustomContraEntrega(customContraEntrega ?? 0);
  };

  // ----------- PDF Lógica Completa -----------
  const canDownload = isCustomPlan
    ? (customPrecioPlan > 0 && restante === 0 && (customPagoInicial + customContraEntrega + customPayments.length > 0))
    : !!selectedPlan;

  const calcularValoresPlan = (plan: PlanPago) => {
    const base = precioLista * ((100 - plan.descuento) / 100);
    const enganche = base * (plan.pInicial / 100);
    const liquidacion = base * (plan.contraentrega / 100);
    const pagosMensuales = plan.parcialidades.map(p =>
      base * (p.value / 100)
    );
    return { enganche, liquidacion, pagosMensuales };
  };

  function buildCustomPseudoPlan(
    total: number,
    pagoInicial: number,
    contraEntrega: number,
    pagos: { mes: string; monto: number }[]
  ): PlanPago {
    const restantePosible = Math.max(total, 0) || 1;
    const pInicialPct = (pagoInicial / restantePosible) * 100;
    const contraPct = (contraEntrega / restantePosible) * 100;
    const parcialidades = pagos.map((p, i) => ({
      month: i + 1,
      value: (p.monto / restantePosible) * 100,
    }));

    return {
      name: 'Personalizado',
      descuento: 0,
      pInicial: +pInicialPct.toFixed(2),
      contraentrega: +contraPct.toFixed(2),
      mensualidades: pagos.length,
      months: pagos.length,
      parcialidades,
    } as PlanPago;
  }

  const handleDownloadPdf = async () => {
    let planParaPdf: PlanPago | null = selectedPlan;
    let enganche = 0;
    let liquidacion = 0;
    let pagosMensuales: number[] = [];

    if (isCustomPlan) {
      if (customPrecioPlan <= 0) {
        alert('Define un precio total > 0 para el plan personalizado.');
        return;
      }
      if (restante !== 0) {
        alert('El total programado no coincide con el precio del plan.');
        return;
      }
      const hayPagos =
        (customPayments.length > 0) ||
        (customContraEntrega > 0) ||
        (customPagoInicial > 0);
      if (!hayPagos) {
        alert('Agrega al menos un pago al plan personalizado.');
        return;
      }
      planParaPdf = buildCustomPseudoPlan(
        customPrecioPlan,
        customPagoInicial,
        customContraEntrega,
        customPayments
      );
      enganche = customPagoInicial;
      liquidacion = customContraEntrega;
      pagosMensuales = customPayments.map(p => p.monto);

    } else {
      if (!selectedPlan) {
        alert('Selecciona un plan primero.');
        return;
      }
      const { enganche: e, liquidacion: l, pagosMensuales: pm } = calcularValoresPlan(selectedPlan);
      enganche = e;
      liquidacion = l;
      pagosMensuales = pm;
    }

    // 1) Firmar URLs (igual que antes)
    const logoUrl = proyecto.logo?.path
      ? await getSignedUrl(proyecto.logo.path, proyecto.logo.bucket!)
      : undefined;
    const renderUrl = unidad.render?.path
      ? await getSignedUrl(unidad.render.path, unidad.render.bucket!)
      : undefined;
    const isoUrl = unidad.isometrico?.path
      ? await getSignedUrl(unidad.isometrico.path, unidad.isometrico.bucket!)
      : undefined;
    const planoUrl = unidad.plano?.path
      ? await getSignedUrl(unidad.plano.path, unidad.plano.bucket!)
      : undefined;
    const galeriaUrlsSigned = await Promise.all(
      (unidad.imagenes || []).map(img => getSignedUrl(img.path!, img.bucket!))
    );

    // 2) Convertir a Base64
    const bases = await Promise.all(
      [logoUrl, renderUrl, isoUrl, planoUrl, ...galeriaUrlsSigned]
        .filter(Boolean)
        .map(async url => {
          const resp = await fetch(url!);
          const blob = await resp.blob();
          return blobToDataURL(blob);
        })
    );
    const [logoBase, renderBase, isoBase, planoBase, ...galeriaBases] = bases;

    const planesParaPdf = isCustomPlan
      ? [...proyecto.paymentPlans, planParaPdf!] // agregas el custom al final
      : proyecto.paymentPlans;

    // 3) Generar PDF
    const blobPdf = await pdf(
      <CotizacionPDF
        proyecto={proyecto}
        unidad={unidad}
        planSeleccionado={planParaPdf!}
        planes={planesParaPdf}
        enganche={enganche}
        liquidacion={liquidacion}
        pagosMensuales={pagosMensuales}
        logoUrl={logoBase}
        renderUrl={renderBase}
        isometricoUrl={isoBase}
        planoUrl={planoBase}
        galeriaUrls={galeriaBases}
        esPersonalizado={isCustomPlan}
      />
    ).toBlob();

    const blobUrl = URL.createObjectURL(blobPdf);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${proyecto.nombre.replace(/\s+/g, '_')}_cotizacion.pdf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  // ------------------------------------------

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          mb: 1, color: 'white', background: 'var(--secondary-color)'
        }}
      >
        <Typography variant="h6" component="div">
          Cotización {proyecto.nombre}
        </Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, mb: 3 }}>
          <SignedAvatar value={proyecto.logo!} alt="Logo del Proyecto" sx={{ width: 90, height: 90, boxShadow: 2 }} />
          {proyecto.render && (
            <SignedImage
              path={proyecto.render.path!}
              bucket={proyecto.render.bucket!}
              alt="Fachada del Proyecto"
              sx={{
                width: 200, height: 120,
                borderRadius: 2, boxShadow: '2px 2px 10px rgba(0,0,0,0.13)'
              }}
            />
          )}
        </Box>
        <UnidadInfo unidad={unidad} />
        <UnidadImagenes unidad={unidad} />
        <SelectorPlanPago
          paymentPlans={proyecto.paymentPlans}
          precioLista={precioLista}
          selectedPlan={selectedPlan}
          isCustomPlan={isCustomPlan}
          customPayments={customPayments}
          customPrecioPlan={customPrecioPlan}
          customPagoInicial={customPagoInicial}
          customContraEntrega={customContraEntrega}
          restante={restante}
          onPlanSelected={handlePlanSelected}
          onCustomPaymentsChange={setCustomPayments}
          onCustomPrecioPlanChange={setCustomPrecioPlan}
          onCustomPagoInicialChange={setCustomPagoInicial}
          onCustomContraEntregaChange={setCustomContraEntrega}
          onSelectedPlanChange={handleSelectedPlanChange}         // <-- Importante!
          onIsCustomPlanChange={handleIsCustomPlanChange}         // <-- Importante!
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownloadPdf}
          disabled={!canDownload}
          sx={{ mr: 1, color: 'var(--primary-color)', borderColor: '#fff' }}
        >
          Descargar PDF
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CotizadorModal;
