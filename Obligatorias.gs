/*** ================= LAS MATERIAS OBLIGATORIAS =================
 *
 * POR QUÉ EXISTE ESTE FICHERO (8-sep-2026, lo vio Francisco).
 *
 * La comparación con el fichero de Jefatura (Jefatura.gs) solo mira las
 * asignaturas que el alumno ELIGE: la optativa, la religión, la exención de
 * francés y, en 4º, Matemáticas A/B y las cuatro opciones. Son las únicas que
 * Jefatura escribe en su cuaderno.
 *
 * Las materias obligatorias (Lengua, Matemáticas, Inglés, Geografía e
 * Historia, Educación Física...) no están en el fichero de Jefatura, así que
 * no había nada con lo que compararlas. Resultado: nadie comprobaba que el
 * alumno estuviera matriculado en ellas en Séneca. Si a alguien le faltaba
 * una, no se enteraba nadie.
 *
 * NO HACE FALTA JEFATURA PARA COMPROBARLO. El CSV de matrícula de Séneca trae
 * una columna por asignatura, así que basta con mirar, dentro de cada curso,
 * qué materias tiene casi todo el mundo: esas son las obligatorias. Quien no
 * tenga alguna de ellas sale en AVISOS.
 *
 * LA LISTA DE MATERIAS OBLIGATORIAS NO ESTÁ ESCRITA A MANO EN NINGÚN SITIO.
 * Se saca de los propios datos en cada ejecución. Una lista escrita a mano se
 * queda vieja en cuanto cambia el currículo o se cambia el nombre de una
 * asignatura, y nadie se entera. Es la regla del punto 10 del CONTEXTO.
 *
 * QUÉ SE DEJA FUERA DEL CÁLCULO:
 *   - Las asignaturas de elección, que ya están listadas en REGLAS
 *     (Codigo.gs): optativas, religión, francés, Matemáticas A/B, opciones.
 *   - Los dos Ámbitos, que son de diversificación.
 *   - Las columnas de materias pendientes de cursos anteriores, que se
 *     reconocen porque el título acaba en "(2º de E.S.O.)".
 *   - El alumnado de diversificación, que en vez de las materias sueltas
 *     cursa los Ámbitos: si contara, sus materias parecerían un fallo.
 *   - Las columnas que no son de asignatura (fecha de nacimiento, teléfono...).
 *     Se reconocen porque llevan algo que no es MATR, PEND ni CONV.
 *
 * DÓNDE SE ESCRIBE. Este fichero NO construye la pestaña AVISOS: la construye
 * Codigo.gs. Aquí solo se AÑADEN filas al final, cuando ya está escrita. La
 * llamada está en Panel.gs, justo después de construir la tabla y ANTES de
 * recuperar las anotaciones de Francisco, para que estas filas también
 * conserven su Estado y sus Observaciones.
 *
 * ======================================================== ***/

/* A partir de qué parte del curso se considera que una materia es obligatoria.
   Con 0,85: una materia que curse el 85% del curso o más ya cuenta como
   obligatoria, y quien no la tenga sale en AVISOS. Las optativas no llegan
   ahí (la más cursada del centro, el francés de 1º, ronda el 80%) y además
   están excluidas por su nombre. */
const OBL_UMBRAL = 0.85;

/* Por debajo de este número de alumnos no se calcula nada: con pocos datos un
   porcentaje no dice nada. */
const OBL_MINIMO_ALUMNOS = 20;

/* Valor de Séneca para una asignatura convalidada. Cuenta como matriculada.
   MATR y PEND están en Codigo.gs. */
const OBL_CONVALIDADA = 'CONV';

/* Columnas que son de asignatura pero no las cursa todo el mundo: son las de
   diversificación. Sin esto saldrían como obligatorias que le faltan a casi
   todo el centro. */
const OBL_FUERA = ['Ámbito Científico-Tecnológico', 'Ámbito Lingüístico y Social'];

/*** ================= LÓGICA PURA ================= ***/

/* Los títulos de asignatura que NO hay que mirar, porque el alumno los elige.
   Salen de REGLAS, en Codigo.gs, que es donde ya están escritos: así, cuando
   se añada una optativa nueva allí, aquí se tiene en cuenta sola. */
function oblTitulosDeEleccion_(curso) {
  const fuera = {};
  for (let i = 0; i < OBL_FUERA.length; i++) fuera[normalizar(OBL_FUERA[i])] = true;
  const reglas = REGLAS[curso] || [];
  for (let k = 0; k < reglas.length; k++) {
    for (const asig in reglas[k].codigos) fuera[normalizar(asig)] = true;
  }
  return fuera;
}

/* Mira el CSV de matrícula de un curso y devuelve un aviso por cada alumno al
   que le falte alguna materia obligatoria. */
