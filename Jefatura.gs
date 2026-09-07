/*** ================= FICHERO DE JEFATURA (AGRUPAMIENTOS) =================
 *
 * Tercera fuente del sistema, además de Séneca y las notas.
 *
 * Jefatura de Estudios prepara cada curso un cuaderno donde coloca a cada
 * alumno en el grupo que ellos quieren. Ese cuaderno lleva información que
 * Séneca todavía no tiene: quién va a diversificación, de qué grupo viene
 * cada alumno, quién es NEAE, etc.
 *
 * Este fichero hace dos cosas:
 *   1. Lee ese cuaderno y lo vuelca en la pestaña JEFATURA.
 *   2. Lo compara con lo que dice Séneca y escribe la pestaña DISCREPANCIAS.
 *
 * El cuaderno se localiza POR SU NOMBRE: tiene que ser un cuaderno de
 * Google Sheets cuyo nombre contenga la palabra AGRUPAMIENTOS.
 *
 * ======================================================================== ***/

const HOJA_JEFATURA   = 'JEFATURA';
const HOJA_DISCREP    = 'DISCREPANCIAS';
const NOMBRE_JEFATURA = 'agrupamientos';

const TITULOS_JEFATURA = ['Alumno/a', 'Unidad', 'Curso', 'Grupo de origen', 'REL/Atedu', 'OPT',
  'OPT 2 (DIV)', 'MAT', 'OPC1', 'OPC2', 'OPC3', 'OPC4', 'FR -> ALCT',
  'Repite', 'PIL', 'Conflictivo', 'NEAE', 'Diversificación'];

/* Los códigos de Jefatura no son los mismos que los nuestros. */
const TRAD_JEFATURA = {
  'REL': 'CAT', 'REV': 'EVA', 'ATEDU': 'ATEDU',
  'CYR': 'CyR', 'OYD': 'OyD', 'MTGE': 'MTGE', 'FR2': 'FR', 'FRA2': 'FR',
  'PEPA': 'PEPA', 'LFQ': 'LAB', 'MUS': 'MUS', 'CC': 'CC',
  'MATA': 'MatA', 'MATB': 'MatB',
  'ECE': 'ECO', 'TEC': 'TEC', 'BYG': 'BYG',
  'FOP': 'FOPP', 'FYQ': 'FQ', 'LAT': 'LAT',
  'DIG': 'DIG', 'EAR': 'EA',
  'NSD': 'NSD', 'PB': 'PB', 'DBT': 'DT', 'ASE': 'ASE',
  'ALCT': 'ALCT'
};

/* Texto suelto que Jefatura escribe en cualquier celda de la fila. */
const MARCAS_JEFATURA = { 'REP': 'repite', 'PIL': 'pil', 'CONF': 'conflictivo',
                          'NEAE': 'neae', 'ALCT': 'alct' };

/*** ================= LÓGICA PURA ================= ***/

/* Quita tildes y pasa a mayúsculas. Para comparar códigos, no nombres. */
function codigoJef_(v) {
  return String(v === null || v === undefined ? '' : v)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase();
}

function traducirJef_(v) {
  const c = codigoJef_(v);
  if (!c) return '';
  return TRAD_JEFATURA[c] === undefined ? c : TRAD_JEFATURA[c];
}

/* Compara códigos sin que importe el orden ni los espacios: "CYR / MUS" y
   "MUS / CYR" son lo mismo. Hace falta para los alumnos de diversificación de
   3º, que llevan dos optativas en la misma casilla. */
function juegoJef_(v) {
  return codigoJef_(v).split('/').map(function (x) { return x.trim(); })
    .filter(function (x) { return x; }).sort().join(' / ');
}

/* ¿Es esto el rótulo de un grupo de ESO? Devuelve "1º ESO A" o ''.
   Vale tanto para el nombre de la pestaña ("1ºESO A") como para la celda A1. */
function grupoDeTexto_(v) {
  const t = String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim();
  const m = t.match(/^([1-4])\s*º\s*ESO\s+([A-Z])$/i);
  return m ? m[1] + 'º ESO ' + m[2].toUpperCase() : '';
}

/* Coloca cada título de la fila 1 en el hueco que le toca. */
function huecosJefatura_(titulos, nivel) {
  const h = {};
  for (let c = 0; c < titulos.length; c++) {
    const t = normalizar(titulos[c]);
    if (!t) continue;
    if (t === 'origen' || t === 'centro de procedencia') h.origen = c;
    else if (t.indexOf('rel/') === 0) h.rel = c;
    /* La segunda optativa de los alumnos de diversificación de 3º. Jefatura la
       titula "2º OPT DIV" en 3º ESO A y "OPT 2 DIV" en 3º ESO B, así que se
       reconoce porque el título lleva las palabras OPT y DIV, vaya donde vaya. */
    else if (t.indexOf('opt') !== -1 && t.indexOf('div') !== -1) h.optdiv = c;
    else if (t === 'mat a/b') h.mat = c;
    else if (nivel === '4º' && t === 'opt1') h.opc2 = c;
    else if (nivel === '4º' && t === 'opt2') h.opc1 = c;
    else if (nivel === '4º' && t === 'opt3') h.opc3 = c;
    else if (nivel === '4º' && t === 'opt and') h.opc4 = c;
    else if (t === 'opt' || t === 'opt.' || t === 'opt 1' || t === 'opt1') h.opt = c;
    else if (t.indexOf('exento') === 0) h.alct = c;
    else if (t === 'neae' || t === 'neae/c') h.neae = c;
  }
  return h;
}

/* Convierte una pestaña de grupo en filas de alumno.
   'grupo' viene del nombre de la pestaña.
   'valores' incluye la fila 1 (títulos) y todo lo que hay debajo. */
function leerPestanaJefatura_(grupo, valores) {
  if (!grupo || !valores || !valores.length) return [];
  const nivel = grupo.substring(0, 2);
  const titulos = valores[0];
  const h = huecosJefatura_(titulos, nivel);
  const alumnos = [];

  for (let f = 1; f < valores.length; f++) {
    const fila = valores[f];
    const nombre = String(fila[1] === null || fila[1] === undefined ? '' : fila[1]).trim();
    if (!nombre || nombre.indexOf(',') === -1) continue;

    const marcas = {};
    let div = false;
    for (let c = 0; c < fila.length; c++) {
      const v = codigoJef_(fila[c]);
      if (!v) continue;
      if (v === 'DIV' || v.indexOf('DIVER') === 0) div = true;
      if (MARCAS_JEFATURA[v]) marcas[MARCAS_JEFATURA[v]] = true;
    }
    const dame = function (k) { return h[k] === undefined ? '' : traducirJef_(fila[h[k]]); };

    alumnos.push({
      nombre: nombre,
      unidad: grupo,
      curso: nivel,
      origen: h.origen === undefined ? '' : String(fila[h.origen] || '').trim(),
      rel: dame('rel'),
      /* Los alumnos de diversificación de 3º cursan dos optativas: la suya y
         Música, que Jefatura pone en esa columna aparte. En Séneca las dos salen
         en la misma casilla, separadas por una barra, así que aquí se juntan
         igual para que se puedan comparar. */
      opt: [dame('opt'), dame('optdiv')].filter(function (x) { return x; }).join(' / '),
      optdiv: dame('optdiv'),
      mat: dame('mat'),
      opc1: dame('opc1'),
      opc2: dame('opc2'),
      opc3: dame('opc3'),
      opc4: dame('opc4'),
      /* En 1º la columna FR -> ALCT de ALUMNADO ya no se queda vacía: pone FR
         o ALCT. Aquí se hace lo mismo para poder compararlas: en 1º, quien no
         está marcado como exento es que cursa francés. */
      alct: marcas.alct ? 'ALCT' : (nivel === '1º' ? 'FR' : ''),
      repite: marcas.repite ? 'SÍ' : '',
      pil: marcas.pil ? 'SÍ' : '',
      conf: marcas.conflictivo ? 'SÍ' : '',
      neae: marcas.neae ? 'NEAE' : '',
      div: div ? 'SÍ' : ''
    });
  }
  return alumnos;
}

function filaJefatura_(a) {
  return [a.nombre, a.unidad, a.curso, a.origen, a.rel, a.opt, a.optdiv, a.mat,
          a.opc1, a.opc2, a.opc3, a.opc4, a.alct, a.repite, a.pil, a.conf, a.neae, a.div];
}

/* Qué columnas de ALUMNADO se comparan con qué campo de Jefatura, por nivel. */
function comparablesJefatura_(nivel, esDiver) {
  const lista = [{ col: 'REL/Atedu', campo: 'rel', nombre: 'Religión / At. educativa' }];
  if (nivel === '4º') {
    if (!esDiver) {
      lista.push({ col: 'MAT', campo: 'mat', nombre: 'Matemáticas A/B' });
      lista.push({ col: 'OPC1', campo: 'opc1', nombre: 'Opción 1' });
      lista.push({ col: 'OPC2', campo: 'opc2', nombre: 'Opción 2' });
    }
    lista.push({ col: 'OPC3', campo: 'opc3', nombre: 'Opción 3' });
    lista.push({ col: 'OPC4', campo: 'opc4', nombre: 'Opción 4' });
  } else {
    lista.push({ col: 'OPT', campo: 'opt', nombre: 'Optativa' });
    if (nivel === '1º') lista.push({ col: 'FR -> ALCT', campo: 'alct', nombre: 'Exención de francés' });
  }
  return lista;
}

