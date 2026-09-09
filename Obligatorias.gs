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
/* Bachillerato: una materia puede ser obligatoria en una modalidad y no
   existir en la otra. Matemáticas lo es en Ciencias y Tecnología; Latín, en
   Humanidades. Por eso hacen falta dos respuestas más. */
const OBL_CIENCIAS   = 'Solo Ciencias y Tecnología';
const OBL_HUMANIDADES = 'Solo Humanidades y CC. Sociales';

/* Y DENTRO DE CADA MODALIDAD ESTÁN LOS ITINERARIOS. Lo señaló Francisco el
   9-sep-2026: buscando solo por modalidad salían pocas obligatorias.

   Un itinerario no viene escrito en ninguna parte del CSV de Séneca. Pero se
   reconoce por una materia: quien cursa Latín va por el itinerario de
   Humanidades; quien cursa Matemáticas Aplicadas a las Ciencias Sociales, por
   el de Ciencias Sociales. Por eso la respuesta se escribe así:

       Solo quienes cursan Latín
       Solo quienes cursan Matemáticas Aplicadas a las Ciencias Sociales

   Y entonces esa materia se le exige solo a quien curse la que va detrás.

   Medido sobre el curso 26-27: en 1º de Humanidades, Economía la cursa el 86 %
   del grupo entero, pero el 100 % de quienes van por Ciencias Sociales. Sin
   los itinerarios, esa materia se quedaba fuera de la lista. */
const OBL_CONDICION = 'Solo quienes cursan ';

/* Solo para la propuesta de la primera vez: a partir de qué parte del curso se
   supone que una materia es obligatoria. No se usa para comprobar nada; para
   eso manda la pestaña. */
const OBL_UMBRAL = 0.85;
const OBL_UMBRAL_DIVER = 0.70;      // los de diversificación son pocos por curso
const OBL_MINIMO_ALUMNOS = 20;
/* En Bachillerato el listón se pone más alto, y hay un motivo medido. En la
   ESO casi todas las materias del curso son obligatorias. En Bachillerato la
   mitad de lo que cursa el alumno lo elige él, y algunas de esas elecciones
   las hace casi todo el mundo: en 1º de Humanidades, Economía la cursa el 86 %
   y no es obligatoria. Con el listón de la ESO se colarían en la propuesta y
   Francisco tendría que borrarlas a mano una por una. Medido sobre el curso
   26-27, las obligatorias de verdad están todas en el 97 % o más. */
const OBL_UMBRAL_BAC = 0.95;
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
  if (n.indexOf('solo quienes cursan') === 0) return 'condicion';
  if (n.indexOf('solo ciencias') === 0) return 'ciencias';
  if (n.indexOf('solo human') === 0) return 'humanidades';
  return 'todos';
}

/* De "Solo quienes cursan Latín" saca "Latín". Devuelve '' si no es una
   respuesta de ese tipo. */
