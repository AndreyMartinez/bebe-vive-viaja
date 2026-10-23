/**
 * Datos de prueba para trabajar sin Google (solo en `npm run dev` y sin `registroApi`).
 * Ligas: ?viaje=demo · ?viaje=demo-cerrado · ?viaje=demo-sin-paradas · teléfono 0000000000 simula un error al guardar.
 */
import type { RegistroPayload, RegistroRespuesta, ViajePublico } from './registro';

const paradas = [
  { nombre: 'CDMX · Metro Observatorio', direccion: 'Metro Observatorio, Álvaro Obregón, Ciudad de México', maps: '' },
  { nombre: 'CDMX · Metro Universidad', direccion: 'Metro Universidad, Coyoacán, Ciudad de México', maps: '' },
  { nombre: 'Toluca · Plaza Sendero', direccion: 'Plaza Sendero Toluca, Toluca de Lerdo, Estado de México', maps: '' },
];

const viajes: Record<string, ViajePublico> = {
  demo: { ref: 'demo', nombre: 'Tepoztlán · Oct 2026', estado: 'abierto', guia: 'tepoztlan-2026-10', paradas },
  'demo-cerrado': { ref: 'demo-cerrado', nombre: 'Peña de Bernal · Sep 2026', estado: 'cerrado', paradas },
  'demo-sin-paradas': { ref: 'demo-sin-paradas', nombre: 'FIG León · Nov 2026', estado: 'abierto', paradas: [] },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockViaje(ref: string): Promise<ViajePublico | null> {
  await wait(400);
  return viajes[ref] ?? null;
}

export async function mockEnviar(p: RegistroPayload): Promise<RegistroRespuesta> {
  await wait(1200);
  if (p.telefono === '0000000000') throw new Error('Error simulado');
  return { ok: true, folio: 'BVV-DEMO' };
}
