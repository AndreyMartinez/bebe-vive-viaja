/** Datos de la marca. Cambia aquí y se actualiza en todo el sitio. */
export const site = {
  name: 'Bebe, Vive, Viaja',
  tagline: 'Viajes en grupo para salir de la rutina',
  description: 'Itinerarios y próximos viajes de Bebe, Vive, Viaja: escapadas en grupo con salidas desde CDMX y Toluca.',
  // TODO: pon el número real en formato internacional sin signos, p. ej. 5215512345678
  whatsapp: '',
  // Usuarios de redes, sin @
  instagram: 'bebeviveviaja',
  // TODO: ID del feed de Behold (behold.so) para mostrar la cuadrícula del perfil. Vacío = tarjeta con enlace.
  instagramFeedId: '',
  facebook: 'bebeviveviaja',
  tiktok: 'bebeviveviajamx',
  origins: ['CDMX', 'Toluca'],
};

export const whatsappLink = (text: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}` : null;

/** Perfiles de redes sociales con su URL pública (solo los que tienen usuario). */
export const socials = [
  { name: 'Instagram', user: site.instagram, href: `https://www.instagram.com/${site.instagram}/` },
  { name: 'Facebook', user: site.facebook, href: `https://www.facebook.com/${site.facebook}` },
  { name: 'TikTok', user: site.tiktok, href: `https://www.tiktok.com/@${site.tiktok}` },
].filter((s) => s.user);
