/*** ================= BACHILLERATO =================
 *
 * QUÉ ES ESTO. El alumnado de Bachillerato del centro, leído de los CSV de
 * matrícula que Francisco descarga de Séneca. Entra en la misma pestaña
 * ALUMNADO que la ESO, pero por un camino aparte, y por una razón de fondo:
 * en Bachillerato NO valen las reglas de la ESO.
 *
 * - No existe el PIL. Bachillerato no es enseñanza obligatoria, así que no
 *   hay promoción por imperativo legal.
 * - No existen las dos permanencias de la enseñanza obligatoria. En
 *   Bachillerato el tope son cuatro años, y esa cuenta empieza de cero.
 * - No existe la diversificación.
 * - No hay repeticiones de Primaria que calcular, ni edad teórica que
 *   comparar.
 *
 * Por eso el alumnado de Bachillerato NO pasa por el cálculo de permanencias
 * de Codigo.gs. Sus casillas de PIL y de permanencia se quedan vacías, que es
 * lo honrado: vacío quiere decir "aquí no aplica" (punto 2 bis de CONTEXTO).
 *
 * EL CURSO SE ESCRIBE "1º BACH" Y "2º BACH", con la etapa dentro. Es
 * imprescindible: la clave de todos los cruces del sistema es nombre + curso,
 * y si Bachillerato se guardara como "1º" chocaría con 1º de la ESO. Dos
 * alumnos distintos que se llamaran igual se convertirían en uno solo. Es el
 * fallo que se arregló en la BD v26.
 *
 * Y ESE TEXTO NO SE INVENTA: se recorta de la Unidad que escribe Séneca,
 * "1º BACH A" -> "1º BACH". Así el rótulo del grupo y el curso siempre casan.
 *
 * LOS CURSOS DE LA ESO NO SE TOCAN. Siguen siendo "1º", "2º", "3º" y "4º".
 * Renombrarlos habría perdido TODO lo que Francisco tiene escrito a mano en
 * las columnas amarillas, porque esas anotaciones se guardan por nombre y
 * curso. No merece la pena por una simetría.
 *
 * SON CUATRO FICHEROS, DOS POR CURSO, uno por modalidad:
 *
 *     MatOMCMatr1ºBACH-c-26-27.csv     MatOMCMatr1ºBACH-h-26-27.csv
 *     MatOMCMatr2ºBACH-c-26-27.csv     MatOMCMatr2ºBACH-h-26-27.csv
 *
 * La letra dice la modalidad: -c- Ciencias y Tecnología, -h- Humanidades y
 * Ciencias Sociales. Ese nombre lo pone Francisco a mano, así que además se
 * comprueba por dentro, mirando qué materias trae el fichero, y si las dos
 * cosas no coinciden se avisa.
 *
 * ======================================================== ***/

const NIVELES_BAC = ['1º BACH', '2º BACH'];
const ETAPA_BAC = 'Bachillerato';

/* El tercer valor de celda de Séneca, además de MATR y PEND. Sale en 2º y
   quiere decir que el alumno ya aprobó esa materia y este año no la cursa:
   está repitiendo 2º y solo cursa lo que le quedó. Confirmado por Francisco
   el 9-sep-2026. Tener alguna APRO es, por tanto, la señal de que repite. */
const MARCA_APROBADA = 'APRO';

const MODALIDAD_CIENCIAS = 'Ciencias y Tecnología';
const MODALIDAD_HUMANIDADES = 'Humanidades y CC. Sociales';

/* Materias que delatan la modalidad. Sirven para comprobar que el nombre del
   fichero dice la verdad. */
const DELATAN_CIENCIAS = ['Física y Química', 'Dibujo Técnico', 'Química', 'Física',
  'Biología, Geología y Ciencias Ambientales', 'Biología', 'Tecnología e Ingeniería'];
const DELATAN_HUMANIDADES = ['Latín', 'Griego', 'Historia del Arte', 'Literatura Universal',
  'Economía', 'Geografía'];

/* La religión va a su propia columna, la misma que en la ESO.

   Y CON ELLA VA LA ALTERNATIVA. Hasta la BD v53 el programa solo reconocía las
   dos religiones, así que "Proyectos Transversales de Educación en Valores"
   —que es lo que se cursa en lugar de Religión— se colaba entre las materias
   y la columna REL/At. se quedaba vacía. Lo vio Francisco el 10-sep-2026
   mirando en Séneca a la primera alumna de 1º BACH A.

   Ya no hace falta que la lista esté completa: lo que decide es el BLOQUE al
   que pertenece la materia según la pestaña MATERIAS OBLIGATORIAS. Esta lista
   solo dice qué código se escribe en el papel. Cualquier otra materia de ese
   bloque se escribe PTEV.

   POR QUÉ PTEV Y NO ATEDU (10-sep-2026). Lo señaló Francisco: en la ESO la
   alternativa a la Religión es "Atención Educativa", y se escribe ATEDU. En
   Bachillerato NO existe esa materia: lo que se cursa se llama "Proyectos
   Transversales de Educación en Valores". Son dos materias distintas, con
   nombres distintos en Séneca, así que escribir ATEDU en Bachillerato sería
   llamar a una materia por el nombre de otra. Cada etapa, su código, y la
   leyenda del informe explica los dos. */
