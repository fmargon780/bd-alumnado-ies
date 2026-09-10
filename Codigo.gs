/*** ================= CONFIGURACIÓN ================= ***/
const VERSION = 'BD v52';
const CARPETA_ID = '1twbbpoPRKP9qRprASME42K6kIeZMwXFN';
const ID_PROPUESTA = '1-1M5u2GgbBCpl09KYSGkAZjeGZveap_IbrtGerwEEdQ';
const CURSO_ACTUAL = '26-27';
const MARCA = 'MATR';
const PEND = 'PEND';
const HOJA_ALUMNADO = 'ALUMNADO';
const HOJA_HISTORIAL = 'HISTORIAL';
const HOJA_AVISOS = 'AVISOS';
const EDAD_TEORICA = { '1º': 12, '2º': 13, '3º': 14, '4º': 15 };
/* EN PRIMARIA SOLO SE PUEDE REPETIR UNA VEZ EN TODA LA ETAPA.
   Artículo 15 del Real Decreto 157/2022: la permanencia un año más "solo se
   podrá adoptar una vez durante la etapa" y tiene "carácter excepcional".
   Añadido en la BD v35, cuando se lo dijeron a Francisco.

   Esto pone un techo a la estimación por edad: un alumno que va dos años por
   detrás NO puede haber repetido dos veces en Primaria. Como mucho una, y el
   año que sobra es otra cosa (repitió en otro instituto, o se incorporó tarde
   al sistema educativo español). Ese año que sobra se va solo a la columna
   'Rep. sin localizar', así que las repeticiones totales no cambian y el PIL
   tampoco: lo que cambia es que ya no se le atribuye a Primaria algo que no
   puede haber pasado en Primaria. */
const MAX_REP_PRIMARIA = 1;

/* CUÁNTAS ASIGNATURAS SUSPENSAS DEJAN PROMOCIONAR.
   Añadido en la BD v36, a partir de una observación de Francisco: un alumno
   que el año pasado estaba repitiendo y este año está en el curso siguiente
   NO tiene por qué haber promocionado por imperativo legal. Puede haber
   aprobado. Con dos suspensas o menos promociona por sus propios medios; con
   más de dos, si no podía repetir, la ley lo sube igualmente, y ESO es el PIL.
   Se cuentan todas las materias con evaluación negativa, incluidas las
   pendientes de cursos anteriores: es la columna "Suspensos" de las hojas EV
   del cuaderno de notas. */
const MAX_SUSPENSOS_PROMOCION = 2;
/* El tercer valor de las dos columnas de PIL, desde la BD v33. Quiere decir:
   sale PIL, pero el número en el que se apoya es una suposición por edad y
   nadie lo ha comprobado. Ver el punto 7 del CONTEXTO. */
const PIL_POR_EDAD = 'SÍ (por edad)';
const ESTADOS_QUE_NO_CUENTAN = ['anulada', 'trasladada'];
const COL_AMBITOS = 'Ámbito Científico-Tecnológico';
const NIVELES_ESO = ['1º', '2º', '3º', '4º'];
/* Cómo se llama este centro dentro del campo "Centro" de los expedientes de
   Séneca. Sirve para escribir "aquí" en vez del nombre largo. */
const CENTRO_PROPIO = 'Fuente Lucena';

/* Cómo se ESCRIBE el nombre de este centro en el cuadro de la trayectoria.
   CENTRO_PROPIO es lo que se BUSCA dentro del campo "Centro" de Séneca; esto
   es lo que se escribe para que se lea. */
const NOMBRE_CENTRO = 'IES Fuente Lucena';

/* La etapa que trae hoy el sistema. Se escribe detrás del curso, para que no
   haya que adivinar de qué "2º" se está hablando. Cuando entren los
   Bachilleratos habrá que saber la etapa alumno por alumno. */
const ETAPA_ACTUAL = 'ESO';

/*** ================= LA INTERROGANTE =================
 *
 * Convenio de todo el sistema, decidido por Francisco el 6-sep-2026.
 *
 *   Casilla VACÍA         = no hay nada que poner ahí.
 *   Casilla con "?"       = ese dato todavía no lo tenemos.
 *
 * Antes las dos cosas salían igual, en blanco, y no había forma de saber si un
 * alumno no debía nada o si sencillamente no se había mirado.
 *
 * Dónde se usa:
 *   - PENDIENTES (6º Primaria), en 1º: mientras no esté descargado el
 *     expediente de Primaria de ese alumno.
 *   - NO SUPERADAS (repite): cuando el alumno repite pero no aparece en la
 *     hoja de notas del curso pasado.
 *   - Cursos repetidos en Primaria: cuando sabemos que repitió pero no
 *     tenemos su expediente, que es lo único que dice QUÉ curso repitió.
 *
 * Dónde NO hace falta: el censo NEAE es completo, así que una casilla vacía
 * quiere decir que el alumno no tiene NEAE. Y el NÚMERO de repeticiones de
 * Primaria ya lleva su propia columna "Fuente Primaria", que dice de dónde
 * sale el dato.
 * ======================================================== ***/
const SIN_DATO = '?';

const REGLAS = {
  '1º': [
    { titulo: 'OPT', codigos: { 'Oratoria y Debate': 'OyD', 'Computación y Robótica': 'CyR',
        'Music, theatre and games for English': 'MTGE' } },
    /* En 1º todo el alumnado cursa una de las dos: o Francés (Segundo Idioma),
       o el Área Lingüística de carácter transversal, que es la alternativa de
       quien está exento de francés. Se leen las dos columnas del CSV, así que
       la casilla deja de poder quedarse vacía: si se queda, es un aviso. */
    { titulo: 'FR -> ALCT', codigos: { 'Francés (Segundo Idioma)': 'FR',
        'Área Lingüística de carácter transversal': 'ALCT' } },
    { titulo: 'REL/Atedu', codigos: { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA',
        'Atención Educativa': 'ATEDU' } }
  ],
  '2º': [
    { titulo: 'OPT', codigos: { 'Oratoria y Debate': 'OyD', 'Computación y Robótica': 'CyR',
        'Proyecto de Educación Plástica y Audiovisual': 'PEPA', 'Francés (Segundo Idioma)': 'FR' } },
    { titulo: 'REL/Atedu', codigos: { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA',
        'Atención Educativa': 'ATEDU' } }
  ],
  '3º': [
    { titulo: 'OPT', codigos: { 'Computación y Robótica': 'CyR', 'Francés (Segundo Idioma)': 'FR',
        'Oratoria y Debate': 'OyD', 'Laboratorio de Física y Química': 'LAB', 'Cultura Clásica': 'CC',
        'Música': 'MUS' } },
    { titulo: 'REL/Atedu', codigos: { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA',
        'Atención Educativa': 'ATEDU' } }
  ],
  '4º': [
    { titulo: 'MAT', codigos: { 'Matemáticas A': 'MatA', 'Matemáticas B': 'MatB',
        'Ámbito Científico-Tecnológico': 'ÁMB' } },
    { titulo: 'OPC1', sinAmbitos: true, codigos: { 'Economía y Emprendimiento': 'ECO',
        'Tecnología': 'TEC', 'Biología y Geología': 'BYG' } },
    { titulo: 'OPC2', sinAmbitos: true, codigos: { 'Formación y Orientación Personal y Profesional': 'FOPP',
        'Física y Química': 'FQ', 'Latín': 'LAT' } },
    { titulo: 'OPC3', codigos: { 'Digitalización': 'DIG', 'Expresión Artística': 'EA',
        'Francés (Segundo Idioma)': 'FR' } },
    { titulo: 'OPC4', codigos: { 'Nutrición, Salud y Deporte': 'NSD', 'Prácticas Biológicas': 'PB',
        'Dibujo Técnico': 'DT', 'Aprendizaje Social y Emocional': 'ASE' } },
    { titulo: 'REL/Atedu', codigos: { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA',
        'Atención Educativa': 'ATEDU' } }
  ]
};

const ABREVIATURAS = {
  'Biología y Geología': 'BYG', 'Educación Física': 'EFI',
  'Educación Plástica, Visual y Audiovisual': 'EPV', 'Geografía e Historia': 'GEH',
  'Lengua Castellana y Literatura': 'LCL', 'Matemáticas': 'MAT', 'Música': 'MUS', 'Inglés': 'ING',
  'Francés (Segundo Idioma)': 'FRA2', 'Área Lingüística de carácter transversal': 'ALCT',
  'Computación y Robótica': 'CYR', 'Oratoria y Debate': 'OYD',
  'Music, theatre and games for English': 'MTGE', 'Atención Educativa': 'ATEDU',
  'Religión Católica': 'REL', 'Religión Evangélica': 'REV', 'Física y Química': 'FYQ',
  'Tecnología y Digitalización': 'TYD', 'Educación en Valores Cívicos y Éticos': 'VCE',
  'Proyecto de Educación Plástica y Audiovisual': 'PEPA', 'Ámbito Científico-Tecnológico': 'ACT',
  'Ámbito Lingüístico y Social': 'ALS', 'Laboratorio de Física y Química': 'LFQ',
  'Cultura Clásica': 'CC', 'Matemáticas A': 'MAA', 'Matemáticas B': 'MAB', 'Dibujo Técnico': 'DBT',
  'Digitalización': 'DIG', 'Economía y Emprendimiento': 'ECE', 'Expresión Artística': 'EAR',
  'Formación y Orientación Personal y Profesional': 'FOP', 'Latín': 'LAT',
  'Nutrición, Salud y Deporte': 'NSD', 'Prácticas Biológicas': 'PB', 'Tecnología': 'TEC'
};

/*** ================= LAS TRES COLUMNAS DE PERMANENCIA =================
 *
 * La norma (artículo 16 del Real Decreto 217/2022) dice dos cosas:
 *   - Un curso se puede repetir UNA SOLA VEZ.
 *   - En toda la enseñanza obligatoria (Primaria y ESO juntas) se puede
 *     repetir DOS VECES COMO MÁXIMO.
 *
 * De ahí salen tres preguntas distintas, y las tres son legítimas. Lo que
 * pasaba es que las tres se llamaban "PIL" y nadie sabía cuál era cuál. El
 * director y Francisco discutieron los números durante días por esto.
 * Desde la BD v34 cada una tiene su columna y su nombre:
 *
 *   'PIL'
 *      ¿Está en el curso de ahora porque el año pasado ya no podía repetir?
 *      Es decir: promocionó por imperativo legal. Mira al curso PASADO.
 *      Es la lectura literal de las siglas, y es la que quiere el equipo
 *      directivo para contarle al profesorado cómo llega cada alumno.
 *      ES LA QUE VA AL INFORME EN PAPEL desde la BD v34.
 *
 *   'No podrá repetir este curso'
 *      Si suspende en junio, ¿pasará de curso igualmente? Mira al FUTURO
 *      PRÓXIMO. Es la que el programa llamaba "PIL" hasta la BD v33.
 *
 *   'Ha agotado las dos permanencias'
 *      ¿Puede repetir algún curso más en toda la enseñanza obligatoria?
 *      Mira a TODA la etapa. Es la que el programa llamaba "PIL (etapa)".
 *
 * Los tres grupos son distintos. Medido sobre el curso 26-27: la primera
 * son unos 70 alumnos y la segunda 105, y solo coinciden 31.
 *
 * OJO AL CAMBIAR ESTOS TÍTULOS: Informes.gs busca las columnas de ALUMNADO
 * por su título exacto, en MAPA_INFORMES. Si se cambia uno aquí y no allí,
 * la columna del papel se queda vacía y no da ningún error.
 * ======================================================== ***/

const TITULOS_ALUMNADO = [
  /* Quién es */
  'Alumno/a', 'Unidad', 'Curso', 'Edad a 31/12',
  /* De dónde viene */
  'Curso el año pasado', 'Repetía el año pasado', 'Repetía el año pasado (corregido)',
  'Suspensos el año pasado',
  'Repite el curso actual',
  /* Qué ha repetido */
  'Repeticiones en ESO', 'Cursos repetidos en ESO', 'Fuente ESO',
  'Rep. Primaria (calculado)', 'Cursos repetidos en Primaria', 'Fuente Primaria',
  'Rep. sin localizar',
  'Rep. Primaria (corregido)', 'Motivo de la corrección',
  'Repeticiones totales',
  /* Y qué puede pasar. Las tres van en orden de tiempo: el año pasado, este
     junio, y el resto de la etapa. Delante de la primera va la casilla en la
     que el equipo directivo puede decidir a mano. */
  'PIL (a mano)', 'PIL', 'No podrá repetir este curso', 'Ha agotado las dos permanencias',
  'Trayectoria',
  /* Lo que debe */
  'MAT NO SUP.', 'Nº pendientes', 'Asignaturas pendientes',
  /* Los apoyos que recibe */
  'Diversificación', 'NEAE', 'MEDIDAS Y RECURSOS',
  /* Lo que cursa este año. Las dos últimas son solo de Bachillerato: en la
     ESO se quedan vacías, y al revés con las de la ESO. Ver Bachillerato.gs. */
  'OPT', 'FR -> ALCT', 'MAT', 'OPC1', 'OPC2', 'OPC3', 'OPC4', 'REL/Atedu',
  'MODALIDAD', 'ITINERARIO',
  /* Lo tuyo */
  'Observaciones'];
/* Amarillas: las escribe Francisco y el programa nunca las pisa. */
const COLS_MANUALES_ALUMNADO = ['Rep. Primaria (corregido)', 'Motivo de la corrección',
  'Repetía el año pasado (corregido)', 'PIL (a mano)', 'Observaciones'];
