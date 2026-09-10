/*** ================= LA MATRÍCULA, COMPROBADA DE UNA SOLA VEZ =================
 *
 * POR QUÉ EXISTE ESTE FICHERO (BD v62, 10-sep-2026). Lo pidió Francisco:
 *
 *   "Necesito saber si las asignaturas registradas en Séneca de un alumno son
 *    las que tienen que ser, que no sobre ni falte una asignatura no elegible,
 *    y que las elegibles sean las que ha puesto Jefatura de Estudios en su
 *    archivo Agrupamiento. Si no cuadran debes decirme de una manera muy
 *    clara, estructurada y fiable, cuáles son las que están dando la
 *    discrepancia."
 *
 * Hasta la BD v61 esto lo hacían TRES comprobaciones distintas, en tres
 * ficheros, con tres listas de materias escritas a mano que ya no coincidían,
 * y que escribían el mismo fallo en tres sitios con tres frases distintas.
 * Aquí se sustituyen por UNA cuenta por alumno:
 *
 *     Lo que debe tener  =  las obligatorias de su curso (según la oferta del
 *                           centro) + lo que Jefatura ha escrito para él
 *     Lo que tiene       =  lo que está en Séneca (MATR, CONV y APRO)
 *
 *     FALTAN  =  lo que debe tener y no está en Séneca
 *     SOBRAN  =  lo que está en Séneca y no debe tener
 *
 * Donde Jefatura no dice nada de un cuadro de elección, el cuadro se comprueba
 * CONTANDO: el alumno tiene que tener exactamente las que diga el cuadro. Una
 * materia que no está en la oferta de su curso sobra siempre.
 *
 * Es la misma cuenta para la ESO y para Bachillerato. La diversificación, la
 * modalidad y el itinerario solo dicen QUÉ PARTE de la oferta le toca a cada
 * alumno.
 *
 * QUIEN REPITE 2º DE BACHILLERATO (BD v63) tiene materias APRO: las aprobó el
 * año pasado y no las vuelve a cursar. Lo aprobado nunca falta ni sobra, y de
 * los cuadros de elección solo se le exige lo que escribe Jefatura; los
 * cuadros no se cuentan. Lo pidió Francisco el 10-sep-2026 con el caso de un
 * repetidor al que le salían como "sobran" tres materias ya aprobadas.
 *
 * LA ÚNICA LISTA DE MATERIAS: LA PESTAÑA "OFERTA". Una línea por materia y
 * curso, con todo lo que el programa necesita saber de ella:
 *
 *   Curso                     1º, 2º, 3º, 4º, 1º BACH, 2º BACH
 *   Materia                   el nombre EXACTO que le da Séneca en el CSV
 *   Quién la cursa            Todo el alumnado · Todos menos diversificación ·
 *                             Solo diversificación · Solo Ciencias y Tecnología ·
 *                             Solo Humanidades y CC. Sociales ·
 *                             Solo quienes cursan <materia>
 *   Cuadro de elección        vacío = obligatoria. Con texto, las líneas que
 *                             comparten ese texto son un cuadro del que se
 *                             elige UNA, o las que diga "(elegir 2)"
 *   Abreviatura               cómo se escribe en ALUMNADO y en el papel
 *   Código de Jefatura        cómo la escribe Jefatura en AGRUPAMIENTOS.
 *                             Varios, separados por comas. Vacío = la abreviatura
 *   Columna en ALUMNADO       dónde se enseña: OPT, MAT, OPC1..OPC4, REL/Atedu,
 *                             FR -> ALCT, MAT. MODALIDAD, OPTATIVAS. Vacío = no
 *                             se enseña (las comunes)
 *   Notas                     lo que se quiera anotar
 *
 * El programa la escribe UNA VEZ, a partir de la oferta que está más abajo en
 * este fichero, y desde entonces SOLO LA LEE. Cuando el centro cambie la
 * oferta, se cambia en la pestaña, sin tocar código. Si se borra la pestaña,
 * se vuelve a escribir desde aquí.
 *
 * DÓNDE SE VE EL RESULTADO:
 *   - La pestaña MATRÍCULA: una fila por alumno que no cuadra, con dos
 *     columnas que se leen como una orden de trabajo, "FALTAN en Séneca" y
 *     "SOBRAN en Séneca", cada materia con su porqué entre paréntesis.
 *   - La columna MATRÍCULA de ALUMNADO, para todos los cursos: OK, o un
 *     resumen corto de lo que falta y sobra.
 *   - El panel RESUMEN y la portada del PDF cuentan las que quedan.
 *
 * ======================================================================== ***/

const HOJA_OFERTA    = 'OFERTA';
const HOJA_MATRICULA = 'MATRÍCULA';
const MATRICULA_OK   = 'OK';
/* Lo que pone la columna MATRÍCULA cuando la diversificación no cuadra con
   Jefatura: hasta que eso se resuelva, no tiene sentido listar materias. */
const MATRICULA_DIV_PENDIENTE = 'DIV pendiente';

const TITULOS_OFERTA = ['Curso', 'Materia (como la escribe Séneca)', 'Quién la cursa',
  'Cuadro de elección', 'Abreviatura', 'Código de Jefatura', 'Columna en ALUMNADO', 'Notas'];

const TITULOS_MATRICULA = ['Curso', 'Grupo', 'Alumno/a', 'FALTAN en Séneca', 'SOBRAN en Séneca',
  'Nota', 'Estado', 'Observaciones'];

/* Las respuestas posibles a "Quién la cursa". Son las del desplegable. */
const OBL_TODOS       = 'Todo el alumnado';
const OBL_ORDINARIO   = 'Todos menos diversificación';
const OBL_DIVER       = 'Solo diversificación';
const OBL_CIENCIAS    = 'Solo Ciencias y Tecnología';
const OBL_HUMANIDADES = 'Solo Humanidades y CC. Sociales';
const OBL_CONDICION   = 'Solo quienes cursan ';

/* Valor de Séneca para una materia convalidada. Cuenta como matriculada. */
const OBL_CONVALIDADA = 'CONV';

/* ¿Esta casilla del CSV dice que el alumno tiene la materia? MATR es
   matriculado, CONV convalidada y APRO (solo en 2º de Bachillerato) ya
   aprobada de cuando repitió: las tres cuentan como "la tiene". */
function celdaMatriculada_(v) {
  const t = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
  return t === MARCA || t === OBL_CONVALIDADA || t === MARCA_APROBADA;
}

/*** ================= LA OFERTA DEL CENTRO (la semilla) =================
 *
 * De las hojas "OFERTA EDUCATIVA PARA EL CURSO 2026-27" que el centro entrega
 * al alumnado, una por curso. Francisco las mandó el 10-sep-2026.
 *
 * SOLO SE USA PARA ESCRIBIR LA PESTAÑA OFERTA LA PRIMERA VEZ. A partir de ahí
 * manda la pestaña. Si algo de aquí no cuadra con lo que hay en Séneca, el
 * aviso "Nombres de materias que no cuadran" lo dice, y se corrige en la
 * pestaña.
 *
 * Los nombres son los de SÉNECA, no los del folleto: el folleto escribe
 * "Formación y Or. PyP" y Séneca "Formación y Orientación Personal y
 * Profesional"; el folleto pone "PI: Música" y Séneca solo "Música".
 *
 * Cada bloque: quién lo cursa, el cuadro (vacío = obligatorias) y sus materias.
 * ======================================================================== ***/

