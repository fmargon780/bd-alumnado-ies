/*** ================= EL PANEL Y EL BOTÓN DE ACTUALIZAR =================
 *
 * Antes había tres botones y Francisco tenía que saber cuál pulsar en cada
 * caso. Desde el 6-sep-2026 hay dos, y los eligió él:
 *
 *   1. Actualizar los datos  ->  actualizarDatos()   (está aquí)
 *   2. Generar los PDF       ->  generarPdfs()       (está en Informes.gs)
 *
 * POR QUÉ ASÍ. Los PDF son la única parte que Google rechaza a veces, y la
 * única que puede pasarse del tiempo que Google concede a un script. Dejarlos
 * aparte hace que actualizar sea rápido y seguro. Además, cuando Francisco
 * está revisando avisos, quiere ver los datos al día sin gastar PDF.
 *
 * QUÉ HACE EL BOTÓN 1, por orden:
 *   a) Mira los ficheros de Drive y ve de cuándo es cada uno.
 *   b) Enseña un cuadro con eso y espera un Continuar o un Cancelar.
 *   c) Si continúa: relee el histórico SOLO si ha cambiado, reconstruye la
 *      tabla ALUMNADO, comprueba las materias obligatorias y rellena las 23
 *      pestañas del cuaderno de informes.
 *   d) Deja el formato de todas las pestañas en condiciones (ver Formato.gs).
 *   e) Deja escrito el panel: qué ha hecho, cómo están las fuentes y qué
 *      queda por cuadrar.
 *
 * LA PROTECCIÓN DEL CUADRO. El 6-sep-2026 un cuadro de diálogo dejó una
 * ejecución en pausa para siempre porque Google no consiguió mostrarlo. Aquí
 * el cuadro sale ANTES de trabajar, así que si falla no se ha hecho nada. Y
 * si no se puede mostrar, el programa NO actualiza: escribe el panel y pide
 * que se vuelva a pulsar. Nunca hace nada sin permiso, y nunca se cuelga.
 *
 * ======================================================== ***/

/* En qué pestaña vive el panel. Es la misma donde ya salía el resumen, para
   no tener dos pantallas parecidas. La constante está en Codigo.gs. */
const TITULO_PANEL = 'PANEL — qué hay, qué falta y qué hace cada botón';

/* Dónde se apunta la fecha del RegAlum que se leyó la última vez. Sirve para
   no volver a leer un fichero de 10 MB que no ha cambiado. */
const PROP_FECHA_HISTORICO = 'FECHA_REGALUM';

/* A partir de cuántos días conviene pedir una versión nueva del fichero de
   Jefatura. No es un error: es un recordatorio. */
const DIAS_JEFATURA = 30;

/*** ================= FECHAS ================= ***/

function diasDesde_(fecha) {
  if (!fecha) return -1;
  const ms = new Date().getTime() - fecha.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/* "hoy", "ayer", "hace 12 días" */
function haceCuanto_(fecha) {
  const d = diasDesde_(fecha);
  if (d < 0) return '';
  if (d === 0) return 'hoy';
  if (d === 1) return 'ayer';
  return 'hace ' + d + ' días';
}

function fechaCorta_(fecha) {
  if (!fecha) return '';
  const d = ('0' + fecha.getDate()).slice(-2);
  const m = ('0' + (fecha.getMonth() + 1)).slice(-2);
  return d + '/' + m + '/' + fecha.getFullYear();
}

function propiedadGuardada_(clave) {
  try {
    const v = PropertiesService.getDocumentProperties().getProperty(clave);
    return v === null || v === undefined ? '' : String(v);
  } catch (e) { return ''; }
}

function guardarPropiedad_(clave, valor) {
  try { PropertiesService.getDocumentProperties().setProperty(clave, String(valor)); }
  catch (e) { /* si no se puede guardar, solo se releerá de más */ }
}

/*** ================= BUSCAR EL FICHERO DE JEFATURA ================= ***/

/* Igual que hace Jefatura.gs, pero solo para saber si está y de cuándo es.
   No lo abre ni lo lee: aquí solo interesa la fecha. Usa la misma caché de
   ficheros que buscarCsv (Codigo.gs), así que no vuelve a listar Drive. */
function buscarAgrupamientosPanel_() {
  const listas = ficherosPorCarpeta_();
  let mejor = null;
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      if (f.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
      if (normalizar(f.getName()).indexOf('agrupamientos') === -1) continue;
      if (!mejor || f.getLastUpdated().getTime() > mejor.getLastUpdated().getTime()) mejor = f;
    }
    if (mejor) break;
  }
  return mejor;
}

