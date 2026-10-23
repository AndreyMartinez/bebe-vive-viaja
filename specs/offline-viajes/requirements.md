# Requisitos · Viaje sin conexión

## Introducción

El día del viaje la señal falla justo donde más se usa la guía: en la carretera, en la subida al Tepozteco y en el centro de Tepoztlán lleno de gente. Queremos que cada viajero pueda **guardar la página de su viaje en el teléfono** antes de salir y abrirla después sin señal, con itinerario, fotos, checklist y audioguías.

Primer uso: Tepoztlán, sábado 24 de octubre de 2026. Debe funcionar igual para cualquier viaje futuro sin tocar código.

**Decisión:** un service worker propio (sin dependencias nuevas) en `public/`, con alcance limitado al sitio (`BASE_PATH`). La descarga **no es automática**: el viajero la pide con un botón, porque las audioguías pesan varios MB y no queremos gastar datos sin permiso.

**Fuera de alcance:**
- Mapas sin conexión (los enlaces a Google Maps se abren en la app de mapas, que tiene sus propios mapas sin conexión).
- Registro de viajeros sin conexión (`/bienvenida/` depende de la API en línea).
- Notificaciones push y sincronización en segundo plano.
- Guardar varios viajes a la vez con un solo botón (cada viaje se guarda desde su propia página).

## Requisitos

### Requisito 1 · Guardar el viaje

**Historia de usuario:** Como viajero, quiero guardar la página de mi viaje en el teléfono con un botón, para consultarla cuando no tenga señal.

#### Criterios de aceptación

1.1. La página de cada viaje (`/viajes/<slug>/`) DEBERÁ mostrar un control "Guardar para usar sin señal" junto con el tamaño aproximado de la descarga (p. ej. "≈ 7 MB").
1.2. CUANDO el viajero toca el control ENTONCES el sistema DEBERÁ descargar y guardar todo lo necesario para mostrar esa página sin red: el HTML, los estilos y scripts (incluidas las islas Countdown, Checklist y AudioGuide), las fotos en el tamaño que usa la página, las fuentes tipográficas, el favicon y los MP3 de las audioguías del viaje.
1.3. MIENTRAS se descarga ENTONCES el control DEBERÁ mostrar el avance (archivos o porcentaje) y no DEBERÁ poder iniciarse una segunda descarga en paralelo.
1.4. CUANDO termina la descarga ENTONCES el control DEBERÁ cambiar a "Disponible sin conexión ✓" con la fecha de guardado.
1.5. SI la página ya estaba guardada cuando el viajero vuelve a abrirla ENTONCES el control DEBERÁ mostrar el estado guardado sin volver a descargar.
1.6. SI falla la descarga de algún archivo ENTONCES el sistema DEBERÁ reintentarlo una vez y, si vuelve a fallar, mostrar "No se pudo guardar todo, intenta con wifi" con opción de reintentar, sin marcar la página como disponible sin conexión.
1.7. SI el navegador no soporta service workers o almacenamiento en caché ENTONCES el control NO DEBERÁ mostrarse.
1.8. El sistema NO DEBERÁ descargar los MP3 ni el resto del paquete sin que el viajero lo pida (se mantiene el criterio 3.3 de audioguías: sin precarga automática).

### Requisito 2 · Usar el viaje sin señal

**Historia de usuario:** Como viajero, quiero abrir la guía en plena subida al Tepozteco sin señal y que funcione igual.

#### Criterios de aceptación

2.1. SI la página está guardada Y no hay red ENTONCES al abrir su URL (desde el navegador, el historial o la pantalla de inicio) el sistema DEBERÁ mostrar la página completa: textos, fotos, cuenta regresiva, checklist y audioguías.
2.2. Las audioguías guardadas DEBERÁN reproducirse sin red, incluyendo adelantar y regresar en la barra de avance.
2.3. El checklist DEBERÁ seguir marcándose sin red y conservar lo marcado (ya usa `localStorage`).
2.4. El visor de fotos (`[data-full]`) DEBERÁ funcionar sin red al menos con la foto en el tamaño guardado.
2.5. SI no hay red Y el viajero abre una página que no guardó ENTONCES el sistema DEBERÁ mostrar una página sencilla "Sin conexión" con el estilo del sitio y un enlace a los viajes que sí tiene guardados.

