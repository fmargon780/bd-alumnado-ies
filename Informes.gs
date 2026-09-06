/*** ================= INFORMES POR UNIDAD =================
 *
 * Copia lo que hay en la pestaña ALUMNADO a cada pestaña de grupo del
 * cuaderno "INFORME-RESUMEN POR GRUPOS 26-27", deja las columnas en el orden
 * acordado, y saca un PDF listo para imprimir con una portada delante.
 *
 * El informe se lee de izquierda a derecha como una frase:
 *   quién es -> cómo va -> qué apoyos tiene -> qué cursa
 *
 * Las columnas se localizan por su TÍTULO, nunca por su letra. Cualquier
 * columna que el programa no conozca se conserva, con su contenido, al final.
 *
 * ======================================================== ***/

const ID_INFORMES   = '1zJXNix6nc_cq5yOAmbyuLIvlYv508gOa5h0X5vfmxkA';
const FILA_GRUPO    = 7;   // ahí está el rótulo "1º ESO A"
const FILA_LEYENDA  = 8;
const FILA_TITULOS  = 9;
const FILA_DATOS    = 10;
const HOJA_AV_INF   = 'AVISOS INFORMES';
const HOJA_PORTADA  = 'RESUMEN';

/*** ================= LAS COLUMNAS ================= ***/

/* Cada columna tiene una clave interna. El rótulo que se ve puede cambiar;
   la clave no. Aquí se reconocen los rótulos viejos y los nuevos, para que
   se pueda pulsar el botón las veces que haga falta. */
const ALIAS_COLUMNAS = {
  'alumno/a:': 'alumno/a:',
  'rep': 'rep',
  'mat no sup.': 'mat no sup.',
  'no superadas del curso que repite': 'mat no sup.',
  'no superadas (repite)': 'mat no sup.',
  'mat. pend.': 'mat. pend.',
  'pendientes de cursos anteriores': 'mat. pend.',
  'pendientes (anteriores)': 'mat. pend.',
  'mat. pend. 6º': 'mat. pend. 6º',
  'pendientes de 6º de primaria': 'mat. pend. 6º',
  'pendientes (6º primaria)': 'mat. pend. 6º',
  'pil': 'pil',
  'div': 'div',
  'diversificacion': 'div',
  'neae': 'neae',
  'neae/c': 'neae',
  'medidas/recursos': 'medidas/recursos',
  'medidas y recursos': 'medidas/recursos',
  'itinerario': 'itinerario',
  'opt': 'opt',
  'fr -> alct': 'fr -> alct',
  'exento frances': 'fr -> alct',
  'exento de frances': 'fr -> alct',
  'rel/atedu': 'rel/atedu',
  'mat': 'mat', 'opc1': 'opc1', 'opc2': 'opc2', 'opc3': 'opc3', 'opc4': 'opc4',
  'veces repite primaria': 'veces repite primaria'
};

/* El rótulo que se escribe en la fila 9. */
const ROTULOS = {
  'alumno/a:': 'Alumno/a:',
  'rep': 'REP',
  'mat no sup.': 'NO SUPERADAS (repite)',
  'mat. pend.': 'PENDIENTES (anteriores)',
  'mat. pend. 6º': 'PENDIENTES (6º Primaria)',
  'pil': 'PIL',
  'div': 'DIV',
  'neae': 'NEAE',
  'medidas/recursos': 'MEDIDAS Y RECURSOS',
  'itinerario': 'ITINERARIO',
  'opt': 'OPT',
  'fr -> alct': 'EXENTO FRANCÉS',
  'rel/atedu': 'REL/Atedu'
};

/* Qué columnas lleva cada nivel, y en qué orden.
   Bloque 1: quién es. Bloque 2: su trayectoria. Bloque 3: sus apoyos.
   Bloque 4: su matrícula de este curso. */
const COLUMNAS_POR_NIVEL = {
  '1º': ['alumno/a:', 'rep', 'mat no sup.', 'mat. pend. 6º', 'pil',
         'neae', 'medidas/recursos', 'opt', 'fr -> alct', 'rel/atedu'],
  '2º': ['alumno/a:', 'rep', 'mat no sup.', 'mat. pend.', 'pil',
         'neae', 'medidas/recursos', 'opt', 'rel/atedu'],
  '3º': ['alumno/a:', 'rep', 'mat no sup.', 'mat. pend.', 'pil', 'div',
         'neae', 'medidas/recursos', 'opt', 'rel/atedu'],
  '4º': ['alumno/a:', 'rep', 'mat no sup.', 'mat. pend.', 'pil', 'div',
         'neae', 'medidas/recursos', 'itinerario', 'rel/atedu']
};

/* Columnas que ya no se usan: sus datos van ahora dentro de ITINERARIO. */
const COLUMNAS_RETIRADAS = ['mat', 'opc1', 'opc2', 'opc3', 'opc4'];

/* De dónde sale cada columna. Las que no aparecen aquí las rellena una
   persona, y el programa nunca las toca. */
const MAPA_INFORMES = {
  'alumno/a:':  { col: 'Alumno/a' },
  'rep':        { col: 'Repite el curso actual', si: 'SÍ' },
  'mat no sup.':{ col: 'MAT NO SUP.' },
  'mat. pend.': { col: 'Asignaturas pendientes' },
  'pil':        { col: 'PIL', si: 'SÍ' },
  'div':        { col: 'Diversificación', siEmpieza: 'SÍ' },
  'itinerario': { junta: ['MAT', 'OPC1', 'OPC2', 'OPC3', 'OPC4'] },
  'opt':        { col: 'OPT' },
  /* NEAE y MEDIDAS Y RECURSOS las rellena ahora el censo NEAE de Séneca.
     'conservaSiVacio' es la red de seguridad: si el censo no dice nada de un
     alumno, se respeta lo que hubiera escrito una persona en el informe. */
  'neae':       { col: 'NEAE', conservaSiVacio: true },
  'medidas/recursos': { col: 'MEDIDAS Y RECURSOS', conservaSiVacio: true },
  'fr -> alct': { col: 'FR -> ALCT', siLleno: 'SÍ' },
  'rel/atedu':  { col: 'REL/Atedu' }
};

