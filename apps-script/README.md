# Registro de viajeros · Apps Script

Dos proyectos de Google Apps Script que conectan el sitio con Google Sheets y Drive. Spec: `specs/registro-viajeros/`.

| Carpeta | Proyecto | Qué hace | Acceso |
|---|---|---|---|
| `api/` | **bvv-api** | La usa la página `/bienvenida/?viaje=…`: lee viaje y paradas, guarda registros y comprobantes | Cualquiera |
| `admin/` | **bvv-admin** | Página para la organizadora: crear viajes, cerrar/reabrir, compartir la liga | Solo yo |

Todo se hace **con la cuenta de Google de la marca**: ella es dueña de las hojas, de la carpeta y de los scripts.

## Instalación (una sola vez)

### 1. Crear los archivos en Drive

1. Una hoja de cálculo nueva llamada **BVV · Respuestas** (la pestaña `Viajes` se crea sola).
2. Una hoja de cálculo nueva llamada **BVV · Paradas**.
3. Una carpeta llamada **BVV · Comprobantes**. No la compartas: los comprobantes deben ser privados.

De cada una copia su **ID**, que es la parte de la URL entre `/d/` (o `/folders/`) y la siguiente `/`:

```
https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
https://drive.google.com/drive/folders/ESTE_ES_EL_ID
```

### 2. Proyecto bvv-api

1. Entra a [script.google.com](https://script.google.com) → **Nuevo proyecto** → nómbralo `bvv-api`.
2. **Configuración del proyecto** (engrane) → marca **Mostrar el archivo de manifiesto "appsscript.json"**.
3. Pega el contenido de los archivos de `api/`, uno por uno:
   - `appsscript.json` sobre el que ya existe.
   - `Code.gs` sobre el que ya existe.
   - **+ → Secuencia de comandos** llamada `Comun` y pega `Comun.gs`.
4. Configura los IDs con **una** de estas dos opciones:
   - **+ → Secuencia de comandos** llamada `Config` y pega `Config.example.gs` con los IDs llenos. Si ya existe `api/Config.gs` en tu copia local, pega ese.
   - O en **Configuración del proyecto → Propiedades del script** agrega `RESPUESTAS_ID`, `PARADAS_ID` y `CARPETA_COMPROBANTES_ID`.
5. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
6. Google pedirá permisos (Hojas de cálculo y Drive). Acéptalos con la cuenta de la marca. Si dice "Google no verificó esta app", entra a **Configuración avanzada → Ir a bvv-api**. Es tu propio script.
7. Copia la **URL de la aplicación web** (termina en `/exec`).

### 3. Conectar el sitio

En `src/config/site.ts` pega esa URL:

```ts
registroApi: 'https://script.google.com/macros/s/…/exec',
```

Haz push a `main`. GitHub Pages publica solo.

### 4. Proyecto bvv-admin

1. **Nuevo proyecto** → `bvv-admin`. Muestra el manifiesto igual que antes.
2. Pega los archivos de `admin/`:
   - `appsscript.json`
   - `Code.gs`
   - `Comun.gs` (como secuencia de comandos `Comun`)
   - **+ → HTML** llamado `Index` con `Index.html`
3. Los mismos IDs que en bvv-api (archivo `Config` o propiedades del script), más:
   - `SITE_URL` = `https://andreymartinez.github.io/bebe-vive-viaja` (o el dominio final, sin `/` al final)
4. **Implementar → Nueva implementación → Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Solo yo**
5. Abre la URL `/exec` y guárdala en favoritos: esa es la página admin. Si alguien más la abre, Google le pide iniciar sesión y lo rechaza.

## Uso

1. En el admin escribe el nombre del viaje y toca **Crear viaje**. Se crean la pestaña en Paradas, la pestaña en Respuestas y la subcarpeta de comprobantes.
2. Abre **Paradas ↗** y llena una fila por parada: nombre, dirección completa y link de Google Maps (opcional). El mapa de la página se ubica por la **dirección**, así que escríbela completa.
3. Toca **Agregar guía** y pega el link del instructivo y guía turística del viaje (por ejemplo, un PDF en Drive compartido como "Cualquier persona con el enlace"). El viajero lo descarga con un botón grande al terminar su registro.
4. Toca **Compartir liga** y mándala por WhatsApp a quien pagó su apartado.
5. Cada registro llega como una fila a **Respuestas ↗**. Revisa el comprobante (enlace a Drive) y marca la casilla **Comprobante validado**.
6. Cuando ya no quieras registros, toca **Cerrar registro**.

## Cambios al código

Si cambias un `.gs` o el `Index.html`:

1. Pega la nueva versión en el editor de Apps Script.
2. Ve a **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**.

La URL `/exec` no cambia. Guardar el código sin hacer este paso **no** publica nada.

`Comun.gs` debe ser idéntico en los dos proyectos.

## Límites (cuenta gratuita)

- Unas 20,000 llamadas por día y 6 minutos por ejecución: sobra para este volumen.
- Cada registro tarda entre 1 y 3 segundos en guardarse.
- Comprobantes de hasta 10 MB. Las fotos grandes se reducen en el celular antes de enviarse.
