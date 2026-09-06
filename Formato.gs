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
 * QUÉ SE HACE, en una sola pasada al final de "Actualizar los datos":
 *
 *   1. La frase larga de la fila 1 se sustituye por un rótulo corto, y el
 *      texto entero se guarda como nota de esa misma casilla.
 *   2. Cada columna recibe un ANCHO FIJO. Ya no se ajusta al contenido.
 *   3. Las columnas de texto largo llevan ajuste de texto.
 *   4. Cabecera y primeras columnas congeladas, y filtro en todas.
 *   5. Filas alternas y colores automáticos que señalan solos lo que hay
 *      que mirar: las casillas con "?", las estimaciones por edad, el
 *      alumnado sin unidad.
 *   6. Desplegables en las columnas "Estado".
 *   7. Aviso al escribir en una columna que reescribe el programa.
 *   8. Orden y color de las pestañas.
 *
 * ADEMÁS: la pestaña AVISOS borraba en cada actualización lo que Francisco
 * escribía en "Estado" y "Observaciones". Aquí están las dos funciones que
 * lo guardan antes y lo devuelven después. Las llama Panel.gs.
 *
 * TODO LO DE AQUÍ EMPIEZA POR "fmt" o por "FMT", menos lo que ya estaba en
 * la BD v21. Así no choca con ningún nombre de los otros ficheros: recuerda
 * que todos se juntan en un solo texto y se ejecutan de una vez.
 *
 * ======================================================== ***/

/* La versión que se enseña en el panel. Codigo.gs tiene la suya, más
   antigua; mientras esta exista, manda esta. */
const VERSION_BD = 'BD v24';

/* Ancho y alineación de una columna que no esté en las tablas de abajo. */
const ANCHO_DEFECTO = 100;

/* Los colores. En un sitio, para que todas las pestañas hablen igual. */
const AMARILLO_MANUAL = '#FFF2CC';   // lo rellenas tú
const FMT_AMBAR       = '#FCE8B2';   // falta el dato, o hay que revisarlo
const FMT_ROJO        = '#F8CBCB';   // esto no debería estar así
const FMT_VERDE       = '#E2EFDA';   // ya lo has marcado
const FMT_AZUL        = '#DDEBF7';   // dato de aviso, no problema

/* Cómo se lee cada columna:
     'C' = centrada, en una sola línea   (marcas cortas: SÍ, R, 1º, MatB)
     'I' = a la izquierda, en una línea  (nombres, códigos)
     'W' = a la izquierda, con ajuste de texto (listas y frases largas)
   El número es el ancho en puntos.

   manuales    = columnas tuyas: van en amarillo y no llevan aviso.
   noProteger  = columnas que puedes rellenar aunque no sean amarillas.
   estado      = columna con desplegable, y sus opciones. */
