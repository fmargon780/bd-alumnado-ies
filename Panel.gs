/*** ================= EL PANEL Y EL BOTÓN DE ACTUALIZAR =================
 *
 * Antes había tres botones y Francisco tenía que saber cuál pulsar en cada
 * caso. El 6-sep-2026 se dejaron en dos, y desde entonces han vuelto a
 * crecer, pero ahora cada uno hace una cosa que se entiende sola:
 *
 *   1. Actualizar los datos         ->  actualizarDatos()       (está aquí)
 *   2. Generar los PDF definitivos  ->  generarPdfs()           (Informes.gs)
 *   3. Generar los PDF de borrador  ->  generarPdfsBorrador()   (Informes.gs)
 *   4. Ordenar la carpeta de Drive  ->  ordenarCarpeta()        (Orden.gs)
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
 * EL CUADRO DE ANTES DE ACTUALIZAR (BD v44, 8-sep-2026). Lo pidió Francisco:
 * el cuadro decía "hoy" o "ayer" de cada fichero, y eso no contesta a la
 * pregunta que él se hace, que es OTRA: "¿lo que hay en la carpeta es más
 * nuevo que lo que ya está metido en la tabla?". Ahora cada fuente enseña dos
 * fechas: la del fichero que se leyó la última vez y la del que hay ahora en
 * Drive. Para eso el programa apunta, cada vez que actualiza bien, la fecha de
 * cada fuente en PROP_FUENTES_LEIDAS. Se quitaron también las frases que solo
 * hablaban de los expedientes de Primaria: desde el 8-sep-2026 valen para
 * alumnado de cualquier curso, así que contar los de 1º que faltan ya no dice
 * lo que decía.
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

/* Dónde se apunta, de CADA fuente, el fichero que se incorporó la última vez
   que la actualización terminó bien. Es un JSON: por cada fuente, la fecha del
   fichero y cuántos ficheros eran. Sirve para poder enseñar las dos fechas en
   el cuadro. Si se pierde, no pasa nada: la primera vez sale "todavía nada". */
const PROP_FUENTES_LEIDAS = 'FUENTES_LEIDAS';

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

/* "08/09/2026 09:05". Hace falta la hora: un fichero que se vuelve a
   descargar el mismo día tiene la misma fecha corta y sin la hora parecería
   el mismo. */
function fechaHora_(fecha) {
  if (!fecha) return '';
  const h = ('0' + fecha.getHours()).slice(-2);
  const mi = ('0' + fecha.getMinutes()).slice(-2);
  return fechaCorta_(fecha) + ' ' + h + ':' + mi;
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

/*** ================= LO QUE SE INCORPORÓ LA ÚLTIMA VEZ ================= ***/

/* Devuelve { clave: { ts: milisegundos, n: cuántos ficheros } }. Si no hay
   nada apuntado, devuelve un objeto vacío y el cuadro dirá "todavía nada". */
function marcasGuardadas_() {
  try {
    const t = propiedadGuardada_(PROP_FUENTES_LEIDAS);
    if (!t) return {};
    const o = JSON.parse(t);
    return (o && typeof o === 'object') ? o : {};
  } catch (e) { return {}; }
}

/* Se llama solo cuando la tabla ALUMNADO se ha reconstruido de verdad. Si la
   actualización se para a medias, las marcas se quedan como estaban y el
   cuadro seguirá diciendo que ese fichero está sin meter, que es la verdad. */
function guardarMarcas_(marcas) {
  try {
    PropertiesService.getDocumentProperties()
      .setProperty(PROP_FUENTES_LEIDAS, JSON.stringify(marcas || {}));
  } catch (e) { /* si no se puede guardar, la próxima vez saldrá "todavía nada" */ }
}

/* El texto de una de las dos fechas del cuadro. */
function textoDeMarca_(marca) {
  if (!marca || !marca.ts) return 'todavía nada';
  let t = fechaHora_(new Date(marca.ts));
  if (marca.n > 1) t += ' (' + marca.n + ' ficheros)';
  return t;
}

/*** ================= BUSCAR EL FICHERO DE JEFATURA ================= ***/

/* Igual que hace Jefatura.gs, pero solo para saber si está y de cuándo es.
   No lo abre ni lo lee: aquí solo interesa la fecha. Reutiliza la misma
   búsqueda que usa leerJefatura_ (buscarFicheroJefatura_, en Jefatura.gs) en
   vez de repetirla, para que el panel y la lectura de verdad estén siempre de
   acuerdo en cuál es "el" fichero de Jefatura. */
function buscarAgrupamientosPanel_() {
  return buscarFicheroJefatura_().archivo;
}

/*** ================= EL ESTADO DE LAS FUENTES ================= ***/

/* Devuelve:
     filas          -> para la tabla del panel (cinco columnas)
     lineas         -> para el cuadro de aviso, en texto corrido
     historicoNuevo -> si hay que releer el RegAlum
     marcas         -> lo que hay AHORA en Drive, para apuntarlo si todo va bien
     avisos         -> cosas que conviene mirar antes de continuar   */
function estadoDeLasFuentes_() {
  const filas = [], lineas = [], avisos = [];
  const antes = marcasGuardadas_();
  const marcas = {};

  /* Apunta una fuente: compara lo que ya está metido con lo que hay ahora,
     escribe la fila del panel y las dos líneas del cuadro.
       clave    -> con qué nombre se guarda la marca
       rotulo   -> cómo se llama en pantalla
       fichero  -> el nombre del fichero, o cuántos hay
       fecha    -> la fecha del fichero que hay ahora (o null si no está)
       n        -> cuántos ficheros hay ahora
       nota     -> lo que hay que añadir al estado, si hace falta            */
  const apuntar = function (clave, rotulo, fichero, fecha, n, nota) {
    const ya = antes[clave] || null;
    const ahora = fecha ? { ts: fecha.getTime(), n: n || 1 } : null;
    if (ahora) marcas[clave] = ahora;

    let cambio;
    if (!ahora) {
      cambio = 'NO ESTÁ.';
    } else if (!ya || !ya.ts) {
      cambio = 'Es la primera vez que lo meto.';
    } else if (ahora.ts > ya.ts) {
      cambio = 'Es más nuevo: se mete la versión de ahora.';
    } else if (ahora.n !== ya.n) {
      const d = ahora.n - ya.n;
      cambio = d > 0 ? 'Hay ' + d + ' ficheros más que la última vez.'
                     : 'Hay ' + (-d) + ' ficheros menos que la última vez.';
    } else if (ahora.ts < ya.ts) {
      cambio = 'Es más antiguo que el que ya está metido.';
    } else {
      cambio = 'El mismo que ya está metido.';
    }

    const estado = nota ? cambio + ' ' + nota : cambio;
    const textoYa = textoDeMarca_(ya);
    const textoAhora = ahora ? textoDeMarca_(ahora) : 'no está en la carpeta';

    filas.push([rotulo, fichero || '—', textoYa, textoAhora, estado]);
    lineas.push(rotulo);
    lineas.push('   metido: ' + textoYa + ' → ahora: ' + textoAhora + '. ' + estado);
  };

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

  let historicoNuevo = false, notaHist = '';
  if (!regAlum) {
    notaHist = 'Descárgalo de Séneca.';
    avisos.push('Falta el fichero RegAlum.csv.');
  } else if (!hayHistorial) {
    historicoNuevo = true;
    notaHist = 'Se lee entero (tarda un poco).';
  } else if (historialViejo) {
    historicoNuevo = true;
    notaHist = 'Se relee: le falta la fecha de nacimiento.';
  } else if (String(regAlum.getLastUpdated().getTime()) !== guardada) {
    historicoNuevo = true;
    notaHist = 'Se relee (tarda un poco).';
  } else {
    notaHist = 'No hace falta releerlo.';
  }
  apuntar('historico', 'Histórico de matrículas', regAlum ? regAlum.getName() : '',
          regAlum ? regAlum.getLastUpdated() : null, 1, notaHist);

  /* 2. Los CSV de matrícula, uno por curso. */
  const mat = buscarCsvsMatricula();
  const cursos = Object.keys(mat).sort();
  let masReciente = null;
  for (let i = 0; i < cursos.length; i++) {
    const f = mat[cursos[i]].getLastUpdated();
    if (!masReciente || f.getTime() > masReciente.getTime()) masReciente = f;
  }
  let notaMat = '';
  if (!cursos.length) {
    notaMat = 'Sin ellos no se puede actualizar.';
    avisos.push('No hay ficheros de matrícula del curso ' + CURSO_ACTUAL + '.');
  } else if (cursos.length < 4) {
    notaMat = 'Solo hay ' + cursos.length + ' de 4 cursos: ' + cursos.join(', ') + '.';
    avisos.push('Faltan ficheros de matrícula: solo hay ' + cursos.join(', ') + '.');
  } else {
    notaMat = 'Están los cuatro cursos.';
  }
  apuntar('matricula', 'Matrícula de la ESO (1º a 4º)', cursos.length + ' ficheros',
          masReciente, cursos.length, notaMat);

  /* 2 bis. Los CSV de matrícula de Bachillerato. Son CUATRO: dos por curso,
     uno por modalidad. Van en su propia fila porque son otra etapa y porque
     se descargan por separado. Ver Bachillerato.gs. */
  const bac = ficherosBachilleratoPorCurso_();
  let nBac = 0, bacReciente = null;
  for (const cb in bac) {
    for (let i = 0; i < bac[cb].length; i++) {
      nBac++;
      const fb = bac[cb][i].archivo.getLastUpdated();
      if (!bacReciente || fb.getTime() > bacReciente.getTime()) bacReciente = fb;
    }
  }
  let notaBac = '';
  if (!nBac) {
    notaBac = 'No hay ninguno: el Bachillerato no saldrá en la tabla.';
  } else if (nBac < 4) {
    notaBac = 'Solo hay ' + nBac + ' de 4. Son dos por curso, uno por modalidad.';
    avisos.push('Faltan ficheros de matrícula de Bachillerato: solo hay ' + nBac + ' de 4.');
  } else {
    notaBac = 'Están los cuatro.';
  }
  apuntar('bachillerato', 'Matrícula de Bachillerato', nBac + ' ficheros',
          bacReciente, nBac, notaBac);

  /* 3. El censo NEAE. */
  const neae = buscarCsv(PREFIJO_NEAE);
  if (!neae) avisos.push('Falta el censo NEAE.');
  apuntar('neae', 'Censo NEAE', neae ? neae.getName() : '',
          neae ? neae.getLastUpdated() : null, 1,
          neae ? 'Se lee siempre.' : 'Las columnas NEAE se quedarán como están.');

  /* 4. El fichero de Jefatura. Es el que más se queda viejo, porque depende
        de que Jefatura pase una versión nueva. */
  const jef = buscarAgrupamientosPanel_();
  let notaJef = '';
  if (!jef) {
    notaJef = 'Tiene que ser una hoja de cálculo de Google, no un Excel.';
    avisos.push('Falta el fichero AGRUPAMIENTOS de Jefatura.');
  } else if (diasDesde_(jef.getLastUpdated()) >= DIAS_JEFATURA) {
    notaJef = 'Es de ' + haceCuanto_(jef.getLastUpdated()) +
              ': pregunta a Jefatura si hay versión nueva.';
    avisos.push('El fichero de Jefatura es de ' + haceCuanto_(jef.getLastUpdated()) + '.');
  }
  apuntar('jefatura', 'Fichero de Jefatura', jef ? jef.getName() : '',
          jef ? jef.getLastUpdated() : null, 1, notaJef);

  /* 5. Los expedientes de Primaria. Lista cacheada: ver ficherosDeExpedientes_
        en Primaria.gs. Así no se lista la carpeta dos veces (aquí y al
        construir la tabla) cuando hay muchos ficheros acumulados. */
  const carpetaPri = carpetaExpedientes_();
  let nPri = 0, priReciente = null;
  if (carpetaPri) {
    const ficherosExp = ficherosDeExpedientes_();
    for (let i = 0; i < ficherosExp.length; i++) {
      const f = ficherosExp[i];
      if (!/\.csv$/i.test(f.getName())) continue;
      nPri++;
      const u = f.getLastUpdated();
      if (!priReciente || u.getTime() > priReciente.getTime()) priReciente = u;
    }
  }
  apuntar('primaria', 'Expedientes de Primaria',
          carpetaPri ? nPri + ' ficheros' : '', priReciente, nPri,
          carpetaPri ? '' : 'No está la carpeta "' + CARPETA_PRIMARIA + '".');

  /* 6. Los expedientes de Secundaria. Fuente opcional: si no hay carpeta, el
        sistema funciona igual con el histórico de este centro. Lista
        cacheada: ver ficherosDeExpedientesSec_ en Secundaria.gs, igual que
        con los de Primaria un poco más arriba. */
  const carpetaSec = carpetaSecundaria_();
  let nSec = 0, secReciente = null;
  if (carpetaSec) {
    const ficherosExpSec = ficherosDeExpedientesSec_();
    for (let i = 0; i < ficherosExpSec.length; i++) {
      const f = ficherosExpSec[i];
      if (!/\.csv$/i.test(f.getName())) continue;
      nSec++;
      const u = f.getLastUpdated();
      if (!secReciente || u.getTime() > secReciente.getTime()) secReciente = u;
    }
  }
  apuntar('secundaria', 'Expedientes de Secundaria',
          carpetaSec ? nSec + ' ficheros' : '', secReciente, nSec,
          carpetaSec ? '' : 'No está la carpeta "' + CARPETA_SECUNDARIA + '".');

  return { filas: filas, lineas: lineas, historicoNuevo: historicoNuevo,
           marcas: marcas, avisos: avisos };
}

/*** ================= QUÉ QUEDA POR CUADRAR ================= ***/

/* Lee lo que ya está escrito en las pestañas y cuenta lo que falta. No
   depende de cómo se haya generado: sirve igual justo después de actualizar
   o tres días más tarde. */
function pendientesDelSistema_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const salida = { total: 0, sinDato: 0, sinUnidad: 0, discrepancias: 0, avisos: 0,
                   primeroSinExpediente: 0, matriculasEso: 0, matriculasBac: 0, cuadre: 0,
                   asignaturas: 0, hayAlumnado: false };

  const hoja = libro.getSheetByName(HOJA_ALUMNADO);
  if (hoja && hoja.getLastRow() >= 3) {
    salida.hayAlumnado = true;
    const ancho = hoja.getLastColumn();
    const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0].map(normalizar);
    const iCur = titulos.indexOf(normalizar('Curso'));
    const iUni = titulos.indexOf(normalizar('Unidad'));
    const iAsi = titulos.indexOf(normalizar('Asignaturas pendientes'));
    const iMns = titulos.indexOf(normalizar('MAT NO SUP.'));
    const iMat = titulos.indexOf(normalizar('MATRÍCULA'));
    const iNum = titulos.indexOf(normalizar('Nº asignaturas'));
    const iDebe = titulos.indexOf(normalizar('Debería tener'));
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
      /* El arqueo de asignaturas: tiene un número distinto del de su curso. */
      if (iNum !== -1 && iDebe !== -1) {
        const nu = String(datos[f][iNum]).trim(), de = String(datos[f][iDebe]).trim();
        if (nu !== '' && de !== '' && nu !== de) salida.asignaturas++;
      }
    }
  }

  /* Las matrículas que no cuadran, solo las que todavía no has marcado. */
  try {
    const m = matriculasSinMarcar_();
    salida.matriculasEso = m.eso;
    salida.matriculasBac = m.bac;
  } catch (e) { /* sin pestaña, cero */ }

  /* Las diferencias del CUADRE que ninguna fila explica (Cuadre.gs). */
  try { salida.cuadre = cuadreSinExplicar_(); } catch (e) { /* sin pestaña, cero */ }

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
  const N = 5;   // las cinco columnas del panel
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_RESUMEN);
  if (!hoja) hoja = libro.insertSheet(HOJA_RESUMEN, 0);
  hoja.clear();
  if (hoja.getMaxColumns() < N) hoja.insertColumnsAfter(hoja.getMaxColumns(), N - hoja.getMaxColumns());

  const filas = [], negritas = [], bandas = [];
  const mete = function (a, b, c, d, e) {
    filas.push([a || '', b || '', c || '', d || '', e || '']);
  };
  const banda = function (t) { bandas.push(filas.length); mete(t); };

  mete(TITULO_PANEL);
  mete(titulo + ' · ' + new Date().toLocaleString('es-ES') + ' · ' +
       (typeof VERSION_BD !== 'undefined' ? VERSION_BD : VERSION));
  mete('');

  banda('LAS CUATRO OPCIONES DEL MENÚ');
  mete('1. Actualizar los datos', 'Lee lo que haga falta y rellena las pestañas. No hace PDF.');
  mete('2. Generar los PDF (definitivos)',
       'Los del profesorado: con membrete y sin ninguna interrogante.');
  mete('3. Generar los PDF (borrador)',
       'Los tuyos: sin membrete, con las interrogantes y con la palabra BORRADOR arriba.');
  mete('4. Ordenar la carpeta de Drive',
       'Deja en la carpeta de datos solo lo que el programa usa. No borra nada.');
  mete('');

  if (fuentes && fuentes.length) {
    banda('CADA FICHERO: LO QUE YA ESTÁ METIDO Y LO QUE HAY AHORA');
    negritas.push(filas.length);
    mete('Fuente', 'Fichero', 'Metido la última vez', 'Lo que hay ahora', 'Qué pasa con él');
    for (let i = 0; i < fuentes.length; i++) {
      mete(fuentes[i][0], fuentes[i][1], fuentes[i][2], fuentes[i][3], fuentes[i][4]);
    }
    mete('');
  }

  if (pend && pend.hayAlumnado) {
    banda('QUÉ QUEDA POR CUADRAR');
    mete('Alumnado en la tabla', String(pend.total));
    mete('Con algún dato sin confirmar (sale "' + SIN_DATO + '")', String(pend.sinDato));
    mete('Sin unidad asignada en Séneca', String(pend.sinUnidad));
    mete('Matrículas que no cuadran en Séneca, sin marcar (ESO · Bachillerato)',
         String(pend.matriculasEso + pend.matriculasBac) + '  (' + pend.matriculasEso + ' · ' + pend.matriculasBac + ')');
    mete('Diferencias de personas y grupos con Jefatura, sin marcar', String(pend.discrepancias));
    mete('CUADRE: diferencias que ninguna fila explica (si hay alguna, es fallo del programa)', String(pend.cuadre));
    mete('Alumnado con un número de asignaturas distinto del de su curso (en rojo en ALUMNADO)',
         String(pend.asignaturas));
    mete('Avisos anotados', String(pend.avisos));
    mete('');
  }

  if (lineasResumen && lineasResumen.length) {
    banda('LO QUE HA HECHO ESTA VEZ');
    for (let i = 0; i < lineasResumen.length; i++) mete(lineasResumen[i]);
  }

  hoja.getRange(1, 1, filas.length, N).setValues(filas)
      .setFontSize(10).setVerticalAlignment('middle').setWrap(true);
  hoja.getRange(1, 1).setFontSize(14).setFontWeight('bold');
  hoja.getRange(2, 1).setFontStyle('italic');
  for (let i = 0; i < bandas.length; i++) {
    hoja.getRange(bandas[i] + 1, 1, 1, N).setFontWeight('bold').setBackground('#D9E1F2');
  }
  for (let i = 0; i < negritas.length; i++) {
    hoja.getRange(negritas[i] + 1, 1, 1, N).setFontWeight('bold').setBackground('#F2F2F2');
  }
  hoja.setColumnWidth(1, 260);
  hoja.setColumnWidth(2, 190);
  hoja.setColumnWidth(3, 145);
  hoja.setColumnWidth(4, 145);
  hoja.setColumnWidth(5, 300);
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

  let texto = 'De cada fichero: la fecha del que ya está metido y la del que hay ahora ' +
              'en la carpeta.\n\n' + E.lineas.join('\n');
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