/*** ================= ANCHOS =================
 *
 * En puntos. Un A4 vertical con márgenes de 11 mm deja 707 puntos.
 * Los anchos de abajo son el mínimo. Lo que sobre en cada nivel se reparte
 * entre las columnas largas, que son las que agradecen el sitio: cuanto más
 * anchas, menos líneas ocupa cada fila y más alumnos entran en el folio.
 * ============================================================== ***/
const ANCHO_FOLIO = 707;
const ANCHO_NUMERACION = 26;
/* Ajustados a la letra 8: las columnas de marca (una letra o un código corto)
   se han apretado para dar sitio a NEAE y MEDIDAS Y RECURSOS. */
const ANCHOS_MINIMOS = {
  'alumno/a:': 130, 'rep': 26, 'mat no sup.': 90, 'mat. pend.': 85,
  'mat. pend. 6º': 85, 'pil': 26, 'div': 26, 'neae': 55,
  'medidas/recursos': 75, 'itinerario': 112, 'opt': 40, 'fr -> alct': 45,
  'rel/atedu': 52, 'veces repite primaria': 45
};
const ANCHO_DESCONOCIDA = 80;
const COLUMNAS_ELASTICAS = ['mat no sup.', 'mat. pend.', 'mat. pend. 6º', 'alumno/a:',
                            'neae', 'medidas/recursos'];
const CON_AJUSTE = ['alumno/a:', 'mat no sup.', 'mat. pend.', 'mat. pend. 6º',
                    'neae', 'medidas/recursos', 'itinerario', 'opt'];
/* Se baja de 9 a 8 al meter las columnas NEAE y MEDIDAS Y RECURSOS.
   Medido con el simulador sobre los datos reales del curso 26-27:
   con letra 9 el PDF pasaría de 27 a 33 páginas y de 3 a 9 grupos de dos
   folios; con letra 8 se queda en 25 páginas y ningún grupo se parte. */
const LETRA_INFORME = 8;
const ALTO_LINEA = 12;

/* La leyenda ya no ocupa una fila propia: se escribe en el hueco que queda a
   la derecha del membrete, en las filas 1 a 6, que antes estaban desperdiciadas.
   Así no empuja ni una fila hacia abajo y se imprime en todas las páginas,
   porque esas filas van congeladas. */
const LEYENDA = [
  'NO SUPERADAS: las suspendió el curso que repite.   DIV: diversificación.',
  'PENDIENTES: las arrastra de cursos anteriores, con su curso detrás.',
  'NEAE — NEE: n. educativas especiales.   DIA: dificultades de aprendizaje.',
  'AACC: altas capacidades.   COM: compensación educativa.',
  'MEDIDAS — ACS, ACI, ACAI y AAC: adaptaciones curriculares.',
  'PE: programa específico.   PRA: refuerzo del aprendizaje.   PP: profundización.',
  'RECURSOS (detrás de la raya) — PT, AL, ATAL, COMP, PTIS, ONCE.'
];
const LETRA_LEYENDA = 6;
const ALTO_LINEA_LEYENDA = 7.2;   // puntos que ocupa una línea a esa letra
const ANCHO_LETRA_LEYENDA = 3.0;  // ancho medio de un carácter, en puntos
const AIRE_TRAS_MEMBRETE = 12;    // separación entre el membrete y la leyenda

/* El membrete es una imagen flotante encima de las filas 1 a 6. No se pueden
   esconder esas filas: la imagen se iría con ellas. */
const FILAS_CABECERA   = 6;

/* El membrete nuevo. Es un fichero de imagen en la carpeta de datos que se
   llama MEMBRETE (da igual la extensión). Si está, el programa lo pone en las
   23 pestañas. Si no está, deja el que haya y no toca nada. */
const NOMBRE_MEMBRETE  = 'membrete';
const RATIO_MEMBRETE   = 6.667;   // ancho dividido por alto de esa imagen
const ANCHO_MEMBRETE   = 312;     // puntos = 110 mm. Deja sitio a su derecha para la leyenda
const ALTO_MINIMO_FILA = 8;
const AIRE_BAJO_LOGO   = 10;   // sitio para que respire la leyenda de al lado

const PDF_OPCIONES = 'format=pdf&size=A4&portrait=true&fitw=true&scale=2' +
  '&sheetnames=false&printtitle=false&pagenumbers=true&pagenum=CENTER' +
  '&gridlines=false&fzr=true' +
  '&top_margin=0.20&bottom_margin=0.20&left_margin=0.45&right_margin=0.45' +
  '&horizontal_alignment=LEFT&vertical_alignment=TOP';

/*** ================= LÓGICA PURA ================= ***/

function claveColumna_(titulo) {
  const n = normalizar(titulo);
  return ALIAS_COLUMNAS[n] === undefined ? n : ALIAS_COLUMNAS[n];
}

/* Jefatura tenía suelta la palabra DIVERSIFICACIÓN en la fila 7, sin señalar
   a nadie. Ya no hace falta: ahora hay una columna DIV. */
function limpiarRotuloDiver_(hoja, fila7) {
  for (let c = 0; c < fila7.length; c++) {
    if (normalizar(fila7[c]) === 'diversificacion') {
      hoja.getRange(FILA_GRUPO, c + 1).clearContent().setBackground(null);
    }
  }
}

/* De la fila 7 saca el nombre del grupo, esté en la columna que esté. */
function grupoDeFila7(fila) {
  for (let c = 0; c < fila.length; c++) {
    const t = String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim();
    if (/^[1-4]\s*º\s+ESO\s+[A-ZÑ]$/i.test(t)) return t.replace(/\s+/g, ' ');
  }
  return '';
}

