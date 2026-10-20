# Bebe, Vive, Viaja · sitio web

Catálogo de viajes e itinerarios de **Bebe, Vive, Viaja**. Hecho con [Astro](https://astro.build) e islas de React. Hoy es un sitio estático (costo $0) y está pensado para crecer a una app con reservas, cuentas y pagos. El plan está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Arrancar

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:4321
```

| Comando           | Qué hace                                            |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Servidor local con recarga en vivo                  |
| `npm run build`   | Genera el sitio en `dist/` y optimiza las fotos     |
| `npm run preview` | Sirve `dist/` para revisarlo antes de publicar      |
| `npm run check`   | Revisa tipos y que los JSON cumplan el esquema      |

## Estructura

```
src/
├── config/site.ts            ← nombre, eslogan, WhatsApp, Instagram
├── content.config.ts         ← esquema (zod) de un viaje
├── content/viajes/
│   └── tepoztlan-2026-10/
│       ├── index.json        ← todo el itinerario
│       └── *.jpg             ← fotos del viaje
├── components/
│   ├── Chapter.astro         ← un bloque del día (I, II, III…)
│   ├── Photo.astro           ← foto optimizada + visor en grande
│   ├── TripCard.astro        ← tarjeta de viaje en la portada
│   └── islands/              ← React solo donde hay interacción
│       ├── Countdown.tsx
│       ├── Checklist.tsx
│       └── RailControls.tsx
├── layouts/Base.astro        ← <head>, SEO, Open Graph, pie
├── lib/viajes.ts             ← fechas, próximos vs pasados
├── pages/
│   ├── index.astro           ← portada
│   ├── viajes/index.astro    ← todos los viajes
│   └── viajes/[slug].astro   ← página de cada itinerario
└── styles/global.css         ← tokens de color y tipografía
```

## Agregar un viaje nuevo

1. Copia la carpeta `src/content/viajes/tepoztlan-2026-10` con otro nombre, por ejemplo `valle-de-bravo-2026-11`. Ese nombre será la URL: `/viajes/valle-de-bravo-2026-11/`.
2. Cambia las fotos y edita `index.json`.
3. `npm run check`. Si falta un campo o una foto no existe, te dice cuál.
4. Haz commit y push. El sitio se vuelve a publicar solo.

Campos útiles:

- `status`: `abierto`, `lleno` (muestra la etiqueta "Lleno") o `borrador` (no se publica).
- `chapters[].theme`: color del bloque. Puede ser `mist` (mañana), `paper`, `sage` (tarde), `dusk` (atardecer) o `night` (noche).
- `chapters[].compact`: bloque corto, sin fotos.
- `tags[].tbd: true`: etiqueta punteada para lo que está "por confirmar".
- Los viajes pasan solos a "Viajes anteriores" después de su fecha. Esa separación ocurre en el build: vuelve a publicar después del viaje.

## Specs (SDD)

Las funcionalidades nuevas se especifican antes de programarse en `specs/`: requisitos → diseño → plan de tareas → código. Ver [`specs/README.md`](specs/README.md).

## Publicar gratis

### Hoy · GitHub Pages

Cada push a `main` corre `.github/workflows/pages.yml`: revisa tipos, construye con la ruta base del repo y publica. Los PR solo corren `ci.yml` (check + build).

Las rutas internas usan `url()` de `src/lib/url.ts` para respetar la subcarpeta (`/bebe-vive-viaja/`). Para probar igual que en Pages:

```bash
SITE_URL=https://andreymartinez.github.io BASE_PATH=/bebe-vive-viaja npm run build && npm run preview
```

### Opción A · Cloudflare (recomendada a futuro)

El plan gratis permite **uso comercial**, no cobra por ancho de banda y después puedes sumar base de datos (D1), almacenamiento (R2) y funciones sin cambiar de proveedor.

1. Sube el repo a GitHub.
2. En el panel de Cloudflare, ve a **Workers & Pages → Create → Import a repository** y elige el repo.
3. Build command: `npm run build`. Output: `dist`. Variable `SITE_URL`: tu dominio.
4. Cada push a `main` publica una versión nueva, y cada PR tiene su URL de prueba.

Desde la terminal también funciona: `npm run build && npx wrangler deploy` (usa `wrangler.jsonc`).

### Nota sobre GitHub Pages

GitHub no recomienda Pages para sitios de negocio y en el plan gratis el repo tiene que ser público. Sirve para arrancar; cuando haya dominio y reservas, conviene pasar a Cloudflare (solo cambia el hosting, el código es el mismo).

> Evita el plan Hobby de Vercel para este proyecto: sus términos lo limitan a uso personal y no comercial.

### Dominio propio

Cloudflare: **tu proyecto → Custom domains → Set up a domain**. Si el dominio ya está en Cloudflare, se configura solo. Si no, te da los registros DNS que debes crear.

## Pendientes

- [ ] `src/config/site.ts`: número de WhatsApp e Instagram. El botón "Apartar mi lugar" aparece en cuanto hay número.
- [ ] Confirmar el eslogan de la portada (`tagline`).
- [ ] Tepoztlán: puntos de abordaje, nombre del Skydive y terraza.
- [ ] Dominio final en `SITE_URL` (el `robots.txt` se genera solo).
- [ ] Fotos originales en alta resolución para `src/assets/nosotros/`.
