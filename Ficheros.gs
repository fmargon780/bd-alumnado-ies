/*** ================= LA LISTA DE FICHEROS DE DRIVE =================
 *
 * QUÉ ES ESTO. Dentro de una misma pulsación de "Actualizar los datos", varias
 * partes del programa necesitan saber qué ficheros hay en la carpeta de datos:
 * el panel (Panel.gs) para decir de cuándo es cada uno, y Jefatura.gs para
 * encontrar el cuaderno de AGRUPAMIENTOS. Listar Drive es lento, así que se
 * lista UNA sola vez y se guarda aquí.
 *
 * La lista se guarda solo mientras dura la ejecución. La próxima vez que
 * Francisco pulse el botón, el programa arranca de cero y vuelve a mirar
 * Drive, así que nunca trabaja con una lista vieja.
 *
 * POR QUÉ ESTÁ EN UN FICHERO PROPIO. Esta función se escribió en su día
 * pensando en Codigo.gs, pero al reescribir aquel fichero entero se quedó por
 * el camino. Panel.gs y Jefatura.gs seguían llamándola, y el resultado era que
 * al pulsar "Actualizar los datos" salía "ficherosPorCarpeta_ is not defined"
 * y no se hacía nada. Se pone aparte para que no se pueda volver a perder al
 * tocar otro fichero.
 *
 * Devuelve una lista por cada carpeta donde hay que buscar (la de datos y la
 * de arriba), y dentro de cada una, sus ficheros. carpetasDondeBuscar() está
 * en Codigo.gs.
 *
 * ======================================================== ***/

let CACHE_FICHEROS_POR_CARPETA_ = null;

function ficherosPorCarpeta_() {
  if (CACHE_FICHEROS_POR_CARPETA_) return CACHE_FICHEROS_POR_CARPETA_;
  const listas = [];
  let carpetas = [];
  try {
    carpetas = carpetasDondeBuscar();
  } catch (e) {
    return [];   // sin Drive no hay nada que listar; quien llama ya lo avisa
  }
  for (let c = 0; c < carpetas.length; c++) {
    const ficheros = [];
    try {
      const it = carpetas[c].getFiles();
      while (it.hasNext()) ficheros.push(it.next());
    } catch (e) { /* si una carpeta no se deja leer, se sigue con las demás */ }
    listas.push(ficheros);
  }
  CACHE_FICHEROS_POR_CARPETA_ = listas;
  return listas;
}
