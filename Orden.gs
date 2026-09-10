/*** ================= ORDENAR LA CARPETA DE DRIVE =================
 *
 * Añadido en la BD v46, el 8-sep-2026. Lo pidió Francisco: "la carpeta en la
 * que inicié este trabajo se me ha llenado de archivos y otras subcarpetas.
 * Me gustaría poder limpiar lo que sobra y estructurar bien lo que debe
 * quedarse."
 *
 * Y REHECHO EN LA BD v54, el 10-sep-2026, también a petición suya: "los
 * archivos que sí son necesarios están casi todos juntos y sin una estructura
 * lógica. Me gustaría que crearas dicha estructura diferenciando las de
 * descarga y las de trabajo, pero que sea muy intuitivo el uso de este
 * aplicativo."
 *
 * POR QUÉ LO HACE EL PROGRAMA Y NO SE ARRASTRA A MANO. Los ficheros son de la
 * cuenta del instituto, así que solo puede moverlos alguien que entre con esa
 * cuenta. El script se ejecuta con ella, así que puede hacerlo él solo.
 *
 * CÓMO DEJA LA CARPETA. La estructura entera está en el mapa de Carpetas.gs.
 * Aquí solo se dice a qué carpeta va cada fichero:
 *
 *   GESTIÓN DE ALUMNADO                 <- la raíz: lo que Francisco abre
 *   │   los cuadernos de Google y el manual
 *   ├── 1. Descargas de Séneca          <- TODO lo que se baja de Séneca
 *   │   ├── Matrícula del curso             los MatOMCMatr de este curso
 *   │   ├── Histórico y censo               RegAlum.csv y RegAluNEE.csv
 *   │   ├── Expedientes Primaria
 *   │   └── Expedientes Secundaria
 *   ├── 2. Ficheros del centro          <- lo que NO viene de Séneca
 *   │       AGRUPAMIENTOS · PROPUESTA MATRÍCULA · MEMBRETE
 *   ├── 3. Informes por unidad          <- LA QUE COMPARTE EL DIRECTOR
 *   ├── 4. Borradores (no compartir)
 *   └── 5. Archivo (el programa no lo mira)
 *
 * Los números fuerzan el orden en Drive, y ese orden es el del trabajo:
 * primero se descarga, después el programa produce.
 *
 * CUATRO REGLAS DE SEGURIDAD:
 *
 *   1. NO BORRA NADA. Solo mueve. Todo sigue estando a un clic.
 *   2. NO ENTRA EN LAS SUBCARPETAS de expedientes, informes ni borradores. Lo
 *      que hay dentro se queda exactamente donde está.
 *   3. LOS CUADERNOS DE GOOGLE se mueven, pero solo entre las carpetas del
 *      sistema, y nunca al archivo. Mover un cuaderno no rompe ningún enlace:
 *      un enlace de Drive lleva el identificador dentro, no la ruta.
 *   4. SI ALGO NO SE DEJA MOVER, se anota y se sigue con lo demás.
 *
 * ======================================================== ***/

/*** ================= QUÉ ES CADA FICHERO ================= ***/

/* Devuelve qué papel tiene un fichero en el sistema:
     'historico'  · 'neae' · 'matricula' · 'matricula-vieja'
     'membrete'   · 'cuaderno' · 'otro'                              */
function papelDelFichero_(archivo) {
  const nombre = archivo.getName();
  const tipo = String(archivo.getMimeType());

  if (tipo === MimeType.GOOGLE_SHEETS || tipo === MimeType.GOOGLE_DOCS ||
      tipo === MimeType.GOOGLE_SLIDES || tipo === MimeType.GOOGLE_FORMS) return 'cuaderno';

  if (tipo.indexOf('image/') === 0) {
    const sinExt = normalizar(nombre.replace(/\.[^.]+$/, ''));
    if (sinExt === NOMBRE_MEMBRETE) return 'membrete';
    return 'otro';
  }

  if (/\.csv$/i.test(nombre)) {
    const n = normalizar(nombre);
    if (n.indexOf(normalizar('RegAlum')) === 0) return 'historico';
    if (n.indexOf(normalizar(PREFIJO_NEAE)) === 0) return 'neae';
    if (n.indexOf('matomcmatr') === 0) {
      return nombre.indexOf(CURSO_ACTUAL) === -1 ? 'matricula-vieja' : 'matricula';
    }
  }
  return 'otro';
}

