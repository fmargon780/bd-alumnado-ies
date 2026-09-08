/*** ================= LAS MATERIAS OBLIGATORIAS =================
 *
 * POR QUÉ EXISTE ESTE FICHERO (8-sep-2026, lo vio Francisco).
 *
 * La comparación con el fichero de Jefatura (Jefatura.gs) solo mira las
 * asignaturas que el alumno ELIGE: la optativa, la religión, la exención de
 * francés y, en 4º, Matemáticas A/B y las cuatro opciones. Son las únicas que
 * Jefatura escribe en su cuaderno.
 *
 * Las materias obligatorias (Lengua, Matemáticas, Inglés...) no están en el
 * fichero de Jefatura, así que nadie comprobaba que el alumno estuviera
 * matriculado en ellas en Séneca. Si a alguien le faltaba una, no se enteraba
 * nadie.
 *
 * DÓNDE SE DICE QUÉ ES OBLIGATORIO. En una pestaña del propio cuaderno,
 * "MATERIAS OBLIGATORIAS", que Francisco puede leer y corregir. Es la lista
 * buena: el programa hace lo que ella diga. Sus columnas son:
 *
 *   Curso                          1º, 2º, 3º o 4º
 *   Materia                        el nombre EXACTO que le da Séneca en el CSV
 *   Quién la cursa                 "Todo el alumnado",
 *                                  "Todos menos diversificación" o
 *                                  "Solo diversificación"
 *   Desde el año                   año en que empieza a ser obligatoria (2026)
 *   Hasta el año                   último año en que lo fue; vacío = sigue
 *   Notas                          para escribir el porqué de un cambio
 *
 * LAS FECHAS DE VIGENCIA. Una materia solo se comprueba si el año académico en
 * curso está dentro de su ventana. Así, cuando una asignatura deje de ser
 * obligatoria, no hay que borrar su línea: se escribe el último año en "Hasta
 * el año" y queda la historia de lo que se hacía antes. Y una materia nueva se
 * puede dejar preparada con "Desde el año" en el futuro.
 *
 * LA DIVERSIFICACIÓN. El alumnado de diversificación no cursa las materias
 * sueltas: cursa los Ámbitos. Por eso cada línea dice a quién se le exige. El
 * programa sabe quién es de diversificación porque está matriculado en el
 * Ámbito Científico-Tecnológico.
 *
 * LA PRIMERA VEZ. Si la pestaña no existe, el programa la crea con una
 * propuesta sacada de los propios CSV de Séneca: dentro de cada curso, las
 * materias que cursa casi todo el mundo. Es solo un punto de partida, y sale
 * un aviso pidiendo que se revise. A partir de ahí la pestaña manda, y el
 * programa NO la vuelve a tocar nunca.
 *
 * DÓNDE SE ESCRIBEN LOS FALLOS. Este fichero no construye la pestaña AVISOS:
 * la construye Codigo.gs. Aquí solo se añaden filas al final, cuando ya está
 * escrita. La llamada está en Panel.gs, justo después de construir la tabla y
 * antes de recuperar las anotaciones de Francisco, para que estas filas
 * también conserven su Estado y sus Observaciones.
 *
 * ======================================================== ***/

const HOJA_OBLIGATORIAS = 'MATERIAS OBLIGATORIAS';

const TITULOS_OBLIGATORIAS = ['Curso', 'Materia (como la escribe Séneca)', 'Quién la cursa',
  'Desde el año', 'Hasta el año', 'Notas'];

/* Las tres respuestas posibles a "quién la cursa". Son las del desplegable. */
const OBL_TODOS      = 'Todo el alumnado';
const OBL_ORDINARIO  = 'Todos menos diversificación';
const OBL_DIVER      = 'Solo diversificación';

/* Solo para la propuesta de la primera vez: a partir de qué parte del curso se
   supone que una materia es obligatoria. No se usa para comprobar nada; para
   eso manda la pestaña. */
const OBL_UMBRAL = 0.85;
const OBL_UMBRAL_DIVER = 0.70;      // los de diversificación son pocos por curso
const OBL_MINIMO_ALUMNOS = 20;
const OBL_MINIMO_DIVER = 5;

/* Valor de Séneca para una asignatura convalidada. Cuenta como matriculada.
   MATR y PEND están en Codigo.gs. */
const OBL_CONVALIDADA = 'CONV';

/*** ================= HERRAMIENTAS ================= ***/

/* El año académico en curso: 2026 quiere decir el curso 2026-27. De septiembre
   en adelante ya es el año nuevo; antes, el anterior. */
function oblAnoActual_() {
  const hoy = new Date();
  return hoy.getMonth() >= 7 ? hoy.getFullYear() : hoy.getFullYear() - 1;
}

