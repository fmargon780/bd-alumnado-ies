/*** ================= INFORMES POR UNIDAD =================
 *
 * Copia lo que hay en la pestaña ALUMNADO a cada pestaña de grupo
 * del cuaderno "INFORME-RESUMEN POR GRUPOS 26-27".
 *
 * Las columnas se localizan por su TÍTULO (fila 9), nunca por su letra,
 * así que da igual que unas pestañas tengan columnas de más.
 * Cualquier columna cuyo título no conozca se respeta tal cual.
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
      const regla = t ? MAPA_INFORMES[normalizar(t)] : null;
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
    if (ancho > 2) {
      hoja.getRange(FILA_DATOS, 3, bloque.length, ancho - 2).setVerticalAlignment('middle');
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

  escribirAvisosInformes_(avisos);

  ui.alert('Informes rellenados (' + VERSION + ')',
    resumen.join('\n') +
    '\n\nGrupos actualizados: ' + resumen.length +
    '\nAlumnos escritos: ' + totalEscritos +
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