/*** ================= EL ESTADO DE LAS FUENTES ================= ***/

/* Devuelve:
     filas        -> para la tabla del panel
     lineas       -> para el cuadro de aviso, en texto corrido
     historicoNuevo -> si hay que releer el RegAlum
     avisos       -> cosas que conviene mirar antes de continuar   */
function estadoDeLasFuentes_() {
  const filas = [], lineas = [], avisos = [];

  /* 1. El histórico de matrículas. */
  const regAlum = buscarCsv('RegAlum');
  const guardada = propiedadGuardada_(PROP_FECHA_HISTORICO);
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hHist = libro.getSheetByName(HOJA_HISTORIAL);
  const hayHistorial = !!(hHist && hHist.getLastRow() >= 3);

  /* Un HISTORIAL hecho con una versión antigua no trae la fecha de nacimiento,
     y sin ella el censo NEAE no puede deshacer empates. Se relee. */
  let historialViejo = false;
  if (hayHistorial) {
    const anchoH = hHist.getLastColumn();
    const titulos = hHist.getRange(2, 1, 1, anchoH).getValues()[0].map(normalizar);
    historialViejo = titulos.indexOf(normalizar('Fecha de nacimiento')) === -1;
  }

  let historicoNuevo = false, estadoHist = '';
  if (!regAlum) {
    estadoHist = 'NO ESTÁ. Descárgalo de Séneca.';
    avisos.push('Falta el fichero RegAlum.csv.');
  } else if (!hayHistorial) {
    historicoNuevo = true;
    estadoHist = 'Se va a leer por primera vez (tarda un poco).';
  } else if (historialViejo) {
    historicoNuevo = true;
    estadoHist = 'Se va a releer: le falta la fecha de nacimiento.';
  } else if (String(regAlum.getLastUpdated().getTime()) !== guardada) {
    historicoNuevo = true;
    estadoHist = 'Ha cambiado. Se va a releer (tarda un poco).';
  } else {
    estadoHist = 'Al día. No hace falta releerlo.';
  }
  filas.push(['Histórico de matrículas', regAlum ? regAlum.getName() : '—',
              regAlum ? haceCuanto_(regAlum.getLastUpdated()) : '—', estadoHist]);
  lineas.push('Histórico de matrículas: ' +
              (regAlum ? haceCuanto_(regAlum.getLastUpdated()) : 'NO ESTÁ') +
              '. ' + estadoHist);

  /* 2. Los CSV de matrícula, uno por curso. */
  const mat = buscarCsvsMatricula();
  const cursos = Object.keys(mat).sort();
  let masReciente = null;
  for (let i = 0; i < cursos.length; i++) {
    const f = mat[cursos[i]].getLastUpdated();
    if (!masReciente || f.getTime() > masReciente.getTime()) masReciente = f;
  }
  let estadoMat;
  if (!cursos.length) {
    estadoMat = 'NO ESTÁN. Sin ellos no se puede actualizar.';
    avisos.push('No hay ficheros de matrícula del curso ' + CURSO_ACTUAL + '.');
  } else if (cursos.length < 4) {
    estadoMat = 'Solo hay ' + cursos.length + ' de 4 cursos: ' + cursos.join(', ') + '.';
    avisos.push('Faltan ficheros de matrícula: solo hay ' + cursos.join(', ') + '.');
  } else {
    estadoMat = 'Los cuatro cursos.';
  }
  filas.push(['Matrícula de 1º a 4º', cursos.length + ' ficheros',
              masReciente ? haceCuanto_(masReciente) : '—', estadoMat]);
  lineas.push('Matrícula de 1º a 4º: ' +
              (masReciente ? haceCuanto_(masReciente) : 'NO ESTÁN') + '. ' + estadoMat);

  /* 3. El censo NEAE. */
  const neae = buscarCsv(PREFIJO_NEAE);
  const estadoNeae = neae ? 'Se lee siempre.'
                          : 'NO ESTÁ. Las columnas NEAE se quedarán como están.';
  if (!neae) avisos.push('Falta el censo NEAE.');
  filas.push(['Censo NEAE', neae ? neae.getName() : '—',
              neae ? haceCuanto_(neae.getLastUpdated()) : '—', estadoNeae]);
  lineas.push('Censo NEAE: ' + (neae ? haceCuanto_(neae.getLastUpdated()) : 'NO ESTÁ') +
              '. ' + estadoNeae);

  /* 4. El fichero de Jefatura. Es el que más se queda viejo, porque depende
        de que Jefatura pase una versión nueva. */
  const jef = buscarAgrupamientosPanel_();
  let estadoJef;
  if (!jef) {
    estadoJef = 'NO ESTÁ. Tiene que ser una hoja de cálculo de Google, no un Excel.';
    avisos.push('Falta el fichero AGRUPAMIENTOS de Jefatura.');
  } else if (diasDesde_(jef.getLastUpdated()) >= DIAS_JEFATURA) {
    estadoJef = 'Tiene ya sus días. Pregunta a Jefatura si hay versión nueva.';
    avisos.push('El fichero de Jefatura es de ' + haceCuanto_(jef.getLastUpdated()) + '.');
  } else {
    estadoJef = 'Reciente.';
  }
  filas.push(['Fichero de Jefatura', jef ? jef.getName() : '—',
              jef ? haceCuanto_(jef.getLastUpdated()) : '—', estadoJef]);
  lineas.push('Fichero de Jefatura: ' + (jef ? haceCuanto_(jef.getLastUpdated()) : 'NO ESTÁ') +
              '. ' + estadoJef);

  /* 5. Los expedientes de Primaria. Lista cacheada: ver ficherosDeExpedientes_
        en Primaria.gs. Así no se lista la carpeta dos veces (aquí y al
        construir la tabla) cuando hay muchos ficheros acumulados. */
  let nExp = 0, expReciente = null;
  const carpeta = carpetaExpedientes_();
  if (carpeta) {
    const ficherosExp = ficherosDeExpedientes_();
    for (let i = 0; i < ficherosExp.length; i++) {
      const f = ficherosExp[i];
      if (!/\.csv$/i.test(f.getName())) continue;
      nExp++;
      const u = f.getLastUpdated();
      if (!expReciente || u.getTime() > expReciente.getTime()) expReciente = u;
    }
  }
  const faltan = alumnosDePrimeroSinExpediente_();
  let estadoExp;
  if (!carpeta) {
    estadoExp = 'NO ESTÁ la carpeta "Expedientes Primaria".';
  } else if (faltan < 0) {
    estadoExp = nExp + ' ficheros.';
  } else if (faltan === 0) {
    estadoExp = 'Completo: todos los de 1º que lo necesitan lo tienen.';
  } else {
    estadoExp = 'Faltan ' + faltan + ' alumnos de 1º por descargar.';
  }
  filas.push(['Expedientes de Primaria', nExp + ' ficheros',
              expReciente ? haceCuanto_(expReciente) : '—', estadoExp]);
  lineas.push('Expedientes de Primaria: ' + nExp + ' ficheros. ' + estadoExp);

  return { filas: filas, lineas: lineas, historicoNuevo: historicoNuevo, avisos: avisos };
}

