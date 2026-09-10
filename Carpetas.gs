/*** ================= LA ESTRUCTURA DE CARPETAS DE DRIVE =================
 *
 * QUÉ ES ESTO. El sitio donde vive cada cosa en Drive, en un solo fichero.
 * Antes estaba repartido: un nombre de carpeta en Informes.gs, otro en
 * Orden.gs, y las búsquedas de ficheros mirando "la carpeta de datos y la de
 * arriba" sin más. Ahora hay un mapa, y todo el programa lo consulta aquí.
 *
 * POR QUÉ SE HIZO (10-sep-2026). Lo pidió Francisco: "los archivos que sí son
 * necesarios están casi todos juntos y sin una estructura lógica. Me gustaría
 * que crearas dicha estructura diferenciando las de descarga y las de
 * trabajo, pero que sea muy intuitivo el uso de este aplicativo."
 *
 * CÓMO QUEDA LA CARPETA:
 *
 *   GESTIÓN DE ALUMNADO                    <- la raíz: lo que Francisco abre
 *   │   BASE DE DATOS ALUMNADO             (los cuadernos, a la vista)
 *   │   INFORME-RESUMEN POR GRUPOS 26-27
 *   │   INFORME-RESUMEN BACHILLERATO 26-27
 *   │   MANUAL — descargas y actualización
 *   ├── 1. Descargas de Séneca             <- TODO lo que se baja de Séneca
 *   │   ├── Matrícula del curso                (los MatOMCMatr, ESO y BACH)
 *   │   ├── Histórico y censo                  (RegAlum.csv y RegAluNEE.csv)
 *   │   ├── Expedientes Primaria
 *   │   └── Expedientes Secundaria
 *   ├── 2. Ficheros del centro             <- lo que NO viene de Séneca
 *   │       AGRUPAMIENTOS · PROPUESTA MATRÍCULA · MEMBRETE
 *   ├── 3. Informes por unidad             <- LA QUE COMPARTE EL DIRECTOR
 *   ├── 4. Borradores (no compartir)
 *   └── 5. Archivo (el programa no lo mira)
 *
 * Los números fuerzan el orden en Drive, y ese orden es el del trabajo:
 * primero se descarga, después el programa produce.
 *
 * LA CARPETA "1. Descargas de Séneca" ES LA DE SIEMPRE. Es la misma carpeta
 * que hasta hoy se llamaba "Datos de matrícula": solo cambia de nombre, y el
 * programa la encuentra por su identificador (CARPETA_ID), no por el nombre.
 * Por eso renombrarla no rompe nada.
 *
 * NADIE TIENE QUE MOVER NADA A MANO. La cuarta opción del menú, "Ordenar la
 * carpeta de Drive" (Orden.gs), crea lo que falte, mueve cada fichero a su
 * sitio y renombra las carpetas que vengan con el nombre antiguo.
 *
 * Y MIENTRAS TANTO, TODO SIGUE FUNCIONANDO. Cada carpeta se busca primero por
 * su nombre nuevo y después por los antiguos, y no solo en su sitio de ahora,
 * también en el de antes ('tambienEn'). Así el programa encuentra los
 * ficheros estén ordenados o no, y Francisco puede pulsar el botón de ordenar
 * cuando le venga bien.
 *
 * ======================================================== ***/

/* El mapa. Para cambiar la estructura se toca esto y nada más.
     nombre    · cómo se llama la carpeta hoy
     padre     · de qué carpeta cuelga
     antes     · nombres que tuvo antes, para reconocerla y renombrarla
     tambienEn · dónde más hay que buscarla mientras no se haya ordenado    */
const CARPETAS = {
  raiz:       { nombre: '',                              padre: null },
  descargas:  { nombre: '1. Descargas de Séneca',        padre: 'raiz',
                antes: ['Datos de matrícula'] },
  matricula:  { nombre: 'Matrícula del curso',           padre: 'descargas' },
  historico:  { nombre: 'Histórico y censo',             padre: 'descargas' },
  primaria:   { nombre: 'Expedientes Primaria',          padre: 'descargas',
                tambienEn: ['raiz'] },
  secundaria: { nombre: 'Expedientes Secundaria',        padre: 'descargas',
                tambienEn: ['raiz'] },
  centro:     { nombre: '2. Ficheros del centro',        padre: 'raiz',
                tambienEn: ['descargas'] },
  informes:   { nombre: '3. Informes por unidad',        padre: 'raiz',
                antes: ['Informes por unidad'], tambienEn: ['descargas'] },
  borradores: { nombre: '4. Borradores (no compartir)',  padre: 'raiz',
                antes: ['Borradores (no compartir)', 'Borradores'],
                tambienEn: ['descargas', 'informes'] },
  archivo:    { nombre: '5. Archivo (el programa no lo mira)', padre: 'raiz',
                antes: ['Archivo (el programa no lo mira)'] }
};

