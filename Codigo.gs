/*** ================= CONFIGURACIÓN ================= ***/
const VERSION = 'BD v10';
const CARPETA_ID = '1twbbpoPRKP9qRprASME42K6kIeZMwXFN';
const ID_PROPUESTA = '1-1M5u2GgbBCpl09KYSGkAZjeGZveap_IbrtGerwEEdQ';
const CURSO_ACTUAL = '26-27';
const MARCA = 'MATR';
const PEND = 'PEND';
const HOJA_ALUMNADO = 'ALUMNADO';
const HOJA_HISTORIAL = 'HISTORIAL';
const HOJA_AVISOS = 'AVISOS';
const EDAD_TEORICA = { '1º': 12, '2º': 13, '3º': 14, '4º': 15 };
const ESTADOS_QUE_NO_CUENTAN = ['anulada', 'trasladada'];
const COL_AMBITOS = 'Ámbito Científico-Tecnológico';

const REGLAS = {
  '1º': [
    { titulo: 'OPT', codigos: { 'Oratoria y Debate': 'OyD', 'Computación y Robótica': 'CyR',
        'Music, theatre and games for English': 'MTGE' } },
    { titulo: 'FR -> ALCT', codigos: { 'Área Lingüística de carácter transversal': 'ALCT' } },
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

const TITULOS_ALUMNADO = ['Alumno/a', 'Unidad', 'Curso', 'Repite el curso actual', 'Diversificación',
  'OPT', 'FR -> ALCT', 'MAT', 'OPC1', 'OPC2', 'OPC3', 'OPC4', 'REL/Atedu', 'Nº pendientes',
  'Asignaturas pendientes', 'Edad a 31/12', 'MAT NO SUP.', 'Repeticiones en ESO',
  'Rep. Primaria (calculado)', 'Fuente Primaria', 'Rep. Primaria (corregido)',
  'Motivo de la corrección', 'Repeticiones totales', 'PIL', 'NEAE', 'Observaciones'];
const COLS_MANUALES_ALUMNADO = ['Rep. Primaria (corregido)', 'Motivo de la corrección', 'NEAE', 'Observaciones'];
const TITULOS_HISTORIAL = ['Alumno/a', 'Nº Id. Escolar', 'Unidad', 'Curso', 'Edad a 31/12',
  'Repite el curso actual', 'Repeticiones en ESO', 'Rep. Primaria (calculado)', 'Fuente Primaria'];

/*** El menú lo crea Actualizador.gs, no este fichero. ***/

/*** ================= AUXILIARES DE TEXTO ================= ***/
function normalizar(v) {
  return String(v === null || v === undefined ? '' : v)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim().toLowerCase();
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
    filas.push([String(fila[iNombre]).trim(), id, iUnidad === -1 ? '' : String(fila[iUnidad] || '').trim(),
                niv, isNaN(edad) ? '' : edad, repite, repESO, repPrim, fuente]);
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

/*** ================= LÓGICA: COMPOSICIÓN ================= ***/
function componerAlumnado(alumnosPorCurso, historial, notasPorCurso, manuales, jefatura) {
  const hist = {};
  for (let i = 0; i < historial.length; i++) {
    hist[normalizar(historial[i][0])] = historial[i];
  }
  const jef = jefatura || {};
  const filas = [], avisos = [];
  const todos = [];
  for (const curso in alumnosPorCurso) {
    const lista = alumnosPorCurso[curso];
    for (let i = 0; i < lista.length; i++) todos.push(lista[i]);
  }
  todos.sort(function (a, b) {
    const ka = a.unidad + ' ' + normalizar(a.nombre), kb = b.unidad + ' ' + normalizar(b.nombre);
    return ka < kb ? -1 : (ka > kb ? 1 : 0);
  });

  for (let i = 0; i < todos.length; i++) {
    const a = todos[i];
    const v = a.valores;
    const clave = normalizar(a.nombre);
    const h = hist[clave];
    const man = (manuales && manuales[clave]) || ['', '', '', ''];
    let edad = '', repite = '', repESO = '', repPrim = '', fuente = '', total = '', pil = '', mns = '';

    if (!h) {
      fuente = 'No consta en el histórico';
      avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
        aviso: 'No está en el histórico de matrículas', detalle: 'No se pueden calcular sus repeticiones' });
    } else {
      edad = h[4]; repite = h[5]; repESO = h[6]; repPrim = h[7]; fuente = h[8];
      const corregido = String(man[0] || '').trim();
      const primaria = corregido !== '' && !isNaN(Number(corregido)) ? Number(corregido) : repPrim;
      total = (primaria === '' ? '' : primaria + repESO);
      pil = ((total !== '' && total >= 2) || repite === 'SÍ') ? 'SÍ' : 'NO';
      if (repite === 'SÍ') {
        const notas = notasPorCurso[a.curso];
        const n = notas ? notas[clave] : null;
        /* "5 de 2º — FYQ, GEH, LCL" : cuántas son, de qué curso, y cuáles.
           Lleva el curso para que no se confunda con las pendientes. */
        if (n) mns = n.n ? (n.n + ' de ' + a.curso + ' — ' + n.lista.join(', ')) : '';
        else avisos.push({ curso: a.curso, grupo: a.unidad, alumno: a.nombre,
          aviso: 'Repetidor sin notas del curso pasado', detalle: 'No aparece en la pestaña EV de su curso' });
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

    /* Diversificación. En 4º Séneca la marca con los ámbitos. En 1º, 2º y 3º
       Séneca no la trae, así que solo la sabemos por el fichero de Jefatura. */
    /* En 4º Séneca lo marca poniendo ÁMB en la columna MAT. En 1º, 2º y 3º
       no hay columna MAT, así que se mira directamente la matrícula en el
       Ámbito Científico-Tecnológico. En cuanto el centro matricule en Séneca
       a los de 3º en los ámbitos, saldrán solos por aquí. */
    const divSeneca = (v['MAT'] === 'ÁMB') || a.diver === true;
    const divJefatura = !!(jef[clave] && jef[clave].div === 'SÍ');
    const diver = divSeneca ? 'SÍ' : (divJefatura ? 'SÍ (solo Jefatura)' : 'NO');

    filas.push([a.nombre, a.unidad, a.curso, repite, diver, v['OPT'] || '', v['FR -> ALCT'] || '',
      v['MAT'] || '', v['OPC1'] || '', v['OPC2'] || '', v['OPC3'] || '', v['OPC4'] || '',
      v['REL/Atedu'] || '', a.pend.length ? a.pend.length : '',
      a.pend.length ? (a.pend.length + ' — ' + a.pend.join(', ')) : '', edad, mns,
      repESO, repPrim, fuente, man[0] || '', man[1] || '', total, pil, man[2] || '', man[3] || '']);
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

/*** ================= BÚSQUEDA DE FICHEROS ================= ***/
function carpetasDondeBuscar() {
  const lista = [];
  const carpeta = DriveApp.getFolderById(CARPETA_ID);
  lista.push(carpeta);
  const padres = carpeta.getParents();
  while (padres.hasNext()) lista.push(padres.next());
  return lista;
}

function buscarCsv(prefijo, contiene) {
  const carpetas = carpetasDondeBuscar();
  let mejor = null;
  for (let c = 0; c < carpetas.length; c++) {
    const it = carpetas[c].getFiles();
    while (it.hasNext()) {
      const f = it.next();
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

function buscarCsvsMatricula() {
  const encontrados = {};
  const carpetas = carpetasDondeBuscar();
  for (let c = 0; c < carpetas.length; c++) {
    const it = carpetas[c].getFiles();
    while (it.hasNext()) {
      const f = it.next();
      const n = f.getName();
      if (!/\.csv$/i.test(n)) continue;
      if (normalizar(n).indexOf('matomcmatr') !== 0) continue;
      if (n.indexOf(CURSO_ACTUAL) === -1) continue;
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
  const carpetas = carpetasDondeBuscar();
  for (let c = 0; c < carpetas.length; c++) {
    const it = carpetas[c].getFilesByType(MimeType.GOOGLE_SHEETS);
    while (it.hasNext()) {
      const f = it.next();
      if (normalizar(f.getName()).indexOf('propuesta') !== -1) return SpreadsheetApp.openById(f.getId());
    }
  }
  return null;
}

/*** ================= BOTÓN 1: HISTÓRICO ================= ***/
function cargarHistorico() {
  const ui = SpreadsheetApp.getUi();
  const archivo = buscarCsv('RegAlum');
  if (!archivo) {
    ui.alert('No he encontrado ningún fichero que empiece por "RegAlum" ni en la carpeta de datos ni en la de arriba.');
    return;
  }
  let res;
  try {
    const tabla = textoATablaFiltrada(textoDeArchivo(archivo),
      ['Alumno/a', 'Nº Id. Escolar', 'Curso', 'Unidad', 'Año de la matrícula',
       'Edad a 31/12 del año de matrícula', 'Estado Matrícula']);
    res = calcularHistorial(tabla);
  } catch (e) {
    ui.alert('No he podido leer el histórico.\n\n' + e.message);
    return;
  }

  const hoja = hojaLimpia(HOJA_HISTORIAL, TITULOS_HISTORIAL.length);
  hoja.getRange(1, 1).setValue('Histórico de matrículas. Origen: ' + archivo.getName() +
    '. Año de matrícula más reciente: ' + res.ano + '. Actualizado: ' + new Date().toLocaleString('es-ES'))
    .setFontStyle('italic');
  hoja.getRange(2, 1, 1, TITULOS_HISTORIAL.length).setValues([TITULOS_HISTORIAL]).setFontWeight('bold');
  if (res.filas.length) hoja.getRange(3, 1, res.filas.length, TITULOS_HISTORIAL.length).setValues(res.filas);
  hoja.setFrozenRows(2);
  for (let c = 1; c <= TITULOS_HISTORIAL.length; c++) hoja.autoResizeColumn(c);

  ui.alert('Histórico cargado (' + VERSION + ')',
    'Fichero: ' + archivo.getName() + '\nAño más reciente: ' + res.ano +
    '\nAlumnos de ESO matriculados ese año: ' + res.filas.length +
    '\n\nAhora pulsa "2. Construir la tabla ALUMNADO".', ui.ButtonSet.OK);
}

/*** ================= BOTÓN 2: ALUMNADO ================= ***/
function construirAlumnado() {
  const ui = SpreadsheetApp.getUi();
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  const hHist = libro.getSheetByName(HOJA_HISTORIAL);
  if (!hHist || hHist.getLastRow() < 3) {
    ui.alert('Antes tienes que pulsar "1. Leer el histórico de matrículas".');
    return;
  }
  const historial = hHist.getRange(3, 1, hHist.getLastRow() - 2, TITULOS_HISTORIAL.length).getValues();

  const ficheros = buscarCsvsMatricula();
  const cursos = Object.keys(ficheros);
  if (!cursos.length) {
    ui.alert('No he encontrado ningún fichero de matrícula del curso ' + CURSO_ACTUAL +
             '.\n\nDeben llamarse MatOMCMatr...' + CURSO_ACTUAL + '.csv');
    return;
  }

  const porCurso = {}, avisos = [], resumen = [];
  for (let i = 0; i < cursos.length; i++) {
    const curso = cursos[i];
    const r = leerMatricula(textoATabla(textoDeArchivo(ficheros[curso])), curso);
    porCurso[curso] = r.alumnos;
    resumen.push(curso + ' ESO: ' + r.alumnos.length + ' alumnos (' + ficheros[curso].getName() + ')');
    r.faltan.forEach(function (t) {
      avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Asignatura no encontrada en el CSV', detalle: t });
    });
    r.dobles.forEach(function (t) {
      avisos.push({ curso: curso, grupo: '', alumno: '', aviso: 'Dos opciones a la vez', detalle: t });
    });
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
  for (let i = 0; i < J.alumnos.length; i++) jefPorNombre[normalizar(J.alumnos[i].nombre)] = J.alumnos[i];
  for (let i = 0; i < J.avisos.length; i++) {
    const a = J.avisos[i];
    if (typeof a === 'string') avisos.push({ curso: '', grupo: '', alumno: '',
      aviso: 'Fichero de Jefatura', detalle: a });
    else avisos.push(a);
  }

  const manuales = leerManualesAlumnado(libro);
  const R = componerAlumnado(porCurso, historial, notas, manuales, jefPorNombre);
  R.avisos.forEach(function (a) { avisos.push(a); });

  escribirAlumnado(R.filas);
  escribirAvisos(avisos);

  escribirJefatura_(J.alumnos, J.nombre);
  const idxAlum = {};
  for (let c = 0; c < TITULOS_ALUMNADO.length; c++) idxAlum[normalizar(TITULOS_ALUMNADO[c])] = c;
  const discrepancias = J.alumnos.length ? compararJefatura_(R.filas, idxAlum, J.alumnos) : [];
  const nDiscrep = escribirDiscrepancias_(discrepancias, J.nombre);

  const iPil = TITULOS_ALUMNADO.indexOf('PIL');
  const iMns = TITULOS_ALUMNADO.indexOf('MAT NO SUP.');
  const iPen = TITULOS_ALUMNADO.indexOf('Nº pendientes');
  const iDiv = TITULOS_ALUMNADO.indexOf('Diversificación');
  const pil = R.filas.filter(function (f) { return f[iPil] === 'SÍ'; }).length;
  const mns = R.filas.filter(function (f) { return f[iMns] !== ''; }).length;
  const pen = R.filas.filter(function (f) { return f[iPen] !== ''; }).length;
  const div = R.filas.filter(function (f) { return String(f[iDiv]).indexOf('SÍ') === 0; }).length;

  ui.alert('Tabla ALUMNADO construida (' + VERSION + ')',
    resumen.join('\n') +
    '\n\nTotal de alumnos: ' + R.filas.length +
    '\nPIL (no pueden repetir más): ' + pil +
    '\nCon materias no superadas (repetidores): ' + mns +
    '\nCon asignaturas pendientes: ' + pen +
    '\nEn diversificación: ' + div +
    '\n\nFichero de Jefatura: ' + (J.nombre || 'no encontrado') +
    '\nAlumnos leídos de Jefatura: ' + J.alumnos.length +
    '\nDiferencias con Séneca: ' + nDiscrep +
    (nDiscrep ? '\nMíralas en la pestaña "' + HOJA_DISCREP + '".' : '') +
    '\n\nAvisos anotados: ' + avisos.length, ui.ButtonSet.OK);
}

function leerManualesAlumnado(libro) {
  const hoja = libro.getSheetByName(HOJA_ALUMNADO);
  const manuales = {};
  if (!hoja || hoja.getLastRow() < 3) return manuales;
  const ancho = hoja.getLastColumn();
  const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0].map(normalizar);
  const cols = COLS_MANUALES_ALUMNADO.map(function (t) { return titulos.indexOf(normalizar(t)); });
  if (cols.indexOf(-1) !== -1) return manuales;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  for (let f = 0; f < datos.length; f++) {
    const nombre = normalizar(datos[f][0]);
    if (!nombre) continue;
    manuales[nombre] = cols.map(function (c) { return datos[f][c]; });
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
    '. Gris: viene de Séneca. Azul: calculado. Amarillo: lo rellenas tú y no se toca. Actualizado: ' +
    new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, ancho).setValues([TITULOS_ALUMNADO]).setFontWeight('bold')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  if (filas.length) hoja.getRange(3, 1, filas.length, ancho).setValues(filas);

  const calculadas = ['Repite el curso actual', 'Diversificación', 'Repeticiones totales', 'PIL'];
  for (let c = 0; c < ancho; c++) {
    const t = TITULOS_ALUMNADO[c];
    const color = COLS_MANUALES_ALUMNADO.indexOf(t) !== -1 ? '#FFF2CC'
                : (calculadas.indexOf(t) !== -1 ? '#DDEBF7' : '#D9D9D9');
    hoja.getRange(2, c + 1).setBackground(color);
    if (COLS_MANUALES_ALUMNADO.indexOf(t) !== -1 && filas.length) {
      hoja.getRange(3, c + 1, filas.length, 1).setBackground('#FFF2CC');
    }
  }
  if (filas.length) {
    hoja.getRange(2, 1, filas.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID);
    hoja.getRange(3, 3, filas.length, ancho - 2).setHorizontalAlignment('center');
  }
  hoja.setFrozenRows(2);
  hoja.setFrozenColumns(2);
  for (let c = 1; c <= ancho; c++) hoja.autoResizeColumn(c);
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
  for (let c = 1; c <= 7; c++) hoja.autoResizeColumn(c);
}