const RELIGION_BAC = { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA' };
const CODIGO_VALORES = 'PTEV';

function codigoDeReligion_(materia) {
  const t = String(materia || '').trim();
  if (RELIGION_BAC[t] !== undefined) return RELIGION_BAC[t];
  const n = normalizar(t);
  if (n.indexOf('catolica') !== -1) return 'CAT';
  if (n.indexOf('evangelica') !== -1) return 'EVA';
  return CODIGO_VALORES;
}

/*** ================= LOS CUATRO BLOQUES DE LA MATRÍCULA =================
 *
 * De qué va esto. En Bachillerato la matrícula de un alumno no es una lista
 * suelta de materias: es un reparto. En 1º son SIEMPRE diez materias, y Séneca
 * lo dice en su propia pantalla ("Número total de registros: 10"):
 *
 *     4  comunes             Educación Física, Filosofía, Lengua, Inglés
 *     1  modalidad obligatoria     Matemáticas, o Latín
 *     2  modalidad a elegir
 *     2  optativas
 *     1  Religión o Proyectos Transversales de Educación en Valores
 *
 * Ni una más ni una menos. Por eso saber si un alumno está bien matriculado no
 * es adivinar nada: es contar.
 *
 * DE DÓNDE SALE EL REPARTO. De la pestaña MATERIAS OBLIGATORIAS, que ya tiene
 * la oferta del centro, con su columna "Quién la cursa" y su columna "Elegir
 * de este grupo". No hace falta añadirle nada: el bloque se deduce de lo que
 * ya está escrito ahí. Si la pestaña todavía no existe, se usa la oferta del
 * centro que trae Obligatorias.gs.
 *
 * ======================================================== ***/

const BLOQUE_COMUNES   = 'COMUNES';
const BLOQUE_MODALIDAD = 'MODALIDAD';
const BLOQUE_OPTATIVAS = 'OPTATIVAS';
const BLOQUE_RELIGION  = 'RELIGION';
const MATRICULA_OK     = 'OK';

/* A qué bloque pertenece una línea de la pestaña. */
function bloqueDeRegla_(quien, grupo) {
  const g = normalizar(grupo || '');
  if (g.indexOf('religion') !== -1 || g.indexOf('valores') !== -1) return BLOQUE_RELIGION;
  if (g.indexOf('modalidad') !== -1) return BLOQUE_MODALIDAD;
  if (g.indexOf('optativ') !== -1) return BLOQUE_OPTATIVAS;
  if (!g) {
    /* Sin grupo es una materia obligatoria. Si se le exige a todo el mundo es
       común; si solo a una modalidad o a un itinerario, es de modalidad. */
    return normalizar(quien || '') === normalizar(OBL_TODOS) ? BLOQUE_COMUNES : BLOQUE_MODALIDAD;
  }
  return BLOQUE_OPTATIVAS;   // un grupo con otro nombre: se cuenta como elección
}

/* Las reglas vigentes de un curso de Bachillerato, ya con su bloque. */
let CACHE_REGLAS_BAC_ = null;
function reglasBac_(curso) {
  if (!CACHE_REGLAS_BAC_) {
    let filas = null, ano = 0;
    try { filas = oblLeerTabla_(); } catch (e) { filas = null; }
    try { ano = oblAnoActual_(); } catch (e) { ano = 0; }
    CACHE_REGLAS_BAC_ = { filas: filas, ano: ano, porCurso: {}, viejas: [] };
  }
  if (CACHE_REGLAS_BAC_.porCurso[curso]) return CACHE_REGLAS_BAC_.porCurso[curso];

  let crudas = [];
  if (CACHE_REGLAS_BAC_.filas) {
    try { crudas = oblVigentes_(CACHE_REGLAS_BAC_.filas, curso, CACHE_REGLAS_BAC_.ano); }
    catch (e) { crudas = []; }
  }

  /* LÍNEAS VIEJAS: LA PESTAÑA MANDA, PERO NO PUEDE MENTIR. Si el curso está en
     la pestaña pero NINGUNA de sus líneas usa la columna "Elegir de este
     grupo", son las que puso una versión anterior del programa, cuando todavía
     no se conocía la oferta del centro. Con esas líneas no hay grupos que
     contar, así que la comprobación no comprobaría nada y TODO EL MUNDO
     saldría OK. Eso es peor que no comprobar: es decir que está bien sin
     haberlo mirado. Se usa entonces la oferta del centro y se avisa. */
  let hayGrupos = false;
  for (let i = 0; i < crudas.length; i++) { if (crudas[i] && crudas[i].grupo) hayGrupos = true; }
  if (crudas.length && !hayGrupos && OFERTA_BACHILLERATO[curso]) {
    CACHE_REGLAS_BAC_.viejas.push(curso);
    crudas = [];
  }

  /* Todavía no está en la pestaña: se usa la oferta del centro. */
  if (!crudas.length) {
    try { crudas = oblOfertaDeCurso_(curso); } catch (e) { crudas = []; }
  }

  const reglas = [];
  for (let i = 0; i < crudas.length; i++) {
    const r = crudas[i];
    if (!r || !r.materia) continue;
    reglas.push({ materia: r.materia, quien: r.quien || '', grupo: r.grupo || '',
                  bloque: bloqueDeRegla_(r.quien, r.grupo) });
  }
  CACHE_REGLAS_BAC_.porCurso[curso] = reglas;
  return reglas;
}

/* ¿Esta línea de la pestaña le toca a este alumno? */
function reglaAplica_(regla, modalidad, tiene) {
  const q = String(regla.quien || '');
  const qn = normalizar(q);
  if (!qn || qn === normalizar(OBL_TODOS)) return true;
  if (qn === normalizar(OBL_CIENCIAS)) return modalidad === MODALIDAD_CIENCIAS;
  if (qn === normalizar(OBL_HUMANIDADES)) return modalidad === MODALIDAD_HUMANIDADES;
  /* "Solo quienes cursan Latín": se le exige a quien curse esa materia. */
  const cond = oblCondicion_(q);
  if (cond) return !!tiene[normalizar(cond)];
  return false;   // lo que quede es de la ESO y aquí no pinta nada
}

/* ¿Está bien matriculado este alumno? Devuelve dos textos:
     corto · para la columna MATRÍCULA y para el papel: "falta MAT"
     largo · para el aviso, con los nombres enteros
   Cuando todo cuadra, el corto es "OK" y el largo va vacío. */
function diagnosticoMatricula_(reglas, modalidad, tiene, existe) {
  /* SIN MODALIDAD NO SE PUEDE COMPROBAR. La mitad de las reglas dependen de
     ella, así que decir "OK" sería mentir. Va la interrogante, que quiere
     decir justo eso: esto no lo sabemos todavía. */
  if (!modalidad) return { corto: SIN_DATO, largo: '' };

  const faltan = [], grupos = {}, orden = [];
  for (let i = 0; i < reglas.length; i++) {
    const r = reglas[i];
    if (!reglaAplica_(r, modalidad, tiene)) continue;
    /* SI ESA MATERIA NO ES UNA COLUMNA DE ESTE FICHERO no se le puede exigir a
       nadie: o es de la otra modalidad, o Séneca la ha renombrado. Sin esta
       línea saldría "falta" en TODOS los alumnos del fichero. Que la pestaña
       nombre una materia que Séneca no trae se avisa aparte, una sola vez. */
    if (existe && !existe[normalizar(r.materia)]) continue;
    if (!r.grupo) {
      if (!tiene[normalizar(r.materia)]) faltan.push(r.materia);
      continue;
    }
    if (!grupos[r.grupo]) {
      grupos[r.grupo] = { cuantas: oblCuantasDelGrupo_(r.grupo), n: 0, total: 0,
                          bloque: r.bloque, materias: [] };
      orden.push(r.grupo);
    }
    grupos[r.grupo].total++;
    grupos[r.grupo].materias.push(r.materia);
    if (tiene[normalizar(r.materia)]) grupos[r.grupo].n++;
  }

  const corto = [], largo = [];
  if (faltan.length) {
    corto.push((faltan.length === 1 ? 'falta ' : 'faltan ') +
               faltan.map(abreviarBac_).join(', '));
    largo.push('No está matriculado en: ' + faltan.join(', ') + '.');
  }
  for (let i = 0; i < orden.length; i++) {
    const g = orden[i], G = grupos[g];
    if (!G.total || G.n === G.cuantas) continue;
    /* EL NOMBRE DEL GRUPO SE DICE ENTERO. Antes el de religión se acortaba a
       "Religión" a secas, y leyendo "falta 1 de Religión" no había forma de
       saber que el Proyecto transversal también valía. Lo dijo Francisco el
       10-sep-2026. Lo único que se quita es el "(elegir 2)", que es sintaxis
       de la pestaña y no dice nada al que lee el aviso. */
    /* En el papel la casilla es estrecha, así que se quita el "Modalidad:" de
       delante: "sobra 1 de Economía o Griego" se entiende igual de bien y
       ocupa dos renglones menos. El aviso sí lleva el nombre entero. */
    const nombre = String(g).split('(')[0].trim().replace(/^Modalidad:\s*/i, '');
    const d = G.cuantas - G.n;
    if (d > 0) corto.push(d === 1 ? 'falta 1 de ' + nombre : 'faltan ' + d + ' de ' + nombre);
    else corto.push(-d === 1 ? 'sobra 1 de ' + nombre : 'sobran ' + (-d) + ' de ' + nombre);
    /* Y el aviso, además, dice cuáles son las materias de ese grupo: sin eso
       hay que ir a la pestaña a mirarlo. */
    largo.push('De "' + g + '" (' + G.materias.join(', ') + ') tiene ' + G.n +
               ' y hay que cursar ' + G.cuantas + '.');
  }

  return { corto: corto.length ? corto.join(' · ') : MATRICULA_OK, largo: largo.join(' ') };
}

/* Abreviaturas de las materias de Bachillerato, para que el itinerario quepa.
   Las que ya existen en ABREVIATURAS (Codigo.gs) se respetan tal cual: una
   materia se abrevia igual en toda la casa. Estas son solo las que allí no
   están. Para cambiar una, se cambia aquí y en ningún sitio más. */
const ABREVIATURAS_BAC = {
  'Filosofía': 'FIL', 'Historia de España': 'HES', 'Historia de la Filosofía': 'HFI',
  'Matemáticas Aplicadas a las Ciencias Sociales': 'MCS',
  'Biología, Geología y Ciencias Ambientales': 'BGCA', 'Biología': 'BIO',
  'Física': 'FIS', 'Química': 'QUI', 'Tecnología e Ingeniería': 'TEI',
  'Anatomía Aplicada': 'ANA', 'Antropología y Sociología': 'ANT',
  'Creación Digital y Pensamiento Computacional': 'CDPC',
  'Patrimonio Cultural y Artístico de Andalucía': 'PCA', 'Fisiología Humana': 'FIH',
  'Iniciación al Comentario de Texto': 'ICT', 'Olimpismo': 'OLI',
  'Tecnologías de la Información y la Comunicación': 'TIC',
  'Cultura Emprendedora y Empresarial': 'CEE',
  'Educación para la Convivencia Democrática': 'ECD',
  'Proyectos Transversales de Educación en Valores': 'PTEV',
  'Economía': 'ECO', 'Historia del Mundo Contemporáneo': 'HMC',
  'Literatura Universal': 'LUN', 'Griego': 'GRI',
  'Actividad Física, Salud y Sociedad': 'AFSS', 'Programación y Computación': 'PRC',
  'Psicología': 'PSI', 'Estadística': 'EST',
  'Empresa y Diseño de Modelos de Negocio': 'EDMN', 'Geografía': 'GEO',
  'Historia del Arte': 'HAR', 'Finanzas y Economía': 'FYE',
  'Electrotecnia': 'ELE', 'Introducción a las Ciencias de la Salud': 'ICS',
  'Imagen y Sonido': 'IMS', 'Ciencias de la Tierra y del Medio Ambiente': 'CTMA',
  'Geología y Ciencias Ambientales': 'GEOA',
  'Fundamentos de Administración y Gestión': 'FAG', 'Mitología Clásica': 'MIC'
};

/*** ================= UTILIDADES ================= ***/

/* ¿Este curso es de Bachillerato? Se le pregunta desde Codigo.gs e
   Informes.gs, así que tiene que valer también para lo que venga escrito en
   la hoja, no solo para lo que acabamos de calcular. */
function esBachillerato_(curso) {
  const t = String(curso === null || curso === undefined ? '' : curso).trim();
  return NIVELES_BAC.indexOf(t) !== -1;
}

/* "1º BACH A" -> "1º BACH". Si la unidad no dice nada, se usa el curso que
   venga del nombre del fichero. */
function cursoDeUnidadBac_(unidad, porDefecto) {
  const t = String(unidad || '').trim();
  const m = t.match(/^([12])\s*º\s*BACH/i);
  if (!m) return porDefecto;
  return m[1] + 'º BACH';
}

function abreviarBac_(materia) {
  const t = String(materia || '').trim();
  if (ABREVIATURAS[t] !== undefined) return ABREVIATURAS[t];
  if (ABREVIATURAS_BAC[t] !== undefined) return ABREVIATURAS_BAC[t];
  return t;
}

/* Los títulos de las columnas de materias pendientes de 1º vienen así:
     Lengua Castellana y Literatura (1º de Bachillerato (Ciencias y Tecnología))
     Filosofía (1º de Bachillerato (Humanid.y Ciencias Social)
   Ojo con dos cosas. La primera: no vale buscar un paréntesis a secas, porque
   "Francés (Segundo Idioma)" también lo lleva y no es una pendiente. La
   segunda: en los ficheros de Humanidades el paréntesis se queda SIN CERRAR.
   Es así en el fichero de Séneca, no es un error de copia. */
function pendienteDeBac_(titulo) {
  const t = String(titulo || '').trim();
  const i = t.indexOf('(1º de Bachillerato');
  if (i <= 0) return '';
  return t.substring(0, i).trim();
}

/*** ================= LOS FICHEROS ================= ***/

/* Los CSV de matrícula de Bachillerato de la carpeta, agrupados por curso.
   Devuelve { '1º BACH': [ {archivo, modalidad}, ... ], '2º BACH': [...] }.
   Hay dos por curso, uno por modalidad, así que aquí NO se puede hacer lo que
   hace buscarCsvsMatricula con la ESO, que se queda con el más reciente: eso
   tiraría media clase. */
function ficherosBachilleratoPorCurso_() {
  const porCurso = {}, mejores = {};
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      const n = f.getName();
      if (!/\.csv$/i.test(n)) continue;
      if (normalizar(n).indexOf('matomcmatr') !== 0) continue;
      if (n.indexOf(CURSO_ACTUAL) === -1) continue;
      if (normalizar(n).indexOf('bach') === -1) continue;
      const mc = n.match(/^[^0-9]*([12])\s*º/);
      if (!mc) continue;
      const curso = mc[1] + 'º BACH';
      /* La letra de la modalidad: "...BACH-c-26-27.csv". */
      const mm = n.match(/bach[^a-z0-9]*([ch])[^a-z0-9]/i);
      const modalidad = !mm ? '' :
        (mm[1].toLowerCase() === 'c' ? MODALIDAD_CIENCIAS : MODALIDAD_HUMANIDADES);
      /* DEL MISMO FICHERO, EL MÁS RECIENTE, esté en la carpeta que esté. Desde
         la BD v54 la carpeta tiene estructura, así que puede haber una copia
         vieja ya ordenada y otra recién descargada todavía suelta. Sin esto se
         leerían las dos y cada alumno saldría dos veces. */
      const clave = curso + '|' + normalizar(n);
      if (!mejores[clave] ||
          f.getLastUpdated().getTime() > mejores[clave].archivo.getLastUpdated().getTime()) {
        mejores[clave] = { archivo: f, modalidad: modalidad, nombre: n, curso: curso };
      }
    }
  }
  for (const k in mejores) {
    const m = mejores[k];
    if (!porCurso[m.curso]) porCurso[m.curso] = [];
    porCurso[m.curso].push(m);
  }
  for (const cu in porCurso) {
    porCurso[cu].sort(function (a, b) { return a.nombre < b.nombre ? -1 : 1; });
  }
  return porCurso;
}