function indiceTitulos(titulos) {
  const idx = {};
  for (let c = 0; c < titulos.length; c++) {
    const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
    if (t) idx[normalizar(t)] = c;
  }
  return idx;
}

/* Qué columnas debe tener esta pestaña, en orden. Las que el programa no
   conoce se conservan y se ponen al final. */
function columnasDeLaPestana_(nivel, titulosActuales) {
  const quiere = (COLUMNAS_POR_NIVEL[nivel] || COLUMNAS_POR_NIVEL['2º']).slice();
  const extras = [];
  for (let c = 0; c < titulosActuales.length; c++) {
    const t = String(titulosActuales[c] === null || titulosActuales[c] === undefined
                     ? '' : titulosActuales[c]).trim();
    if (!t) continue;
    const clave = claveColumna_(t);
    if (quiere.indexOf(clave) !== -1) continue;
    if (COLUMNAS_RETIRADAS.indexOf(clave) !== -1) continue;   // se funden en ITINERARIO
    if (extras.indexOf(clave) === -1) extras.push(clave);
  }
  return quiere.concat(extras);
}

/* Reparte el sitio que sobra entre las columnas largas. */
function anchosDeLaPestana_(claves) {
  const anchos = {};
  let suma = ANCHO_NUMERACION;
  for (let i = 0; i < claves.length; i++) {
    const a = ANCHOS_MINIMOS[claves[i]] === undefined ? ANCHO_DESCONOCIDA : ANCHOS_MINIMOS[claves[i]];
    anchos[claves[i]] = a;
    suma += a;
  }
  const elasticas = COLUMNAS_ELASTICAS.filter(function (c) { return claves.indexOf(c) !== -1; });
  const sobra = ANCHO_FOLIO - suma;
  if (sobra > 0 && elasticas.length) {
    const cada = Math.floor(sobra / elasticas.length);
    for (let i = 0; i < elasticas.length; i++) anchos[elasticas[i]] += cada;
    suma += cada * elasticas.length;
  }
  return { anchos: anchos, suma: suma };
}

/* El valor que va en una columna para un alumno. */
function valorInforme(regla, alumno, idxAlum) {
  if (regla.junta) {
    const partes = [];
    for (let i = 0; i < regla.junta.length; i++) {
      const j = idxAlum[normalizar(regla.junta[i])];
      if (j === undefined) continue;
      const v = String(alumno[j] === null || alumno[j] === undefined ? '' : alumno[j]).trim();
      if (v) partes.push(v);
    }
    return partes.join(' ');
  }
  const i = idxAlum[normalizar(regla.col)];
  if (i === undefined) return '';
  const v = alumno[i];
  if (regla.si) return String(v).trim().toUpperCase() === 'SÍ' ? regla.si : '';
  /* 'siEmpieza' es para Diversificación, que vale "SÍ", "SÍ (solo Jefatura)" o "NO". */
  if (regla.siEmpieza) return normalizar(v).indexOf('si') === 0 ? regla.siEmpieza : '';
  /* 'siLleno' es para columnas que en ALUMNADO llevan un código y en el
     informe solo hace falta saber si el alumno está o no en ese caso. */
  if (regla.siLleno) return String(v === null || v === undefined ? '' : v).trim() ? regla.siLleno : '';
  return v === null || v === undefined ? '' : v;
}

/* Construye el bloque de datos. 'previos' guarda, por alumno y por clave de
   columna, lo que había antes, para respetar lo que rellena una persona. */
function construirBloque(claves, alumnos, idxAlum, previos) {
  const filas = [];
  for (let f = 0; f < alumnos.length; f++) {
    const alumno = alumnos[f];
    const nombre = alumno[idxAlum[normalizar('Alumno/a')]];
    const antes = previos[normalizar(nombre)] || {};
    const fila = [f + 1];
    for (let c = 0; c < claves.length; c++) {
      const regla = MAPA_INFORMES[claves[c]];
      if (regla) {
        let v = valorInforme(regla, alumno, idxAlum);
        if (String(v).trim() === '' && regla.conservaSiVacio && antes[claves[c]] !== undefined) {
          v = antes[claves[c]];
        }
        fila.push(v);
      } else fila.push(antes[claves[c]] === undefined ? '' : antes[claves[c]]);
    }
    filas.push(fila);
  }
  return filas;
}

/* Alto que necesita la fila de rótulos para que no se corte ninguno. */
function altoDeLosRotulos_(claves, anchos) {
  let lineas = 1;
  for (let c = 0; c < claves.length; c++) {
    const rot = ROTULOS[claves[c]] || claves[c];
    const util = Math.max(10, (anchos[claves[c]] || ANCHO_DESCONOCIDA) - 8);
    const n = Math.ceil(String(rot).length * 5.4 / util);
    if (n > lineas) lineas = n;
  }
  return lineas * ALTO_LINEA + 8;
}

/*** ================= LECTURA DE ALUMNADO ================= ***/
function leerAlumnado_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_ALUMNADO);
  if (!hoja || hoja.getLastRow() < 3) {
    throw new Error('No encuentro la pestaña ALUMNADO con datos.\n\n' +
                    'Pulsa antes "2. Construir la tabla ALUMNADO".');
  }
  const ancho = hoja.getLastColumn();
  const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0];
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  const idx = indiceTitulos(titulos);
  if (idx[normalizar('Alumno/a')] === undefined || idx[normalizar('Unidad')] === undefined) {
    throw new Error('La pestaña ALUMNADO no tiene las columnas Alumno/a y Unidad.');
  }
  const porUnidad = {}, sinUnidad = [];
  const iNom = idx[normalizar('Alumno/a')], iUni = idx[normalizar('Unidad')];
  const iCur = idx[normalizar('Curso')];
  for (let f = 0; f < datos.length; f++) {
    const nombre = String(datos[f][iNom] || '').trim();
    if (!nombre) continue;
    const unidad = String(datos[f][iUni] || '').trim();
    if (!unidad) {
      sinUnidad.push([nombre, iCur === undefined ? '' : String(datos[f][iCur] || '')]);
      continue;
    }
    const clave = normalizar(unidad);
    if (!porUnidad[clave]) porUnidad[clave] = [];
    porUnidad[clave].push(datos[f]);
  }
  for (const u in porUnidad) {
    porUnidad[u].sort(function (a, b) {
      const ka = normalizar(a[iNom]), kb = normalizar(b[iNom]);
      return ka < kb ? -1 : (ka > kb ? 1 : 0);
    });
  }
  return { porUnidad: porUnidad, idx: idx, sinUnidad: sinUnidad, filas: datos };
}

