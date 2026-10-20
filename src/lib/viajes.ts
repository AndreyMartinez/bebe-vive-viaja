import { getCollection, type CollectionEntry } from 'astro:content';

export type Viaje = CollectionEntry<'viajes'>;

/** Fecha+hora local del viaje → instante UTC en ms. */
export function instant(date: Date, hhmm: string, utcOffset: string): number {
  const ymd = date.toISOString().slice(0, 10);
  return Date.parse(`${ymd}T${hhmm}:00${utcOffset}`);
}

export function departure(v: Viaje) {
  return instant(v.data.date, v.data.start, v.data.utcOffset);
}

export function arrivalHome(v: Viaje) {
  // Damos 6 h de margen después de la última actividad para el regreso.
  return instant(v.data.date, v.data.end, v.data.utcOffset) + 6 * 3600 * 1000;
}

const fmtLong = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtShort = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' });

export const longDate = (d: Date) => {
  const s = fmtLong.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const shortDate = (d: Date) => fmtShort.format(d).replace('.', '');
export const codeDate = (d: Date) => d.toISOString().slice(2, 10).split('-').reverse().join('.');

/** Viajes publicados, ordenados por fecha; separa próximos y pasados en build. */
export async function getViajes() {
  const all = (await getCollection('viajes', (v) => v.data.status !== 'borrador')).sort(
    (a, b) => departure(a) - departure(b),
  );
  const now = Date.now();
  return {
    all,
    proximos: all.filter((v) => arrivalHome(v) > now),
    pasados: all.filter((v) => arrivalHome(v) <= now).reverse(),
  };
}