/* Los cuadernos que son una FUENTE del programa viven con los ficheros del
   centro. Los demás (la base de datos, los informes, el manual) se quedan
   arriba, a la vista. Se reconocen por el nombre, que es como los busca el
   resto del programa. */
function cuadernoDelCentro_(nombre) {
  const n = normalizar(nombre);
  if (n.indexOf('agrupamientos') !== -1) return true;
  /* "propuesta" a secas es demasiado poco: en la carpeta puede haber una
     "PROPUESTA de actividades extraescolares" que no tiene nada que ver. El
     cuaderno de notas se llama "PROPUESTA MATRÍCULA". */
  return n.indexOf('propuesta') !== -1 && n.indexOf('matricula') !== -1;
}

/* A qué carpeta del mapa le toca ir a este fichero. Devuelve la clave de
   Carpetas.gs, o '' si hay que dejarlo donde está.

   EN LA CARPETA DE ARRIBA SOLO SE TOCA LO QUE ES NUESTRO, y esto importa: esa
   carpeta puede ser una carpeta general del centro, con cosas que no tienen
   nada que ver con este programa. Un fichero que no se reconoce como una
   descarga de Séneca ni como el membrete se queda donde está. Dentro de la
   carpeta de descargas sí se barre todo, porque esa carpeta es solo nuestra. */
function destinoDelFichero_(archivo, yaHayMembrete, esLaRaiz, barrerLaRaiz) {
  const papel = papelDelFichero_(archivo);
  if (papel === 'historico' || papel === 'neae') return 'historico';
  if (papel === 'matricula') return 'matricula';
  if (papel === 'matricula-vieja') return 'archivo';
  if (papel === 'membrete') return yaHayMembrete ? 'archivo' : 'centro';
  if (papel === 'cuaderno') {
    /* Un cuaderno de Google nunca se saca de la carpeta de arriba: es donde
       tienen que estar la base de datos, los informes y el manual. */
    if (esLaRaiz) return '';
    return cuadernoDelCentro_(archivo.getName()) ? 'centro' : 'raiz';
  }
  if (esLaRaiz && !barrerLaRaiz) return '';
  return 'archivo';
}

/*** ================= MOVER, CON RED ================= ***/

/* Mueve un fichero y devuelve '' si ha podido, o el motivo si no.
   moveTo es lo moderno; si la cuenta no lo tuviera, se hace a la antigua. */
function moverArchivo_(archivo, destino) {
  try {
    archivo.moveTo(destino);
    return '';
  } catch (e) {
    try {
      destino.addFile(archivo);
      const padres = archivo.getParents();
      while (padres.hasNext()) {
        const p = padres.next();
        if (p.getId() !== destino.getId()) p.removeFile(archivo);
      }
      return '';
    } catch (e2) {
      return e2.message;
    }
  }
}

/* Lo mismo con una carpeta. Se usa para colocar en su sitio las carpetas del
   sistema que estuvieran donde no toca. */
function moverCarpeta_(carpeta, destino) {
  try { carpeta.moveTo(destino); return ''; }
  catch (e) { return e.message; }
}

/* ¿Está esta carpeta dentro de esa otra? */
function cuelgaDe_(carpeta, padre) {
  try {
    const padres = carpeta.getParents();
    while (padres.hasNext()) {
      if (padres.next().getId() === padre.getId()) return true;
    }
  } catch (e) { /* si no se puede mirar, mejor no moverla */ return true; }
  return false;
}

/*** ================= LA OPCIÓN DE MENÚ ================= ***/