/* Compara la tabla ALUMNADO (Séneca) con lo que quiere Jefatura.
   Devuelve una lista de discrepancias, cada una con su clave estable. */
function compararJefatura_(filasAlum, idxAlum, alumnosJef) {
  const dame = function (fila, titulo) {
    const i = idxAlum[normalizar(titulo)];
    if (i === undefined) return '';
    const v = fila[i];
    return v === null || v === undefined ? '' : String(v).trim();
  };
  /* Los cruces van por nombre Y curso, porque dos alumnos distintos pueden
     llamarse igual. Se guarda además un índice por nombre suelto, que solo sirve
     para distinguir "no está" de "está, pero en otro curso". */
  const sen = {}, senPorNombre = {};
  for (let f = 0; f < filasAlum.length; f++) {
    const n = normalizar(dame(filasAlum[f], 'Alumno/a'));
    if (!n) continue;
    sen[n + '|' + dame(filasAlum[f], 'Curso')] = filasAlum[f];
    if (!senPorNombre[n]) senPorNombre[n] = [];
    senPorNombre[n].push(filasAlum[f]);
  }
  const jef = {};
  for (let i = 0; i < alumnosJef.length; i++) {
    jef[normalizar(alumnosJef[i].nombre) + '|' + alumnosJef[i].curso] = alumnosJef[i];
  }
  /* Nombres de los que ya se ha avisado como "Curso distinto", para no decir
     después que ese alumno no aparece en el fichero de Jefatura. */
  const yaAvisados = {};

  const salida = [];
  const mete = function (curso, grupo, alumno, tipo, enSeneca, enJefatura) {
    salida.push({ curso: curso, grupo: grupo, alumno: alumno, tipo: tipo,
                  seneca: enSeneca, jefatura: enJefatura });
  };

  for (let i = 0; i < alumnosJef.length; i++) {
    const j = alumnosJef[i];
    const s = sen[normalizar(j.nombre) + '|' + j.curso];
    if (!s) {
      /* En su curso no está. Si en Séneca hay alguien con ese nombre en otro
         curso, o ha cambiado de curso, o son dos personas distintas que se
         llaman igual. Las dos cosas hay que mirarlas a mano. */
      const otros = senPorNombre[normalizar(j.nombre)];
      if (otros && otros.length) {
        const donde = otros.map(function (o) { return dame(o, 'Unidad') || '(sin unidad)'; }).join(' y ');
        mete(j.curso, j.unidad, j.nombre, 'Curso distinto (¿dos alumnos con el mismo nombre?)',
             donde, j.unidad);
        yaAvisados[normalizar(j.nombre)] = true;
      } else {
        mete(j.curso, j.unidad, j.nombre, 'No está en Séneca', '(no aparece)', j.unidad);
      }
      continue;
    }
    const uniSen = dame(s, 'Unidad');
    if (normalizar(uniSen) !== normalizar(j.unidad)) {
      mete(j.curso, j.unidad, j.nombre, 'Grupo distinto', uniSen, j.unidad);
    }
    /* La columna Diversificación de ALUMNADO ya reúne las dos maneras que tiene
       Séneca de decirlo: en 4º, matricular al alumno en Matemáticas = ÁMB; en
       1º, 2º y 3º, matricularlo en los dos Ámbitos. Vale 'SÍ' solo cuando lo
       confirma Séneca, y 'SÍ (solo Jefatura)' cuando Séneca todavía no. */
    const divSen = dame(s, 'Diversificación') === 'SÍ' ? 'SÍ' : '';
    if (j.div === 'SÍ' && divSen !== 'SÍ') {
      mete(j.curso, j.unidad, j.nombre, 'Diversificación no cargada en Séneca', 'NO', 'SÍ');
    } else if (j.div !== 'SÍ' && divSen === 'SÍ') {
      mete(j.curso, j.unidad, j.nombre, 'Diversificación solo en Séneca', 'SÍ', 'NO');
    }
    const comps = comparablesJefatura_(j.curso, j.div === 'SÍ');
    for (let k = 0; k < comps.length; k++) {
      const c = comps[k];
      const vs = dame(s, c.col), vj = j[c.campo] || '';
      if (juegoJef_(vs) !== juegoJef_(vj)) {
        mete(j.curso, j.unidad, j.nombre, c.nombre + ': no coincide', vs || '(vacío)', vj || '(vacío)');
      }
    }
  }

  for (let f = 0; f < filasAlum.length; f++) {
    const nombre = dame(filasAlum[f], 'Alumno/a');
    if (!nombre) continue;
    if (jef[normalizar(nombre) + '|' + dame(filasAlum[f], 'Curso')]) continue;
    /* Si de este alumno ya se ha avisado arriba como "Curso distinto", no hace
       falta decir además que no aparece. Ojo: se mira si SE AVISÓ, no si el
       nombre existe en Jefatura; si no, a un homónimo que de verdad falta en el
       fichero de Jefatura se le silenciaría el aviso. */
    if (yaAvisados[normalizar(nombre)]) continue;
    mete(dame(filasAlum[f], 'Curso'), dame(filasAlum[f], 'Unidad'), nombre,
         'No está en el fichero de Jefatura', dame(filasAlum[f], 'Unidad'), '(no aparece)');
  }

  /* Ordenadas por curso y por alumno, para que todo lo que no cuadra de una
     misma persona salga junto y se pueda arreglar de una sentada en Séneca. */
  salida.sort(function (a, b) {
    const ka = a.curso + '|' + normalizar(a.alumno) + '|' + a.tipo;
    const kb = b.curso + '|' + normalizar(b.alumno) + '|' + b.tipo;
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });
  return salida;
}