/* Traduce lo escrito en "Quién la cursa" a 'todos', 'ordinario' o 'diver'.
   Lo que no se entienda se trata como "Todo el alumnado", que es lo normal. */
function oblQuien_(texto) {
  const n = normalizar(texto);
  if (n.indexOf('solo diver') === 0) return 'diver';
  if (n.indexOf('todos menos') === 0) return 'ordinario';
  return 'todos';
}

function oblAno_(v) {
  const n = parseInt(String(v === null || v === undefined ? '' : v).replace(/[^0-9]/g, '').substring(0, 4), 10);
  return isNaN(n) ? 0 : n;
}

/* ¿La casilla dice que está matriculado? */
function oblMatriculado_(v) {
  const t = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
  return t === MARCA || t === OBL_CONVALIDADA;
}

/* Los tres índices que hacen falta de la cabecera del CSV. */
function oblColumnas_(tabla) {
  const cab = tabla[0].map(function (t) {
    return String(t === null || t === undefined ? '' : t).trim();
  });
  const cabN = cab.map(normalizar);
  return { cab: cab, cabN: cabN,
    iNombre: cabN.indexOf(normalizar('Alumno/a')),
    iUnidad: cabN.indexOf(normalizar('Unidad')),
    iAmb: cabN.indexOf(normalizar(COL_AMBITOS)) };
}

/* Parte el alumnado del CSV en dos grupos: el ordinario y el de
   diversificación, que es el que está matriculado en el Ámbito. */
function oblAlumnos_(tabla, C) {
  const orden = [], diver = [];
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const bruto = fila[C.iNombre];
    const nombre = String(bruto === null || bruto === undefined ? '' : bruto).trim();
    if (!nombre) continue;
    const esDiver = C.iAmb !== -1 && String(fila[C.iAmb] || '').trim().toUpperCase() === MARCA;
    const alumno = { nombre: nombre, fila: fila, diver: esDiver,
                     unidad: C.iUnidad === -1 ? '' : String(fila[C.iUnidad] || '').trim() };
    if (esDiver) diver.push(alumno); else orden.push(alumno);
  }
  return { orden: orden, diver: diver };
}

/*** ================= LA PESTAÑA ================= ***/

/* Lee la pestaña. Devuelve null si no existe o está vacía. */
function oblLeerTabla_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_OBLIGATORIAS);
  if (!hoja || hoja.getLastRow() < 3) return null;
  const ancho = TITULOS_OBLIGATORIAS.length;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  const filas = [];
  for (let f = 0; f < datos.length; f++) {
    const curso = String(datos[f][0] || '').trim();
    const materia = String(datos[f][1] || '').trim();
    if (!curso || !materia) continue;
    filas.push({ curso: curso, materia: materia, quien: datos[f][2],
                 desde: oblAno_(datos[f][3]), hasta: oblAno_(datos[f][4]) });
  }
  return filas.length ? filas : null;
}

/* Las líneas de un curso que están vigentes este año. */
function oblVigentes_(filas, curso, ano) {
  const salida = [];
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    if (normalizar(f.curso) !== normalizar(curso)) continue;
    if (f.desde && f.desde > ano) continue;
    if (f.hasta && f.hasta < ano) continue;
    salida.push(f);
  }
  return salida;
}

/* Escribe la pestaña con la propuesta de la primera vez. Solo se llama cuando
   la pestaña no existe todavía. */
function oblEscribirTabla_(filas) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_OBLIGATORIAS);
  if (!hoja) hoja = libro.insertSheet(HOJA_OBLIGATORIAS);
  hoja.clear();
  const ancho = TITULOS_OBLIGATORIAS.length;
  if (hoja.getMaxColumns() < ancho) hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());

  hoja.getRange(1, 1).setValue('MATERIAS OBLIGATORIAS — esta lista la mandas tú · ' +
    new Date().toLocaleString('es-ES')).setFontWeight('bold');
  hoja.getRange(1, 1).setNote(
    'El programa comprueba que cada alumno esté matriculado en Séneca en las materias de esta lista.\n\n' +
    'La primera vez la ha rellenado él, mirando qué materias cursa casi todo el mundo en cada curso. ' +
    'Revísala y corrígela: a partir de ahora manda lo que ponga aquí, y el programa no la vuelve a tocar.\n\n' +
    'Materia: el nombre exacto que le da Séneca en el CSV de matrícula. Si no coincide, sale un aviso.\n' +
    'Quién la cursa: el alumnado de diversificación cursa los Ámbitos en vez de las materias sueltas.\n' +
    'Desde el año / Hasta el año: el año en que empieza el curso académico (2026 es el curso 2026-27). ' +
    'Cuando una materia deje de ser obligatoria, no borres su línea: escribe el último año en ' +
    '"Hasta el año" y así queda la historia.\n' +
    'Una línea sin años se comprueba siempre.');

  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_OBLIGATORIAS]).setFontWeight('bold')
      .setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle');

  const valores = filas.map(function (f) {
    return [f.curso, f.materia, f.quien, f.desde || '', f.hasta || '', ''];
  });
  if (valores.length) hoja.getRange(3, 1, valores.length, ancho).setValues(valores);

  /* Desplegable en "Quién la cursa", para que no haya erratas. */
  try {
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList([OBL_TODOS, OBL_ORDINARIO, OBL_DIVER], true)
      .setAllowInvalid(false).build();
    hoja.getRange(3, 3, Math.max(valores.length, 1) + 200, 1).setDataValidation(regla);
  } catch (e) { /* sin desplegable se escribe a mano */ }

  hoja.setColumnWidth(1, 60);
  hoja.setColumnWidth(2, 320);
  hoja.setColumnWidth(3, 200);
  hoja.setColumnWidth(4, 90);
  hoja.setColumnWidth(5, 90);
  hoja.setColumnWidth(6, 300);
  hoja.setFrozenRows(2);
  try {
    if (!hoja.getFilter()) hoja.getRange(2, 1, Math.max(valores.length, 1) + 1, ancho).createFilter();
  } catch (e) { /* si ya hay filtro, se deja */ }
  return valores.length;
}