function oblAvisosDeCurso_(tabla, curso) {
  const avisos = [];
  if (!tabla || tabla.length < 2) return avisos;

  const cab = tabla[0].map(function (t) {
    return String(t === null || t === undefined ? '' : t).trim();
  });
  const cabN = cab.map(normalizar);
  const iNombre = cabN.indexOf(normalizar('Alumno/a'));
  const iUnidad = cabN.indexOf(normalizar('Unidad'));
  const iAmb = cabN.indexOf(normalizar(COL_AMBITOS));
  if (iNombre === -1) return avisos;

  const fuera = oblTitulosDeEleccion_(curso);

  /* 1. Qué columnas podrían ser materias obligatorias. */
  const candidatas = [];
  for (let c = 0; c < cab.length; c++) {
    if (c === iNombre || c === iUnidad) continue;
    if (!cab[c]) continue;
    if (fuera[cabN[c]]) continue;
    /* Las columnas de pendientes llevan el curso entre paréntesis:
       "Matemáticas (2º de E.S.O.)". Son otra cosa. */
    if (/\(([1-4])º de E\.S\.O\.\)$/.test(cab[c])) continue;
    candidatas.push(c);
  }

  /* 2. Qué alumnos cuentan: todos menos los de diversificación, que cursan los
        Ámbitos en vez de las materias sueltas. */
  const alumnos = [];
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const nombre = String(fila[iNombre] === null || fila[iNombre] === undefined ? '' : fila[iNombre]).trim();
    if (!nombre) continue;
    const esAmb = iAmb !== -1 && String(fila[iAmb] || '').trim().toUpperCase() === MARCA;
    if (esAmb) continue;
    alumnos.push({ nombre: nombre,
                   unidad: iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim(),
                   fila: fila });
  }
  if (alumnos.length < OBL_MINIMO_ALUMNOS) return avisos;

  /* 3. Cuáles de las candidatas son de verdad asignaturas obligatorias.
        Una columna de asignatura solo puede llevar MATR, PEND, CONV o nada.
        Si trae cualquier otra cosa (una fecha, un número, un texto), no es una
        asignatura y se descarta. */
  const obligatorias = [];
  for (let k = 0; k < candidatas.length; k++) {
    const c = candidatas[k];
    let matriculados = 0, esAsignatura = true;
    for (let f = 0; f < alumnos.length; f++) {
      const bruto = alumnos[f].fila[c];
      const v = String(bruto === null || bruto === undefined ? '' : bruto).trim().toUpperCase();
      if (!v) continue;
      if (v === MARCA || v === OBL_CONVALIDADA) { matriculados++; continue; }
      if (v === PEND) continue;
      esAsignatura = false;
      break;
    }
    if (!esAsignatura) continue;
    if (matriculados / alumnos.length < OBL_UMBRAL) continue;
    obligatorias.push(c);
  }
  if (!obligatorias.length) return avisos;

  /* 4. A quién le falta alguna. Un aviso por alumno, con todas las suyas. */
  for (let f = 0; f < alumnos.length; f++) {
    const faltan = [];
    for (let k = 0; k < obligatorias.length; k++) {
      const bruto = alumnos[f].fila[obligatorias[k]];
      const v = String(bruto === null || bruto === undefined ? '' : bruto).trim().toUpperCase();
      if (v !== MARCA && v !== OBL_CONVALIDADA) faltan.push(cab[obligatorias[k]]);
    }
    if (!faltan.length) continue;
    avisos.push({ curso: curso, grupo: alumnos[f].unidad, alumno: alumnos[f].nombre,
      aviso: 'Le faltan materias obligatorias en Séneca',
      detalle: 'No está matriculado en: ' + faltan.join(', ') + '. ' +
        'El resto de su curso sí lo está, así que lo más probable es que sea un fallo de la ' +
        'matrícula. Compruébalo en Séneca.' });
  }
  return avisos;
}

/*** ================= ESCRITURA ================= ***/

/* Añade las filas al final de la pestaña AVISOS, que ya está escrita.
   Van ordenadas por grupo y alumno entre ellas. */
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

/* Lee los CSV de matrícula de los cuatro cursos y anota en AVISOS a quien le
   falte alguna materia obligatoria. Devuelve cuántos alumnos son. */
function comprobarObligatorias_() {
  const ficheros = buscarCsvsMatricula();
  const cursos = Object.keys(ficheros).sort();
  let avisos = [];
  for (let i = 0; i < cursos.length; i++) {
    const tabla = textoATabla(textoDeArchivo(ficheros[cursos[i]]));
    avisos = avisos.concat(oblAvisosDeCurso_(tabla, cursos[i]));
  }
  const escritos = oblAnadirAvisos_(avisos);
  return { alumnos: avisos.length, escritos: escritos, cursos: cursos.length };
}
