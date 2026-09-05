/*** ================= ACTUALIZADOR DESDE GITHUB =================
 *
 * Este fichero se pega UNA sola vez y ya no se toca.
 * A partir de aquí, el menú "Base de datos" tiene la opción
 * "Actualizar el programa", que trae la última versión de Codigo.gs
 * desde GitHub y la escribe en este mismo proyecto.
 *
 * =============================================================== ***/

const GH_USUARIO   = 'fmargon780';
const GH_REPO      = 'bd-alumnado-ies';
const GH_RAMA      = 'main';
const GH_FICHERO   = 'Codigo.gs';   // cómo se llama en GitHub
const GAS_FICHERO  = 'Codigo';      // cómo se llama dentro de este proyecto
const MARCA_SEGURA = 'function construirAlumnado';  // debe aparecer en lo descargado

/*** ================= MENÚ ================= ***/
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Base de datos')
    .addItem('1. Leer el histórico de matrículas', 'cargarHistorico')
    .addItem('2. Construir la tabla ALUMNADO', 'construirAlumnado')
    .addSeparator()
    .addItem('Actualizar el programa', 'actualizarPrograma')
    .addItem('Cambiar la contraseña de GitHub', 'cambiarClaveGitHub')
    .addToUi();
}

/*** ================= CLAVE DE GITHUB ================= ***/
function claveGitHub_(pedirSiFalta) {
  const props = PropertiesService.getUserProperties();
  let t = props.getProperty('GH_CLAVE');
  if (t) return t;
  if (!pedirSiFalta) return null;
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Contraseña de GitHub',
    'Pega aquí la contraseña de GitHub que creaste.\n\n' +
    'Solo hay que hacerlo esta vez: queda guardada en tu cuenta.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  t = r.getResponseText().trim();
  if (!t) return null;
  props.setProperty('GH_CLAVE', t);
  return t;
}

function cambiarClaveGitHub() {
  PropertiesService.getUserProperties().deleteProperty('GH_CLAVE');
  const t = claveGitHub_(true);
  SpreadsheetApp.getUi().alert(t ? 'Contraseña guardada.' : 'No se ha guardado ninguna contraseña.');
}

/*** ================= DESCARGA DESDE GITHUB ================= ***/
function descargarDeGitHub_(clave) {
  const url = 'https://api.github.com/repos/' + GH_USUARIO + '/' + GH_REPO +
              '/contents/' + encodeURIComponent(GH_FICHERO) + '?ref=' + encodeURIComponent(GH_RAMA);
  const resp = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'Authorization': 'Bearer ' + clave,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  const codigo = resp.getResponseCode();
  if (codigo === 401 || codigo === 403) {
    throw new Error('GitHub no acepta la contraseña.\n\nUsa "Cambiar la contraseña de GitHub" ' +
                    'y pega una nueva con el permiso "repo" marcado.');
  }
  if (codigo === 404) {
    throw new Error('No encuentro ' + GH_FICHERO + ' en ' + GH_USUARIO + '/' + GH_REPO +
                    ' (rama ' + GH_RAMA + ').');
  }
  if (codigo !== 200) {
    throw new Error('GitHub ha respondido con el error ' + codigo + '.');
  }
  const datos = JSON.parse(resp.getContentText());
  const bytes = Utilities.base64Decode(String(datos.content).replace(/\n/g, ''));
  return Utilities.newBlob(bytes).getDataAsString('UTF-8');
}

/*** ================= PROYECTO DE APPS SCRIPT ================= ***/
function urlProyecto_() {
  return 'https://script.googleapis.com/v1/projects/' + ScriptApp.getScriptId() + '/content';
}

function leerProyecto_() {
  const resp = UrlFetchApp.fetch(urlProyecto_(), {
    method: 'get',
    muteHttpExceptions: true,
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
  });
  const c = resp.getResponseCode();
  if (c === 403) {
    throw new Error('Falta activar la API de Apps Script.\n\n' +
      'Entra en script.google.com/home/usersettings y pon en ON ' +
      '"API de Google Apps Script". Luego vuelve a intentarlo.');
  }
  if (c !== 200) {
    throw new Error('No he podido leer el proyecto (error ' + c + ').');
  }
  return JSON.parse(resp.getContentText());
}

function escribirProyecto_(ficheros) {
  const limpios = ficheros.map(function (f) {
    return { name: f.name, type: f.type, source: f.source };
  });
  const resp = UrlFetchApp.fetch(urlProyecto_(), {
    method: 'put',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ files: limpios })
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('No he podido guardar el proyecto (error ' + resp.getResponseCode() + ').\n\n' +
      resp.getContentText().slice(0, 300));
  }
}

/*** ================= OPCIÓN: ACTUALIZAR EL PROGRAMA ================= ***/
function actualizarPrograma() {
  const ui = SpreadsheetApp.getUi();
  try {
    const clave = claveGitHub_(true);
    if (!clave) { ui.alert('Sin contraseña de GitHub no puedo descargar nada.'); return; }

    const nuevo = descargarDeGitHub_(clave);
    if (nuevo.indexOf(MARCA_SEGURA) === -1) {
      ui.alert('Lo que he descargado no parece el programa correcto. No he cambiado nada.');
      return;
    }

    const proyecto = leerProyecto_();
    const ficheros = proyecto.files || [];
    let destino = null;
    for (let i = 0; i < ficheros.length; i++) {
      if (ficheros[i].name === GAS_FICHERO && ficheros[i].type === 'SERVER_JS') {
        destino = ficheros[i];
        break;
      }
    }
    if (!destino) {
      destino = { name: GAS_FICHERO, type: 'SERVER_JS', source: '' };
      ficheros.push(destino);
    }
    if (destino.source === nuevo) {
      ui.alert('Ya tienes la última versión. No he cambiado nada.');
      return;
    }
    destino.source = nuevo;
    escribirProyecto_(ficheros);

    const m = nuevo.match(/const\s+VERSION\s*=\s*'([^']*)'/);
    ui.alert('Programa actualizado',
      'Versión instalada: ' + (m ? m[1] : 'desconocida') +
      '\n\nCierra y vuelve a abrir el cuaderno para que el menú se refresque.',
      ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('No he podido actualizar', e.message, ui.ButtonSet.OK);
  }
}
