/*** ================= EXPEDIENTES DE SECUNDARIA =================
 *
 * Añadido en la BD v42, el 8-sep-2026, a partir de una corrección de
 * Francisco: "no podemos ver las matrículas de otros institutos desde Séneca,
 * pero eso no es del todo cierto. Si el otro instituto pertenece al Sistema
 * Educativo Andaluz sí podemos verlo."
 *
 * QUÉ PROBLEMA RESUELVE. El fichero RegAlum.csv es el registro de matrículas
 * DE ESTE CENTRO. Un alumno que repitió 2º en otro instituto y llegó aquí
 * después figura como si no lo hubiera repetido. Su PIL salía mal.
 *
 * QUÉ ES ESTE FICHERO. El expediente académico de Secundaria del alumno,
 * descargado de Séneca uno a uno, igual que el de Primaria. Trae TODA su vida
 * en la ESO, con el centro de cada año, así que ve lo que RegAlum no ve.
 *
 * DÓNDE VA. En la subcarpeta "Expedientes Secundaria", dentro de
 * "Datos de matrícula". Cada fichero se llama:
 *
 *     RegDetExpEle SEC Apellido1 Apellido2, Nombre.csv
 *
 * EL NOMBRE DEL ALUMNO NO ESTÁ DENTRO DEL FICHERO, igual que en Primaria:
 * solo en el nombre del fichero. Por eso el cruce se hace por ahí.
 *
 * NO HACEN FALTA LOS DE TODOS. Descargarlos es un trabajo de uno en uno, y
 * son casi setecientos alumnos. Solo hace falta el de quien tenga algo sin
 * cuadrar en su trayectoria de ESO. El programa saca esa lista solo, en
 * AVISOS, con el aviso "Hace falta su expediente de Secundaria".
 *
 * MISMAS COLUMNAS QUE EL DE PRIMARIA. Comprobado sobre el primer fichero:
 *   Tipo de expediente · Curso · Año académico · Estado de matrícula ·
 *   Centro · Grupo de materias · Materias · Convocatoria · Calificaciones
 *
 * Cuatro diferencias en el CONTENIDO, y las cuatro están tratadas aquí:
 *   1. El curso viene como "2º de E.S.O. - Periodo 1".
 *   2. La convocatoria puede ser "Matriculada" o "Pendiente", y entonces la
 *      calificación viene vacía: es el curso en marcha, no una nota.
 *   3. El estado de matrícula puede venir vacío (el año actual) y puede ser
 *      "Trasladada", que no cuenta.
 *   4. Las materias pendientes de cursos anteriores salen como líneas
 *      propias, con el curso entre paréntesis: "Inglés (1º de E.S.O.)".
 *      Para contar suspensos SÍ cuentan: son materias con evaluación
 *      negativa, y eso es lo que decide la promoción.
 *
 * ======================================================== ***/

const CARPETA_SECUNDARIA = 'Expedientes Secundaria';
const PREFIJO_EXP_SEC = 'RegDetExpEle SEC';
const HOJA_SECUNDARIA = 'SECUNDARIA';

const TITULOS_SECUNDARIA = ['Alumno/a', 'Unidad', 'Curso el año pasado', 'Repetía el año pasado',
  'Suspensos el año pasado', 'Repeticiones en ESO', 'Cursos repetidos en ESO',
  'Años que trae', 'Centros', 'Fichero'];


/*** ================= LEER UNA LÍNEA ================= ***/

/* "2º de E.S.O. - Periodo 1"  ->  "2º".  Devuelve '' si no es un curso de ESO.
   Se apoya en nivelESO, de Codigo.gs, que ya entiende las formas que escribe
   Séneca. */
function cursoSecundaria_(texto) {
  return nivelESO(String(texto || '').trim());
}

/* "Inglés (1º de E.S.O.)"  ->  { materia: 'Inglés', de: '1º' }
   "Inglés"                 ->  { materia: 'Inglés', de: '' }              */