function ordenarCarpeta() {
  const raiz = carpetaDe_('raiz', false);
  const descargas = carpetaDe_('descargas', false);
  if (!raiz || !descargas) {
    avisar_('No he podido ordenar la carpeta',
      'No he podido abrir la carpeta de trabajo en Drive. Vuelve a intentarlo dentro de un rato.');
    return;
  }
  if (raiz.getId() === descargas.getId()) {
    avisar_('No he podido ordenar la carpeta',
      'La carpeta "' + descargas.getName() + '" no está dentro de ninguna otra, así que no ' +
      'tengo dónde crear la estructura. Métela dentro de una carpeta y vuelve a pulsar.');
    return;
  }

  const noSePueden = [], creadas = [], recolocadas = [], repetidas = [];
  let informesMovida = false;

  /* ¿SE PUEDE BARRER LA CARPETA DE ARRIBA? Solo si es una carpeta de verdad,
     dentro de otra. Si la carpeta de descargas colgara directamente de "Mi
     unidad", la de arriba sería la unidad entera de Francisco, y ahí no se
     toca ni un fichero: no son nuestros. */
  let barrerLaRaiz = false;
  try { barrerLaRaiz = raiz.getParents().hasNext(); } catch (e) { barrerLaRaiz = false; }

  /* ---------- 1. La carpeta de descargas, con su nombre ---------- */
  if (descargas.getName() !== nombreDeCarpeta_('descargas')) {
    try {
      recolocadas.push('"' + descargas.getName() + '" pasa a llamarse "' +
                       nombreDeCarpeta_('descargas') + '"');
      descargas.setName(nombreDeCarpeta_('descargas'));
    } catch (e) { noSePueden.push('renombrar la carpeta de descargas (' + e.message + ')'); }
  }

  /* ---------- 2. Las carpetas del sistema, cada una en su sitio ---------- */
  const claves = ['matricula', 'historico', 'primaria', 'secundaria',
                  'centro', 'informes', 'borradores', 'archivo'];
  const carpetas = {};
  for (let i = 0; i < claves.length; i++) {
    const clave = claves[i];
    const antes = carpetaDe_(clave, false);
    const carpeta = carpetaDe_(clave, true);
    if (!carpeta) { noSePueden.push('crear la carpeta "' + nombreDeCarpeta_(clave) + '"'); continue; }
    carpetas[clave] = carpeta;
    if (!antes) { creadas.push(carpeta.getName()); continue; }

    /* Estaba, pero puede que en otro sitio o con el nombre de antes. */
    const padre = carpetaDe_(CARPETAS[clave].padre, true);
    if (padre && !cuelgaDe_(carpeta, padre)) {
      const fallo = moverCarpeta_(carpeta, padre);
      if (fallo) noSePueden.push('mover la carpeta "' + carpeta.getName() + '" (' + fallo + ')');
      else {
        recolocadas.push('"' + carpeta.getName() + '" se va a "' + padre.getName() + '"');
        if (clave === 'informes') informesMovida = true;
      }
    }
    if (carpeta.getName() !== nombreDeCarpeta_(clave)) {
      try {
        recolocadas.push('"' + carpeta.getName() + '" pasa a llamarse "' +
                         nombreDeCarpeta_(clave) + '"');
        carpeta.setName(nombreDeCarpeta_(clave));
      } catch (e) { noSePueden.push('renombrar "' + carpeta.getName() + '" (' + e.message + ')'); }
    }
  }

  /* ---------- 2 bis. ¿Hay dos carpetas que se llaman igual? ----------
     Si las hay, el programa usa una y la otra se queda ahí, con lo que tenga
     dentro, sin que nadie lo mire. No se tocan: solo se dicen. Elegir por su
     cuenta cuál es la buena es justo lo que no debe hacer un programa que
     mueve ficheros ajenos. */
  const elegidas = {};
  elegidas[descargas.getId()] = true;
  for (const k in carpetas) elegidas[carpetas[k].getId()] = true;
  const nombresDelSistema = {};
  for (const clave in CARPETAS) {
    const def = CARPETAS[clave];
    if (!def.nombre) continue;
    nombresDelSistema[normalizar(def.nombre)] = true;
    const antes = def.antes || [];
    for (let a = 0; a < antes.length; a++) nombresDelSistema[normalizar(antes[a])] = true;
  }
  const miradas = [raiz, descargas];
  for (let i = 0; i < miradas.length; i++) {
    try {
      const it = miradas[i].getFolders();
      while (it.hasNext()) {
        const c = it.next();
        if (elegidas[c.getId()]) continue;
        if (!nombresDelSistema[normalizar(c.getName())]) continue;
        repetidas.push('"' + c.getName() + '" dentro de "' + miradas[i].getName() + '"');
      }
    } catch (e) { /* si no se deja mirar, se sigue */ }
  }

  /* ---------- 3. Cada fichero, a su carpeta ---------- */
  /* Se miran las carpetas donde puede haber ficheros sueltos. NO se entra en
     los expedientes, ni en los informes, ni en los borradores: lo que hay ahí
     dentro no se toca. */
  /* El orden importa por el MEMBRETE: si hubiera dos, gana el que esté en la
     carpeta del centro, y después el de descargas. La raíz va la última. */
  const dondeMirar = ['centro', 'descargas', 'matricula', 'historico', 'raiz'];
  const movidos = {}, sinTocar = [];
  let yaHayMembrete = false;

  for (let i = 0; i < dondeMirar.length; i++) {
    const origen = carpetaDe_(dondeMirar[i], false);
    if (!origen) continue;
    /* La lista se saca entera ANTES de mover nada: si se fuera moviendo
       mientras se recorre, Drive podría saltarse ficheros. */
    const lista = [];
    try {
      const it = origen.getFiles();
      while (it.hasNext()) lista.push(it.next());
    } catch (e) { noSePueden.push('mirar la carpeta "' + origen.getName() + '" (' + e.message + ')'); }

    const esLaRaiz = origen.getId() === raiz.getId();
    for (let k = 0; k < lista.length; k++) {
      const f = lista[k];
      const clave = destinoDelFichero_(f, yaHayMembrete, esLaRaiz, barrerLaRaiz);
      if (!clave) continue;                     // ni es nuestro ni se toca
      const destino = clave === 'raiz' ? raiz : carpetas[clave];
      if (!destino) continue;
      const esMembrete = papelDelFichero_(f) === 'membrete';
      if (destino.getId() === origen.getId()) {
        sinTocar.push(f.getName());
        if (esMembrete && clave === 'centro') yaHayMembrete = true;
        continue;
      }
      const fallo = moverArchivo_(f, destino);
      if (fallo) { noSePueden.push(f.getName() + ' (' + fallo + ')'); continue; }
      if (esMembrete && clave === 'centro') yaHayMembrete = true;
      if (!movidos[destino.getName()]) movidos[destino.getName()] = [];
      movidos[destino.getName()].push(f.getName());
    }
  }

  /* ---------- 4. Contarlo ---------- */
  const lineas = [];
  lineas.push('Carpeta de trabajo: "' + raiz.getName() + '".');
  lineas.push('');
  if (creadas.length) lineas.push('CARPETAS NUEVAS: ' + creadas.join(' · '));
  if (recolocadas.length) lineas.push('CARPETAS COLOCADAS: ' + recolocadas.join(' · '));
  if (creadas.length || recolocadas.length) lineas.push('');

  let total = 0;
  for (const nombre in movidos) {
    lineas.push('A "' + nombre + '" (' + movidos[nombre].length + '): ' +
                movidos[nombre].join(', '));
    total += movidos[nombre].length;
  }
  if (!total) lineas.push('No he tenido que mover ningún fichero: ya estaba todo en su sitio.');
  lineas.push('');
  if (sinTocar.length) lineas.push('YA ESTABAN EN SU SITIO: ' + sinTocar.length + ' ficheros.');
  if (noSePueden.length) {
    lineas.push('NO HE PODIDO: ' + noSePueden.join(' · ') +
                '. Suele ser porque el fichero es de otra cuenta: muévelo tú a mano.');
  }
  if (repetidas.length) {
    lineas.push('');
    lineas.push('OJO, CARPETAS REPETIDAS: ' + repetidas.join(' · ') + '. Hay dos que se ' +
                'llaman igual, y el programa solo usa una. No las he tocado: mira qué tienen ' +
                'dentro y déjalo en una sola.');
  }
  if (informesMovida) {
    lineas.push('');
    lineas.push('AVISO SOBRE LA CARPETA QUE SE COMPARTE: he movido "' +
                nombreDeCarpeta_('informes') + '" a "' + raiz.getName() + '". Si el director ' +
                'la había compartido, el enlace sigue valiendo, porque un enlace de Drive no ' +
                'lleva la ruta dentro. Pero si lo que compartió fue la carpeta de arriba, ' +
                'tendrá que volver a compartir esta. Compruébalo con él.');
  }
  lineas.push('');
  lineas.push('No he borrado nada: solo he movido. Y no he mirado lo que hay DENTRO de las ' +
              'carpetas de expedientes, de informes ni de borradores: eso se queda como está.');

  avisar_('Carpeta ordenada (' + VERSION + ')', lineas.join('\n'));
}
