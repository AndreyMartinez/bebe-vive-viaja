---
name: paleta-marca
description: Paleta de colores y reglas visuales de la marca Bebe, Vive, Viaja (logo, tokens CSS, combinaciones con contraste verificado, tipografías y emojis de marca). Úsala antes de diseñar o cambiar cualquier pieza visual del sitio o material para viajeros (páginas, PDFs, banners, historias de Instagram, correos) y cuando pregunten qué colores, tipografías o estilo usa la marca.
---

# Paleta de marca · Bebe, Vive, Viaja

Los tokens viven en `src/styles/global.css` (`:root`). **Usa siempre `var(--token)`, nunca el hex suelto**; si hace falta un color nuevo, agrégalo ahí y a esta tabla.

## 1. Núcleo de la marca (el logo)

El logo (mandala + firma a pincel) es **monocromo**: blanco sobre negro o negro sobre claro. Nunca se colorea, se estira ni se le pone sombra.

| Token | Hex | Uso |
| ----- | --- | --- |
| `--black` | `#000000` | Fondo de portadas de marca, banda de avisos, logo sobre claro |
| `--white` | `#ffffff` | Logo sobre negro, tarjetas sobre fondos suaves |
| `--sand` | `#f6f1e8` | Fondo cálido de piezas para viajeros (políticas, avisos, PDFs) |
| `--sand-line` | `#e4dccd` | Filetes y separadores sobre `--sand` |

Archivos: `src/assets/brand/mandala.png` (mandala + firma) y `src/assets/brand/wordmark.png` (solo firma), PNG negros con fondo transparente. Se pintan con la clase `.logo` y `style={`--src:url(${img.src})`}`, y el color sale de `color:` (así sirve igual en blanco o negro).

## 2. Acentos (los emojis de la marca ✈️ 🐵 🌿 🍷)

| Token | Hex | Viene de | Significado |
| ----- | --- | -------- | ----------- |
| `--wine` | `#8c1c2b` | 🍷 | Restricción, "no aplica", lo que pierde el cliente |
| `--wine-bright` | `#c0394b` | 🍷 | Solo subrayados/detalles sobre negro (no para texto) |
| `--wine-soft` | `#f7e9ea` | 🍷 | Fondo de tarjeta "vino" |
| `--wine-line` | `#e9c9cd` | 🍷 | Borde de tarjeta "vino" |
| `--leaf` | `#33772d` | 🌿 | Garantía, confirmación, lo que recibe el cliente |
| `--leaf-soft` | `#ebf4e6` | 🌿 | Fondo de tarjeta "hoja" |
| `--leaf-line` | `#cfe4c6` | 🌿 | Borde de tarjeta "hoja" |

Regla: **vino = negativo / hoja = positivo**. No los uses como decoración neutra ni los mezcles en el mismo bloque.

## 3. Paleta editorial del sitio (catálogo e itinerarios)

Capítulos por hora del día con el color del cielo. Se aplican como temas `mist`, `paper`, `sage`, `dusk`, `night`.

| Token | Hex | Uso |
| ----- | --- | --- |
| `--ink` | `#121417` | Texto principal, botones sólidos |
| `--ink-2` | `#5b6168` | Texto secundario |
| `--hair` | `rgba(18,20,23,.14)` | Filetes finos |
| `--paper` | `#f6f5f2` | Fondo general del sitio |
| `--mist` / `--mist-ink` | `#dce5ec` / `#24425c` | Capítulo mañana |
| `--sage` / `--sage-ink` | `#e2e7dc` / `#2f4a35` | Capítulo naturaleza |
| `--dusk-a` · `--dusk-b` · `--dusk-c` | `#e9b48e` · `#c9707a` · `#5e3a63` | Degradado de atardecer |
| `--night` | `#0f1226` | Capítulo noche |
| `--gold` | `#c9a46a` | Acento sobre oscuro (énfasis en titulares) |

`--sand` es para material de marca; `--paper` para el sitio editorial. No los mezcles en una misma página.

## 4. Combinaciones con contraste verificado (WCAG)

| Texto / fondo | Ratio | Apto para |
| ------------- | ----- | --------- |
| `--white` / `--black` | 21 | Todo |
| `--ink` / `--sand` | 16.4 | Todo |
| `--wine` / `--white` | 9.1 | Todo |
| `--wine` / `--wine-soft` | 7.7 | Todo |
| `--gold` / `--black` | 9.0 | Todo |
| `--ink-2` / `--sand` | 5.6 | Texto normal |
| `--leaf` / `--white` | 5.5 | Texto normal |
| `--leaf` / `--leaf-soft` | 4.9 | Texto normal |
| `--wine-bright` / `--black` | 3.9 | Solo detalles gráficos o texto ≥ 24px |

Si combinas algo fuera de esta tabla, mide el contraste (mínimo 4.5:1 en texto normal, 3:1 en texto grande).

## 5. Tipografía

- `--brush` (Kaushan Script): eco de la firma del logo. Solo para palabras sueltas de énfasis o títulos cortos ("Cancelación", "por persona"), nunca para párrafos.
- `--serif` (Instrument Serif): titulares editoriales del sitio.
- `--sans` (Geist): texto.
- `--mono` (Geist Mono): etiquetas, datos, `.label`.

Las fuentes se cargan desde Google Fonts en el `<head>` de cada página (`Kaushan+Script` solo donde se use `--brush`).

## 6. Emojis de marca

✈️ 🐵 🌿 🍷 en ese orden, como en el logo. Se pueden usar como fila decorativa bajo el logo, en el pie o como ícono de sección (🍷 cliente/restricción, 🌿 empresa/garantía, 🐵 notas, ✈️ viaje). Siempre con `aria-hidden="true"`.

## Referencia

`src/pages/politicas-de-cancelacion.astro` es el ejemplo completo de la marca aplicada a una pieza para viajeros: portada negra con mandala, fondo `--sand`, tarjetas vino/hoja y estilos de impresión A4.