/* Cuántos alumnos de 1º salen todavía con la interrogante en las pendientes.
   Devuelve -1 si la tabla ALUMNADO no está hecha todavía. */
function alumnosDePrimeroSinExpediente_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_ALUMNADO);
  if (!hoja || hoja.getLastRow() < 3) return -1;
  const ancho = hoja.getLastColumn();
  const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0].map(normalizar);
  const iCur = titulos.indexOf(normalizar('Curso'));
  const iAsi = titulos.indexOf(normalizar('Asignaturas pendientes'));
  if (iCur === -1 || iAsi === -1) return -1;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  let n = 0;
  for (let f = 0; f < datos.length; f++) {
    if (String(datos[f][iCur]).trim() === '1º' &&
        String(datos[f][iAsi]).trim() === SIN_DATO) n++;
  }
  return n;
}

/*** ================= QUÉ QUEDA POR CUADRAR ================= ***/

/* Lee lo que ya está escrito en las pestañas y cuenta lo que falta. No
   depende de cómo se haya generado: sirve igual justo después de actualizar
   o tres días más tarde. */
function pendientesDelSistema_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const salida = { total: 0, sinDato: 0, sinUnidad: 0, discrepancias: 0, avisos: 0,
                   primeroSinExpediente: 0, hayAlumnado: false };

  const hoja = libro.getSheetByName(HOJA_ALUMNADO);
  if (hoja && hoja.getLastRow() >= 3) {
    salida.hayAlumnado = true;
    const ancho = hoja.getLastColumn();
    const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0].map(normalizar);
    const iCur = titulos.indexOf(normalizar('Curso'));
    const iUni = titulos.indexOf(normalizar('Unidad'));
    const iAsi = titulos.indexOf(normalizar('Asignaturas pendientes'));
    const iMns = titulos.indexOf(normalizar('MAT NO SUP.'));
    const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
    for (let f = 0; f < datos.length; f++) {
      if (!String(datos[f][0] || '').trim()) continue;
      salida.total++;
      const asi = iAsi === -1 ? '' : String(datos[f][iAsi]).trim();
      const mns = iMns === -1 ? '' : String(datos[f][iMns]).trim();
      if (asi === SIN_DATO || mns === SIN_DATO) salida.sinDato++;
      if (iCur !== -1 && String(datos[f][iCur]).trim() === '1º' && asi === SIN_DATO) {
        salida.primeroSinExpediente++;
      }
      if (iUni !== -1 && !String(datos[f][iUni] || '').trim()) salida.sinUnidad++;
    }
  }

  const hd = libro.getSheetByName(HOJA_DISCREP);
  if (hd && hd.getLastRow() >= 3) {
    const datos = hd.getRange(3, 1, hd.getLastRow() - 2, 8).getValues();
    for (let f = 0; f < datos.length; f++) {
      if (!String(datos[f][3] || '').trim()) continue;          // no es una fila de datos
      if (String(datos[f][6] || '').trim() !== '') continue;    // ya tiene estado
      salida.discrepancias++;
    }
  }

  const ha = libro.getSheetByName(HOJA_AVISOS);
  if (ha && ha.getLastRow() >= 2) salida.avisos = ha.getLastRow() - 1;

  return salida;
}

