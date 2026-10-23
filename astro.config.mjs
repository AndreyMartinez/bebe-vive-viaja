// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// `SITE_URL`: dominio final (sitemap, canonical y Open Graph).
// `BASE_PATH`: subcarpeta donde vive el sitio, p. ej. `/bebe-vive-viaja` en GitHub Pages. En Cloudflare se deja vacío.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://bebeviveviaja.pages.dev',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), sitemap({ filter: (page) => !['/politicas-de-cancelacion/', '/bienvenida/'].some((p) => page.includes(p)) })],
  image: { responsiveStyles: false },
});
