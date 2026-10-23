/**
 * Comun.gs — idéntico en apps-script/api y apps-script/admin (Apps Script no comparte código entre proyectos
 * sin publicar una librería). Si cambias algo aquí, cópialo al otro proyecto.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script) o un archivo Config.gs
 * con `var CONFIG = { … }` (ver Config.example.gs):
 *   RESPUESTAS_ID            ID de la hoja de respuestas (incluye la pestaña "Viajes")
 *   PARADAS_ID               ID de la hoja de paradas
 *   CARPETA_COMPROBANTES_ID  ID de la carpeta de Drive donde van las subcarpetas de comprobantes
 *   SITE_URL                 (solo admin) p. ej. https://andreymartinez.github.io/bebe-vive-viaja
 */

var PESTANA_VIAJES = 'Viajes';
var COLS_VIAJES = ['Referencia', 'Nombre', 'Estado', 'Pestaña', 'Carpeta', 'Creado', 'Guía'];
var COL_GUIA = 7; // 1-based, link al instructivo y guía turística del viaje
var COLS_PARADAS = ['Nombre de parada', 'Dirección', 'Link de Google Maps'];
var COLS_RESPUESTAS = ['Folio', 'Fecha', 'Parada', 'Dirección', 'Personas', 'Núm. personas', 'Teléfono', 'Comprobante', 'Comprobante validado'];
var COL_VALIDADO = 9; // 1-based, "Comprobante validado"

function config_() {
  // Propiedades del script; si falta alguna se toma de CONFIG (Config.gs, opcional y fuera de git).
  var base = typeof CONFIG === 'undefined' ? {} : CONFIG;
  var props = PropertiesService.getScriptProperties().getProperties();
  var p = {};
  Object.keys(base).forEach(function (k) { p[k] = base[k]; });
  Object.keys(props).forEach(function (k) { if (props[k]) p[k] = props[k]; });
  ['RESPUESTAS_ID', 'PARADAS_ID', 'CARPETA_COMPROBANTES_ID'].forEach(function (k) {
    if (!p[k]) throw new Error('Falta la propiedad del script ' + k);
  });
  return p;
}

/** Lee la pestaña "Viajes". Devuelve [{fila, ref, nombre, estado, pestana, carpeta, creado, guia}]. */
function leerViajes_(respuestas) {
  var sh = respuestas.getSheetByName(PESTANA_VIAJES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, COLS_VIAJES.length).getValues()
    .map(function (r, i) {
      return { fila: i + 2, ref: String(r[0]).trim(), nombre: String(r[1]), estado: String(r[2]).trim().toLowerCase() === 'cerrado' ? 'cerrado' : 'abierto', pestana: String(r[3]), carpeta: String(r[4]), creado: r[5], guia: String(r[6] || '').trim() };
    })
    .filter(function (v) { return v.ref; });
}

function buscarViaje_(respuestas, ref) {
  var vs = leerViajes_(respuestas);
  for (var i = 0; i < vs.length; i++) if (vs[i].ref === ref) return vs[i];
  return null;
}

/** Paradas de la pestaña del viaje, en orden; ignora filas sin nombre. */
function leerParadas_(paradasSs, pestana) {
  var sh = paradasSs.getSheetByName(pestana);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 3).getDisplayValues()
    .map(function (r) { return { nombre: r[0].trim(), direccion: r[1].trim(), maps: r[2].trim() }; })
    .filter(function (p) { return p.nombre; });
}

/** Evita que un texto escrito por el viajero se interprete como fórmula (=, +, -, @). */
function textoSeguro_(s) {
  s = String(s == null ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
