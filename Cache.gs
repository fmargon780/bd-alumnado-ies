/*** ================= CACHÉ DE EXPEDIENTES LEÍDOS =================
 *
 * Primaria.gs y Secundaria.gs leen, uno a uno, los expedientes de Séneca que
 * Francisco va descargando. Son ficheros que casi nunca cambian de una
 * actualización a la siguiente, y descargarlos y volver a leerlos entero es
 * lo que más tarda de "1. Actualizar los datos" cuando hay muchos
 * acumulados.
 *
 * QUÉ HACE ESTE FICHERO. Guarda, en una pestaña OCULTA del propio cuaderno
 * (_expedientes), el resultado YA LEÍDO de cada fichero, junto con la fecha
 * de modificación que tenía entonces. La próxima vez:
 *
 *   - si el fichero sigue con la misma fecha, se devuelve lo que ya estaba
 *     guardado, SIN DESCARGARLO ni volver a leerlo;
 *   - si es nuevo, o ha cambiado, se lee de verdad y se guarda para la
 *     próxima.
 *
 * La pestaña se lee ENTERA UNA SOLA VEZ, al principio de la ejecución (queda
 * en memoria), y se vuelve a escribir ENTERA UNA SOLA VEZ, al final: ni una
 * lectura ni una escritura por fichero.
 *
 * Las entradas de ficheros que ya no están en la carpeta se borran, pero solo
 * dentro de un prefijo que sí se haya mirado en esta ejecución: si esta vez
 * no ha hecho falta mirar, por ejemplo, los expedientes de Secundaria, sus
 * entradas se dejan tal cual, porque no se sabe si sus ficheros siguen ahí.
 *
 * Si la pestaña falla al leer o al escribir, se sigue sin caché: cada
 * expediente se lee de verdad, más despacio, pero nada se rompe.
 *
 * ======================================================== ***/

const HOJA_CACHE_EXPEDIENTES_ = '_expedientes';

/* undefined = todavía no se ha leído la pestaña en esta ejecución. */
let CACHE_EXPEDIENTES_MEM_;
let CACHE_EXPEDIENTES_VISTOS_ = {};    // claves (prefijo|id) pedidas esta vez
let CACHE_EXPEDIENTES_PREFIJOS_ = {};  // prefijos pedidos esta vez
let CACHE_EXPEDIENTES_SUCIA_ = false;  // hay algo nuevo que guardar
let CACHE_EXPEDIENTES_AVISO_ = '';     // si algo falla, el motivo, para AVISOS

/* Lee la pestaña oculta entera, una sola vez por ejecución. */
function cargarCacheDeFicheros_() {
  if (CACHE_EXPEDIENTES_MEM_ !== undefined) return CACHE_EXPEDIENTES_MEM_;
  const mem = {};
  try {
    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CACHE_EXPEDIENTES_);
    if (hoja && hoja.getLastRow() >= 1) {
      const filas = hoja.getRange(1, 1, hoja.getLastRow(), 4).getValues();
      for (let f = 0; f < filas.length; f++) {
        const clave = String(filas[f][0] || '').trim();
        if (!clave) continue;
        mem[clave] = { ts: Number(filas[f][1]) || 0, nombre: String(filas[f][2] || ''),
                       json: String(filas[f][3] || '') };
      }
    }
  } catch (e) {
    CACHE_EXPEDIENTES_AVISO_ = 'No he podido leer la caché de expedientes (' + e.message +
      '). Se han releído todos.';
  }
  CACHE_EXPEDIENTES_MEM_ = mem;
  return mem;
}

/* JSON.stringify convierte una Date en texto, pero JSON.parse no la devuelve:
   se queda como texto. Aquí se guardan aparte, marcadas, para poder
   reconstruirlas al leer de la caché. Ningún expediente de Primaria ni de
   Secundaria trae hoy una Date en su resultado, pero queda hecho por si
   algún día la trajera. */