/*** ================= EL MEMBRETE ================= ***/

/* Busca el fichero de imagen llamado MEMBRETE en la carpeta de datos. */
function blobMembrete_() {
  const carpetas = carpetasDondeBuscar();
  for (let c = 0; c < carpetas.length; c++) {
    const it = carpetas[c].getFiles();
    while (it.hasNext()) {
      const f = it.next();
      const nombre = f.getName();
      const sinExt = normalizar(nombre.replace(/\.[^.]+$/, ''));
      if (sinExt !== NOMBRE_MEMBRETE) continue;
      if (String(f.getMimeType()).indexOf('image/') !== 0) continue;
      return f.getBlob();
    }
  }
  return null;
}

/* Cambia el membrete de una pestaña, conservando dónde está y encogiéndolo
   un poco para ganar alto de folio. Devuelve true si lo ha cambiado. */
function ponerMembrete_(hoja, blob) {
  let imagenes;
  try { imagenes = hoja.getImages(); } catch (e) { return false; }
  let cambiada = false;
  for (let i = 0; i < imagenes.length; i++) {
    const img = imagenes[i];
    let fila;
    try { fila = img.getAnchorCell().getRow(); } catch (e) { continue; }
    if (fila > FILAS_CABECERA) continue;
    /* El ancho se ajusta siempre, haya o no una imagen nueva: si el membrete
       se quedara ancho, taparía la leyenda que va a su derecha. */
    if (blob) { img.replace(blob); cambiada = true; }
    img.setWidth(ANCHO_MEMBRETE);
    img.setHeight(Math.round(ANCHO_MEMBRETE / RATIO_MEMBRETE));
  }
  return cambiada;
}

/*** ================= LA LEYENDA, AL LADO DEL MEMBRETE ================= ***/

/* Devuelve la primera columna que empieza más allá del membrete. */
function columnaTrasElMembrete_(claves, anchos) {
  let acumulado = ANCHO_NUMERACION;
  const limite = ANCHO_MEMBRETE + AIRE_TRAS_MEMBRETE;
  for (let c = 0; c < claves.length; c++) {
    if (acumulado >= limite) return c + 2;          // +1 por la numeración, +1 porque las columnas empiezan en 1
    acumulado += anchos[claves[c]] === undefined ? ANCHO_DESCONOCIDA : anchos[claves[c]];
  }
  return claves.length + 1;
}

/* Escribe la leyenda en el hueco libre de las filas 1 a 6. Devuelve un texto
   de aviso si no cabe, o cadena vacía si todo va bien. */
function escribirLeyendaCabecera_(hoja, claves, anchos, ancho) {
  const primera = columnaTrasElMembrete_(claves, anchos);
  if (primera > ancho) return 'No queda hueco a la derecha del membrete para la leyenda.';

  let disponible = 0;
  for (let c = primera - 2; c < claves.length; c++) {
    disponible += anchos[claves[c]] === undefined ? ANCHO_DESCONOCIDA : anchos[claves[c]];
  }

  const rango = hoja.getRange(1, primera, FILAS_CABECERA, ancho - primera + 1);
  try { rango.breakApart(); } catch (e) { /* no estaba unida */ }
  rango.merge();
  rango.setValue(LEYENDA.join('\n'))
       .setFontSize(LETRA_LEYENDA).setFontStyle('italic').setWrap(true)
       .setVerticalAlignment('top').setHorizontalAlignment('left');

  /* ¿Cabe? Se cuenta cuántas líneas ocupa cada renglón al ancho que hay. */
  const porLinea = Math.max(1, Math.floor((disponible - 6) / ANCHO_LETRA_LEYENDA));
  let lineas = 0;
  for (let i = 0; i < LEYENDA.length; i++) lineas += Math.ceil(LEYENDA[i].length / porLinea);
  let alto = 0;
  for (let r = 1; r <= FILAS_CABECERA; r++) alto += hoja.getRowHeight(r);
  if (lineas * ALTO_LINEA_LEYENDA > alto) {
    return 'La leyenda necesita ' + Math.round(lineas * ALTO_LINEA_LEYENDA) +
           ' puntos de alto y el hueco del membrete tiene ' + Math.round(alto) +
           '. Se verá cortada.';
  }
  return '';
}

/*** ================= EL HUECO DEL MEMBRETE ================= ***/
function ajustarFilasDelLogo_(hoja) {
  let imagenes;
  try { imagenes = hoja.getImages(); } catch (e) { return 0; }
  if (!imagenes || !imagenes.length) return 0;

  let necesita = 0;
  for (let i = 0; i < imagenes.length; i++) {
    const img = imagenes[i];
    let fila;
    try { fila = img.getAnchorCell().getRow(); } catch (e) { continue; }
    if (fila > FILAS_CABECERA) continue;
    const abajo = img.getAnchorCellYOffset() + img.getHeight();
    if (abajo > necesita) necesita = abajo;
  }
  if (!necesita) return 0;

  const total = necesita + AIRE_BAJO_LOGO;
  let actual = 0;
  for (let r = 1; r <= FILAS_CABECERA; r++) actual += hoja.getRowHeight(r);
  if (actual <= total) return 0;

  const arriba = ALTO_MINIMO_FILA * (FILAS_CABECERA - 1);
  hoja.setRowHeights(1, FILAS_CABECERA - 1, ALTO_MINIMO_FILA);
  hoja.setRowHeight(FILAS_CABECERA, Math.max(ALTO_MINIMO_FILA, total - arriba));
  return actual - total;
}

