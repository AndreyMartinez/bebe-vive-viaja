# Plan de implementación · Registro de viajeros con Google Sheets

Mockup aprobado: https://claude.ai/artifact/NwftuUbeVrHZ2Y4GCCuPjL

- [x] 1. Políticas como componente reutilizable
  - `src/components/PoliticasCancelacion.astro` con pill, tarjetas, nota y botón PDF (estilos de pantalla)
  - `politicas-de-cancelacion.astro` lo usa; su impresión y el PDF no cambian
  - Verificar: la página se ve igual y la vista de impresión es la misma hoja
  - _Requisitos: 4.1, 6.6_

- [x] 2. Contrato y cliente de la API
  - `src/lib/registro.ts`: tipos, `fetchViaje`, `enviarRegistro` (POST `text/plain`)
  - `src/lib/registro-mock.ts`: viajes de prueba (abierto, cerrado, sin paradas) para dev sin Google
  - `src/config/site.ts`: `registroApi`
  - _Requisitos: 2.3, 4.6, 6.5_

- [x] 3. Isla `Registro.tsx`
  - [x] 3.1 Lectura de `?viaje=`, estados de carga (sin viaje, cerrado, sin paradas, error con reintentar) y nombre del viaje en la portada
    - _Requisitos: 4.1, 6.1, 6.2, 6.3_
  - [x] 3.2 Paso 01: paradas, mapa embebido por dirección y "Abrir en Google Maps"
    - _Requisitos: 4.2, 4.3, 6.4_
  - [x] 3.3 Paso 02: personas dinámicas y teléfono; paso 03: comprobante (tipo, 10 MB, reducción de fotos > 2 MB)
    - _Requisitos: 4.4, 4.5_
  - [x] 3.4 Resumen "Tu registro" (columna derecha en escritorio), Guardar sin doble envío, error conservando datos, confirmación con folio
    - _Requisitos: 4.8, 4.9, 4.10_

- [x] 4. Página `/bienvenida/`
  - `src/pages/bienvenida.astro`: portada, isla, políticas; `noindex`; fuera del sitemap
  - _Requisitos: 4.1, 2.2_

- [x] 5. API en Apps Script (`apps-script/api/`)
  - `appsscript.json`, `Code.gs`: `doGet` (viaje público sin URLs internas), `doPost` (validación, trampa anti-bots, lock, archivo privado en Drive, fila con casilla, limpieza si falla)
  - _Requisitos: 2.3, 4.6, 4.7, 5.1, 5.2, 6.2, 6.5_

- [x] 6. Admin en Apps Script (`apps-script/admin/`)
  - `Code.gs`: `estado` (hojas + viajes con conteos y liga), `crearViaje` (pestañas + carpeta, sin sobrescribir), `cambiarEstado`
  - `Index.html`: alta con referencia automática, lista con conteos, cerrar/reabrir, Compartir liga (share → copiar → WhatsApp)
  - _Requisitos: 1.1–1.9, 2.1, 3.1–3.4_

- [x] 7. Instalación
  - `apps-script/README.md`: crear hojas y carpeta, propiedades del script, implementar con el acceso correcto, pegar la URL en `site.ts`
  - _Requisitos: todos_

- [x] 8. Conectar y verificar
  - `npm run check`, `npm run build`; en el navegador con datos de prueba: estados, mapa, personas, validaciones, doble envío, 375 px y escritorio
  - _Requisitos: todos_

- [x] 9. Instructivo y guía turística en la confirmación
  - Columna "Guía" en la pestaña `Viajes`; admin: campo al crear y botón "Agregar/Cambiar guía" (`cambiarGuia`); API devuelve `guia`
  - `Registro.tsx`: botón grande en "¡Listo!" con `linkDescarga` (Drive → descarga directa)
  - _Requisitos: 7.1–7.4_
