/*** =====================================================================
 *   ARRANQUE — BD ALUMNADO
 *
 *   Este es el ÚNICO fichero de código que vive dentro del cuaderno.
 *   Se pega una vez y no se vuelve a tocar nunca.
 *
 *   El programa de verdad (Codigo.gs, Jefatura.gs, Informes.gs) vive en
 *   GitHub. Este fichero se lo trae por internet cada vez que se pulsa
 *   una opción del menú, así que el cuaderno siempre usa la última
 *   versión sin copiar ni pegar nada.
 *
 *   IMPORTANTE — por qué el menú no sale de internet:
 *   Google no permite salir a internet en el momento exacto de abrir el
 *   cuaderno (la función onOpen se ejecuta sin permisos). Por eso el menú
 *   se pinta con la lista de opciones guardada en la pestaña oculta
 *   "_menu", que se refresca sola cada vez que se ejecuta cualquier
 *   opción. Si esa pestaña no existe todavía, se usa MENU_POR_DEFECTO.
 *
 *   Qué ficheros hay que traer, y qué opciones tiene el menú, lo manda
 *   el fichero manifiesto.json del repositorio.
 * ===================================================================== ***/

const GH_USUARIO    = 'fmargon780';
const GH_REPO       = 'bd-alumnado-ies';
const GH_RAMA       = 'main';
const GH_MANIFIESTO = 'manifiesto.json';

const PROP_CLAVE = 'GH_CLAVE';   // la contraseña de GitHub, guardada en tu cuenta
const HOJA_MENU  = '_menu';      // pestaña oculta con las opciones del menú

const MAX_OPCIONES = 12;         // tope de opciones que puede traer el manifiesto

/* Lo que se pinta la primera vez, antes de que exista la pestaña "_menu". */
const MENU_POR_DEFECTO = [
  { titulo: '1. Leer el histórico de matrículas', funcion: 'cargarHistorico' },
  { titulo: '2. Construir la tabla ALUMNADO',      funcion: 'construirAlumnado' },
  { titulo: '3. Rellenar los informes por unidad', funcion: 'rellenarInformes' }
];


/*** ========================= EL MENÚ ========================= ***/

function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu('Base de datos');
  const opciones = menuGuardado_();

  for (let i = 0; i < opciones.length; i++) {
    if (opciones[i] && opciones[i].separador) menu.addSeparator();
    else if (opciones[i] && opciones[i].titulo) menu.addItem(opciones[i].titulo, 'op' + (i + 1));
  }

  menu.addSeparator();
  menu.addItem('Comprobar la conexión con GitHub', 'comprobarConexion');
  menu.addItem('Cambiar la contraseña de GitHub', 'cambiarClaveGitHub');
  menu.addToUi();
}

function menuGuardado_() {
  try {
    const h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_MENU);
    if (!h) return MENU_POR_DEFECTO;
    const txt = String(h.getRange(1, 1).getValue() || '').trim();
    if (!txt) return MENU_POR_DEFECTO;
    const v = JSON.parse(txt);
    return (v && v.length) ? v : MENU_POR_DEFECTO;
  } catch (e) {
    return MENU_POR_DEFECTO;
  }
}

/* Guarda el menú para la próxima vez que se abra el cuaderno.
   Devuelve true si ha cambiado respecto a lo que había. */
function guardarMenu_(opciones) {
  if (!opciones || !opciones.length) return false;
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let h = libro.getSheetByName(HOJA_MENU);
  if (!h) {
    h = libro.insertSheet(HOJA_MENU);
    h.getRange(3, 1).setValue(
      'No toques esta pestaña. Guarda las opciones del menú "Base de datos" ' +
      'para poder pintarlo al abrir el cuaderno, cuando Google todavía no ' +
      'deja salir a internet.');
    h.hideSheet();
  }
  const ahora = JSON.stringify(opciones);
  if (String(h.getRange(1, 1).getValue() || '') === ahora) return false;
  h.getRange(1, 1).setValue(ahora);
  return true;
}

/* Apps Script necesita un nombre de función fijo por cada opción del menú.
   Estas doce no hacen nada por sí solas: pasan el número a ejecutarOpcion_. */