const FORMATO_HOJAS = {

  'HISTORIAL': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Nº Id. Escolar': [85, 'C'], 'Unidad': [65, 'C'],
      'Curso': [50, 'C'], 'Edad a 31/12': [60, 'C'], 'Repite el curso actual': [65, 'C'],
      'Repeticiones en ESO': [65, 'C'], 'Rep. Primaria (calculado)': [65, 'C'],
      'Fuente Primaria': [90, 'C'], 'Fecha de nacimiento': [95, 'C']
    }
  },

  'ALUMNADO': {
    cabecera: 2, congelar: 2,
    manuales: ['Rep. Primaria (corregido)', 'Motivo de la corrección', 'Observaciones'],
    noProteger: ['NEAE', 'MEDIDAS Y RECURSOS'],
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
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
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
    cabecera: 2, congelar: 3, manuales: ['Estado', 'Observaciones'], noProteger: [],
    estado: { columna: 'Estado', opciones: ['Corregido en Séneca', 'No procede'] },
    cols: {
      'Curso': [50, 'C'], 'Grupo': [65, 'C'], 'Alumno/a': [200, 'I'],
      'Qué no cuadra': [190, 'W'], 'Séneca dice': [115, 'W'],
      'Jefatura quiere': [115, 'W'], 'Estado': [130, 'C'], 'Observaciones': [220, 'W']
    }
  },

  'NEAE': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'],
      'Iniciales': [70, 'C'], 'Fecha de nacimiento': [95, 'C'],
      'NEAE': [200, 'W'], 'MEDIDAS Y RECURSOS': [190, 'W'],
      'Cómo se ha localizado': [150, 'W'], 'Texto original de Séneca': [320, 'W']
    }
  },

  'PRIMARIA': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
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
    cabecera: 1, congelar: 3, manuales: ['Estado', 'Observaciones'], noProteger: [],
    estado: { columna: 'Estado', opciones: ['Revisado', 'Corregido', 'No procede'] },
    cols: {
      'Curso': [50, 'C'], 'Grupo': [65, 'C'], 'Alumno/a': [200, 'I'],
      'Aviso': [200, 'W'], 'Detalle': [380, 'W'],
      'Estado': [130, 'C'], 'Observaciones': [220, 'W']
    }
  },

  /* Las incidencias al rellenar los informes por unidad. La escribe
     Informes.gs, pero vive en este mismo cuaderno, no en el de informes.
     Desde la BD v24 tiene Estado y Observaciones, igual que las otras dos
     pestañas de revisión, y se conservan entre actualizaciones. */
  'AVISOS INFORMES': {
    cabecera: 2, congelar: 2, manuales: ['Estado', 'Observaciones'], noProteger: [],
    estado: { columna: 'Estado', opciones: ['Revisado', 'Corregido', 'No procede'] },
    cols: {
      'Grupo': [70, 'C'], 'Pestaña': [80, 'C'],
      'Aviso': [220, 'W'], 'Detalle': [340, 'W'],
      'Estado': [130, 'C'], 'Observaciones': [220, 'W']
    }
  }
};

/* El orden de las pestañas: primero las de trabajo, después las de consulta.
   Y el color de cada solapa, para distinguir los dos grupos de un vistazo. */
const FMT_ORDEN = ['RESUMEN', 'ALUMNADO', 'AVISOS', 'AVISOS INFORMES', 'DISCREPANCIAS',
                   'PRIMARIA', 'NEAE', 'JEFATURA', 'HISTORIAL'];
const FMT_COLOR_SOLAPA = {
  'RESUMEN': '#1F4E79',                                            // el panel, azul oscuro
  'ALUMNADO': '#2E7D32', 'AVISOS': '#2E7D32',                      // trabajo, verde
  'AVISOS INFORMES': '#2E7D32', 'DISCREPANCIAS': '#2E7D32',
  'PRIMARIA': '#9E9E9E', 'NEAE': '#9E9E9E',
  'JEFATURA': '#9E9E9E', 'HISTORIAL': '#9E9E9E'                    // consulta, gris
};


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


/*** ================= AUXILIARES ================= ***/

/* Dónde está cada columna, por su título. Devuelve el número de columna
   (la primera es la 1), o 0 si esa columna no existe en la pestaña. */
function fmtColumnaDe_(titulos, titulo) {
  for (let c = 0; c < titulos.length; c++) {
    if (String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim() === titulo) {
      return c + 1;
    }
  }
  return 0;
}


/*** ================= 5. FILAS ALTERNAS Y COLORES ================= ***/

/* Filas alternas suaves. Con 668 filas y 27 columnas, seguir una fila con la
   vista cansa. Hay que quitar las bandas de la vez anterior: Google no deja
   dos bandas encima del mismo sitio. */
