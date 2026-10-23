// Viaje sin conexión: sirve lo que la isla OfflineSave guardó en las cachés `bvv-viaje-<slug>-<version>`.
// No descarga ni decide versiones (eso vive en src/lib/offline.ts). Ver specs/offline-viajes/.
const BASE = new URL(self.registration.scope).pathname;
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const MATCH = { ignoreVary: true };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const local = u.origin === self.location.origin;
  // Todo lo externo (API de registro, mapas, redes) va directo a la red; Google Fonts sí se sirve de la copia.
  if (!local && !FONTS.includes(u.hostname)) return;
  if (local && (u.pathname.startsWith(`${BASE}offline/`) || u.pathname === `${BASE}sw.js`)) return;
  e.respondWith(req.mode === 'navigate' ? page(req) : asset(req));
});

/** Páginas: la copia guardada si existe (la isla la mantiene al día); si no, red; sin red, `sin-conexion/`. */
async function page(req) {
  const saved = await caches.match(req, { ...MATCH, ignoreSearch: true });
  if (saved) return saved;
  try {
    return await fetch(req);
  } catch {
    return (
      (await caches.match(`${BASE}sin-conexion/`, MATCH)) ||
      new Response('<!doctype html><meta charset="utf-8"><title>Sin conexión</title><p>Sin conexión.</p>', {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
  }
}

/** Archivos: copia guardada (o la otra talla guardada de la misma foto); si no, red. */
async function asset(req) {
  let res = await caches.match(req, MATCH);
  if (!res && /\/_astro\/[^/]+\.(webp|avif|jpe?g|png)$/.test(new URL(req.url).pathname)) {
    const alias = (await aliases())[new URL(req.url).pathname];
    if (alias) res = await caches.match(alias, MATCH);
  }
  if (!res) return fetch(req);
  const range = req.headers.get('range');
  return range ? partial(res, range) : res;
}

/** Une los `aliases` de todos los viajes guardados (talla de srcset → variante guardada). */
async function aliases() {
  const all = {};
  for (const name of await caches.keys()) {
    if (!name.startsWith('bvv-viaje-')) continue;
    const cache = await caches.open(name);
    for (const key of await cache.keys()) {
      if (!key.url.includes('/__meta/')) continue;
      try {
        Object.assign(all, (await (await cache.match(key)).json()).aliases);
      } catch {
        /* meta dañada: se ignora */
      }
    }
  }
  return all;
}

/** Safari pide el audio por rangos y no lo reproduce (ni deja adelantar) si recibe el archivo completo. */
async function partial(res, range) {
  const blob = await res.blob();
  const size = blob.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start = m && m[1] !== '' ? Number(m[1]) : NaN;
  let end = m && m[2] !== '' ? Number(m[2]) : size - 1;
  if (m && m[1] === '' && m[2] !== '') {
    start = Math.max(0, size - Number(m[2])); // bytes=-500: los últimos 500
    end = size - 1;
  }
  if (!m || Number.isNaN(start) || start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  end = Math.min(end, size - 1);
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
