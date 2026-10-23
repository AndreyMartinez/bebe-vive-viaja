/**
 * bvv-api — API pública del registro de viajeros (implementar como app web: ejecutar como "Yo", acceso "Cualquiera").
 * La usa src/components/islands/Registro.tsx. Nunca devuelve IDs ni URLs de hojas o carpetas.
 *
 *   GET  ?action=viaje&ref=<ref>  → { ok, viaje: { ref, nombre, estado, guia, paradas: [{ nombre, direccion, maps }] } }
 *   POST (text/plain, JSON)       → { ok, folio } | { ok: false, error, campo? }
 */

var MAX_BYTES = 10 * 1024 * 1024;
var MAX_PERSONAS = 30;

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.action !== 'viaje') return json_({ ok: false, error: 'accion_invalida' });
    var cfg = config_();
    var v = buscarViaje_(SpreadsheetApp.openById(cfg.RESPUESTAS_ID), String(p.ref || '').trim());
    if (!v) return json_({ ok: false, error: 'no_existe' });
    var paradas = leerParadas_(SpreadsheetApp.openById(cfg.PARADAS_ID), v.pestana);
    return json_({ ok: true, viaje: { ref: v.ref, nombre: v.nombre, estado: v.estado, guia: v.guia, paradas: paradas } });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'error_interno' });
  }
}

function doPost(e) {
  var archivo = null;
  try {
    var d;
    try {
      d = JSON.parse(e.postData.contents);
    } catch (_) {
      return json_({ ok: false, error: 'campo_invalido' });
    }
    // Trampa contra bots: un humano nunca llena este campo. Se responde "ok" para no dar pistas.
    if (d.sitio) return json_({ ok: true, folio: folio_() });

    var personas = Array.isArray(d.personas) ? d.personas.map(function (x) { return String(x).trim(); }) : [];
    if (!personas.length || personas.length > MAX_PERSONAS || personas.some(function (x) { return !x || x.length > 120; })) {
      return json_({ ok: false, error: 'campo_invalido', campo: 'personas' });
    }
    var telefono = String(d.telefono || '').replace(/\D/g, '');
    if (telefono.length !== 10) return json_({ ok: false, error: 'campo_invalido', campo: 'telefono' });
    var a = d.archivo || {};
    var tipo = String(a.tipo || '');
    if (!a.base64 || !(tipo.indexOf('image/') === 0 || tipo === 'application/pdf')) {
      return json_({ ok: false, error: 'campo_invalido', campo: 'archivo' });
    }
    var bytes = Utilities.base64Decode(a.base64);
    if (bytes.length > MAX_BYTES) return json_({ ok: false, error: 'archivo_grande', campo: 'archivo' });

    var cfg = config_();
    var respuestas = SpreadsheetApp.openById(cfg.RESPUESTAS_ID);
    var v = buscarViaje_(respuestas, String(d.ref || '').trim());
    if (!v) return json_({ ok: false, error: 'no_existe' });
    if (v.estado === 'cerrado') return json_({ ok: false, error: 'viaje_cerrado' });
    var paradas = leerParadas_(SpreadsheetApp.openById(cfg.PARADAS_ID), v.pestana);
    var parada = paradas[Number(d.parada)];
    if (!parada || Math.floor(Number(d.parada)) !== Number(d.parada)) return json_({ ok: false, error: 'campo_invalido', campo: 'parada' });

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var folio = folio_();
      var fecha = new Date();
      var ext = (String(a.nombre || '').match(/\.([a-z0-9]{1,5})$/i) || [, tipo === 'application/pdf' ? 'pdf' : 'jpg'])[1].toLowerCase();
      var primerNombre = personas[0].split(/\s+/)[0].replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '');
      var nombreArchivo = Utilities.formatDate(fecha, 'America/Mexico_City', 'yyyy-MM-dd') + '_' + folio + '_' + primerNombre + '.' + ext;
      // La carpeta del viaje es privada (de la cuenta de la marca); el archivo hereda ese acceso.
      archivo = DriveApp.getFolderById(v.carpeta).createFile(Utilities.newBlob(bytes, tipo, nombreArchivo));

      var sh = respuestas.getSheetByName(v.pestana);
      if (!sh) throw new Error('No existe la pestaña de respuestas ' + v.pestana);
      sh.appendRow([
        folio,
        fecha,
        textoSeguro_(parada.nombre),
        textoSeguro_(parada.direccion),
        textoSeguro_(personas.join('\n')),
        personas.length,
        telefono,
        archivo.getUrl(),
        false,
      ]);
      // La casilla se crea sin marcar; solo la organizadora la cambia.
      sh.getRange(sh.getLastRow(), COL_VALIDADO).insertCheckboxes();
      SpreadsheetApp.flush();
      return json_({ ok: true, folio: folio });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    // No dejar comprobantes huérfanos si falló la fila.
    if (archivo) try { archivo.setTrashed(true); } catch (_) {}
    return json_({ ok: false, error: 'error_interno' });
  }
}

/** Folio corto y legible, sin caracteres que se confundan (0/O, 1/I/L). */
function folio_() {
  var abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var s = '';
  for (var i = 0; i < 4; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return 'BVV-' + s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
