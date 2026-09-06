/*** ================= CENSO NEAE =================
 *
 * Lee el fichero "RegAluNEE.csv" que se descarga de Séneca (Censo NEAE) y
 * rellena solas las columnas NEAE y MEDIDAS Y RECURSOS de la tabla ALUMNADO.
 *
 * EL PROBLEMA DE ESTE FICHERO: no trae el nombre del alumno, solo sus
 * INICIALES. "Marc Rueda De la Torre" aparece como "MRDT". Tampoco trae el
 * grupo, solo el curso.
 *
 * CÓMO SE RESUELVE, comprobado sobre los 88 alumnos de ESO del curso 26-27:
 *   1. Las iniciales son las del NOMBRE primero y luego las de los APELLIDOS.
 *      Solo cuentan las palabras que empiezan por mayúscula: en
 *      "Rueda De la Torre" la palabra "la" no cuenta.
 *   2. Buscando por iniciales + curso, 81 de los 88 salen sin dudas.
 *   3. Los 7 restantes son parejas del mismo curso con las mismas iniciales.
 *      Se deshace el empate con la fecha de nacimiento, que este fichero trae
 *      y que el histórico RegAlum también trae, en el mismo formato.
 *   4. Lo que aun así no case se anota en AVISOS y no se escribe nada.
 *
 * Nunca se escribe encima de un alumno del que no se esté seguro.
 *
 * ======================================================== ***/

const HOJA_NEAE = 'NEAE';
const PREFIJO_NEAE = 'RegAluNEE';
const TITULOS_NEAE = ['Alumno/a', 'Unidad', 'Curso', 'Iniciales', 'Fecha de nacimiento',
  'NEAE', 'MEDIDAS Y RECURSOS', 'Cómo se ha localizado', 'Texto original de Séneca'];

/* Las cuatro grandes categorías del censo. La sigla es la que se imprime. */
const CATEGORIAS_NEAE = {
  'necesidades educativas especiales': 'NEE',
  'dificultades de aprendizaje': 'DIA',
  'altas capacidades intelectuales': 'AACC',
  'compensacion educativa': 'COM'
};
const ORDEN_CATEGORIAS = ['NEE', 'DIA', 'AACC', 'COM'];
/* Cuántos detalles se escriben por categoría. Los demás se resumen con un
   "+2", para que la columna del informe no se dispare a diez líneas. */
const MAX_DETALLES = 2;

/* El detalle, acortado para que quepa en la columna del informe. */
const DETALLES_NEAE = {
  'dificultades especifica en el aprendizaje de la lectura o dislexia': 'dislexia',
  'dificultades especificas en el aprendizaje de la escritura - disgrafia': 'disgrafía',
  'dificultades especificas en el aprendizaje de la escritura - disortografia': 'disortografía',
  'dificultades especificas en el aprendizaje del calculo o discalculia': 'discalculia',
  'dificultades de aprendizaje por capacidad intelectual limite': 'capacidad límite',
  'dificultades de aprendizaje por retraso en el lenguaje': 'retraso lenguaje',
  'dificultades de aprendizaje derivadas de tdah': 'TDAH',
  'tdah: tipo combinado': 'TDAH combinado',
  'tdah: predomino del deficit de atencion': 'TDAH atención',
  'tdah: predominio del deficit de atencion': 'TDAH atención',
  'tdah: predominio de la impulsividad-hiperactividad': 'TDAH impulsividad',
  'retrasos evolutivos graves o profundos': 'retraso evolutivo',
  'trastornos graves del desarrollo del lenguaje': 'trastorno lenguaje',
  'discapacidad intelectual moderada': 'd. intelectual moderada',
  'discapacidad intelectual leve': 'd. intelectual leve',
  'discapacidad auditiva hipoacusia': 'hipoacusia',
  'baja vision': 'baja visión',
  'lesiones del sistema osteoarticular': 'lesión osteoart.',
  'enfermedades raras y cronicas': 'enf. rara/crónica',
  't.e.l. mixto': 'TEL mixto',
  't.e.l. expresivo': 'TEL expresivo',
  't.e.l. semantico-pragmatico': 'TEL sem-prag',
  'talento complejo': 'talento complejo',
  'talento simple': 'talento simple',
  'sobredotacion intelectual': 'sobredotación'
};

