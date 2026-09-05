/*** ================= INFORMES POR UNIDAD =================
 *
 * Copia lo que hay en la pestaña ALUMNADO a cada pestaña de grupo
 * del cuaderno "INFORME-RESUMEN POR GRUPOS 26-27".
 *
 * Las columnas se localizan por su TÍTULO (fila 9), nunca por su letra,
 * así que da igual que unas pestañas tengan columnas de más.
 * Cualquier columna cuyo título no conozca se respeta tal cual.
 *
 * Al final deja también un PDF listo para imprimir en la carpeta de Drive.
 *
 * ======================================================== ***/

const ID_INFORMES   = '1zJXNix6nc_cq5yOAmbyuLIvlYv508gOa5h0X5vfmxkA';
const FILA_GRUPO    = 7;   // ahí está el rótulo "1º ESO A"
const FILA_TITULOS  = 9;
const FILA_DATOS    = 10;
const HOJA_AV_INF   = 'AVISOS INFORMES';

/* Título en el informe  ->  de dónde sale en ALUMNADO.
   'si' significa: si en ALUMNADO pone SÍ, escribe este texto; si no, deja vacío. */
const MAPA_INFORMES = {
  'alumno/a:':             { col: 'Alumno/a' },
  'rep':                   { col: 'Repite el curso actual', si: 'R' },
  'mat no sup.':           { col: 'MAT NO SUP.' },
  'pil':                   { col: 'PIL', si: 'PIL' },
  'mat. pend.':            { col: 'Asignaturas pendientes' },
  'neae':                  { col: 'NEAE' },
  'opt':                   { col: 'OPT' },
  'fr -> alct':            { col: 'FR -> ALCT' },
  'rel/atedu':             { col: 'REL/Atedu' },
  'mat':                   { col: 'MAT' },
  'opc1':                  { col: 'OPC1' },
  'opc2':                  { col: 'OPC2' },
  'opc3':                  { col: 'OPC3' },
  'opc4':                  { col: 'OPC4' },
  'veces repite primaria': { primaria: true }
};

/*** ================= RÓTULOS DE LAS DOS COLUMNAS QUE SE CONFUNDÍAN =========
 *
 * "MAT NO SUP." y "MAT. PEND." parecían lo mismo en el papel. Son cosas
 * distintas y ahora lo dicen ellas solas. El programa reescribe el rótulo
 * en la fila 9, así que no hay que tocar el cuaderno a mano.
 *
 * Reconoce el rótulo viejo y el nuevo, para que se pueda pulsar el botón
 * las veces que haga falta sin que se rompa nada.
 * ======================================================================== ***/
const ALIAS_COLUMNAS = {
  'mat no sup.':                        'mat no sup.',
  'no superadas del curso que repite':   'mat no sup.',
  'mat. pend.':                         'mat. pend.',
  'pendientes de cursos anteriores':     'mat. pend.',
  'mat. pend. 6º':                      'mat. pend. 6º',
  'pendientes de 6º de primaria':        'mat. pend. 6º'
};
const TITULOS_NUEVOS = {
  'mat no sup.':   'NO SUPERADAS del curso que repite',
  'mat. pend.':    'PENDIENTES de cursos anteriores',
  'mat. pend. 6º': 'PENDIENTES de 6º de Primaria'
};

/* La línea que se imprime encima de los títulos, en la fila 8. */
const FILA_LEYENDA = 8;
const TEXTO_LEYENDA =
  'NO SUPERADAS: las suspendió el curso pasado y las repite. ' +
  'PENDIENTES: las arrastra de cursos anteriores; detrás va el curso del que vienen.';

/* Devuelve la clave con la que el programa conoce a esa columna. */
function claveColumna_(titulo) {
  const n = normalizar(titulo);
  return ALIAS_COLUMNAS[n] === undefined ? n : ALIAS_COLUMNAS[n];
}