const OFERTA_OPTATIVAS_3 = [
  'Computación y Robótica', 'Cultura Clásica', 'Cultura del Flamenco',
  'Filosofía y Argumentación', 'Iniciación a la Actividad Emprendedora',
  'Oratoria y Debate', 'Francés (Segundo Idioma)',
  'Laboratorio de Física y Química', 'Música'];

const OFERTA_ANDALUCIA_4 = [
  'Ampliación de Cultura Clásica', 'Aprendizaje Social y Emocional',
  'Artes Escénicas y Danza', 'Cultura Científica', 'Dibujo Técnico', 'Filosofía',
  'Nutrición, Salud y Deporte', 'Prácticas Biológicas'];

const OFERTA_RELIGION_ESO = ['Religión Católica', 'Religión Evangélica', 'Atención Educativa'];
const OFERTA_RELIGION_BAC = ['Religión Católica', 'Proyectos Transversales de Educación en Valores'];

const OFERTA_SEMILLA = {
  '1º': [
    { quien: OBL_TODOS, cuadro: '', materias: [
      'Biología y Geología', 'Educación Física', 'Educación Plástica, Visual y Audiovisual',
      'Geografía e Historia', 'Lengua Castellana y Literatura', 'Matemáticas', 'Música',
      'Inglés'] },
    { quien: OBL_TODOS, cuadro: 'Francés o Área Lingüística', materias: [
      'Francés (Segundo Idioma)', 'Área Lingüística de carácter transversal'] },
    { quien: OBL_TODOS, cuadro: 'Optativa', materias: [
      'Computación y Robótica', 'Cultura Clásica', 'Oratoria y Debate',
      'Music, theatre and games for English'] },
    { quien: OBL_TODOS, cuadro: 'Religión o Atención Educativa', materias: OFERTA_RELIGION_ESO }
  ],
  '2º': [
    { quien: OBL_TODOS, cuadro: '', materias: [
      'Educación Física', 'Física y Química', 'Geografía e Historia',
      'Lengua Castellana y Literatura', 'Matemáticas', 'Música', 'Inglés',
      'Tecnología y Digitalización', 'Educación en Valores Cívicos y Éticos'] },
    { quien: OBL_TODOS, cuadro: 'Optativa', materias: [
      'Computación y Robótica', 'Cultura Clásica', 'Oratoria y Debate',
      'Proyecto de Educación Plástica y Audiovisual', 'Francés (Segundo Idioma)',
      'Matemáticas en acción'] },
    { quien: OBL_TODOS, cuadro: 'Religión o Atención Educativa', materias: OFERTA_RELIGION_ESO }
  ],
  '3º': [
    { quien: OBL_ORDINARIO, cuadro: '', materias: [
      'Biología y Geología', 'Educación Física', 'Educación Plástica, Visual y Audiovisual',
      'Física y Química', 'Geografía e Historia', 'Lengua Castellana y Literatura',
      'Matemáticas', 'Inglés', 'Tecnología y Digitalización'] },
    { quien: OBL_DIVER, cuadro: '', materias: [
      'Ámbito Científico-Tecnológico', 'Ámbito Lingüístico y Social', 'Educación Física',
      'Educación Plástica, Visual y Audiovisual', 'Tecnología y Digitalización'] },
    { quien: OBL_ORDINARIO, cuadro: 'Optativa', materias: OFERTA_OPTATIVAS_3 },
    { quien: OBL_DIVER, cuadro: 'Optativas de diversificación (elegir 2)', materias: OFERTA_OPTATIVAS_3 },
    { quien: OBL_TODOS, cuadro: 'Religión o Atención Educativa', materias: OFERTA_RELIGION_ESO }
  ],
  '4º': [
    { quien: OBL_ORDINARIO, cuadro: '', materias: [
      'Educación Física', 'Geografía e Historia', 'Lengua Castellana y Literatura', 'Inglés'] },
    { quien: OBL_ORDINARIO, cuadro: 'Matemáticas A o Matemáticas B', materias: [
      'Matemáticas A', 'Matemáticas B'] },
    { quien: OBL_ORDINARIO, cuadro: 'OPT 1', materias: [
      'Física y Química', 'Latín', 'Formación y Orientación Personal y Profesional'] },
    { quien: OBL_ORDINARIO, cuadro: 'OPT 2', materias: [
      'Biología y Geología', 'Economía y Emprendimiento', 'Tecnología'] },
    { quien: OBL_ORDINARIO, cuadro: 'Optativa 3', materias: [
      'Digitalización', 'Expresión Artística', 'Música', 'Francés (Segundo Idioma)'] },
    { quien: OBL_DIVER, cuadro: '', materias: [
      'Ámbito Científico-Tecnológico', 'Ámbito Lingüístico y Social', 'Educación Física'] },
    { quien: OBL_DIVER, cuadro: 'Optativas de diversificación (elegir 2)', materias: [
      'Digitalización', 'Economía y Emprendimiento', 'Expresión Artística',
      'Formación y Orientación Personal y Profesional', 'Latín', 'Música',
      'Francés (Segundo Idioma)', 'Tecnología'] },
    { quien: OBL_TODOS, cuadro: 'Optativa de Andalucía', materias: OFERTA_ANDALUCIA_4 },
    { quien: OBL_TODOS, cuadro: 'Religión o Atención Educativa', materias: OFERTA_RELIGION_ESO }
  ],
  '1º BACH': [
    { quien: OBL_TODOS, cuadro: '', materias: [
      'Educación Física', 'Filosofía', 'Lengua Castellana y Literatura', 'Inglés'] },
    { quien: OBL_CIENCIAS, cuadro: '', materias: ['Matemáticas', 'Física y Química'] },
    { quien: OBL_CIENCIAS, cuadro: 'Modalidad: Biología, Dibujo Técnico o Tecnología', materias: [
      'Biología, Geología y Ciencias Ambientales', 'Dibujo Técnico', 'Tecnología e Ingeniería'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Mat. CCSS o Latín', materias: [
      'Matemáticas Aplicadas a las Ciencias Sociales', 'Latín'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Economía o Griego', materias: [
      'Economía', 'Griego'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Hª del Mundo Cont. o Literatura Universal', materias: [
      'Historia del Mundo Contemporáneo', 'Literatura Universal'] },
    { quien: OBL_TODOS, cuadro: 'Optativa del primer bloque', materias: [
      'Anatomía Aplicada', 'Cultura Emprendedora y Empresarial', 'Francés (Segundo Idioma)',
      'Patrimonio Cultural y Artístico de Andalucía', 'Iniciación al Comentario de Texto',
      'Tecnologías de la Información y la Comunicación'] },
    { quien: OBL_TODOS, cuadro: 'Optativa del segundo bloque', materias: [
      'Antropología y Sociología', 'Fisiología Humana', 'Olimpismo',
      'Creación Digital y Pensamiento Computacional',
      'Educación para la Convivencia Democrática'] },
    { quien: OBL_TODOS, cuadro: 'Religión o Proyecto transversal', materias: OFERTA_RELIGION_BAC }
  ],
  '2º BACH': [
    { quien: OBL_TODOS, cuadro: '', materias: [
      'Historia de España', 'Historia de la Filosofía', 'Lengua Castellana y Literatura',
      'Inglés'] },
    { quien: OBL_CIENCIAS, cuadro: 'Modalidad: Matemáticas o Mat. CCSS', materias: [
      'Matemáticas', 'Matemáticas Aplicadas a las Ciencias Sociales'] },
    { quien: OBL_CIENCIAS, cuadro: 'Modalidad de Ciencias (elegir 2)', materias: [
      'Biología', 'Dibujo Técnico', 'Física', 'Geología y Ciencias Ambientales',
      'Química', 'Tecnología e Ingeniería'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Latín o Mat. CCSS', materias: [
      'Latín', 'Matemáticas Aplicadas a las Ciencias Sociales'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Empresa y Diseño o Griego', materias: [
      'Empresa y Diseño de Modelos de Negocio', 'Griego'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Modalidad: Geografía o Historia del Arte', materias: [
      'Geografía', 'Historia del Arte'] },
    { quien: OBL_CIENCIAS, cuadro: 'Optativa del primer bloque', materias: [
      'Programación y Computación', 'Electrotecnia', 'Estadística',
      'Introducción a las Ciencias de la Salud',
      'Tecnologías de la Información y la Comunicación', 'Francés (Segundo Idioma)'] },
    { quien: OBL_HUMANIDADES, cuadro: 'Optativa del primer bloque', materias: [
      'Finanzas y Economía', 'Fundamentos de Administración y Gestión', 'Mitología Clásica',
      'Tecnologías de la Información y la Comunicación', 'Francés (Segundo Idioma)'] },
    { quien: OBL_TODOS, cuadro: 'Optativa del segundo bloque', materias: [
      'Actividad Física, Salud y Sociedad', 'Educación para la Convivencia Democrática',
      'Imagen y Sonido', 'Psicología', 'Ciencias de la Tierra y del Medio Ambiente'] },
    { quien: OBL_TODOS, cuadro: 'Religión o Proyecto transversal', materias: OFERTA_RELIGION_BAC }
  ]
};

