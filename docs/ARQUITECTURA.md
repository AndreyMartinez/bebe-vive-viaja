# Arquitectura y plan de crecimiento

Objetivo: arrancar en **$0 al mes** y crecer a una app con reservas, cuentas y pagos **sin reescribir**. Cada fase agrega piezas, ninguna tira las anteriores.

## Decisiones

| Decisión | Por qué |
| --- | --- |
| **Astro** | Manda HTML estático por defecto (rápido, buen SEO) y solo envía JS donde hay islas. Cuando haga falta, una página puede pasar a renderizarse en servidor sin migrar el resto. |
| **Islas de React** | Se reutilizan cuando llegue el panel o una app móvil (React Native o PWA). |
| **Contenido en JSON + zod** | Sin base de datos ni CMS en la fase 1. El esquema es el contrato: el día que exista una API, devuelve la misma forma. |
| **Cloudflare** | El plan gratis permite uso comercial, no cobra ancho de banda y tiene base de datos (D1), archivos (R2), colas y cron en la misma cuenta. |
| **Fotos en el repo** | Astro las optimiza a WebP en varios tamaños durante el build. Cuando pesen demasiado, pasan a R2. |

## Fases

### Fase 1 · Catálogo (hoy)

- Portada, lista de viajes y una página de itinerario por viaje.
- Contacto y apartado por WhatsApp (`wa.me` con mensaje prellenado).
- Publicación: push a `main` → Cloudflare compila y publica.
- **Costo: $0** (más el dominio, si compras uno).

### Fase 2 · Registro de viajeros

- Formulario para apartar lugar: nombre, teléfono, punto de abordaje y número de personas.
- Agregar el adaptador `@astrojs/cloudflare`. Las páginas siguen siendo estáticas y solo las rutas `/api/*` corren como funciones.
- **D1** (SQLite) con tablas `viajes`, `reservas` y `viajeros`.
- Avisos por correo con Resend (tiene plan gratis) o por WhatsApp.
- Protección contra spam con Cloudflare Turnstile (gratis).
- **Costo: $0** dentro de los límites gratuitos de Cloudflare.

### Fase 3 · Panel de administración

- Ruta `/admin` protegida con Cloudflare Access (gratis para equipos pequeños) o con auth propia (Better Auth o Lucia sobre D1).
- CRUD de viajes. El JSON pasa a tablas, pero el esquema zod sigue validando.
- Lista de viajeros por viaje, exportable a CSV y con check-in el día del viaje.
- Fotos subidas a **R2**.

### Fase 4 · Pagos y cuentas

- Anticipo o pago total con **Mercado Pago** o **Stripe**. No cobran mensualidad, solo comisión por venta.
- Webhooks → Worker → actualiza `reservas.estado`.
- Cuenta del viajero: mis viajes, comprobantes y checklist sincronizado (hoy vive en `localStorage`).
- Facturación CFDI con un PAC cuando haga falta.

### Fase 5 · App

- PWA instalable (manifest + service worker) con itinerario offline el día del viaje.
- Si se necesita app nativa: React Native o Expo consumiendo la misma API.
- Si la carga crece: API en Go detrás de Cloudflare, con Postgres (Neon o Supabase) cuando SQLite se quede corto.

## Cuándo empieza a costar

| Señal | Siguiente paso | Costo aproximado |
| --- | --- | --- |
| Más tráfico o funciones del que cubre el plan gratis | Workers Paid | Plan pagado de entrada |
| Muchas fotos (GB) | R2 | Bajo, se paga por GB guardado |
| Varios admins con permisos finos | Auth propia | $0, es código |
| Pagos | Pasarela | Comisión por transacción |

Antes de decidir, revisa los precios vigentes en el sitio de cada proveedor: cambian seguido.

## Contrato de datos (fase 1 → API)

El tipo `Viaje` sale de `src/content.config.ts`. Cuando exista base de datos, la API `GET /api/viajes/:slug` debe devolver la misma forma. Así los componentes no cambian, solo cambia de dónde salen los datos (`getCollection` → `fetch`).