function congelarFechas_(v) {
  if (v instanceof Date) return { __fecha__: v.toISOString() };
  if (Array.isArray(v)) return v.map(congelarFechas_);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k in v) o[k] = congelarFechas_(v[k]);
    return o;
  }
  return v;
}
function revivirFechas_(v) {
  if (v && typeof v === 'object' && typeof v.__fecha__ === 'string') return new Date(v.__fecha__);
  if (Array.isArray(v)) return v.map(revivirFechas_);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k in v) o[k] = revivirFechas_(v[k]);
    return o;
  }
  return v;
}

/* prefijo -> para no mezclar los expedientes de Primaria con los de
              Secundaria dentro de la misma pestaña.
   archivo -> el fichero de Drive.
   lector  -> function(archivo) que lo lee de verdad cuando hace falta.
   Devuelve lo mismo que devolvería lector(archivo), venga de la caché o no. */
function conCacheDeFichero_(prefijo, archivo, lector) {
  const mem = cargarCacheDeFicheros_();
  const clave = prefijo + '|' + archivo.getId();
  CACHE_EXPEDIENTES_VISTOS_[clave] = true;
  CACHE_EXPEDIENTES_PREFIJOS_[prefijo] = true;

  const ts = archivo.getLastUpdated().getTime();
  const previo = mem[clave];
  if (previo && previo.ts === ts) {
    try {
      return revivirFechas_(JSON.parse(previo.json));
    } catch (e) { /* JSON corrupto: se relee como si no hubiera caché */ }
  }

  const resultado = lector(archivo);
  try {
    mem[clave] = { ts: ts, nombre: archivo.getName(), json: JSON.stringify(congelarFechas_(resultado)) };
    CACHE_EXPEDIENTES_SUCIA_ = true;
  } catch (e) {
    /* Si el resultado no se puede convertir a JSON, no se guarda: la próxima
       vez se vuelve a leer, que es lo seguro. */
  }
  return resultado;
}

/* Escribe la pestaña entera de una vez. La llama Panel.gs justo antes de
   escribir el panel, y también construirAlumnado al terminar, por si se
   ejecuta ella sola (por ejemplo, desde el editor de Apps Script). Si no hay
   nada nuevo que guardar, no toca la pestaña. */
function guardarCacheDeFicheros_() {
  if (CACHE_EXPEDIENTES_MEM_ === undefined || !CACHE_EXPEDIENTES_SUCIA_) return;
  const mem = CACHE_EXPEDIENTES_MEM_;
  const filas = [];
  for (const clave in mem) {
    const prefijo = clave.split('|')[0];
    /* Se borra si su prefijo se ha mirado esta vez y este fichero en concreto
       no ha aparecido: es un fichero que ya no está. Si el prefijo no se ha
       tocado en esta ejecución, se deja como estaba. */
    if (CACHE_EXPEDIENTES_PREFIJOS_[prefijo] && !CACHE_EXPEDIENTES_VISTOS_[clave]) continue;
    filas.push([clave, mem[clave].ts, mem[clave].nombre, mem[clave].json]);
  }
  try {
    const libro = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = libro.getSheetByName(HOJA_CACHE_EXPEDIENTES_);
    if (!hoja) hoja = libro.insertSheet(HOJA_CACHE_EXPEDIENTES_);
    hoja.clear();
    if (filas.length) hoja.getRange(1, 1, filas.length, 4).setValues(filas);
    try { hoja.hideSheet(); } catch (e) { /* si no se puede ocultar, se sigue viendo y no rompe nada */ }
    CACHE_EXPEDIENTES_SUCIA_ = false;
  } catch (e) {
    CACHE_EXPEDIENTES_AVISO_ = (CACHE_EXPEDIENTES_AVISO_ ? CACHE_EXPEDIENTES_AVISO_ + ' ' : '') +
      'No he podido guardar la caché de expedientes (' + e.message + '). La próxima vez se releerá todo.';
  }
}

/* El aviso, si algo ha fallado al leer o guardar la caché. Lo recoge
   Codigo.gs para dejarlo en la pestaña AVISOS. Vacío si todo ha ido bien. */
function avisoDeCacheExpedientes_() {
  return CACHE_EXPEDIENTES_AVISO_;
}