/* CÓMO SE ABREVIA CADA MATERIA EN LAS COLUMNAS DE LA ESO. Son los códigos que
   ya salían en el papel hasta la BD v61 (venían de REGLAS, en Codigo.gs). Las
   materias que no están aquí se abrevian con ABREVIATURAS (Codigo.gs) o, en
   Bachillerato, con ABREVIATURAS_BAC (Bachillerato.gs). */
const ABREV_ESO_ELEGIBLES = {
  'Oratoria y Debate': 'OyD', 'Computación y Robótica': 'CyR',
  'Music, theatre and games for English': 'MTGE', 'Cultura Clásica': 'CC',
  'Cultura del Flamenco': 'CFL', 'Filosofía y Argumentación': 'FyA',
  'Iniciación a la Actividad Emprendedora': 'IAE', 'Matemáticas en acción': 'MeA',
  'Francés (Segundo Idioma)': 'FR', 'Área Lingüística de carácter transversal': 'ALCT',
  'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA', 'Atención Educativa': 'ATEDU',
  'Proyecto de Educación Plástica y Audiovisual': 'PEPA',
  'Laboratorio de Física y Química': 'LAB', 'Música': 'MUS',
  'Matemáticas A': 'MatA', 'Matemáticas B': 'MatB', 'Ámbito Científico-Tecnológico': 'ÁMB',
  'Economía y Emprendimiento': 'ECO', 'Tecnología': 'TEC', 'Biología y Geología': 'BYG',
  'Formación y Orientación Personal y Profesional': 'FOPP', 'Física y Química': 'FQ',
  'Latín': 'LAT', 'Digitalización': 'DIG', 'Expresión Artística': 'EA',
  'Nutrición, Salud y Deporte': 'NSD', 'Prácticas Biológicas': 'PB', 'Dibujo Técnico': 'DT',
  'Aprendizaje Social y Emocional': 'ASE', 'Ampliación de Cultura Clásica': 'ACC',
  'Artes Escénicas y Danza': 'AED', 'Cultura Científica': 'CCi', 'Filosofía': 'FIL'
};
/* En Bachillerato la religión y su alternativa llevan su propio código. */
const ABREV_BAC_RELIGION = { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA',
  'Proyectos Transversales de Educación en Valores': 'PTEV' };

/* CÓMO ESCRIBE JEFATURA CADA MATERIA EN SU CUADERNO. Por abreviatura nuestra,
   en la ESO. Lo que no esté aquí se escribe igual que la abreviatura. Estos
   son los códigos que Jefatura ha usado de verdad (venían de TRAD_JEFATURA). */
const JEF_POR_ABREV_ESO = {
  'CAT': 'REL', 'EVA': 'REV', 'CyR': 'CYR', 'OyD': 'OYD', 'FR': 'FR2, FRA2',
  'LAB': 'LFQ', 'MatA': 'MATA', 'MatB': 'MATB', 'ECO': 'ECE', 'FOPP': 'FOP',
  'FQ': 'FYQ', 'EA': 'EAR', 'DT': 'DBT'
};
/* Y en Bachillerato, por nombre de materia. Los dictó Francisco el
   10-sep-2026, leyéndolos de su cuaderno de este curso. */
const JEF_POR_MATERIA_BAC = {
  'Anatomía Aplicada': 'AAPL', 'Biología, Geología y Ciencias Ambientales': 'BGCA',
  'Creación Digital y Pensamiento Computacional': 'CDPC',
  'Cultura Emprendedora y Empresarial': 'CEE', 'Dibujo Técnico': 'DIBT', 'Economía': 'ECON',
  'Física y Química': 'FISQ', 'Francés (Segundo Idioma)': 'FRA2', 'Griego': 'GRIE',
  'Historia del Mundo Contemporáneo': 'HMCO', 'Iniciación al Comentario de Texto': 'ICT',
  'Olimpismo': 'OLI', 'Biología': 'BIOL', 'Estadística': 'EST',
  'Empresa y Diseño de Modelos de Negocio': 'EYDI', 'Física': 'FISI',
  'Finanzas y Economía': 'FYEC', 'Geografía': 'GEOG', 'Historia del Arte': 'HART',
  'Química': 'QUIM', 'Tecnología e Ingeniería': 'TECI'
};

/* EN QUÉ COLUMNA DE ALUMNADO SE ENSEÑA CADA MATERIA DE LA ESO. Lo que no está
   aquí no se enseña (son las comunes). Ojo con 4º: lo que el folleto llama
   "OPT 1" va a la columna OPC2 y "OPT 2" a OPC1, que es como estaba desde el
   principio y como lo escribe Jefatura. */