function partirMateriaSec_(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.*?)\s*\(([1-4])\s*º?\s*de\s+E\.?\s*S\.?\s*O\.?\)$/i);
  if (m) return { materia: m[1].trim(), de: m[2] + 'º' };
  return { materia: t, de: '' };
}

/* "RegDetExpEle SEC Maldonado Benítez, Abraham.csv" -> "Maldonado Benítez, Abraham" */
function nombreDelFicheroSec_(nombreFichero) {
  let t = String(nombreFichero || '').replace(/\.csv$/i, '');
  const p = normalizar(PREFIJO_EXP_SEC);
  if (normalizar(t).indexOf(p) === 0) t = t.substring(PREFIJO_EXP_SEC.length);
  return t.replace(/^[\s_-]+/, '').replace(/\s+/g, ' ').trim();
}


/*** ================= LEER UN EXPEDIENTE ================= ***/

function leerExpedienteSec_(archivo) {
  const alumno = nombreDelFicheroSec_(archivo.getName());
  const salida = {
    nombre: alumno, fichero: archivo.getName(),
    anos: [], centros: [], repeticiones: '', cursosRepetidos: [],
    cursoPasado: '', repetiaPasado: '', suspensosPasado: '',
    avisos: []
  };
  if (!alumno) {
    salida.avisos.push('El fichero "' + archivo.getName() + '" no lleva el nombre del alumno.');
    return salida;
  }

  const tabla = textoATabla(textoDeArchivo(archivo));
  if (tabla.length < 2) {
    salida.avisos.push('El fichero "' + archivo.getName() + '" está vacío.');
    return salida;
  }

  const cab = tabla[0].map(normalizar);
  const iCurso = cab.indexOf(normalizar('Curso'));
  const iAno = cab.indexOf(normalizar('Año académico'));
  const iEstado = cab.indexOf(normalizar('Estado de matrícula'));
  const iCentro = cab.indexOf(normalizar('Centro'));
  const iMateria = cab.indexOf(normalizar('Materias'));
  const iNota = cab.indexOf(normalizar('Calificaciones'));
  if (iCurso === -1 || iAno === -1) {
    salida.avisos.push('Al fichero "' + archivo.getName() + '" le faltan columnas. No lo he usado.');
    return salida;
  }

  /* Primera vuelta: en qué curso estuvo cada año, y en qué centro.
     Las líneas trasladadas no cuentan: si contaran, un traslado parecería una
     repetición. */
  const anosPorCurso = {};   // '2º' -> { 2024: true, 2025: true }
  const cursoDelAno = {};    // 2025 -> '2º'
  const centros = {};
  let ultimo = 0;
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const curso = cursoSecundaria_(fila[iCurso]);
    if (!curso) continue;
    const estado = iEstado === -1 ? '' : normalizar(fila[iEstado]);
    if (ESTADOS_QUE_NO_CUENTAN.indexOf(estado) !== -1) continue;
    const ano = parseInt(fila[iAno], 10);
    if (!ano) continue;
    if (!anosPorCurso[curso]) anosPorCurso[curso] = {};
    anosPorCurso[curso][ano] = true;
    cursoDelAno[ano] = curso;
    if (ano > ultimo) ultimo = ano;
    if (iCentro !== -1) {
      const c = String(fila[iCentro] || '').replace(/\s+/g, ' ').trim();
      if (c) centros[c] = true;
    }
  }
  if (!ultimo) {
    salida.avisos.push('El expediente de ' + alumno + ' no trae ningún curso de ESO.');
    return salida;
  }

  /* Cuántos cursos repitió y cuáles. Un curso que aparece en dos años
     académicos distintos es un curso repetido, esté donde esté el centro. */
  let repeticiones = 0;
  const repetidos = [];
  for (let n = 1; n <= 4; n++) {
    const curso = n + 'º';
    const anos = anosPorCurso[curso];
    if (!anos) continue;
    const lista = Object.keys(anos).sort();
    if (lista.length < 2) continue;
    repeticiones += lista.length - 1;
    repetidos.push(curso + ' (' + lista.join(', ') + ')');
  }
  salida.repeticiones = repeticiones;
  salida.cursosRepetidos = repetidos;
  salida.centros = Object.keys(centros);
  salida.anos = Object.keys(cursoDelAno).sort();

  /* El curso pasado, y si lo estaba repitiendo. Esto es lo que el histórico de
     este centro no puede saber cuando el alumno venía de otro instituto. */
  const anoPasado = ultimo - 1;
  const cursoPasado = cursoDelAno[anoPasado] || '';
  if (cursoPasado) {
    salida.cursoPasado = cursoPasado;
    let repetia = 'NO';
    const anosDeEse = Object.keys(anosPorCurso[cursoPasado]);
    for (let q = 0; q < anosDeEse.length; q++) {
      if (parseInt(anosDeEse[q], 10) < anoPasado) repetia = 'SÍ';
    }
    salida.repetiaPasado = repetia;
  } else {
    salida.avisos.push('El expediente de ' + alumno + ' no dice en qué curso estuvo el año ' +
      anoPasado + '. No he tocado su curso del año pasado.');
  }

  /* Cuántas materias suspendió el año pasado. Cuentan todas las que tienen
     evaluación negativa, incluidas las pendientes de cursos anteriores: es lo
     que decide la promoción. Una materia que sale dos veces (ordinaria y
     extraordinaria) se queda con la nota más alta. Una nota vacía no es un
     suspenso: es una materia en marcha o sin calificar todavía. */
  if (cursoPasado && iMateria !== -1 && iNota !== -1) {
    const mejores = {};
    for (let f = 1; f < tabla.length; f++) {
      const fila = tabla[f];
      if (parseInt(fila[iAno], 10) !== anoPasado) continue;
      if (!cursoSecundaria_(fila[iCurso])) continue;
      const estado = iEstado === -1 ? '' : normalizar(fila[iEstado]);
      if (ESTADOS_QUE_NO_CUENTAN.indexOf(estado) !== -1) continue;
      const p = partirMateriaSec_(fila[iMateria]);
      if (!p.materia) continue;
      const clave = normalizar(p.materia) + '|' + p.de;
      const nota = fila[iNota];
      const antes = mejores[clave];
      if (!antes || (esNumero(nota) && (!esNumero(antes) || aNumero(nota) > aNumero(antes)))) {
        mejores[clave] = nota;
      }
    }
    let suspensos = 0;
    for (const k in mejores) {
      if (esNumero(mejores[k]) && aNumero(mejores[k]) < 5) suspensos++;
    }
    salida.suspensosPasado = suspensos;
  }

  return salida;
}