/* Todas las que hay que leer antes de reconstruir la tabla. NEAE y MEDIDAS Y
   RECURSOS las rellena ahora el censo de Séneca, pero si el censo no dice nada
   de un alumno se conserva lo que hubiera escrito a mano. */
const COLS_CONSERVADAS = ['Rep. Primaria (corregido)', 'Motivo de la corrección',
  'NEAE', 'MEDIDAS Y RECURSOS', 'Observaciones',
  /* Estas dos van las últimas a propósito: las de arriba se leen por su
     posición en esta lista (man[0] … man[4]) y no se pueden mover de sitio. */
  'Repetía el año pasado (corregido)', 'PIL (a mano)'];
/* La fecha de nacimiento la usa el censo NEAE para deshacer empates entre
   alumnos con las mismas iniciales. "Cursos repetidos en ESO" va la última
   para no mover de sitio nada de lo que ya leía componerAlumnado. */
const TITULOS_HISTORIAL = ['Alumno/a', 'Nº Id. Escolar', 'Unidad', 'Curso', 'Edad a 31/12',
  'Repite el curso actual', 'Repeticiones en ESO', 'Rep. Primaria (calculado)', 'Fuente Primaria',
  'Fecha de nacimiento', 'Cursos repetidos en ESO',
  'Curso el año pasado', 'Repetía el año pasado', 'Años en la ESO'];

/*** El menú lo crea Actualizador.gs, no este fichero. ***/

/*** ================= AUXILIARES DE TEXTO ================= ***/
function normalizar(v) {
  return String(v === null || v === undefined ? '' : v)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
}

/* 2024 -> "24-25". Un año académico escrito con cuatro cifras obliga al lector
   a acordarse de que "2024" quiere decir el curso 2024-2025. Escrito así se
   entiende de un vistazo. Si lo que llega no es un año, se devuelve igual. */
function anoAcademico_(ano) {
  const n = parseInt(ano, 10);
  if (!n) return '';
  if (n < 1900 || n > 2200) return String(ano);
  return String(n).slice(-2) + '-' + String(n + 1).slice(-2);
}

function nivelESO(texto) {
  const m = String(texto || '').trim().match(/^([1-4])\s*º?\s*(de\s+)?E\.?\s*S\.?\s*O\.?/i);
  return m ? m[1] + 'º' : '';
}

function abreviar(nombre) {
  const objetivo = normalizar(nombre);
  for (const largo in ABREVIATURAS) {
    if (normalizar(largo) === objetivo) return ABREVIATURAS[largo];
  }
  return nombre;
}

function esNumero(v) {
  if (v === null || v === undefined || String(v).trim() === '') return false;
  return !isNaN(Number(String(v).trim().replace(',', '.')));
}

function aNumero(v) { return Number(String(v).trim().replace(',', '.')); }

/* Deja un número de repeticiones de Primaria dentro de lo que permite la ley:
   ni menos de cero ni más de una. Solo se aplica a los números ESTIMADOS por
   edad; lo que dice el expediente de un alumno se respeta tal cual, porque es
   un hecho, y si dijera más de una se anota en AVISOS. */
function topeRepPrimaria_(v) {
  if (v === '' || v === null || v === undefined || !esNumero(v)) return v;
  const n = aNumero(v);
  if (n < 0) return 0;
  if (n > MAX_REP_PRIMARIA) return MAX_REP_PRIMARIA;
  return n;
}

/* El año de nacimiento, venga como fecha de verdad o como texto DD/MM/AAAA,
   que son las dos formas en las que puede estar en la pestaña HISTORIAL. */
function anoDeNacimiento_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (v instanceof Date) return v.getFullYear();
  const m = String(v).match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

/*** ================= LECTURA DE CSV ================= ***/
function partirLineaCsv(linea, sep) {
  const campos = [];
  let actual = '', dentro = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea.charAt(i);
    if (dentro) {
      if (c === '"') {
        if (linea.charAt(i + 1) === '"') { actual += '"'; i++; }
        else dentro = false;
      } else actual += c;
    } else {
      if (c === '"') dentro = true;
      else if (c === sep) { campos.push(actual); actual = ''; }
      else actual += c;
    }
  }
  campos.push(actual);
  return campos;
}

function textoATabla(texto) {
  texto = texto.replace(/^﻿/, '');
  const lineas = texto.split(/\r?\n/);
  let primera = '';
  for (let i = 0; i < lineas.length; i++) { if (lineas[i].trim()) { primera = lineas[i]; break; } }
  const sep = (primera.split(';').length - 1) > (primera.split(',').length - 1) ? ';' : ',';
  const tabla = [];
  for (let i = 0; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;
    tabla.push(partirLineaCsv(lineas[i], sep));
  }
  return tabla;
}

function leerCsv(archivo) {
  const blob = archivo.getBlob();
  let texto = blob.getDataAsString('UTF-8');
  if (texto.indexOf('�') !== -1) texto = blob.getDataAsString('ISO-8859-1');
  return textoATabla(texto);
}

/*** ================= LÓGICA: HISTÓRICO ================= ***/
function calcularHistorial(tabla) {
  const cab = tabla[0].map(normalizar);
  const iNombre = cab.indexOf(normalizar('Alumno/a'));
  const iId = cab.indexOf(normalizar('Nº Id. Escolar'));
  const iCurso = cab.indexOf(normalizar('Curso'));
  const iUnidad = cab.indexOf(normalizar('Unidad'));
  const iAno = cab.indexOf(normalizar('Año de la matrícula'));
  const iEdad = cab.indexOf(normalizar('Edad a 31/12 del año de matrícula'));
  const iEstado = cab.indexOf(normalizar('Estado Matrícula'));
  const iFecNac = cab.indexOf(normalizar('Fecha de nacimiento'));
  if (iNombre === -1 || iId === -1 || iCurso === -1 || iAno === -1 || iEdad === -1) {
    throw new Error('Al histórico le faltan columnas necesarias.');
  }

  let ultimo = 0;
  for (let f = 1; f < tabla.length; f++) {
    const a = parseInt(tabla[f][iAno], 10);
    if (a && a > ultimo) ultimo = a;
  }

  const actuales = {};
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    if (parseInt(fila[iAno], 10) !== ultimo) continue;
    if (!nivelESO(fila[iCurso])) continue;
    const id = String(fila[iId] || '').trim();
    if (id) actuales[id] = fila;
  }

  const anos = {};
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const id = String(fila[iId] || '').trim();
    if (!actuales[id]) continue;
    const niv = nivelESO(fila[iCurso]);
    if (!niv) continue;
    const estado = iEstado === -1 ? '' : normalizar(fila[iEstado]);
    if (ESTADOS_QUE_NO_CUENTAN.indexOf(estado) !== -1) continue;
    if (!anos[id]) anos[id] = {};
    if (!anos[id][niv]) anos[id][niv] = {};
    anos[id][niv][String(fila[iAno]).trim()] = parseInt(fila[iEdad], 10);
  }

  const filas = [];
  for (const id in actuales) {
    const fila = actuales[id];
    const niv = nivelESO(fila[iCurso]);
    const porNivel = anos[id] || {};
    let repESO = 0;
    for (const n in porNivel) repESO += Object.keys(porNivel[n]).length - 1;
    const repite = Object.keys(porNivel[niv] || {}).length > 1 ? 'SÍ' : 'NO';

    /* QUÉ cursos de ESO ha repetido, y en qué años.
       RegAlum.csv trae una línea por alumno y por año de matrícula, así que
       esto ya estaba calculado aquí arriba: un curso que aparece en dos años
       distintos es un curso repetido. Hasta la BD v27 el programa se quedaba
       solo con el NÚMERO y tiraba el curso y los años.

       OJO: RegAlum es el registro de matrículas DE NUESTRO CENTRO. Si un
       alumno repitió en otro instituto y llegó aquí después, esa repetición
       no aparece: se le cuela en la estimación por edad de Primaria. */
    const repetidos = [];
    for (let k = 0; k < NIVELES_ESO.length; k++) {
      const anosNivel = porNivel[NIVELES_ESO[k]];
      if (!anosNivel) continue;
      const lista = Object.keys(anosNivel).sort();
      if (lista.length < 2) continue;
      repetidos.push(NIVELES_ESO[k] + ' (' +
        lista.map(function (a) { return anoAcademico_(a); }).join(', ') + ')');
    }
    const cursosESO = repetidos.join('; ');

    /* EN QUÉ CURSO ESTABA EL AÑO PASADO, Y SI LO ESTABA REPITIENDO.
       Añadido en la BD v34. RegAlum trae una línea por alumno y por año, así
       que esto ya estaba aquí calculado y se tiraba. Hace falta para saber si
       el alumno promocionó al curso de ahora por imperativo legal, que es la
       columna PIL que quiere el equipo directivo.
       Si el alumno no estaba en este centro el año pasado, las dos casillas
       se quedan vacías y más adelante se convierten en interrogante. */
    /* En qué curso estuvo cada año, en este centro. Es la materia prima de la
       columna Trayectoria de ALUMNADO, que cuenta la historia del alumno año
       por año en una sola casilla. Formato: "2024:1º; 2025:2º; 2026:3º". */
    const parejas = [];
    for (const n in porNivel) {
      for (const anoN in porNivel[n]) parejas.push([parseInt(anoN, 10), n]);
    }
    parejas.sort(function (x, y) { return x[0] - y[0]; });
    const anosESO = parejas.map(function (x) { return x[0] + ':' + x[1]; }).join('; ');

    const anoAnterior = ultimo - 1;
    let cursoPasado = '', repetiaPasado = '';
    for (const n in porNivel) {
      if (porNivel[n][String(anoAnterior)] === undefined) continue;
      cursoPasado = n;
      const anosDeEseNivel = Object.keys(porNivel[n]);
      repetiaPasado = 'NO';
      for (let q = 0; q < anosDeEseNivel.length; q++) {
        if (parseInt(anosDeEseNivel[q], 10) < anoAnterior) repetiaPasado = 'SÍ';
      }
    }

    const edad = parseInt(fila[iEdad], 10);
    let repPrim = '', fuente = '';
    const primero = porNivel['1º'];
    if (primero) {
      let menor = null;
      for (const a in primero) { const e = primero[a]; if (menor === null || e < menor) menor = e; }
      repPrim = menor - 12; fuente = '1ºESO';
    } else if (!isNaN(edad)) {
      repPrim = edad - EDAD_TEORICA[niv] - repESO; fuente = 'EDAD';
    }
    /* Las dos son cuentas de edad, y la ley les pone techo y suelo. */
    repPrim = topeRepPrimaria_(repPrim);
    filas.push([String(fila[iNombre]).trim(), id, iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim(),
                niv, isNaN(edad) ? '' : edad, repite, repESO, repPrim, fuente,
                iFecNac === -1 ? '' : String(fila[iFecNac] || '').trim(), cursosESO,
                cursoPasado, repetiaPasado, anosESO]);
  }
  filas.sort(function (a, b) { return normalizar(a[0]) < normalizar(b[0]) ? -1 : 1; });
  return { filas: filas, ano: ultimo };
}

/*** ================= LÓGICA: MATRÍCULA ================= ***/
function leerMatricula(tabla, curso) {
  const reglas = REGLAS[curso];
  const cab = tabla[0].map(function (t) { return String(t).trim(); });
  const cabN = cab.map(normalizar);
  const faltan = [];

  const columnas = reglas.map(function (regla) {
    const pares = [];
    for (const asig in regla.codigos) {
      const i = cabN.indexOf(normalizar(asig));
      if (i === -1) faltan.push(regla.titulo + ' / ' + asig);
      else pares.push({ i: i, codigo: regla.codigos[asig] });
    }
    return pares;
  });

  const pendCols = [];
  for (let c = 0; c < cab.length; c++) {
    const m = cab[c].match(/^(.*?)\s*\(([1-4])º de E\.S\.O\.\)$/);
    if (m) pendCols.push({ i: c, asig: m[1].trim(), niv: m[2] });
  }

  const iNombre = cabN.indexOf(normalizar('Alumno/a'));
  const iUnidad = cabN.indexOf(normalizar('Unidad'));
  const iAmb = cabN.indexOf(normalizar(COL_AMBITOS));
  const alumnos = [], sinUnidad = [], dobles = [];

  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const nombre = String(fila[iNombre] || '').trim();
    if (!nombre) continue;
    const unidad = iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim();
    if (!unidad) sinUnidad.push(nombre);
    const esAmb = iAmb !== -1 && String(fila[iAmb] || '').trim().toUpperCase() === MARCA;

    const valores = {};
    for (let k = 0; k < reglas.length; k++) {
      if (reglas[k].sinAmbitos && esAmb) { valores[reglas[k].titulo] = ''; continue; }
      const cods = [];
      for (let p = 0; p < columnas[k].length; p++) {
        const par = columnas[k][p];
        if (String(fila[par.i] || '').trim().toUpperCase() === MARCA) cods.push(par.codigo);
      }
      if (cods.length > 1) dobles.push(nombre + ' (' + unidad + ') ' + reglas[k].titulo + ' = ' + cods.join(' / '));
      valores[reglas[k].titulo] = cods.join(' / ');
    }

    const pend = [];
    for (let p = 0; p < pendCols.length; p++) {
      const pc = pendCols[p];
      if (String(fila[pc.i] || '').trim().toUpperCase() === PEND) {
        pend.push(abreviar(pc.asig) + ' ' + pc.niv + 'º');
      }
    }
    alumnos.push({ nombre: nombre, unidad: unidad, curso: curso, valores: valores,
                   pend: pend, diver: esAmb });
  }
  return { alumnos: alumnos, sinUnidad: sinUnidad, dobles: dobles, faltan: faltan };
}

