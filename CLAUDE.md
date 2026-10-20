# Bebe, Vive, Viaja · contexto del proyecto

Sitio de la agencia de viajes en grupo **Bebe, Vive, Viaja** (salidas desde CDMX y Toluca). Fase 1: catálogo de viajes con un itinerario por viaje. Objetivo: costo $0 hoy y crecer a app con reservas, panel y pagos sin reescribir. Ver `docs/ARQUITECTURA.md`.

## Stack
- Astro 7 (output estático) + islas de React 19 (`client:load` / `client:visible`)
- Contenido: `src/content/viajes/<slug>/index.json` + fotos al lado, validado con zod (`src/content.config.ts`, `import { z } from 'astro/zod'`)
- Hosting: hoy GitHub Pages (`.github/workflows/pages.yml`, publica en cada push a `main`). Objetivo a futuro: Cloudflare (Workers static assets, `wrangler.jsonc`). No usar Vercel Hobby (no permite uso comercial).
- Rutas internas siempre con `url()` de `src/lib/url.ts` (respeta `BASE_PATH`, p. ej. `/bebe-vive-viaja` en GitHub Pages). Nunca `href="/..."` directo.
- Node 22 (`.nvmrc`)

## Comandos
- `npm run dev` · `npm run build` · `npm run preview` · `npm run check` (correr check + build antes de dar algo por terminado)

## Specs (SDD)
- Toda funcionalidad nueva pasa por `specs/<nombre>/`: `requirements.md` (EARS) → `design.md` → `tasks.md` → código, con aprobación en cada paso. Skills: `/spec`, `/design`, `/plan`, `/implement`. Ver `specs/README.md` y las plantillas en `specs/_plantillas/`.
- Al implementar, una tarea a la vez y marcar su casilla en `tasks.md`.

## Convenciones
- UI y contenido en español de México; código y nombres de variables pueden ir en inglés o español, pero consistentes con lo existente (`viajes`, `chapters`, `facts`).
- React solo para interacción (Countdown, Checklist, RailControls). Todo lo demás en `.astro`.
- Fotos siempre por `Photo.astro` (optimiza a WebP calidad 90 y conecta el visor `[data-full]`). Fotos reales de viajes en `src/assets/nosotros/`, listadas en `src/lib/fotos.ts` (las usan el carrusel de portada y la sección Nosotros).
- Sistema visual en `src/styles/global.css`: serif Instrument Serif para titulares, Geist para texto, Geist Mono para etiquetas/datos. Temas por capítulo: `mist`, `paper`, `sage`, `dusk`, `night`. Nada de nubes ni elementos "bubbly": estilo editorial, filetes finos, datos numerados.
- Créditos de fotos de Wikimedia Commons van en `credits` del JSON y se muestran en el pie (obligatorio por licencia CC BY / BY-SA).
- La fecha/hora de los viajes es hora del centro de México (`utcOffset: "-06:00"`, sin horario de verano).

## Pendientes
- `src/config/site.ts`: WhatsApp e Instagram reales; confirmar `tagline`.
- Tepoztlán (24 oct 2026): puntos de abordaje, nombre del Skydive, terraza del convivio.
- Fotos originales en alta resolución (las actuales vienen comprimidas de WhatsApp; las verticales no rotan en el carrusel de escritorio por eso).
- Dominio final (`SITE_URL`; `robots.txt` ya se genera solo desde `src/pages/robots.txt.ts`).

## Siguiente fase (2): registro de viajeros
Formulario de apartado (nombre, teléfono, punto de abordaje, personas) → adaptador `@astrojs/cloudflare`, rutas `/api/*` como funciones, D1 (`viajes`, `reservas`, `viajeros`), Turnstile contra spam, aviso por correo/WhatsApp. Mantener las páginas de itinerario estáticas.
