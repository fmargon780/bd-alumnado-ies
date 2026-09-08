/*** ================= ORDENAR LA CARPETA DE DRIVE =================
 *
 * Añadido en la BD v46, el 8-sep-2026. Lo pidió Francisco: "la carpeta en la
 * que inicié este trabajo se me ha llenado de archivos y otras subcarpetas.
 * Me gustaría poder limpiar lo que sobra y estructurar bien lo que debe
 * quedarse."
 *
 * POR QUÉ LO HACE EL PROGRAMA Y NO SE ARRASTRA A MANO. Los ficheros son de la
 * cuenta del instituto, así que solo puede moverlos alguien que entre con esa
 * cuenta. El script se ejecuta con ella, así que puede hacerlo él solo.
 *
 * QUÉ HACE. Deja las dos carpetas así:
 *
 *   Carpeta de arriba (la que contiene a "Datos de matrícula")
 *     · los cuadernos de Google: la base de datos, los informes, las notas
 *     · la carpeta "Datos de matrícula"
 *     · la carpeta "Archivo (el programa no lo mira)"
 *
 *   Datos de matrícula   ->  SOLO lo que se descarga de Séneca
 *     · RegAlum.csv · RegAluNEE.csv · los cuatro MatOMCMatr del curso actual
 *     · el cuaderno AGRUPAMIENTOS de Jefatura
 *     · la imagen MEMBRETE
 *     · las tres subcarpetas: Expedientes Primaria, Expedientes Secundaria,
 *       Informes por unidad
 *
 *   Archivo (el programa no lo mira)  ->  todo lo demás
 *     · los CSV de matrícula de cursos anteriores
 *     · los Excel originales de los que salieron los cuadernos
 *     · cualquier otro fichero suelto
 *
 * TRES REGLAS DE SEGURIDAD:
 *
 *   1. NO BORRA NADA. Solo mueve. Todo sigue estando a un clic.
 *   2. NO TOCA NINGÚN CUADERNO DE GOOGLE. Si un cuaderno estuviera donde no
 *      debe, lo dice, pero no lo mueve: puede tener enlaces y marcadores.
 *   3. NO ENTRA EN LAS SUBCARPETAS. Los expedientes y los PDF se quedan
 *      exactamente donde están.
 *
 * Si un fichero no se deja mover (porque es de otra cuenta), lo anota y sigue
 * con los demás.
 *
 * ======================================================== ***/

const CARPETA_ARCHIVO = 'Archivo (el programa no lo mira)';

/* Las subcarpetas del sistema, que no se tocan nunca. */
const SUBCARPETAS_DEL_SISTEMA = ['Expedientes Primaria', 'Expedientes Secundaria',
                                 'Informes por unidad'];

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

/*** ================= LA OPCIÓN DE MENÚ ================= ***/