/*** ================= LÓGICA: NOTAS ================= ***/
function leerNotas(valores) {
  const cab = valores[0].map(function (v) { return String(v === null || v === undefined ? '' : v).trim(); });
  let iSus = -1;
  for (let c = 0; c < cab.length; c++) {
    if (normalizar(cab[c]).indexOf('suspensos') === 0) { iSus = c; break; }
  }
  if (iSus === -1) return null;

  /* MAT NO SUP. son solo las materias del curso que el alumno repite.
     Las columnas cuyo título acaba en " 1º", " 2º"... son pendientes de
     cursos anteriores y son otra cosa: no entran aquí. Se corta en la primera.
     La columna "Suspensos" de la hoja tampoco sirve: suma las dos cosas. */
  let fin = iSus;
  for (let c = 2; c < iSus; c++) {
    if (/\s[1-4]º$/.test(cab[c])) { fin = c; break; }
  }
  const alumnos = {};
  for (let f = 1; f < valores.length; f++) {
    const fila = valores[f];
    const nombre = String(fila[0] === null || fila[0] === undefined ? '' : fila[0]).trim();
    if (!nombre) continue;
    const susp = [];
    for (let c = 2; c < fin; c++) {
      const v = fila[c];
      if (esNumero(v) && aNumero(v) < 5) susp.push(cab[c]);
    }
    const decl = esNumero(fila[iSus]) ? aNumero(fila[iSus]) : susp.length;
    alumnos[normalizar(nombre)] = { lista: susp, n: susp.length, declarado: decl };
  }
  return alumnos;
}

/* BUSCAR A UN ALUMNO EN UNA HOJA DE NOTAS. Añadido en la BD v37.

   Normalmente basta con el nombre, porque las hojas EV ya vienen separadas
   por curso. Pero en el cuaderno de notas hay alumnos a los que les falta el
   SEGUNDO APELLIDO: Séneca escribe "Ahassan El Hammiti, Yahya" y la hoja pone
   "Ahassan, Yahya". Sin esto, esos alumnos se quedaban sin sus suspensos del
   año pasado y sin sus materias no superadas, y su PIL salía con interrogante.
   Lo encontró Francisco el 8-sep-2026.

   Cómo se busca cuando el nombre exacto no está: mismo nombre de pila, y los
   apellidos de la hoja tienen que ser el principio de los apellidos de Séneca.
   Solo se da por bueno si hay UN ÚNICO candidato en esa hoja. Si hay dos, no
   se coge ninguno: más vale una interrogante que atribuirle a un alumno las
   notas de otro. */
function notaDeAlumno_(mapa, nombre) {
  if (!mapa) return null;
  if (mapa[nombre]) return mapa[nombre];
  const coma = nombre.indexOf(', ');
  if (coma === -1) return null;
  const apellidos = nombre.substring(0, coma);
  const pila = nombre.substring(coma + 2);
  if (!apellidos || !pila) return null;
  let encontrado = null, cuantos = 0;
  for (const k in mapa) {
    const c = k.indexOf(', ');
    if (c === -1) continue;
    if (k.substring(c + 2) !== pila) continue;
    const apCorto = k.substring(0, c);
    if (!apCorto || apellidos.indexOf(apCorto + ' ') !== 0) continue;
    cuantos++;
    encontrado = mapa[k];
    encontrado.nombreEnLaHoja = k;
  }
  return cuantos === 1 ? encontrado : null;
}

/*** ================= EL CUADRO DE LA TRAYECTORIA =================
 *
 * Lo pidió Francisco el 8-sep-2026: "necesitamos algo que nos muestre de una
 * forma muy esquemática la historia ordenada de las matrículas de un alumno,
 * con su decisión de promoción, su número de pendientes... Una especie de
 * cuadro sinóptico que nos diga de una sola pasada la información que tenemos
 * cierta, la que nos falta, la dudosa."
 *
 * Sale en la columna Trayectoria de ALUMNADO, una línea por año académico.
 * LA REFERENCIA TEMPORAL VA SIEMPRE DELANTE, que es como lo quiere leer él.
 * Lo que no se sabe lleva una interrogante, y el veredicto va en la última
 * línea, marcada con una flecha.
 *
 * No calcula nada nuevo: junta en una casilla lo que ya está repartido por
 * seis columnas.
 *
 * BD v47, 9-sep-2026. Lo pidió Francisco: el cuadro ponía "2º" y "aquí", y
 * había que adivinar que eran "2º de la ESO" y "el IES Fuente Lucena". Ahora
 * el curso lleva siempre su etapa detrás y el centro se escribe con su nombre.
 * Es lo mismo, escrito para que se entienda sin conocer el sistema por dentro.
 * ======================================================== ***/
/* "29000517 - C.E.I.P. Carmen Arévalo" -> "C.E.I.P. Carmen Arévalo".
   Y si es este instituto, su nombre entero. Una casilla vacía también es este
   centro: solo el histórico de aquí deja el centro sin decir.
   Antes se escribía "aquí" y había que saber a qué se refería. */
function centroCorto_(centro) {
  const t = String(centro || '').trim();
  if (!t) return NOMBRE_CENTRO;
  if (t.indexOf(CENTRO_PROPIO) !== -1) return NOMBRE_CENTRO;
  return t.replace(/^\s*\d+\s*-\s*/, '');
}

/* "2º" -> "2º ESO". El curso se escribe siempre con su etapa detrás, para que
   nadie tenga que adivinar de qué segundo se habla. Si el texto ya trae la
   etapa escrita, se deja como está. */
function cursoConEtapa_(curso) {
  const t = String(curso || '').trim();
  if (!t) return SIN_DATO;
  if (/eso|bachiller|primaria/i.test(t)) return t;
  return t + ' ' + ETAPA_ACTUAL;
}

function trayectoria_(d) {
  const L = [];

  /* 1. Primaria. Va primero porque es lo primero en el tiempo. */
  const exp = d.exp;
  if (exp && exp.anoPrimero && exp.anoSexto && exp.repeticiones !== '') {
    L.push(anoAcademico_(exp.anoPrimero) + ' a ' + anoAcademico_(exp.anoSexto) + '  Primaria · ' +
      ((exp.cursosRepetidos || []).length
        ? 'repitió ' + exp.cursosRepetidos.join(', ') + ' de Primaria'
        : 'sin repetir') + ' · expediente');
  } else if (exp && exp.anoSexto) {
    L.push('hasta ' + anoAcademico_(exp.anoSexto) + '  Primaria · expediente incompleto (?)');
  } else if (esNumero(d.repPrim)) {
    const n = aNumero(d.repPrim);
    L.push('Primaria  ' + (n > 0 ? (n + (n === 1 ? ' repetición' : ' repeticiones'))
                                 : 'sin repetir') +
      (d.fuenteP === 'EXPEDIENTE' ? ' · expediente' : ' · estimado por edad (?)'));
  }

  /* 2. Los años de la ESO. Del expediente si lo hay, y si no del histórico de
        este centro, que no ve los años en otros institutos. */
  const filas = [];
  if (d.expSec && d.expSec.porAno) {
    for (const ano in d.expSec.porAno) {
      const x = d.expSec.porAno[ano];
      filas.push({ ano: parseInt(ano, 10), curso: x.curso, centro: x.centro,
                   estado: x.estado, susp: x.suspensos });
    }
  } else if (d.anosESO) {
    const trozos = String(d.anosESO).split(';');
    for (let i = 0; i < trozos.length; i++) {
      const m = trozos[i].trim().match(/^(\d{4})\s*:\s*([1-4]º)$/);
      if (m) filas.push({ ano: parseInt(m[1], 10), curso: m[2], centro: '', estado: '', susp: '' });
    }
  }
  filas.sort(function (x, y) { return x.ano - y.ano; });

  /* 3. El hueco que no explica nadie, delante del primer año que conocemos. */
  if (filas.length && esNumero(d.sinLocalizar) && aNumero(d.sinLocalizar) > 0) {
    const n = aNumero(d.sinLocalizar);
    L.push('antes de ' + anoAcademico_(filas[0].ano) + '  ? · falta ' + n +
           (n === 1 ? ' año' : ' años') + ' que nada explica');
  }

  const ultimo = filas.length ? filas[filas.length - 1].ano : 0;
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    const partes = [cursoConEtapa_(f.curso), centroCorto_(f.centro)];
    if (f.ano === ultimo) {
      partes.push('en curso');
    } else {
      /* La decisión la dice el expediente. Si no lo hay, se deduce: si al año
         siguiente sigue en el mismo curso, es que repitió. */
      let decision = String(f.estado || '').trim().toLowerCase();
      if (!decision) {
        decision = (filas[i + 1] && filas[i + 1].curso === f.curso) ? 'repite' : 'promociona';
      }
      partes.push(decision === 'repite' ? 'REPITE' : decision);
      let susp = f.susp;
      if (!esNumero(susp) && f.ano === ultimo - 1 && esNumero(d.suspPasado)) susp = d.suspPasado;
      partes.push(esNumero(susp)
        ? (aNumero(susp) + (aNumero(susp) === 1 ? ' suspensa' : ' suspensas'))
        : '? suspensas');
    }
    L.push(anoAcademico_(f.ano) + '  ' + partes.join(' · '));
  }

  /* 4. El veredicto, en la última línea. */
  if (d.aMano) {
    L.push('→ PIL ' + d.pil + ' · lo ha decidido el equipo directivo');
  } else if (d.pil === 'SÍ') {
    L.push('→ PIL SÍ · comprobado');
  } else if (d.pil === PIL_POR_EDAD) {
    L.push('→ PIL SÍ, pero sin comprobar: sale de una cuenta de edad');
  } else if (d.pil === SIN_DATO) {
    L.push('→ PIL ? · falta información para decidirlo');
  } else if (d.pil === 'NO') {
    L.push('→ no es PIL');
  }

  return L.join('\n');
}

/*** ================= LÓGICA: COMPOSICIÓN ================= ***/
function componerAlumnado(alumnosPorCurso, historial, notasPorCurso, manuales, jefatura, neae, primaria, secundaria) {
  /* Todos los cruces del sistema van por nombre Y curso. Dos alumnos distintos
     pueden llamarse igual: si la clave fuera solo el nombre, los datos de uno se
     aplicarían también al otro. El curso los separa. La columna 3 del historial
     es el curso. */
  const hist = {};
  for (let i = 0; i < historial.length; i++) {
    hist[normalizar(historial[i][0]) + '|' + historial[i][3]] = historial[i];
  }

  /* Respaldo por nombre suelto. Sirve para cuando el histórico está descargado
     de antes que la matrícula y el alumno todavía figura en el curso anterior:
     sin esto se quedaría sin edad, sin repeticiones y sin PIL. Solo se usa
     cuando no hay ninguna duda, es decir cuando ese nombre es único. */
  const histPorNombre = {};
  for (let i = 0; i < historial.length; i++) {
    const nomH = normalizar(historial[i][0]);
    if (!histPorNombre[nomH]) histPorNombre[nomH] = [];
    histPorNombre[nomH].push(historial[i]);
  }
  const enOtroCurso = [];
  const jef = jefatura || {};
  const censo = neae || {};
  const prim = primaria || {};
  const sec = secundaria || {};
  const filas = [], avisos = [];

  /* Qué cursos trae el censo NEAE que se ha descargado. En los cursos que el
     censo cubre, el censo manda: si un alumno no aparece en él, es que no tiene
     NEAE, y su casilla se queda vacía. Si se conservara lo que había, un dato
     equivocado se quedaría escrito para siempre. En los cursos que el censo no
     trae, porque la descarga de Séneca fue solo de un curso, sí se conserva lo
     que hubiera, para no borrar datos buenos. */
  const cursosDelCenso = {};
  for (const kc in censo) {
    if (censo[kc] && censo[kc].curso) cursosDelCenso[censo[kc].curso] = true;
  }
  const cursosConCenso = Object.keys(cursosDelCenso).sort();
  if (cursosConCenso.length) {
    const sinCenso = [];
    for (const cc in alumnosPorCurso) {
      /* Bachillerato no entra en esta cuenta: el censo NEAE todavía no se lee
         para Bachillerato, así que decir que "le falta" sería ruido. */
      if (esBachillerato_(cc)) continue;
      if (!cursosDelCenso[cc]) sinCenso.push(cc);
    }
    if (sinCenso.length) {
      avisos.push({ curso: '', grupo: '', alumno: '',
        aviso: 'El censo NEAE no trae todos los cursos',
        detalle: 'RegAluNEE.csv solo trae fichas de ' + cursosConCenso.join(', ') + '. En ' +
          sinCenso.sort().join(', ') + ' se conserva lo que ya estaba escrito, que puede estar ' +
          'anticuado. Vuelve a descargar de Séneca el censo NEAE con los cuatro cursos y pulsa ' +
          'otra vez el botón para que se recalcule todo.' });
    }
  }
  const todos = [];
  for (const curso in alumnosPorCurso) {
    const lista = alumnosPorCurso[curso];
    for (let i = 0; i < lista.length; i++) todos.push(lista[i]);
  }
  todos.sort(function (a, b) {
    const ka = a.unidad + ' ' + normalizar(a.nombre), kb = b.unidad + ' ' + normalizar(b.nombre);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });

  /* En 1º nadie puede quedarse sin idioma: o Francés o el Área Lingüística.
     Si esa columna faltara en el CSV, todos saldrían vacíos y AVISOS se
     llenaría de ruido. Por eso solo se avisa cuando al menos un alumno de 1º
     sí lo tiene puesto, que es la señal de que la columna se ha leído bien. */
  let hayIdiomaEn1 = false;
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].curso === '1º' && (todos[i].valores['FR -> ALCT'] || '') !== '') {
      hayIdiomaEn1 = true;
      break;
    }
  }

  for (let i = 0; i < todos.length; i++) {
    const a = todos[i];
    const v = a.valores;
    const clave = normalizar(a.nombre) + '|' + a.curso;
    const soloNombre = normalizar(a.nombre);
    let h = hist[clave];
    if (!h && histPorNombre[soloNombre] && histPorNombre[soloNombre].length === 1) {
      h = histPorNombre[soloNombre][0];
      enOtroCurso.push(a.nombre + ' (' + a.curso + ')');
    }
    const man = (manuales && manuales[clave]) || ['', '', '', '', '', '', ''];

    /* BACHILLERATO SE VA POR SU CAMINO. Todo lo que viene debajo es la
       maquinaria de la ESO: repeticiones de Primaria, edad teórica, PIL y las
       dos permanencias de la enseñanza obligatoria. En Bachillerato nada de
       eso existe, así que aplicárselo daría números inventados. Sus casillas
       se quedan vacías, que quiere decir "aquí no aplica". Ver
       Bachillerato.gs. */
    if (esBachillerato_(a.curso)) {
      const vb = valoresDeBachillerato_(a, man, censo[clave], cursosDelCenso);
      filas.push(TITULOS_ALUMNADO.map(function (t) {
        return vb[t] === undefined ? '' : vb[t];
      }));
      continue;
    }

    const exp = prim[clave];                     // su expediente de Primaria, si lo hay
    const expSec = sec[clave];                   // su expediente de Secundaria, si lo hay
    let edad = '', repite = '', repESO = '', repPrim = '', fuente = '', total = '', mns = '';
    let sinLocalizar = '';
    let cursosESO = SIN_DATO, cursosPrim = SIN_DATO;
    /* Las tres columnas de permanencia. Ver el comentario grande de arriba. */
    let pil = '', noPodra = '', agotadas = '';
    /* De dónde viene el alumno. */
    let cursoPasado = '', repetiaPasado = '', suspPasado = '', repetiaCorregido = false;
    let fuenteESO = 'HISTÓRICO';

    if (!h) {
      fuente = 'No consta en el histórico';
      avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
        aviso: 'No está en el histórico de matrículas', detalle: 'No se pueden calcular sus repeticiones' });
    } else {
      edad = h[4]; repite = h[5]; repESO = h[6]; repPrim = h[7]; fuente = h[8];

      /* Qué cursos de ESO ha repetido. Lo trae el histórico desde la BD v27.
         Si la pestaña HISTORIAL es de una versión anterior, esa columna no
         existe: entonces, si el alumno tiene repeticiones, va la interrogante,
         y si no tiene ninguna la casilla se queda vacía. */
      /* En qué curso estaba el año pasado. Lo trae el histórico desde la
         BD v34. En 1º no puede traerlo: el curso pasado fue 6º de Primaria,
         y eso solo lo dice el expediente. */
      cursoPasado = String(h[11] === null || h[11] === undefined ? '' : h[11]).trim();
      repetiaPasado = String(h[12] === null || h[12] === undefined ? '' : h[12]).trim();

      cursosESO = String(h[10] === null || h[10] === undefined ? '' : h[10]).trim();
      if (!cursosESO) cursosESO = (esNumero(repESO) && aNumero(repESO) > 0) ? SIN_DATO : '';

      /* EL EXPEDIENTE DE SECUNDARIA MANDA SOBRE EL HISTÓRICO. Añadido en la
         BD v42. El histórico solo ve las matrículas de este centro; el
         expediente ve toda la ESO del alumno, en el instituto que sea. Cuando
         está descargado, se usa él para todo lo de Secundaria. Ver
         Secundaria.gs. */
      if (expSec) {
        fuenteESO = 'EXPEDIENTE';
        if (esNumero(expSec.repeticiones)) repESO = aNumero(expSec.repeticiones);
        cursosESO = (expSec.cursosRepetidos || []).join('; ');
        if (!cursosESO) cursosESO = '';
        if (expSec.cursoPasado) {
          cursoPasado = expSec.cursoPasado;
          repetiaPasado = expSec.repetiaPasado || '';
          /* Si el curso pasado es el mismo en el que está ahora, es que lo
             está repitiendo, aunque el año pasado lo cursara en otro centro. */
          if (expSec.cursoPasado === a.curso) repite = 'SÍ';
        }
      }

      /* La ley solo deja repetir una vez en toda la Primaria. Si el número
         estimado por edad se pasa, el año que sobra no puede ser de Primaria:
         se recorta aquí y más abajo se recoge en 'Rep. sin localizar'. Se hace
         también aquí, y no solo al leer el histórico, para que valga aunque la
         pestaña HISTORIAL venga de una versión anterior. */
      repPrim = topeRepPrimaria_(repPrim);

      /* El expediente de Primaria lo dice negro sobre blanco, así que manda
         sobre la estimación por edad. Ver Primaria.gs. */
      if (exp && exp.repeticiones !== '' && exp.repeticiones !== undefined) {
        repPrim = exp.repeticiones;
        fuente = 'EXPEDIENTE';
        /* Un expediente no se recorta: es un hecho. Pero si dice más de una
           repetición en Primaria, algo no encaja con la ley española y hay
           que mirarlo. */
        if (esNumero(repPrim) && aNumero(repPrim) > MAX_REP_PRIMARIA) {
          avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
            aviso: 'Más de una repetición en Primaria',
            detalle: 'Su expediente dice que repitió ' + repPrim + ' cursos de Primaria (' +
              (exp.cursosRepetidos || []).join(', ') + '), y la ley solo permite uno en toda ' +
              'la etapa. O el alumno estudió parte de Primaria fuera del sistema educativo ' +
              'español, o hay un error en Séneca. He dejado el número que dice el expediente.' });
        }
      }
      const corregido = String(man[0] || '').trim();
      const primaria2 = corregido !== '' && !isNaN(Number(corregido)) ? Number(corregido) : repPrim;

      /* REPETICIONES SIN LOCALIZAR. Añadido en la BD v32.

         Las dos fuentes que tenemos son incompletas por naturaleza:
         RegAlum.csv solo trae las matrículas DE ESTE CENTRO, y el expediente
         de Primaria solo cuenta lo que pasó en Primaria. Un alumno que
         repitió en otro instituto no sale en ninguna de las dos.

         Pero se ve en la edad. Si el alumno va más años por detrás de lo que
         explican sus repeticiones conocidas, esos años son repeticiones que
         existieron aunque no sepamos dónde. Cuentan para el PIL igual que
         las demás.

         Por qué hace falta esta columna: hasta la BD v31 esos años iban
         dentro de la estimación por edad de las repeticiones de Primaria.
         En cuanto llegaba el expediente de Primaria, la estimación se
         sustituía por el número exacto y esos años DESAPARECÍAN, así que un
         alumno podía dejar de ser PIL sin ningún motivo. Pasó al empezar a
         descargar expedientes de alumnado de 2º, 3º y 4º. */
      const teorica = EDAD_TEORICA[a.curso];
      if (primaria2 !== '' && teorica && esNumero(edad) && esNumero(repESO)) {
        const desfase = aNumero(edad) - teorica - aNumero(repESO) - Number(primaria2);
        sinLocalizar = desfase > 0 ? desfase : 0;
      }
      total = (primaria2 === '' ? '' : primaria2 + repESO + (sinLocalizar === '' ? 0 : sinLocalizar));

      /* ================= DE QUÉ NOS FIAMOS (BD v33) =================

         Lo pidió Francisco el 8-sep-2026, y tiene razón: que un alumno vaya
         por detrás de su edad NO demuestra que haya repetido. Puede haberse
         incorporado tarde al sistema educativo español. Hasta la BD v32 el
         programa daba PIL en los dos casos igual, sin decir cuál era.

         Ahora se separa lo que está documentado de lo que es una suposición:

           - Las repeticiones en ESO salen del histórico de Séneca. Son un
             hecho.
           - Las de Primaria son un hecho si vienen del expediente, o si
             Francisco ha escrito el número a mano. Si vienen de la edad, son
             una suposición. Si son cero, no sostienen ningún PIL y da igual.
           - Los años sin localizar son una suposición, SALVO que podamos
             descartar la incorporación tardía. Y eso se puede descartar
             cuando tenemos su expediente completo de Primaria y empezó 1º de
             Primaria en el curso que le tocaba por su fecha de nacimiento:
             entonces estaba aquí desde el principio y los años perdidos son
             repeticiones de verdad, hechas en otro centro. */
      let incorporacionNormal = false;
      if (exp && exp.completo && exp.anoPrimero) {
        const anoNac = anoDeNacimiento_(h[9]);
        if (anoNac && Number(exp.anoPrimero) - anoNac === 6) incorporacionNormal = true;
      }
      const primariaDocumentada = corregido !== '' || fuente === 'EXPEDIENTE' ||
                                  primaria2 === 0;
      let totalSeguro = esNumero(repESO) ? aNumero(repESO) : 0;
      if (primariaDocumentada && primaria2 !== '') totalSeguro += Number(primaria2);
      if (incorporacionNormal && sinLocalizar !== '') totalSeguro += Number(sinLocalizar);
      if (sinLocalizar !== '' && sinLocalizar > 0 && !incorporacionNormal) {
        avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
          aviso: 'Va por detrás de su edad y no sabemos por qué',
          detalle: 'Le faltan ' + sinLocalizar + ' año(s) que ninguna de nuestras fuentes explica. ' +
            'Puede que repitiera en otro centro, o que se incorporara tarde al sistema educativo ' +
            'español. Mientras no se sepa, su PIL sale como "' + PIL_POR_EDAD + '". ' +
            'Si lo averiguas, escribe el número bueno en "Rep. Primaria (corregido)".' });
      }

      /* ¿De dónde viene? En 1º el curso pasado fue 6º de Primaria, así que la
         respuesta está en su expediente y no en el histórico de Séneca. */
      if (a.curso === '1º' && repite !== 'SÍ') {
        cursoPasado = '6º de Primaria';
        repetiaPasado = (exp && exp.completo)
          ? ((exp.cursosRepetidos || []).indexOf('6º') !== -1 ? 'SÍ' : 'NO')
          : SIN_DATO;
      } else if (!cursoPasado) {
        /* No estaba en este centro el año pasado. */
        cursoPasado = SIN_DATO;
        repetiaPasado = SIN_DATO;
      } else if (!repetiaPasado) {
        repetiaPasado = SIN_DATO;
      }

      /* LO QUE ESCRIBE FRANCISCO MANDA. Añadido en la BD v40.
         El histórico de Séneca solo trae las matrículas de este centro, así
         que un alumno que repitió el año pasado en otro instituto figura aquí
         como si no lo hubiera repetido. Si Francisco lo averigua, escribe SÍ
         en la columna amarilla y el programa se fía de él. */
      const diceFrancisco = String(man[5] || '').trim().toUpperCase();
      if (diceFrancisco === 'SÍ' || diceFrancisco === 'SI') {
        repetiaPasado = 'SÍ'; repetiaCorregido = true;
      } else if (diceFrancisco === 'NO') {
        repetiaPasado = 'NO'; repetiaCorregido = true;
      }

      /* CUÁNTAS SUSPENDIÓ EL AÑO PASADO.
         En 2º, 3º y 4º sale de la hoja EV de su curso del año pasado, columna
         "Suspensos", que suma las del propio curso y las pendientes: son todas
         las materias con evaluación negativa, que es lo que cuenta para
         promocionar. Las hojas ya vienen separadas por curso, así que aquí la
         clave es solo el nombre.
         En 1º el curso pasado fue 6º de Primaria y no hay hoja EV: se usan las
         materias que suspendió en 6º según su expediente. */
      if (expSec && esNumero(expSec.suspensosPasado)) {
        /* El expediente de Secundaria trae las notas de todos los centros, así
           que aquí manda sobre el cuaderno de notas de este instituto. */
        suspPasado = aNumero(expSec.suspensosPasado);
      } else if (a.curso === '1º' && repite !== 'SÍ') {
        suspPasado = (exp && exp.anoSexto) ? (exp.pendientes || []).length : SIN_DATO;
      } else if (cursoPasado && cursoPasado !== SIN_DATO) {
        const notasPasado = notasPorCurso[cursoPasado];
        const nPasado = notaDeAlumno_(notasPasado, soloNombre);
        if (nPasado && nPasado.nombreEnLaHoja && nPasado.nombreEnLaHoja !== soloNombre) {
          avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
            aviso: 'Nombre incompleto en el cuaderno de notas',
            detalle: 'En la hoja "EV ' + cursoPasado + ' ESO" figura como "' + nPasado.nombreEnLaHoja +
              '", sin el segundo apellido. He dado por hecho que es el mismo alumno, porque no ' +
              'hay ningún otro que encaje. Si lo corriges en el cuaderno de notas, este aviso ' +
              'desaparece.' });
        }
        suspPasado = (nPasado && esNumero(nPasado.declarado)) ? aNumero(nPasado.declarado) : SIN_DATO;
      } else {
        suspPasado = SIN_DATO;
      }

      /* Las tres columnas de permanencia. Ver el comentario grande de arriba. */

      /* 3. Ha agotado las dos permanencias de la etapa. */
      agotadas = (total !== '' && total >= 2) ? (totalSeguro >= 2 ? 'SÍ' : PIL_POR_EDAD) : 'NO';

      /* 2. No podrá repetir este curso otra vez. Estar repitiéndolo ahora lo
         dice el histórico de Séneca, así que ese caso nunca es una suposición
         aunque el de la etapa sí lo sea. */
      noPodra = (repite === 'SÍ') ? 'SÍ' : agotadas;

      /* 1. PIL: promocionó por imperativo legal al curso en el que está.

         Son DOS condiciones, y hacen falta las dos (BD v36):

           a) El año pasado ya no podía repetir. O porque estaba repitiendo ese
              mismo curso, o porque ya tenía gastadas las dos permanencias.
           b) Y aun así no cumplía los requisitos para promocionar, es decir
              suspendió más de MAX_SUSPENSOS_PROMOCION materias.

         Si se cumple (a) pero no (b), el alumno promocionó por sus propios
         medios y NO es PIL. Lo señaló Francisco el 8-sep-2026, y sin esa
         segunda condición el programa daba por PIL a 25 alumnos que habían
         aprobado.

         Quien repite este curso no promocionó, así que nunca es PIL. Y lo que
         no se sabe se deja en interrogante, no se afirma. */
      let noPodiaRepetir = false, noPodiaSeguro = false;
      if (repetiaPasado === 'SÍ') {
        noPodiaRepetir = true; noPodiaSeguro = true;
      } else if (total !== '' && total >= 2) {
        noPodiaRepetir = true; noPodiaSeguro = (totalSeguro >= 2);
      }

      /* EN 1º DE ESO ESTA COLUMNA VA SIEMPRE A NO. Añadido en la BD v39, y lo
         vio Francisco: un alumno de 1º que el año pasado repitió 6º de
         Primaria salía marcado como PIL, y no lo es.

         El motivo: esta columna habla de la ESO. Pasar de 6º de Primaria a 1º
         de ESO no es promocionar por imperativo legal en el sentido que le da
         el equipo directivo, y además en Primaria la promoción no se decide
         contando materias suspensas, así que la regla de "más de dos" no vale
         allí. La repetición de Primaria sigue contando para las otras dos
         columnas de permanencia y para las repeticiones totales: lo que no
         hace es convertir a nadie en PIL de entrada.

         Un repetidor de 1º tampoco lo es, porque no promocionó: se quedó. */
      if (a.curso === '1º') {
        pil = 'NO';
      } else if (repite === 'SÍ') {
        pil = 'NO';
      } else if (!noPodiaRepetir) {
        /* Aquí el programa diría que no es PIL. Pero hay un caso en el que no
           puede estar seguro, y lo vio Francisco el 8-sep-2026 con un alumno
           que había repetido 2º en otro instituto:

             - le faltan años que ninguna fuente explica ('Rep. sin localizar'),
             - y el año pasado suspendió más de dos materias.

           Ese año perdido pudo ser justo el curso pasado, repitiendo fuera. Si
           fue así, el alumno no podía volver a repetirlo y es PIL. Como no se
           puede demostrar ni descartar, va la interrogante y sale en AVISOS.
           Si Francisco lo averigua, lo escribe en la columna amarilla
           'Repetía el año pasado (corregido)' y esto se cierra. */
        if (repetiaPasado === SIN_DATO) {
          pil = SIN_DATO;
        } else if (!repetiaCorregido && sinLocalizar !== '' && sinLocalizar > 0 &&
                   esNumero(suspPasado) && aNumero(suspPasado) > MAX_SUSPENSOS_PROMOCION) {
          pil = SIN_DATO;
          avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
            aviso: 'Puede ser PIL y no se puede saber aquí',
            detalle: 'El año pasado suspendió ' + suspPasado + ' materias, y le falta ' +
              sinLocalizar + ' año que ninguna de nuestras fuentes explica. Si ese año lo ' +
              'perdió repitiendo el curso pasado en otro centro, no podía volver a repetirlo ' +
              'y es PIL. Míralo en Séneca: si el año pasado estaba repitiendo, escribe SÍ en ' +
              'la columna amarilla "Repetía el año pasado (corregido)"; si no, escribe NO.' });
        } else {
          pil = 'NO';
        }
      } else if (!esNumero(suspPasado)) {
        pil = SIN_DATO;
      } else if (aNumero(suspPasado) > MAX_SUSPENSOS_PROMOCION) {
        pil = noPodiaSeguro ? 'SÍ' : PIL_POR_EDAD;
      } else {
        pil = 'NO';
      }

      /* QUÉ cursos de Primaria repitió. Solo lo dice el expediente, y solo
         hay expedientes de alumnado de 1º. Si el alumno no repitió ninguno,
         no hay nada que poner y la casilla va vacía; si repitió pero no
         sabemos cuál, va la interrogante. */
      if (exp && exp.repeticiones !== '' && exp.repeticiones !== undefined) {
        cursosPrim = (exp.cursosRepetidos || []).join(', ');
      } else if (primaria2 === 0) {
        cursosPrim = '';
      } else {
        cursosPrim = SIN_DATO;
      }

      if (repite === 'SÍ') {
        const notas = notasPorCurso[a.curso];
        /* Las notas ya vienen separadas por curso (notasPorCurso), así que aquí
           la clave es solo el nombre. */
        const n = notaDeAlumno_(notas, soloNombre);
        /* "5 de 2º: FYQ, GEH, LCL" : cuántas son, de qué curso, y cuáles.
           Lleva el curso para que no se confunda con las pendientes.
           Los dos puntos ocupan menos que la raya larga, y en estas columnas
           cada punto de ancho se nota. */
        if (n) mns = n.n ? (n.n + ' de ' + a.curso + ': ' + n.lista.join(', ')) : '';
        else {
          /* Repite, pero no sabemos qué suspendió: eso no es lo mismo que no
             deber nada, así que va la interrogante. */
          mns = SIN_DATO;
          avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
            aviso: 'Repetidor sin notas del curso pasado',
            detalle: 'No aparece en la pestaña EV de su curso. En el informe sale "' +
                     SIN_DATO + '" en vez de quedarse en blanco.' });
        }
      }
      if (h[2] && a.unidad && normalizar(h[2]) !== normalizar(a.unidad)) {
        avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre, aviso: 'Unidad distinta en el histórico',
          detalle: 'Matrícula: ' + a.unidad + ' / Histórico: ' + h[2] });
      }
    }
    if (!a.unidad) {
      avisos.push({ curso: a.curso, grupo: '', alumno: a.nombre, aviso: 'Sin unidad asignada',
        detalle: 'No aparecerá en ningún informe de grupo' });
    }
    if (a.curso === '1º' && hayIdiomaEn1 && !(v['FR -> ALCT'] || '')) {
      avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
        aviso: 'Sin Francés ni Área Lingüística',
        detalle: 'En 1º todo el alumnado tiene que estar matriculado en Francés (Segundo Idioma) ' +
                 'o en Área Lingüística de carácter transversal. En Séneca no tiene ninguna de las dos.' });
    }

    /* Las pendientes. En 2º, 3º y 4º salen de las columnas PEND del CSV de
       Séneca, que están siempre: una casilla vacía ahí quiere decir que el
       alumno no debe nada.

       En 1º es distinto. Séneca no trae nada, y las materias que el alumno
       suspendió en 6º de Primaria salen de su expediente, que Francisco va
       descargando uno a uno. Mientras no esté descargado el de un alumno, no
       sabemos si debe algo o no: ahí va la interrogante.

       EXCEPCIÓN, decidida por Francisco el 6-sep-2026: un alumno que REPITE 1º
       no arrastra nada de Primaria. Está volviendo a cursar el año entero, y lo
       que le quedó sale en NO SUPERADAS. Su expediente de Primaria ya se miró
       el curso pasado, cuando llegó al centro. Así que su casilla se queda
       vacía y no pide un expediente que no hace falta descargar. Si aun así el
       expediente está descargado, se muestra lo que diga. */
    let pend = a.pend;
    let pendTexto = pend.length ? (pend.length + ': ' + pend.join(', ')) : '';
    if (a.curso === '1º') {
      if (exp && exp.anoSexto) {
        pend = a.pend.concat(exp.pendientes);
        pendTexto = pend.length ? (pend.length + ': ' + pend.join(', ')) : '';
      } else if (!pend.length && repite !== 'SÍ') {
        pendTexto = SIN_DATO;
      }
    }

    /* Diversificación. En 4º Séneca la marca con los ámbitos. En 1º, 2º y 3º
       Séneca no la trae, así que solo la sabemos por el fichero de Jefatura. */
    /* LA ÚLTIMA PALABRA LA TIENE EL EQUIPO DIRECTIVO. Añadido en la BD v41,
       a petición del director: quiere poder marcar a mano si un alumno es PIL
       o no, cuando no esté de acuerdo con lo que decide el programa.

       Se escribe SÍ o NO en la columna amarilla 'PIL (a mano)' y manda sobre
       todo lo demás, incluida la interrogante. Va también al informe en papel.
       Dejarla vacía quiere decir "decide tú", que es lo normal.

       Solo afecta a la columna PIL. Las otras dos columnas de permanencia
       siguen diciendo lo que dicen los datos: contestan a otras preguntas y no
       son cosa de una decisión. */
    /* A QUIÉN LE HACE FALTA EL EXPEDIENTE DE SECUNDARIA. Descargarlos es un
       trabajo de uno en uno, así que el programa dice exactamente de quién
       merece la pena. Hace falta cuando su trayectoria de ESO no cuadra y el
       histórico de este centro no puede explicarlo:
         - le faltan años que ninguna fuente explica, o
         - no sabemos en qué curso estaba el año pasado, o
         - su PIL se ha quedado en interrogante.
       En 1º no hace falta: no ha estado antes en la ESO. */
    if (!expSec && a.curso !== '1º' &&
        ((sinLocalizar !== '' && sinLocalizar > 0) || cursoPasado === SIN_DATO ||
         pil === SIN_DATO)) {
      avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
        aviso: 'Hace falta su expediente de Secundaria',
        detalle: 'Su trayectoria en la ESO no cuadra con lo que ve el histórico de este centro' +
          ((sinLocalizar !== '' && sinLocalizar > 0)
            ? ', y le falta ' + sinLocalizar + ' año que nada explica' : '') +
          '. Descarga de Séneca su expediente académico de Secundaria y déjalo en la ' +
          'subcarpeta "' + CARPETA_SECUNDARIA + '", con el nombre "' + PREFIJO_EXP_SEC + ' ' +
          a.nombre + '.csv". Ese fichero trae sus años en otros institutos y cierra el caso solo.' });
    }
    const decisionAMano = String(man[6] || '').trim().toUpperCase();
    if (decisionAMano === 'SÍ' || decisionAMano === 'SI') {
      pil = 'SÍ';
    } else if (decisionAMano === 'NO') {
      pil = 'NO';
    }

    /* El cuadro de la trayectoria. Se arma al final, cuando ya está todo
       decidido, porque su última línea es el veredicto. */
    const cuadro = trayectoria_({
      exp: exp, expSec: expSec,
      anosESO: h ? h[13] : '',
      repPrim: repPrim, fuenteP: fuente,
      sinLocalizar: sinLocalizar, suspPasado: suspPasado,
      pil: pil, aMano: (decisionAMano === 'SÍ' || decisionAMano === 'SI' || decisionAMano === 'NO')
    });

    const divSeneca = (v['MAT'] === 'ÁMB') || a.diver === true;
    const divJefatura = !!(jef[clave] && jef[clave].div === 'SÍ');
    const diver = divSeneca ? 'SÍ' : (divJefatura ? 'SÍ (solo Jefatura)' : 'NO');

    /* La fila se monta por TÍTULO, no por posición. Así, cambiar el orden de
       las columnas es cambiar solo la lista TITULOS_ALUMNADO, y no hay forma de
       que los datos se descoloquen respecto a los rótulos. */
    const valores = {
      'Alumno/a': a.nombre,
      'Unidad': a.unidad,
      'Curso': a.curso,
      'Repite el curso actual': repite,
      'Curso el año pasado': cursoPasado,
      'Repetía el año pasado': repetiaPasado,
      'Repetía el año pasado (corregido)': man[5] || '',
      'Suspensos el año pasado': suspPasado,
      'Diversificación': diver,
      'OPT': v['OPT'] || '',
      'FR -> ALCT': v['FR -> ALCT'] || '',
      'MAT': v['MAT'] || '',
      'OPC1': v['OPC1'] || '',
      'OPC2': v['OPC2'] || '',
      'OPC3': v['OPC3'] || '',
      'OPC4': v['OPC4'] || '',
      'REL/Atedu': v['REL/Atedu'] || '',
      'Nº pendientes': pend.length ? pend.length : '',
      'Asignaturas pendientes': pendTexto,
      'Edad a 31/12': edad,
      'MAT NO SUP.': mns,
      'Repeticiones en ESO': repESO,
      'Cursos repetidos en ESO': cursosESO,
      'Fuente ESO': fuenteESO,
      'Rep. Primaria (calculado)': repPrim,
      'Cursos repetidos en Primaria': cursosPrim,
      'Fuente Primaria': fuente,
      'Rep. sin localizar': sinLocalizar,
      'Rep. Primaria (corregido)': man[0] || '',
      'Motivo de la corrección': man[1] || '',
      'Repeticiones totales': total,
      'PIL (a mano)': man[6] || '',
      'PIL': pil,
      'No podrá repetir este curso': noPodra,
      'Ha agotado las dos permanencias': agotadas,
      'Trayectoria': cuadro,
      /* NEAE y MEDIDAS Y RECURSOS salen del censo de Séneca. En los cursos que
         el censo trae, el censo manda: quien no aparece en él se queda con la
         casilla vacía, para que un dato equivocado no se quede escrito para
         siempre. En los cursos que el censo no trae se conserva lo que hubiera. */
      'NEAE': censo[clave] ? censo[clave].neae : (cursosDelCenso[a.curso] ? '' : (man[2] || '')),
      'MEDIDAS Y RECURSOS': censo[clave] ? censo[clave].medidas : (cursosDelCenso[a.curso] ? '' : (man[3] || '')),
      'Observaciones': man[4] || ''
    };
    filas.push(TITULOS_ALUMNADO.map(function (t) {
      return valores[t] === undefined ? '' : valores[t];
    }));
  }
  if (enOtroCurso.length) {
    avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'El histórico va por detrás de la matrícula',
      detalle: enOtroCurso.length + ' alumnos figuran en RegAlum.csv en un curso distinto del que ' +
        'tienen matriculado ahora. He usado su fila del histórico igualmente. Si son muchos, ' +
        'vuelve a descargar RegAlum.csv de Séneca. Por ejemplo: ' + enOtroCurso.slice(0, 5).join('; ') });
  }
  return { filas: filas, avisos: avisos };
}

/*** ================= LECTURA FILTRADA (para ficheros grandes) ================= ***/
function textoATablaFiltrada(texto, nombres) {
  texto = texto.replace(/^﻿/, '');
  const lineas = texto.split(/\r?\n/);
  let primeraIdx = -1;
  for (let i = 0; i < lineas.length; i++) { if (lineas[i].trim()) { primeraIdx = i; break; } }
  if (primeraIdx === -1) return [];
  const primera = lineas[primeraIdx];
  const sep = (primera.split(';').length - 1) > (primera.split(',').length - 1) ? ';' : ',';
  const cab = partirLineaCsv(primera, sep);
  const cabN = cab.map(normalizar);
  const idx = [], titulos = [];
  for (let n = 0; n < nombres.length; n++) {
    const i = cabN.indexOf(normalizar(nombres[n]));
    if (i !== -1) { idx.push(i); titulos.push(cab[i]); }
  }
  const tabla = [titulos];
  for (let i = primeraIdx + 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;
    const campos = partirLineaCsv(lineas[i], sep);
    const fila = [];
    for (let k = 0; k < idx.length; k++) fila.push(campos[idx[k]] === undefined ? '' : campos[idx[k]]);
    tabla.push(fila);
  }
  return tabla;
}

function textoDeArchivo(archivo) {
  const blob = archivo.getBlob();
  let texto = blob.getDataAsString('UTF-8');
  if (texto.indexOf('�') !== -1) texto = blob.getDataAsString('ISO-8859-1');
  return texto;
}

/*** ================= BÚSQUEDA DE FICHEROS =================
 *
 * "Actualizar los datos" mira las mismas dos carpetas de Drive muchas veces
 * en una sola pulsación: una vez para enseñar el cuadro de antes de empezar,
 * y otra vez por cada fuente al construir la tabla (RegAlum, la matrícula,
 * el censo NEAE, Jefatura, el membrete...). Cada mirada volvía a listar los
 * ficheros de las carpetas desde cero, y eso es lo que más tarda de todo si
 * hay muchos ficheros dentro (por ejemplo, años de expedientes de Primaria).
 *
 * Aquí se listan una sola vez por ejecución y se guarda el resultado en una
 * caché. La próxima vez que se pulse un botón del menú es una ejecución
 * nueva (Actualizador.gs vuelve a traer y a compilar el programa entero),
 * así que esta caché se vacía sola y nunca da información vieja.
 *
 * La lista de ficheros de cada carpeta (ficherosPorCarpeta_) vive en su
 * propio fichero, Ficheros.gs, para que no se pueda volver a perder al
 * reescribir éste. Aquí solo queda la caché de las carpetas.
 * ======================================================== ***/
let CACHE_CARPETAS_ = null;

function carpetasDondeBuscar() {
  if (CACHE_CARPETAS_) return CACHE_CARPETAS_;
  const lista = [];
  const carpeta = DriveApp.getFolderById(CARPETA_ID);
  lista.push(carpeta);
  const padres = carpeta.getParents();
  while (padres.hasNext()) lista.push(padres.next());
  CACHE_CARPETAS_ = lista;
  return lista;
}

/* ficherosPorCarpeta_() está en Ficheros.gs: devuelve los ficheros de cada
   carpeta de carpetasDondeBuscar(), en el mismo orden, listados una sola vez
   por ejecución. Guarda los ficheros de todo tipo (CSV, Hojas de cálculo,
   imágenes...), porque distintas búsquedas quieren distintos tipos; cada una
   filtra lo que le hace falta. */

function buscarCsv(prefijo, contiene) {
  const listas = ficherosPorCarpeta_();
  let mejor = null;
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      const n = f.getName();
      if (!/\.csv$/i.test(n)) continue;
      if (normalizar(n).indexOf(normalizar(prefijo)) !== 0) continue;
      if (contiene && n.indexOf(contiene) === -1) continue;
      if (!mejor || f.getLastUpdated().getTime() > mejor.getLastUpdated().getTime()) mejor = f;
    }
    if (mejor) break;
  }
  return mejor;
}

/* Los ficheros de matrícula de BACHILLERATO que hay en la carpeta.
   buscarCsvsMatricula() los descarta para no leerlos como si fueran de la ESO,
   pero descartar algo en silencio es justo lo que no se debe hacer: Francisco
   los habrá dejado ahí a propósito y tiene que ver que el programa los ha
   encontrado y que todavía no los usa. Devuelve solo los nombres. */
function ficherosDeBachillerato_() {
  const nombres = [];
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const n = ficheros[i].getName();
      if (!/\.csv$/i.test(n)) continue;
      if (normalizar(n).indexOf('matomcmatr') !== 0) continue;
      if (n.indexOf(CURSO_ACTUAL) === -1) continue;
      if (normalizar(n).indexOf('bach') === -1) continue;
      if (nombres.indexOf(n) === -1) nombres.push(n);
    }
    if (nombres.length) break;
  }
  return nombres;
}

function buscarCsvsMatricula() {
  const encontrados = {};
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      const n = f.getName();
      if (!/\.csv$/i.test(n)) continue;
      if (normalizar(n).indexOf('matomcmatr') !== 0) continue;
      if (n.indexOf(CURSO_ACTUAL) === -1) continue;
      /* LOS CSV DE BACHILLERATO SE DESCARTAN AQUÍ, A PROPÓSITO.
         Se llaman igual que los de la ESO y también llevan un "1º" o un "2º"
         en el nombre, así que sin esta línea entrarían por el mismo filtro y
         el programa los leería como si fueran 1º y 2º de la ESO. Peor aún:
         abajo se guarda solo el MÁS RECIENTE de cada curso, y como los de
         Bachillerato se descargan después, sustituirían a los de la ESO sin
         que nadie se enterase. La ESO se quedaría sin optativas ni religión.
         Son cuatro ficheros, dos por curso, porque van separados por
         modalidad: MatOMCMatr1ºBACH-c-26-27.csv (Ciencias y Tecnología) y
         MatOMCMatr1ºBACH-h-26-27.csv (Humanidades y CC. Sociales).
         Esta línea desaparece cuando el curso lleve la etapa dentro
         (1ºESO, 1ºBAC). Hasta entonces, el sistema solo carga la ESO.
         Ver el punto 11.1 de CONTEXTO.md y claude/PLAN-BACHILLERATO.md. */
      if (normalizar(n).indexOf('bach') !== -1) continue;
      const m = n.match(/([1-4])\s*º/);
      if (!m) continue;
      const curso = m[1] + 'º';
      if (!encontrados[curso] || f.getLastUpdated().getTime() > encontrados[curso].getLastUpdated().getTime()) {
        encontrados[curso] = f;
      }
    }
    if (Object.keys(encontrados).length === 4) break;
  }
  return encontrados;
}

function libroDeNotas() {
  try {
    const l = SpreadsheetApp.openById(ID_PROPUESTA);
    if (l) return l;
  } catch (e) { /* seguimos buscando por nombre */ }
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      if (f.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
      if (normalizar(f.getName()).indexOf('propuesta') !== -1) return SpreadsheetApp.openById(f.getId());
    }
  }
  return null;
}

/*** ================= CÓMO SE AVISA AL TERMINAR =================
 *
 * Antes se usaba un cuadro de diálogo que había que aceptar. El 6-sep-2026 ese
 * cuadro dejó de poder mostrarse: Google respondía "El motor de JavaScript ha
 * notificado un error inesperado. Código de error: INTERNAL", y como el script
 * se queda esperando a que alguien pulse Aceptar, la ejecución quedaba
 * "En pausa" para siempre aunque el trabajo ya estuviera hecho.
 *
 * Desde BD v15 no se usa ningún cuadro que haya que aceptar. El resumen se
 * escribe en la pestaña RESUMEN y se anuncia con un aviso flotante, que no
 * detiene nada. Un clic menos por operación.
 * ======================================================== ***/
const HOJA_RESUMEN = 'RESUMEN';

function avisar_(titulo, texto) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const lineas = String(texto === null || texto === undefined ? '' : texto).split('\n');
  try {
    let hoja = libro.getSheetByName(HOJA_RESUMEN);
    if (!hoja) hoja = libro.insertSheet(HOJA_RESUMEN, 0);
    hoja.clear();
    hoja.getRange(1, 1).setValue(titulo).setFontWeight('bold').setFontSize(13);
    hoja.getRange(2, 1).setValue('Terminado el ' + new Date().toLocaleString('es-ES'))
        .setFontStyle('italic');
    const filas = [];
    for (let i = 0; i < lineas.length; i++) filas.push([lineas[i]]);
    if (filas.length) hoja.getRange(4, 1, filas.length, 1).setValues(filas);
    hoja.setColumnWidth(1, 620);
    libro.setActiveSheet(hoja);
  } catch (e) { /* si no se puede escribir la pestaña, al menos sale el aviso */ }
  try { libro.toast(titulo, 'Terminado. Míralo en la pestaña ' + HOJA_RESUMEN, 20); }
  catch (e) { /* sin interfaz, tampoco pasa nada */ }
}

/*** ================= BOTÓN 1: HISTÓRICO ================= ***/
function cargarHistorico() {
  const archivo = buscarCsv('RegAlum');
  if (!archivo) {
    avisar_('No he encontrado el histórico',
      'No hay ningún fichero que empiece por "RegAlum" ni en la carpeta de datos ni en la de arriba.');
    return;
  }
  let res;
  try {
    const tabla = textoATablaFiltrada(textoDeArchivo(archivo),
      ['Alumno/a', 'Nº Id. Escolar', 'Curso', 'Unidad', 'Año de la matrícula',
       'Edad a 31/12 del año de matrícula', 'Estado Matrícula', 'Fecha de nacimiento']);
    res = calcularHistorial(tabla);
  } catch (e) {
    avisar_('No he podido leer el histórico', e.message);
    return;
  }

  const hoja = hojaLimpia(HOJA_HISTORIAL, TITULOS_HISTORIAL.length);
  hoja.getRange(1, 1).setValue('Histórico de matrículas. Origen: ' + archivo.getName() +
    '. Año de matrícula más reciente: ' + res.ano + '. Actualizado: ' + new Date().toLocaleString('es-ES'))
    .setFontStyle('italic');
  hoja.getRange(2, 1, 1, TITULOS_HISTORIAL.length).setValues([TITULOS_HISTORIAL]).setFontWeight('bold');
  if (res.filas.length) hoja.getRange(3, 1, res.filas.length, TITULOS_HISTORIAL.length).setValues(res.filas);
  hoja.setFrozenRows(2);
  /* No se ajusta el ancho aquí: arreglarFormatoDeTodo_ (Formato.gs) le pone a
     esta pestaña un ancho fijo por columna justo después, así que ajustarlo
     antes solo tardaba tiempo para nada. Ver el comentario grande al principio
     de Formato.gs. */

  avisar_('Histórico cargado (' + VERSION + ')',
    'Fichero: ' + archivo.getName() + '\nAño más reciente: ' + res.ano +
    '\nAlumnos de ESO matriculados ese año: ' + res.filas.length +
    '\n\nAhora pulsa "2. Construir la tabla ALUMNADO".');
}

