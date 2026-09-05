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
 *   Qué ficheros hay que traer, y qué opciones tiene el menú, lo dice
 *   el fichero manifiesto.json del repositorio. Por eso se pueden añadir
 *   módulos y opciones nuevas sin tocar este arranque.
 * ===================================================================== ***/

const GH_USUARIO    = 'fmargon780';
const GH_REPO       = 'bd-alumnado-ies';
const GH_RAMA       = 'main';
const GH_MANIFIESTO = 'manifiesto.json';

const PROP_CLAVE = 'GH_CLAVE';   // la contraseña de GitHub, guardada en tu cuenta
const PROP_MENU  = 'GH_MENU';    // copia del último menú que se pintó bien

const MAX_OPCIONES = 12;         // tope de opciones que puede traer el manifiesto


/*** ========================= EL MENÚ ========================= ***/

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Base de datos');

  let opciones = [];
  let hayConexion = true;

  try {
    const m = leerManifiesto_();
    opciones = (m.menu || []).slice(0, MAX_OPCIONES);
    PropertiesService.getUserProperties().setProperty(PROP_MENU, JSON.stringify(opciones));
  } catch (e) {
    hayConexion = false;
    opciones = menuGuardado_();
  }

  for (let i = 0; i < opciones.length; i++) {
    if (opciones[i] && opciones[i].separador) menu.addSeparator();
    else if (opciones[i] && opciones[i].titulo) menu.addItem(opciones[i].titulo, 'op' + (i + 1));
  }

  if (!hayConexion && !opciones.length) {
    menu.addItem('(no he podido conectar con GitHub)', 'comprobarConexion');
  }

  menu.addSeparator();
  menu.addItem('Comprobar la conexión con GitHub', 'comprobarConexion');
  menu.addItem('Cambiar la contraseña de GitHub', 'cambiarClaveGitHub');
  menu.addToUi();
}

function menuGuardado_() {
  const guardado = PropertiesService.getUserProperties().getProperty(PROP_MENU);
  if (!guardado) return [];
  try { return JSON.parse(guardado); } catch (e) { return []; }
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
    const opciones = menuGuardado_();
    op = opciones[n - 1];
    if (!op || !op.funcion) {
      throw new Error('Esa opción del menú ya no existe.\n\n' +
                      'Cierra el cuaderno y vuelve a abrirlo para refrescar el menú.');
    }
    const fuente = descargarPrograma_();
    const ejecutar = new Function(fuente + '\n;\nreturn ' + op.funcion + '();');
    ejecutar();
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

function textoDeRespuesta_(resp, ruta) {
  const codigo = resp.getResponseCode();
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
  const datos = JSON.parse(resp.getContentText());
  if (!datos || !datos.content) {
    throw new Error('GitHub ha devuelto "' + ruta + '" vacío o en un formato que no entiendo.');
  }
  const bytes = Utilities.base64Decode(String(datos.content).replace(/\n/g, ''));
  const texto = Utilities.newBlob(bytes).getDataAsString('UTF-8');
  if (!texto || texto.indexOf('function ') === -1) {
    throw new Error('Lo que he descargado de "' + ruta + '" no parece programa. No he tocado nada.');
  }
  return texto;
}

function leerManifiesto_() {
  const clave = claveGitHub_(true);
  if (!clave) throw new Error('Sin la contraseña de GitHub no puedo traer el programa.');

  const p = peticion_(GH_MANIFIESTO, clave);
  const resp = UrlFetchApp.fetch(p.url, p);
  const codigo = resp.getResponseCode();
  if (codigo === 401 || codigo === 403) {
    throw new Error('GitHub no acepta la contraseña (error ' + codigo + ').\n\n' +
      'Usa "Cambiar la contraseña de GitHub" y pega una nueva ' +
      'con el permiso "repo" marcado.');
  }
  if (codigo === 404) {
    throw new Error('No encuentro "' + GH_MANIFIESTO + '" en ' +
      GH_USUARIO + '/' + GH_REPO + ', rama ' + GH_RAMA + '.');
  }
  if (codigo !== 200) {
    throw new Error('GitHub ha respondido con el error ' + codigo + '.');
  }

  const datos = JSON.parse(resp.getContentText());
  const bytes = Utilities.base64Decode(String(datos.content).replace(/\n/g, ''));
  const m = JSON.parse(Utilities.newBlob(bytes).getDataAsString('UTF-8'));

  if (!m || !m.ficheros || !m.ficheros.length) {
    throw new Error('El manifiesto no dice qué ficheros hay que traer.');
  }
  return m;
}

function descargarPrograma_() {
  const clave = claveGitHub_(true);
  if (!clave) throw new Error('Sin la contraseña de GitHub no puedo traer el programa.');

  const m = leerManifiesto_();
  const ficheros = m.ficheros;
  const peticiones = ficheros.map(function (ruta) { return peticion_(ruta, clave); });
  const respuestas = UrlFetchApp.fetchAll(peticiones);

  const partes = [];
  for (let i = 0; i < respuestas.length; i++) {
    partes.push('// ===== ' + ficheros[i] + ' =====\n' +
                textoDeRespuesta_(respuestas[i], ficheros[i]));
  }
  return partes.join('\n\n');
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
    const m = leerManifiesto_();
    const clave = claveGitHub_(true);
    const peticiones = m.ficheros.map(function (ruta) { return peticion_(ruta, clave); });
    const respuestas = UrlFetchApp.fetchAll(peticiones);

    const lineas = [];
    const partes = [];
    for (let i = 0; i < respuestas.length; i++) {
      const texto = textoDeRespuesta_(respuestas[i], m.ficheros[i]);
      partes.push(texto);
      lineas.push('   • ' + m.ficheros[i] + ' — ' + texto.length.toLocaleString('es-ES') + ' caracteres');
    }
    const fuente = partes.join('\n\n');

    // Compila el programa sin ejecutarlo: detecta errores de escritura.
    new Function(fuente);

    // Comprueba que existe cada función que el menú va a llamar.
    const nombres = (m.menu || []).filter(function (o) { return o && o.funcion; })
                                  .map(function (o) { return o.funcion; });
    const tipos = new Function(fuente + '\n;\nreturn [' +
                    nombres.map(function (n) { return 'typeof ' + n; }).join(',') + '];')();

    const faltan = [];
    for (let j = 0; j < nombres.length; j++) {
      if (tipos[j] !== 'function') faltan.push(nombres[j]);
    }

    let informe = 'Conexión con GitHub: correcta.\n\n' +
                  'Versión que hay ahora mismo en GitHub:\n   ' + (m.version || '(sin nombre)') +
                  '\n\nFicheros traídos:\n' + lineas.join('\n') +
                  '\n\nEl programa se compila sin errores.';

    if (faltan.length) {
      informe += '\n\nAVISO: el menú llama a estas opciones y no las encuentro ' +
                 'en el programa:\n   ' + faltan.join(', ');
    } else {
      informe += '\nTodas las opciones del menú existen.\n\nTodo correcto.';
    }

    ui.alert('Comprobación', informe, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('La comprobación ha fallado', textoDeError_(e), ui.ButtonSet.OK);
  }
}