/* Qué modalidad dicen las materias que trae el fichero. Sirve para comprobar
   que el nombre del fichero no miente. */
function modalidadPorLasMaterias_(cabecera) {
  let ciencias = 0, humanidades = 0;
  for (let i = 0; i < cabecera.length; i++) {
    const t = String(cabecera[i] || '').trim();
    if (DELATAN_CIENCIAS.indexOf(t) !== -1) ciencias++;
    if (DELATAN_HUMANIDADES.indexOf(t) !== -1) humanidades++;
  }
  if (ciencias > humanidades) return MODALIDAD_CIENCIAS;
  if (humanidades > ciencias) return MODALIDAD_HUMANIDADES;
  return '';
}

/*** ================= LEER UN FICHERO ================= ***/

/* Un CSV de matrícula de Bachillerato. Devuelve los alumnos con la misma
   forma que leerMatricula de la ESO, para que componerAlumnado no note la
   diferencia: { nombre, unidad, curso, valores, pend, diver }.

   Y ADEMÁS REPARTE LAS MATERIAS EN SUS CUATRO BLOQUES (BD v53). Antes había
   una sola columna, ITINERARIO, con "lo que cursa además de las comunes". Eso
   tenía dos problemas que vio Francisco el 10-sep-2026 comparando el informe
   con Séneca:

     1. Las comunes no salían por ninguna parte, así que no había forma de
        comprobar que un alumno estaba matriculado en Educación Física o en
        Inglés.
     2. El Proyecto transversal de Educación en Valores se colaba entre las
        materias en vez de ir a la columna de Religión.

   Ahora cada materia va a su bloque, igual que en la hoja de elección de
   materias del centro, y de paso se cuenta si el reparto cuadra. */