/*** ================= LA PROPUESTA DE LA PRIMERA VEZ ================= ***/

/* Mira el CSV de un curso y propone qué materias son obligatorias: las que
   cursa casi todo el mundo. Deja fuera las que el alumno elige, que ya están
   listadas en REGLAS (Codigo.gs), y las columnas de materias pendientes de
   cursos anteriores, que llevan el curso entre paréntesis. */
function oblProponerCurso_(tabla, curso) {
  const propuesta = [];
  if (!tabla || tabla.length < 2) return propuesta;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return propuesta;

  const fuera = {};
  const reglas = REGLAS[curso] || [];
  for (let k = 0; k < reglas.length; k++) {
    for (const asig in reglas[k].codigos) fuera[normalizar(asig)] = true;
  }

  const G = oblAlumnos_(tabla, C);
  if (G.orden.length < OBL_MINIMO_ALUMNOS) return propuesta;
  const hayDiver = G.diver.length >= OBL_MINIMO_DIVER;

  for (let c = 0; c < C.cab.length; c++) {
    if (c === C.iNombre || c === C.iUnidad) continue;
    if (!C.cab[c]) continue;
    if (fuera[C.cabN[c]]) continue;
    if (/\(([1-4])º de E\.S\.O\.\)$/.test(C.cab[c])) continue;

    /* Una columna de asignatura solo puede llevar MATR, PEND, CONV o nada. Si
       trae otra cosa (una fecha, un número, un texto), no es una asignatura. */
    let esAsignatura = true;
    const cuenta = function (lista) {
      let n = 0;
      for (let f = 0; f < lista.length; f++) {
        const bruto = lista[f].fila[c];
        const v = String(bruto === null || bruto === undefined ? '' : bruto).trim().toUpperCase();
        if (!v) continue;
        if (v === MARCA || v === OBL_CONVALIDADA) { n++; continue; }
        if (v === PEND) continue;
        esAsignatura = false;
        return n;
      }
      return n;
    };
    const nOrd = cuenta(G.orden);
    if (!esAsignatura) continue;
    const nDiv = cuenta(G.diver);
    if (!esAsignatura) continue;

    const obligOrd = nOrd / G.orden.length >= OBL_UMBRAL;
    const obligDiv = hayDiver && nDiv / G.diver.length >= OBL_UMBRAL_DIVER;
    if (!obligOrd && !obligDiv) continue;

    let quien;
    if (obligOrd && obligDiv) quien = OBL_TODOS;
    else if (obligOrd) quien = hayDiver ? OBL_ORDINARIO : OBL_TODOS;
    else quien = OBL_DIVER;

    propuesta.push({ curso: curso, materia: C.cab[c], quien: quien, desde: '', hasta: '' });
  }
  return propuesta;
}

/*** ================= LA COMPROBACIÓN ================= ***/

/* Mira el CSV de un curso contra las líneas vigentes de la tabla y devuelve un
   aviso por cada alumno al que le falte alguna materia. */
