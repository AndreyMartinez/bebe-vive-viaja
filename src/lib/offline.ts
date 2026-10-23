import { url } from './url';

/**
 * Viaje sin conexión: guarda en la Cache API todo lo que lista `offline/<slug>.json`
 * (lo genera `src/integrations/offline.ts` en el build) y `public/sw.js` lo sirve sin red.
 * Una caché por viaje y versión: `bvv-viaje-<slug>-<version>`. Ver `specs/offline-viajes/`.
 */

export interface OfflineBundle {
  slug: string;
  title: string;
  page: string;
  version: string;
  bytes: number;
  files: string[];
  /** Talla de un `srcset` → variante guardada (la más ancha). */
  aliases: Record<string, string>;
  /** CSS de Google Fonts: depende del navegador, así que se descarga desde el teléfono. */
  fonts: string[];
}

/** Se guarda como JSON en `<base>__meta/<slug>` dentro de la caché del viaje; lo leen el SW y `sin-conexion/`. */
export interface SavedMeta {
  slug: string;
  title: string;
  page: string;
  version: string;
  savedAt: string;
  aliases: Record<string, string>;
}

export class OfflineError extends Error {
  constructor(public kind: 'red' | 'espacio') {
    super(kind === 'espacio' ? 'Sin espacio para guardar el viaje' : 'No se pudo descargar todo');
  }
}

const PREFIX = 'bvv-viaje-';
const CONCURRENCY = 4;

export const cacheName = (slug: string, version: string) => `${PREFIX}${slug}-${version}`;
export const metaUrl = (slug: string) => url(`/__meta/${slug}`);
const isTripCache = (slug: string, name: string) => new RegExp(`^${PREFIX}${slug}-[0-9a-f]{12}$`).test(name);

export const offlineSupported = () => typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator;

export async function loadBundle(jsonUrl: string): Promise<OfflineBundle> {
  const res = await fetch(jsonUrl, { cache: 'no-cache' });
  if (!res.ok) throw new OfflineError('red');
  return res.json();
}

/** La copia guardada de un viaje (la más reciente si hubiera dos), o `null`. */
export async function findSaved(slug: string): Promise<SavedMeta | null> {
  let best: SavedMeta | null = null;
  for (const name of await caches.keys()) {
    if (!isTripCache(slug, name)) continue;
    const res = await (await caches.open(name)).match(metaUrl(slug));
    if (!res) continue; // descarga a medias: no cuenta
    const meta: SavedMeta = await res.json();
    if (!best || meta.savedAt > best.savedAt) best = meta;
  }
  return best;
}

export async function removeTrip(slug: string) {
  for (const name of await caches.keys()) if (isTripCache(slug, name)) await caches.delete(name);
}

/** Pide que el navegador no borre lo guardado cuando falte espacio (Chrome lo respeta; Safari lo ignora). */
export async function requestPersist() {
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* opcional */
  }
}

const isQuota = (e: unknown) => e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);

async function fetchOk(u: string, init?: RequestInit) {
  const res = await fetch(u, { cache: 'no-cache', ...init });
  if (!res.ok || res.status !== 200) throw new OfflineError('red');
  return res;
}

/** Descarga y guarda con un reintento; los errores de espacio no se reintentan. */
async function store(cache: Cache, u: string, init?: RequestInit) {
  for (let attempt = 0; ; attempt++) {
    try {
      await cache.put(u, await fetchOk(u, init));
      return;
    } catch (e) {
      if (isQuota(e)) throw new OfflineError('espacio');
      if (attempt >= 1) throw e instanceof OfflineError ? e : new OfflineError('red');
    }
  }
}

/** CSS de Google Fonts y sus .woff2. Si falla, el viaje se guarda igual con las fuentes del sistema. */
async function storeFonts(cache: Cache, fonts: string[]) {
  for (const css of fonts) {
    try {
      const res = await fetchOk(css, { mode: 'cors' });
      const text = await res.clone().text();
      await cache.put(css, res);
      const woff = [...text.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]);
      await Promise.all([...new Set(woff)].map((u) => store(cache, u, { mode: 'cors' })));
    } catch (e) {
      if (isQuota(e) || (e instanceof OfflineError && e.kind === 'espacio')) throw new OfflineError('espacio');
    }
  }
}

/**
 * Guarda el viaje completo en una caché nueva. Solo al terminar escribe `__meta` y borra
 * las versiones anteriores, así nunca queda una copia a medias como "guardada".
 */
export async function saveTrip(bundle: OfflineBundle, onProgress?: (done: number, total: number) => void): Promise<SavedMeta> {
  const name = cacheName(bundle.slug, bundle.version);
  await caches.delete(name);
  const cache = await caches.open(name);
  const total = bundle.files.length;
  let done = 0;
  onProgress?.(done, total);
  try {
    const queue = [...bundle.files];
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        for (let u = queue.shift(); u; u = queue.shift()) {
          await store(cache, u);
          onProgress?.(++done, total);
        }
      }),
    );
    await storeFonts(cache, bundle.fonts);
    const meta: SavedMeta = {
      slug: bundle.slug,
      title: bundle.title,
      page: bundle.page,
      version: bundle.version,
      savedAt: new Date().toISOString(),
      aliases: bundle.aliases,
    };
    await cache.put(metaUrl(bundle.slug), new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
    for (const other of await caches.keys()) if (other !== name && isTripCache(bundle.slug, other)) await caches.delete(other);
    return meta;
  } catch (e) {
    await caches.delete(name);
    throw e instanceof OfflineError ? e : isQuota(e) ? new OfflineError('espacio') : new OfflineError('red');
  }
}