function fmtFilasAlternas_(hoja, filaCab, ultimaFila, ancho) {
  const anteriores = hoja.getBandings();
  for (let i = 0; i < anteriores.length; i++) {
    try { anteriores[i].remove(); } catch (e) { /* si no se puede, se sigue */ }
  }
  const nDatos = ultimaFila - filaCab;
  if (nDatos <= 1) return;
  try {
    hoja.getRange(filaCab + 1, 1, nDatos, ancho)
        .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  } catch (e) { /* las bandas son un lujo, no se para por ellas */ }
}

/* Los colores que señalan solos lo que hay que mirar.
   Se borran siempre los de la vez anterior: si no, se van acumulando. */
function fmtColoresAutomaticos_(hoja, nombre, filaCab, ultimaFila, ancho, titulos) {
  hoja.setConditionalFormatRules([]);
  const nDatos = ultimaFila - filaCab;
  if (nDatos <= 0) return;
  const primera = filaCab + 1;
  const reglas = [];

  /* Una columna concreta, cuando su texto es exactamente X. */
  const siDice = function (titulo, texto, color) {
    const c = fmtColumnaDe_(titulos, titulo);
    if (!c) return;
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(texto).setBackground(color)
      .setRanges([hoja.getRange(primera, c, nDatos, 1)]).build());
  };

  /* Una columna concreta, cuando está vacía. */
  const siVacia = function (titulo, color) {
    const c = fmtColumnaDe_(titulos, titulo);
    if (!c) return;
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenCellEmpty().setBackground(color)
      .setRanges([hoja.getRange(primera, c, nDatos, 1)]).build());
  };

  /* La fila entera, cuando la columna de mando NO está vacía. */
  const filaSiMarcada = function (titulo, color) {
    const c = fmtColumnaDe_(titulos, titulo);
    if (!c) return;
    const letra = hoja.getRange(1, c).getA1Notation().replace(/[0-9]/g, '');
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + letra + primera + '<>""').setBackground(color)
      .setRanges([hoja.getRange(primera, 1, nDatos, ancho)]).build());
  };

  if (nombre === 'ALUMNADO') {
    /* Lo que todavía no sabemos. */
    siDice('Asignaturas pendientes', SIN_DATO, FMT_AMBAR);
    siDice('MAT NO SUP.', SIN_DATO, FMT_AMBAR);
    /* Repeticiones de Primaria estimadas por edad: hay que revisarlas a mano. */
    siDice('Fuente Primaria', 'EDAD', FMT_AMBAR);
    /* Sin unidad en Séneca: este alumno no sale en ningún informe. */
    siVacia('Unidad', FMT_ROJO);
    /* Los PIL, para localizarlos de un vistazo. No es un problema: es un dato. */
    siDice('PIL', 'SÍ', FMT_AZUL);
  } else if (nombre === 'HISTORIAL') {
    siDice('Fuente Primaria', 'EDAD', FMT_AMBAR);
  } else if (nombre === 'PRIMARIA') {
    siDice('Rep. Primaria (expediente)', 'expediente incompleto', FMT_AMBAR);
    siDice('Unidad', 'NO ESTÁ EN ALUMNADO', FMT_ROJO);
  } else if (nombre === 'DISCREPANCIAS' || nombre === 'AVISOS' ||
             nombre === 'AVISOS INFORMES') {
    /* En verde lo que ya has marcado. Lo que queda en blanco es lo que falta,
       y es justo lo que cuenta el panel. */
    filaSiMarcada('Estado', FMT_VERDE);
  }

  if (reglas.length) hoja.setConditionalFormatRules(reglas);
}


/*** ================= 6. LOS DESPLEGABLES ================= ***/

/* La columna "Estado" pasa a ser una lista de opciones.
   IMPORTANTE: dejarla VACÍA sigue queriendo decir "pendiente". El panel y la
   portada del PDF cuentan las filas con Estado vacío, así que no se pone
   ninguna opción que signifique "todavía no". */
