/*** ================= EXPEDIENTES DE PRIMARIA =================
 *
 * Francisco descarga de Séneca, uno a uno, el expediente de Primaria de cada
 * alumno de 1º de ESO. Los deja en la subcarpeta "Expedientes Primaria" que
 * cuelga de "Datos de matrícula". Cada fichero se llama:
 *
 *     RegDetExpEle Apellido1 Apellido2, Nombre.csv
 *
 * EL NOMBRE DEL ALUMNO NO ESTÁ DENTRO DEL FICHERO: solo en su nombre. Por eso
 * el cruce con ALUMNADO se hace por el nombre del fichero, normalizado.
 *
 * QUÉ TRAE CADA FICHERO. Una línea por materia y por año académico, desde 1º
 * de Primaria hasta 6º, con la nota. Las materias que el alumno arrastraba de
 * un curso anterior salen con el curso entre paréntesis:
 *
 *     "Matemáticas (5º de Educ. Prima.)"
 *
 * PARA QUÉ SE USA (decisión de Francisco, 6-sep-2026):
 *
 *   1. PENDIENTES (6º Primaria): las materias del PROPIO 6º con nota menor
 *      que 5. Las que arrastraba de cursos anteriores NO entran, porque en
 *      algunos alumnos son diez o más y no caben en el folio. Para incluirlas
 *      basta con poner INCLUIR_ARRASTRADAS en true, aquí abajo.
 *
 *   2. REPETICIONES EN PRIMARIA de verdad. Hasta ahora se estimaban con la
 *      edad, y unos 38 alumnos quedaban por revisar a mano. El expediente lo
 *      dice sin lugar a dudas: si un curso aparece en dos años académicos
 *      distintos, ese curso se repitió. Solo se da por bueno cuando el
 *      expediente trae los seis cursos; si viene incompleto (alumnado que
 *      llega de otra comunidad), se anota en AVISOS y se deja la estimación
 *      por edad, que es lo que había.
 *
 * Nunca se escribe encima de un alumno del que no se esté seguro.
 *
 * ======================================================== ***/

const CARPETA_PRIMARIA = 'Expedientes Primaria';
const PREFIJO_EXPEDIENTE = 'RegDetExpEle';
const HOJA_PRIMARIA = 'PRIMARIA';

/* Ponlo en true si algún día quieres que la columna PENDIENTES (6º Primaria)
   incluya también lo que el alumno arrastraba de 3º, 4º o 5º. */
const INCLUIR_ARRASTRADAS = false;

const TITULOS_PRIMARIA = ['Alumno/a', 'Unidad', 'Año de 6º', 'Nº pendientes',
  'Pendientes de 6º', 'Arrastraba de antes', 'Rep. Primaria (expediente)',
  'Cursos repetidos', 'Centro de 6º', 'Fichero'];

/* Las materias de Primaria, acortadas para que quepan en la columna del
   informe. Las que ya están en el diccionario general de ESO (LCL, MAT,
   ING, EFI, REL...) no hace falta repetirlas: se buscan allí. */
const ABREVIATURAS_PRIMARIA = {
  'Conocimiento del Medio Natural Social y Cultural': 'CM',
  'Educación Artística': 'ART',
  'Inglés (Primer Idioma)': 'ING',
  'Ciencias de la Naturaleza': 'CNA',
  'Ciencias Sociales': 'CSO',
  'Valores sociales y cívicos': 'VSC',
  'Proyecto Interdisciplinar': 'PI',
  'Proyecto Interdisciplinar 1': 'PI',
  'Educación para la Ciudadanía y los Derechos Humanos': 'ECDH',
  'Inteligencia Emocional en el Aula. Colegio con Consciencia Plena': 'IE',
  'Materia de diseño propio 1': 'MDP'
};

/*** ================= LEER UNA LÍNEA ================= ***/

/* "6º de Educ. Prima. - Periodo 1"  ->  "6º".  Devuelve '' si no es Primaria. */
function cursoPrimaria_(texto) {
  const m = String(texto || '').trim().match(/^([1-6])\s*º?\s*de\s+Educ/i);
  return m ? m[1] + 'º' : '';
}

/* "Matemáticas (5º de Educ. Prima.)"  ->  { materia: 'Matemáticas', de: '5º' }
   "Matemáticas"                       ->  { materia: 'Matemáticas', de: '' }  */
