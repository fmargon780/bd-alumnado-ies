/*** ================= EL CUADERNO DE INFORMES DE BACHILLERATO =================
 *
 * QUÉ ES ESTO. Los informes por unidad del alumnado de Bachillerato, en un
 * cuaderno propio, separado del de la ESO. Lo pidió Francisco:
 * "los informes deben generarse de forma independiente".
 *
 * POR QUÉ UN CUADERNO APARTE Y NO SEIS PESTAÑAS MÁS EN EL DE LA ESO:
 *
 * 1. Las columnas no son las mismas. En Bachillerato no hay PIL ni
 *    diversificación, y en cambio hay una columna de materias que en la ESO
 *    no existe.
 * 2. La portada cuenta las cifras del centro. Mezclando las dos etapas, los
 *    números de PIL y de diversificación dejarían de significar nada.
 * 3. Se pueden entregar por separado sin tocar el otro. El cuaderno de la
 *    ESO, con sus 23 pestañas ya afinadas, se queda como está.
 *
 * QUÉ NO HACE ESTE FICHERO. No repite el trabajo de Informes.gs: la
 * maquinaria de rellenar una pestaña, poner el membrete, escribir la leyenda,
 * repartir los anchos y exportar el PDF es la misma para las dos etapas, y
 * vive allí. Aquí solo está lo que Bachillerato tiene de propio: encontrar (o
 * crear) su cuaderno y crear las pestañas de grupo que falten.
 *
 * EL CUADERNO SE CREA SOLO la primera vez que se pulsa "Actualizar los
 * datos". Francisco no tiene que preparar nada a mano. Su identificador se
 * guarda en el propio cuaderno de la base de datos, y además se sabe
 * encontrar por su nombre, así que moverlo o renombrarlo no lo rompe.
 *
 * ======================================================== ***/

const NOMBRE_INFORMES_BAC = 'INFORME-RESUMEN BACHILLERATO';
const PROP_ID_INFORMES_BAC = 'ID_INFORMES_BAC';

/*** ================= ENCONTRAR O CREAR EL CUADERNO ================= ***/

/* Devuelve el cuaderno de informes de Bachillerato.
   crear = true  -> si no existe, lo crea.
   crear = false -> si no existe, devuelve null y no molesta. Es lo que hacen
                    los botones de los PDF: si todavía no hay cuaderno, sacan
                    los de la ESO y ya está. */
function libroDeBachillerato_(crear) {
  /* 1. Por el identificador guardado. Es el camino normal. */
  let guardado = '';
  try {
    guardado = PropertiesService.getDocumentProperties()
      .getProperty(PROP_ID_INFORMES_BAC) || '';
  } catch (e) { guardado = ''; }
  if (guardado) {
    try { return SpreadsheetApp.openById(guardado); }
    catch (e) { /* lo habrán borrado o movido a la papelera: se busca abajo */ }
  }

  /* 2. Por su nombre, en las carpetas de trabajo. Así, si alguien lo mueve o
        lo renombra a medias, se vuelve a encontrar en vez de crear otro. */
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    for (let i = 0; i < listas[c].length; i++) {
      const f = listas[c][i];
      if (String(f.getMimeType()) !== MimeType.GOOGLE_SHEETS) continue;
      if (normalizar(f.getName()).indexOf(normalizar(NOMBRE_INFORMES_BAC)) === -1) continue;
      /* Y del curso de ahora. Sin esto, el año que viene, si se hubiera
         perdido el identificador guardado, se escribirían los grupos nuevos
         dentro del cuaderno del curso pasado. Es la misma comprobación que
         hacen los CSV de matrícula. */
      if (f.getName().indexOf(CURSO_ACTUAL) === -1) continue;
      guardarIdBachillerato_(f.getId());
      return SpreadsheetApp.openById(f.getId());
    }
  }

  if (!crear) return null;

  /* 3. No existe: se crea, y se deja al lado de la carpeta de trabajo. */
  const libro = SpreadsheetApp.create(NOMBRE_INFORMES_BAC + ' ' + CURSO_ACTUAL);
  try {
    const archivo = DriveApp.getFileById(libro.getId());
    const datos = DriveApp.getFolderById(CARPETA_ID);
    const padres = datos.getParents();
    archivo.moveTo(padres.hasNext() ? padres.next() : datos);
  } catch (e) { /* si no se puede mover, se queda en Mi unidad; funciona igual */ }
  guardarIdBachillerato_(libro.getId());
  return libro;
}

function guardarIdBachillerato_(id) {
  try {
    PropertiesService.getDocumentProperties().setProperty(PROP_ID_INFORMES_BAC, id);
  } catch (e) { /* sin guardar, la próxima vez se encuentra por el nombre */ }
}

/*** ================= LOS GRUPOS ================= ***/

/* Los grupos de Bachillerato que hay este curso, con su modalidad, sacados de
   la matrícula. Devuelve [{ grupo: '1º BACH A', modalidad: '...' }, ...]. */
