import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import {  Document, Empresa,   } from "../config/types";


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
  // Función para formatear valores en millones (divide el valor entre 1,000,000)
export const formatCurrencyMillions = (value: number): string => {
  return `$${(value / 1_000_000).toFixed(2)}M`;
};

export const normalizeFileName = (filename: string): string => {
  const normalized = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9_.-]/g, "_");
};

export const handleVerDocumento = async (
  path: string,
  bucket: string 
) => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("Error al generar la URL firmada:", error.message);
    return;
  }

  window.open(data.signedUrl, "_blank");
};

export async function getSignedUrl(
  path: string,
  bucket: string,
  expires = 60 * 60
): Promise<string | null> {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, expires)

  if (error) {
    console.error('Error generando URL firmada:', error.message)
    return null
  }
  return data.signedUrl
}

export const eliminarLetras = (valor: string): string => {
  return valor.replace(/\D/g, ""); // Elimina todo lo que no sea dígito (0–9)
};
export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSignedUrl(path?: string, bucket?: string) {
  const [url, setUrl] = useState<string|null>(null);

  useEffect(() => {
    if (!path || !bucket) return;
    let mounted = true;
    getSignedUrl(path, bucket).then(signed => {
      if (mounted && signed) setUrl(signed);
    });
    return () => { mounted = false; };
  }, [path, bucket]);

  return url;
}
export const percentFormatter = (v: number) => `${(v * 100).toFixed(2)}%`;
export const prepararArchivos = (
  files: File[]
): Document[] => {
  return files.map(file => ({
    id: crypto.randomUUID(),
    nombre: file.name,
    file,
    url: URL.createObjectURL(file),
  }));
};


export function parseDateDMY(str: string): string {
  if (!str) return '';
  const parts = str.split('/');
  if (parts.length !== 3) return '';
  const [day, month, yearPart] = parts;
  const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
  const isoString = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
  return isoString;
}

/**
 * Busca el ID de la empresa por su nombre legal en la lista de contratistas.
 * @param name Nombre legal de la empresa según PDF
 * @param contratistas Array de objetos Empresa con id y nombreLegal
 * @returns El id de la empresa encontrada o cadena vacía si no existe
 */
export function findEmpresaIdByName(
  name: string,
  contratistas: { id: string; nombreLegal: string }[]
): string {
  const found = contratistas.find(c => c.nombreLegal.trim() === name.trim());
  return found ? found.id : '';
}

export const getEmpresa = (companyId: string,contratistas:Empresa[]) =>
    contratistas.find(c => c.id === companyId)?.nombre || '—';
/**
 * Mapea la estructura anidada de la respuesta del endpoint a un Partial<Contrato>.
 * Incluye fianzas, montos e importes.
 */
/*export function mapApiToContrato(
  data: any,
  contratistas: { id: string; nombreLegal: string }[]
): Partial<Contrato> {
  // Desestructurar con valores por defecto
  const {
    contratista = '',
    concepto = '',
    iva: { tipo: tipoiva = '', monto: ivainicial = 0 } = {},
    montos: { f: subtotalinicial = 0, totalConIva: totalinicial = 0 } = {},
    porcentajes: { anticipo: pctAnt = 0, fondoGarantia: pctFondo = 0, retenciones: pctRet = 0 } = {},
    importes: { anticipo: importeanticipo = 0, fondoGarantia: importefondogarantia = 0, retenciones: importeretenciones = 0 } = {},
    fechas: { inicio = '', fin = '' } = {},
    fianzas: {
      cumplimiento: { numero: numCum = '', fecha: fecCum = '' } = {},
      anticipo:     { numero: numAnt = '', fecha: fecAnt = '' } = {},
      viciosOcultos:{ numero: numVic = '', fecha: fecVic = '' } = {},
      pasivosContingentes:{ numero: numPas = '', fecha: fecPas = '' } = {}
    } = {},
    nuevosMontos: { subtotal: newSub = 0, iva: newIva = 0, total: newTot = 0, anticipo: newAnt = 0, fondo: newFondo = 0 } = {}
  } = data;

  // Construir fianzas
  const fianzaCum: Fianza = { numero: numCum, fecha: parseDateDMY(fecCum), file: [] };
  const fianzaAnt: Fianza = { numero: numAnt, fecha: parseDateDMY(fecAnt), file: [] };
  const fianzaVic: Fianza = { numero: numVic, fecha: parseDateDMY(fecVic), file: [] };
  const fianzaPas: Fianza = { numero: numPas, fecha: parseDateDMY(fecPas), file: [] };

  return {
    // IDs y metadatos
    empresaid: findEmpresaIdByName(contratista, contratistas),
    concepto,
    // Fechas principales
    fechainicio: parseDateDMY(inicio),
    fechafin:   parseDateDMY(fin),
    fechaactualizacion: new Date().toISOString(),
    // IVA y montos iniciales
    tipoiva,
    subtotalinicial,
    ivainicial,
    totalinicial,
    // Porcentajes (convertidos a decimal)
    poranticipo: pctAnt / 100,
    porfondogarantia: pctFondo / 100,
    porretenciones: pctRet / 100,
    // Importes fijos
    importeanticipo,
    importefondogarantia,
    importeretenciones,
    // Montos nuevos después de aditivas/deductivas
    subtotal: newSub,
    iva: newIva,
    total: newTot,
    // Fianzas
    fianzacomplimiento: fianzaCum,
    fianzaanticipo:     fianzaAnt,
    fianzavicios:       fianzaVic,
    fianzapasivos:      fianzaPas,
    // Inicializar arrays vacíos
    referencias: [],
    cambioscontrato: [] as CambioContrato[],
    presupuestocontrato: [] as PresupuestoContrato[],
  };
}*/