/*** ================= PDF ================= ***/
function generarPdfInformes_(libro, visibles) {
  const dejar = {};
  for (let i = 0; i < visibles.length; i++) dejar[visibles[i]] = true;

  const escondidas = [];
  try {
    const hojas = libro.getSheets();
    for (let h = 0; h < hojas.length; h++) {
      if (dejar[hojas[h].getName()]) continue;
      if (hojas[h].isSheetHidden()) continue;
      hojas[h].hideSheet();
      escondidas.push(hojas[h]);
    }
    SpreadsheetApp.flush();

    const url = 'https://docs.google.com/spreadsheets/d/' + libro.getId() + '/export?' + PDF_OPCIONES;
    const resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error('Google ha respondido con el error ' + resp.getResponseCode() + ' al hacer el PDF.');
    }
    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const nombre = 'Informes por unidad ' + hoy + '.pdf';
    const carpeta = DriveApp.getFolderById(CARPETA_ID);
    const viejos = carpeta.getFilesByName(nombre);
    while (viejos.hasNext()) viejos.next().setTrashed(true);
    const archivo = carpeta.createFile(resp.getBlob().setName(nombre));
    return { nombre: nombre, url: archivo.getUrl() };
  } finally {
    for (let i = 0; i < escondidas.length; i++) {
      try { escondidas[i].showSheet(); } catch (e) { /* que no se quede escondida */ }
    }
  }
}

/*** ================= UN PDF POR INFORME ================= ***/
/* Además del PDF con todo junto, se deja una carpeta con un PDF por informe:
   uno para el equipo directivo (el resumen) y uno para cada tutor.
   Así cada uno numera sus páginas desde 1, y el tutor sabe cuántas hojas son. */

/* Cuenta las páginas de un PDF sin abrirlo: mira cuántos objetos de página tiene. */
function contarPaginas_(blob) {
  try {
    const t = blob.getDataAsString('ISO-8859-1');
    const m = t.match(/\/Type\s*\/Page[^s]/g);
    return m && m.length ? m.length : 1;
  } catch (e) { return 1; }
}

/* Google no deja pedirle muchos PDF seguidos: a partir del quinto o sexto
   empieza a decir que no. Por eso se le pide despacio, y si dice que no se
   espera un poco y se vuelve a intentar, cada vez esperando más. */
const ESPERAS_PDF = [0, 5000, 15000];   // milisegundos

function exportarHoja_(libro, hoja, token, aviso) {
  const url = 'https://docs.google.com/spreadsheets/d/' + libro.getId() + '/export?' +
              PDF_OPCIONES + '&gid=' + hoja.getSheetId();
  let codigo = 0;
  for (let i = 0; i < ESPERAS_PDF.length; i++) {
    if (ESPERAS_PDF[i]) Utilities.sleep(ESPERAS_PDF[i]);
    let resp;
    try {
      resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true,
        headers: { 'Authorization': 'Bearer ' + token } });
    } catch (e) { codigo = -1; continue; }
    codigo = resp.getResponseCode();
    if (codigo === 200) return resp.getBlob();
  }
  if (aviso) aviso.codigo = codigo;
  return null;
}

function pdfsPorInforme_(libro, entradas) {
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const raiz = DriveApp.getFolderById(CARPETA_ID);
  const nombreCarpeta = 'Informes ' + hoy;
  /* La carpeta se reaprovecha. Cada fichero se sustituye cuando se consigue
     sacar, así que si un día Google corta a medias, lo que ya estaba sigue
     ahí y basta con volver a pulsar para completar lo que falte. */
  const encontradas = raiz.getFoldersByName(nombreCarpeta);
  const carpeta = encontradas.hasNext() ? encontradas.next() : raiz.createFolder(nombreCarpeta);

  const token = ScriptApp.getOAuthToken();
  let hechos = 0, dobles = [], fallidos = [], seguidos = 0;
  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    if (i) Utilities.sleep(2500);            // sin prisa, que Google se agobia
    const aviso = {};
    let blob = exportarHoja_(libro, e.hoja, token, aviso);
    if (!blob) {
      fallidos.push(e.nombre + ' (Google respondió ' + aviso.codigo + ')');
      seguidos++;
      /* Si falla dos veces seguidas es que Google ha cerrado el grifo.
         Mejor parar y decirlo, que seguir dando golpes. */
      if (seguidos >= 2) {
        for (let k = i + 1; k < entradas.length; k++) fallidos.push(entradas[k].nombre + ' (no intentado)');
        break;
      }
      continue;
    }
    seguidos = 0;
    const paginas = contarPaginas_(blob);
    /* Si el informe ocupa más de una hoja, se lo decimos al tutor en la
       cabecera, que se repite en todas sus páginas, y lo volvemos a sacar. */
    if (paginas > 1 && e.celda) {
      e.celda.setValue(e.texto + ' · ' + paginas + ' hojas');
      SpreadsheetApp.flush();
      Utilities.sleep(1500);
      const otro = exportarHoja_(libro, e.hoja, token, {});
      if (otro) blob = otro;
      dobles.push(e.nombre + ' (' + paginas + ' hojas)');
    }
    const anteriores = carpeta.getFilesByName(e.nombre + '.pdf');
    while (anteriores.hasNext()) anteriores.next().setTrashed(true);
    carpeta.createFile(blob.setName(e.nombre + '.pdf'));
    hechos++;
  }
  return { carpeta: nombreCarpeta, hechos: hechos, dobles: dobles, fallidos: fallidos };
}

/*** ================= LA PORTADA ================= ***/
/* Primera hoja del PDF. Es para Francisco, no para los tutores: dice qué
   falta por cuadrar en Séneca antes de que los informes sean del todo fiables. */