/*** ================= CUÁNTO TARDA CADA FASE =================
 *
 * Lo pidió Francisco: quiere ver, sin cronómetro, en qué se va el tiempo de
 * "Actualizar los datos". Cada fase mide SU PROPIA duración (no el reloj
 * desde el principio), así que la espera del cuadro de confirmación —que
 * depende de Francisco, no del programa— nunca se cuela en ninguna fase.
 *
 * La línea de tiempos se añade SIEMPRE a "hecho" antes de escribir el panel,
 * también cuando algo falla a medias: así se ve hasta dónde llegó y cuánto
 * tardó en llegar. ***/

function duracionCorta_(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  if (s < 60) return s + ' s';
  return Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
}

/* T lleva, por fase, los milisegundos que ha tardado ELLA SOLA. Una fase que
   todavía no se ha alcanzado cuenta como 0, así que la línea sale igual de
   completa aunque la ejecución se pare antes de llegar al final. */
function lineaTiempos_(T) {
  const fases = [['ficheros', 'ficheros'], ['historico', 'histórico'], ['tabla', 'tabla'],
                 ['informes', 'informes'], ['formato', 'formato']];
  let total = 0;
  const trozos = [];
  for (let i = 0; i < fases.length; i++) {
    const dur = (T && T[fases[i][0]]) || 0;
    total += dur;
    trozos.push(fases[i][1] + ' ' + duracionCorta_(dur));
  }
  return 'Tiempos: ' + trozos.join(' · ') + ' · total ' + duracionCorta_(total);
}

