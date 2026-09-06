/*** ================= FORMATO DE LAS PESTAÑAS =================
 *
 * Este fichero no calcula nada. Solo deja las pestañas de la base de datos
 * en condiciones de trabajar con ellas.
 *
 * POR QUÉ EXISTE (6-sep-2026). Francisco no podía filtrar la tabla ALUMNADO.
 * La causa estaba localizada y eran dos cosas que se sumaban:
 *
 *   1. Cada pestaña escribe en la casilla A1 una frase larga de explicación.
 *      La de ALUMNADO mide 258 caracteres.
 *   2. Al terminar, el programa ajustaba el ancho de cada columna a su
 *      contenido más largo. Y el contenido más largo era esa frase.
 *
 * Resultado: la columna A medía unos 1.600 puntos, más que la pantalla. Y
 * como las dos primeras columnas están congeladas, una columna congelada más
 * ancha que la pantalla BLOQUEA el desplazamiento lateral. El filtro estaba
 * puesto, pero no se podía llegar hasta él.
 *
 * QUÉ SE HACE AHORA, en una sola pasada al final de "Actualizar los datos":
 *
 *   - La frase larga de la fila 1 se sustituye por un rótulo corto, y el
 *     texto entero se guarda como nota de esa misma casilla.
 *   - Cada columna recibe un ANCHO FIJO, escrito aquí abajo. Ya no se ajusta
 *     al contenido, así que nada se vuelve a disparar.
 *   - Las columnas de texto largo llevan ajuste de texto, para que se lea
 *     todo sin ensanchar la columna.
 *   - Todas las pestañas quedan con la cabecera congelada, las primeras
 *     columnas congeladas y filtro.
 *
 * ADEMÁS: la pestaña AVISOS borraba en cada actualización lo que Francisco
 * escribía en "Estado" y "Observaciones". Aquí están las dos funciones que
 * lo guardan antes y lo devuelven después. Las llama Panel.gs.
 *
 * ======================================================== ***/

/* La versión que se enseña en el panel. Codigo.gs tiene la suya, más
   antigua; mientras esta exista, manda esta. */
const VERSION_BD = 'BD v21';

/* Ancho y alineación de una columna que no esté en las tablas de abajo. */
const ANCHO_DEFECTO = 100;

/* Cómo se lee cada columna:
     'C' = centrada, en una sola línea   (marcas cortas: SÍ, R, 1º, MatB)
     'I' = a la izquierda, en una línea  (nombres, códigos)
     'W' = a la izquierda, con ajuste de texto (listas y frases largas)
   El número es el ancho en puntos. */
const FORMATO_HOJAS = {

  'HISTORIAL': {
    cabecera: 2, congelar: 2, manuales: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Nº Id. Escolar': [85, 'C'], 'Unidad': [65, 'C'],
      'Curso': [50, 'C'], 'Edad a 31/12': [60, 'C'], 'Repite el curso actual': [65, 'C'],
      'Repeticiones en ESO': [65, 'C'], 'Rep. Primaria (calculado)': [65, 'C'],
      'Fuente Primaria': [90, 'C'], 'Fecha de nacimiento': [95, 'C']
    }
  },

  'ALUMNADO': {
    cabecera: 2, congelar: 2, manuales: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'],
      'Repite el curso actual': [65, 'C'], 'Diversificación': [95, 'C'],
      'OPT': [60, 'C'], 'FR -> ALCT': [60, 'C'], 'MAT': [55, 'C'],
      'OPC1': [55, 'C'], 'OPC2': [55, 'C'], 'OPC3': [55, 'C'], 'OPC4': [55, 'C'],
      'REL/Atedu': [65, 'C'], 'Nº pendientes': [55, 'C'],
      'Asignaturas pendientes': [230, 'W'], 'Edad a 31/12': [60, 'C'],
      'MAT NO SUP.': [200, 'W'], 'Repeticiones en ESO': [65, 'C'],
      'Rep. Primaria (calculado)': [65, 'C'], 'Fuente Primaria': [90, 'C'],
      'Rep. Primaria (corregido)': [65, 'C'], 'Motivo de la corrección': [170, 'W'],
      'Repeticiones totales': [65, 'C'], 'PIL': [45, 'C'],
      'NEAE': [180, 'W'], 'MEDIDAS Y RECURSOS': [180, 'W'], 'Observaciones': [200, 'W']
    }
  },

  'JEFATURA': {
    cabecera: 2, congelar: 2, manuales: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'],
      'Grupo de origen': [110, 'W'], 'REL/Atedu': [65, 'C'], 'OPT': [60, 'C'],
      'OPT 2 (DIV)': [70, 'C'], 'MAT': [55, 'C'], 'OPC1': [55, 'C'], 'OPC2': [55, 'C'],
      'OPC3': [55, 'C'], 'OPC4': [55, 'C'], 'FR -> ALCT': [60, 'C'],
      'Repite': [55, 'C'], 'PIL': [45, 'C'], 'Conflictivo': [70, 'C'],
      'NEAE': [60, 'C'], 'Diversificación': [85, 'C']
    }
  },

  'DISCREPANCIAS': {
    cabecera: 2, congelar: 3, manuales: ['Estado', 'Observaciones'],
    cols: {
      'Curso': [50, 'C'], 'Grupo': [65, 'C'], 'Alumno/a': [200, 'I'],
      'Qué no cuadra': [190, 'W'], 'Séneca dice': [115, 'W'],
      'Jefatura quiere': [115, 'W'], 'Estado': [110, 'C'], 'Observaciones': [220, 'W']
    }
  },

  'NEAE': {
    cabecera: 2, congelar: 2, manuales: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'],
      'Iniciales': [70, 'C'], 'Fecha de nacimiento': [95, 'C'],
      'NEAE': [200, 'W'], 'MEDIDAS Y RECURSOS': [190, 'W'],
      'Cómo se ha localizado': [150, 'W'], 'Texto original de Séneca': [320, 'W']
    }
  },

  'PRIMARIA': {
    cabecera: 2, congelar: 2, manuales: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Año de 6º': [65, 'C'],
      'Nº pendientes': [55, 'C'], 'Pendientes de 6º': [200, 'W'],
      'Arrastraba de antes': [200, 'W'], 'Rep. Primaria (expediente)': [95, 'W'],
      'Cursos repetidos': [95, 'C'], 'Centro de 6º': [200, 'W'], 'Fichero': [230, 'W']
    }
  },

  /* AVISOS es la única con la cabecera en la fila 1. Se deja así a propósito:
     el panel cuenta los avisos como "última fila menos uno". */
  'AVISOS': {
    cabecera: 1, congelar: 3, manuales: ['Estado', 'Observaciones'],
    cols: {
      'Curso': [50, 'C'], 'Grupo': [65, 'C'], 'Alumno/a': [200, 'I'],
      'Aviso': [200, 'W'], 'Detalle': [380, 'W'],
      'Estado': [110, 'C'], 'Observaciones': [220, 'W']
    }
  }
};