function oblCondicion_(texto) {
  const t = String(texto === null || texto === undefined ? '' : texto).trim();
  if (normalizar(t).indexOf('solo quienes cursan') !== 0) return '';
  return t.substring(OBL_CONDICION.length).trim();
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
    'Quién la cursa: en la ESO, el alumnado de diversificación cursa los Ámbitos en vez de las ' +
    'materias sueltas. En Bachillerato hay dos cosas más: la MODALIDAD ("Solo Ciencias y ' +
    'Tecnología", "Solo Humanidades y CC. Sociales") y el ITINERARIO, que no viene escrito en ' +
    'Séneca y se reconoce por una materia: escribe "Solo quienes cursan Latín" y esa materia se ' +
    'le exigirá solo a quien curse Latín.\n' +
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
      .requireValueInList([OBL_TODOS, OBL_ORDINARIO, OBL_DIVER,
                           OBL_CIENCIAS, OBL_HUMANIDADES], true)
      .setAllowInvalid(true).build();
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

/*** ================= BACHILLERATO ================= ***/

/* En Bachillerato no hay diversificación, pero hay MODALIDADES, y una materia
   obligatoria de una modalidad ni siquiera aparece en el fichero de la otra.
   Cada CSV de Bachillerato es de una sola modalidad, así que la modalidad no
   se mira alumno por alumno: se sabe por el fichero que se está leyendo.

   Y hay un tercer valor de celda, APRO, que quiere decir que el alumno ya
   aprobó esa materia y este año no la cursa. Un repetidor de 2º solo se
   matricula de lo que le quedó, así que:
     - para PROPONER, los repetidores no cuentan: falsearían el porcentaje;
     - para COMPROBAR, un APRO vale igual que un MATR: esa materia no le falta,
       la tiene aprobada. */

function oblEsRepetidorBac_(fila) {
  for (let c = 0; c < fila.length; c++) {
    const v = String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim().toUpperCase();
    if (v === MARCA_APROBADA) return true;
  }
  return false;
}

function oblCumpleBac_(v) {
  const t = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
  return t === MARCA || t === OBL_CONVALIDADA || t === MARCA_APROBADA;
}

/* Las materias que cursa casi todo el mundo en UN fichero de Bachillerato.
   Devuelve un objeto { nombre exacto de la materia: true }. */
function oblObligatoriasDeUnFicheroBac_(tabla) {
  const salida = {};
  if (!tabla || tabla.length < 2) return salida;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return salida;

  const alumnos = [];
  for (let f = 1; f < tabla.length; f++) {
    const nombre = String(tabla[f][C.iNombre] || '').trim();
    if (!nombre) continue;
    if (oblEsRepetidorBac_(tabla[f])) continue;      // ver el comentario de arriba
    alumnos.push(tabla[f]);
  }
  if (alumnos.length < OBL_MINIMO_ALUMNOS) return salida;

  for (let c = 0; c < C.cab.length; c++) {
    if (c === C.iNombre || c === C.iUnidad) continue;
    if (!C.cab[c]) continue;
    if (pendienteDeBac_(C.cab[c])) continue;         // materias pendientes de 1º
    let n = 0;
    for (let a = 0; a < alumnos.length; a++) {
      if (oblCumpleBac_(alumnos[a][c])) n++;
    }
    if (n / alumnos.length >= OBL_UMBRAL_BAC) salida[C.cab[c]] = true;
  }
  return salida;
}

/* Cuántos alumnos hacen falta en un itinerario para tomárselo en serio, y
   hasta qué parte del fichero puede llegar: si una materia la cursa casi todo
   el mundo, no separa a nadie y no es un itinerario. */
const OBL_MINIMO_ITINERARIO = 10;
const OBL_MAXIMO_ITINERARIO = 0.85;

/* Busca los itinerarios dentro de UN fichero de Bachillerato.

   La idea: si al quedarse solo con quienes cursan una materia aparecen otras
   materias que ese grupo cursa AL COMPLETO, y que en el fichero entero no lo
   estaban, esa materia está marcando un itinerario.

   Devuelve una lista de { definitoria, materias }. */
function oblItinerariosDeUnFicheroBac_(tabla, yaObligatorias) {
  const salida = [];
  if (!tabla || tabla.length < 2) return salida;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return salida;

  const alumnos = [];
  for (let f = 1; f < tabla.length; f++) {
    const nombre = String(tabla[f][C.iNombre] || '').trim();
    if (!nombre) continue;
    if (oblEsRepetidorBac_(tabla[f])) continue;
    alumnos.push(tabla[f]);
  }
  if (alumnos.length < OBL_MINIMO_ALUMNOS) return salida;

  const cols = [];
  for (let c = 0; c < C.cab.length; c++) {
    if (c === C.iNombre || c === C.iUnidad) continue;
    if (!C.cab[c]) continue;
    if (pendienteDeBac_(C.cab[c])) continue;
    if (yaObligatorias[C.cab[c]]) continue;      // ya es de todo el mundo
    cols.push(c);
  }

  const candidatos = [];
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const grupo = [];
    for (let a = 0; a < alumnos.length; a++) {
      if (oblCumpleBac_(alumnos[a][c])) grupo.push(alumnos[a]);
    }
    if (grupo.length < OBL_MINIMO_ITINERARIO) continue;
    if (grupo.length / alumnos.length > OBL_MAXIMO_ITINERARIO) continue;

    const propias = [];
    for (let j = 0; j < cols.length; j++) {
      const c2 = cols[j];
      if (c2 === c) continue;
      let n = 0;
      for (let a = 0; a < grupo.length; a++) if (oblCumpleBac_(grupo[a][c2])) n++;
      if (n === grupo.length) propias.push(C.cab[c2]);
    }
    if (propias.length) {
      candidatos.push({ definitoria: C.cab[c], materias: propias, cuantos: grupo.length });
    }
  }

  /* Dos materias distintas pueden llevar a la MISMA lista, simplemente porque
     las cursa la misma gente. Se queda la del grupo más grande, que es la que
     de verdad define el itinerario. Ejemplo real: en 1º de Humanidades tanto
     "Matemáticas Aplicadas a las Ciencias Sociales" (31 alumnos) como "Cultura
     Emprendedora y Empresarial" (18) llevaban a Economía. */
  const porLista = {};
  for (let i = 0; i < candidatos.length; i++) {
    const clave = candidatos[i].materias.slice().sort().join(' | ');
    if (!porLista[clave] || candidatos[i].cuantos > porLista[clave].cuantos) {
      porLista[clave] = candidatos[i];
    }
  }
  for (const k in porLista) salida.push(porLista[k]);
  return salida;
}