function leerMatriculaBac_(tabla, cursoPorDefecto, modalidad) {
  const cab = tabla[0].map(function (t) { return String(t).trim(); });
  const cabN = cab.map(normalizar);
  const iNombre = cabN.indexOf(normalizar('Alumno/a'));
  const iUnidad = cabN.indexOf(normalizar('Unidad'));
  const alumnos = [], sinUnidad = [], repetidores = [], sinBloque = [], malMatriculados = [];

  /* Las reglas del curso, indexadas por el nombre de la materia. */
  const reglas = reglasBac_(cursoPorDefecto);
  const porMateria = {};
  for (let i = 0; i < reglas.length; i++) porMateria[normalizar(reglas[i].materia)] = reglas[i];

  /* Qué es cada columna: una materia pendiente de 1º, o una materia de este
     curso, y en ese caso de qué bloque. 'existe' guarda las materias que este
     fichero trae de verdad. */
  const clase = [], existe = {};
  for (let c = 0; c < cab.length; c++) {
    if (c === iNombre || c === iUnidad || !cab[c]) { clase.push(null); continue; }
    const pend = pendienteDeBac_(cab[c]);
    if (pend) { clase.push({ tipo: 'PEND', asig: pend }); continue; }
    const regla = porMateria[cabN[c]] || null;
    let bloque = regla ? regla.bloque : '';
    /* Si la pestaña no la conoce, al menos se reconoce la religión por su
       nombre. Lo demás se queda sin bloque y sale en un aviso: una materia
       nunca desaparece en silencio. */
    if (!bloque && codigoDeReligionConocida_(cab[c])) bloque = BLOQUE_RELIGION;
    clase.push({ tipo: 'MATERIA', asig: cab[c], bloque: bloque });
    existe[cabN[c]] = true;
  }

  /* LO QUE LA PESTAÑA PIDE Y ESTE FICHERO NO TRAE. Una materia que se le exige
     a este alumnado y no es columna del CSV no se le puede exigir a nadie: o
     Séneca la ha renombrado, o la pestaña se ha quedado vieja. Se dice una
     sola vez, no una por alumno. */
  const faltanColumnas = [], deCadaGrupo = {};
  for (let i = 0; i < reglas.length; i++) {
    const r = reglas[i];
    const qn = normalizar(r.quien || '');
    let toca = (!qn || qn === normalizar(OBL_TODOS));
    if (qn === normalizar(OBL_CIENCIAS)) toca = modalidad === MODALIDAD_CIENCIAS;
    else if (qn === normalizar(OBL_HUMANIDADES)) toca = modalidad === MODALIDAD_HUMANIDADES;
    const cond = oblCondicion_(r.quien);
    if (cond) toca = !!existe[normalizar(cond)];
    if (!toca) continue;
    /* De un GRUPO no se avisa materia a materia: que una optativa no sea
       columna solo quiere decir que este año no la coge nadie, y avisar de eso
       llenaría AVISOS de ruido. Lo que sí importa es que no quede ninguna,
       porque entonces ese grupo dejaría de comprobarse sin que se note. */
    if (r.grupo) {
      if (deCadaGrupo[r.grupo] === undefined) deCadaGrupo[r.grupo] = 0;
      if (existe[normalizar(r.materia)]) deCadaGrupo[r.grupo]++;
      continue;
    }
    if (!existe[normalizar(r.materia)] && faltanColumnas.indexOf(r.materia) === -1) {
      faltanColumnas.push(r.materia);
    }
  }
  for (const g in deCadaGrupo) {
    if (!deCadaGrupo[g]) faltanColumnas.push('ninguna materia del grupo "' + g + '"');
  }

  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const nombre = String(fila[iNombre] || '').trim();
    if (!nombre) continue;
    const unidad = iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim();
    if (!unidad) sinUnidad.push(nombre);
    const curso = cursoDeUnidadBac_(unidad, cursoPorDefecto);

    const suyas = { COMUNES: [], MODALIDAD: [], OPTATIVAS: [], RELIGION: [], SIN: [] };
    const tiene = {}, pend = [], aprobadas = [];
    for (let c = 0; c < clase.length; c++) {
      const k = clase[c];
      if (!k) continue;
      const valor = String(fila[c] || '').trim().toUpperCase();
      if (!valor) continue;
      if (k.tipo === 'PEND') {
        if (valor === PEND) pend.push(abreviarBac_(k.asig) + ' 1º');
        else if (valor === MARCA_APROBADA) aprobadas.push(abreviarBac_(k.asig) + ' 1º');
        continue;
      }
      /* Una materia APRO ya la tiene aprobada de cuando repitió: cuenta para
         comprobar la matrícula, pero este año no la cursa, así que no se
         escribe en el papel. */
      if (valor === MARCA_APROBADA) {
        aprobadas.push(abreviarBac_(k.asig));
        tiene[normalizar(k.asig)] = true;
        continue;
      }
      /* CONV es una materia convalidada. Cuenta como matriculada en todo el
         programa (ver oblMatriculado_), así que aquí también: se escribe y se
         cuenta. Antes de la BD v53 se tiraba en silencio. */
      if (valor !== MARCA && valor !== OBL_CONVALIDADA) continue;
      tiene[normalizar(k.asig)] = true;
      const b = k.bloque || 'SIN';
      suyas[b].push(k.asig);
      if (b === 'SIN' && sinBloque.indexOf(k.asig) === -1) sinBloque.push(k.asig);
    }

    /* Tener materias APRO quiere decir que repite el curso y solo cursa lo que
       le quedó. Es la única forma de saberlo desde este fichero. */
    const repite = aprobadas.length ? 'SÍ' : '';
    if (aprobadas.length) repetidores.push(nombre + ' (' + unidad + '): ya aprobadas ' + aprobadas.join(', '));

    const D = diagnosticoMatricula_(reglas, modalidad, tiene, existe);
    if (D.corto !== MATRICULA_OK) {
      malMatriculados.push({ curso: curso, grupo: unidad, alumno: nombre,
        corto: D.corto, largo: D.largo, modalidad: modalidad });
    }

    const religion = [];
    for (let i = 0; i < suyas.RELIGION.length; i++) religion.push(codigoDeReligion_(suyas.RELIGION[i]));

    /* Lo que no encaja en ningún bloque no se pierde: se escribe con las
       optativas, que es donde menos molesta, y sale en AVISOS. */
    const optativas = suyas.OPTATIVAS.concat(suyas.SIN);

    alumnos.push({
      nombre: nombre, unidad: unidad, curso: curso, diver: false,
      valores: { 'REL/Atedu': religion.join(' / '), 'MODALIDAD': modalidad,
                 'MAT. MODALIDAD': suyas.MODALIDAD.map(abreviarBac_).join(' '),
                 'OPTATIVAS': optativas.map(abreviarBac_).join(' '),
                 'MATRÍCULA': D.corto },
      pend: pend, repiteBac: repite
    });
  }
  return { alumnos: alumnos, sinUnidad: sinUnidad, repetidores: repetidores,
           sinBloque: sinBloque, malMatriculados: malMatriculados,
           faltanColumnas: faltanColumnas };
}

/* Solo para reconocer la religión cuando la pestaña todavía no la conoce.
   Devuelve '' si esa materia no es de religión. */
function codigoDeReligionConocida_(materia) {
  const t = String(materia || '').trim();
  if (RELIGION_BAC[t] !== undefined) return RELIGION_BAC[t];
  const n = normalizar(t);
  if (n.indexOf('religion') !== -1) return 'CAT';
  if (n.indexOf('educacion en valores') !== -1) return CODIGO_VALORES;
  return '';
}

/*** ================= TODO EL BACHILLERATO ================= ***/

/* Se lee una sola vez por ejecución. Lo piden dos sitios: Codigo.gs, para
   meter a estos alumnos en ALUMNADO, y NEAE.gs, para saber a quién pertenece
   cada ficha del censo. Sin esta caché se descargarían los cuatro CSV dos
   veces y los avisos saldrían repetidos. */
let CACHE_BACHILLERATO_ = null;

/* Lee los cuatro ficheros y devuelve el alumnado agrupado por curso, con la
   misma forma que la ESO. Si no hay ficheros, devuelve vacío y no molesta. */
function alumnadoDeBachillerato_() {
  if (CACHE_BACHILLERATO_) return CACHE_BACHILLERATO_;
  const porCurso = {}, avisos = [], resumen = [], dichas = {};
  const ficheros = ficherosBachilleratoPorCurso_();
  const cursos = Object.keys(ficheros).sort();
  if (!cursos.length) {
    CACHE_BACHILLERATO_ = { porCurso: porCurso, avisos: avisos, resumen: resumen };
    return CACHE_BACHILLERATO_;
  }

  for (let i = 0; i < cursos.length; i++) {
    const curso = cursos[i];
    const lista = ficheros[curso];
    for (let j = 0; j < lista.length; j++) {
      const tabla = textoATabla(textoDeArchivo(lista[j].archivo));
      if (!tabla.length) {
        avisos.push({ curso: curso, grupo: '', alumno: '',
          aviso: 'Fichero de Bachillerato vacío', detalle: lista[j].nombre });
        continue;
      }
      const porDentro = modalidadPorLasMaterias_(tabla[0]);
      let modalidad = lista[j].modalidad;
      if (!modalidad) modalidad = porDentro;
      if (modalidad && porDentro && modalidad !== porDentro) {
        avisos.push({ curso: curso, grupo: '', alumno: '',
          aviso: 'La modalidad del nombre del fichero no cuadra con lo que trae dentro',
          detalle: lista[j].nombre + ': por el nombre es ' + modalidad + ', pero por sus ' +
            'materias parece ' + porDentro + '. He usado la del nombre. Comprueba que el ' +
            'fichero es el que crees.' });
      }
      const r = leerMatriculaBac_(tabla, curso, modalidad);
      if (!porCurso[curso]) porCurso[curso] = [];
      for (let k = 0; k < r.alumnos.length; k++) porCurso[curso].push(r.alumnos[k]);
      resumen.push(curso + ' (' + (modalidad || 'modalidad sin identificar') + '): ' +
        r.alumnos.length + ' alumnos (' + lista[j].nombre + ')');
      r.sinUnidad.forEach(function (n) {
        avisos.push({ curso: curso, grupo: '', alumno: n,
          aviso: 'Sin unidad en Séneca', detalle: 'No saldrá en ningún informe de grupo' });
      });
      r.repetidores.forEach(function (t) {
        avisos.push({ curso: curso, grupo: '', alumno: '',
          aviso: 'Repite curso y solo cursa lo que le quedó', detalle: t });
      });

      /* UN SOLO AVISO POR ALUMNO MAL MATRICULADO. Antes salían varios del
         mismo alumno, uno por cada cosa que fallaba, y con explicaciones
         largas. Lo dijo Francisco el 10-sep-2026: "los avisos son demasiado
         complejos". Ahora es una línea, con la misma frase que sale en la
         columna MATRÍCULA de la tabla y en el informe en papel. */
      (r.malMatriculados || []).forEach(function (m) {
        avisos.push({ curso: m.curso, grupo: m.grupo, alumno: m.alumno,
          aviso: 'Matrícula incompleta en Séneca: ' + m.corto,
          detalle: (m.largo ? m.largo + ' ' : '') + 'Modalidad: ' + m.modalidad +
            '. Compruébalo en Séneca. Si la materia ya no es obligatoria, corrige la ' +
            'pestaña "' + HOJA_OBLIGATORIAS + '".' });
      });

      /* Y una línea con las materias que la oferta del centro no recoge. Se
         dicen una sola vez por curso: los dos ficheros de un curso comparten
         optativas, así que sin esto saldría cada una dos veces. */
      (r.sinBloque || []).forEach(function (mat) {
        if (dichas[curso + '|' + mat]) return;
        dichas[curso + '|' + mat] = true;
        avisos.push({ curso: curso, grupo: '', alumno: '',
          aviso: 'Materia que no está en la oferta del centro',
          detalle: '"' + mat + '" la cursa alguien de ' + curso + ' y no aparece en la pestaña "' +
            HOJA_OBLIGATORIAS + '". La escribo con las optativas. Añádela a la pestaña, en su ' +
            'grupo, para que cuente en la comprobación de la matrícula.' });
      });

      /* Y otra con lo contrario: lo que la pestaña pide y Séneca no trae. */
      (r.faltanColumnas || []).forEach(function (mat) {
        if (dichas[curso + '|falta|' + mat]) return;
        dichas[curso + '|falta|' + mat] = true;
        avisos.push({ curso: curso, grupo: '', alumno: '',
          aviso: 'La pestaña pide una materia que Séneca no trae',
          detalle: '"' + mat + '" está en la pestaña "' + HOJA_OBLIGATORIAS + '" para ' + curso +
            ', pero el fichero ' + lista[j].nombre + ' no tiene esa columna. No se le exige a ' +
            'nadie. Puede que Séneca la haya renombrado: corrige el nombre en la pestaña.' });
      });
    }
  }
  /* Y si la pestaña traía líneas de una versión anterior, hay que decirlo bien
     alto: mientras estén ahí, la columna MATRÍCULA se está calculando con la
     oferta del centro y no con lo que dice la pestaña. */
  if (CACHE_REGLAS_BAC_ && CACHE_REGLAS_BAC_.viejas && CACHE_REGLAS_BAC_.viejas.length) {
    avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'Hay que rehacer las materias de Bachillerato de la pestaña',
      detalle: 'Las líneas de ' + CACHE_REGLAS_BAC_.viejas.join(' y ') + ' de la pestaña "' +
        HOJA_OBLIGATORIAS + '" son de una versión anterior: ninguna usa la columna "Elegir de ' +
        'este grupo", así que con ellas no se puede comprobar la matrícula. Mientras tanto uso ' +
        'la oferta educativa del centro. BORRA esas líneas (solo las de Bachillerato) y vuelve ' +
        'a pulsar "1. Actualizar los datos": el programa las escribirá bien.' });
  }

  CACHE_BACHILLERATO_ = { porCurso: porCurso, avisos: avisos, resumen: resumen };
  return CACHE_BACHILLERATO_;
}

