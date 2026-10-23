# Requisitos · Registro de viajeros con Google Sheets

## Introducción

Después de pagar su apartado, cada viajero recibe por WhatsApp la liga de bienvenida (hoy `/politicas-de-cancelacion/`, genérica). Queremos que esa liga sea **de un viaje en particular** y que, además de dar la bienvenida y mostrar las políticas, sirva para que el viajero **elija su punto de abordaje, diga quiénes viajan y suba su comprobante de pago**. Todo debe caer en hojas de cálculo de Google Drive que la organizadora ya sabe usar.

La organizadora administra los viajes desde una página admin: da de alta el viaje, conecta las hojas de cálculo y comparte la liga.

**Decisión:** la "base de datos" son hojas de Google Sheets en el Drive de la organizadora y el puente entre el sitio y Drive es un **Google Apps Script** publicado como aplicación web (gratis, sin servidor propio). El sitio sigue siendo estático en GitHub Pages. Esto adelanta la fase 2 de `CLAUDE.md` con Sheets en lugar de Cloudflare D1; si más adelante crece, se migra.

**Decisiones tomadas (22 oct 2026):**
- Admin protegido con la cuenta de Google de la organizadora (vive en Apps Script, acceso "solo yo"). Nadie más lo puede abrir.
- Un solo par de hojas para todos los viajes, una pestaña por viaje. Las URLs se configuran una vez en el script; el formulario admin no las pide por viaje.
- Un registro = una fila por grupo, con todos los nombres del apartado.
- Al viajero solo se le piden nombres, teléfono, parada y comprobante.
- Las hojas, la carpeta de comprobantes y el script son de la cuenta de Google de la marca.

**Vocabulario:**
- **Hoja de paradas:** archivo de Sheets con una pestaña por viaje: nombre de parada, dirección y link de Google Maps.
- **Hoja de respuestas:** archivo de Sheets con una pestaña por viaje, una fila por registro de viajero.
- **Referencia del viaje:** identificador corto y único (p. ej. `tepoztlan-2026-10`) que va en la liga.

**Fuera de alcance:** pagos en línea, avisos automáticos por correo/WhatsApp, cuentas o contraseñas para viajeros, que el viajero consulte después si su pago ya se validó, editar un registro ya enviado.

## Requisitos

### Requisito 1 · Alta de viaje en la página admin

**Historia de usuario:** Como organizadora, quiero dar de alta un viaje con sus hojas de cálculo, para empezar a recibir registros sin tocar código.

#### Criterios de aceptación

1.1. La página admin DEBERÁ pedir: nombre del viaje y referencia del viaje. Las hojas de respuestas y de paradas se configuran una sola vez y la página admin DEBERÁ mostrar sus enlaces.
1.2. CUANDO la organizadora escribe el nombre ENTONCES la página DEBERÁ proponer la referencia a partir del nombre (minúsculas, sin acentos, con guiones), editable.
1.3. SI la referencia ya existe ENTONCES la página DEBERÁ rechazar el alta y decirlo.
1.4. SI las hojas configuradas no existen o el script no tiene acceso ENTONCES la página admin DEBERÁ decirlo y no permitir altas.
1.5. CUANDO se guarda un viaje nuevo ENTONCES el sistema DEBERÁ crear en la hoja de paradas una pestaña con el nombre del viaje y los encabezados **Nombre de parada · Dirección · Link de Google Maps**.
1.6. CUANDO se guarda un viaje nuevo ENTONCES el sistema DEBERÁ crear en la hoja de respuestas una pestaña con el nombre del viaje y sus encabezados (ver 4.6).
1.7. SI ya existe una pestaña con ese nombre ENTONCES el sistema NO DEBERÁ borrarla ni sobrescribirla; DEBERÁ reutilizarla.
1.8. La página admin DEBERÁ listar los viajes dados de alta con su nombre, referencia, enlaces a sus dos hojas y número de registros recibidos.
1.9. La organizadora DEBERÁ poder marcar un viaje como cerrado; SI un viaje está cerrado ENTONCES su liga DEBERÁ dejar de aceptar registros.

### Requisito 2 · Acceso a la página admin

**Historia de usuario:** Como organizadora, quiero que solo yo pueda ver y usar la página admin.

#### Criterios de aceptación

2.1. La página admin DEBERÁ abrirse solo con la cuenta de Google de la organizadora (dueña del script).
2.1.1. SI quien abre la página admin no está autorizado ENTONCES el sistema NO DEBERÁ mostrar viajes, URLs de hojas ni permitir altas.
2.2. La página admin NO DEBERÁ aparecer en el menú, el sitemap ni buscadores (`noindex`).
2.3. Las URLs de las hojas de cálculo NO DEBERÁN aparecer en las páginas públicas ni en las respuestas que recibe el navegador del viajero.

### Requisito 3 · Compartir la liga del viaje

**Historia de usuario:** Como organizadora, quiero compartir la liga de un viaje con un botón, para mandarla por WhatsApp a quien pagó su apartado.

#### Criterios de aceptación