const COLUMNA_ESO = {
  '1º': { 'Computación y Robótica': 'OPT', 'Cultura Clásica': 'OPT', 'Oratoria y Debate': 'OPT',
          'Music, theatre and games for English': 'OPT',
          'Francés (Segundo Idioma)': 'FR -> ALCT', 'Área Lingüística de carácter transversal': 'FR -> ALCT',
          'Religión Católica': 'REL/Atedu', 'Religión Evangélica': 'REL/Atedu', 'Atención Educativa': 'REL/Atedu' },
  '2º': { 'Computación y Robótica': 'OPT', 'Cultura Clásica': 'OPT', 'Oratoria y Debate': 'OPT',
          'Proyecto de Educación Plástica y Audiovisual': 'OPT', 'Francés (Segundo Idioma)': 'OPT',
          'Matemáticas en acción': 'OPT',
          'Religión Católica': 'REL/Atedu', 'Religión Evangélica': 'REL/Atedu', 'Atención Educativa': 'REL/Atedu' },
  '3º': { 'Computación y Robótica': 'OPT', 'Cultura Clásica': 'OPT', 'Cultura del Flamenco': 'OPT',
          'Filosofía y Argumentación': 'OPT', 'Iniciación a la Actividad Emprendedora': 'OPT',
          'Oratoria y Debate': 'OPT', 'Francés (Segundo Idioma)': 'OPT',
          'Laboratorio de Física y Química': 'OPT', 'Música': 'OPT',
          'Religión Católica': 'REL/Atedu', 'Religión Evangélica': 'REL/Atedu', 'Atención Educativa': 'REL/Atedu' },
  '4º': { 'Matemáticas A': 'MAT', 'Matemáticas B': 'MAT', 'Ámbito Científico-Tecnológico': 'MAT',
          'Biología y Geología': 'OPC1', 'Economía y Emprendimiento': 'OPC1', 'Tecnología': 'OPC1',
          'Física y Química': 'OPC2', 'Latín': 'OPC2', 'Formación y Orientación Personal y Profesional': 'OPC2',
          'Digitalización': 'OPC3', 'Expresión Artística': 'OPC3', 'Música': 'OPC3', 'Francés (Segundo Idioma)': 'OPC3',
          'Ampliación de Cultura Clásica': 'OPC4', 'Aprendizaje Social y Emocional': 'OPC4',
          'Artes Escénicas y Danza': 'OPC4', 'Cultura Científica': 'OPC4', 'Dibujo Técnico': 'OPC4',
          'Filosofía': 'OPC4', 'Nutrición, Salud y Deporte': 'OPC4', 'Prácticas Biológicas': 'OPC4',
          'Religión Católica': 'REL/Atedu', 'Religión Evangélica': 'REL/Atedu', 'Atención Educativa': 'REL/Atedu' }
};

/* Las filas de la pestaña OFERTA, tal y como se escriben la primera vez. */
function semillaOferta_() {
  const filas = [];
  for (const curso in OFERTA_SEMILLA) {
    const bac = esBachillerato_(curso);
    const bloques = OFERTA_SEMILLA[curso];
    for (let b = 0; b < bloques.length; b++) {
      const bl = bloques[b];
      for (let m = 0; m < bl.materias.length; m++) {
        const materia = bl.materias[m];
        let abrev, jef = '', columna = '';
        if (bac) {
          abrev = ABREV_BAC_RELIGION[materia] || ABREVIATURAS[materia] || ABREVIATURAS_BAC[materia] || '';
          jef = JEF_POR_MATERIA_BAC[materia] || '';
          const cn = normalizar(bl.cuadro);
          if (cn.indexOf('religion') !== -1) columna = 'REL/Atedu';
          else if (cn.indexOf('modalidad') !== -1) columna = 'MAT. MODALIDAD';
          else if (cn.indexOf('optativ') !== -1) columna = 'OPTATIVAS';
          else if (!cn && normalizar(bl.quien) !== normalizar(OBL_TODOS)) columna = 'MAT. MODALIDAD';
        } else {
          abrev = ABREV_ESO_ELEGIBLES[materia] || ABREVIATURAS[materia] || '';
          jef = JEF_POR_ABREV_ESO[abrev] || '';
          columna = (COLUMNA_ESO[curso] || {})[materia] || '';
        }
        filas.push({ curso: curso, materia: materia, quien: bl.quien, cuadro: bl.cuadro,
                     abrev: abrev || materia, jef: jef, columna: columna, notas: '' });
      }
    }
  }
  return filas;
}

/*** ================= LA PESTAÑA OFERTA ================= ***/

let CACHE_OFERTA_ = null;

/* Devuelve { porCurso: { curso: [lineas] }, sembrada: true/false }. Cada línea:
   { curso, materia, quien, cuadro, cuantas, abrev, jef: [códigos], columna }.
   Si la pestaña no existe o está vacía, la escribe con la semilla. */
function leerOferta_() {
  if (CACHE_OFERTA_) return CACHE_OFERTA_;
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_OFERTA);
  let sembrada = false;
  if (!hoja || hoja.getLastRow() < 3) {
    escribirOferta_(semillaOferta_());
    hoja = libro.getSheetByName(HOJA_OFERTA);
    sembrada = true;
  }
  const porCurso = {};
  const ancho = Math.min(TITULOS_OFERTA.length, hoja.getLastColumn());
  const datos = hoja.getLastRow() < 3 ? [] : hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  const texto = function (v) { return String(v === null || v === undefined ? '' : v).trim(); };
  for (let f = 0; f < datos.length; f++) {
    const curso = texto(datos[f][0]), materia = texto(datos[f][1]);
    if (!curso || !materia) continue;
    const cuadro = texto(datos[f][3]);
    const abrev = texto(datos[f][4]);
    const linea = {
      curso: curso, materia: materia, quien: texto(datos[f][2]) || OBL_TODOS,
      cuadro: cuadro, cuantas: oblCuantasDelGrupo_(cuadro),
      abrev: abrev || abreviar(materia),
      jef: texto(datos[f][5]).split(/[,;·]/).map(function (x) { return x.trim(); })
             .filter(function (x) { return !!x; }),
      columna: texto(datos[f][6])
    };
    if (!porCurso[curso]) porCurso[curso] = [];
    porCurso[curso].push(linea);
  }
  CACHE_OFERTA_ = { porCurso: porCurso, sembrada: sembrada };
  return CACHE_OFERTA_;
}

/* Las líneas de la oferta de un curso. Vacío si el curso no está. */
function ofertaDeCurso_(curso) {
  const O = leerOferta_();
  return O.porCurso[curso] || [];
}

/* De "Modalidad (elegir 2)" saca el 2. Si no lo dice, es una. */
function oblCuantasDelGrupo_(texto) {
  const m = String(texto || '').match(/\(\s*elegir\s+(\d+)\s*\)/i);
  const n = m ? parseInt(m[1], 10) : 1;
  return isNaN(n) || n < 1 ? 1 : n;
}

/* Traduce lo escrito en "Quién la cursa". */
function oblQuien_(texto) {
  const n = normalizar(texto);
  if (n.indexOf('solo diver') === 0) return 'diver';
  if (n.indexOf('todos menos') === 0) return 'ordinario';
  if (n.indexOf('solo quienes cursan') === 0) return 'condicion';
  if (n.indexOf('solo ciencias') === 0) return 'ciencias';
  if (n.indexOf('solo human') === 0) return 'humanidades';
  return 'todos';
}

/* De "Solo quienes cursan Latín" saca "Latín". */
function oblCondicion_(texto) {
  const t = String(texto === null || texto === undefined ? '' : texto).trim();
  if (normalizar(t).indexOf('solo quienes cursan') !== 0) return '';
  return t.substring(OBL_CONDICION.length).trim();
}

/* El nombre de un cuadro sin su "(elegir N)". */
function nombreDeCuadro_(cuadro) {
  return String(cuadro || '').split('(')[0].trim().replace(/^Modalidad:\s*/i, '');
}

