import { Temporal } from "@js-temporal/polyfill";

export const normalizeDate = (date: string | Date | Temporal.PlainDate | null): Temporal.PlainDate | null => {
  if (!date) {
    console.error("⚠️ Error: Se intentó normalizar una fecha inválida:", date);
    return null;
  }

  try {
    if (date instanceof Date) {
      return Temporal.PlainDate.from({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });
    }

    if (date instanceof Temporal.PlainDate) {
      return date;
    }

    if (typeof date === "string") {
      return Temporal.PlainDate.from(date);
    }

    console.error("⚠️ Error: Tipo de dato no reconocido en normalizeDate:", date);
    return null;
  } catch (error) {
    console.error("❌ Error normalizando la fecha:", error);
    return null;
  }
};
export const isSameDate = (date1: Temporal.PlainDate | null, date2: Temporal.PlainDate | null): boolean => {
  if (!date1 || !date2) return false;
  return Temporal.PlainDate.compare(date1, date2) === 0;
};
export const fechaActual = Temporal.Now.plainDateISO().toString();

// Función auxiliar para calcular el periodo (lunes - domingo) basado en una fecha
export const getWeekPeriod = (fechaStr: string): string => {
  // Convierte la cadena a un Temporal.PlainDate
  const fecha = Temporal.PlainDate.from(fechaStr);
  // dayOfWeek: 1 es lunes y 7 es domingo
  const dayOfWeek = fecha.dayOfWeek;
  // Calcula el lunes restando (dayOfWeek - 1) días
  const monday = fecha.subtract({ days: dayOfWeek - 1 });
  // Calcula el domingo sumando (7 - dayOfWeek) días
  const sunday = fecha.add({ days: 7 - dayOfWeek });
  return `${monday.toString()} - ${sunday.toString()}`;
};

export const getWeekInfo = (fechaStr: string) => {
  // Convertimos la cadena a Temporal.PlainDate
  const fecha = Temporal.PlainDate.from(fechaStr);
  // dayOfWeek: 1 es lunes y 7 es domingo
  const dayOfWeek = fecha.dayOfWeek;
  // Obtenemos el jueves más cercano para determinar el año ISO
  const nearestThursday = fecha.add({ days: 4 - dayOfWeek });
  const weekYear = nearestThursday.year;
  // Para calcular el ordinal (día del año) del jueves, obtenemos el primer día del año ISO
  const yearStart = Temporal.PlainDate.from({ year: weekYear, month: 1, day: 1 });
  // Calculamos la diferencia en días
  const diff = yearStart.until(nearestThursday, { largestUnit: 'days' });
  const ordinal = diff.days + 1; // Jan 1 es el día 1
  // Se calcula el número de semana usando la fórmula estándar
  const weekNumber = Math.floor((ordinal - 1) / 7) + 1;
  return { weekNumber, weekYear };
};

export const getTimestampValue = (dateInput?: string | Date | null): string => {
  let dateObject: Date | null = null;
  
  if (dateInput instanceof Date) {
    if (!isNaN(dateInput.getTime())) {
      dateObject = dateInput;
    }
  }
  
  else if (typeof dateInput === 'string' && dateInput.trim() !== '') {
    const parsedDate = new Date(dateInput);
    if (!isNaN(parsedDate.getTime())) {
      dateObject = parsedDate;
    }
  }
  if (dateObject) {
    return dateObject.toISOString(); 
  } else {
    return new Date().toISOString();
  }
};


export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })