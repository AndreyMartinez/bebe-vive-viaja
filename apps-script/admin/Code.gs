/**
 * bvv-admin — admin de viajes (implementar como app web: ejecutar como "Yo", acceso "Solo yo").
 * Google pide iniciar sesión y rechaza cualquier otra cuenta, así que aquí no hay claves.
 * Index.html llama estas funciones con google.script.run.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Admin de viajes · Bebe, Vive, Viaja')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Todo lo que pinta la página: enlaces a las hojas y lista de viajes. */
function estado() {
  var cfg = config_();
  if (!cfg.SITE_URL) throw new Error('Falta la propiedad del script SITE_URL');
  var respuestas = SpreadsheetApp.openById(cfg.RESPUESTAS_ID);
  var paradas = SpreadsheetApp.openById(cfg.PARADAS_ID);
  var carpeta = DriveApp.getFolderById(cfg.CARPETA_COMPROBANTES_ID);
  hojaViajes_(respuestas);
  return {
    hojas: { paradas: paradas.getUrl(), respuestas: respuestas.getUrl(), carpeta: carpeta.getUrl() },
    viajes: listarViajes_(cfg, respuestas, paradas),
  };
}

function crearViaje(datos) {
  var nombre = String((datos && datos.nombre) || '').trim();
  var ref = String((datos && datos.ref) || '').trim();
  if (!nombre || nombre.length > 80) throw new Error('Escribe el nombre del viaje (máx. 80 caracteres).');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ref) || ref.length > 60) {
    throw new Error('La referencia solo puede llevar minúsculas, números y guiones.');
  }

  var cfg = config_();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var respuestas = SpreadsheetApp.openById(cfg.RESPUESTAS_ID);
    var paradas = SpreadsheetApp.openById(cfg.PARADAS_ID);
    if (buscarViaje_(respuestas, ref)) throw new Error('Ya existe un viaje con la referencia "' + ref + '".');

    // Nombre de pestaña: el del viaje sin caracteres que Sheets no acepta.
    var pestana = nombre.replace(/[\[\]*?:\/\\']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
    if (pestana === PESTANA_VIAJES) pestana += ' (viaje)';

    // Si la pestaña ya existe se reutiliza tal cual: nunca se borra ni se sobrescribe.
    prepararPestana_(paradas, pestana, COLS_PARADAS, function (sh) {
      sh.setColumnWidths(1, 1, 260).setColumnWidths(2, 1, 380).setColumnWidths(3, 1, 300);
    });
    prepararPestana_(respuestas, pestana, COLS_RESPUESTAS, function (sh) {
      sh.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm');
      sh.getRange('G:G').setNumberFormat('@'); // teléfono como texto
      sh.getRange('E:E').setWrap(true);
      sh.setColumnWidths(1, 1, 100).setColumnWidths(3, 2, 220).setColumnWidths(5, 1, 240).setColumnWidths(9, 1, 160);
      sh.getRange(1, COL_VALIDADO).setBackground('#fff4d6');
    });

    var raiz = DriveApp.getFolderById(cfg.CARPETA_COMPROBANTES_ID);
    var existentes = raiz.getFoldersByName(pestana);
    var carpeta = existentes.hasNext() ? existentes.next() : raiz.createFolder(pestana);

    hojaViajes_(respuestas).appendRow([ref, nombre, 'abierto', pestana, carpeta.getId(), new Date()]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return estado();
}

function cambiarEstado(ref, nuevo) {
  if (nuevo !== 'abierto' && nuevo !== 'cerrado') throw new Error('Estado inválido');
  var respuestas = SpreadsheetApp.openById(config_().RESPUESTAS_ID);
  var v = buscarViaje_(respuestas, ref);
  if (!v) throw new Error('No existe el viaje ' + ref);
  hojaViajes_(respuestas).getRange(v.fila, 3).setValue(nuevo);
  SpreadsheetApp.flush();
  return estado();
}

// ---------- internas ----------

function hojaViajes_(respuestas) {
  var sh = respuestas.getSheetByName(PESTANA_VIAJES);
  if (!sh) {
    sh = respuestas.insertSheet(PESTANA_VIAJES, 0);
    sh.getRange(1, 1, 1, COLS_VIAJES.length).setValues([COLS_VIAJES]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('F:F').setNumberFormat('dd/MM/yyyy');
    sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['abierto', 'cerrado']).build());
    respuestas.setSpreadsheetTimeZone('America/Mexico_City');
  }
  return sh;
}

function prepararPestana_(ss, nombre, columnas, formato) {
  var sh = ss.getSheetByName(nombre);
  if (sh) return sh;
  sh = ss.insertSheet(nombre);
  sh.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold');
  sh.setFrozenRows(1);
  formato(sh);
  return sh;
}

function listarViajes_(cfg, respuestas, paradasSs) {
  var base = String(cfg.SITE_URL).replace(/\/+$/, '');
  return leerViajes_(respuestas).map(function (v) {
    var shR = respuestas.getSheetByName(v.pestana);
    var shP = paradasSs.getSheetByName(v.pestana);
    var registros = 0, personas = 0, pendientes = 0;
    if (shR && shR.getLastRow() > 1) {
      shR.getRange(2, 1, shR.getLastRow() - 1, COLS_RESPUESTAS.length).getValues().forEach(function (r) {
        if (!r[0]) return;
        registros++;
        personas += Number(r[5]) || 0;
        if (r[COL_VALIDADO - 1] !== true) pendientes++;
      });
    }
    return {
      ref: v.ref,
      nombre: v.nombre,
      estado: v.estado,
      registros: registros,
      personas: personas,
      pendientes: pendientes,
      paradas: shP ? leerParadas_(paradasSs, v.pestana).length : 0,
      urlRespuestas: shR ? respuestas.getUrl() + '#gid=' + shR.getSheetId() : respuestas.getUrl(),
      urlParadas: shP ? paradasSs.getUrl() + '#gid=' + shP.getSheetId() : paradasSs.getUrl(),
      liga: base + '/bienvenida/?viaje=' + encodeURIComponent(v.ref),
    };
  });
}