/* Escribe la pestaña OFERTA entera. Solo se llama cuando no existe. */
function escribirOferta_(filas) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_OFERTA);
  if (!hoja) hoja = libro.insertSheet(HOJA_OFERTA);
  hoja.clear();
  const ancho = TITULOS_OFERTA.length;
  if (hoja.getMaxColumns() < ancho) hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());

  hoja.getRange(1, 1).setValue('OFERTA — la única lista de materias del sistema. Esta pestaña la mandas tú · ' +
    new Date().toLocaleString('es-ES')).setFontWeight('bold');
  hoja.getRange(1, 1).setNote(
    'De aquí sale todo lo que el programa sabe de las materias: qué es obligatorio, qué se elige, ' +
    'cómo se abrevia en el papel y cómo la llama Jefatura.\n\n' +
    'La escribió el programa una vez, a partir de las hojas de oferta educativa del centro. ' +
    'Desde entonces solo la lee: lo que cambies aquí manda. Si la borras, la vuelve a escribir.\n\n' +
    'Curso: 1º a 4º en la ESO; 1º BACH y 2º BACH en Bachillerato.\n' +
    'Materia: el nombre EXACTO que le da Séneca en el CSV de matrícula. Si no coincide, sale el aviso ' +
    '"Nombres de materias que no cuadran".\n' +
    'Quién la cursa: a quién se le exige. En la ESO, la diversificación cursa los Ámbitos en vez de las ' +
    'materias sueltas. En Bachillerato, cada modalidad tiene las suyas.\n' +
    'Cuadro de elección: vacío = obligatoria. Con texto, las líneas que comparten ese texto son un cuadro ' +
    'del que el alumno elige UNA, o las que diga "(elegir 2)".\n' +
    'Abreviatura: cómo se escribe en ALUMNADO y en el papel.\n' +
    'Código de Jefatura: cómo la escribe Jefatura en AGRUPAMIENTOS. Varios, separados por comas. ' +
    'Vacío = igual que la abreviatura.\n' +
    'Columna en ALUMNADO: en qué columna se enseña. Vacío = no se enseña (las comunes).');

  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_OFERTA]).setFontWeight('bold')
      .setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle');

  const valores = filas.map(function (f) {
    return [f.curso, f.materia, f.quien, f.cuadro || '', f.abrev || '', f.jef || '', f.columna || '', f.notas || ''];
  });
  if (valores.length) hoja.getRange(3, 1, valores.length, ancho).setValues(valores);

  try {
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList([OBL_TODOS, OBL_ORDINARIO, OBL_DIVER, OBL_CIENCIAS, OBL_HUMANIDADES], true)
      .setAllowInvalid(true).build();
    hoja.getRange(3, 3, Math.max(valores.length, 1) + 200, 1).setDataValidation(regla);
  } catch (e) { /* sin desplegable se escribe a mano */ }

  const anchos = [60, 300, 190, 230, 80, 110, 120, 220];
  for (let c = 0; c < anchos.length; c++) hoja.setColumnWidth(c + 1, anchos[c]);
  hoja.setFrozenRows(2);
  try {
    if (!hoja.getFilter()) hoja.getRange(2, 1, Math.max(valores.length, 1) + 1, ancho).createFilter();
  } catch (e) { /* si ya hay filtro, se deja */ }
  return valores.length;
}

/*** ================= QUÉ ES CADA COLUMNA DE UN CSV ================= ***/

/* Empareja los títulos de un CSV de matrícula con las líneas de la oferta de
   su curso. Devuelve, por columna, la línea que le corresponde o null, y
   además las listas para el aviso "Nombres de materias que no cuadran".

   Primero se busca el nombre exacto. Si no aparece, se prueban dos parecidos,
   y solo se acepta el parecido cuando hay UNA sola candidata:
     - sin lo que va entre paréntesis: "Música (Proyecto Integrado)" y "Música";
     - que el título empiece o acabe por el nombre de la oferta, con el corte en
       un espacio: "Cultura Clásica" encuentra "Cultura Clásica II", pero
       "Matemáticas" NO encuentra "Matemáticas A" y "Matemáticas B" a la vez.
   Cada emparejamiento por parecido se avisa, con los dos nombres.

   Las columnas de materias pendientes de cursos anteriores llevan el curso
   entre paréntesis ("(2º de E.S.O.)", "(1º de Bachillerato") y no son
   materias de este curso: se marcan como PEND. */
function clasificarColumnas_(cab, curso, iNombre, iUnidad) {
  const lineas = ofertaDeCurso_(curso);
  const cabN = cab.map(normalizar);
  const sinPar = function (t) {
    return normalizar(String(t === null || t === undefined ? '' : t).replace(/\([^)]*\)/g, ' '));
  };
  const clase = [], usada = {}, aprox = [];
  const porNombre = {};
  for (let i = 0; i < lineas.length; i++) {
    const n = normalizar(lineas[i].materia);
    if (!porNombre[n]) porNombre[n] = [];
    porNombre[n].push(lineas[i]);
  }
  const esPend = function (t) {
    return /\(([1-4])º de E\.S\.O\.\)\s*$/.test(t) || t.indexOf('(1º de Bachillerato') > 0 ||
           t.indexOf('(2º de Bachillerato') > 0;
  };

  for (let c = 0; c < cab.length; c++) {
    if (c === iNombre || c === iUnidad || !cab[c]) { clase.push(null); continue; }
    if (esPend(cab[c])) { clase.push({ tipo: 'PEND', titulo: cab[c] }); continue; }
    let lista = porNombre[cabN[c]] || null;
    let porParecido = false;
    if (!lista) {
      /* Sin paréntesis. */
      const objetivo = sinPar(cab[c]);
      let cand = [];
      for (const n in porNombre) if (sinPar(porNombre[n][0].materia) === objetivo) cand.push(n);
      if (cand.length !== 1) {
        /* Empieza o acaba por el nombre de la oferta. */
        cand = [];
        for (const n in porNombre) {
          const t = cabN[c];
          const empieza = t.length > n.length + 1 && t.substring(0, n.length + 1) === n + ' ';
          const acaba = t.length > n.length + 1 && t.substring(t.length - n.length - 1) === ' ' + n;
          if (empieza || acaba) cand.push(n);
        }
      }
      if (cand.length === 1) { lista = porNombre[cand[0]]; porParecido = true; }
    }
    if (!lista) { clase.push({ tipo: 'MATERIA', titulo: cab[c], lineas: [] }); continue; }
    usada[normalizar(lista[0].materia)] = true;
    if (porParecido) aprox.push(lista[0].materia + ' → ' + cab[c]);
    clase.push({ tipo: 'MATERIA', titulo: cab[c], lineas: lista });
  }

  /* Lo que la oferta nombra y el CSV no trae (solo importa en las obligatorias
     y en los cuadros que se quedan sin ninguna materia). */
  const sinColumna = [];
  for (const n in porNombre) if (!usada[n]) sinColumna.push(porNombre[n][0].materia);

  return { clase: clase, sinColumna: sinColumna, aprox: aprox, usada: usada };
}

/* El aviso de un curso sobre nombres de materias que no cuadran. Junta los dos
   lados del mismo problema: lo que la oferta nombra y Séneca no trae, y lo que
   Séneca trae, con alumnos dentro, y la oferta no nombra. Devuelve null si
   todo cuadra. */