/* La propuesta de un curso de Bachillerato, mirando sus dos modalidades.
   Una materia que sale en las dos es de todo el alumnado del curso; una que
   sale en una sola es de esa modalidad. */
function oblProponerBachillerato_(porModalidad, curso) {
  const propuesta = [], deCiencias = {}, deHumanidades = {};
  for (let i = 0; i < porModalidad.length; i++) {
    const encontradas = oblObligatoriasDeUnFicheroBac_(porModalidad[i].tabla);
    const destino = porModalidad[i].modalidad === MODALIDAD_HUMANIDADES ? deHumanidades : deCiencias;
    for (const m in encontradas) destino[m] = true;
  }
  const todas = {};
  for (const m in deCiencias) todas[m] = true;
  for (const m in deHumanidades) todas[m] = true;

  const nombres = Object.keys(todas).sort();
  for (let i = 0; i < nombres.length; i++) {
    const m = nombres[i];
    let quien;
    if (deCiencias[m] && deHumanidades[m]) quien = OBL_TODOS;
    else if (deCiencias[m]) quien = OBL_CIENCIAS;
    else quien = OBL_HUMANIDADES;
    propuesta.push({ curso: curso, materia: m, quien: quien, desde: '', hasta: '' });
  }

  /* Y ahora, dentro de cada modalidad, los itinerarios. */
  const puestas = {};
  for (let i = 0; i < porModalidad.length; i++) {
    const its = oblItinerariosDeUnFicheroBac_(porModalidad[i].tabla, todas);
    for (let k = 0; k < its.length; k++) {
      const quien = OBL_CONDICION + its[k].definitoria;
      for (let j = 0; j < its[k].materias.length; j++) {
        const clave = its[k].materias[j] + '||' + quien;
        if (puestas[clave]) continue;
        puestas[clave] = true;
        propuesta.push({ curso: curso, materia: its[k].materias[j], quien: quien,
                         desde: '', hasta: '' });
      }
    }
  }
  return propuesta;
}