/*** ================= LA CARPETA ================= ***/

let CACHE_CARPETA_SEC_;

function carpetaSecundaria_() {
  if (CACHE_CARPETA_SEC_ !== undefined) return CACHE_CARPETA_SEC_;
  let carpeta = null;
  try {
    const it = DriveApp.getFolderById(CARPETA_ID).getFoldersByName(CARPETA_SECUNDARIA);
    if (it.hasNext()) carpeta = it.next();
  } catch (e) { /* devolvemos null y no pasa nada: la fuente es opcional */ }
  CACHE_CARPETA_SEC_ = carpeta;
  return carpeta;
}


/*** ================= LO QUE LLAMA Codigo.gs ================= ***/

/* Devuelve { porNombre, avisos, total, ficheros }.
   Esta fuente es OPCIONAL: si no hay carpeta o no hay ficheros, devuelve un
   mapa vacío y el sistema sigue funcionando igual que antes, con el histórico
   de este centro. No se avisa de que falte la carpeta: es lo normal. */
function datosSecundaria_(cursosDeAlumno) {
  const avisos = [];
  const carpeta = carpetaSecundaria_();
  if (!carpeta) return { porNombre: {}, avisos: avisos, total: 0, ficheros: 0 };

  const porNombre = {};
  let ficheros = 0;
  const it = carpeta.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (!/\.csv$/i.test(f.getName())) continue;
    ficheros++;
    let r;
    try {
      r = leerExpedienteSec_(f);
    } catch (e) {
      avisos.push({ curso: '', grupo: '', alumno: '', aviso: 'Expediente de Secundaria ilegible',
        detalle: f.getName() + ': ' + e.message });
      continue;
    }
    for (let i = 0; i < r.avisos.length; i++) {
      avisos.push({ curso: '', grupo: '', alumno: r.nombre,
        aviso: 'Expediente de Secundaria', detalle: r.avisos[i] });
    }
    if (!r.nombre) continue;

    /* El cruce lleva el curso, como todos los del sistema. El curso se busca
       en la matrícula de este año, porque el fichero no lo dice. */
    const nomNorm = normalizar(r.nombre);
    const posibles = (cursosDeAlumno && cursosDeAlumno[nomNorm]) || [];
    if (posibles.length > 1) {
      avisos.push({ curso: '', grupo: '', alumno: r.nombre,
        aviso: 'Expediente de Secundaria ambiguo por nombre repetido',
        detalle: 'Hay alumnado que se llama exactamente así en ' + posibles.join(' y ') +
                 '. El fichero no dice el curso, así que no sé a cuál asignarlo.' });
      continue;
    }
    const clave = nomNorm + '|' + (posibles.length === 1 ? posibles[0] : '');
    if (porNombre[clave]) {
      avisos.push({ curso: '', grupo: '', alumno: r.nombre,
        aviso: 'Dos expedientes de Secundaria para el mismo alumno',
        detalle: 'Ficheros "' + porNombre[clave].fichero + '" y "' + r.fichero +
                 '". Me he quedado con el primero.' });
      continue;
    }
    porNombre[clave] = r;
  }

  return { porNombre: porNombre, avisos: avisos,
           total: Object.keys(porNombre).length, ficheros: ficheros };
}