/* Medidas y recursos. tipo M = medida, R = recurso o personal de apoyo.
   En el informe salen así:  ACS, PE, PRA / PT, AL
   La barra separa las medidas del apoyo, y ocupa menos que la raya larga. */
const MEDIDAS_NEAE = {
  'programa especifico (pe).': { sigla: 'PE', tipo: 'M' },
  'programa de refuerzo del aprendizaje para aneae': { sigla: 'PRA', tipo: 'M' },
  'programa de profundizacion para aneae': { sigla: 'PP', tipo: 'M' },
  'adaptacion curricular significativa (acs).': { sigla: 'ACS', tipo: 'M' },
  'adaptacion curricular individualizada (aci)(nee - mod. c/d)': { sigla: 'ACI', tipo: 'M' },
  'adaptacion curricular para alumnado con altas capacidades intelectuales (acai)': { sigla: 'ACAI', tipo: 'M' },
  'adaptacion de acceso (aac)(nee)': { sigla: 'AAC', tipo: 'M' },
  'atencion especifica para alumnado de incorporacion tardia con graves carencias en la comunicacion linguistica (solo com)': { sigla: 'ATE', tipo: 'M' },
  'programa de refuerzo del area de lengua castellana y literatura, en lugar del area segunda lengua extranjera': { sigla: 'RLC', tipo: 'M' },
  'profesorado especialista en pedagogia terapeutica (pt)': { sigla: 'PT', tipo: 'R' },
  'profesorado especialista en audicion y lenguaje (al)': { sigla: 'AL', tipo: 'R' },
  'profesorado de aula temporal de adaptacion linguistica(atal)': { sigla: 'ATAL', tipo: 'R' },
  'profesorado de apoyo a la compensacion educativa': { sigla: 'COMP', tipo: 'R' },
  'profesional tecnico en integracion social_ptis (monitor o monitora de educacion especial)': { sigla: 'PTIS', tipo: 'R' },
  'profesorado del equipo de apoyo a ciegos o discapacitados visuales (once)': { sigla: 'ONCE', tipo: 'R' },
  'interprete de lengua de signos espanola (ilse)': { sigla: 'ILSE', tipo: 'R' },
  'vigilancia': { sigla: 'vigilancia', tipo: 'R' },
  'supervision especializada': { sigla: 'supervisión', tipo: 'R' },
  'asistencia en la higiene y aseo personal': { sigla: 'aseo', tipo: 'R' },
  'asistencia en el control de esfinteres': { sigla: 'aseo', tipo: 'R' },
  'ayuda en la alimentacion': { sigla: 'alimentación', tipo: 'R' },
  'ayuda en el desplazamiento': { sigla: 'desplazamiento', tipo: 'R' },
  'ayudas tecnicas para la comunicacion auditiva': { sigla: 'ayudas auditivas', tipo: 'R' },
  'ayudas opticas, no opticas o electronicas': { sigla: 'ayudas ópticas', tipo: 'R' }
};

/*** ================= QUÉ SIGNIFICA CADA SIGLA =================
 *
 * La leyenda del informe se construye con este diccionario, y solo con las
 * siglas que aparecen de verdad en cada grupo. Así ningún tutor se encuentra
 * una sigla sin explicar, y la leyenda no se llena de cosas que en su grupo
 * no salen.
 *
 * REGLA: si se añade una sigla nueva arriba, hay que añadirla también aquí.
 * Si no, el programa la encuentra en los datos, no sabe qué es, y lo anota
 * en AVISOS INFORMES. Así no se queda callado.
 *
 * Las medidas y recursos que ya se escriben con palabras (vigilancia, aseo,
 * ayudas ópticas...) no necesitan explicación: se entienden solas.
 * ======================================================== ***/