### Requisito 3 · Avisar qué no funciona sin red

**Historia de usuario:** Como viajero, quiero saber qué partes necesitan internet, para no frustrarme en el camino.

#### Criterios de aceptación

3.1. CUANDO el dispositivo está sin conexión ENTONCES la página del viaje DEBERÁ mostrar un aviso discreto "Sin conexión · usando la copia guardada".
3.2. El aviso o el texto junto al control de guardado DEBERÁ indicar que los mapas, WhatsApp y el registro necesitan señal.
3.3. CUANDO vuelve la conexión ENTONCES el aviso DEBERÁ desaparecer sin recargar la página.

### Requisito 4 · Mantener la copia al día

**Historia de usuario:** Como agencia, quiero que si cambio un dato del viaje (p. ej. el punto de abordaje) los viajeros que ya guardaron la página reciban el cambio.

#### Criterios de aceptación

4.1. SI la página está guardada Y hay red ENTONCES el sistema DEBERÁ mostrar la copia guardada de inmediato y actualizarla en segundo plano con la versión publicada.
4.2. CUANDO se publica una nueva versión del sitio ENTONCES las copias guardadas DEBERÁN actualizarse la siguiente vez que el viajero abra la página con red, sin que tenga que volver a tocar el botón.
4.3. Las páginas del sitio que no se guardaron DEBERÁN seguir cargándose desde la red como hoy (el service worker no debe servir versiones viejas de páginas que el viajero no pidió guardar).
4.4. El control DEBERÁ ofrecer "Quitar del teléfono" para borrar la copia guardada de ese viaje.

### Requisito 5 · Agregar a la pantalla de inicio

**Historia de usuario:** Como viajero, quiero un ícono de la guía en mi pantalla de inicio, para abrirla rápido sin buscar la liga en WhatsApp.

#### Criterios de aceptación

5.1. El sitio DEBERÁ publicar un `manifest.webmanifest` con nombre, colores del sistema visual e íconos, de modo que Android y iPhone permitan "Agregar a pantalla de inicio".
5.2. CUANDO el viaje queda guardado ENTONCES el control DEBERÁ sugerir agregarlo a la pantalla de inicio, con la instrucción adecuada para iPhone (Compartir → Agregar a inicio) y Android.
5.3. SI el viajero abre el ícono sin red ENTONCES DEBERÁ abrirse la página del viaje guardado (no la portada).

### Requisito 6 · Restricciones técnicas

#### Criterios de aceptación

6.1. El service worker DEBERÁ vivir en `public/`, sin dependencias nuevas de npm, y su alcance DEBERÁ respetar `BASE_PATH` (funcionar en `/bebe-vive-viaja/` en GitHub Pages y en `/` en Cloudflare).
6.2. La lista de archivos por viaje DEBERÁ generarse en el build a partir del contenido (no escribirse a mano), para que un viaje nuevo funcione sin tocar código.
6.3. El control DEBERÁ ser una isla de React cargada con `client:idle` o `client:visible`, respetar el sistema visual (mono para etiquetas, filetes finos) y ser usable con teclado y lector de pantalla.
6.4. El service worker NO DEBERÁ interceptar peticiones a la API de registro ni a dominios externos distintos de Google Fonts.
6.5. `npm run check` y `npm run build` DEBERÁN pasar.

### Requisito 7 · Contenido de Tepoztlán

#### Criterios de aceptación

7.1. La página de Tepoztlán (`/viajes/tepoztlan-2026-10/`) DEBERÁ poder guardarse y usarse sin red en Safari de iPhone y Chrome de Android antes del viernes 23 de octubre de 2026.
