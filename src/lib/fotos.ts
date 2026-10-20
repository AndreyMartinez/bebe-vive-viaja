import type { ImageMetadata } from 'astro';
import mirador from '../assets/nosotros/mirador.jpg';
import carretera from '../assets/nosotros/carretera.jpg';
import amanecer from '../assets/nosotros/amanecer.jpg';
import cuatrimoto from '../assets/nosotros/cuatrimoto.jpg';
import dunas from '../assets/nosotros/dunas.jpg';
import pulseras from '../assets/nosotros/pulseras.jpg';

/** Fotos reales de viajes de Bebe, Vive, Viaja (portada y sección Nosotros). */
export interface FotoViaje {
  key: string;
  src: ImageMetadata;
  alt: string;
  note: string;
  /** Encuadre al recortar la foto como fondo (background-position). */
  pos: string;
}

export const fotosViajes: FotoViaje[] = [
  { key: 'mirador', src: mirador, alt: 'Pareja abrazada en un mirador frente a un mar de nubes', note: 'Sobre las nubes', pos: '60% 45%' },
  { key: 'carretera', src: carretera, alt: 'Pareja besándose en medio de una carretera entre cerros verdes', note: 'En carretera', pos: 'center 60%' },
  { key: 'amanecer', src: amanecer, alt: 'Pareja frente a la sierra con el cielo dorado del amanecer', note: 'Primera luz', pos: 'center 55%' },
  { key: 'cuatrimoto', src: cuatrimoto, alt: 'Dos personas en cuatrimoto sobre arena volcánica al atardecer', note: 'A todo motor', pos: 'center 40%' },
  { key: 'dunas', src: dunas, alt: 'Fila de cuatrimotos recorriendo las dunas al atardecer', note: 'Todos juntos', pos: 'center 60%' },
  { key: 'pulseras', src: pulseras, alt: 'Dos muñecas con pulseras de Bebe, Vive, Viaja frente a una montaña entre nubes', note: 'Ya eres del grupo', pos: 'center 50%' },
];