/*** ================= EL CENSO NEAE Y EL BACHILLERATO ================= ***/

/* Cómo escribe Séneca el curso de Bachillerato en el censo NEAE y en los
   expedientes: "1º de Bachillerato (Ciencias y Tecnología)". Devuelve el
   curso tal y como lo guarda el sistema, "1º BACH", o cadena vacía si eso no
   es Bachillerato. */
function nivelBachilleratoCenso_(texto) {
  /* Vale tanto "1º de Bachillerato (Ciencias y Tecnología)", que es como lo
     escribe Séneca en el censo y en los expedientes, como "1º BACH A", que es
     como lo escribe en la Unidad de la matrícula. */
  const m = String(texto || '').trim().match(/^([12])\s*º?\s*(de\s+)?BACH/i);
  return m ? m[1] + 'º BACH' : '';
}

/* Filas con la forma de las del HISTORIAL, para que el censo NEAE pueda
   cruzar también las fichas de Bachillerato.

   POR QUÉ HACE FALTA ESTO. El censo no trae el nombre del alumno, solo sus
   iniciales, así que hay que buscar a quién pertenece cada ficha. Ese cruce
   se hace contra la pestaña HISTORIAL, y en el HISTORIAL no hay Bachillerato:
   se construye filtrando por ESO. Sin estas filas, una ficha de Bachillerato
   no encontraría a nadie y saldría como "ficha sin alumno en el centro".

   Aquí se dan las mismas columnas que necesita el cruce, sacadas de la
   matrícula: el nombre y el curso. La fecha de nacimiento va vacía, porque la
   matrícula no la trae. Consecuencia, y hay que tenerla presente: si dos
   alumnos de Bachillerato del mismo curso tuvieran las mismas iniciales, el
   empate NO se puede deshacer, así que no se escribe nada y sale un aviso.
   Es lo correcto: mejor una casilla vacía que el NEAE de otra persona. */
