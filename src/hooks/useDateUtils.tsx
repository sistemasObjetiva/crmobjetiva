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

