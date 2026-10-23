import type { AstroIntegration } from 'astro';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OfflineBundle } from '../lib/offline';

/**
 * Viaje sin conexión: después del build lee el HTML de cada `viajes/<slug>/` y escribe
 * `offline/<slug>.json` con todo lo que esa página necesita para abrir sin red.
 * La isla `OfflineSave` descarga esa lista y `public/sw.js` la sirve. Ver `specs/offline-viajes/`.
 */

const FONTS = 'https://fonts.googleapis.com/';
/** Páginas que se guardan junto con cada viaje (si existen en el build). */
const EXTRA_PAGES = ['sin-conexion/'];
/** Archivos del sitio que se guardan siempre (si existen). */
const EXTRA_FILES = ['favicon.svg', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function offline(): AstroIntegration {
  let base = '/';
  return {
    name: 'bvv-offline',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const toPath = (u: string) => join(dist, decodeURI(u.slice(base.length)).replace(/\/$/, '/index.html'));
        const isFile = (u: string) => u.startsWith(base) && existsSync(toPath(u)) && statSync(toPath(u)).isFile();
        // El lookbehind descarta URLs absolutas (og:image) que la página no carga.
        const assetRe = new RegExp(`(?<![\\w.:-])${escape(base)}_astro/[^"'\`&\\s),]+`, 'g');

        /** Referencias de una página: archivos, alias de srcset y CSS de fuentes. */
        function scanPage(html: string, files: Set<string>, aliases: Record<string, string>, fonts: Set<string>) {
          html = decode(html);
          // srcset: solo la talla más ancha; las demás quedan como alias.
          html = html.replace(/srcset="([^"]+)"/g, (_, set: string) => {
            const cands = set.split(',').map((c) => {
              const [u, w] = c.trim().split(/\s+/);
              return { u, w: parseInt(w) || 0 };
            });
            const best = cands.reduce((a, b) => (b.w > a.w ? b : a));
            files.add(best.u);
            for (const c of cands) if (c.u !== best.u) aliases[c.u] = best.u;
            return '';
          });
          for (const m of html.matchAll(assetRe)) files.add(m[0]);
          for (const m of html.matchAll(/audioguias\/[\w\-./]+?\.mp3/g)) files.add(`${base}${m[0]}`);
          for (const m of html.matchAll(/<link\b[^>]*>/g)) {
            const rel = m[0].match(/rel="([^"]+)"/)?.[1] ?? '';
            const href = m[0].match(/href="([^"]+)"/)?.[1];
            if (!href) continue;
            if (href.startsWith(FONTS) && rel === 'stylesheet') fonts.add(href);
            else if (/stylesheet|icon|manifest|modulepreload/.test(rel) && href.startsWith(base)) files.add(href);
          }
          // Los alias que también se usan fuera de srcset son archivos propios.
          for (const u of files) delete aliases[u];
        }

        /** Sigue imports de JS y url() de CSS. */
        function expand(files: Set<string>) {
          const queue = [...files];
          while (queue.length) {
            const u = queue.pop()!;
            if (!isFile(u) || !/\.(js|css)$/.test(u)) continue;
            const src = readFileSync(toPath(u), 'utf8');
            const dirUrl = u.slice(0, u.lastIndexOf('/') + 1);
            const refs = [
              ...[...src.matchAll(/["'`]\.\/([\w.\-]+\.(?:js|css))["'`]/g)].map((m) => dirUrl + m[1]),
              ...[...src.matchAll(assetRe)].map((m) => m[0]),
              ...[...src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)]
                .map((m) => m[1])
                .filter((r) => !/^(data:|https?:|#)/.test(r))
                .map((r) => (r.startsWith('/') ? r : new URL(r, `http://x${dirUrl}`).pathname)),
            ];
            for (const r of refs) if (!files.has(r)) { files.add(r); queue.push(r); }
          }
        }

        const viajesDir = join(dist, 'viajes');
        if (!existsSync(viajesDir)) return;
        const slugs = readdirSync(viajesDir).filter((s) => existsSync(join(viajesDir, s, 'index.html')));
        mkdirSync(join(dist, 'offline'), { recursive: true });

        for (const slug of slugs) {
          const page = `${base}viajes/${slug}/`;
          const html = readFileSync(toPath(page), 'utf8');
          const files = new Set<string>([page]);
          const aliases: Record<string, string> = {};
          const fonts = new Set<string>();
          scanPage(html, files, aliases, fonts);
          for (const p of EXTRA_PAGES) {
            const u = `${base}${p}`;
            if (isFile(u)) { files.add(u); scanPage(readFileSync(toPath(u), 'utf8'), files, aliases, fonts); }
          }
          for (const f of EXTRA_FILES) files.add(`${base}${f}`);
          files.add(`${base}viajes/${slug}/manifest.webmanifest`);
          expand(files);

          const list = [...files].filter(isFile).sort();
          const hash = createHash('sha256');
          let bytes = 0;
          for (const u of list) {
            const buf = readFileSync(toPath(u));
            bytes += buf.length;
            hash.update(u).update(buf);
          }
          const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? slug).split(' · ')[0];
          const bundle: OfflineBundle = {
            slug,
            title,
            page,
            version: hash.digest('hex').slice(0, 12),
            bytes,
            files: list,
            aliases: Object.fromEntries(Object.entries(aliases).filter(([, v]) => list.includes(v))),
            fonts: [...fonts],
          };
          writeFileSync(join(dist, 'offline', `${slug}.json`), JSON.stringify(bundle));
          logger.info(`offline/${slug}.json · ${list.length} archivos · ${(bytes / 1e6).toFixed(1)} MB`);
        }
      },
    },
  };
}