function partirMateria_(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.*?)\s*\(([1-6])\s*º?\s*de\s+Educ\.?\s*Prima\.?\)$/i);
  if (m) return { materia: m[1].trim(), de: m[2] + 'º' };
  return { materia: t, de: '' };
}

/* Una nota es negativa si es un número menor que 5. Séneca puede dejarla
   vacía (matrícula trasladada, o pendiente de la convocatoria extraordinaria):
   en ese caso no se sabe, y no se cuenta como suspensa. */
function notaNegativa_(v) {
  if (!esNumero(v)) return false;
  return aNumero(v) < 5;
}

function abreviarPrimaria_(nombre, sinDiccionario) {
  const objetivo = normalizar(nombre);
  for (const largo in ABREVIATURAS_PRIMARIA) {
    if (normalizar(largo) === objetivo) return ABREVIATURAS_PRIMARIA[largo];
  }
  const general = abreviar(nombre);
  if (normalizar(general) !== objetivo) return general;   // lo tenía el de ESO
  if (sinDiccionario) sinDiccionario.push('Materia de Primaria sin abreviar: ' + nombre);
  return nombre;
}

/* "RegDetExpEle Agallouch Asri, Oubay.csv"  ->  "Agallouch Asri, Oubay" */
function nombreDelFichero_(nombreFichero) {
  let t = String(nombreFichero || '').replace(/\.csv$/i, '');
  const p = normalizar(PREFIJO_EXPEDIENTE);
  if (normalizar(t).indexOf(p) === 0) t = t.substring(PREFIJO_EXPEDIENTE.length);
  return t.replace(/^[\s_-]+/, '').replace(/\s+/g, ' ').trim();
}

/*** ================= LEER UN EXPEDIENTE ================= ***/

function leerExpediente_(archivo, sinDiccionario) {
  const alumno = nombreDelFichero_(archivo.getName());
  const salida = {
    nombre: alumno, fichero: archivo.getName(), anoSexto: '', centro: '',
    pendientes: [], arrastradas: [], repeticiones: '', cursosRepetidos: [],
    completo: false, avisos: []
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
  if (iCurso === -1 || iMateria === -1 || iNota === -1) {
    salida.avisos.push('Al fichero "' + archivo.getName() + '" le faltan columnas. No lo he usado.');
    return salida;
  }

  /* Primera vuelta: qué años hay de cada curso, y cuál es el año de 6º.
     Si el alumno repitió 6º, vale el más reciente. */
  const anosPorCurso = {};
  let anoSexto = 0;
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const curso = cursoPrimaria_(fila[iCurso]);
    if (!curso) continue;
    const estado = iEstado === -1 ? '' : normalizar(fila[iEstado]);
    if (ESTADOS_QUE_NO_CUENTAN.indexOf(estado) !== -1) continue;
    const ano = iAno === -1 ? 0 : parseInt(fila[iAno], 10);
    if (!ano) continue;
    if (!anosPorCurso[curso]) anosPorCurso[curso] = {};
    anosPorCurso[curso][ano] = true;
    if (curso === '6º' && ano > anoSexto) anoSexto = ano;
  }

  /* Repeticiones: un curso que aparece en dos años académicos distintos se
     repitió. Solo vale si están los seis cursos; si no, el expediente viene
     incompleto y no se puede contar. */
  let faltan = [];
  let repeticiones = 0;
  const repetidos = [];
  for (let n = 1; n <= 6; n++) {
    const curso = n + 'º';
    const anos = anosPorCurso[curso];
    if (!anos) { faltan.push(curso); continue; }
    const veces = Object.keys(anos).length;
    if (veces > 1) { repeticiones += veces - 1; repetidos.push(curso); }
  }
  salida.completo = faltan.length === 0;
  salida.cursosRepetidos = repetidos;
  if (salida.completo) {
    salida.repeticiones = repeticiones;
  } else {
    salida.avisos.push('El expediente de ' + alumno + ' no trae ' +
      (faltan.length === 1 ? 'el curso ' : 'los cursos ') + faltan.join(', ') +
      ' de Primaria. No he tocado sus repeticiones: se queda la estimación por edad.' +
      (repetidos.length ? ' (En lo que sí trae repitió ' + repetidos.join(', ') + '.)' : ''));
  }

  if (!anoSexto) {
    salida.avisos.push('El expediente de ' + alumno + ' no trae 6º de Primaria. ' +
      'No he escrito sus pendientes.');
    return salida;
  }
  salida.anoSexto = anoSexto;

  /* Segunda vuelta: las notas de 6º. Una misma materia puede salir dos veces
     (ordinaria y extraordinaria): se queda la nota más alta. */
  const mejores = {};
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    if (cursoPrimaria_(fila[iCurso]) !== '6º') continue;
    const estado = iEstado === -1 ? '' : normalizar(fila[iEstado]);
    if (ESTADOS_QUE_NO_CUENTAN.indexOf(estado) !== -1) continue;
    if (iAno !== -1 && parseInt(fila[iAno], 10) !== anoSexto) continue;
    if (iCentro !== -1 && !salida.centro) {
      salida.centro = String(fila[iCentro] || '').replace(/\s+/g, ' ').trim();
    }
    const p = partirMateria_(fila[iMateria]);
    if (!p.materia) continue;
    const clave = normalizar(p.materia) + '|' + p.de;
    const nota = fila[iNota];
    const anterior = mejores[clave];
    if (!anterior || (esNumero(nota) && (!esNumero(anterior.nota) || aNumero(nota) > aNumero(anterior.nota)))) {
      mejores[clave] = { materia: p.materia, de: p.de, nota: nota };
    }
  }

  const propias = [], arrastradas = [];
  for (const clave in mejores) {
    const m = mejores[clave];
    if (!notaNegativa_(m.nota)) continue;
    const corto = abreviarPrimaria_(m.materia, sinDiccionario);
    if (m.de) arrastradas.push(corto + ' ' + m.de);
    else propias.push(corto);
  }
  propias.sort();
  arrastradas.sort();
  salida.pendientes = INCLUIR_ARRASTRADAS ? propias.concat(arrastradas) : propias;
  salida.arrastradas = arrastradas;
  return salida;
}

