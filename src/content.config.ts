import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Cada viaje vive en su propia carpeta: src/content/viajes/<slug>/index.json
 * junto con sus fotos. El esquema valida todo en build: si falta un campo o
 * una imagen no existe, `npm run build` falla con un mensaje claro.
 */
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'Usa formato HH:MM');

const viajes = defineCollection({
  loader: glob({ pattern: '*/index.json', base: './src/content/viajes', generateId: ({ entry }) => entry.split('/')[0] }),
  schema: ({ image }) => {
    const fact = z.object({ label: z.string(), num: z.string().optional(), text: z.string() });
    const caption = z.tuple([z.string(), z.string()]);
    return z.object({
      title: z.string(),
      titleAccent: z.string(),
      subtitle: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      start: hhmm,
      end: hhmm,
      utcOffset: z.string().default('-06:00'),
      region: z.string(),
      origins: z.array(z.string()).min(1),
      status: z.enum(['abierto', 'lleno', 'borrador']).default('abierto'),
      cover: image(),
      coverAlt: z.string(),
      sunset: hhmm.optional(),
      chapters: z.array(
        z.object({
          id: z.string(),
          start: hhmm,
          end: hhmm,
          kicker: z.string(),
          theme: z.enum(['mist', 'paper', 'sage', 'dusk', 'night']),
          tocLabel: z.string(),
          heading: z.string(),
          headingEm: z.string().optional(),
          lead: z.string(),
          compact: z.boolean().default(false),
          tags: z.array(z.object({ text: z.string(), tbd: z.boolean().default(false) })).default([]),
          stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
          feature: z
            .object({ image: image(), alt: z.string(), caption, note: z.string().optional(), fact: fact.optional() })
            .optional(),
          quote: z
            .object({ image: image(), alt: z.string(), caption, label: z.string(), text: z.string() })
            .optional(),
          placesTitle: z.string().optional(),
          placesTitleEm: z.string().optional(),
          places: z
            .array(
              z.object({
                image: image(),
                alt: z.string(),
                meta: z.string(),
                title: z.string(),
                text: z.string(),
                more: z.array(z.string()).default([]),
              }),
            )
            .default([]),
          facts: z.array(fact).default([]),
        }),
      ),
      checklist: z.array(z.object({ text: z.string(), hint: z.string().optional() })).default([]),
      quickFacts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      credits: z.array(z.object({ file: z.string(), author: z.string(), license: z.string() })).default([]),
    });
  },
});

export const collections = { viajes };