function avisoNombresDeMaterias_(curso, apellido, C, tabla, tiene) {
  const sobranCols = [];
  for (let c = 0; c < C.clase.length; c++) {
    const k = C.clase[c];
    if (!k || k.tipo !== 'MATERIA' || k.lineas.length) continue;
    let n = 0;
    for (let f = 1; f < tabla.length; f++) if (tiene(tabla[f][c])) n++;
    if (n) sobranCols.push(k.titulo + ' (' + n + ')');
  }
  /* De las que la oferta nombra y el CSV no trae, solo importan las
     obligatorias: que una optativa no tenga columna solo quiere decir que este
     año no la coge nadie. Pero si un cuadro entero se queda sin columna, ese
     cuadro deja de comprobarse, y eso sí hay que decirlo. */
  const lineas = ofertaDeCurso_(curso);
  const oblSinColumna = [], deCadaCuadro = {};
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    /* En Bachillerato, lo que es de la otra modalidad no es columna de este
       fichero, y es normal. */
    const q = oblQuien_(l.quien);
    if (apellido && ((q === 'ciencias' && apellido !== MODALIDAD_CIENCIAS) ||
                     (q === 'humanidades' && apellido !== MODALIDAD_HUMANIDADES))) continue;
    if (l.cuadro) {
      if (deCadaCuadro[l.cuadro] === undefined) deCadaCuadro[l.cuadro] = 0;
      if (C.usada[normalizar(l.materia)]) deCadaCuadro[l.cuadro]++;
    } else if (!C.usada[normalizar(l.materia)] && oblSinColumna.indexOf(l.materia) === -1) {
      oblSinColumna.push(l.materia);
    }
  }
  for (const g in deCadaCuadro) if (!deCadaCuadro[g]) oblSinColumna.push('ninguna del cuadro "' + g + '"');

  if (!oblSinColumna.length && !sobranCols.length && !C.aprox.length) return null;
  const partes = [];
  if (oblSinColumna.length) partes.push('LA OFERTA LAS PIDE Y SÉNECA NO LAS TRAE: ' + oblSinColumna.join(', ') + '.');
  if (sobranCols.length) {
    partes.push('SÉNECA LAS TRAE Y LA OFERTA NO LAS NOMBRA (entre paréntesis, cuánta gente las cursa): ' +
                sobranCols.join(', ') + '. A quien las tenga le salen como "sobra" en MATRÍCULA.');
  }
  if (C.aprox.length) partes.push('EMPAREJADAS POR PARECIDO: ' + C.aprox.join(', ') + '.');
  partes.push(sobranCols.length
    ? 'Si es la misma materia escrita de dos maneras, corrige el nombre en la pestaña OFERTA.'
    : 'Corrige el nombre en la pestaña OFERTA para que coincida con el de Séneca.');
  return { curso: curso, grupo: apellido || '', alumno: '',
           aviso: 'Nombres de materias que no cuadran en ' + curso + (apellido ? ' (' + apellido + ')' : ''),
           detalle: partes.join(' ') };
}

/*** ================= LA CUENTA DE UN ALUMNO ================= ***/

/* ¿Esta línea de la oferta le toca a este alumno? 'a' trae diver (ESO),
   modalidad (Bachillerato) y tiene (sus materias). */
function lineaAplica_(l, a) {
  const q = oblQuien_(l.quien);
  if (q === 'todos') return true;
  if (q === 'ordinario') return !a.diver;
  if (q === 'diver') return !!a.diver;
  if (q === 'ciencias') return a.modalidad === MODALIDAD_CIENCIAS;
  if (q === 'humanidades') return a.modalidad === MODALIDAD_HUMANIDADES;
  if (q === 'condicion') return !!a.tiene[normalizar(oblCondicion_(l.quien))];
  return true;
}

/* Un código escrito por Jefatura, en mayúsculas y sin tildes. */
function codigoLimpio_(v) {
  return String(v === null || v === undefined ? '' : v)
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

/* A qué línea de la oferta de un curso se refiere un código de Jefatura: por
   su código de Jefatura, por su abreviatura o por su nombre. null si a ninguna. */
function lineaDeCodigoJef_(lineas, codigo) {
  const c = codigoLimpio_(codigo);
  if (!c) return null;
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    for (let j = 0; j < l.jef.length; j++) if (codigoLimpio_(l.jef[j]) === c) return l;
  }
  for (let i = 0; i < lineas.length; i++) if (codigoLimpio_(lineas[i].abrev) === c) return lineas[i];
  for (let i = 0; i < lineas.length; i++) if (codigoLimpio_(lineas[i].materia) === c) return lineas[i];
  /* Último recurso: el código es el principio del nombre de la materia, como
     "PSIC" para Psicología o "GEOG" para Geografía. Solo vale si hay UNA
     materia del curso que empiece así (con "MAT" en 2º BACH hay dos, y ahí no
     se adivina). Visto el 10-sep-2026: Jefatura escribe así en Bachillerato. */
  if (c.length >= 3) {
    const cn = normalizar(c);
    let unica = null, cuantas = 0;
    for (let i = 0; i < lineas.length; i++) {
      if (normalizar(lineas[i].materia).indexOf(cn) === 0) { cuantas++; unica = lineas[i]; }
    }
    if (cuantas === 1) return unica;
  }
  return null;
}

/* Los códigos que Jefatura ha escrito para un alumno, todos juntos: en la ESO
   la religión, la optativa (puede llevar dos, separadas por barra), las
   matemáticas, las cuatro opciones y el idioma; en Bachillerato las cuatro
   casillas MOD1, MOD2, OPT1, OPT2. */
function codigosDeJefatura_(j) {
  const salida = [];
  const mete = function (v) {
    String(v === null || v === undefined ? '' : v).split('/').forEach(function (x) {
      const t = x.trim();
      if (t) salida.push(t);
    });
  };
  if (!j) return salida;
  if (j.bac && j.bac.length) { j.bac.forEach(mete); return salida; }
  ['rel', 'opt', 'mat', 'opc1', 'opc2', 'opc3', 'opc4', 'alct'].forEach(function (k) { mete(j[k]); });
  return salida;
}

/* LA CUENTA. Devuelve { corto, faltan: [texto], sobran: [texto], notas: [texto] }.
     a        { nombre, unidad, curso, tiene: {materia normalizada: título del CSV},
                diver (ESO), modalidad (Bachillerato), existe: {materia normalizada: true} }
     j        su fila de Jefatura, o null si no está en el fichero
     hayJef   si el fichero de Jefatura trae ese curso (si no, no se le puede
              reprochar nada a Jefatura) */