/* Las carpetas donde el programa BUSCA ficheros sueltos, en este orden. La
   primera que tenga lo que se busca gana, así que van de la más concreta a la
   más general. Las dos últimas son el sitio de antes: mientras no se haya
   pulsado "Ordenar la carpeta de Drive", los ficheros siguen ahí.

   NO ESTÁN NI LOS EXPEDIENTES NI LOS INFORMES, y es a propósito: los
   expedientes son cientos de ficheros y listarlos aquí haría lenta cada
   ejecución. Cada uno se lista por su cuenta cuando hace falta. */
const CARPETAS_DE_BUSQUEDA = ['matricula', 'historico', 'centro', 'descargas', 'raiz'];

let CACHE_CARPETAS_SISTEMA_ = {};

/* La carpeta de una clave del mapa. Con crear = true, la crea si no existe.
   Con crear = false, devuelve null y no molesta.
   Se busca por el nombre de ahora y por los de antes, en su sitio y en los
   sitios donde pudo quedarse. Nunca mueve nada: mover es cosa de Orden.gs. */
function carpetaDe_(clave, crear) {
  if (CACHE_CARPETAS_SISTEMA_[clave]) return CACHE_CARPETAS_SISTEMA_[clave];
  const def = CARPETAS[clave];
  if (!def) return null;

  let carpeta = null;

  if (clave === 'descargas') {
    /* Es la de siempre, la del identificador. Se llame como se llame. */
    try { carpeta = DriveApp.getFolderById(CARPETA_ID); } catch (e) { carpeta = null; }
  } else if (clave === 'raiz') {
    try {
      const datos = DriveApp.getFolderById(CARPETA_ID);
      const padres = datos.getParents();
      carpeta = padres.hasNext() ? padres.next() : datos;
    } catch (e) { carpeta = null; }
  } else {
    /* EL NOMBRE MANDA SOBRE EL SITIO, y el orden de estos dos bucles es lo que
       lo decide. Primero se busca el nombre de ahora en TODOS los sitios, y
       solo después los nombres antiguos. Al revés, una carpeta cualquiera
       llamada "Borradores" que Francisco tuviera arriba le ganaría a la de
       verdad, que se llama "4. Borradores (no compartir)". */
    const nombres = [def.nombre].concat(def.antes || []);
    const donde = [def.padre].concat(def.tambienEn || []);
    for (let n = 0; n < nombres.length && !carpeta; n++) {
      for (let d = 0; d < donde.length && !carpeta; d++) {
        const base = carpetaDe_(donde[d], false);
        if (!base) continue;
        try {
          const it = base.getFoldersByName(nombres[n]);
          if (it.hasNext()) carpeta = it.next();
        } catch (e) { /* si Drive no deja mirar, se prueba el siguiente sitio */ }
      }
    }
    if (!carpeta && crear) {
      const base = carpetaDe_(def.padre, true);
      if (base) {
        try { carpeta = base.createFolder(def.nombre); } catch (e) { carpeta = null; }
      }
    }
  }

  if (carpeta) CACHE_CARPETAS_SISTEMA_[clave] = carpeta;
  return carpeta;
}

/* El nombre que debe tener una carpeta. Para escribirlo en los avisos sin
   tener que abrir Drive. */
function nombreDeCarpeta_(clave) {
  return CARPETAS[clave] ? CARPETAS[clave].nombre : '';
}

/* Las carpetas donde se buscan los ficheros sueltos, en orden. Lo usa
   carpetasDondeBuscar() (Codigo.gs), que es de quien tira ficherosPorCarpeta_
   (Ficheros.gs). Las que todavía no existan se saltan, sin crear nada. */
function carpetasDeBusqueda_() {
  const lista = [];
  const vistas = {};
  for (let i = 0; i < CARPETAS_DE_BUSQUEDA.length; i++) {
    const c = carpetaDe_(CARPETAS_DE_BUSQUEDA[i], false);
    if (!c) continue;
    const id = c.getId();
    if (vistas[id]) continue;      // la de descargas y la raíz no se repiten
    vistas[id] = true;
    lista.push(c);
  }
  return lista;
}