function escribirPortada_(libro, A, resumenGrupos) {
  let hoja = libro.getSheetByName(HOJA_PORTADA);
  if (!hoja) hoja = libro.insertSheet(HOJA_PORTADA);
  hoja.clear();
  if (hoja.getMaxColumns() < 5) hoja.insertColumnsAfter(hoja.getMaxColumns(), 5 - hoja.getMaxColumns());
  libro.setActiveSheet(hoja);
  libro.moveActiveSheet(1);

  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const filas = [], bandas = [];
  let filaCabeceraTabla = 0;
  const mete = function (a, b, c, d, e) { filas.push([a || '', b || '', c || '', d || '', e || '']); };
  const banda = function (t) { bandas.push(filas.length); mete(t); };

  mete('INFORMES POR UNIDAD');
  mete('IES Fuente Lucena · Generado el ' + hoy + ' · ' + VERSION);
  mete('');

  const dame = function (fila, t) {
    const i = A.idx[normalizar(t)];
    return i === undefined ? '' : String(fila[i] === null || fila[i] === undefined ? '' : fila[i]).trim();
  };
  let nPil = 0, nRep = 0, nDiv = 0, nPen = 0, nTot = 0;
  for (let f = 0; f < A.filas.length; f++) {
    const fila = A.filas[f];
    if (!dame(fila, 'Alumno/a')) continue;
    nTot++;
    if (dame(fila, 'PIL') === 'SÍ') nPil++;
    if (dame(fila, 'Repite el curso actual') === 'SÍ') nRep++;
    if (normalizar(dame(fila, 'Diversificación')).indexOf('si') === 0) nDiv++;
    if (dame(fila, 'Nº pendientes') !== '') nPen++;
  }
  banda('EL CENTRO EN CIFRAS');
  mete('Alumnado de ESO: ' + nTot + '     Grupos con informe: ' + resumenGrupos.length +
       '     Repetidores: ' + nRep + '     PIL: ' + nPil +
       '     En diversificación: ' + nDiv + '     Con materias pendientes: ' + nPen);
  mete('');

  banda('ALUMNADO SIN UNIDAD ASIGNADA EN SÉNECA');
  if (!A.sinUnidad.length) {
    mete('Ninguno. Todo el alumnado tiene su grupo.');
  } else {
    mete('No salen en ningún informe de grupo. Hay que ponerles unidad en Séneca.');
    for (let i = 0; i < A.sinUnidad.length; i++) {
      mete(A.sinUnidad[i][0] + '   (' + A.sinUnidad[i][1] + ' ESO)');
    }
  }
  mete('');

  const pend = discrepanciasPendientes_();
  banda('PENDIENTE DE AJUSTAR EN SÉNECA (' + pend.length + ')');
  if (!pend.length) {
    mete('Nada pendiente. Séneca coincide con lo que quiere Jefatura de Estudios.');
  } else {
    mete('Escribe algo en la columna Estado de la pestaña DISCREPANCIAS y esa línea desaparece de aquí.');
    filaCabeceraTabla = filas.length + 1;
    mete('Grupo', 'Alumno/a', 'Qué no cuadra', 'Séneca dice', 'Jefatura quiere');
    for (let i = 0; i < pend.length; i++) {
      mete(pend[i][0], pend[i][1], pend[i][2], pend[i][3], pend[i][4]);
    }
    bandas.push(-filaCabeceraTabla);   // marca: fila de títulos, con otro color
  }

  hoja.getRange(1, 1, filas.length, 5).setValues(filas)
      .setFontSize(8).setVerticalAlignment('middle').setWrap(false);
  /* La tabla de abajo sí ajusta el texto, para que ninguna celda invada la de al lado. */
  if (filaCabeceraTabla) {
    hoja.getRange(filaCabeceraTabla, 1, filas.length - filaCabeceraTabla + 1, 5).setWrap(true);
  }
  hoja.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  hoja.getRange(2, 1).setFontStyle('italic');
  for (let i = 0; i < bandas.length; i++) {
    if (bandas[i] >= 0) {
      hoja.getRange(bandas[i] + 1, 1, 1, 5).setFontWeight('bold').setBackground('#D9E1F2').setFontSize(9);
    } else {
      hoja.getRange(-bandas[i], 1, 1, 5).setFontWeight('bold').setBackground('#F2F2F2');
    }
  }
  hoja.setColumnWidth(1, 65);
  hoja.setColumnWidth(2, 175);
  hoja.setColumnWidth(3, 235);
  hoja.setColumnWidth(4, 100);
  hoja.setColumnWidth(5, 100);
  hoja.setRowHeights(1, filas.length, 12);
  hoja.setRowHeight(1, 22);
  if (filaCabeceraTabla) {
    hoja.autoResizeRows(filaCabeceraTabla, filas.length - filaCabeceraTabla + 1);
    /* Si la lista se va a una segunda hoja, que los títulos salgan también allí. */
    hoja.setFrozenRows(filaCabeceraTabla);
  } else {
    hoja.setFrozenRows(0);
  }
  return pend.length;
}

/* Las diferencias con Jefatura que todavía no has marcado como resueltas. */
function discrepanciasPendientes_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_DISCREP);
  const salida = [];
  if (!hoja || hoja.getLastRow() < 3) return salida;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, 8).getValues();
  for (let f = 0; f < datos.length; f++) {
    const alumno = String(datos[f][2] || '').trim();
    const tipo = String(datos[f][3] || '').trim();
    if (!tipo) continue;
    if (String(datos[f][6] || '').trim() !== '') continue;   // ya le has puesto un estado
    salida.push([String(datos[f][1] || ''), alumno, tipo,
                 String(datos[f][4] || ''), String(datos[f][5] || '')]);
  }
  return salida;
}