function cuentaDeMatricula_(a, j, hayJef) {
  const lineas = ofertaDeCurso_(a.curso);
  const salida = { corto: MATRICULA_OK, faltan: [], sobran: [], notas: [] };
  if (!lineas.length) {
    salida.corto = SIN_DATO;
    salida.notas.push('La pestaña OFERTA no tiene líneas de ' + a.curso + ': no se puede comprobar.');
    return salida;
  }
  if (esBachillerato_(a.curso) && !a.modalidad) {
    salida.corto = SIN_DATO;
    salida.notas.push('Modalidad sin identificar: no se puede comprobar.');
    return salida;
  }
  /* La diversificación no cuadra con Jefatura: hasta que se cargue en Séneca
     no tiene sentido listar materias. Lo dice DISCREPANCIAS. */
  if (j && !esBachillerato_(a.curso)) {
    const divJef = j.div === 'SÍ';
    if (divJef !== !!a.diver) {
      salida.corto = MATRICULA_DIV_PENDIENTE;
      salida.notas.push(divJef
        ? 'Jefatura lo tiene en diversificación y Séneca todavía no. Hasta que se cargue, no se comparan sus materias. Ver DISCREPANCIAS.'
        : 'Séneca lo tiene en diversificación y Jefatura no. Ver DISCREPANCIAS.');
      return salida;
    }
  }

  /* Las líneas que le tocan, una por materia. Si una materia sale en dos
     líneas que le tocan (no debería), manda la primera. */
  const porMateria = {}, orden = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (!lineaAplica_(l, a)) continue;
    const n = normalizar(l.materia);
    if (porMateria[n]) continue;
    porMateria[n] = l;
    orden.push(n);
  }
  /* Cualquier línea del curso, por materia, para explicar los sobrantes. */
  const cualquiera = {};
  for (let i = 0; i < lineas.length; i++) {
    const n = normalizar(lineas[i].materia);
    if (!cualquiera[n]) cualquiera[n] = lineas[i];
  }

  /* Lo que Jefatura quiere, traducido a líneas de la oferta. */
  const quiere = {}, sinTraducir = [], noLeToca = [];
  const codigos = codigosDeJefatura_(j);
  for (let i = 0; i < codigos.length; i++) {
    const l = lineaDeCodigoJef_(lineas, codigos[i]);
    if (!l) { if (sinTraducir.indexOf(codigos[i]) === -1) sinTraducir.push(codigos[i]); continue; }
    const n = normalizar(l.materia);
    if (!porMateria[n]) { noLeToca.push(l.materia + ' (' + l.quien + ')'); continue; }
    quiere[n] = true;
  }
  if (sinTraducir.length) {
    salida.notas.push('Jefatura escribe ' + sinTraducir.map(function (c) { return '"' + c + '"'; }).join(', ') +
      ' y no sé qué materia es. Añade el código en la columna "Código de Jefatura" de la pestaña OFERTA. ' +
      'Mientras tanto ese cuadro se comprueba contando.');
  }
  if (noLeToca.length) {
    salida.notas.push('Jefatura le pone ' + noLeToca.join(', ') + ', que no le corresponde' +
      (a.diver ? ': es alumnado de diversificación.' : '.'));
  }
  if (!j && hayJef) salida.notas.push('No está en el fichero de Jefatura: los cuadros se comprueban contando.');

  /* QUIEN REPITE 2º DE BACHILLERATO tiene materias APRO: las aprobó el año
     pasado y no las vuelve a cursar. Con esa gente la cuenta cambia:
       - lo aprobado ya lo tiene: nunca falta y nunca sobra;
       - de los cuadros de elección solo se le exige lo que escribe Jefatura,
         y lo que curse sin que Jefatura lo ponga, sobra;
       - los cuadros no se cuentan: si Jefatura no le pone nada de un cuadro,
         es que ya lo aprobó. */
  const aprobada = a.aprobada || {};
  const repite = Object.keys(aprobada).length > 0;
  if (repite) {
    salida.notas.push('Repite: lo aprobado el año pasado no cuenta y solo se le exige lo que escribe Jefatura.');
  }

  /* Las obligatorias, una a una; los cuadros, agrupados. */
  const cuadros = {}, ordenCuadros = [];
  const faltan = [], sobran = [];
  const abrevDe = function (l) { return l.abrev || abreviar(l.materia); };
  for (let i = 0; i < orden.length; i++) {
    const l = porMateria[orden[i]];
    if (!l.cuadro) {
      /* Una obligatoria que no es columna del fichero de Séneca no se le puede
         exigir a nadie: o Séneca la llama de otra manera, o la pestaña OFERTA
         tiene el nombre mal. Lo dice el aviso "Nombres de materias que no
         cuadran", una sola vez. Las de los cuadros sí se miran aunque no sean
         columna: si Jefatura la pide y nadie del curso la tiene, falta. */
      if (a.existe && !a.existe[orden[i]]) continue;
      if (!a.tiene[orden[i]]) faltan.push({ l: l, motivo: 'obligatoria' });
      continue;
    }
    if (!cuadros[l.cuadro]) {
      cuadros[l.cuadro] = { cuantas: l.cuantas, lineas: [], sen: [], jef: [] };
      ordenCuadros.push(l.cuadro);
    }
    const C = cuadros[l.cuadro];
    C.lineas.push(l);
    if (a.tiene[orden[i]] && !aprobada[orden[i]]) C.sen.push(l);
    if (quiere[orden[i]]) C.jef.push(l);
  }

  for (let k = 0; k < ordenCuadros.length; k++) {
    const nombre = ordenCuadros[k], C = cuadros[nombre];
    const corto = nombreDeCuadro_(nombre);
    const jefAbrevs = C.jef.map(abrevDe).join(', ');
    /* Lo que Jefatura pide y no está (ni cursada ni aprobada). */
    const jefFaltan = C.jef.filter(function (l) { return !a.tiene[normalizar(l.materia)]; });
    jefFaltan.forEach(function (l) { faltan.push({ l: l, motivo: 'Jefatura, ' + corto }); });

    if (repite) {
      /* Quien repite solo cursa lo que Jefatura le pone. Si no está en el
         fichero de Jefatura, no se le puede reprochar nada. */
      if (j) {
        C.sen.forEach(function (l) {
          if (quiere[normalizar(l.materia)]) return;
          sobran.push({ l: l, motivo: C.jef.length ? 'Jefatura dice ' + jefAbrevs : 'repite y Jefatura no la pone' });
        });
      }
      continue;
    }

    if (C.jef.length >= C.cuantas) {
      /* Jefatura ha rellenado el cuadro entero: lo demás sobra. */
      C.sen.forEach(function (l) {
        if (!quiere[normalizar(l.materia)]) sobran.push({ l: l, motivo: 'Jefatura dice ' + jefAbrevs });
      });
      continue;
    }
    /* Jefatura no lo dice, o no entero: se cuenta. Lo que tendría después de
       poner lo que Jefatura pide es lo que hay en Séneca más lo que le falta. */
    const efectivo = C.sen.length + jefFaltan.length;
    if (efectivo < C.cuantas) {
      const d = C.cuantas - efectivo;
      faltan.push({ texto: d + ' de "' + corto + '"',
                    cortoTexto: d + ' de ' + corto,
                    motivo: 'cuadro de elección: ' + C.lineas.map(abrevDe).join(', ') });
    } else if (efectivo > C.cuantas) {
      C.sen.forEach(function (l) {
        if (quiere[normalizar(l.materia)]) return;
        sobran.push({ l: l, motivo: 'cuadro "' + corto + '": tiene ' + C.sen.length +
                                    ' y hay que cursar ' + C.cuantas });
      });
    }
  }

  /* Lo que está en Séneca y no le corresponde. Lo aprobado el año pasado no
     se discute. */
  for (const n in a.tiene) {
    if (porMateria[n] || aprobada[n]) continue;
    const l = cualquiera[n];
    if (l) sobran.push({ l: l, motivo: 'no le corresponde: ' + l.quien });
    else sobran.push({ texto: String(a.tiene[n]), cortoTexto: abreviar(String(a.tiene[n])),
                       motivo: 'no está en la oferta de ' + a.curso });
  }

  const largo = function (x) { return (x.l ? x.l.materia : x.texto) + ' (' + x.motivo + ')'; };
  const cortoDe = function (x) { return x.l ? abrevDe(x.l) : x.cortoTexto; };
  salida.faltan = faltan.map(largo);
  salida.sobran = sobran.map(largo);
  const partes = [];
  if (faltan.length) partes.push((faltan.length === 1 ? 'falta ' : 'faltan ') + faltan.map(cortoDe).join(', '));
  if (sobran.length) partes.push((sobran.length === 1 ? 'sobra ' : 'sobran ') + sobran.map(cortoDe).join(', '));
  salida.corto = partes.length ? partes.join(' · ') : MATRICULA_OK;
  return salida;
}

