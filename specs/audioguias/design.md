# Diseño · Audioguías por lugar

## Datos

En `src/content.config.ts`:

```ts
const guide = z.object({ script: z.array(z.string()).min(1) });
// places[].guide y quote.guide: guide.optional()
```

Archivo de audio: `public/audioguias/<slug-del-viaje>/<id>.mp3`, donde `id` es `<capítulo>-leyenda` para la leyenda (`pueblo-leyenda`) y el `slug` del título para los lugares (`piramide-del-tepozteco`). `src/lib/audioguia.ts` expone `guideId()` y `guideAudio()`; esta última revisa en build si el MP3 existe y devuelve su URL (con `url()`) o `undefined`.

`public/audioguias/manifest.json` guarda por archivo el hash del guion y la duración en segundos. La página lee la duración de ahí para mostrarla antes del play; si no hay MP3 se estima a 150 palabras por minuto.

## Generación (`scripts/audioguias.mjs`)

1. Recorre `src/content/viajes/*/index.json`, junta cada `guide` con su id.
2. Convierte el guion a texto para `say`: `…` → `[[slnc 650]]`, entre párrafos `[[slnc 1300]]`.
3. `say -v Paulina -r 158 -o voz.aiff`.
4. `ffmpeg` mezcla la voz (con 2.5 s de entrada) con una atmósfera hecha en el momento: dos senoidales graves (55 y 110 Hz) con trémolo lento + ruido café filtrado, a −30 dB aprox., fade in 2 s y fade out 4 s. Salida MP3 mono 64 kbps (≈0.5 MB por minuto).
5. Escribe la duración (`ffprobe`) y el hash en el manifest. Salta los que no cambiaron (`--force` para regenerar).

Variables: `VOZ` para usar otra voz instalada.

## Motor Gemini (agregado el 22 oct 2026)

- `VOZ_MOTOR=gemini` (por defecto si hay `GEMINI_API_KEY` en `.env`; si no, `macos`). Modelo `gemini-3.8-flash-tts` (cambiable con `GEMINI_TTS_MODEL`) vía la Interactions API (`POST /v1beta/interactions`).
- Por guía: `guide.voice` (una de las 30 voces prediseñadas) y `guide.style` (dirección de actuación, va en `annotations[].style`). Siempre se agrega "español de México, con acento mexicano natural".
- Entre párrafos se manda `<long pause>`; el `…` se deja tal cual.
- La voz se normaliza a −18 LUFS antes de mezclar, para que todas suenen parejo con cualquier motor.
- Muestras: `npm run audioguias -- --muestra <id> --voces A,B,C` → `muestras-audioguias/` (ignorada, no se publica).
- La clave solo vive en `.env` local; el sitio publicado sirve los MP3 y nunca la necesita.

## Reproductor (`src/components/islands/AudioGuide.tsx`)

Isla React `client:idle` (con `client:visible` un toque justo después de hacer scroll se perdía antes de hidratar). Props: `id`, `title`, `trip`, `script`, `src?`, `duration`.

- Con `src`: `<audio preload="none">` creado al primer play. Barra con `timeupdate`, clic en barra para adelantar. Media Session con título, artista = nombre del viaje y acciones play/pause/seek.
- Sin `src`: `speechSynthesis` habla el guion partido en frases; las pausas se hacen con `setTimeout` entre frases. Voz preferida `es-MX`, luego cualquier `es-*`. La barra avanza por frases.
- Exclusión: al empezar, despacha `window` event `bvv-audioguia` con su id; las demás instancias se pausan al recibirlo.
- Texto: `<details>` "Leer la narración" con los párrafos. En las tarjetas de lugar (`transcript={false}`) la narración va dentro del único "Leer más" de la tarjeta.
- Diseño "onda de sonido" (elegido el 22 oct 2026 entre 4 propuestas): botón sólido de 40 px (ícono con `--ag-bg`, el fondo del capítulo) y 48 barras con la forma de onda real del MP3 (`peaks` en el manifest, calculadas por el script; `--ondas` las recalcula sin API). Las barras ya escuchadas se llenan, la actual pulsa y un clic en la onda adelanta.
- Botón con `aria-pressed`, `aria-label` con el título; barra `role="slider"` con `aria-valuenow`.

## Página

`Chapter.astro` monta `<AudioGuide>` bajo el texto del lugar y bajo la leyenda (`quote`). Los estilos van en `Chapter.astro` con `:global` para que hereden `currentColor` del tema del capítulo.

## Pruebas

- `npm run check`, `npm run build`.
- En la vista previa: play/pausa, exclusión entre dos guías, barra, fallback quitando el MP3, y layout a 375 px.