/* Los avisos de un fichero de Bachillerato. */
function oblAvisosDeFicheroBac_(tabla, curso, modalidad, vigentes) {
  const avisos = [];
  if (!tabla || tabla.length < 2 || !vigentes.length) return avisos;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return avisos;

  const laOtra = modalidad === MODALIDAD_HUMANIDADES ? 'ciencias' : 'humanidades';
  const lista = [];
  for (let i = 0; i < vigentes.length; i++) {
    const quien = oblQuien_(vigentes[i].quien);
    if (quien === laOtra) continue;              // es de la otra modalidad
    if (quien === 'diver' || quien === 'ordinario') continue;   // eso es de la ESO
    const c = C.cabN.indexOf(normalizar(vigentes[i].materia));
    if (c === -1) continue;   // no está en ESTE fichero; puede estar en el de la otra modalidad

    /* Las líneas de itinerario solo se le exigen a quien cursa la materia que
       lo define. Si esa materia no está en este fichero, la línea es de la
       otra modalidad y aquí no pinta nada. */
    let colCond = -1;
    if (quien === 'condicion') {
      const cond = oblCondicion_(vigentes[i].quien);
      colCond = cond ? C.cabN.indexOf(normalizar(cond)) : -1;
      if (colCond === -1) continue;
    }
    lista.push({ col: c, materia: vigentes[i].materia, colCond: colCond });
  }

  /* Cuántas materias cursa cada alumno. Sirve para el aviso de más abajo. */
  const cuantas = [];
  for (let f = 1; f < tabla.length; f++) {
    if (!String(tabla[f][C.iNombre] || '').trim()) continue;
    let n = 0;
    for (let c = 0; c < C.cab.length; c++) {
      if (c === C.iNombre || c === C.iUnidad) continue;
      if (!C.cab[c] || pendienteDeBac_(C.cab[c])) continue;
      if (oblCumpleBac_(tabla[f][c])) n++;
    }
    cuantas.push(n);
  }
  const ordenadas = cuantas.slice().sort(function (a, b) { return a - b; });
  const mediana = ordenadas.length ? ordenadas[Math.floor(ordenadas.length / 2)] : 0;
  const minimo = Math.max(3, Math.floor(mediana / 2));

  let iAlumno = -1;
  for (let f = 1; f < tabla.length; f++) {
    const nombre = String(tabla[f][C.iNombre] || '').trim();
    if (!nombre) continue;
    iAlumno++;
    const unidad = C.iUnidad === -1 ? '' : String(tabla[f][C.iUnidad] || '').trim();

    /* MATRÍCULA A MEDIAS. No es que le falte una materia obligatoria: es que
       apenas tiene materias. Casi siempre es una matrícula que se quedó sin
       terminar en Séneca. Sin esta comprobación no se veía, porque las cuatro
       materias comunes sí las tenía. */
    if (cuantas[iAlumno] < minimo) {
      avisos.push({ curso: curso, grupo: unidad, alumno: nombre,
        aviso: 'Matrícula incompleta en Séneca',
        detalle: 'Solo está matriculado en ' + cuantas[iAlumno] + ' materias, y en su grupo lo ' +
          'normal son ' + mediana + '. Parece una matrícula sin terminar. Modalidad: ' + modalidad + '.' });
      continue;
    }

    const faltan = [];
    for (let i = 0; i < lista.length; i++) {
      const m = lista[i];
      if (m.colCond !== -1 && !oblCumpleBac_(tabla[f][m.colCond])) continue;
      if (!oblCumpleBac_(tabla[f][m.col])) faltan.push(m.materia);
    }
    if (!faltan.length) continue;
    avisos.push({ curso: curso, grupo: unidad, alumno: nombre,
      aviso: 'Le faltan materias obligatorias en Séneca',
      detalle: 'No está matriculado en: ' + faltan.join(', ') + '. Modalidad: ' + modalidad +
        '. Compruébalo en Séneca, o corrige la pestaña "' + HOJA_OBLIGATORIAS +
        '" si esa materia ya no es obligatoria.' });
  }
  return avisos;
}

/* Añade al final de la pestaña las líneas de los cursos que todavía no están.
   La pestaña la manda Francisco y el programa NO la reescribe: aquí solo se
   AÑADEN cursos nuevos, sin tocar ni una línea de las que ya hay. Hace falta
   porque la pestaña se creó cuando el sistema solo llevaba la ESO. */