/*** ================= BOTÓN 2: ALUMNADO ================= ***/
function construirAlumnado() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  let hHist = libro.getSheetByName(HOJA_HISTORIAL);
  if (!hHist || hHist.getLastRow() < 3) {
    avisar_('Falta el histórico', 'Antes tienes que pulsar "1. Leer el histórico de matrículas".');
    return false;
  }

  /* Una pestaña HISTORIAL hecha con una versión anterior no trae algunas
     columnas, y esos datos solo están en RegAlum.csv. Se relee el histórico
     una vez y ya queda. */
  const COLS_QUE_OBLIGAN_A_RELEER = ['Cursos repetidos en ESO', 'Curso el año pasado',
                                     'Repetía el año pasado', 'Años en la ESO'];
  try {
    const titulosH = hHist.getRange(2, 1, 1, hHist.getLastColumn()).getValues()[0].map(normalizar);
    let falta = false;
    for (let q = 0; q < COLS_QUE_OBLIGAN_A_RELEER.length; q++) {
      if (titulosH.indexOf(normalizar(COLS_QUE_OBLIGAN_A_RELEER[q])) === -1) falta = true;
    }
    if (falta) {
      cargarHistorico();
      hHist = libro.getSheetByName(HOJA_HISTORIAL);
      if (!hHist || hHist.getLastRow() < 3) {
        avisar_('Falta el histórico', 'No he podido releer RegAlum.csv.');
        return false;
      }
    }
  } catch (e) { /* si no se puede mirar, se sigue con lo que haya */ }

  /* Se lee lo que haya y se rellena el resto, en vez de reventar. */
  const anchoHist = Math.min(TITULOS_HISTORIAL.length, Math.max(1, hHist.getLastColumn()));
  const historial = hHist.getRange(3, 1, hHist.getLastRow() - 2, anchoHist).getValues();
  if (anchoHist < TITULOS_HISTORIAL.length) {
    for (let f = 0; f < historial.length; f++) {
      while (historial[f].length < TITULOS_HISTORIAL.length) historial[f].push('');
    }
  }

  const ficheros = buscarCsvsMatricula();
  const cursos = Object.keys(ficheros);
  if (!cursos.length) {
    avisar_('No hay ficheros de matrícula',
      'No he encontrado ninguno del curso ' + CURSO_ACTUAL +
      '.\nDeben llamarse MatOMCMatr...' + CURSO_ACTUAL + '.csv');
    return false;
  }

  const porCurso = {}, avisos = [], resumen = [];
  const ficherosSinMaterias = [];

  /* EL BACHILLERATO. Va por su cuenta, en Bachillerato.gs, porque sus reglas
     no son las de la ESO. Sus alumnos entran en el mismo montón, con el curso
     escrito "1º BACH" y "2º BACH", así que no pueden confundirse con los de
     1º y 2º de la ESO. */
  const bac = alumnadoDeBachillerato_();
  for (const cb in bac.porCurso) porCurso[cb] = bac.porCurso[cb];
  bac.avisos.forEach(function (x) { avisos.push(x); });
  bac.resumen.forEach(function (x) { resumen.push(x); });
  for (let i = 0; i < cursos.length; i++) {
    const curso = cursos[i];
    const r = leerMatricula(textoATabla(textoDeArchivo(ficheros[curso])), curso);
    porCurso[curso] = r.alumnos;
    resumen.push(curso + ' ESO: ' + r.alumnos.length + ' alumnos (' + ficheros[curso].getName() + ')');

    /* Cuántas asignaturas esperábamos encontrar en el CSV de este curso, y
       cuántas hemos encontrado de verdad. */
    let esperadas = 0;
    const reglasCurso = REGLAS[curso] || [];
    for (let k = 0; k < reglasCurso.length; k++) {
      esperadas += Object.keys(reglasCurso[k].codigos).length;
    }
    if (esperadas > 0 && r.faltan.length >= esperadas) {
      ficherosSinMaterias.push(curso + ' ESO (' + ficheros[curso].getName() + ')');
    }

    r.faltan.forEach(function (t) {
      avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Asignatura no encontrada en el CSV', detalle: t });
    });
    r.dobles.forEach(function (t) {
      avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Dos opciones a la vez', detalle: t });
    });
  }

  /* PARADA DE SEGURIDAD. Si en el CSV de un curso no aparece NINGUNA de sus
     asignaturas, ese fichero no es el informe de matrícula: es otro listado de
     Séneca con el mismo nombre. Si siguiéramos, la tabla ALUMNADO se quedaría
     sin optativas, sin religión y sin matemáticas, y la comparación con
     Jefatura sacaría miles de diferencias falsas. Pasó el 7-sep-2026.
     Mejor no actualizar nada y decir qué fichero hay que volver a descargar. */
  if (ficherosSinMaterias.length) {
    avisar_('No he actualizado nada: falta información en los ficheros de matrícula',
      'Estos ficheros no traen las asignaturas:\n\n' + ficherosSinMaterias.join('\n') +
      '\n\nTienen el nombre correcto, pero dentro solo llevan el alumno y su unidad. ' +
      'Son otro listado de Séneca, no el informe de matrícula.\n\n' +
      'Vuelve a descargar de Séneca el informe de matrícula que trae UNA COLUMNA POR ASIGNATURA, ' +
      'déjalo en la carpeta con el mismo nombre, y pulsa otra vez "Actualizar los datos".\n\n' +
      'No he tocado la base de datos: sigue como estaba.');
    return false;
  }

  const notas = {};
  const libroNotas = libroDeNotas();
  if (!libroNotas) {
    avisos.push({ curso: '', grupo: '', alumno: '', aviso: 'No encuentro el libro de notas',
      detalle: 'Sin él, la columna MAT NO SUP. queda vacía' });
  } else {
    for (let i = 0; i < cursos.length; i++) {
      const curso = cursos[i];
      const hoja = libroNotas.getSheetByName('EV ' + curso + ' ESO');
      if (!hoja) {
        avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Falta la pestaña de notas',
          detalle: 'No existe "EV ' + curso + ' ESO" en ' + libroNotas.getName() });
        continue;
      }
      const leidas = leerNotas(hoja.getDataRange().getValues());
      if (leidas) notas[curso] = leidas;
      else avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Pestaña de notas ilegible',
        detalle: 'No encuentro la columna Suspensos en EV ' + curso + ' ESO' });
    }
  }

  /* Tercera fuente: el fichero de agrupamientos de Jefatura de Estudios. */
  const J = leerJefatura_();
  const jefPorNombre = {};
  for (let i = 0; i < J.alumnos.length; i++) {
    jefPorNombre[normalizar(J.alumnos[i].nombre) + '|' + J.alumnos[i].curso] = J.alumnos[i];
  }
  for (let i = 0; i < J.avisos.length; i++) {
    const a = J.avisos[i];
    if (typeof a === 'string') avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'Fichero de Jefatura', detalle: a });
    else avisos.push(a);
  }

  /* Cuarta fuente: el censo NEAE de Séneca. Rellena solas las columnas
     NEAE y MEDIDAS Y RECURSOS. Ver NEAE.gs. */
  const N = datosNeae_(historial, 0, 3, TITULOS_HISTORIAL.indexOf('Fecha de nacimiento'));
  for (let i = 0; i < N.avisos.length; i++) avisos.push(N.avisos[i]);

  /* Quinta fuente: los expedientes de Primaria (ahora para cualquier curso).
     Rellenan las pendientes de 6º y las repeticiones. Ver Primaria.gs. */
  const cursosDeAlumno = {};
  for (const c in porCurso) {
    for (let i = 0; i < porCurso[c].length; i++) {
      const nom = normalizar(porCurso[c][i].nombre);
      if (!cursosDeAlumno[nom]) cursosDeAlumno[nom] = [];
      cursosDeAlumno[nom].push(c);
    }
  }
  const P = datosPrimaria_(cursosDeAlumno);
  /* Sexta fuente, opcional: los expedientes de Secundaria. Solo hacen falta
     los del alumnado avisado. Ver Secundaria.gs. */
  const S = datosSecundaria_(cursosDeAlumno);
  for (let i = 0; i < S.avisos.length; i++) avisos.push(S.avisos[i]);
  for (let i = 0; i < P.avisos.length; i++) avisos.push(P.avisos[i]);

  const manuales = leerManualesAlumnado(libro);
  const R = componerAlumnado(porCurso, historial, notas, manuales, jefPorNombre, N.porNombre,
                             P.porNombre, S.porNombre);
  R.avisos.forEach(function (a) { avisos.push(a); });

  escribirAlumnado(R.filas);

  /* La pestaña NEAE deja ver a quién se ha asignado cada ficha del censo,
     que en el fichero de Séneca solo viene con las iniciales. */
  const iNomA = TITULOS_ALUMNADO.indexOf('Alumno/a'), iUniA = TITULOS_ALUMNADO.indexOf('Unidad');
  const iCurA = TITULOS_ALUMNADO.indexOf('Curso');
  const unidadesPorNombre = {}, enAlumnado = {}, mismoNombre = {};
  for (let f = 0; f < R.filas.length; f++) {
    const k = normalizar(R.filas[f][iNomA]) + '|' + R.filas[f][iCurA];
    unidadesPorNombre[k] = R.filas[f][iUniA];
    enAlumnado[k] = true;
    const soloNom = normalizar(R.filas[f][iNomA]);
    if (!mismoNombre[soloNom]) mismoNombre[soloNom] = [];
    mismoNombre[soloNom].push(R.filas[f]);
  }

  /* Dos alumnos distintos pueden llamarse igual. El sistema los separa por el
     curso, así que conviene tenerlos localizados: si algún día coincidieran en
     el mismo curso, el curso ya no bastaría y habría que mirarlos a mano. */
  for (const nom in mismoNombre) {
    const iguales = mismoNombre[nom];
    if (iguales.length < 2) continue;
    const donde = iguales.map(function (f) { return f[iUniA] || '(sin unidad)'; });
    let mismoCurso = false;
    for (let a = 0; a < iguales.length; a++) {
      for (let b = a + 1; b < iguales.length; b++) {
        if (iguales[a][iCurA] === iguales[b][iCurA]) mismoCurso = true;
      }
    }
    avisos.push({ curso: iguales[0][iCurA], grupo: '', alumno: iguales[0][iNomA],
      aviso: 'Dos alumnos con el mismo nombre',
      detalle: 'Aparece en ' + donde.join(' y en ') + '. ' + (mismoCurso
        ? 'Coinciden en el mismo curso, así que el programa NO los puede distinguir: hay que revisar a mano sus datos.'
        : 'Son cursos distintos, así que el programa los distingue bien y cada uno lleva lo suyo.') });
  }
  try { escribirNeae_(N.porNombre, unidadesPorNombre, N.nombre); }
  catch (e) { avisos.push({ curso: '', grupo: '', alumno: '',
    aviso: 'No he podido escribir la pestaña NEAE', detalle: e.message }); }

  /* Un expediente de Primaria cuyo nombre de fichero no case con ningún alumno
     de la tabla no sirve de nada, y hay que verlo. Casi siempre es una errata
     en el nombre del fichero. */
  let expSinAlumno = 0;
  for (const k in P.porNombre) {
    if (enAlumnado[k]) continue;
    expSinAlumno++;
    const cursoAviso = k.split('|')[1] || '';
    avisos.push({ curso: cursoAviso, grupo: '', alumno: P.porNombre[k].nombre,
      aviso: 'Expediente de Primaria sin alumno',
      detalle: 'El fichero "' + P.porNombre[k].fichero + '" no corresponde a ningún alumno de la tabla. ' +
               'Comprueba que el nombre del fichero está escrito igual que en Séneca.' });
  }
  try { escribirSecundaria_(S.porNombre, unidadesPorNombre, enAlumnado); }
  catch (e) { avisos.push({ curso: '', grupo: '', alumno: '',
    aviso: 'No he podido escribir la pestaña SECUNDARIA', detalle: e.message }); }

  try { escribirPrimaria_(P.porNombre, unidadesPorNombre, enAlumnado); }
  catch (e) { avisos.push({ curso: '', grupo: '', alumno: '',
    aviso: 'No he podido escribir la pestaña PRIMARIA', detalle: e.message }); }

  escribirAvisos(avisos);

  escribirJefatura_(J.alumnos, J.nombre);
  const idxAlum = {};
  for (let c = 0; c < TITULOS_ALUMNADO.length; c++) idxAlum[normalizar(TITULOS_ALUMNADO[c])] = c;
  const discrepancias = J.alumnos.length ? compararJefatura_(R.filas, idxAlum, J.alumnos) : [];
  const nDiscrep = escribirDiscrepancias_(discrepancias, J.nombre);

  const iPil = TITULOS_ALUMNADO.indexOf('PIL');
  const iNoPodra = TITULOS_ALUMNADO.indexOf('No podrá repetir este curso');
  const iPilE = TITULOS_ALUMNADO.indexOf('Ha agotado las dos permanencias');
  const iMns = TITULOS_ALUMNADO.indexOf('MAT NO SUP.');
  const iPen = TITULOS_ALUMNADO.indexOf('Nº pendientes');
  const iAsi = TITULOS_ALUMNADO.indexOf('Asignaturas pendientes');
  const iCur = TITULOS_ALUMNADO.indexOf('Curso');
  const iRep = TITULOS_ALUMNADO.indexOf('Repite el curso actual');
  const iDiv = TITULOS_ALUMNADO.indexOf('Diversificación');
  const iFue = TITULOS_ALUMNADO.indexOf('Fuente Primaria');
  const iCPr = TITULOS_ALUMNADO.indexOf('Cursos repetidos en Primaria');
  const esPil = function (v) { return String(v).indexOf('SÍ') === 0; };
  const pil = R.filas.filter(function (f) { return esPil(f[iPil]); }).length;
  const noPodra = R.filas.filter(function (f) { return esPil(f[iNoPodra]); }).length;
  const pilEtapa = R.filas.filter(function (f) { return esPil(f[iPilE]); }).length;
  /* De esos, los que salen apoyados en una suposición por edad. */
  const pilPorEdad = R.filas.filter(function (f) {
    return f[iPil] === PIL_POR_EDAD || f[iNoPodra] === PIL_POR_EDAD ||
           f[iPilE] === PIL_POR_EDAD;
  }).length;
  /* Y aquellos de los que no sabemos en qué curso estaban el año pasado,
     casi siempre porque llegaron este año de otro centro. */
  const pilSinSaber = R.filas.filter(function (f) { return f[iPil] === SIN_DATO; }).length;
  /* Los que ha decidido a mano el equipo directivo. */
  const iMano = TITULOS_ALUMNADO.indexOf('PIL (a mano)');
  const pilAMano = R.filas.filter(function (f) { return String(f[iMano]).trim() !== ''; }).length;
  const necesitanSec = avisos.filter(function (a) {
    return a.aviso === 'Hace falta su expediente de Secundaria';
  }).length;
  /* Los que el año pasado no podían repetir pero promocionaron aprobando: por
     eso NO son PIL. Antes de la BD v36 el programa los contaba como PIL. */
  const iSus = TITULOS_ALUMNADO.indexOf('Suspensos el año pasado');
  const iRepPas = TITULOS_ALUMNADO.indexOf('Repetía el año pasado');
  const promocionaronSolos = R.filas.filter(function (f) {
    return f[iRepPas] === 'SÍ' && f[iRep] !== 'SÍ' && esNumero(f[iSus]) &&
           aNumero(f[iSus]) <= MAX_SUSPENSOS_PROMOCION;
  }).length;
  const mns = R.filas.filter(function (f) { return f[iMns] !== '' && f[iMns] !== SIN_DATO; }).length;
  const pen = R.filas.filter(function (f) { return f[iPen] !== ''; }).length;
  const div = R.filas.filter(function (f) { return String(f[iDiv]).indexOf('SÍ') === 0; }).length;
  const porEdad = R.filas.filter(function (f) { return f[iFue] === 'EDAD'; }).length;
  /* Alumnado que va por detrás de su edad más de lo que explican las
     repeticiones que conocemos. Casi siempre repitió en otro centro. */
  const iSin = TITULOS_ALUMNADO.indexOf('Rep. sin localizar');
  const sinLocalizar = R.filas.filter(function (f) {
    return esNumero(f[iSin]) && aNumero(f[iSin]) > 0;
  }).length;
  /* Los que están repitiendo ahora y es su PRIMERA repetición: son PIL de este
     curso, pero todavía les queda una permanencia para un curso posterior.
     Es justo el grupo en el que se separan las dos lecturas del PIL. */
  const soloEsteCurso = R.filas.filter(function (f) {
    return esPil(f[iNoPodra]) && !esPil(f[iPilE]);
  }).length;
  /* Alumnado del que sabemos que repitió en Primaria pero no de qué curso. */
  const primariaSinCurso = R.filas.filter(function (f) { return f[iCPr] === SIN_DATO; }).length;
  /* Los repetidores de 1º no necesitan expediente de Primaria, así que no
     cuentan ni como pendientes de descargar ni como interrogantes. */
  const enPrimero = R.filas.filter(function (f) {
    return f[iCur] === '1º' && f[iRep] !== 'SÍ';
  }).length;
  const repetidores1 = R.filas.filter(function (f) {
    return f[iCur] === '1º' && f[iRep] === 'SÍ';
  }).length;
  const sinExpediente = R.filas.filter(function (f) {
    return f[iCur] === '1º' && f[iAsi] === SIN_DATO;
  }).length;
  const sinNotas = R.filas.filter(function (f) { return f[iMns] === SIN_DATO; }).length;

  avisar_('Tabla ALUMNADO construida (' + VERSION + ')',
    resumen.join('\n') +
    '\n\nTotal de alumnos: ' + R.filas.length +
    '\n\nLAS TRES COLUMNAS DE PERMANENCIA' +
    '\nPIL, promocionaron por imperativo legal al curso de ahora: ' + pil +
    '   (es la que va al papel)' +
    '\nNo podrán repetir este curso otra vez: ' + noPodra +
    '\nHan agotado las dos permanencias de la etapa: ' + pilEtapa +
    '\nRepiten ahora y es su primera vez (por eso se separan las dos últimas): ' + soloEsteCurso +
    '\nSin comprobar, salen "' + PIL_POR_EDAD + '": ' + pilPorEdad +
    '\nCon "' + SIN_DATO + '" en PIL porque falta su curso pasado o sus notas: ' + pilSinSaber +
    '\nDecididos a mano por el equipo directivo: ' + pilAMano +
    '\n\nEXPEDIENTES DE SECUNDARIA' +
    '\nFicheros leídos: ' + S.total + ' de ' + S.ficheros +
    '\nAlumnos que necesitan el suyo (salen en AVISOS): ' + necesitanSec +
    '\nNo son PIL porque promocionaron aprobando: ' + promocionaronSolos +
    '\n\nCon materias no superadas (repetidores): ' + mns +
    '\nCon asignaturas pendientes: ' + pen +
    '\nEn diversificación: ' + div +
    '\nCon censo NEAE: ' + N.total +
    '\n\nEXPEDIENTES DE PRIMARIA' +
    '\nFicheros leídos: ' + P.total + ' de ' + P.ficheros +
    (expSinAlumno ? ' (' + expSinAlumno + ' sin alumno en la tabla)' : '') +
    '\nAlumnos de 1º que necesitan expediente: ' + enPrimero +
    ' (los ' + repetidores1 + ' repetidores de 1º no lo necesitan)' +
    '\nDe esos, ya tienen el suyo: ' + (enPrimero - sinExpediente) +
    '\nTodavía salen con "' + SIN_DATO + '" porque falta su expediente: ' + sinExpediente +
    '\nRepeticiones de Primaria todavía estimadas por edad: ' + porEdad +
    '\nRepitieron en Primaria pero no sabemos qué curso: ' + primariaSinCurso +
    '\nRepeticiones que hubo pero no sabemos dónde (alumnos): ' + sinLocalizar +
    (sinNotas ? '\nRepetidores que salen con "' + SIN_DATO +
                '" porque no aparecen en las notas: ' + sinNotas : '') +
    '\n\nFichero de Jefatura: ' + (J.nombre || 'no encontrado') +
    '\nAlumnos leídos de Jefatura: ' + J.alumnos.length +
    '\nDiferencias con Séneca: ' + nDiscrep +
    (nDiscrep ? '\nMíralas en la pestaña "' + HOJA_DISCREP + '".' : '') +
    '\n\nAvisos anotados: ' + avisos.length);

  /* Se ha llegado al final: las pestañas están escritas. Quien la llama
     (Panel.gs) mira este valor para saber si puede seguir con los informes.
     Las paradas de arriba devuelven false. */
  return true;
}