/*** ================= ANCHOS PARA IMPRIMIR EN VERTICAL =================
 *
 * En píxeles. Un folio A4 en vertical, con márgenes de 0,9 cm, da unos
 * 726 píxeles útiles. La suma de cada nivel tiene que caber ahí:
 *   1º = 638   2º y 3º = 590   4º = 719   (1ºA = 683, 2ºB = 680)
 *
 * Las columnas largas (nombre, materias no superadas, pendientes, NEAE)
 * llevan ajuste de texto: se parten en varias líneas y la fila crece.
 * Las columnas que no conozco no se tocan.
 * ==================================================================== ***/
const ANCHOS_INFORME = {
  'alumno/a:': 150, 'rep': 30, 'mat no sup.': 105, 'pil': 32,
  'mat. pend.': 100, 'mat. pend. 6º': 100, 'neae': 50,
  'opt': 45, 'fr -> alct': 48, 'rel/atedu': 52,
  'mat': 38, 'opc1': 34, 'opc2': 34, 'opc3': 34, 'opc4': 34,
  'veces repite primaria': 45, 'medidas/recursos': 90
};
const ANCHO_NUMERACION = 26;
const CON_AJUSTE = ['alumno/a:', 'mat no sup.', 'mat. pend.', 'mat. pend. 6º',
                    'neae', 'medidas/recursos'];
const LETRA_INFORME = 9;

/* Ajustes del PDF. Los márgenes van en pulgadas. */
const PDF_OPCIONES = 'format=pdf&size=A4&portrait=true&fitw=true&scale=2' +
  '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=true' +
  '&top_margin=0.40&bottom_margin=0.40&left_margin=0.35&right_margin=0.35' +
  '&horizontal_alignment=LEFT&vertical_alignment=TOP';

/*** ================= LÓGICA PURA ================= ***/

/* De la fila 7 saca el nombre del grupo, esté en la columna que esté. */
function grupoDeFila7(fila) {
  for (let c = 0; c < fila.length; c++) {
    const t = String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim();
    if (/^[1-4]\s*º\s+ESO\s+[A-ZÑ]$/i.test(t)) return t.replace(/\s+/g, ' ');
  }
  return '';
}

/* Índice de las columnas por su título. */
function indiceTitulos(titulos) {
  const idx = {};
  for (let c = 0; c < titulos.length; c++) {
    const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
    if (t) idx[normalizar(t)] = c;
  }
  return idx;
}

/* Valor que hay que escribir en una columna del informe para un alumno. */
function valorInforme(regla, alumno, idxAlum) {
  if (regla.primaria) {
    const corr = alumno[idxAlum[normalizar('Rep. Primaria (corregido)')]];
    if (String(corr === null || corr === undefined ? '' : corr).trim() !== '') return corr;
    const calc = idxAlum[normalizar('Rep. Primaria (calculado)')];
    return calc === undefined ? '' : alumno[calc];
  }
  const i = idxAlum[normalizar(regla.col)];
  if (i === undefined) return '';
  const v = alumno[i];
  if (regla.si) return String(v).trim().toUpperCase() === 'SÍ' ? regla.si : '';
  return v === null || v === undefined ? '' : v;
}

/* Construye el bloque de datos de una pestaña.
   'titulos' es la fila 9. 'previos' son los valores que ya había, por alumno,
   para poder respetar las columnas que rellena Francisco a mano. */