function gruposDeBachillerato_() {
  const bac = alumnadoDeBachillerato_();
  const vistos = {}, lista = [];
  for (const curso in bac.porCurso) {
    const alumnos = bac.porCurso[curso];
    for (let i = 0; i < alumnos.length; i++) {
      const g = String(alumnos[i].unidad || '').trim().replace(/\s+/g, ' ');
      if (!g || vistos[g]) continue;
      vistos[g] = true;
      lista.push({ grupo: g, modalidad: (alumnos[i].valores || {})['MODALIDAD'] || '' });
    }
  }
  lista.sort(function (a, b) { return a.grupo < b.grupo ? -1 : (a.grupo > b.grupo ? 1 : 0); });
  return lista;
}

/*** ================= CREAR LAS PESTAÑAS QUE FALTEN ================= ***/

/* Deja el cuaderno con una pestaña por grupo. De cada pestaña nueva solo hace
   falta dejar dos cosas, porque de todo lo demás se encarga Informes.gs:
     - la fila 7, con el rótulo del grupo, que es por donde el programa
       reconoce que esa pestaña es un grupo;
     - la fila 9, con el título "Alumno/a:", porque una pestaña sin él se
       considera a medias y no se toca.
   La modalidad se escribe también en la fila 7, en su propia casilla: así se
   lee una vez en la cabecera del folio en vez de repetirla en cada fila. */
function crearPestanasBachillerato_(libro, grupos, avisos) {
  let creadas = 0;
  for (let i = 0; i < grupos.length; i++) {
    const g = grupos[i].grupo;
    if (libro.getSheetByName(g)) continue;

    let hoja = null;
    /* Un cuaderno recién creado trae una hoja vacía de fábrica. Se aprovecha
       en vez de dejarla ahí molestando. */
    const hojas = libro.getSheets();
    if (hojas.length === 1 && hojas[0].getLastRow() === 0) {
      hoja = hojas[0].setName(g);
    } else {
      hoja = libro.insertSheet(g);
    }

    try {
      hoja.getRange(FILA_GRUPO, 2).setValue('INFORME-RESUMEN DEL GRUPO:').setFontWeight('bold');
      hoja.getRange(FILA_GRUPO, 3).setValue(g).setFontWeight('bold');
      if (grupos[i].modalidad) {
        hoja.getRange(FILA_GRUPO, 4).setValue('· ' + grupos[i].modalidad).setFontStyle('italic');
      }
      hoja.getRange(FILA_TITULOS, 2).setValue('Alumno/a:');
      creadas++;
    } catch (e) {
      avisos.push([g, hoja ? hoja.getName() : '', 'No he podido preparar la pestaña', e.message]);
    }
  }

  /* Las pestañas, en orden: 1º BACH A, B, C, 2º BACH A... Solo se recolocan
     cuando se acaba de crear alguna: si se hiciera en cada actualización, la
     portada iría bailando de sitio sin motivo. */
  if (creadas) {
    for (let i = 0; i < grupos.length; i++) {
      const h = libro.getSheetByName(grupos[i].grupo);
      if (h) { libro.setActiveSheet(h); libro.moveActiveSheet(i + 1); }
    }
  }
  return creadas;
}

/*** ================= EL PUNTO DE ENTRADA ================= ***/

/* Lo llama rellenarPestanasInformes_ (Informes.gs) después de hacer la ESO.
   Devuelve null si no hay alumnado de Bachillerato: entonces no se crea
   ningún cuaderno, para no dejar por ahí un cuaderno vacío en los centros que
   no tengan Bachillerato. */
function rellenarBachillerato_(avisos) {
  const grupos = gruposDeBachillerato_();
  if (!grupos.length) {
    /* No hay matrícula de Bachillerato en la carpeta. Si es un centro sin
       Bachillerato, no hay nada que decir. Pero si el cuaderno ya existe, sus
       pestañas se quedan con los datos de la última vez, y quien saque los PDF
       los daría por buenos: eso sí hay que decirlo. */
    let existe = null;
    try { existe = libroDeBachillerato_(false); } catch (e) { existe = null; }
    if (existe) {
      avisos.push(['', '', 'El cuaderno de Bachillerato no se ha actualizado',
        'No he encontrado los CSV de matrícula de Bachillerato en la carpeta, así que ' +
        'sus pestañas se han quedado con los datos de la última vez. Vuelve a dejar los ' +
        'cuatro ficheros en la carpeta de descargas y pulsa otra vez "1. Actualizar los datos".']);
    }
    return null;
  }

  const libro = libroDeBachillerato_(true);
  if (!libro) {
    avisos.push(['', '', 'No he podido crear el cuaderno de Bachillerato',
      'Se intentará otra vez en la próxima actualización.']);
    return null;
  }
  crearPestanasBachillerato_(libro, grupos, avisos);
  return rellenarUnCuaderno_(libro, 'BACH', avisos);
}