/*** ================= TODO EL CENTRO ================= ***/

let RESULTADO_MATRICULA_ = null;

/* Hace la cuenta de todo el alumnado. Lo llama construirAlumnado (Codigo.gs)
   antes de componer la tabla, para que la columna MATRÍCULA salga en ALUMNADO.
     porCurso    { curso: [alumnos con nombre, unidad, curso, tiene, diver, modalidad, existe] }
     jefPorClave { 'nombre|curso': fila de Jefatura }
     cursosJef   { curso: true } los cursos que trae el fichero de Jefatura
   Escribe en cada alumno a.valores['MATRÍCULA'] y devuelve las filas de la
   pestaña MATRÍCULA. */
function comprobarMatriculas_(porCurso, jefPorClave, cursosJef) {
  const filas = [];
  let eso = 0, bac = 0;
  for (const curso in porCurso) {
    const lista = porCurso[curso];
    const hayJef = !!cursosJef[curso];
    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      if (!a.tiene) continue;
      const j = jefPorClave[normalizar(a.nombre) + '|' + a.curso] || null;
      let R;
      try { R = cuentaDeMatricula_(a, j, hayJef); }
      catch (e) { R = { corto: SIN_DATO, faltan: [], sobran: [], notas: ['No he podido comprobarla: ' + e.message] }; }
      if (!a.valores) a.valores = {};
      a.valores['MATRÍCULA'] = R.corto;
      if (R.corto === MATRICULA_OK) continue;
      if (esBachillerato_(a.curso)) bac++; else eso++;
      filas.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
                   faltan: R.faltan.join('\n'), sobran: R.sobran.join('\n'),
                   nota: R.notas.join(' ') });
    }
  }
  filas.sort(function (x, y) {
    const kx = x.curso + '|' + x.grupo + '|' + normalizar(x.alumno);
    const ky = y.curso + '|' + y.grupo + '|' + normalizar(y.alumno);
    return kx < ky ? -1 : (kx > ky ? 1 : 0);
  });
  RESULTADO_MATRICULA_ = { filas: filas, eso: eso, bac: bac };
  return RESULTADO_MATRICULA_;
}

/* Lo que Francisco haya escrito en Estado y Observaciones. La fila se
   reconoce por curso y alumno, así que la marca no se pierde aunque cambie el
   detalle de lo que falta o sobra. */
function manualesMatricula_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_MATRICULA);
  const previos = {};
  if (!hoja || hoja.getLastRow() < 3) return previos;
  const n = TITULOS_MATRICULA.length;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, n).getValues();
  for (let f = 0; f < datos.length; f++) {
    const clave = normalizar(datos[f][0]) + '|' + normalizar(datos[f][2]);
    if (normalizar(datos[f][2])) previos[clave] = [datos[f][n - 2], datos[f][n - 1]];
  }
  return previos;
}

function escribirMatricula_(filas) {
  const n = TITULOS_MATRICULA.length;
  const previos = manualesMatricula_();
  const hoja = hojaLimpia(HOJA_MATRICULA, n);
  hoja.getRange(1, 1).setValue('Alumnado cuya matrícula en Séneca no cuadra con la oferta del centro y con ' +
    'lo que quiere Jefatura. Se lee como una orden de trabajo: dar de alta lo de FALTAN y dar de baja lo de SOBRAN. ' +
    'Las dos últimas columnas las rellenas tú y no se pierden. Actualizado: ' +
    new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, n).setValues([TITULOS_MATRICULA]).setFontWeight('bold').setBackground('#FCE4D6');
  const valores = filas.map(function (d) {
    const man = previos[normalizar(d.curso) + '|' + normalizar(d.alumno)] || ['', ''];
    return [d.curso, d.grupo, d.alumno, d.faltan, d.sobran, d.nota, man[0], man[1]];
  });
  if (valores.length) {
    hoja.getRange(3, 1, valores.length, n).setValues(valores);
    hoja.getRange(3, n - 1, valores.length, 2).setBackground('#FFF2CC');
    hoja.getRange(2, 1, valores.length + 1, n)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
  }
  hoja.setFrozenRows(2);
  if (valores.length) hoja.getRange(2, 1, valores.length + 1, n).createFilter();
  return valores.length;
}

/* Las matrículas que todavía no has marcado como resueltas, para la portada
   del PDF. Devuelve filas [grupo, alumno, qué, sobra, falta] de una etapa. */
function matriculasPendientes_(etapa) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_MATRICULA);
  const salida = [];
  if (!hoja || hoja.getLastRow() < 3) return salida;
  const n = TITULOS_MATRICULA.length;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, n).getValues();
  for (let f = 0; f < datos.length; f++) {
    const alumno = String(datos[f][2] || '').trim();
    if (!alumno) continue;
    if (String(datos[f][n - 2] || '').trim() !== '') continue;   // ya le has puesto un estado
    const curso = String(datos[f][0] || '').trim();
    const esBac = esBachillerato_(curso);
    if ((etapa === 'ESO') === esBac) continue;
    const resumen = function (v) { return String(v || '').split('\n').map(function (x) {
      return x.replace(/\s*\([^)]*\)\s*$/, ''); }).filter(function (x) { return x; }).join(', '); };
    /* En la portada las columnas son "Séneca dice / sobra" y "Jefatura quiere
       / falta", en ese orden. */
    salida.push([String(datos[f][1] || ''), alumno, 'Matrícula en Séneca',
                 resumen(datos[f][4]) ? 'sobra: ' + resumen(datos[f][4]) : '',
                 resumen(datos[f][3]) ? 'falta: ' + resumen(datos[f][3]) : '']);
  }
  return salida;
}

/* Cuántas quedan sin marcar, para el panel. */
function matriculasSinMarcar_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_MATRICULA);
  const salida = { eso: 0, bac: 0 };
  if (!hoja || hoja.getLastRow() < 3) return salida;
  const n = TITULOS_MATRICULA.length;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, n).getValues();
  for (let f = 0; f < datos.length; f++) {
    if (!String(datos[f][2] || '').trim()) continue;
    if (String(datos[f][n - 2] || '').trim() !== '') continue;
    if (esBachillerato_(String(datos[f][0] || '').trim())) salida.bac++; else salida.eso++;
  }
  return salida;
}