function fmtDesplegables_(hoja, def, filaCab, ultimaFila, titulos) {
  if (!def.estado) return;
  const c = fmtColumnaDe_(titulos, def.estado.columna);
  if (!c) return;
  const nDatos = ultimaFila - filaCab;
  if (nDatos <= 0) return;

  const regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(def.estado.opciones, true)
    .setAllowInvalid(false)
    .setHelpText('Elige una opción. Si lo dejas vacío, cuenta como pendiente.')
    .build();
  hoja.getRange(filaCab + 1, c, nDatos, 1).setDataValidation(regla);
}


/*** ================= 7. EL AVISO AL ESCRIBIR ================= ***/

/* Las columnas que reescribe el programa quedan protegidas "con aviso": se
   puede escribir en ellas, pero Google pregunta antes. No bloquea nada; solo
   evita que Francisco pierda una nota sin enterarse.

   Se protegen por tramos seguidos de columnas, no una a una, para no hacer
   veinte llamadas por pestaña. Y se quitan siempre las protecciones de la vez
   anterior. */
function fmtProtegerCalculadas_(hoja, def, filaCab, ultimaFila, titulos) {
  const anteriores = hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (let i = 0; i < anteriores.length; i++) {
    try { anteriores[i].remove(); } catch (e) { /* si no se puede, se sigue */ }
  }
  const nDatos = ultimaFila - filaCab;
  if (nDatos <= 0) return;

  const libres = def.manuales.concat(def.noProteger || []);
  let inicio = -1;
  for (let c = 0; c <= titulos.length; c++) {
    const fin = c === titulos.length;
    const titulo = fin ? '' : String(titulos[c] === null || titulos[c] === undefined
                                     ? '' : titulos[c]).trim();
    const esLibre = fin || libres.indexOf(titulo) !== -1;
    if (!esLibre) {
      if (inicio === -1) inicio = c;
      continue;
    }
    if (inicio !== -1) {
      try {
        hoja.getRange(filaCab + 1, inicio + 1, nDatos, c - inicio)
            .protect()
            .setWarningOnly(true)
            .setDescription('Lo escribe el programa. Lo que pongas aquí se pierde ' +
                            'en la próxima actualización.');
      } catch (e) { /* si Google no deja proteger, se sigue */ }
      inicio = -1;
    }
  }
}


/*** ================= 8. ORDEN Y COLOR DE LAS PESTAÑAS ================= ***/

/* Primero las de trabajo, después las de consulta. Las pestañas que no estén
   en la lista se quedan donde estén. */
function fmtOrdenarPestanas_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let pos = 1;
  for (let i = 0; i < FMT_ORDEN.length; i++) {
    const hoja = libro.getSheetByName(FMT_ORDEN[i]);
    if (!hoja) continue;
    try { hoja.setTabColor(FMT_COLOR_SOLAPA[FMT_ORDEN[i]] || null); } catch (e) { }
    try {
      libro.setActiveSheet(hoja);
      libro.moveActiveSheet(pos);
      pos++;
    } catch (e) { /* si no se puede mover, se queda donde está */ }
  }
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
  }

  /* 3. La cabecera: centrada, con ajuste de texto y sitio para dos líneas. */
  hoja.getRange(filaCab, 1, 1, ancho)
      .setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  hoja.setRowHeight(filaCab, 40);

  /* 4. Filas alternas. Va antes del amarillo, aunque daría igual: un color
        puesto a mano siempre gana a las bandas. */
  fmtFilasAlternas_(hoja, filaCab, ultimaFila, ancho);

  /* 5. Las columnas que rellena Francisco, en amarillo. */
  if (nDatos > 0) {
    for (let i = 0; i < def.manuales.length; i++) {
      const c = fmtColumnaDe_(titulos, def.manuales[i]);
      if (c) hoja.getRange(filaCab + 1, c, nDatos, 1).setBackground(AMARILLO_MANUAL);
    }
  }

  /* 6. Congelar. Nunca más columnas de las que tiene la pestaña. */
  hoja.setFrozenRows(filaCab);
  hoja.setFrozenColumns(Math.min(def.congelar, ancho));

  /* 7. El filtro. Hay que quitar el que hubiera antes: Google no deja tener
        dos, ni ampliar uno ya puesto. */
  const filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.getRange(filaCab, 1, ultimaFila - filaCab + 1, ancho).createFilter();

  /* 8. Los colores automáticos, los desplegables y el aviso al escribir. */
  fmtColoresAutomaticos_(hoja, nombre, filaCab, ultimaFila, ancho, titulos);
  fmtDesplegables_(hoja, def, filaCab, ultimaFila, titulos);
  fmtProtegerCalculadas_(hoja, def, filaCab, ultimaFila, titulos);

  return true;
}