function leerManualesAlumnado(libro) {
  const hoja = libro.getSheetByName(HOJA_ALUMNADO);
  const manuales = {};
  if (!hoja || hoja.getLastRow() < 3) return manuales;
  const ancho = hoja.getLastColumn();
  const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0].map(normalizar);
  /* Una columna que todavía no exista (por ejemplo MEDIDAS Y RECURSOS la
     primera vez) devuelve -1 y se lee como vacía. Antes esto abortaba la
     lectura entera y se perdía lo escrito a mano en las demás. */
  const cols = COLS_CONSERVADAS.map(function (t) { return titulos.indexOf(normalizar(t)); });
  const iCur = titulos.indexOf(normalizar('Curso'));
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  for (let f = 0; f < datos.length; f++) {
    const nombre = normalizar(datos[f][0]);
    if (!nombre) continue;
    /* La clave lleva el curso, como todos los cruces del sistema: si no, lo que
       Francisco escribe a mano en un alumno se copiaría a otro que se llame
       igual y esté en otro curso. */
    const curso = iCur === -1 ? '' : String(datos[f][iCur] || '').trim();
    manuales[nombre + '|' + curso] = cols.map(function (c) { return c === -1 ? '' : datos[f][c]; });
  }
  return manuales;
}

function hojaLimpia(nombre, ancho) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getMaxColumns() < ancho) hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());
  const filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.clear();
  return hoja;
}

function escribirAlumnado(filas) {
  const ancho = TITULOS_ALUMNADO.length;
  const hoja = hojaLimpia(HOJA_ALUMNADO, ancho);
  hoja.getRange(1, 1).setValue('Alumnado de ESO del curso ' + CURSO_ACTUAL +
    '. Gris: viene de Séneca. Azul: calculado. Amarillo: lo rellenas tú y no se toca. ' +
    'Una casilla vacía quiere decir que no hay nada que poner; una "' + SIN_DATO +
    '" quiere decir que ese dato todavía no lo tenemos. ' +
    'LAS TRES COLUMNAS DE PERMANENCIA, en orden de tiempo: "PIL" quiere decir que el alumno ' +
    'está en este curso porque el año pasado ya no podía repetir Y ADEMÁS suspendió más de ' +
    MAX_SUSPENSOS_PROMOCION + ' materias, es decir que promocionó por imperativo legal; es la ' +
    'que va al informe en papel. "No podrá repetir este curso" quiere ' +
    'decir que si suspende en junio pasará de curso igualmente. "Ha agotado las dos ' +
    'permanencias" quiere decir que no puede repetir ningún curso más en toda la enseñanza ' +
    'obligatoria, Primaria y ESO juntas. Son tres preguntas distintas y los tres grupos de ' +
    'alumnos son distintos. Un "' + PIL_POR_EDAD + '" quiere decir que el número en el que se ' +
    'apoya es una suposición sacada de la edad y nadie lo ha comprobado todavía. ' +
    'Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_ALUMNADO]).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  if (filas.length) hoja.getRange(3, 1, filas.length, ancho).setValues(filas);

  /* EL CUADRO DE LA TRAYECTORIA, TAMBIÉN COMO NOTA DEL NOMBRE. Lo pidió
     Francisco: quiere verlo de una sola pasada. Puesto solo en su columna
     habría que ensanchar la fila y la tabla se haría inmanejable, así que el
     mismo texto se copia como nota de la casilla del alumno: se pasa el ratón
     por encima del nombre y sale el cuadro entero, sin mover nada.
     La columna Trayectoria se queda igualmente, para poder filtrar y copiar. */
  const iTray = TITULOS_ALUMNADO.indexOf('Trayectoria');
  if (filas.length && iTray !== -1) {
    const notas = filas.map(function (f) { return [String(f[iTray] || '')]; });
    try { hoja.getRange(3, 1, filas.length, 1).setNotes(notas); }
    catch (e) { /* las notas son un lujo: si fallan, la columna sigue estando */ }
  }

  const calculadas = ['Repite el curso actual', 'Curso el año pasado', 'Repetía el año pasado',
    'Suspensos el año pasado',
    'Diversificación', 'Cursos repetidos en ESO', 'Cursos repetidos en Primaria',
    'Rep. sin localizar', 'Repeticiones totales',
    'PIL', 'No podrá repetir este curso', 'Ha agotado las dos permanencias'];
  /* El color de la cabecera solo tiene tres posibilidades. Se agrupan las
     columnas por color y se pintan con tres llamadas (getRangeList) en vez
     de una por columna. */
  const porColorCabecera = { '#FFF2CC': [], '#DDEBF7': [], '#D9D9D9': [] };
  for (let c = 0; c < ancho; c++) {
    const t = TITULOS_ALUMNADO[c];
    const color = COLS_MANUALES_ALUMNADO.indexOf(t) !== -1 ? '#FFF2CC'
                : (calculadas.indexOf(t) !== -1 ? '#DDEBF7' : '#D9D9D9');
    porColorCabecera[color].push(fmtLetraColumna_(c + 1) + '2');
    if (COLS_MANUALES_ALUMNADO.indexOf(t) !== -1 && filas.length) {
      hoja.getRange(3, c + 1, filas.length, 1).setBackground('#FFF2CC');
    }
  }
  for (const color in porColorCabecera) {
    if (porColorCabecera[color].length) hoja.getRangeList(porColorCabecera[color]).setBackground(color);
  }
  if (filas.length) {
    hoja.getRange(2, 1, filas.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
    hoja.getRange(3, 3, filas.length, ancho - 2).setHorizontalAlignment('center');
  }
  hoja.setFrozenRows(2);
  hoja.setFrozenColumns(2);
  /* Sin autoResizeColumn: arreglarFormatoDeTodo_ deja un ancho fijo por
     columna al terminar "Actualizar los datos", así que ajustarlo aquí antes
     era trabajo (lento) que se tiraba siempre. */
  hoja.getRange(2, 1, filas.length + 1, ancho).createFilter();
}

function escribirAvisos(avisos) {
  const hoja = hojaLimpia(HOJA_AVISOS, 7);
  const titulos = ['Curso', 'Grupo', 'Alumno/a', 'Aviso', 'Detalle', 'Estado', 'Observaciones'];
  avisos.sort(function (a, b) {
    const ka = a.curso + a.aviso + a.grupo + a.alumno, kb = b.curso + b.aviso + b.grupo + b.alumno;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  const filas = avisos.map(function (a) { return [a.curso, a.grupo, a.alumno, a.aviso, a.detalle, '', '']; });
  hoja.getRange(1, 1, 1, 7).setValues([titulos]).setFontWeight('bold');
  if (filas.length) hoja.getRange(2, 1, filas.length, 7).setValues(filas);
  hoja.setFrozenRows(1);
  /* Igual que en ALUMNADO: el ancho fijo lo pone arreglarFormatoDeTodo_. */
}