const EXPLICACION_SIGLAS = {
  /* Categorías de la columna NEAE */
  'NEE': 'necesidades educativas especiales',
  'DIA': 'dificultades de aprendizaje',
  'AACC': 'altas capacidades',
  'COM': 'compensación educativa',
  /* Detalles que se escriben en siglas */
  'TDAH': 'déficit de atención e hiperactividad',
  'TEL': 'trastorno del desarrollo del lenguaje',
  /* Medidas */
  'ACS': 'adaptación curricular significativa',
  'ACI': 'adaptación curricular individualizada',
  'ACAI': 'adaptación para altas capacidades',
  'AAC': 'adaptación de acceso',
  'PE': 'programa específico',
  'PRA': 'programa de refuerzo del aprendizaje',
  'PP': 'programa de profundización',
  'ATE': 'atención específica por incorporación tardía',
  'RLC': 'refuerzo de Lengua en lugar de francés',
  /* Recursos y personal de apoyo */
  'PT': 'profesorado de pedagogía terapéutica',
  'AL': 'profesorado de audición y lenguaje',
  'ATAL': 'aula temporal de adaptación lingüística',
  'COMP': 'profesorado de compensación educativa',
  'PTIS': 'monitor de educación especial',
  'ONCE': 'equipo de apoyo a ciegos (ONCE)',
  'ILSE': 'intérprete de lengua de signos'
};

/* Devuelve la explicación de una sigla, o cadena vacía si no la conoce. */
function explicacionDeSigla_(s) {
  const clave = String(s === null || s === undefined ? '' : s).trim().toUpperCase();
  return EXPLICACION_SIGLAS[clave] === undefined ? '' : EXPLICACION_SIGLAS[clave];
}

/*** ================= TEXTO ================= ***/

function sinTildes_(t) {
  return String(t === null || t === undefined ? '' : t)
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* Las iniciales tal como las escribe Séneca: nombre primero, apellidos
   después, y solo las palabras que empiezan por mayúscula.
   "Rueda De la Torre, Marc"  ->  MRDT   */
function inicialesDe_(nombre) {
  const partes = String(nombre || '').split(',');
  const apellidos = partes[0] || '';
  const nombrePila = partes.length > 1 ? partes.slice(1).join(' ') : '';
  const palabras = sinTildes_(nombrePila + ' ' + apellidos).split(/[\s]+/);
  let salida = '';
  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i].replace(/^[^A-Za-z0-9ÑñÇç]+/, '');
    if (!p) continue;
    const c = p.charAt(0);
    if (c >= 'A' && c <= 'Z') salida += c;
    else if (c === 'Ñ' || c === 'Ç') salida += c;
  }
  return salida;
}

/* Fecha en texto, comparable. Vale "05/09/2012" y también una fecha de verdad. */
function fechaClave_(v) {
  if (v instanceof Date) {
    const d = ('0' + v.getDate()).slice(-2);
    const m = ('0' + (v.getMonth() + 1)).slice(-2);
    return d + '/' + m + '/' + v.getFullYear();
  }
  const t = String(v === null || v === undefined ? '' : v).trim();
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) + '/' + m[3];
  return t;
}

/*** ================= LO QUE DICE EL CENSO ================= ***/

/* El campo viene así:
   [Necesidades ... | Dificultades de Aprendizaje | ... | dislexia, Necesidades ... ]
   Se parte por cada "Necesidades específicas de apoyo educativo". */
function trocearNecesidades_(texto) {
  const t = String(texto || '').replace(/^\s*\[/, '').replace(/\]\s*$/, '');
  if (!t.trim()) return [];
  const trozos = t.split(/,\s*(?=Necesidades\s+espec)/);
  const rutas = [];
  for (let i = 0; i < trozos.length; i++) {
    const partes = trozos[i].split('|');
    const limpio = [];
    for (let p = 0; p < partes.length; p++) {
      const x = partes[p].trim();
      if (x) limpio.push(x);
    }
    if (limpio.length > 1) rutas.push(limpio);
  }
  return rutas;
}