/*** ================= LA CARPETA =================
 *
 * El panel mira esta carpeta para el resumen de "qué hay" y datosPrimaria_
 * la vuelve a mirar para leer los expedientes de verdad: dentro de una misma
 * pulsación de "Actualizar los datos" se listaba dos veces, y si hay muchos
 * ficheros (años de expedientes) eso se nota. Se lista una sola vez y se
 * guarda en CACHE_FICHEROS_EXPEDIENTES_; la próxima pulsación es una
 * ejecución nueva y se vuelve a mirar de cero. ***/
let CACHE_CARPETA_EXPEDIENTES_;   // undefined = no calculada todavía
let CACHE_FICHEROS_EXPEDIENTES_ = null;

function carpetaExpedientes_() {
  if (CACHE_CARPETA_EXPEDIENTES_ !== undefined) return CACHE_CARPETA_EXPEDIENTES_;
  let carpeta = null;
  try {
    const it = DriveApp.getFolderById(CARPETA_ID).getFoldersByName(CARPETA_PRIMARIA);
    if (it.hasNext()) carpeta = it.next();
  } catch (e) { /* devolvemos null y se avisa */ }
  CACHE_CARPETA_EXPEDIENTES_ = carpeta;
  return carpeta;
}

/* Los ficheros de la carpeta de expedientes, listados una sola vez. */
function ficherosDeExpedientes_() {
  if (CACHE_FICHEROS_EXPEDIENTES_) return CACHE_FICHEROS_EXPEDIENTES_;
  const arr = [];
  const carpeta = carpetaExpedientes_();
  if (carpeta) {
    const it = carpeta.getFiles();
    while (it.hasNext()) arr.push(it.next());
  }
  CACHE_FICHEROS_EXPEDIENTES_ = arr;
  return arr;
}

/*** ================= LO QUE LLAMA Codigo.gs ================= ***/

/* Devuelve { porNombre, avisos, total, ficheros }.
   Si no hay carpeta o no hay ficheros, devuelve un mapa vacío: las columnas
   se quedan exactamente como estaban. */