/*** ================= BOTÓN 1: ACTUALIZAR LOS DATOS ================= ***/

function actualizarDatos() {
  const T = {};

  let E;
  try {
    const t0 = Date.now();
    E = estadoDeLasFuentes_();
    T.ficheros = Date.now() - t0;
  } catch (e) {
    avisar_('No he podido mirar los ficheros', e.message + '\n\n' + lineaTiempos_(T));
    return;
  }

  const respuesta = preguntarAntesDeActualizar_(E);

  if (respuesta === 'no') {
    guardarCacheDeFicheros_();
    escribirPanel_('No se ha actualizado nada: has cancelado',
      ['Cuando tengas los ficheros al día, vuelve a pulsar "1. Actualizar los datos".',
       '', lineaTiempos_(T)],
      E.filas, pendientesDelSistema_());
    return;
  }

  if (respuesta === 'sin-cuadro') {
    guardarCacheDeFicheros_();
    escribirPanel_('No he podido preguntarte, así que no he tocado nada',
      ['Google no me ha dejado mostrar el cuadro de confirmación.',
       'Arriba tienes, de cada fichero, lo que ya está metido y lo que hay ahora.',
       'Si lo ves bien, vuelve a pulsar "1. Actualizar los datos".',
       '', lineaTiempos_(T)],
      E.filas, pendientesDelSistema_());
    return;
  }

  /* A partir de aquí, Francisco ha dicho que sí. */
  const hecho = [];

  const tHist0 = Date.now();
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
  T.historico = Date.now() - tHist0;

  /* Lo que Francisco haya escrito en las columnas Estado y Observaciones de
     la pestaña AVISOS se guarda AHORA, porque construirAlumnado la reescribe
     entera y hasta la BD v21 esas anotaciones se perdían en cada
     actualización. Se vuelven a poner justo después. Las dos funciones están
     en Formato.gs. */
  let notasAvisos = {};
  try { notasAvisos = notasDeAvisos_(); } catch (e) { notasAvisos = {}; }

  let seHaConstruido = false;
  const tTabla0 = Date.now();
  try {
    /* construirAlumnado devuelve false cuando ha decidido parar ella misma,
       por ejemplo porque un CSV de matrícula no trae las asignaturas. En ese
       caso no ha escrito ninguna pestaña, así que tampoco hay anotaciones de
       AVISOS que restaurar. */
    seHaConstruido = construirAlumnado() !== false;   // ALUMNADO, JEFATURA, DISCREPANCIAS, NEAE, PRIMARIA, AVISOS
    T.tabla = Date.now() - tTabla0;
    if (seHaConstruido) {
      hecho.push('Tabla ALUMNADO reconstruida con todas las fuentes.');

      /* La matrícula de cada alumno (obligatorias + lo que quiere Jefatura,
         contra Séneca) se comprueba dentro de construirAlumnado, en
         Matricula.gs, y se escribe en la pestaña MATRÍCULA. */
      try {
        const m = matriculasSinMarcar_();
        hecho.push((m.eso + m.bac)
          ? 'Matrículas que no cuadran en Séneca: ' + (m.eso + m.bac) + ' (ESO ' + m.eso +
            ' · Bachillerato ' + m.bac + '). Están en la pestaña MATRÍCULA: qué falta y qué sobra.'
          : 'Matrículas: todo el alumnado tiene en Séneca lo que le corresponde.');
      } catch (e) { /* el panel lo cuenta igualmente */ }

      /* EL CUADRE: los totales de Séneca contra los de Jefatura, por unidad y
         por materia, con cada diferencia explicada. Ver Cuadre.gs. */
      try {
        const Q = escribirCuadre_();
        if (Q) {
          hecho.push('Cuadre de Séneca contra Jefatura, en las tres pestañas CUADRE. Filas con diferencia: personas ' +
                     Q.personas.conDiferencia + ' · materias ' + Q.materias.conDiferencia + ' · controles ' +
                     Q.controles.conDiferencia + '. ' +
                     (Q.sinExplicar ? 'Sin explicar: ' + Q.sinExplicar + '. Cuéntamelo.' : 'Todas están explicadas.'));
        }
      } catch (e) {
        hecho.push('No he podido escribir el CUADRE (' + e.message + ').');
      }

      try {
        const rec = restaurarNotasAvisos_(notasAvisos);
        if (rec) hecho.push('Avisos: recuperadas tus anotaciones en ' + rec + ' filas.');
      } catch (e) {
        hecho.push('Avisos: no he podido recuperar tus anotaciones (' + e.message + ').');
      }
    }
  } catch (e) {
    T.tabla = Date.now() - tTabla0;
    hecho.push('Tabla ALUMNADO: NO se ha podido construir (' + e.message + ').');
    try { restaurarNotasAvisos_(notasAvisos); } catch (e2) { /* la pestaña puede no existir */ }
    hecho.push('');
    hecho.push(lineaTiempos_(T));
    guardarCacheDeFicheros_();
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
    hecho.push(lineaTiempos_(T));
    guardarCacheDeFicheros_();
    escribirPanel_('No he actualizado nada: hay que revisar un fichero',
      hecho.concat(motivo), E.filas, pendientesDelSistema_());
    return;
  }

  /* Todas las fuentes se han leído de verdad, así que se apunta de cuándo era
     cada fichero. Es lo que la próxima vez saldrá en la columna "Metido la
     última vez". Va aquí y no antes: si la actualización se hubiera parado,
     apuntar la fecha sería mentir. */
  guardarMarcas_(E.marcas);

  const tInf0 = Date.now();
  try {
    const R = rellenarPestanasInformes_();
    hecho.push('Informes por unidad: ' + R.grupos + ' pestañas (' + R.reescritas +
               ' reescritas · ' + R.sinCambios + ' sin cambios), ' +
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
  T.informes = Date.now() - tInf0;

  /* El formato de las pestañas se deja bien al final, de una vez: anchos
     fijos, ajuste de texto en las columnas largas, cabecera y primeras
     columnas congeladas, y filtro en todas. Ver Formato.gs. */
  const tFmt0 = Date.now();
  try {
    const F = arreglarFormatoDeTodo_();
    hecho.push('Formato revisado en ' + F.hojas + ' pestañas.' +
               (F.fallos.length ? ' No he podido con: ' + F.fallos.join('; ') : ''));
  } catch (e) {
    hecho.push('No he podido dejar el formato de las pestañas (' + e.message + ').');
  }
  /* Las pestañas del CUADRE se colocan detrás de MATRÍCULA. Va después de
     ordenar las demás, que no las conocen. */
  try { colocarCuadre_(); } catch (e) { /* se queda donde esté */ }

  hecho.push('');
  /* El nombre EXACTO de las dos opciones del menú. Un cartel que manda pulsar
     un botón que no se llama así confunde: pasó con el "2. Construir la tabla
     ALUMNADO" que quedaba del menú de tres botones. */
  hecho.push('Para sacar los PDF del profesorado, pulsa "2. Generar los PDF (definitivos)".');
  hecho.push('Para los tuyos, con las interrogantes, pulsa "3. Generar los PDF (borrador)".');

  /* El estado de las fuentes se vuelve a mirar, porque el histórico ya está
     al día y las marcas de lo incorporado acaban de cambiar. Así la tabla del
     panel enseña ya las dos fechas iguales. Esto y lo que queda por cuadrar
     se cuentan dentro de la fase "formato": es lo último antes de pintar el
     panel, y tarda tan poco que no merece una fase propia. */
  let fuentesFinales = E.filas;
  try { fuentesFinales = estadoDeLasFuentes_().filas; } catch (e) { /* nos quedamos con las de antes */ }
  const pend = pendientesDelSistema_();
  T.formato = Date.now() - tFmt0;

  hecho.push(lineaTiempos_(T));
  guardarCacheDeFicheros_();
  escribirPanel_('Datos actualizados', hecho, fuentesFinales, pend);
}
