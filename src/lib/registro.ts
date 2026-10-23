/**
 * Registro de viajeros: contrato con la API de Apps Script (`apps-script/api/`).
 * La API vive en Google; el sitio sigue siendo estático. Sin `site.registroApi` y en dev se usan datos de prueba.
 */
import { mockEnviar, mockViaje } from './registro-mock';
import { url } from './url';

export type Parada = { nombre: string; direccion: string; maps: string };
export type ViajePublico = {
  ref: string;
  nombre: string;
  estado: 'abierto' | 'cerrado';
  /** Instructivo y guía turística que se ofrece al terminar el registro: referencia de una página del sitio
   *  (`tepoztlan-2026-10` → /viajes/tepoztlan-2026-10/) o un link completo. Vacío = sin botón. */
  guia?: string;
  paradas: Parada[];
};

export type RegistroPayload = {
  ref: string;
  /** Índice de la parada en `ViajePublico.paradas`. */
  parada: number;
  personas: string[];
  telefono: string;
  archivo: { nombre: string; tipo: string; base64: string };
  /** Campo trampa contra bots: siempre vacío. */
  sitio: '';
};

export type RegistroRespuesta = { ok: true; folio: string } | { ok: false; error: string; campo?: string };

/** `null` = la referencia no existe. Lanza si la API no responde. */
export async function fetchViaje(api: string, ref: string): Promise<ViajePublico | null> {
  if (!api) {
    if (import.meta.env.DEV) return mockViaje(ref);
    throw new Error('registroApi sin configurar');
  }
  const res = await fetch(`${api}?action=viaje&ref=${encodeURIComponent(ref)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.ok) return data.viaje as ViajePublico;
  if (data.error === 'no_existe') return null;
  throw new Error(data.error ?? 'error');
}

export async function enviarRegistro(api: string, payload: RegistroPayload): Promise<RegistroRespuesta> {
  if (!api) {
    if (import.meta.env.DEV) return mockEnviar(payload);
    throw new Error('registroApi sin configurar');
  }
  // `text/plain` evita la petición previa de CORS, que Apps Script no atiende.
  const res = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Liga de la guía: una referencia de viaje apunta a su página en este sitio; un link completo se deja igual. */
export const linkGuia = (guia: string) => (/^https?:\/\//.test(guia) ? guia : url(`/viajes/${encodeURIComponent(guia)}/`));

/** Mapa embebible sin API key. Los links cortos de Maps no se pueden embeber, así que se ubica por dirección. */
export const mapaEmbed = (p: Parada) => `https://maps.google.com/maps?q=${encodeURIComponent(p.direccion || p.nombre)}&output=embed`;

/** Link para abrir en la app de Maps: el de la hoja si existe, si no una búsqueda por dirección. */
export const mapaLink = (p: Parada) =>
  p.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.direccion || p.nombre)}`;