function datosPrimaria_(cursosDeAlumno) {
  const avisos = [];
  const carpeta = carpetaExpedientes_();
  if (!carpeta) {
    avisos.push({ curso: '1º', grupo: '', alumno: '', aviso: 'No encuentro la carpeta de expedientes',
      detalle: 'Debe haber una subcarpeta llamada "' + CARPETA_PRIMARIA + '" dentro de la carpeta de ' +
               'datos. Sin ella, la columna PENDIENTES (6º Primaria) se queda como estaba.' });
    return { porNombre: {}, avisos: avisos, total: 0, ficheros: 0 };
  }

  const porNombre = {}, sinDiccionario = [];
  let ficheros = 0;
  const listaFicheros = ficherosDeExpedientes_();
  for (let fi = 0; fi < listaFicheros.length; fi++) {
    const f = listaFicheros[fi];
    if (!/\.csv$/i.test(f.getName())) continue;
    ficheros++;
    let r;
    try {
      r = leerExpediente_(f, sinDiccionario);
    } catch (e) {
      avisos.push({ curso: '1º', grupo: '', alumno: '', aviso: 'Expediente de Primaria ilegible',
        detalle: f.getName() + ': ' + e.message });
      continue;
    }
    for (let i = 0; i < r.avisos.length; i++) {
      avisos.push({ curso: '1º', grupo: '', alumno: r.nombre,
        aviso: 'Expediente de Primaria', detalle: r.avisos[i] });
    }
    if (!r.nombre) continue;
    /* Asignación dinámica del curso. Se busca el alumno en la matrícula actual
       para añadirle el curso correcto a la clave. */
    const nomNorm = normalizar(r.nombre);
    const posibles = (cursosDeAlumno && cursosDeAlumno[nomNorm]) || [];
    
    if (posibles.length > 1) {
      avisos.push({ curso: '', grupo: '', alumno: r.nombre,
        aviso: 'Expediente ambiguo por nombre repetido',
        detalle: 'Hay alumnado que se llama exactamente así en ' + posibles.join(' y ') +
                 '. Como el fichero de Séneca no indica el curso, el programa no sabe a cuál asignarlo.' });
      continue;
    }
    
    const cursoAsignado = posibles.length === 1 ? posibles[0] : '1º';
    const clave = nomNorm + '|' + cursoAsignado;
    
    if (porNombre[clave]) {
      avisos.push({ curso: '1º', grupo: '', alumno: r.nombre,
        aviso: 'Dos expedientes para el mismo alumno',
        detalle: 'Ficheros "' + porNombre[clave].fichero + '" y "' + r.fichero +
                 '". Me he quedado con el primero.' });
      continue;
    }
    porNombre[clave] = r;
  }

  const vistos = {};
  for (let i = 0; i < sinDiccionario.length; i++) {
    if (vistos[sinDiccionario[i]]) continue;
    vistos[sinDiccionario[i]] = true;
    avisos.push({ curso: '1º', grupo: '', alumno: '', aviso: 'Expediente de Primaria',
      detalle: sinDiccionario[i] });
  }

  return { porNombre: porNombre, avisos: avisos,
           total: Object.keys(porNombre).length, ficheros: ficheros };
}

/*** ================= LA PESTAÑA PRIMARIA ================= ***/

/* Igual que la pestaña NEAE: sirve para ver de un vistazo qué ha entendido el
   programa de cada expediente, sin abrir los CSV uno a uno. */
function escribirPrimaria_(porNombre, unidadesPorNombre, usados) {
  const ancho = TITULOS_PRIMARIA.length;
  const hoja = hojaLimpia(HOJA_PRIMARIA, ancho);
  hoja.getRange(1, 1).setValue('Expedientes de Primaria descargados de Séneca, uno por alumno de 1º. ' +
    'El nombre del alumno se saca del nombre del fichero. ' +
    (INCLUIR_ARRASTRADAS ? 'La columna PENDIENTES incluye lo arrastrado de cursos anteriores. '
                         : 'En PENDIENTES solo van las materias suspensas en 6º. ') +
    'Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_PRIMARIA]).setFontWeight('bold')
      .setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle');

  const filas = [];
  for (const clave in porNombre) {
    const r = porNombre[clave];
    filas.push([r.nombre, unidadesPorNombre[clave] || (usados[clave] ? '' : 'NO ESTÁ EN ALUMNADO'),
      r.anoSexto, r.pendientes.length ? r.pendientes.length : '',
      r.pendientes.join(', '), r.arrastradas.join(', '),
      r.repeticiones === '' ? 'expediente incompleto' : r.repeticiones,
      r.cursosRepetidos.join(', '), r.centro, r.fichero]);
  }
  filas.sort(function (a, b) {
    const ka = normalizar(a[0]), kb = normalizar(b[0]);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  if (filas.length) hoja.getRange(3, 1, filas.length, ancho).setValues(filas);
  hoja.setFrozenRows(2);
  /* Sin autoResizeColumn: arreglarFormatoDeTodo_ (Formato.gs) deja un ancho
     fijo por columna al terminar "Actualizar los datos". */
  return filas.length;
}