/* Lo que la parada de seguridad de construirAlumnado ha dejado escrito en la
   pestaña RESUMEN. Hay que rescatarlo ANTES de pintar el panel, porque el
   panel usa esa misma pestaña y la borra entera: sin esto, Francisco leería
   "no he actualizado nada" sin el motivo ni el nombre del fichero que tiene
   que volver a descargar. Las líneas se devuelven para que el panel las
   vuelva a poner al final, en "LO QUE HA HECHO ESTA VEZ". */
function motivoDeLaParada_() {
  const lineas = [];
  try {
    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_RESUMEN);
    if (!hoja || hoja.getLastRow() < 1) return lineas;
    const col = hoja.getRange(1, 1, hoja.getLastRow(), 1).getValues();
    for (let i = 0; i < col.length; i++) {
      const t = String(col[i][0] === null || col[i][0] === undefined ? '' : col[i][0]).trim();
      /* La segunda línea es la marca de hora que pone avisar_, y el panel ya
         lleva la suya arriba. */
      if (i === 1 && t.indexOf('Terminado el ') === 0) continue;
      lineas.push(t);
    }
    while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
  } catch (e) { /* si no se puede leer, el panel sale sin el motivo */ }
  return lineas;
}

/*** ================= ESCRIBIR EL PANEL ================= ***/

