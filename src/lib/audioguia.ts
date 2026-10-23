import { existsSync, readFileSync } from 'node:fs';
import { url } from './url';

/**
 * Audioguías: el guion vive en el JSON del viaje y `npm run audioguias` lo convierte en
 * `public/audioguias/<viaje>/<id>.mp3`. Si el MP3 no existe, el reproductor usa la voz del navegador.
 */

/** Igual que `slug()` en scripts/audioguias.mjs: si cambias uno, cambia el otro. */
export const guideId = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

type Manifest = Record<string, { hash: string; duration: number; peaks?: number[] }>;
let manifest: Manifest | undefined;
function readManifest(): Manifest {
  if (!manifest) {
    try {
      manifest = JSON.parse(readFileSync('public/audioguias/manifest.json', 'utf8'));
    } catch {
      manifest = {};
    }
  }
  return manifest!;
}

/**
 * URL del MP3 (si ya se generó), duración en segundos (real o estimada a 150 palabras por minuto)
 * y forma de onda (0–100 por barra, calculada por `npm run audioguias`).
 */
export function guideAudio(viaje: string, id: string, script: string[]) {
  const file = `audioguias/${viaje}/${id}.mp3`;
  const has = existsSync(`public/${file}`);
  const words = script.join(' ').split(/\s+/).length;
  const entry = readManifest()[file];
  return {
    src: has ? url(`/${file}`) : undefined,
    duration: Math.round(entry?.duration ?? (words / 150) * 60),
    peaks: entry?.peaks,
  };
}