/*** ================= ACCESO A DRIVE ================= ***/

/* Busca el cuaderno de Jefatura por su nombre. Devuelve {libro, nombre} o
   {aviso: '...'} si no lo encuentra o si está sin convertir. */
function buscarLibroJefatura_() {
  const carpetas = carpetasDondeBuscar();
  let sinConvertir = '';
  for (let c = 0; c < carpetas.length; c++) {
    const it = carpetas[c].getFiles();
    while (it.hasNext()) {
      const f = it.next();
      if (normalizar(f.getName()).indexOf(NOMBRE_JEFATURA) === -1) continue;
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
        return { libro: SpreadsheetApp.openById(f.getId()), nombre: f.getName() };
      }
      sinConvertir = f.getName();
    }
  }
  if (sinConvertir) {
    return { aviso: 'He encontrado "' + sinConvertir + '", pero es un Excel sin convertir. ' +
      'Ábrelo en Drive y usa Archivo > Guardar como Hojas de cálculo de Google.' };
  }
  return { aviso: 'No he encontrado ningún cuaderno cuyo nombre contenga "AGRUPAMIENTOS".' };
}

/* Lee el cuaderno entero. Devuelve {alumnos, nombre, avisos}. */
function leerJefatura_() {
  const r = buscarLibroJefatura_();
  if (!r.libro) return { alumnos: [], nombre: '', avisos: [r.aviso] };

  const alumnos = [], avisos = [], vistos = {};
  const hojas = r.libro.getSheets();
  let grupos = 0;
  for (let h = 0; h < hojas.length; h++) {
    const hoja = hojas[h];

    /* El grupo lo manda el NOMBRE de la pestaña. Es importante: el cuaderno
       tiene además pestañas de resumen ("TODO 1º", "1º ESO CON OPT.") que
       llevan el mismo rótulo en A1 y repetirían a todos los alumnos. */
    const grupo = grupoDeTexto_(hoja.getName());
    if (!grupo) continue;
    if (hoja.getLastRow() < 2 || hoja.getLastColumn() < 2) continue;
    const enA1 = grupoDeTexto_(hoja.getRange(1, 1).getValue());
    if (enA1 && enA1 !== grupo) {
      avisos.push({ curso: grupo.substring(0, 2), grupo: grupo, alumno: '',
        aviso: 'Pestaña de Jefatura con dos nombres distintos',
        detalle: 'La pestaña se llama "' + hoja.getName() + '" pero en A1 pone "' + enA1 + '". No la he leído.' });
      continue;
    }
    grupos++;
    const ancho = Math.min(hoja.getLastColumn(), 40);
    const leidos = leerPestanaJefatura_(grupo, hoja.getRange(1, 1, hoja.getLastRow(), ancho).getValues());
    for (let i = 0; i < leidos.length; i++) {
      /* Nombre y curso, como todos los cruces del sistema: dos alumnos
         distintos pueden llamarse igual y no se pueden descartar uno a otro. */
      const clave = normalizar(leidos[i].nombre) + '|' + leidos[i].curso;
      if (vistos[clave]) {
        avisos.push({ curso: leidos[i].curso, grupo: leidos[i].unidad, alumno: leidos[i].nombre,
          aviso: 'Repetido en el fichero de Jefatura',
          detalle: 'Aparece en ' + vistos[clave] + ' y también en ' + leidos[i].unidad });
        continue;
      }
      vistos[clave] = leidos[i].unidad;
      alumnos.push(leidos[i]);
    }
  }
  if (!grupos) {
    avisos.push({ curso: '', grupo: '', alumno: '', aviso: 'El cuaderno de Jefatura no tiene grupos',
      detalle: 'Ninguna pestaña de "' + r.nombre + '" se llama como un grupo, tipo "3º ESO B".' });
  }
  return { alumnos: alumnos, nombre: r.nombre, avisos: avisos };
}