/* "DIA dislexia, disgrafía · NEE TDAH combinado" */
function resumirNecesidades_(texto, sinDiccionario) {
  const rutas = trocearNecesidades_(texto);
  const porCategoria = {};
  for (let i = 0; i < rutas.length; i++) {
    const ruta = rutas[i];
    const sigla = CATEGORIAS_NEAE[normalizar(ruta[1])];
    if (!sigla) {
      if (sinDiccionario) sinDiccionario.push('Categoría NEAE desconocida: ' + ruta[1]);
      continue;
    }
    if (!porCategoria[sigla]) porCategoria[sigla] = [];
    if (ruta.length < 3) continue;                    // Compensación Educativa no tiene detalle
    const ultimo = ruta[ruta.length - 1];
    let corto = DETALLES_NEAE[normalizar(ultimo)];
    if (corto === undefined) {
      corto = ultimo;
      if (sinDiccionario) sinDiccionario.push('Detalle NEAE sin abreviar: ' + ultimo);
    }
    if (porCategoria[sigla].indexOf(corto) === -1) porCategoria[sigla].push(corto);
  }
  const bloques = [];
  for (let i = 0; i < ORDEN_CATEGORIAS.length; i++) {
    const s = ORDEN_CATEGORIAS[i];
    if (!porCategoria[s]) continue;
    const lista = porCategoria[s];
    if (!lista.length) { bloques.push(s); continue; }
    const sobran = lista.length - MAX_DETALLES;
    bloques.push(s + ' ' + lista.slice(0, MAX_DETALLES).join(', ') + (sobran > 0 ? ' +' + sobran : ''));
  }
  return bloques.join(' · ');
}

/* "ACS, PE, PRA / PT, AL" */
function resumirMedidas_(texto, sinDiccionario) {
  const t = String(texto || '');
  const trozos = t.split('<li>');
  const medidas = [], recursos = [];
  for (let i = 1; i < trozos.length; i++) {
    let x = trozos[i].split('<')[0].trim().replace(/,\s*$/, '').trim();
    if (!x) continue;
    const d = MEDIDAS_NEAE[normalizar(x)];
    if (!d) {
      if (sinDiccionario) sinDiccionario.push('Medida o recurso sin abreviar: ' + x);
      continue;
    }
    const lista = d.tipo === 'M' ? medidas : recursos;
    if (lista.indexOf(d.sigla) === -1) lista.push(d.sigla);
  }
  if (!medidas.length && !recursos.length) return '';
  if (!recursos.length) return medidas.join(', ');
  if (!medidas.length) return recursos.join(', ');
  return medidas.join(', ') + ' / ' + recursos.join(', ');
}

/*** ================= LECTURA DEL FICHERO ================= ***/

function leerCensoNeae_() {
  const archivo = buscarCsv(PREFIJO_NEAE);
  if (!archivo) return { registros: [], nombre: '', avisos: [] };

  const tabla = textoATabla(textoDeArchivo(archivo));
  if (!tabla.length) return { registros: [], nombre: archivo.getName(), avisos: [] };

  const cab = tabla[0].map(normalizar);
  const iNom = cab.indexOf(normalizar('Alumno/a'));
  const iFec = cab.indexOf(normalizar('Fecha de nacimiento'));
  const iCur = cab.indexOf(normalizar('Curso'));
  const iNec = cab.indexOf(normalizar('Necesidades específicas de apoyo educativo'));
  let iMed = cab.indexOf(normalizar('Medidas Específicas y Recursos Recibidos'));
  if (iMed === -1) iMed = cab.indexOf(normalizar('Medidas Específicas y Recursos Necesitados'));
  if (iNom === -1 || iCur === -1 || iNec === -1) {
    return { registros: [], nombre: archivo.getName(),
             avisos: ['Al censo NEAE le faltan columnas. No se ha usado.'] };
  }

  const registros = [], sinDiccionario = [];
  for (let f = 1; f < tabla.length; f++) {
    const fila = tabla[f];
    const nivel = nivelESO(fila[iCur]);
    if (!nivel) continue;                       // Bachillerato y educación especial: no van aquí
    const iniciales = sinTildes_(String(fila[iNom] || '').trim()).toUpperCase();
    if (!iniciales) continue;
    registros.push({
      iniciales: iniciales,
      fecha: iFec === -1 ? '' : fechaClave_(fila[iFec]),
      curso: nivel,
      neae: resumirNecesidades_(fila[iNec], sinDiccionario),
      medidas: iMed === -1 ? '' : resumirMedidas_(fila[iMed], sinDiccionario),
      original: String(fila[iNec] || '').replace(/\s+/g, ' ').substring(0, 400)
    });
  }

  const avisos = [], vistos = {};
  for (let i = 0; i < sinDiccionario.length; i++) {
    if (vistos[sinDiccionario[i]]) continue;
    vistos[sinDiccionario[i]] = true;
    avisos.push(sinDiccionario[i]);
  }
  return { registros: registros, nombre: archivo.getName(), avisos: avisos };
}