/*** ================= OPCIÓN: RELLENAR LOS INFORMES ================= ***/
function rellenarInformes() {
  let A;
  try {
    A = leerAlumnado_();
  } catch (e) {
    avisar_('No he podido empezar', e.message);
    return;
  }

  let libro;
  try {
    libro = SpreadsheetApp.openById(ID_INFORMES);
  } catch (e) {
    avisar_('No he podido abrir el cuaderno de informes', e.message);
    return;
  }

  const avisos = [], resumen = [], usadas = {}, pestanasDeGrupo = [], informes = [];
  let totalEscritos = 0, membretesCambiados = 0;
  let membrete = null;
  try { membrete = blobMembrete_(); } catch (e) { membrete = null; }
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');

  const hojas = libro.getSheets();
  for (let h = 0; h < hojas.length; h++) {
    const hoja = hojas[h];
    if (hoja.getLastRow() < FILA_TITULOS) continue;

    const anchoFila7 = Math.max(hoja.getLastColumn(), 15);
    const fila7 = hoja.getRange(FILA_GRUPO, 1, 1, anchoFila7).getValues()[0];
    const grupo = grupoDeFila7(fila7);
    if (!grupo) continue;   // no es una pestaña de grupo
    limpiarRotuloDiver_(hoja, fila7);
    const nivel = grupo.substring(0, 2);

    const anchoViejo = hoja.getLastColumn();
    const titulosViejos = hoja.getRange(FILA_TITULOS, 1, 1, anchoViejo).getValues()[0];
    if (indiceTitulos(titulosViejos)[normalizar('Alumno/a:')] === undefined) {
      avisos.push([grupo, hoja.getName(), 'Sin columna Alumno/a:',
                   'La fila ' + FILA_TITULOS + ' no tiene el título "Alumno/a:". No la he tocado.']);
      continue;
    }

    /* Lo que había, guardado por nombre de alumno y por clave de columna.
       Así da igual que las columnas cambien de sitio: nada se pierde. */
    const previos = {};
    const ultima = hoja.getLastRow();
    if (ultima >= FILA_DATOS) {
      const iNomInf = indiceTitulos(titulosViejos)[normalizar('Alumno/a:')];
      const viejo = hoja.getRange(FILA_DATOS, 1, ultima - FILA_DATOS + 1, anchoViejo).getValues();
      for (let f = 0; f < viejo.length; f++) {
        const n = String(viejo[f][iNomInf] || '').trim();
        if (!n) continue;
        const porClave = {};
        for (let c = 0; c < anchoViejo; c++) {
          const t = String(titulosViejos[c] || '').trim();
          if (t) porClave[claveColumna_(t)] = viejo[f][c];
        }
        previos[normalizar(n)] = porClave;
      }
    }

    const alumnos = A.porUnidad[normalizar(grupo)] || [];
    if (!alumnos.length) {
      avisos.push([grupo, hoja.getName(), 'Grupo sin alumnos en ALUMNADO',
                   'No hay ningún alumno con Unidad = "' + grupo + '". No la he tocado.']);
      continue;
    }
    usadas[normalizar(grupo)] = true;
    pestanasDeGrupo.push(hoja.getName());

    const claves = columnasDeLaPestana_(nivel, titulosViejos);
    const ancho = claves.length + 1;              // más la columna de numeración
    const W = anchosDeLaPestana_(claves);

    /* Las filas 1 a 6 llevan la leyenda en una celda unida. Hay que soltarla
       antes de añadir o quitar columnas, o Google no deja. */
    try { hoja.getRange(1, 1, FILAS_CABECERA, hoja.getMaxColumns()).breakApart(); }
    catch (e) { /* no había nada unido */ }

    // Dejar la pestaña con el número de columnas justo
    if (hoja.getMaxColumns() < ancho) {
      hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());
    } else if (hoja.getMaxColumns() > ancho) {
      hoja.deleteColumns(ancho + 1, hoja.getMaxColumns() - ancho);
    }

    // Avisar de datos manuales que se pierden porque el alumno ya no está
    const ahora = {};
    for (let f = 0; f < alumnos.length; f++) {
      ahora[normalizar(alumnos[f][A.idx[normalizar('Alumno/a')]])] = true;
    }
    for (const clave in previos) {
      if (!ahora[clave]) {
        avisos.push([grupo, hoja.getName(), 'Alumno que ya no está en el grupo',
                     'Estaba en el informe pero no en ALUMNADO. Se ha quitado de la lista.']);
      }
    }

    // Rótulos y datos, de una vez
    const rotulos = [''];
    for (let c = 0; c < claves.length; c++) rotulos.push(ROTULOS[claves[c]] || claves[c]);
    const bloque = construirBloque(claves, alumnos, A.idx, previos);

    if (ultima >= FILA_TITULOS) {
      hoja.getRange(FILA_TITULOS, 1, ultima - FILA_TITULOS + 1, ancho).clearContent();
    }
    hoja.getRange(FILA_TITULOS, 1, 1, ancho).setValues([rotulos]);
    hoja.getRange(FILA_DATOS, 1, bloque.length, ancho).setValues(bloque);

    /* La fila 8 llevaba la leyenda. Ahora la leyenda va arriba, al lado del
       membrete, así que esta fila se vacía y se deja lo más baja posible. */
    hoja.getRange(FILA_LEYENDA, 1, 1, ancho).clearContent();
    hoja.setRowHeight(FILA_LEYENDA, ALTO_MINIMO_FILA);
    const textoCabecera = alumnos.length + ' alumnos · ' + hoy;
    const celdaCabecera = hoja.getRange(FILA_GRUPO, ancho);
    celdaCabecera.setValue(textoCabecera)
        .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('right').setWrap(false);
    informes.push({ hoja: hoja, nombre: grupo, celda: celdaCabecera, texto: textoCabecera });

    // Formato
    hoja.getRange(FILA_TITULOS, 1, 1, ancho).setFontWeight('bold').setWrap(true)
        .setHorizontalAlignment('center');
    hoja.getRange(FILA_TITULOS, 1, bloque.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID)
        .setFontSize(LETRA_INFORME).setVerticalAlignment('middle');
    hoja.setColumnWidth(1, ANCHO_NUMERACION);
    hoja.getRange(FILA_DATOS, 1, bloque.length, 1).setHorizontalAlignment('center');
    for (let c = 0; c < claves.length; c++) {
      hoja.setColumnWidth(c + 2, W.anchos[claves[c]]);
      const rango = hoja.getRange(FILA_DATOS, c + 2, bloque.length, 1);
      if (CON_AJUSTE.indexOf(claves[c]) !== -1) rango.setWrap(true).setHorizontalAlignment('left');
      else rango.setWrap(false).setHorizontalAlignment('center');
    }
    hoja.setRowHeight(FILA_TITULOS, altoDeLosRotulos_(claves, W.anchos));
    hoja.autoResizeRows(FILA_DATOS, bloque.length);
    if (ponerMembrete_(hoja, membrete)) membretesCambiados++;
    ajustarFilasDelLogo_(hoja);
    try {
      const problema = escribirLeyendaCabecera_(hoja, claves, W.anchos, ancho);
      if (problema) avisos.push([grupo, hoja.getName(), 'La leyenda no cabe', problema]);
    } catch (e) {
      avisos.push([grupo, hoja.getName(), 'No he podido escribir la leyenda', e.message]);
    }
    hoja.setFrozenRows(FILA_TITULOS);

    if (W.suma > ANCHO_FOLIO + 40) {
      avisos.push([grupo, hoja.getName(), 'La tabla es demasiado ancha',
                   'Suma ' + W.suma + ' puntos y en el folio caben ' + ANCHO_FOLIO +
                   '. El PDF la encogerá y la letra saldrá pequeña.']);
    }

    resumen.push(hoja.getName() + ' (' + grupo + '): ' + bloque.length + ' alumnos');
    totalEscritos += bloque.length;
  }

  for (const u in A.porUnidad) {
    if (!usadas[u]) {
      avisos.push([A.porUnidad[u][0][A.idx[normalizar('Unidad')]], '', 'Grupo sin pestaña',
                   'Hay ' + A.porUnidad[u].length + ' alumnos con esta unidad y ninguna pestaña para ellos.']);
    }
  }
  for (let i = 0; i < A.sinUnidad.length; i++) {
    avisos.push(['', '', 'Alumno sin unidad en Séneca',
                 A.sinUnidad[i][0] + ' (' + A.sinUnidad[i][1] + ' ESO). Sale en la portada del PDF.']);
  }

  let nPend = 0;
  try { nPend = escribirPortada_(libro, A, resumen); }
  catch (e) { avisos.push(['', '', 'No he podido hacer la portada', e.message]); }

  let pdf = null, fallo = '';
  try {
    pdf = generarPdfInformes_(libro, [HOJA_PORTADA].concat(pestanasDeGrupo));
  } catch (e) {
    fallo = e.message;
    avisos.push(['', '', 'No he podido hacer el PDF', e.message]);
  }

  /* Y ahora uno por informe, cada uno con su propia numeración de páginas. */
  let sueltos = null;
  try {
    const hojaPortada = libro.getSheetByName(HOJA_PORTADA);
    const entradas = [];
    if (hojaPortada) entradas.push({ hoja: hojaPortada, nombre: 'RESUMEN para el equipo directivo' });
    for (let i = 0; i < informes.length; i++) entradas.push(informes[i]);
    sueltos = pdfsPorInforme_(libro, entradas);
    for (let i = 0; i < sueltos.dobles.length; i++) {
      avisos.push(['', '', 'Informe de más de una hoja', sueltos.dobles[i] +
                   '. Lo pone en su cabecera, para que el tutor lo sepa.']);
    }
    for (let i = 0; i < sueltos.fallidos.length; i++) {
      avisos.push(['', '', 'PDF suelto que no ha salido', sueltos.fallidos[i] +
                   '. Vuelve a pulsar la opción 3 dentro de un rato.']);
    }
  } catch (e) {
    avisos.push(['', '', 'No he podido hacer los PDF sueltos', e.message]);
  }

  escribirAvisosInformes_(avisos);

  avisar_('Informes rellenados (' + VERSION + ')',
    'Grupos actualizados: ' + resumen.length +
    (membrete ? '\nMembretes actualizados: ' + membretesCambiados : '') +
    '\nAlumnos escritos: ' + totalEscritos +
    '\nAlumnos sin unidad (salen solo en la portada): ' + A.sinUnidad.length +
    '\nPendiente de ajustar en Séneca: ' + nPend +
    (pdf ? '\n\nPDF con todo junto: ' + pdf.nombre
         : '\n\nNo he podido hacer el PDF: ' + fallo) +
    (sueltos ? '\nY un PDF por informe en la carpeta "' + sueltos.carpeta + '": ' +
               sueltos.hechos + ' de ' + (sueltos.hechos + sueltos.fallidos.length) + ' ficheros.' +
               (sueltos.fallidos.length ? '\nGoogle no me ha dejado sacar ' + sueltos.fallidos.length +
                '. Vuelve a pulsar la opción 3 dentro de un rato.' : '') : '') +
    '\n\nAvisos anotados: ' + avisos.length +
    (avisos.length ? '\nMíralos en la pestaña "' + HOJA_AV_INF + '".' : ''));
}

function escribirAvisosInformes_(avisos) {
  const titulos = ['Grupo', 'Pestaña', 'Aviso', 'Detalle'];
  const hoja = hojaLimpia(HOJA_AV_INF, titulos.length);
  hoja.getRange(1, 1).setValue('Incidencias al rellenar los informes por unidad. Actualizado: ' +
    new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold');
  if (avisos.length) hoja.getRange(3, 1, avisos.length, titulos.length).setValues(avisos);
  hoja.setFrozenRows(2);
  for (let c = 1; c <= titulos.length; c++) hoja.autoResizeColumn(c);
}