function filasBachilleratoParaCruce_(iNombre, iCurso, ancho) {
  const filas = [];
  const bac = alumnadoDeBachillerato_();
  for (const curso in bac.porCurso) {
    const lista = bac.porCurso[curso];
    for (let i = 0; i < lista.length; i++) {
      const fila = [];
      for (let c = 0; c < ancho; c++) fila.push('');
      fila[iNombre] = lista[i].nombre;
      fila[iCurso] = lista[i].curso;
      filas.push(fila);
    }
  }
  return filas;
}

/*** ================= LA FILA DE ALUMNADO ================= ***/

/* Los valores de un alumno de Bachillerato, listos para montar su fila de
   ALUMNADO. Solo se rellena lo que en Bachillerato significa algo. Todo lo
   demás se queda VACÍO, que quiere decir "aquí no aplica", y no con
   interrogante, que querría decir "esto lo tenemos que averiguar". */
function valoresDeBachillerato_(a, man, ficha, cursosDelCenso) {
  const v = a.valores || {};
  const pend = a.pend || [];
  return {
    'Alumno/a': a.nombre,
    'Unidad': a.unidad,
    'Curso': a.curso,
    'Repite el curso actual': a.repiteBac || '',
    'Nº pendientes': pend.length ? pend.length : '',
    'Asignaturas pendientes': pend.length ? pend.length + ': ' + pend.join(', ') : '',
    'REL/Atedu': v['REL/Atedu'] || '',
    'MODALIDAD': v['MODALIDAD'] || '',
    'MAT. MODALIDAD': v['MAT. MODALIDAD'] || '',
    'OPTATIVAS': v['OPTATIVAS'] || '',
    'MATRÍCULA': v['MATRÍCULA'] || '',
    'Diversificación': '',
    /* EL CENSO MANDA, TAMBIÉN AQUÍ. La descarga del censo NEAE de Séneca es
       una sola y trae el centro entero: no se pide por cursos ni por etapas.
       Lo confirmó Francisco el 9-sep-2026. Por tanto, si un alumno de
       Bachillerato no está en el censo es que no tiene NEAE, y su casilla se
       queda vacía. No se conserva lo que hubiera escrito antes: un dato
       equivocado que se conserva se queda escrito para siempre, y como la
       casilla se ve llena nadie sospecha. Ya pasó una vez con dos alumnas que
       se llamaban igual.
       El parámetro cursosDelCenso se recibe por compatibilidad con la llamada
       de Codigo.gs, pero aquí no se usa: en Bachillerato no hay medias tintas. */
    'NEAE': ficha ? ficha.neae : '',
    'MEDIDAS Y RECURSOS': ficha ? ficha.medidas : '',
    'Observaciones': man[4] || ''
  };
}
