/** Ruta interna con la base del sitio (p. ej. `/bebe-vive-viaja/` en GitHub Pages, `/` en Cloudflare). */
export const url = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