/* El color de las columnas que rellena Francisco. El mismo amarillo que ya
   usa la tabla ALUMNADO. */
const AMARILLO_MANUAL = '#FFF2CC';


/*** ================= EL RÓTULO DE LA FILA 1 ================= ***/

/* Cambia la frase larga de A1 por un rótulo corto, y guarda la frase entera
   como nota de esa casilla. Así se sigue pudiendo leer, pero deja de mandar
   sobre el ancho de la columna A. */
function acortarRotulo_(hoja, nombre) {
  const celda = hoja.getRange(1, 1);
  const texto = String(celda.getValue() === null || celda.getValue() === undefined
                       ? '' : celda.getValue()).trim();
  if (!texto) return;
  if (texto.length <= 70) return;              // ya está acortado de otra vez

  celda.setNote(texto);

  /* La fecha se saca de la propia frase, que siempre acaba en
     "Actualizado: 6/9/2026, 12:31:05". */
  let fecha = '';
  const m = texto.match(/Actualizado:\s*(.+)$/);
  if (m) fecha = String(m[1]).trim();

  celda.setValue(nombre + (fecha ? ' · ' + fecha : ''))
       .setFontWeight('bold')
       .setFontStyle('normal')
       .setFontColor('#666666')
       .setWrap(false);
}


/*** ================= FORMATEAR UNA PESTAÑA ================= ***/

/* Devuelve true si la ha tocado. Si la pestaña no existe o está vacía, no
   hace nada y devuelve false. */
function formatearHoja_(nombre) {
  const def = FORMATO_HOJAS[nombre];
  if (!def) return false;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!hoja) return false;

  const filaCab = def.cabecera;
  const ultimaFila = hoja.getLastRow();
  const ancho = hoja.getLastColumn();
  if (ancho < 1 || ultimaFila < filaCab) return false;

  /* 1. El rótulo de la fila 1, en las pestañas que lo llevan. */
  if (filaCab === 2) acortarRotulo_(hoja, nombre);

  /* 2. Columna a columna: ancho fijo, ajuste de texto y alineación.
        El ancho se decide por el TÍTULO de la columna, no por su posición,
        así que reordenarlas no rompe nada. */
  const titulos = hoja.getRange(filaCab, 1, 1, ancho).getValues()[0];
  const nDatos = ultimaFila - filaCab;

  for (let c = 0; c < ancho; c++) {
    const titulo = String(titulos[c] === null || titulos[c] === undefined
                          ? '' : titulos[c]).trim();
    const conf = def.cols[titulo] || [ANCHO_DEFECTO, 'C'];
    hoja.setColumnWidth(c + 1, conf[0]);
    if (nDatos <= 0) continue;

    const rango = hoja.getRange(filaCab + 1, c + 1, nDatos, 1);
    if (conf[1] === 'W') {
      rango.setWrap(true).setHorizontalAlignment('left');
    } else if (conf[1] === 'I') {
      rango.setWrap(false).setHorizontalAlignment('left');
    } else {
      rango.setWrap(false).setHorizontalAlignment('center');
    }
    rango.setVerticalAlignment('top');

    /* Las columnas que rellena Francisco van en amarillo, para que se vea de
       un vistazo dónde puede escribir sin que se lo pisen. */
    if (def.manuales.indexOf(titulo) !== -1) rango.setBackground(AMARILLO_MANUAL);
  }

  /* 3. La cabecera: centrada, con ajuste de texto y sitio para dos líneas. */
  hoja.getRange(filaCab, 1, 1, ancho)
      .setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  hoja.setRowHeight(filaCab, 40);

  /* 4. Congelar. Nunca más columnas de las que tiene la pestaña. */
  hoja.setFrozenRows(filaCab);
  hoja.setFrozenColumns(Math.min(def.congelar, ancho));

  /* 5. El filtro. Hay que quitar el que hubiera antes: Google no deja tener
        dos, ni ampliar uno ya puesto. */
  const filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.getRange(filaCab, 1, ultimaFila - filaCab + 1, ancho).createFilter();

  return true;
}