function oblAnadirCursos_(nuevas) {
  if (!nuevas.length) return 0;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_OBLIGATORIAS);
  if (!hoja) return 0;
  const ancho = TITULOS_OBLIGATORIAS.length;
  if (hoja.getMaxColumns() < ancho) hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());
  const valores = nuevas.map(function (f) {
    return [f.curso, f.materia, f.quien, f.desde || '', f.hasta || '', ''];
  });
  const primera = hoja.getLastRow() + 1;
  hoja.getRange(primera, 1, valores.length, ancho).setValues(valores);
  /* El desplegable de la pestaña se creó con tres respuestas y ahora hay
     cinco. Se vuelve a poner en toda la columna, o las dos nuevas saldrían
     marcadas como error. */
  try {
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList([OBL_TODOS, OBL_ORDINARIO, OBL_DIVER,
                           OBL_CIENCIAS, OBL_HUMANIDADES], true)
      .setAllowInvalid(true).build();
    hoja.getRange(3, 3, hoja.getLastRow() - 2 + 200, 1).setDataValidation(regla);
  } catch (e) { /* sin desplegable se escribe a mano */ }
  return valores.length;
}

/*** ============ LAS QUE SE QUEDAN A LAS PUERTAS ============ ***/

/* A partir de qué porcentaje una materia merece que Francisco decida si es
   obligatoria, y cuántas se le llevan como mucho para no llenar AVISOS. */
const OBL_CANDIDATA = 0.80;
const OBL_MAX_CANDIDATAS = 15;

/* Las materias que casi todo un itinerario cursa, pero no todo, y que no están
   todavía en la pestaña.

   POR QUÉ ESTO ES UN AVISO Y NO UNA LÍNEA MÁS DE LA PESTAÑA. El programa solo
   puede ver cuánta gente cursa cada materia. Que la cursen 27 de 28 puede
   querer decir dos cosas muy distintas: que es obligatoria y a uno le falta en
   Séneca, o que es una elección que casi todos hacen. Eso no se deduce de los
   datos: está en la normativa y en la documentación del centro, y lo sabe
   Francisco. Así que el programa no decide: pregunta, y espera.

   Cada una sale como una fila de AVISOS, con su columna Estado, así que se
   contesta marcándola. Lo que se marque no se vuelve a preguntar.

   Ojo: aquí también caen elecciones del alumno que casi todos hacen, como la
   religión. Se dicen igual, porque el programa no sabe distinguirlas, y se
   despachan marcándolas "No procede" una vez. */
