// Íconos para "Agregar a pantalla de inicio": el mandala en blanco sobre el fondo oscuro de la marca.
// Se corre una vez (`node scripts/iconos.mjs`) y los PNG quedan en public/icons/. Ver specs/offline-viajes/.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'src/assets/brand/mandala.png';
const BG = '#121417';
const OUT = 'public/icons';

// El mandala se usa como máscara en el sitio: solo importa su canal alfa.
const { width, height } = await sharp(SRC).metadata();
const alpha = await sharp(SRC).ensureAlpha().extractChannel('alpha').toBuffer();
const white = await sharp({ create: { width, height, channels: 3, background: '#fff' } })
  .joinChannel(alpha)
  .png()
  .toBuffer();

/** `size` px de lado; el mandala ocupa `fill` del ancho (los maskable necesitan margen seguro). */
async function icon(name, size, fill) {
  const logo = await sharp(white).resize({ width: Math.round(size * fill) }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`${OUT}/${name}`);
  console.log(`${OUT}/${name}`);
}

mkdirSync(OUT, { recursive: true });
await icon('icon-192.png', 192, 0.72);
await icon('icon-512.png', 512, 0.72);
await icon('icon-maskable-512.png', 512, 0.56);
await icon('apple-touch-icon.png', 180, 0.68);