function escribirPanel_(titulo, lineasResumen, fuentes, pend) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_RESUMEN);
  if (!hoja) hoja = libro.insertSheet(HOJA_RESUMEN, 0);
  hoja.clear();
  if (hoja.getMaxColumns() < 4) hoja.insertColumnsAfter(hoja.getMaxColumns(), 4 - hoja.getMaxColumns());

  const filas = [], negritas = [], bandas = [];
  const mete = function (a, b, c, d) { filas.push([a || '', b || '', c || '', d || '']); };
  const banda = function (t) { bandas.push(filas.length); mete(t); };

  mete(TITULO_PANEL);
  mete(titulo + ' · ' + new Date().toLocaleString('es-ES') + ' · ' +
       (typeof VERSION_BD !== 'undefined' ? VERSION_BD : VERSION));
  mete('');

  banda('LOS DOS BOTONES DEL MENÚ');
  mete('1. Actualizar los datos', 'Lee lo que haga falta y rellena las pestañas. No hace PDF.');
  mete('2. Generar los PDF', 'Saca un PDF por grupo con lo que ya está escrito.');
  mete('');

  if (fuentes && fuentes.length) {
    banda('DE CUÁNDO ES CADA FICHERO');
    negritas.push(filas.length);
    mete('Fuente', 'Fichero', 'De cuándo', 'Estado');
    for (let i = 0; i < fuentes.length; i++) {
      mete(fuentes[i][0], fuentes[i][1], fuentes[i][2], fuentes[i][3]);
    }
    mete('');
  }

  if (pend && pend.hayAlumnado) {
    banda('QUÉ QUEDA POR CUADRAR');
    mete('Alumnado en la tabla', String(pend.total));
    mete('Con algún dato sin confirmar (sale "' + SIN_DATO + '")', String(pend.sinDato));
    mete('De 1º, sin expediente de Primaria descargado', String(pend.primeroSinExpediente));
    mete('Sin unidad asignada en Séneca', String(pend.sinUnidad));
    mete('Diferencias con Jefatura sin marcar', String(pend.discrepancias));
    mete('Avisos anotados', String(pend.avisos));
    mete('');
  }

  if (lineasResumen && lineasResumen.length) {
    banda('LO QUE HA HECHO ESTA VEZ');
    for (let i = 0; i < lineasResumen.length; i++) mete(lineasResumen[i]);
  }

  hoja.getRange(1, 1, filas.length, 4).setValues(filas)
      .setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  hoja.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  hoja.getRange(2, 1).setFontStyle('italic');
  for (let i = 0; i < bandas.length; i++) {
    hoja.getRange(bandas[i] + 1, 1, 1, 4).setFontWeight('bold').setBackground('#D9E1F2');
  }
  for (let i = 0; i < negritas.length; i++) {
    hoja.getRange(negritas[i] + 1, 1, 1, 4).setFontWeight('bold').setBackground('#F2F2F2');
  }
  hoja.setColumnWidth(1, 300);
  hoja.setColumnWidth(2, 230);
  hoja.setColumnWidth(3, 110);
  hoja.setColumnWidth(4, 330);
  hoja.setFrozenRows(2);
  libro.setActiveSheet(hoja);
  libro.moveActiveSheet(1);
  try { libro.toast(titulo, 'Míralo en la pestaña ' + HOJA_RESUMEN, 15); } catch (e) { }
}

/*** ================= EL CUADRO DE ANTES DE ACTUALIZAR ================= ***/

