/** Datos de la marca. Cambia aquí y se actualiza en todo el sitio. */
export const site = {
  name: 'Bebe, Vive, Viaja',
  tagline: 'Viajes en grupo para salir de la rutina',
  description: 'Itinerarios y próximos viajes de Bebe, Vive, Viaja: escapadas en grupo con salidas desde CDMX y Toluca.',
  // TODO: pon el número real en formato internacional sin signos, p. ej. 5215512345678
  whatsapp: '',
  // TODO: usuario real de Instagram, sin @
  instagram: '',
  origins: ['CDMX', 'Toluca'],
};

export const whatsappLink = (text: string) =>
  site.whatsapp ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}` : null;