/*** ================= FORMATEAR TODAS ================= ***/

/* Lo llama Panel.gs al final de "Actualizar los datos".
   Si una pestaña falla, se anota y se sigue con las demás: el formato nunca
   debe tumbar una actualización que ya ha salido bien. */
function arreglarFormatoDeTodo_() {
  const orden = ['HISTORIAL', 'ALUMNADO', 'JEFATURA', 'DISCREPANCIAS',
                 'NEAE', 'PRIMARIA', 'AVISOS', 'AVISOS INFORMES'];
  let hojas = 0;
  const fallos = [];
  for (let i = 0; i < orden.length; i++) {
    try {
      if (formatearHoja_(orden[i])) hojas++;
    } catch (e) {
      fallos.push(orden[i] + ': ' + e.message);
    }
  }
  try {
    fmtOrdenarPestanas_();
  } catch (e) {
    fallos.push('orden de las pestañas: ' + e.message);
  }
  return { hojas: hojas, fallos: fallos };
}


/*** ================= LAS ANOTACIONES DE AVISOS =================
 *
 * La pestaña AVISOS se reescribe entera en cada actualización, y hasta la
 * BD v21 las columnas "Estado" y "Observaciones" se quedaban vacías. Lo que
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


/*** ================= LAS ANOTACIONES DE AVISOS INFORMES =================
 *
 * La pestaña AVISOS INFORMES tiene desde la BD v24 sus columnas "Estado" y
 * "Observaciones". La escribe Informes.gs, que también la reconstruye entera
 * cada vez, así que hace falta el mismo cuidado que con AVISOS.
 *
 * Aquí no hay dos pasos como allí. Informes.gs llama a esta función ANTES de
 * limpiar la pestaña, se guarda el mapa, y al escribir cada fila busca en él
 * lo que hubiera anotado Francisco.
 *
 * Cada incidencia se reconoce por sus cuatro columnas: grupo, pestaña, aviso
 * y detalle. Estas incidencias no llevan nombres de fichero ni fechas, así
 * que el texto se repite igual de una vez a otra y no hace falta una segunda
 * clave más corta.
 * ======================================================== ***/

function claveAvisoInforme_(fila) {
  return normalizar(fila[0]) + '|' + normalizar(fila[1]) + '|' +
         normalizar(fila[2]) + '|' + normalizar(fila[3]);
}

/* Devuelve un mapa: clave de la incidencia -> [Estado, Observaciones].
   Si la pestaña todavía no tiene esas dos columnas, devuelve un mapa vacío y
   no pasa nada: la primera vez sale en blanco. */
function notasDeAvisosInformes_() {
  const previos = {};
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_AV_INF);
  if (!hoja || hoja.getLastRow() < 3 || hoja.getLastColumn() < 6) return previos;

  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, 6).getValues();
  for (let f = 0; f < datos.length; f++) {
    const estado = String(datos[f][4] || '').trim();
    const obs = String(datos[f][5] || '').trim();
    if (!estado && !obs) continue;
    previos[claveAvisoInforme_(datos[f])] = [datos[f][4], datos[f][5]];
  }
  return previos;
}