function oblCandidatasDeUnFicheroBac_(tabla, curso, modalidad, yaEnLaPestana, itinerarios) {
  const salida = [];
  if (!tabla || tabla.length < 2) return salida;
  const C = oblColumnas_(tabla);
  if (C.iNombre === -1) return salida;

  const alumnos = [];
  for (let f = 1; f < tabla.length; f++) {
    const nombre = String(tabla[f][C.iNombre] || '').trim();
    if (!nombre) continue;
    if (oblEsRepetidorBac_(tabla[f])) continue;
    alumnos.push(tabla[f]);
  }
  if (alumnos.length < OBL_MINIMO_ALUMNOS) return salida;

  const cols = [];
  for (let c = 0; c < C.cab.length; c++) {
    if (c === C.iNombre || c === C.iUnidad) continue;
    if (!C.cab[c] || pendienteDeBac_(C.cab[c])) continue;
    cols.push(c);
  }

  /* Los grupos donde se mira: la modalidad entera, y los itinerarios que ya se
     conocen, que son los que están declarados en la pestaña con "Solo quienes
     cursan...". NO se prueba con todas las materias del fichero: eso sacaba
     parejas sin sentido, como "el 92 % de quienes cursan Química cursa
     Religión". Un itinerario es algo que existe en el centro, no cualquier
     coincidencia entre dos materias. */
  const grupos = [{ nombre: '', alumnos: alumnos }];
  for (let i = 0; i < itinerarios.length; i++) {
    const c = C.cabN.indexOf(normalizar(itinerarios[i]));
    if (c === -1) continue;
    const g = [];
    for (let a = 0; a < alumnos.length; a++) if (oblCumpleBac_(alumnos[a][c])) g.push(alumnos[a]);
    if (g.length < OBL_MINIMO_ITINERARIO) continue;
    grupos.push({ nombre: itinerarios[i], alumnos: g });
  }

  for (let k = 0; k < grupos.length; k++) {
    const g = grupos[k];
    const quien = g.nombre ? OBL_CONDICION + g.nombre : (modalidad || '');
    for (let i = 0; i < cols.length; i++) {
      const m = C.cab[cols[i]];
      if (m === g.nombre) continue;
      const clave = normalizar(curso) + '|' + normalizar(m);
      if (yaEnLaPestana[clave]) continue;
      let n = 0;
      for (let a = 0; a < g.alumnos.length; a++) if (oblCumpleBac_(g.alumnos[a][cols[i]])) n++;
      const p = n / g.alumnos.length;
      if (p < OBL_CANDIDATA || p >= 1) continue;
      salida.push({ curso: curso, materia: m, modalidad: modalidad, itinerario: g.nombre,
                    quien: quien, cuantos: n, total: g.alumnos.length, parte: p });
    }
  }
  return salida;
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

  /* BACHILLERATO. Son dos ficheros por curso, uno por modalidad, así que aquí
     no hay una tabla por curso sino una lista de tablas. Ver Bachillerato.gs. */
  const bacPorCurso = {};
  const fichBac = ficherosBachilleratoPorCurso_();
  const cursosBac = Object.keys(fichBac).sort();
  for (let i = 0; i < cursosBac.length; i++) {
    const lista = fichBac[cursosBac[i]];
    bacPorCurso[cursosBac[i]] = [];
    for (let j = 0; j < lista.length; j++) {
      const tabla = textoATabla(textoDeArchivo(lista[j].archivo));
      let modalidad = lista[j].modalidad;
      if (!modalidad && tabla.length) modalidad = modalidadPorLasMaterias_(tabla[0]);
      bacPorCurso[cursosBac[i]].push({ tabla: tabla, modalidad: modalidad });
    }
  }

  let filas = oblLeerTabla_();
  let sembrada = false;
  if (!filas) {
    let propuesta = [];
    for (let i = 0; i < cursos.length; i++) {
      propuesta = propuesta.concat(oblProponerCurso_(tablas[cursos[i]], cursos[i]));
    }
    for (let i = 0; i < cursosBac.length; i++) {
      propuesta = propuesta.concat(oblProponerBachillerato_(bacPorCurso[cursosBac[i]], cursosBac[i]));
    }
    if (!propuesta.length) return { alumnos: 0, escritos: 0, sembrada: false, lineas: 0 };
    oblEscribirTabla_(propuesta);
    filas = propuesta.map(function (p) {
      return { curso: p.curso, materia: p.materia, quien: p.quien, desde: 0, hasta: 0 };
    });
    sembrada = true;
  }

  /* CURSOS QUE TODAVÍA NO ESTÁN EN LA PESTAÑA. Pasa con Bachillerato: la
     pestaña se creó cuando el sistema solo llevaba la ESO. Se AÑADEN al final,
     sin tocar ni una línea de las que ya hay, y se avisa para que Francisco las
     repase igual que repasó las de la ESO. */
  const cursosAnadidos = [];
  if (!sembrada && cursosBac.length) {
    let nuevas = [];
    for (let i = 0; i < cursosBac.length; i++) {
      const cu = cursosBac[i];
      if (oblVigentes_(filas, cu, 0).length) continue;
      let hayAlguna = false;
      for (let k = 0; k < filas.length; k++) {
        if (normalizar(filas[k].curso) === normalizar(cu)) { hayAlguna = true; break; }
      }
      if (hayAlguna) continue;
      const p = oblProponerBachillerato_(bacPorCurso[cu], cu);
      if (!p.length) continue;
      nuevas = nuevas.concat(p);
      cursosAnadidos.push(cu);
    }
    if (nuevas.length) {
      oblAnadirCursos_(nuevas);
      for (let k = 0; k < nuevas.length; k++) {
        filas.push({ curso: nuevas[k].curso, materia: nuevas[k].materia,
                     quien: nuevas[k].quien, desde: 0, hasta: 0 });
      }
    }
  }

  const ano = oblAnoActual_();
  let avisos = [];
  if (cursosAnadidos.length) {
    avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'Revisa las materias obligatorias de Bachillerato',
      detalle: 'He añadido al final de la pestaña "' + HOJA_OBLIGATORIAS + '" las materias de ' +
        cursosAnadidos.join(' y ') + ', sacadas de los propios ficheros de Séneca: las que cursa ' +
        'casi todo el mundo. Las de la ESO no las he tocado. Repásalas: en Bachillerato una ' +
        'materia puede ser obligatoria en una modalidad y no existir en la otra, y eso se dice ' +
        'en la columna "Quién la cursa".' });
  }
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
  for (let i = 0; i < cursosBac.length; i++) {
    const cu = cursosBac[i];
    const vigentes = oblVigentes_(filas, cu, ano);
    const lista = bacPorCurso[cu];
    for (let j = 0; j < lista.length; j++) {
      avisos = avisos.concat(
        oblAvisosDeFicheroBac_(lista[j].tabla, cu, lista[j].modalidad, vigentes));
    }
  }

  /* LAS QUE SE QUEDAN A LAS PUERTAS. Se preguntan en AVISOS, una por fila, con
     su casilla Estado. Lo que Francisco marque no se vuelve a preguntar. */
  const yaEnLaPestana = {};
  for (let k = 0; k < filas.length; k++) {
    yaEnLaPestana[normalizar(filas[k].curso) + '|' + normalizar(filas[k].materia)] = true;
  }
  /* Los itinerarios que ya están declarados en la pestaña, con la forma
     "Solo quienes cursan Latín". Son los que el programa conoce. */
  const itinerariosDeclarados = [];
  for (let k = 0; k < filas.length; k++) {
    const cond = oblCondicion_(filas[k].quien);
    if (cond && itinerariosDeclarados.indexOf(cond) === -1) itinerariosDeclarados.push(cond);
  }

  let candidatas = [];
  for (let i = 0; i < cursosBac.length; i++) {
    const cu = cursosBac[i];
    const lista = bacPorCurso[cu];
    for (let j = 0; j < lista.length; j++) {
      candidatas = candidatas.concat(
        oblCandidatasDeUnFicheroBac_(lista[j].tabla, cu, lista[j].modalidad,
                                     yaEnLaPestana, itinerariosDeclarados));
    }
  }
  /* Una misma materia puede salir por su modalidad y por un itinerario. Se
     queda la del grupo donde más se cursa, que es la que mejor la explica. */
  const mejor = {};
  for (let i = 0; i < candidatas.length; i++) {
    const c = candidatas[i];
    const k = normalizar(c.curso) + '|' + normalizar(c.materia);
    if (!mejor[k] || c.parte > mejor[k].parte) mejor[k] = c;
  }
  const unicas = [];
  for (const k in mejor) unicas.push(mejor[k]);
  unicas.sort(function (a, b) { return b.parte - a.parte; });
  for (let i = 0; i < unicas.length && i < OBL_MAX_CANDIDATAS; i++) {
    const c = unicas[i];
    const donde = c.itinerario ? 'quienes cursan ' + c.itinerario : 'la modalidad de ' + c.modalidad;
    avisos.push({ curso: c.curso, grupo: c.modalidad, alumno: '',
      aviso: 'Decide si esta materia es obligatoria: ' + c.materia,
      detalle: 'La cursan ' + c.cuantos + ' de ' + c.total + ' (' + Math.round(c.parte * 100) +
        ' %) de ' + donde + '. Si es obligatoria, añádela a la pestaña "' + HOJA_OBLIGATORIAS +
        '" con Curso "' + c.curso + '" y "Quién la cursa" = "' + c.quien + '". Si es una ' +
        'elección del alumno, marca esta fila como "No procede" y no se vuelve a preguntar.' });
  }

  const escritos = oblAnadirAvisos_(avisos);
  return { alumnos: avisos.length, escritos: escritos, sembrada: sembrada, lineas: filas.length };
}