/*** ================= LA PESTAÑA SECUNDARIA ================= ***/

/* Igual que la de PRIMARIA: sirve para ver de un vistazo qué ha entendido el
   programa de cada expediente, sin abrir los CSV uno a uno. */
function escribirSecundaria_(porNombre, unidadesPorNombre, enAlumnado) {
  const ancho = TITULOS_SECUNDARIA.length;
  const hoja = hojaLimpia(HOJA_SECUNDARIA, ancho);
  hoja.getRange(1, 1).setValue('Expedientes de Secundaria descargados de Séneca, uno por alumno. ' +
    'Traen toda su vida en la ESO, incluidos los años en otros institutos, que el histórico de ' +
    'este centro no ve. Solo hacen falta los del alumnado que sale avisado en AVISOS. ' +
    'Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_SECUNDARIA]).setFontWeight('bold')
      .setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle');

  const filas = [];
  for (const clave in porNombre) {
    const r = porNombre[clave];
    filas.push([r.nombre,
      unidadesPorNombre[clave] || (enAlumnado[clave] ? '' : 'NO ESTÁ EN ALUMNADO'),
      r.cursoPasado, r.repetiaPasado,
      r.suspensosPasado === '' ? '' : r.suspensosPasado,
      r.repeticiones === '' ? '' : r.repeticiones,
      (r.cursosRepetidos || []).join('; '),
      (r.anos || []).join(', '),
      (r.centros || []).join(' · '),
      r.fichero]);
  }
  filas.sort(function (a, b) {
    const ka = normalizar(a[0]), kb = normalizar(b[0]);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  if (filas.length) hoja.getRange(3, 1, filas.length, ancho).setValues(filas);
  hoja.setFrozenRows(2);
  return filas.length;
}