function construirBloque(titulos, alumnos, idxAlum, previos) {
  const ancho = titulos.length;
  const filas = [];
  for (let f = 0; f < alumnos.length; f++) {
    const alumno = alumnos[f];
    const clave = normalizar(alumno[idxAlum[normalizar('Alumno/a')]]);
    const antes = previos[clave] || [];
    const fila = [];
    for (let c = 0; c < ancho; c++) {
      const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
      if (c === 0 && !t) { fila.push(f + 1); continue; }          // columna de numeración
      const regla = t ? MAPA_INFORMES[claveColumna_(t)] : null;
      if (regla) fila.push(valorInforme(regla, alumno, idxAlum));
      else fila.push(antes[c] === undefined ? '' : antes[c]);      // columna suya: se respeta
    }
    filas.push(fila);
  }
  return filas;
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
  const porUnidad = {};
  const iNom = idx[normalizar('Alumno/a')], iUni = idx[normalizar('Unidad')];
  for (let f = 0; f < datos.length; f++) {
    const nombre = String(datos[f][iNom] || '').trim();
    if (!nombre) continue;
    const unidad = String(datos[f][iUni] || '').trim();
    if (!unidad) continue;
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
  return { porUnidad: porUnidad, idx: idx };
}

/*** ================= FORMATO PARA IMPRIMIR ================= ***/
function darFormatoImpresion_(hoja, titulos, nFilas) {
  const ancho = titulos.length;
  let suma = 0;
  for (let c = 0; c < ancho; c++) {
    const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
    const clave = t ? claveColumna_(t) : '';
    let px = null;
    if (c === 0 && !t) px = ANCHO_NUMERACION;
    else if (ANCHOS_INFORME[clave] !== undefined) px = ANCHOS_INFORME[clave];
    if (px === null) { suma += hoja.getColumnWidth(c + 1); continue; }
    hoja.setColumnWidth(c + 1, px);
    suma += px;
    const rango = hoja.getRange(FILA_TITULOS, c + 1, nFilas + 1, 1);
    if (CON_AJUSTE.indexOf(clave) !== -1) rango.setWrap(true);
    else rango.setWrap(false).setHorizontalAlignment('center');
  }
  const todo = hoja.getRange(FILA_TITULOS, 1, nFilas + 1, ancho);
  todo.setFontSize(LETRA_INFORME).setVerticalAlignment('middle');
  hoja.getRange(FILA_TITULOS, 1, 1, ancho).setWrap(true);
  hoja.autoResizeRows(FILA_DATOS, nFilas);
  return suma;
}

/*** ================= PDF PARA IMPRIMIR ================= ***/
/* Exporta el cuaderno de informes a un solo PDF, un grupo por página.
   Las pestañas que no son de grupo (AVISOS y demás) se esconden un momento
   para que no salgan en el PDF, y se vuelven a mostrar al terminar. */
function generarPdfInformes_(libro, nombresDeGrupo) {
  const esGrupo = {};
  for (let i = 0; i < nombresDeGrupo.length; i++) esGrupo[nombresDeGrupo[i]] = true;

  const escondidas = [];
  try {
    const hojas = libro.getSheets();
    for (let h = 0; h < hojas.length; h++) {
      if (esGrupo[hojas[h].getName()]) continue;
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

/*** ================= OPCIÓN: RELLENAR LOS INFORMES ================= ***/
function rellenarInformes() {
  const ui = SpreadsheetApp.getUi();
  let A;
  try {
    A = leerAlumnado_();
  } catch (e) {
    ui.alert('No he podido empezar', e.message, ui.ButtonSet.OK);
    return;
  }

  let libro;
  try {
    libro = SpreadsheetApp.openById(ID_INFORMES);
  } catch (e) {
    ui.alert('No he podido abrir el cuaderno de informes.\n\n' + e.message);
    return;
  }

  const avisos = [];
  const resumen = [];
  const usadas = {};
  const pestanasDeGrupo = [];
  let totalEscritos = 0;

  const hojas = libro.getSheets();
  for (let h = 0; h < hojas.length; h++) {
    const hoja = hojas[h];
    if (hoja.getLastRow() < FILA_TITULOS) continue;

    const anchoFila7 = Math.max(hoja.getLastColumn(), 15);
    const grupo = grupoDeFila7(hoja.getRange(FILA_GRUPO, 1, 1, anchoFila7).getValues()[0]);
    if (!grupo) continue;   // no es una pestaña de grupo (AVISOS, etc.)

    const ancho = hoja.getLastColumn();
    const titulos = hoja.getRange(FILA_TITULOS, 1, 1, ancho).getValues()[0];
    if (indiceTitulos(titulos)[normalizar('Alumno/a:')] === undefined) {
      avisos.push([grupo, hoja.getName(), 'Sin columna Alumno/a:',
                   'La fila ' + FILA_TITULOS + ' no tiene el título "Alumno/a:". No la he tocado.']);
      continue;
    }

    // Lo que ya había, para respetar las columnas manuales
    const previos = {};
    const ultima = hoja.getLastRow();
    if (ultima >= FILA_DATOS) {
      const iNomInf = indiceTitulos(titulos)[normalizar('Alumno/a:')];
      const viejo = hoja.getRange(FILA_DATOS, 1, ultima - FILA_DATOS + 1, ancho).getValues();
      for (let f = 0; f < viejo.length; f++) {
        const n = String(viejo[f][iNomInf] || '').trim();
        if (n) previos[normalizar(n)] = viejo[f];
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

    const bloque = construirBloque(titulos, alumnos, A.idx, previos);

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

    // Rótulos nuevos en la fila 9, si todavía están los viejos
    let cambiados = false;
    for (let c = 0; c < ancho; c++) {
      const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
      if (!t) continue;
      const nuevo = TITULOS_NUEVOS[claveColumna_(t)];
      if (nuevo && nuevo !== t) { titulos[c] = nuevo; cambiados = true; }
    }
    if (cambiados) hoja.getRange(FILA_TITULOS, 1, 1, ancho).setValues([titulos]);

    // La leyenda, encima de los títulos
    hoja.getRange(FILA_LEYENDA, 1).setValue(TEXTO_LEYENDA)
        .setFontSize(8).setFontStyle('italic').setWrap(false);

    // Borrar el bloque viejo y escribir el nuevo
    if (ultima >= FILA_DATOS) {
      hoja.getRange(FILA_DATOS, 1, ultima - FILA_DATOS + 1, ancho).clearContent();
    }
    hoja.getRange(FILA_DATOS, 1, bloque.length, ancho).setValues(bloque);

    // Formato
    hoja.getRange(FILA_TITULOS, 1, 1, ancho).setFontWeight('bold');
    hoja.getRange(FILA_TITULOS, 1, bloque.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
    hoja.getRange(FILA_DATOS, 1, bloque.length, 1).setHorizontalAlignment('center');

    // Anchos, ajuste de texto y letra, para que quepa en un folio vertical
    const suma = darFormatoImpresion_(hoja, titulos, bloque.length);
    hoja.setFrozenRows(FILA_TITULOS);   // así el encabezado se repite en el PDF
    if (suma > 726) {
      avisos.push([grupo, hoja.getName(), 'La tabla se sale del folio',
                   'Suma ' + suma + ' puntos y en un A4 vertical caben 726. ' +
                   'Suele ser por una columna añadida a mano que yo no conozco.']);
    }

    resumen.push(hoja.getName() + ' (' + grupo + '): ' + bloque.length + ' alumnos');
    totalEscritos += bloque.length;
  }

  // Grupos de ALUMNADO que no tienen pestaña
  for (const u in A.porUnidad) {
    if (!usadas[u]) {
      avisos.push([A.porUnidad[u][0][A.idx[normalizar('Unidad')]], '', 'Grupo sin pestaña',
                   'Hay ' + A.porUnidad[u].length + ' alumnos con esta unidad y ninguna pestaña para ellos.']);
    }
  }

  // El PDF para imprimir
  let pdf = null, fallo = '';
  try {
    pdf = generarPdfInformes_(libro, pestanasDeGrupo);
  } catch (e) {
    fallo = e.message;
    avisos.push(['', '', 'No he podido hacer el PDF', e.message]);
  }

  escribirAvisosInformes_(avisos);

  ui.alert('Informes rellenados (' + VERSION + ')',
    resumen.join('\n') +
    '\n\nGrupos actualizados: ' + resumen.length +
    '\nAlumnos escritos: ' + totalEscritos +
    (pdf ? '\n\nPDF listo para imprimir: ' + pdf.nombre +
           '\nEstá en la carpeta "Datos de matrícula".'
         : '\n\nNo he podido hacer el PDF: ' + fallo) +
    '\n\nAvisos anotados: ' + avisos.length +
    (avisos.length ? '\nMíralos en la pestaña "' + HOJA_AV_INF + '".' : ''),
    ui.ButtonSet.OK);
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