/*** ================= EL CRUCE ================= ***/

/* historial: las filas de la pestaña HISTORIAL.
   Devuelve un mapa por nombre normalizado con lo que hay que escribir. */
function cruzarNeae_(registros, historial, iNombre, iCurso, iFecha) {
  const porClave = {};                       // iniciales + curso -> lista de alumnos
  for (let f = 0; f < historial.length; f++) {
    const nombre = String(historial[f][iNombre] || '').trim();
    if (!nombre) continue;
    const curso = String(historial[f][iCurso] || '').trim();
    const clave = inicialesDe_(nombre) + '|' + curso;
    if (!porClave[clave]) porClave[clave] = [];
    porClave[clave].push({
      nombre: nombre,
      fecha: iFecha === -1 ? '' : fechaClave_(historial[f][iFecha])
    });
  }

  const salida = {}, avisos = [];
  let porIniciales = 0, porFecha = 0;
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];
    const candidatos = porClave[r.iniciales + '|' + r.curso] || [];
    let elegido = null, como = '';
    if (candidatos.length === 1) {
      elegido = candidatos[0];
      como = 'iniciales + curso';
      porIniciales++;
    } else if (candidatos.length > 1) {
      const conFecha = [];
      for (let c = 0; c < candidatos.length; c++) {
        if (r.fecha && candidatos[c].fecha === r.fecha) conFecha.push(candidatos[c]);
      }
      if (conFecha.length === 1) {
        elegido = conFecha[0];
        como = 'iniciales + curso + fecha de nacimiento';
        porFecha++;
      } else {
        const nombres = [];
        for (let c = 0; c < candidatos.length; c++) nombres.push(candidatos[c].nombre);
        avisos.push({ curso: r.curso, grupo: '', alumno: '',
          aviso: 'Censo NEAE: no sé de quién es esta ficha',
          detalle: 'Iniciales "' + r.iniciales + '" de ' + r.curso + ', nacido el ' +
                   (r.fecha || 'sin fecha') + '. Podría ser: ' + nombres.join(' / ') +
                   '. No he escrito nada.' });
      }
    } else {
      avisos.push({ curso: r.curso, grupo: '', alumno: '',
        aviso: 'Censo NEAE: ficha sin alumno en el centro',
        detalle: 'Iniciales "' + r.iniciales + '" de ' + r.curso +
                 '. No hay nadie con esas iniciales en ese curso. Puede que ya no esté matriculado.' });
    }
    if (!elegido) continue;
    const clave = normalizar(elegido.nombre);
    if (salida[clave]) {
      avisos.push({ curso: r.curso, grupo: '', alumno: elegido.nombre,
        aviso: 'Censo NEAE: dos fichas para el mismo alumno',
        detalle: 'Se ha quedado con la primera.' });
      continue;
    }
    salida[clave] = { neae: r.neae, medidas: r.medidas, como: como,
                      iniciales: r.iniciales, fecha: r.fecha, original: r.original,
                      nombre: elegido.nombre, curso: r.curso };
  }
  return { porNombre: salida, avisos: avisos, porIniciales: porIniciales, porFecha: porFecha };
}