function op1()  { ejecutarOpcion_(1); }
function op2()  { ejecutarOpcion_(2); }
function op3()  { ejecutarOpcion_(3); }
function op4()  { ejecutarOpcion_(4); }
function op5()  { ejecutarOpcion_(5); }
function op6()  { ejecutarOpcion_(6); }
function op7()  { ejecutarOpcion_(7); }
function op8()  { ejecutarOpcion_(8); }
function op9()  { ejecutarOpcion_(9); }
function op10() { ejecutarOpcion_(10); }
function op11() { ejecutarOpcion_(11); }
function op12() { ejecutarOpcion_(12); }


/*** ==================== EJECUTAR UNA OPCIÓN ==================== ***/

function ejecutarOpcion_(n) {
  const ui = SpreadsheetApp.getUi();
  let op = null;
  try {
    op = menuGuardado_()[n - 1];
    if (!op || !op.funcion) {
      throw new Error('Esa opción del menú ya no existe.\n\n' +
                      'Cierra el cuaderno y vuelve a abrirlo para refrescar el menú.');
    }
    const programa = descargarPrograma_();

    // El manifiesto manda: si la opción ha cambiado de sitio o de nombre,
    // se usa lo que diga él y se deja el menú al día para la próxima vez.
    const delManifiesto = (programa.manifiesto.menu || [])[n - 1];
    const funcion = (delManifiesto && delManifiesto.funcion) ? delManifiesto.funcion : op.funcion;
    guardarMenu_((programa.manifiesto.menu || []).slice(0, MAX_OPCIONES));

    new Function(programa.fuente + '\n;\nreturn ' + funcion + '();')();
  } catch (e) {
    ui.alert('No he podido ejecutar "' + ((op && op.titulo) || ('opción ' + n)) + '"',
             textoDeError_(e), ui.ButtonSet.OK);
  }
}


/*** ================= LA CONTRASEÑA DE GITHUB ================= ***/

function claveGitHub_(pedirSiFalta) {
  const props = PropertiesService.getUserProperties();
  let t = props.getProperty(PROP_CLAVE);
  if (t) return t;
  if (!pedirSiFalta) return null;

  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Contraseña de GitHub',
    'Pega aquí la contraseña de GitHub (empieza por ghp_ o github_pat_).\n\n' +
    'Solo hay que hacerlo esta vez: queda guardada en tu cuenta.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;

  t = r.getResponseText().trim();
  if (!t) return null;
  props.setProperty(PROP_CLAVE, t);
  return t;
}

function cambiarClaveGitHub() {
  const ui = SpreadsheetApp.getUi();
  PropertiesService.getUserProperties().deleteProperty(PROP_CLAVE);
  const t = claveGitHub_(true);
  if (!t) { ui.alert('No se ha guardado ninguna contraseña.'); return; }
  ui.alert('Contraseña guardada.\n\nAhora pulsa "Comprobar la conexión con GitHub" ' +
           'para asegurarte de que funciona.');
}


/*** ==================== DESCARGA DESDE GITHUB ==================== ***/

function peticion_(ruta, clave) {
  return {
    url: 'https://api.github.com/repos/' + GH_USUARIO + '/' + GH_REPO +
         '/contents/' + encodeURIComponent(ruta) + '?ref=' + encodeURIComponent(GH_RAMA),
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'Authorization': 'Bearer ' + clave,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  };
}

function comprobarCodigo_(codigo, ruta) {
  if (codigo === 401 || codigo === 403) {
    throw new Error('GitHub no acepta la contraseña (error ' + codigo + ').\n\n' +
      'Usa "Cambiar la contraseña de GitHub" y pega una nueva ' +
      'con el permiso "repo" marcado.');
  }
  if (codigo === 404) {
    throw new Error('No encuentro el fichero "' + ruta + '" en ' +
      GH_USUARIO + '/' + GH_REPO + ', rama ' + GH_RAMA + '.');
  }
  if (codigo !== 200) {
    throw new Error('GitHub ha respondido con el error ' + codigo +
      ' al pedirle "' + ruta + '".');
  }
}

function contenidoDeRespuesta_(resp, ruta) {
  comprobarCodigo_(resp.getResponseCode(), ruta);
  const datos = JSON.parse(resp.getContentText());
  if (!datos || !datos.content) {
    throw new Error('GitHub ha devuelto "' + ruta + '" vacío o en un formato que no entiendo.');
  }
  const bytes = Utilities.base64Decode(String(datos.content).replace(/\n/g, ''));
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}

