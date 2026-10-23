# Requisitos · Audioguías por lugar

## Introducción

En la tarde libre de cada viaje la gente recorre el pueblo a su ritmo con la guía digital. Queremos que cada lugar de "Qué ver" (y la leyenda principal del capítulo) tenga una audioguía: una narración corta, con historia, datos curiosos y tono de suspenso, que se escuche con audífonos mientras se camina.

Debe funcionar para Tepoztlán y para cualquier viaje futuro con solo escribir el guion en el JSON del viaje, sin pagar servicios de voz.

**Decisión:** el guion vive en el JSON. Un script local (`npm run audioguias`) lo convierte en MP3 con la voz de macOS en español de México y una atmósfera sonora tenue. Si un viaje aún no tiene MP3 generado, el navegador lee el guion con su propia voz (Web Speech).

**Fuera de alcance:** voces de pago o clonadas, grabaciones de locutor (el formato las admite después reemplazando el MP3), traducción a otros idiomas.

## Requisitos

### Requisito 1 · Guion en el contenido

**Historia de usuario:** Como quien arma un viaje, quiero escribir el guion de cada audioguía junto al lugar, para no tocar código en cada viaje nuevo.

#### Criterios de aceptación

1.1. El esquema de viajes DEBERÁ aceptar un campo opcional `guide` en cada lugar (`places[]`) y en la leyenda (`quote`), con `script` (lista de párrafos).
1.2. SI un lugar no tiene `guide` ENTONCES la página NO DEBERÁ mostrar reproductor para ese lugar.
1.3. En el guion, `…` DEBERÁ interpretarse como pausa corta y cada párrafo nuevo como pausa larga.

### Requisito 2 · Generación de audio

**Historia de usuario:** Como quien arma un viaje, quiero generar los audios con un comando, gratis y sin cuentas.

#### Criterios de aceptación

2.1. CUANDO se corre `npm run audioguias` ENTONCES el sistema DEBERÁ generar un MP3 por guion en `public/audioguias/<viaje>/<id>.mp3`.
2.2. El audio DEBERÁ usar una voz de es-MX, respetar las pausas del guion y llevar de fondo una atmósfera grave y tenue con entrada y salida suaves.
2.3. SI el guion no cambió desde la última generación ENTONCES el script NO DEBERÁ regenerar ese audio.
2.4. SI falta `say` o `ffmpeg` ENTONCES el script DEBERÁ terminar con un mensaje claro.

### Requisito 3 · Reproductor en la página

**Historia de usuario:** Como viajero, quiero darle play a la historia del lugar donde estoy y seguir caminando.

#### Criterios de aceptación

3.1. Cada lugar con guía DEBERÁ mostrar un botón "Escuchar" con duración, barra de avance y la opción "Leer la narración" con el texto completo.
3.2. CUANDO empieza una audioguía ENTONCES cualquier otra que esté sonando DEBERÁ pausarse.
3.3. SI existe el MP3 ENTONCES el reproductor DEBERÁ usarlo sin descargarlo antes de darle play, y mostrar título y viaje en la pantalla de bloqueo (Media Session).
3.4. SI no existe el MP3 ENTONCES la página NO DEBERÁ mostrar esa audioguía (la voz del navegador suena robótica; decisión del 22 oct 2026). El reproductor conserva el respaldo con voz del navegador por si se reactiva.
3.5. SI el navegador no tiene audio ni voz ENTONCES el reproductor DEBERÁ quedar solo con el texto.
3.6. El reproductor DEBERÁ respetar el sistema visual (mono para etiquetas, filetes finos) y ser usable con teclado y lector de pantalla.

### Requisito 4 · Contenido de Tepoztlán

#### Criterios de aceptación

4.1. Los seis lugares de Tepoztlán y la leyenda de Tepoztécatl DEBERÁN tener guion de 1.5 a 3 minutos, con datos verificables y las leyendas presentadas como leyendas.