/*** ================= LA PESTAÑA NEAE ================= ***/

function escribirNeae_(porNombre, unidades, nombreFichero) {
  const ancho = TITULOS_NEAE.length;
  const hoja = hojaLimpia(HOJA_NEAE, ancho);
  hoja.getRange(1, 1).setValue('Censo NEAE de Séneca. Origen: ' + (nombreFichero || 'no encontrado') +
    '. El fichero no trae el nombre del alumno, solo sus iniciales: aquí se ve a quién se ha' +
    ' asignado cada ficha. Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_NEAE]).setFontWeight('bold')
      .setBackground('#D9D9D9').setWrap(true).setVerticalAlignment('middle');

  const filas = [];
  for (const clave in porNombre) {
    const d = porNombre[clave];
    filas.push([d.nombre, unidades[clave] || '', d.curso, d.iniciales, d.fecha,
                d.neae, d.medidas, d.como, d.original]);
  }
  filas.sort(function (a, b) {
    const ka = a[1] + ' ' + normalizar(a[0]), kb = b[1] + ' ' + normalizar(b[0]);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  if (filas.length) hoja.getRange(3, 1, filas.length, ancho).setValues(filas);
  hoja.setFrozenRows(2);
  for (let c = 1; c <= ancho; c++) hoja.autoResizeColumn(c);
  hoja.setColumnWidth(ancho, 320);
  if (filas.length) hoja.getRange(3, ancho, filas.length, 1).setWrap(true);
  return filas.length;
}

/*** ================= LO QUE LLAMA Codigo.gs ================= ***/

/* Devuelve { porNombre, avisos, resumen }. Si no encuentra el fichero,
   devuelve un mapa vacío y un aviso: las columnas se quedan como estaban. */
function datosNeae_(historial, iNombre, iCurso, iFecha) {
  const censo = leerCensoNeae_();
  const avisos = [];
  for (let i = 0; i < censo.avisos.length; i++) {
    avisos.push({ curso: '', grupo: '', alumno: '', aviso: 'Censo NEAE', detalle: censo.avisos[i] });
  }
  if (!censo.registros.length) {
    avisos.push({ curso: '', grupo: '', alumno: '', aviso: 'No encuentro el censo NEAE',
      detalle: 'Debe haber un fichero que empiece por "' + PREFIJO_NEAE + '" en la carpeta de datos. ' +
               'Sin él, las columnas NEAE y MEDIDAS Y RECURSOS se quedan como estaban.' });
    return { porNombre: {}, avisos: avisos, nombre: censo.nombre, resumen: '', total: 0 };
  }
  /* Sin fecha de nacimiento en el histórico no se pueden deshacer los empates
     entre alumnos del mismo curso con las mismas iniciales. Pasa cuando la
     pestaña HISTORIAL se hizo con una versión anterior del programa. */
  let hayFechas = false;
  if (iFecha !== -1) {
    for (let f = 0; f < historial.length; f++) {
      if (String(historial[f][iFecha] || '').trim()) { hayFechas = true; break; }
    }
  }
  if (!hayFechas) {
    avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'El histórico no tiene fechas de nacimiento',
      detalle: 'Vuelve a pulsar "1. Leer el histórico de matrículas". Sin las fechas, ' +
               'los alumnos del mismo curso con las mismas iniciales se quedan sin NEAE.' });
  }

  const R = cruzarNeae_(censo.registros, historial, iNombre, iCurso, iFecha);
  for (let i = 0; i < R.avisos.length; i++) avisos.push(R.avisos[i]);
  const total = R.porIniciales + R.porFecha;
  return {
    porNombre: R.porNombre,
    avisos: avisos,
    nombre: censo.nombre,
    total: total,
    resumen: 'Censo NEAE: ' + censo.registros.length + ' fichas de ESO, ' + total +
             ' asignadas (' + R.porFecha + ' por fecha de nacimiento).'
  };
}