/*** ================= ESCRITURA ================= ***/
function escribirJefatura_(alumnos, nombreFichero) {
  const ancho = TITULOS_JEFATURA.length;
  const hoja = hojaLimpia(HOJA_JEFATURA, ancho);
  hoja.getRange(1, 1).setValue('Lo que quiere Jefatura de Estudios. Origen: ' +
    (nombreFichero || '(no encontrado)') + '. Los códigos están traducidos a los nuestros. ' +
    'Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_JEFATURA]).setFontWeight('bold')
      .setBackground('#E2EFDA').setWrap(true).setVerticalAlignment('middle');
  const filas = alumnos.map(filaJefatura_);
  if (filas.length) {
    hoja.getRange(3, 1, filas.length, ancho).setValues(filas);
    hoja.getRange(2, 1, filas.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
    hoja.getRange(3, 3, filas.length, ancho - 2).setHorizontalAlignment('center');
  }
  hoja.setFrozenRows(2);
  hoja.setFrozenColumns(2);
  for (let c = 1; c <= ancho; c++) hoja.autoResizeColumn(c);
  if (filas.length) hoja.getRange(2, 1, filas.length + 1, ancho).createFilter();
}

/* Lee lo que Francisco haya escrito en Estado y Observaciones, para no perderlo. */
function manualesDiscrepancias_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_DISCREP);
  const previos = {};
  if (!hoja || hoja.getLastRow() < 3) return previos;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, 8).getValues();
  for (let f = 0; f < datos.length; f++) {
    /* Curso, alumno y tipo. El curso hace falta porque dos alumnos distintos
       pueden llamarse igual, y sus anotaciones no se pueden mezclar. */
    const clave = normalizar(datos[f][0]) + '|' + normalizar(datos[f][2]) + '|' + normalizar(datos[f][3]);
    if (normalizar(datos[f][2]) || normalizar(datos[f][3])) previos[clave] = [datos[f][6], datos[f][7]];
  }
  return previos;
}

function escribirDiscrepancias_(lista, nombreFichero) {
  const titulos = ['Curso', 'Grupo', 'Alumno/a', 'Qué no cuadra', 'Séneca dice',
                   'Jefatura quiere', 'Estado', 'Observaciones'];
  const previos = manualesDiscrepancias_();
  const hoja = hojaLimpia(HOJA_DISCREP, titulos.length);
  hoja.getRange(1, 1).setValue('Diferencias entre Séneca y el fichero de Jefatura (' +
    (nombreFichero || 'sin fichero') + '). Las dos últimas columnas las rellenas tú y no se pierden. ' +
    'Actualizado: ' + new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold')
      .setBackground('#FCE4D6');
  const filas = lista.map(function (d) {
    const man = previos[normalizar(d.curso) + '|' + normalizar(d.alumno) + '|' + normalizar(d.tipo)] || ['', ''];
    return [d.curso, d.grupo, d.alumno, d.tipo, d.seneca, d.jefatura, man[0], man[1]];
  });
  if (filas.length) {
    hoja.getRange(3, 1, filas.length, titulos.length).setValues(filas);
    hoja.getRange(3, 7, filas.length, 2).setBackground('#FFF2CC');
    hoja.getRange(2, 1, filas.length + 1, titulos.length)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
  }
  hoja.setFrozenRows(2);
  for (let c = 1; c <= titulos.length; c++) hoja.autoResizeColumn(c);
  if (filas.length) hoja.getRange(2, 1, filas.length + 1, titulos.length).createFilter();
  return filas.length;
}