function textoDeRespuesta_(resp, ruta) {
  const texto = contenidoDeRespuesta_(resp, ruta);
  if (!texto || texto.indexOf('function ') === -1) {
    throw new Error('Lo que he descargado de "' + ruta + '" no parece programa. No he tocado nada.');
  }
  return texto;
}

function leerManifiesto_(clave) {
  const p = peticion_(GH_MANIFIESTO, clave);
  const m = JSON.parse(contenidoDeRespuesta_(UrlFetchApp.fetch(p.url, p), GH_MANIFIESTO));
  if (!m || !m.ficheros || !m.ficheros.length) {
    throw new Error('El manifiesto no dice qué ficheros hay que traer.');
  }
  return m;
}

/* Devuelve { manifiesto, fuente, tamanos } */
function descargarPrograma_() {
  const clave = claveGitHub_(true);
  if (!clave) throw new Error('Sin la contraseña de GitHub no puedo traer el programa.');

  const m = leerManifiesto_(clave);
  const peticiones = m.ficheros.map(function (ruta) { return peticion_(ruta, clave); });
  const respuestas = UrlFetchApp.fetchAll(peticiones);

  const partes = [];
  const tamanos = [];
  for (let i = 0; i < respuestas.length; i++) {
    const texto = textoDeRespuesta_(respuestas[i], m.ficheros[i]);
    partes.push('// ===== ' + m.ficheros[i] + ' =====\n' + texto);
    tamanos.push({ fichero: m.ficheros[i], letras: texto.length });
  }
  return { manifiesto: m, fuente: partes.join('\n\n'), tamanos: tamanos };
}

function textoDeError_(e) {
  const msg = (e && e.message) ? e.message : String(e);
  if (msg.indexOf('Address unavailable') !== -1 || msg.indexOf('DNS') !== -1 ||
      msg.indexOf('Timeout') !== -1 || msg.indexOf('timed out') !== -1) {
    return 'No he podido conectar con GitHub. Puede ser un corte de internet.\n\n' +
           'Vuelve a intentarlo en un minuto.\n\nDetalle: ' + msg;
  }
  return msg;
}


/*** ================ COMPROBAR QUE TODO FUNCIONA ================ ***/

function comprobarConexion() {
  const ui = SpreadsheetApp.getUi();
  try {
    const programa = descargarPrograma_();
    const m = programa.manifiesto;

    // Compila el programa sin ejecutarlo: detecta errores de escritura.
    new Function(programa.fuente);

    // Comprueba que existe cada función que el menú va a llamar.
    const nombres = (m.menu || []).filter(function (o) { return o && o.funcion; })
                                  .map(function (o) { return o.funcion; });
    const tipos = nombres.length
      ? new Function(programa.fuente + '\n;\nreturn [' +
          nombres.map(function (n) { return 'typeof ' + n; }).join(',') + '];')()
      : [];

    const faltan = [];
    for (let j = 0; j < nombres.length; j++) {
      if (tipos[j] !== 'function') faltan.push(nombres[j]);
    }

    const cambio = guardarMenu_((m.menu || []).slice(0, MAX_OPCIONES));

    const lineas = programa.tamanos.map(function (t) {
      return '   • ' + t.fichero + ' — ' + t.letras + ' caracteres';
    });

    let informe = 'Conexión con GitHub: correcta.\n\n' +
                  'Versión que hay ahora mismo en GitHub:\n   ' + (m.version || '(sin nombre)') +
                  '\n\nFicheros traídos:\n' + lineas.join('\n') +
                  '\n\nEl programa se compila sin errores.';

    if (faltan.length) {
      informe += '\n\nAVISO: el menú llama a estas opciones y no las encuentro ' +
                 'en el programa:\n   ' + faltan.join(', ');
    } else {
      informe += '\nTodas las opciones del menú existen.';
    }

    informe += cambio
      ? '\n\nHe actualizado el menú. Cierra el cuaderno y vuelve a abrirlo para verlo.'
      : '\n\nTodo correcto.';

    ui.alert('Comprobación', informe, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('La comprobación ha fallado', textoDeError_(e), ui.ButtonSet.OK);
  }
}