/*** ================= FORMATEAR TODAS ================= ***/

/* Lo llama Panel.gs al final de "Actualizar los datos".
   Si una pestaña falla, se anota y se sigue con las demás: el formato nunca
   debe tumbar una actualización que ya ha salido bien. */
function arreglarFormatoDeTodo_() {
  const orden = ['HISTORIAL', 'ALUMNADO', 'JEFATURA', 'DISCREPANCIAS',
                 'NEAE', 'PRIMARIA', 'AVISOS'];
  let hojas = 0;
  const fallos = [];
  for (let i = 0; i < orden.length; i++) {
    try {
      if (formatearHoja_(orden[i])) hojas++;
    } catch (e) {
      fallos.push(orden[i] + ': ' + e.message);
    }
  }
  return { hojas: hojas, fallos: fallos };
}


/*** ================= LAS ANOTACIONES DE AVISOS =================
 *
 * La pestaña AVISOS se reescribe entera en cada actualización, y hasta ahora
 * las columnas "Estado" y "Observaciones" se quedaban vacías. Lo que
 * Francisco anotaba ahí se perdía al pulsar el botón.
 *
 * Cada aviso se reconoce por lo que dicen sus cinco primeras columnas:
 * curso, grupo, alumno, aviso y detalle. Si el detalle ha cambiado un poco
 * (lleva nombres de fichero y fechas), se prueba con una clave más corta:
 * alumno y tipo de aviso. Esa segunda clave solo se usa cuando hay alumno,
 * para no colocarle a un aviso la nota de otro.
 * ======================================================== ***/

const COL_AV_ESTADO = 6;        // columna F
const COL_AV_OBS = 7;           // columna G

function claveAvisoLarga_(fila) {
  return normalizar(fila[0]) + '|' + normalizar(fila[1]) + '|' + normalizar(fila[2]) +
         '|' + normalizar(fila[3]) + '|' + normalizar(fila[4]);
}

function claveAvisoCorta_(fila) {
  return normalizar(fila[2]) + '|' + normalizar(fila[3]);
}

/* Se llama ANTES de reconstruir la pestaña. Devuelve un mapa de anotaciones. */
function notasDeAvisos_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_AVISOS);
  const previos = {};
  if (!hoja || hoja.getLastRow() < 2 || hoja.getLastColumn() < COL_AV_OBS) return previos;

  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, COL_AV_OBS).getValues();
  for (let f = 0; f < datos.length; f++) {
    const estado = String(datos[f][COL_AV_ESTADO - 1] || '').trim();
    const obs = String(datos[f][COL_AV_OBS - 1] || '').trim();
    if (!estado && !obs) continue;
    const valor = [datos[f][COL_AV_ESTADO - 1], datos[f][COL_AV_OBS - 1]];
    previos[claveAvisoLarga_(datos[f])] = valor;
    if (String(datos[f][2] || '').trim()) previos[claveAvisoCorta_(datos[f])] = valor;
  }
  return previos;
}

/* Se llama DESPUÉS de reconstruir la pestaña. Devuelve cuántas filas ha
   podido recuperar. */
function restaurarNotasAvisos_(previos) {
  if (!previos) return 0;
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_AVISOS);
  if (!hoja || hoja.getLastRow() < 2) return 0;

  const n = hoja.getLastRow() - 1;
  const datos = hoja.getRange(2, 1, n, 5).getValues();
  const salida = [];
  let recuperados = 0;

  for (let f = 0; f < n; f++) {
    let v = previos[claveAvisoLarga_(datos[f])];
    if (!v && String(datos[f][2] || '').trim()) v = previos[claveAvisoCorta_(datos[f])];
    if (v) {
      salida.push([v[0], v[1]]);
      recuperados++;
    } else {
      salida.push(['', '']);
    }
  }
  hoja.getRange(2, COL_AV_ESTADO, n, 2).setValues(salida);
  return recuperados;
}
