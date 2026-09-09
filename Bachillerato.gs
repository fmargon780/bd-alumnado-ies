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

/* Las materias comunes de cada curso. Todo lo demás es itinerario. */
const COMUNES_BAC = {
  '1º BACH': ['Educación Física', 'Filosofía', 'Lengua Castellana y Literatura', 'Inglés'],
  '2º BACH': ['Historia de España', 'Historia de la Filosofía', 'Lengua Castellana y Literatura', 'Inglés']
};

/* Materias que delatan la modalidad. Sirven para comprobar que el nombre del
   fichero dice la verdad. */
const DELATAN_CIENCIAS = ['Física y Química', 'Dibujo Técnico', 'Química', 'Física',
  'Biología, Geología y Ciencias Ambientales', 'Biología', 'Tecnología e Ingeniería'];
const DELATAN_HUMANIDADES = ['Latín', 'Griego', 'Historia del Arte', 'Literatura Universal',
  'Economía', 'Geografía'];

/* La religión va a su propia columna, la misma que en la ESO. */
const RELIGION_BAC = { 'Religión Católica': 'CAT', 'Religión Evangélica': 'EVA' };

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
  const porCurso = {};
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
      if (!porCurso[curso]) porCurso[curso] = [];
      porCurso[curso].push({ archivo: f, modalidad: modalidad, nombre: n });
    }
    if (Object.keys(porCurso).length) break;
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
   diferencia: { nombre, unidad, curso, valores, pend, diver }. */
function leerMatriculaBac_(tabla, cursoPorDefecto, modalidad) {
  const cab = tabla[0].map(function (t) { return String(t).trim(); });
  const cabN = cab.map(normalizar);
  const iNombre = cabN.indexOf(normalizar('Alumno/a'));
  const iUnidad = cabN.indexOf(normalizar('Unidad'));
  const alumnos = [], sinUnidad = [], repetidores = [];

  /* Qué es cada columna: común, religión, pendiente de 1º, o itinerario. */
  const comunes = COMUNES_BAC[cursoPorDefecto] || [];
  const clase = [];
  for (let c = 0; c < cab.length; c++) {
    if (c === iNombre || c === iUnidad) { clase.push(null); continue; }
    const pend = pendienteDeBac_(cab[c]);
    if (pend) { clase.push({ tipo: 'PEND', asig: pend }); continue; }
    if (RELIGION_BAC[cab[c]] !== undefined) {
      clase.push({ tipo: 'REL', codigo: RELIGION_BAC[cab[c]] });
      continue;
    }
    if (comunes.indexOf(cab[c]) !== -1) { clase.push({ tipo: 'COMUN' }); continue; }
    clase.push({ tipo: 'ITIN', asig: cab[c] });
  }

  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const nombre = String(fila[iNombre] || '').trim();
    if (!nombre) continue;
    const unidad = iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim();
    if (!unidad) sinUnidad.push(nombre);
    const curso = cursoDeUnidadBac_(unidad, cursoPorDefecto);

    const itinerario = [], pend = [], religion = [], aprobadas = [];
    for (let c = 0; c < clase.length; c++) {
      const k = clase[c];
      if (!k) continue;
      const valor = String(fila[c] || '').trim().toUpperCase();
      if (!valor) continue;
      if (valor === MARCA_APROBADA) { aprobadas.push(abreviarBac_(k.asig || '')); continue; }
      if (k.tipo === 'PEND' && valor === PEND) { pend.push(abreviarBac_(k.asig) + ' 1º'); continue; }
      if (valor !== MARCA) continue;
      if (k.tipo === 'REL') religion.push(k.codigo);
      else if (k.tipo === 'ITIN') itinerario.push(abreviarBac_(k.asig));
    }

    /* Tener materias APRO quiere decir que repite el curso y solo cursa lo que
       le quedó. Es la única forma de saberlo desde este fichero. */
    const repite = aprobadas.length ? 'SÍ' : '';
    if (aprobadas.length) repetidores.push(nombre + ' (' + unidad + '): ya aprobadas ' + aprobadas.join(', '));

    alumnos.push({
      nombre: nombre, unidad: unidad, curso: curso, diver: false,
      valores: { 'REL/Atedu': religion.join(' / '), 'MODALIDAD': modalidad,
                 'ITINERARIO': itinerario.join(' ') },
      pend: pend, repiteBac: repite
    });
  }
  return { alumnos: alumnos, sinUnidad: sinUnidad, repetidores: repetidores };
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
  const porCurso = {}, avisos = [], resumen = [];
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
    }
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
    'ITINERARIO': v['ITINERARIO'] || '',
    'Diversificación': '',
    'NEAE': ficha ? ficha.neae : (cursosDelCenso[a.curso] ? '' : (man[2] || '')),
    'MEDIDAS Y RECURSOS': ficha ? ficha.medidas : (cursosDelCenso[a.curso] ? '' : (man[3] || '')),
    'Observaciones': man[4] || ''
  };
}
