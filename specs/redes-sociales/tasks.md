# Plan de implementación · Redes sociales en el sitio

- [x] 1. Enlaces a redes en el pie
  - `site.ts` con usuarios y `socials`; `Footer.astro` los lista
  - _Requisitos: 1.1, 1.2, 1.3_

- [x] 2. Configuración de embeds
  - Agregar `instagramFeedId` a `src/config/site.ts`
  - _Requisitos: 2.4, 2.5_

- [x] 3. Componente `Siguenos.astro` con respaldo estático
  - [x] 3.1 Encabezado y grid de 3 columnas con etiqueta, "Abrir ↗" y estilo del sistema visual
    - _Requisitos: 2.1, 2.2, 3.3_
  - [x] 3.2 Huecos de embed: blockquote de TikTok, iframe de Facebook sin `src`, widget o tarjeta de Instagram
    - _Requisitos: 2.3, 2.4, 2.5, 2.6_

- [x] 4. Carga diferida de embeds
  - Script con `IntersectionObserver` (margen 400 px) que inserta `embed.js`, asigna el `src` del iframe y carga Behold si aplica; una sola vez
  - _Requisitos: 3.1, 3.2_

- [x] 5. Conectar y verificar
  - Montar `<Siguenos />` en `index.astro`
  - `npm run check`, `npm run build`, revisar red y layout en computadora y 375 px
  - _Requisitos: todos_
