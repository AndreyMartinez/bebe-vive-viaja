import { site } from '../config/site';
import { url } from './url';

/**
 * Web app manifest para "Agregar a pantalla de inicio". El de cada viaje abre ese viaje
 * (así el ícono funciona sin red con la copia guardada); el general abre la portada.
 */
export function manifest({ name, shortName, start }: { name: string; shortName: string; start: string }) {
  const body = {
    name,
    short_name: shortName,
    description: site.description,
    lang: 'es-MX',
    start_url: start,
    scope: start,
    display: 'standalone',
    background_color: '#121417',
    theme_color: '#121417',
    icons: [
      { src: url('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: url('/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
      { src: url('/icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/manifest+json' } });
}