function oblAvisosDeCurso_(tabla, curso, vigentes) {
  const avisos = [];
  if (!tabla || tabla.length < 2 || !vigentes.length) return avisos;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return avisos;
  const G = oblAlumnos_(tabla, C);
  const todos = G.orden.concat(G.diver);

  /* Cada línea de la tabla, con la columna del CSV donde se mira. */
  const lista = [], sinColumna = [];
  for (let i = 0; i < vigentes.length; i++) {
    const v = vigentes[i];
    const c = C.cabN.indexOf(normalizar(v.materia));
    if (c === -1) { sinColumna.push(v.materia); continue; }
    lista.push({ col: c, materia: v.materia, quien: oblQuien_(v.quien) });
  }

  /* Si una materia de la tabla no está en el CSV, casi siempre es que Séneca le
     ha cambiado el nombre. Se avisa una vez, no una por alumno. */
  if (sinColumna.length) {
    avisos.push({ curso: curso, grupo: '', alumno: '',
      aviso: 'Materia obligatoria que Séneca no trae',
      detalle: 'En la pestaña "' + HOJA_OBLIGATORIAS + '", el curso ' + curso + ' tiene: ' +
        sinColumna.join(', ') + '. El fichero de matrícula no trae ninguna columna que se llame ' +
        'exactamente así, y por eso no se ha comprobado. Corrige el nombre en la pestaña.' });
  }

  for (let a = 0; a < todos.length; a++) {
    const alumno = todos[a];
    const faltan = [];
    for (let i = 0; i < lista.length; i++) {
      const m = lista[i];
      if (alumno.diver && m.quien === 'ordinario') continue;
      if (!alumno.diver && m.quien === 'diver') continue;
      if (!oblMatriculado_(alumno.fila[m.col])) faltan.push(m.materia);
    }
    if (!faltan.length) continue;
    avisos.push({ curso: curso, grupo: alumno.unidad, alumno: alumno.nombre,
      aviso: 'Le faltan materias obligatorias en Séneca',
      detalle: 'No está matriculado en: ' + faltan.join(', ') + '. ' +
        (alumno.diver ? 'Es alumnado de diversificación. ' : '') +
        'Compruébalo en Séneca, o corrige la pestaña "' + HOJA_OBLIGATORIAS +
        '" si esa materia ya no es obligatoria.' });
  }
  return avisos;
}

/*** ================= ESCRITURA EN AVISOS ================= ***/

/* Añade las filas al final de la pestaña AVISOS, que ya está escrita. */
function oblAnadirAvisos_(avisos) {
  if (!avisos || !avisos.length) return 0;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_AVISOS);
  if (!hoja) return 0;
  avisos.sort(function (a, b) {
    const ka = a.curso + '|' + a.grupo + '|' + normalizar(a.alumno);
    const kb = b.curso + '|' + b.grupo + '|' + normalizar(b.alumno);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  const filas = avisos.map(function (a) {
    return [a.curso, a.grupo, a.alumno, a.aviso, a.detalle, '', ''];
  });
  if (hoja.getMaxColumns() < 7) hoja.insertColumnsAfter(hoja.getMaxColumns(), 7 - hoja.getMaxColumns());
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 7).setValues(filas);
  return filas.length;
}

/*** ================= LO QUE LLAMA PANEL.GS ================= ***/

/* Lee los CSV de matrícula, comprueba cada curso contra la pestaña
   MATERIAS OBLIGATORIAS y anota en AVISOS a quien le falte alguna.
   Si la pestaña no existe, la crea antes con una propuesta. */
function comprobarObligatorias_() {
  const ficheros = buscarCsvsMatricula();
  const cursos = Object.keys(ficheros).sort();
  const tablas = {};
  for (let i = 0; i < cursos.length; i++) {
    tablas[cursos[i]] = textoATabla(textoDeArchivo(ficheros[cursos[i]]));
  }

  let filas = oblLeerTabla_();
  let sembrada = false;
  if (!filas) {
    let propuesta = [];
    for (let i = 0; i < cursos.length; i++) {
      propuesta = propuesta.concat(oblProponerCurso_(tablas[cursos[i]], cursos[i]));
    }
    if (!propuesta.length) return { alumnos: 0, escritos: 0, sembrada: false, lineas: 0 };
    oblEscribirTabla_(propuesta);
    filas = propuesta.map(function (p) {
      return { curso: p.curso, materia: p.materia, quien: p.quien, desde: 0, hasta: 0 };
    });
    sembrada = true;
  }

  const ano = oblAnoActual_();
  let avisos = [];
  if (sembrada) {
    avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'Revisa la lista de materias obligatorias',
      detalle: 'He creado la pestaña "' + HOJA_OBLIGATORIAS + '" con ' + filas.length +
        ' líneas, sacadas de los propios ficheros de Séneca: las materias que cursa casi todo el ' +
        'mundo en cada curso. Repásala y corrígela. A partir de ahora manda lo que ponga ahí y ' +
        'el programa no la vuelve a tocar.' });
  }
  for (let i = 0; i < cursos.length; i++) {
    const vigentes = oblVigentes_(filas, cursos[i], ano);
    avisos = avisos.concat(oblAvisosDeCurso_(tablas[cursos[i]], cursos[i], vigentes));
  }

  const escritos = oblAnadirAvisos_(avisos);
  return { alumnos: avisos.length, escritos: escritos, sembrada: sembrada, lineas: filas.length };
}
