# Plan de implementación · Audioguías por lugar

- [x] 1. Esquema y utilidades
  - `guide` opcional en `places[]` y `quote` (`src/content.config.ts`); `src/lib/audioguia.ts` con `guideId`, `guideAudio`, duración
  - _Requisitos: 1.1, 1.2_

- [x] 2. Script de generación
  - `scripts/audioguias.mjs` + `npm run audioguias`; pausas, voz es-MX, atmósfera, manifest con hash y duración
  - _Requisitos: 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 3. Isla `AudioGuide.tsx`
  - MP3 con Media Session; fallback Web Speech; exclusión entre guías; texto en `<details>`
  - _Requisitos: 3.1 – 3.5_

- [x] 4. Montaje y estilos en `Chapter.astro`
  - _Requisitos: 1.2, 3.1, 3.6_

- [x] 5. Guiones de Tepoztlán y audios generados
  - 6 lugares + leyenda de Tepoztécatl
  - _Requisitos: 4.1_

- [x] 6. Verificar
  - `npm run check`, `npm run build`, vista previa en computadora y 375 px; actualizar `specs/README.md` y `CLAUDE.md`
  - _Requisitos: todos_