function ordenarCarpeta() {
  let datos, arriba;
  try {
    datos = DriveApp.getFolderById(CARPETA_ID);
    const padres = datos.getParents();
    arriba = padres.hasNext() ? padres.next() : null;
  } catch (e) {
    avisar_('No he podido abrir la carpeta de datos', e.message);
    return;
  }
  if (!arriba) {
    avisar_('No he podido ordenar la carpeta',
      'La carpeta "' + datos.getName() + '" no está dentro de ninguna otra, ' +
      'así que no sé dónde poner el archivo.');
    return;
  }

  /* La carpeta del archivo, dentro de la de arriba. */
  let archivo;
  try {
    const hay = arriba.getFoldersByName(CARPETA_ARCHIVO);
    archivo = hay.hasNext() ? hay.next() : arriba.createFolder(CARPETA_ARCHIVO);
  } catch (e) {
    avisar_('No he podido crear la carpeta del archivo', e.message);
    return;
  }

  const aArchivo = [], aDatos = [], noSePueden = [], cuadernos = [];

  /* ---------- 1. La carpeta de datos ---------- */
  let yaHayMembrete = false;
  const enDatos = datos.getFiles();
  while (enDatos.hasNext()) {
    const f = enDatos.next();
    const papel = papelDelFichero_(f);
    if (papel === 'cuaderno') { cuadernos.push(f.getName()); continue; }
    if (papel === 'historico' || papel === 'neae' || papel === 'matricula') continue;
    if (papel === 'membrete') {
      /* El membrete bueno es uno solo. Si hubiera más de uno, el programa no
         sabría cuál coge, así que los de más se archivan. */
      if (!yaHayMembrete) { yaHayMembrete = true; continue; }
    }
    const fallo = moverArchivo_(f, archivo);
    if (fallo) noSePueden.push(f.getName() + ' (' + fallo + ')');
    else aArchivo.push(f.getName());
  }

  /* ---------- 2. La carpeta de arriba ---------- */
  const enArriba = arriba.getFiles();
  while (enArriba.hasNext()) {
    const f = enArriba.next();
    const papel = papelDelFichero_(f);
    if (papel === 'cuaderno') continue;      // los cuadernos viven aquí: es su sitio
    if (papel === 'historico' || papel === 'neae' || papel === 'matricula') {
      /* Los ficheros de Séneca van todos juntos, en la carpeta de datos. */
      const fallo = moverArchivo_(f, datos);
      if (fallo) noSePueden.push(f.getName() + ' (' + fallo + ')');
      else aDatos.push(f.getName());
      continue;
    }
    if (papel === 'membrete' && !yaHayMembrete) {
      const fallo = moverArchivo_(f, datos);
      if (fallo) noSePueden.push(f.getName() + ' (' + fallo + ')');
      else { aDatos.push(f.getName()); yaHayMembrete = true; }
      continue;
    }
    const fallo = moverArchivo_(f, archivo);
    if (fallo) noSePueden.push(f.getName() + ' (' + fallo + ')');
    else aArchivo.push(f.getName());
  }

  /* ---------- 3. Qué ha quedado ---------- */
  const quedan = [];
  const finales = datos.getFiles();
  while (finales.hasNext()) quedan.push(finales.next().getName());
  quedan.sort();

  const faltan = [];
  const carpetasDentro = {};
  const subs = datos.getFolders();
  while (subs.hasNext()) carpetasDentro[subs.next().getName()] = true;
  for (let i = 0; i < SUBCARPETAS_DEL_SISTEMA.length; i++) {
    if (!carpetasDentro[SUBCARPETAS_DEL_SISTEMA[i]]) faltan.push(SUBCARPETAS_DEL_SISTEMA[i]);
  }

  /* ---------- 4. Contarlo ---------- */
  const lineas = [];
  lineas.push('Carpeta de datos: "' + datos.getName() + '".');
  lineas.push('Carpeta de arriba: "' + arriba.getName() + '".');
  lineas.push('');
  lineas.push('MOVIDOS AL ARCHIVO: ' + aArchivo.length +
              (aArchivo.length ? ' → ' + aArchivo.join(', ') : ''));
  lineas.push('TRAÍDOS A LA CARPETA DE DATOS: ' + aDatos.length +
              (aDatos.length ? ' → ' + aDatos.join(', ') : ''));
  if (noSePueden.length) {
    lineas.push('NO HE PODIDO MOVER: ' + noSePueden.join(' · ') +
                '. Suelen ser ficheros de otra cuenta: muévelos tú a mano.');
  }
  lineas.push('');
  lineas.push('EN LA CARPETA DE DATOS SE QUEDAN: ' + quedan.join(', '));
  if (faltan.length) {
    lineas.push('OJO, faltan estas subcarpetas: ' + faltan.join(', ') + '.');
  }
  if (cuadernos.length) {
    lineas.push('');
    lineas.push('Cuadernos de Google que están en la carpeta de datos: ' +
                cuadernos.join(' · ') + '. No los muevo yo, por si tienes enlaces ' +
                'guardados. Si quieres, arrástralos tú a la carpeta de arriba.');
  }

  avisar_('Carpeta ordenada (' + VERSION + ')', lineas.join('\n'));
}