3.1. Cada viaje de la lista admin DEBERÁ tener un botón **Compartir liga**.
3.2. CUANDO se toca el botón en un celular con menú nativo de compartir ENTONCES el sistema DEBERÁ abrir ese menú con la liga y un texto corto de bienvenida.
3.3. SI no hay menú nativo de compartir ENTONCES el sistema DEBERÁ copiar la liga al portapapeles y confirmar "Liga copiada", y ofrecer un enlace para mandarla por WhatsApp.
3.4. La liga DEBERÁ incluir la referencia del viaje y abrir la página de bienvenida de ese viaje.

### Requisito 4 · Registro del viajero (bienvenida → abordaje → datos → comprobante)

**Historia de usuario:** Como viajero, quiero elegir dónde me recogen, decir quiénes viajamos y subir mi comprobante desde la misma liga, para dejar listo mi lugar.

#### Criterios de aceptación

4.1. CUANDO el viajero abre la liga ENTONCES la página DEBERÁ mostrar la bienvenida con el nombre del viaje, el formulario de registro y, abajo, las políticas de cancelación con el botón para descargar el PDF.
4.2. La página DEBERÁ listar las paradas del viaje leídas de su pestaña en la hoja de paradas, con nombre y dirección.
4.3. CUANDO el viajero elige una parada ENTONCES la página DEBERÁ mostrar su ubicación en un mapa de Google Maps y un enlace para abrirla en la app de Maps.
4.4. El formulario DEBERÁ pedir: nombre completo de cada persona del apartado (al menos una; botón para agregar más), teléfono de contacto (WhatsApp) y comprobante de pago (imagen o PDF).
4.5. SI falta un dato obligatorio, el teléfono no tiene 10 dígitos, o el archivo no es imagen/PDF o pesa más de 10 MB ENTONCES la página NO DEBERÁ enviar y DEBERÁ señalar el campo con el problema.
4.6. CUANDO el viajero toca **Guardar** ENTONCES el sistema DEBERÁ agregar una fila en la pestaña del viaje en la hoja de respuestas con: fecha y hora (hora del centro de México), parada, dirección, nombres de las personas, número de personas, teléfono, enlace al comprobante y **Comprobante validado** (casilla, sin marcar).
4.7. El comprobante DEBERÁ guardarse en una carpeta de Drive del viaje, visible solo para la organizadora.
4.8. CUANDO el registro se guarda ENTONCES la página DEBERÁ mostrar una confirmación con el resumen (parada y personas) y evitar un segundo envío por doble clic.
4.9. SI el envío falla ENTONCES la página DEBERÁ conservar lo capturado, explicar el error y permitir reintentar.
4.10. El formulario DEBERÁ usarse cómodamente en celular (375 px) sin scroll horizontal y respetar el sistema visual del sitio.

### Requisito 7 · Instructivo y guía turística al terminar

**Historia de usuario:** Como viajero, quiero descargar el instructivo y la guía turística en cuanto termino mi registro, para tener a la mano todo lo del viaje.

#### Criterios de aceptación

7.1. El admin DEBERÁ permitir guardar, cambiar o quitar un link al instructivo y guía turística de cada viaje (al crearlo o después).
7.2. CUANDO el registro se guarda Y el viaje tiene link de guía ENTONCES la confirmación DEBERÁ mostrar un botón grande "Descargar instructivo y guía turística".
7.3. SI el link es de un archivo de Google Drive ENTONCES el botón DEBERÁ descargarlo directo.
7.4. SI el viaje no tiene link de guía ENTONCES la confirmación NO DEBERÁ mostrar el botón.

### Requisito 5 · Validación del comprobante

**Historia de usuario:** Como organizadora, quiero marcar en la hoja qué comprobantes ya revisé, para saber quién tiene su lugar confirmado.

#### Criterios de aceptación

5.1. La columna **Comprobante validado** DEBERÁ ser una casilla de verificación que la organizadora marca a mano en la hoja.
5.2. El sistema NO DEBERÁ cambiar el valor de esa casilla después de crear la fila.

### Requisito 6 · Ligas inválidas y casos borde

#### Criterios de aceptación

6.1. SI la liga no trae referencia o la referencia no existe ENTONCES la página DEBERÁ mostrar la bienvenida genérica y las políticas, sin formulario, con un mensaje para pedir la liga correcta.
6.2. SI el viaje está cerrado ENTONCES la página DEBERÁ mostrar la bienvenida y las políticas con el aviso "Registro cerrado".
6.3. SI la pestaña de paradas del viaje está vacía ENTONCES la página DEBERÁ mostrar "Pronto publicaremos los puntos de abordaje" y no permitir enviar.
6.4. SI una parada no tiene link de Google Maps ENTONCES el mapa DEBERÁ ubicarse por su dirección.
6.5. CUANDO la organizadora edita la pestaña de paradas ENTONCES los cambios DEBERÁN verse en la liga sin volver a publicar el sitio.
6.6. La liga genérica actual `/politicas-de-cancelacion/` DEBERÁ seguir funcionando.