/* Devuelve 'si', 'no' o 'sin-cuadro'.
   'sin-cuadro' es cuando Google no deja mostrarlo. En ese caso NO se actualiza:
   más vale pedir otra pulsación que hacer algo que no se ha aprobado. */
function preguntarAntesDeActualizar_(E) {
  let ui;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { return 'sin-cuadro'; }
  if (!ui) return 'sin-cuadro';

  let texto = 'De cuándo es cada cosa:\n\n' + E.lineas.join('\n');
  if (E.avisos.length) {
    texto += '\n\nOJO:\n' + E.avisos.join('\n');
  }
  texto += '\n\n¿Continúo y actualizo?';

  try {
    const r = ui.alert('Antes de actualizar', texto, ui.ButtonSet.OK_CANCEL);
    return r === ui.Button.OK ? 'si' : 'no';
  } catch (e) {
    return 'sin-cuadro';
  }
}

/*** ================= BOTÓN 1: ACTUALIZAR LOS DATOS ================= ***/

function actualizarDatos() {
  let E;
  try {
    E = estadoDeLasFuentes_();
  } catch (e) {
    avisar_('No he podido mirar los ficheros', e.message);
    return;
  }

  const respuesta = preguntarAntesDeActualizar_(E);

  if (respuesta === 'no') {
    escribirPanel_('No se ha actualizado nada: has cancelado',
      ['Cuando tengas los ficheros al día, vuelve a pulsar "1. Actualizar los datos".'],
      E.filas, pendientesDelSistema_());
    return;
  }

  if (respuesta === 'sin-cuadro') {
    escribirPanel_('No he podido preguntarte, así que no he tocado nada',
      ['Google no me ha dejado mostrar el cuadro de confirmación.',
       'Arriba tienes de cuándo es cada fichero.',
       'Si lo ves bien, vuelve a pulsar "1. Actualizar los datos".'],
      E.filas, pendientesDelSistema_());
    return;
  }

  /* A partir de aquí, Francisco ha dicho que sí. */
  const hecho = [];

  if (E.historicoNuevo) {
    try {
      cargarHistorico();                     // escribe la pestaña HISTORIAL
      const regAlum = buscarCsv('RegAlum');
      if (regAlum) guardarPropiedad_(PROP_FECHA_HISTORICO, regAlum.getLastUpdated().getTime());
      hecho.push('Histórico de matrículas: releído.');
    } catch (e) {
      hecho.push('Histórico de matrículas: NO se ha podido leer (' + e.message + ').');
    }
  } else {
    hecho.push('Histórico de matrículas: no ha cambiado, no se ha tocado.');
  }

  /* Lo que Francisco haya escrito en las columnas Estado y Observaciones de
     la pestaña AVISOS se guarda AHORA, porque construirAlumnado la reescribe
     entera y hasta la BD v21 esas anotaciones se perdían en cada
     actualización. Se vuelven a poner justo después. Las dos funciones están
     en Formato.gs. */
  let notasAvisos = {};
  try { notasAvisos = notasDeAvisos_(); } catch (e) { notasAvisos = {}; }

  let seHaConstruido = false;
  try {
    /* construirAlumnado devuelve false cuando ha decidido parar ella misma,
       por ejemplo porque un CSV de matrícula no trae las asignaturas. En ese
       caso no ha escrito ninguna pestaña, así que tampoco hay anotaciones de
       AVISOS que restaurar. */
    seHaConstruido = construirAlumnado() !== false;   // ALUMNADO, JEFATURA, DISCREPANCIAS, NEAE, PRIMARIA, AVISOS
    if (seHaConstruido) {
      hecho.push('Tabla ALUMNADO reconstruida con todas las fuentes.');

      /* LAS MATERIAS OBLIGATORIAS. Ver Obligatorias.gs.
         La comparación con Jefatura solo mira las asignaturas que el alumno
         elige, porque son las únicas que Jefatura escribe. Esto comprueba las
         otras: que cada alumno esté matriculado en Séneca en las materias que
         cursa todo su curso.
         Va AQUÍ, después de construir la tabla y ANTES de recuperar las
         anotaciones de AVISOS, porque añade filas a esa pestaña y así esas
         filas también conservan el Estado y las Observaciones de Francisco. */
      try {
        const O = comprobarObligatorias_();
        hecho.push(O.alumnos
          ? 'Materias obligatorias: ' + O.alumnos +
            ' alumnos a los que les falta alguna en Séneca. Están en AVISOS.'
          : 'Materias obligatorias: todo el alumnado está matriculado en las de su curso.');
      } catch (e) {
        hecho.push('Materias obligatorias: no he podido comprobarlas (' + e.message + ').');
      }

      try {
        const rec = restaurarNotasAvisos_(notasAvisos);
        if (rec) hecho.push('Avisos: recuperadas tus anotaciones en ' + rec + ' filas.');
      } catch (e) {
        hecho.push('Avisos: no he podido recuperar tus anotaciones (' + e.message + ').');
      }
    }
  } catch (e) {
    hecho.push('Tabla ALUMNADO: NO se ha podido construir (' + e.message + ').');
    try { restaurarNotasAvisos_(notasAvisos); } catch (e2) { /* la pestaña puede no existir */ }
    escribirPanel_('Algo ha fallado al actualizar', hecho, E.filas, pendientesDelSistema_());
    return;
  }

  /* PARADA. Si la tabla ALUMNADO no se ha reconstruido, no se sigue: rellenar
     los informes por unidad con lo que hubiera dejaría los papeles del tutor
     sin optativas y sin religión, que es justo lo que se quiere evitar. Se
     pinta el panel con el motivo y se termina aquí. */
  if (!seHaConstruido) {
    const motivo = motivoDeLaParada_();
    hecho.push('Tabla ALUMNADO: NO se ha reconstruido, así que no he seguido.');
    hecho.push('Los informes por unidad se han quedado como estaban.');
    hecho.push('');
    escribirPanel_('No he actualizado nada: hay que revisar un fichero',
      hecho.concat(motivo), E.filas, pendientesDelSistema_());
    return;
  }

  try {
    const R = rellenarPestanasInformes_();
    hecho.push('Informes por unidad: ' + R.grupos + ' pestañas rellenadas, ' +
               R.alumnos + ' alumnos escritos.');
    if (R.siglasSinExplicar.length) {
      hecho.push('Siglas sin explicar en la leyenda: ' + R.siglasSinExplicar.join(', ') + '.');
    }
    if (R.avisos) {
      hecho.push('Incidencias al rellenar los informes: ' + R.avisos +
                 '. Míralas en la pestaña "' + HOJA_AV_INF + '".');
    }
  } catch (e) {
    hecho.push('Informes por unidad: NO se han podido rellenar (' + e.message + ').');
  }

  /* El formato de las pestañas se deja bien al final, de una vez: anchos
     fijos, ajuste de texto en las columnas largas, cabecera y primeras
     columnas congeladas, y filtro en todas. Ver Formato.gs. */
  try {
    const F = arreglarFormatoDeTodo_();
    hecho.push('Formato revisado en ' + F.hojas + ' pestañas.' +
               (F.fallos.length ? ' No he podido con: ' + F.fallos.join('; ') : ''));
  } catch (e) {
    hecho.push('No he podido dejar el formato de las pestañas (' + e.message + ').');
  }

  hecho.push('');
  hecho.push('Para sacar los PDF, pulsa "2. Generar los PDF".');

  /* El estado de las fuentes se vuelve a mirar, porque el histórico ya está
     al día y el número de expedientes que faltan ha podido cambiar. */
  let fuentesFinales = E.filas;
  try { fuentesFinales = estadoDeLasFuentes_().filas; } catch (e) { /* nos quedamos con las de antes */ }

  escribirPanel_('Datos actualizados', hecho, fuentesFinales, pendientesDelSistema_());
}
