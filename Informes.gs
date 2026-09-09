/*** ================= INFORMES POR UNIDAD =================
 *
 * Copia lo que hay en la pestaña ALUMNADO a cada pestaña de grupo del
 * cuaderno "INFORME-RESUMEN POR GRUPOS 26-27", deja las columnas en el orden
 * acordado, y saca un PDF por grupo para su tutor.
 *
 * SON DOS TRABAJOS DISTINTOS, y desde el 6-sep-2026 van por separado:
 *
 *   rellenarPestanasInformes_()  escribe las 23 pestañas y la portada.
 *                                Lo llama el botón "Actualizar los datos".
 *   generarPdfs()                exporta los PDF DEFINITIVOS, los del
 *                                profesorado. Es el botón 2 del menú.
 *   generarPdfsBorrador()        exporta los PDF de BORRADOR, los de
 *                                Francisco. Es el botón 3 del menú.
 *
 * Se separan porque los PDF son la única parte que Google rechaza a veces, y
 * Francisco muchas veces solo quiere revisar avisos con los datos al día.
 *
 * LOS DOS TIPOS DE PDF (BD v45, 8-sep-2026). Lo pidió el director: en las
 * copias que él reparte al profesorado no deben salir las interrogantes.
 *
 *   DEFINITIVO  con membrete · sin interrogantes · carpeta "Informes por unidad"
 *   BORRADOR    sin membrete · con interrogantes · rótulo BORRADOR arriba ·
 *               subcarpeta "Borradores"
 *
 * Las pestañas del cuaderno son las mismas para los dos. No se duplican. Lo
 * que hace el programa es preparar cada pestaña justo antes de exportarla y
 * dejarla como estaba justo después, pestaña por pestaña. Así no hay dos
 * versiones de los datos que puedan descuadrarse, y si Google corta a medias,
 * la siguiente pulsación de "Actualizar los datos" lo deja todo en su sitio.
 *
 * El informe se lee de izquierda a derecha como una frase:
 *   quién es -> cómo va -> qué apoyos tiene -> qué cursa
 *
 * Las columnas se localizan por su TÍTULO, nunca por su letra. Cualquier
 * columna que el programa no conozca se conserva, con su contenido, al final.
 *
 * Convenio de todo el sistema: una casilla vacía quiere decir que no hay nada
 * que poner; una casilla con "?" quiere decir que ese dato todavía no lo
 * tenemos. Ver SIN_DATO en Codigo.gs.
 *
 * ======================================================== ***/

const ID_INFORMES   = '1zJXNix6nc_cq5yOAmbyuLIvlYv508gOa5h0X5vfmxkA';
const FILA_GRUPO    = 7;   // ahí está el rótulo "1º ESO A"
const FILA_LEYENDA  = 8;
const FILA_TITULOS  = 9;
const FILA_DATOS    = 10;
const HOJA_AV_INF   = 'AVISOS INFORMES';
const HOJA_PORTADA  = 'RESUMEN';

/*** ================= LAS COLUMNAS ================= ***/

/* Cada columna tiene una clave interna. El rótulo que se ve puede cambiar;
   la clave no. Aquí se reconocen los rótulos viejos y los nuevos, para que
   se pueda pulsar el botón las veces que haga falta. */
const ALIAS_COLUMNAS = {
  'alumno/a:': 'alumno/a:',
  'rep': 'rep',
  'mat no sup.': 'mat no sup.',
  'no superadas del curso que repite': 'mat no sup.',
  'no superadas (repite)': 'mat no sup.',
  'mat. pend.': 'mat. pend.',
  'pendientes de cursos anteriores': 'mat. pend.',
  'pendientes (anteriores)': 'mat. pend.',
  'mat. pend. 6º': 'mat. pend. 6º',
  'pendientes de 6º de primaria': 'mat. pend. 6º',
  'pendientes (6º primaria)': 'mat. pend. 6º',
  'pil': 'pil',
  'div': 'div',
  'diversificacion': 'div',
  'neae': 'neae',
  'neae/c': 'neae',
  'medidas/recursos': 'medidas/recursos',
  'medidas y recursos': 'medidas/recursos',
  'itinerario': 'itinerario',
  'opt': 'opt',
  'fr -> alct': 'fr -> alct',
  'exento frances': 'fr -> alct',
  'exento': 'fr -> alct',
  'exento fr': 'fr -> alct',
  'rel/at.': 'rel/atedu',
  'exento de frances': 'fr -> alct',
  'rel/atedu': 'rel/atedu',
  'mat': 'mat', 'opc1': 'opc1', 'opc2': 'opc2', 'opc3': 'opc3', 'opc4': 'opc4',
  'veces repite primaria': 'veces repite primaria'
};

/* El rótulo que se escribe en la fila 9. */
const ROTULOS = {
  'alumno/a:': 'Alumno/a:',
  'rep': 'REP',
  'mat no sup.': 'NO SUPERADAS (repite)',
  'mat. pend.': 'PENDIENTES (anteriores)',
  'mat. pend. 6º': 'PENDIENTES (6º Primaria)',
  'pil': 'PIL',
  'div': 'DIV',
  'neae': 'NEAE',
  'medidas/recursos': 'MEDIDAS Y RECURSOS',
  'itinerario': 'ITINERARIO',
  'opt': 'OPT',
  'fr -> alct': 'EXENTO FR',
  'rel/atedu': 'REL/At.'
};

/* Qué columnas lleva cada nivel, y en qué orden.
   Bloque 1: quién es. Bloque 2: su trayectoria. Bloque 3: sus apoyos.
   Bloque 4: su matrícula de este curso. */
const COLUMNAS_POR_NIVEL = {
  '1º': ['alumno/a:', 'rep', 'mat no sup.', 'pil', 'mat. pend. 6º',
         'neae', 'medidas/recursos', 'opt', 'fr -> alct', 'rel/atedu'],
  '2º': ['alumno/a:', 'rep', 'mat no sup.', 'pil', 'mat. pend.',
         'neae', 'medidas/recursos', 'opt', 'rel/atedu'],
  '3º': ['alumno/a:', 'rep', 'mat no sup.', 'pil', 'mat. pend.', 'div',
         'neae', 'medidas/recursos', 'opt', 'rel/atedu'],
  '4º': ['alumno/a:', 'rep', 'mat no sup.', 'pil', 'mat. pend.', 'div',
         'neae', 'medidas/recursos', 'itinerario', 'rel/atedu']
};

/* Columnas que ya no se usan: sus datos van ahora dentro de ITINERARIO. */
const COLUMNAS_RETIRADAS = ['mat', 'opc1', 'opc2', 'opc3', 'opc4'];

/* De dónde sale cada columna. Las que no aparecen aquí las rellena una
   persona, y el programa nunca las toca. */
const MAPA_INFORMES = {
  'alumno/a:':  { col: 'Alumno/a' },
  'rep':        { col: 'Repite el curso actual', si: 'SÍ' },
  'mat no sup.':{ col: 'MAT NO SUP.', conservaSiVacio: true },
  'mat. pend.': { col: 'Asignaturas pendientes' },
  /* En 1º de ESO las pendientes son las materias suspensas en 6º de Primaria.
     Salen de la misma columna de ALUMNADO, que para los alumnos de 1º la
     rellena el expediente de Primaria (ver Primaria.gs). Mientras Francisco
     no haya descargado el expediente de un alumno, ahí va un "?", y se
     respeta lo que él hubiera escrito a mano: para eso está 'conservaSiVacio'. */
  'mat. pend. 6º': { col: 'Asignaturas pendientes', conservaSiVacio: true },
  /* La columna PIL del papel sale, desde la BD v34, de la columna 'PIL' de
     ALUMNADO, que quiere decir: este alumno está en el curso en el que está
     porque el año pasado ya no podía repetir y aun así suspendió más de dos
     materias. Es la lectura del equipo directivo, y es la que le sirve al
     profesorado para saber cómo llega.

     AL PAPEL SOLO VAN LOS SÍ COMPROBADOS (BD v38, decidido por Francisco el
     8-sep-2026). En la hoja esa columna tiene además "SÍ (por edad)", cuando
     el número en el que se apoya es una suposición, y "?", cuando faltan sus
     datos del año pasado. Esos dos se quedan en la hoja y NO salen impresos:
     son la lista de trabajo de Francisco, no información para el tutor. El
     tutor solo debe ver lo que está confirmado.

     Al no estar en esta lista, cualquier otro valor sale como casilla vacía.
     Las otras dos columnas de permanencia tampoco van al papel. */
  'pil':        { col: 'PIL', traduce: { 'SÍ': 'SÍ' } },
  'div':        { col: 'Diversificación', siEmpieza: 'SÍ' },
  'itinerario': { junta: ['MAT', 'OPC1', 'OPC2', 'OPC3', 'OPC4'] },
  'opt':        { col: 'OPT' },
  /* NEAE y MEDIDAS Y RECURSOS las rellena ahora el censo NEAE de Séneca.
     'conservaSiVacio' es la red de seguridad: si el censo no dice nada de un
     alumno, se respeta lo que hubiera escrito una persona en el informe. */
  'neae':       { col: 'NEAE', conservaSiVacio: true },
  'medidas/recursos': { col: 'MEDIDAS Y RECURSOS', conservaSiVacio: true },
  'fr -> alct': { col: 'FR -> ALCT', siVale: 'ALCT' },
  'rel/atedu':  { col: 'REL/Atedu' }
};

/* Las columnas cuyas siglas hay que explicar en la leyenda. */
const COLUMNAS_CON_SIGLAS = ['neae', 'medidas/recursos'];

/*** ================= ANCHOS =================
 *
 * En puntos. Un A4 vertical con márgenes de 11 mm deja 707 puntos.
 * Los anchos de abajo son el mínimo. Lo que sobre en cada nivel se reparte
 * entre las columnas largas, que son las que agradecen el sitio: cuanto más
 * anchas, menos líneas ocupa cada fila y más alumnos entran en el folio.
 * ============================================================== ***/
const ANCHO_FOLIO = 707;
const ANCHO_NUMERACION = 26;
/* Ajustados a la letra 8: las columnas de marca (una letra o un código corto)
   se han apretado para dar sitio a NEAE y MEDIDAS Y RECURSOS. */
const ANCHOS_MINIMOS = {
  'alumno/a:': 130, 'rep': 26, 'mat no sup.': 90, 'mat. pend.': 85,
  'mat. pend. 6º': 85, 'pil': 26, 'div': 26, 'neae': 55,
  'medidas/recursos': 75, 'itinerario': 112, 'opt': 40, 'fr -> alct': 46,
  'rel/atedu': 46, 'veces repite primaria': 45
};
const ANCHO_DESCONOCIDA = 80;
const COLUMNAS_ELASTICAS = ['mat no sup.', 'mat. pend.', 'mat. pend. 6º', 'alumno/a:',
                            'neae', 'medidas/recursos'];
const CON_AJUSTE = ['alumno/a:', 'mat no sup.', 'mat. pend.', 'mat. pend. 6º',
                    'neae', 'medidas/recursos', 'itinerario', 'opt'];
/* Se baja de 9 a 8 al meter las columnas NEAE y MEDIDAS Y RECURSOS.
   Medido con el simulador sobre los datos reales del curso 26-27:
   con letra 9 el PDF pasaría de 27 a 33 páginas y de 3 a 9 grupos de dos
   folios; con letra 8 se queda en 25 páginas y ningún grupo se parte. */
const LETRA_INFORME = 8;
const ALTO_LINEA = 12;

/*** ================= LA LEYENDA =================
 *
 * Va en el hueco que queda a la derecha del membrete, en las filas 1 a 6, que
 * antes estaban desperdiciadas. Así no empuja ni una fila hacia abajo y se
 * imprime en todas las páginas, porque esas filas van congeladas.
 *
 * EL PROBLEMA QUE RESUELVE. Antes la leyenda era una lista fija de ocho
 * líneas, escrita a mano, y no cabían todas las siglas que el censo NEAE
 * puede escribir. Francisco encontró un "ATE" sin explicar.
 *
 * LA SOLUCIÓN. La leyenda ya no es fija. Cada grupo explica SOLO las siglas
 * que salen de verdad en sus alumnos, ordenadas de más a menos frecuente.
 * Lo que significa cada sigla está en EXPLICACION_SIGLAS, en NEAE.gs.
 *
 * LAS CUENTAS, medidas el 6-sep-2026. El hueco da unos 102 caracteres por
 * renglón y ocho renglones. La parte fija ocupa uno, así que quedan siete
 * para las siglas, y en cada renglón entran tres explicaciones. Con eso caben
 * dieciséis siglas distintas en un mismo grupo, más de lo que se ve en la
 * realidad. Si aun así sobrara alguna, o si apareciera una sigla que no está
 * en el diccionario, se anota en AVISOS INFORMES.
 * ============================================================== ***/

/* Esta línea va siempre, en todos los grupos. Debe caber en un solo renglón:
   como mucho, unos 100 caracteres. */
/* El trozo que explica la interrogante va aparte: en los PDF definitivos no
   hay ninguna interrogante, así que esa explicación se quita de la leyenda. */
const LEYENDA_INTERROGANTE = '  ?: aún sin dato.';
const LEYENDA_FIJA = [
  'NO SUPERADAS: del curso que repite.  PENDIENTES: de antes.  DIV: diversificación.' +
  LEYENDA_INTERROGANTE
];
const SEPARADOR_LEYENDA = '  ';   // entre dos explicaciones del mismo renglón
const LETRA_LEYENDA = 6;
const ALTO_LINEA_LEYENDA = 7.2;   // puntos que ocupa una línea a esa letra
const ANCHO_LETRA_LEYENDA = 3.0;  // ancho medio de un carácter, en puntos
const AIRE_TRAS_MEMBRETE = 12;    // separación entre el membrete y la leyenda

/* El membrete es una imagen flotante encima de las filas 1 a 6. No se pueden
   esconder esas filas: la imagen se iría con ellas. */
const FILAS_CABECERA   = 6;

/* El membrete nuevo. Es un fichero de imagen en la carpeta de datos que se
   llama MEMBRETE (da igual la extensión). Si está, el programa lo pone en las
   23 pestañas. Si no está, deja el que haya y no toca nada. */
const NOMBRE_MEMBRETE  = 'membrete';
const RATIO_MEMBRETE   = 6.667;   // ancho dividido por alto de esa imagen
const ANCHO_MEMBRETE   = 312;     // puntos = 110 mm. Deja sitio a su derecha para la leyenda
const ALTO_MINIMO_FILA = 8;
const AIRE_BAJO_LOGO   = 15;   // sitio para que respire la leyenda de al lado

const PDF_OPCIONES = 'format=pdf&size=A4&portrait=true&fitw=true&scale=2' +
  '&sheetnames=false&printtitle=false&pagenumbers=true&pagenum=CENTER' +
  '&gridlines=false&fzr=true' +
  '&top_margin=0.20&bottom_margin=0.20&left_margin=0.45&right_margin=0.45' +
  '&horizontal_alignment=LEFT&vertical_alignment=TOP';

/*** ================= LOS DOS TIPOS DE PDF =================
 *
 * El borrador se distingue a simple vista: no lleva el membrete del centro y
 * lleva la palabra BORRADOR en grande, arriba, en el sitio del membrete. Se
 * repite en todas las páginas, porque las filas 1 a 9 están congeladas.
 *
 * Google no sabe poner una marca de agua girada al exportar a PDF, así que el
 * aviso va como texto en la cabecera, que sí sale siempre.
 * ======================================================== ***/

const TEXTO_BORRADOR   = 'BORRADOR';
const LETRA_BORRADOR   = 26;
const COLOR_BORRADOR   = '#9E9E9E';
const CARPETA_BORRADORES = 'Borradores';

/*** ================= LÓGICA PURA ================= ***/

function claveColumna_(titulo) {
  const n = normalizar(titulo);
  return ALIAS_COLUMNAS[n] === undefined ? n : ALIAS_COLUMNAS[n];
}

/* Jefatura tenía suelta la palabra DIVERSIFICACIÓN en la fila 7, sin señalar
   a nadie. Ya no hace falta: ahora hay una columna DIV. */
function limpiarRotuloDiver_(hoja, fila7) {
  for (let c = 0; c < fila7.length; c++) {
    if (normalizar(fila7[c]) === 'diversificacion') {
      hoja.getRange(FILA_GRUPO, c + 1).clearContent().setBackground(null);
    }
  }
}

/* De la fila 7 saca el nombre del grupo, esté en la columna que esté. */
function grupoDeFila7(fila) {
  for (let c = 0; c < fila.length; c++) {
    const t = String(fila[c] === null || fila[c] === undefined ? '' : fila[c]).trim();
    if (/^[1-4]\s*º\s+ESO\s+[A-ZÑ]$/i.test(t)) return t.replace(/\s+/g, ' ');
  }
  return '';
}

function indiceTitulos(titulos) {
  const idx = {};
  for (let c = 0; c < titulos.length; c++) {
    const t = String(titulos[c] === null || titulos[c] === undefined ? '' : titulos[c]).trim();
    if (t) idx[normalizar(t)] = c;
  }
  return idx;
}

/* Qué columnas debe tener esta pestaña, en orden. Las que el programa no
   conoce se conservan y se ponen al final. */
function columnasDeLaPestana_(nivel, titulosActuales) {
  const quiere = (COLUMNAS_POR_NIVEL[nivel] || COLUMNAS_POR_NIVEL['2º']).slice();
  const extras = [];
  for (let c = 0; c < titulosActuales.length; c++) {
    const t = String(titulosActuales[c] === null || titulosActuales[c] === undefined
                     ? '' : titulosActuales[c]).trim();
    if (!t) continue;
    const clave = claveColumna_(t);
    if (quiere.indexOf(clave) !== -1) continue;
    if (COLUMNAS_RETIRADAS.indexOf(clave) !== -1) continue;   // se funden en ITINERARIO
    if (extras.indexOf(clave) === -1) extras.push(clave);
  }
  return quiere.concat(extras);
}

/* Reparte el sitio que sobra entre las columnas largas. */
function anchosDeLaPestana_(claves) {
  const anchos = {};
  let suma = ANCHO_NUMERACION;
  for (let i = 0; i < claves.length; i++) {
    const a = ANCHOS_MINIMOS[claves[i]] === undefined ? ANCHO_DESCONOCIDA : ANCHOS_MINIMOS[claves[i]];
    anchos[claves[i]] = a;
    suma += a;
  }
  const elasticas = COLUMNAS_ELASTICAS.filter(function (c) { return claves.indexOf(c) !== -1; });
  const sobra = ANCHO_FOLIO - suma;
  if (sobra > 0 && elasticas.length) {
    const cada = Math.floor(sobra / elasticas.length);
    for (let i = 0; i < elasticas.length; i++) anchos[elasticas[i]] += cada;
    suma += cada * elasticas.length;
  }
  return { anchos: anchos, suma: suma };
}

/* El valor que va en una columna para un alumno. */
function valorInforme(regla, alumno, idxAlum) {
  if (regla.junta) {
    const partes = [];
    for (let i = 0; i < regla.junta.length; i++) {
      const j = idxAlum[normalizar(regla.junta[i])];
      if (j === undefined) continue;
      const v = String(alumno[j] === null || alumno[j] === undefined ? '' : alumno[j]).trim();
      if (v) partes.push(v);
    }
    return partes.join(' ');
  }
  const i = idxAlum[normalizar(regla.col)];
  if (i === undefined) return '';
  const v = alumno[i];
  if (regla.si) return String(v).trim().toUpperCase() === 'SÍ' ? regla.si : '';
  /* 'traduce' es para las columnas con más de dos valores: cada valor de la
     hoja tiene su marca en el papel, y lo que no esté en la lista va vacío. */
  if (regla.traduce) {
    const clave = String(v === null || v === undefined ? '' : v).trim();
    return regla.traduce[clave] === undefined ? '' : regla.traduce[clave];
  }
  /* 'siEmpieza' es para Diversificación, que vale "SÍ", "SÍ (solo Jefatura)" o "NO". */
  if (regla.siEmpieza) return normalizar(v).indexOf('si') === 0 ? regla.siEmpieza : '';
  /* 'siVale' es como 'siLleno', pero solo marca cuando el código es el que se
     espera. Desde BD v25 la columna FR -> ALCT de ALUMNADO vale FR o ALCT en
     todo 1º, y en el informe solo hay que marcar a quien está exento de
     francés, es decir a quien cursa ALCT. */
  if (regla.siVale) {
    const cod = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
    return cod === String(regla.siVale).toUpperCase() ? 'SÍ' : '';
  }
  /* 'siLleno' es para columnas que en ALUMNADO llevan un código y en el
     informe solo hace falta saber si el alumno está o no en ese caso. */
  if (regla.siLleno) return String(v === null || v === undefined ? '' : v).trim() ? regla.siLleno : '';
  return v === null || v === undefined ? '' : v;
}

/* Construye el bloque de datos. 'previos' guarda, por alumno y por clave de
   columna, lo que había antes, para respetar lo que rellena una persona. */
function construirBloque(claves, alumnos, idxAlum, previos) {
  const filas = [];
  for (let f = 0; f < alumnos.length; f++) {
    const alumno = alumnos[f];
    const nombre = alumno[idxAlum[normalizar('Alumno/a')]];
    const antes = previos[normalizar(nombre)] || {};
    const fila = [f + 1];
    for (let c = 0; c < claves.length; c++) {
      const regla = MAPA_INFORMES[claves[c]];
      if (regla) {
        let v = valorInforme(regla, alumno, idxAlum);
        /* Ni una casilla vacía ni un "?" deben borrar lo que Francisco hubiera
           escrito a mano en esa columna. El "?" precisamente quiere decir que
           el programa no tiene el dato, así que si él lo sabía, manda lo suyo. */
        const falta = String(v).trim() === '' || String(v).trim() === SIN_DATO;
        if (falta && regla.conservaSiVacio) {
          const antesV = antes[claves[c]];
          if (antesV !== undefined && String(antesV).trim() !== '' &&
              String(antesV).trim() !== SIN_DATO) {
            v = antesV;
          }
        }
        fila.push(v);
      } else fila.push(antes[claves[c]] === undefined ? '' : antes[claves[c]]);
    }
    filas.push(fila);
  }
  return filas;
}

/* Alto que necesita la fila de rótulos para que no se corte ninguno. */
function altoDeLosRotulos_(claves, anchos) {
  let lineas = 1;
  for (let c = 0; c < claves.length; c++) {
    const rot = ROTULOS[claves[c]] || claves[c];
    const util = Math.max(10, (anchos[claves[c]] || ANCHO_DESCONOCIDA) - 8);
    const n = Math.ceil(String(rot).length * 5.4 / util);
    if (n > lineas) lineas = n;
  }
  return lineas * ALTO_LINEA + 8;
}

/*** ================= LAS SIGLAS DE ESTE GRUPO ================= ***/

/* Recorre las columnas NEAE y MEDIDAS Y RECURSOS de este grupo y devuelve las
   siglas que aparecen, de más a menos frecuente. Una sigla es una palabra de
   2 a 5 letras escrita entera en mayúsculas: así "DIA dislexia" da "DIA", y
   "PRA, ATE / ATAL" da "PRA", "ATE" y "ATAL". Lo que va en minúsculas
   (dislexia, vigilancia, aseo...) se entiende solo y no se toca. */
function siglasDelBloque_(bloque, claves) {
  const cols = [];
  for (let c = 0; c < claves.length; c++) {
    if (COLUMNAS_CON_SIGLAS.indexOf(claves[c]) !== -1) cols.push(c + 1);  // +1 por la numeración
  }
  const cuenta = {};
  for (let f = 0; f < bloque.length; f++) {
    for (let k = 0; k < cols.length; k++) {
      const celda = bloque[f][cols[k]];
      const texto = String(celda === null || celda === undefined ? '' : celda);
      const trozos = texto.split(/[^A-ZÁÉÍÓÚÑÜ]+/);
      for (let t = 0; t < trozos.length; t++) {
        const s = trozos[t];
        if (s.length < 2 || s.length > 5) continue;
        cuenta[s] = (cuenta[s] || 0) + 1;
      }
    }
  }
  const lista = [];
  for (const s in cuenta) lista.push(s);
  lista.sort(function (a, b) {
    if (cuenta[b] !== cuenta[a]) return cuenta[b] - cuenta[a];
    return a < b ? -1 : 1;
  });
  return lista;
}

/*** ================= LECTURA DE ALUMNADO ================= ***/
function leerAlumnado_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_ALUMNADO);
  if (!hoja || hoja.getLastRow() < 3) {
    throw new Error('No encuentro la pestaña ALUMNADO con datos.\n\n' +
                    'Pulsa antes "1. Actualizar los datos".');
  }
  const ancho = hoja.getLastColumn();
  const titulos = hoja.getRange(2, 1, 1, ancho).getValues()[0];
  const todasLasFilas = hoja.getRange(3, 1, hoja.getLastRow() - 2, ancho).getValues();
  const idx = indiceTitulos(titulos);

  /* EL BACHILLERATO SE QUEDA FUERA DE ESTE CUADERNO. Este es el cuaderno de
     informes de la ESO: sus columnas, sus 23 pestañas y su portada hablan de
     la ESO. El alumnado de Bachillerato vive en la misma pestaña ALUMNADO,
     pero tiene su propio cuaderno. Si no se apartara aquí, saldrían seis
     avisos de "grupo sin pestaña" y la portada contaría 828 alumnos de ESO.
     Ver Bachillerato.gs. */
  const iCurso = idx[normalizar('Curso')];
  const datos = iCurso === undefined ? todasLasFilas : todasLasFilas.filter(function (fila) {
    return !esBachillerato_(fila[iCurso]);
  });
  if (idx[normalizar('Alumno/a')] === undefined || idx[normalizar('Unidad')] === undefined) {
    throw new Error('La pestaña ALUMNADO no tiene las columnas Alumno/a y Unidad.');
  }
  const porUnidad = {}, sinUnidad = [];
  const iNom = idx[normalizar('Alumno/a')], iUni = idx[normalizar('Unidad')];
  const iCur = idx[normalizar('Curso')];
  for (let f = 0; f < datos.length; f++) {
    const nombre = String(datos[f][iNom] || '').trim();
    if (!nombre) continue;
    const unidad = String(datos[f][iUni] || '').trim();
    if (!unidad) {
      sinUnidad.push([nombre, iCur === undefined ? '' : String(datos[f][iCur] || '')]);
      continue;
    }
    const clave = normalizar(unidad);
    if (!porUnidad[clave]) porUnidad[clave] = [];
    porUnidad[clave].push(datos[f]);
  }
  for (const u in porUnidad) {
    porUnidad[u].sort(function (a, b) {
      const ka = normalizar(a[iNom]), kb = normalizar(b[iNom]);
      return ka < kb ? -1 : (ka > kb ? 1 : 0);
    });
  }
  return { porUnidad: porUnidad, idx: idx, sinUnidad: sinUnidad, filas: datos };
}

/*** ================= EL MEMBRETE ================= ***/

/* Busca el fichero de imagen llamado MEMBRETE en la carpeta de datos.
   Usa la misma caché de ficheros que buscarCsv (Codigo.gs). */
function blobMembrete_() {
  const listas = ficherosPorCarpeta_();
  for (let c = 0; c < listas.length; c++) {
    const ficheros = listas[c];
    for (let i = 0; i < ficheros.length; i++) {
      const f = ficheros[i];
      const nombre = f.getName();
      const sinExt = normalizar(nombre.replace(/\.[^.]+$/, ''));
      if (sinExt !== NOMBRE_MEMBRETE) continue;
      if (String(f.getMimeType()).indexOf('image/') !== 0) continue;
      return f.getBlob();
    }
  }
  return null;
}

/* Cambia el membrete de una pestaña, conservando dónde está y encogiéndolo
   un poco para ganar alto de folio. Devuelve true si lo ha cambiado. */
function ponerMembrete_(hoja, blob) {
  let imagenes;
  try { imagenes = hoja.getImages(); } catch (e) { return false; }
  let cambiada = false;
  for (let i = 0; i < imagenes.length; i++) {
    const img = imagenes[i];
    let fila;
    try { fila = img.getAnchorCell().getRow(); } catch (e) { continue; }
    if (fila > FILAS_CABECERA) continue;
    /* El ancho se ajusta siempre, haya o no una imagen nueva: si el membrete
       se quedara ancho, taparía la leyenda que va a su derecha. */
    if (blob) { img.replace(blob); cambiada = true; }
    img.setWidth(ANCHO_MEMBRETE);
    img.setHeight(Math.round(ANCHO_MEMBRETE / RATIO_MEMBRETE));
  }
  return cambiada;
}

/*** ================= LA LEYENDA, AL LADO DEL MEMBRETE ================= ***/

/* Devuelve la primera columna que empieza más allá del membrete. */
function columnaTrasElMembrete_(claves, anchos) {
  let acumulado = ANCHO_NUMERACION;
  const limite = ANCHO_MEMBRETE + AIRE_TRAS_MEMBRETE;
  for (let c = 0; c < claves.length; c++) {
    if (acumulado >= limite) return c + 2;          // +1 por la numeración, +1 porque las columnas empiezan en 1
    acumulado += anchos[claves[c]] === undefined ? ANCHO_DESCONOCIDA : anchos[claves[c]];
  }
  return claves.length + 1;
}

/* Escribe la leyenda en el hueco libre de las filas 1 a 6.
   'trozos' son las explicaciones de las siglas de este grupo, ya en texto,
   ordenadas de más a menos frecuente.
   Devuelve { aviso, fuera }: 'fuera' son los trozos que no han cabido. */
function escribirLeyendaCabecera_(hoja, claves, anchos, ancho, trozos) {
  const primera = columnaTrasElMembrete_(claves, anchos);
  if (primera > ancho) {
    return { aviso: 'No queda hueco a la derecha del membrete para la leyenda.', fuera: trozos };
  }

  let disponible = 0;
  for (let c = primera - 2; c < claves.length; c++) {
    disponible += anchos[claves[c]] === undefined ? ANCHO_DESCONOCIDA : anchos[claves[c]];
  }
  const porLinea = Math.max(20, Math.floor((disponible - 6) / ANCHO_LETRA_LEYENDA));

  /* El alto de las filas 1 a 6 ya está ajustado al membrete cuando se llama
     a esta función, así que se puede saber cuántos renglones caben de verdad. */
  let alto = 0;
  for (let r = 1; r <= FILAS_CABECERA; r++) alto += hoja.getRowHeight(r);
  const cabenLineas = Math.max(2, Math.floor(alto / ALTO_LINEA_LEYENDA));

  const lineas = [];
  let usadas = 0;
  for (let i = 0; i < LEYENDA_FIJA.length; i++) {
    lineas.push(LEYENDA_FIJA[i]);
    usadas += Math.ceil(LEYENDA_FIJA[i].length / porLinea);
  }

  /* Las explicaciones se van juntando en renglones de lo ancho que haya. */
  const paquetes = [];
  let actual = '';
  for (let i = 0; i < trozos.length; i++) {
    const cand = actual ? actual + SEPARADOR_LEYENDA + trozos[i] : trozos[i];
    if (cand.length <= porLinea) { actual = cand; continue; }
    if (actual) paquetes.push(actual);
    actual = trozos[i];
  }
  if (actual) paquetes.push(actual);

  const fuera = [];
  for (let i = 0; i < paquetes.length; i++) {
    const ocupa = Math.ceil(paquetes[i].length / porLinea);
    if (usadas + ocupa > cabenLineas) { fuera.push(paquetes[i]); continue; }
    lineas.push(paquetes[i]);
    usadas += ocupa;
  }

  const rango = hoja.getRange(1, primera, FILAS_CABECERA, ancho - primera + 1);
  try { rango.breakApart(); } catch (e) { /* no estaba unida */ }
  rango.merge();
  rango.setValue(lineas.join('\n'))
       .setFontSize(LETRA_LEYENDA).setFontStyle('italic').setWrap(true)
       .setVerticalAlignment('top').setHorizontalAlignment('left');

  if (fuera.length) {
    return { aviso: 'En el hueco del membrete caben ' + cabenLineas +
             ' renglones y no ha entrado todo. Se ha quedado fuera: ' + fuera.join(' ') +
             ' Lo más frecuente del grupo sí sale.', fuera: fuera };
  }
  return { aviso: '', fuera: [] };
}

/*** ================= EL HUECO DEL MEMBRETE ================= ***/
function ajustarFilasDelLogo_(hoja) {
  let imagenes;
  try { imagenes = hoja.getImages(); } catch (e) { return 0; }
  if (!imagenes || !imagenes.length) return 0;

  let necesita = 0;
  for (let i = 0; i < imagenes.length; i++) {
    const img = imagenes[i];
    let fila;
    try { fila = img.getAnchorCell().getRow(); } catch (e) { continue; }
    if (fila > FILAS_CABECERA) continue;
    const abajo = img.getAnchorCellYOffset() + img.getHeight();
    if (abajo > necesita) necesita = abajo;
  }
  if (!necesita) return 0;

  const total = necesita + AIRE_BAJO_LOGO;
  let actual = 0;
  for (let r = 1; r <= FILAS_CABECERA; r++) actual += hoja.getRowHeight(r);
  if (actual <= total) return 0;

  const arriba = ALTO_MINIMO_FILA * (FILAS_CABECERA - 1);
  hoja.setRowHeights(1, FILAS_CABECERA - 1, ALTO_MINIMO_FILA);
  hoja.setRowHeight(FILAS_CABECERA, Math.max(ALTO_MINIMO_FILA, total - arriba));
  return actual - total;
}

/*** ================= PDF ================= ***/

/* Todos los PDF van siempre a la misma carpeta, con los mismos nombres.
   Antes se creaba una carpeta nueva cada día y se acumulaban. */
const CARPETA_INFORMES = 'Informes por unidad';

function carpetaDeInformes_(borrador) {
  const raiz = DriveApp.getFolderById(CARPETA_ID);
  const encontradas = raiz.getFoldersByName(CARPETA_INFORMES);
  const carpeta = encontradas.hasNext() ? encontradas.next() : raiz.createFolder(CARPETA_INFORMES);
  if (!borrador) return carpeta;
  /* Los borradores van en una subcarpeta, para que no se mezclen con los que
     el director va a repartir. */
  const dentro = carpeta.getFoldersByName(CARPETA_BORRADORES);
  return dentro.hasNext() ? dentro.next() : carpeta.createFolder(CARPETA_BORRADORES);
}
/* Ya no se hace un PDF con todos los grupos juntos. Se hacía, pero su
   numeración iba corrida de la primera página a la última, y la de cada informe
   suelto empieza por 1. Como no se pueden tener las dos numeraciones en el mismo
   fichero, Francisco prefiere unir los sueltos con su propia herramienta de PDF.
   Quitarlo ahorra además una exportación pesada, que es justo lo que hace que
   Google se ponga a rechazar peticiones. */

/*** ================= UN PDF POR INFORME ================= ***/
/* En la carpeta queda un PDF por informe: uno para el equipo directivo (el
   resumen) y uno para cada tutor. Así cada uno numera sus páginas desde 1, y
   el tutor sabe cuántas hojas son. */

/* Cuenta las páginas de un PDF sin abrirlo: mira cuántos objetos de página tiene. */
function contarPaginas_(blob) {
  try {
    const t = blob.getDataAsString('ISO-8859-1');
    const m = t.match(/\/Type\s*\/Page[^s]/g);
    return m && m.length ? m.length : 1;
  } catch (e) { return 1; }
}

/* Google no deja pedirle muchos PDF seguidos: a partir del quinto o sexto
   empieza a decir que no. Por eso se le pide despacio, y si dice que no se
   espera un poco y se vuelve a intentar, cada vez esperando más. */
const ESPERAS_PDF = [0, 5000, 15000];   // milisegundos

function exportarHoja_(libro, hoja, token, aviso) {
  const url = 'https://docs.google.com/spreadsheets/d/' + libro.getId() + '/export?' +
              PDF_OPCIONES + '&gid=' + hoja.getSheetId();
  let codigo = 0;
  for (let i = 0; i < ESPERAS_PDF.length; i++) {
    if (ESPERAS_PDF[i]) Utilities.sleep(ESPERAS_PDF[i]);
    let resp;
    try {
      resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true,
        headers: { 'Authorization': 'Bearer ' + token } });
    } catch (e) { codigo = -1; continue; }
    codigo = resp.getResponseCode();
    if (codigo === 200) return resp.getBlob();
  }
  if (aviso) aviso.codigo = codigo;
  return null;
}

/*** ================= PREPARAR LA PESTAÑA PARA CADA TIPO =================
 *
 * Se hace pestaña por pestaña, justo antes de exportarla, y se deshace justo
 * después. Nunca se queda una pestaña a medias: el deshacer va en un bloque
 * "finally", que Google ejecuta pase lo que pase.
 *
 * La portada (RESUMEN) no se toca: es la hoja de Francisco, tiene otro
 * formato y no lleva ni membrete ni interrogantes sueltas.
 * ======================================================== ***/

/* Hasta qué columna llega el hueco del membrete, mirando los anchos que tiene
   de verdad la pestaña. Es el mismo cálculo que columnaTrasElMembrete_, pero
   sin necesitar la lista de columnas. */
function columnasDelMembrete_(hoja) {
  const max = Math.max(1, hoja.getLastColumn());
  const limite = ANCHO_MEMBRETE + AIRE_TRAS_MEMBRETE;
  let acumulado = 0;
  for (let c = 1; c <= max; c++) {
    if (acumulado >= limite) return Math.max(1, c - 1);
    acumulado += hoja.getColumnWidth(c);
  }
  return Math.max(1, max - 1);
}

/* Deja la pestaña como tiene que salir en el PDF de este tipo.
   Devuelve lo que hace falta para volver a dejarla como estaba. */
function prepararParaPdf_(hoja, borrador) {
  const estado = { borrador: !!borrador, rango: null, valores: null, leyenda: null };

  if (borrador) {
    /* Fuera el membrete. No se borra: se encoge a un punto, y al terminar se
       le devuelve su tamaño. Borrar la imagen sería no poder recuperarla si
       el fichero MEMBRETE no estuviera en la carpeta. */
    let imagenes = [];
    try { imagenes = hoja.getImages(); } catch (e) { imagenes = []; }
    for (let i = 0; i < imagenes.length; i++) {
      const img = imagenes[i];
      let fila;
      try { fila = img.getAnchorCell().getRow(); } catch (e) { continue; }
      if (fila > FILAS_CABECERA) continue;
      img.setWidth(1);
      img.setHeight(1);
    }
    /* Y en su sitio, la palabra BORRADOR en grande. */
    const rango = hoja.getRange(1, 1, FILAS_CABECERA, columnasDelMembrete_(hoja));
    try { rango.breakApart(); } catch (e) { /* no estaba unida */ }
    try { rango.merge(); } catch (e) { /* si no deja unir, se escribe igual */ }
    rango.setValue(TEXTO_BORRADOR)
         .setFontSize(LETRA_BORRADOR).setFontWeight('bold').setFontColor(COLOR_BORRADOR)
         .setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(false);
    estado.rango = rango;
    return estado;
  }

  /* Definitivo: como no va a salir ninguna interrogante, sobra el trozo de la
     leyenda que la explica. */
  try {
    const celda = hoja.getRange(1, columnasDelMembrete_(hoja) + 1);
    const texto = String(celda.getValue() || '');
    if (texto.indexOf(LEYENDA_INTERROGANTE) !== -1) {
      estado.leyenda = { celda: celda, texto: texto };
      celda.setValue(texto.split(LEYENDA_INTERROGANTE).join(''));
    }
  } catch (e) { /* si no se puede tocar la leyenda, el PDF sale igual */ }

  /* Y las casillas que solo llevan una interrogante salen en blanco. El dato
     no se pierde: se vuelve a escribir en cuanto termina la exportación de
     esta pestaña. */
  const ultima = hoja.getLastRow();
  const ancho = hoja.getLastColumn();
  if (ultima < FILA_DATOS || ancho < 1) return estado;
  const rango = hoja.getRange(FILA_DATOS, 1, ultima - FILA_DATOS + 1, ancho);
  const antes = rango.getValues();
  const ahora = [];
  let hay = false;
  for (let f = 0; f < antes.length; f++) {
    const fila = [];
    for (let c = 0; c < antes[f].length; c++) {
      const v = antes[f][c];
      if (String(v === null || v === undefined ? '' : v).trim() === SIN_DATO) {
        fila.push(''); hay = true;
      } else fila.push(v);
    }
    ahora.push(fila);
  }
  if (!hay) return estado;
  rango.setValues(ahora);
  estado.rango = rango;
  estado.valores = antes;
  return estado;
}

/* Deja la pestaña como estaba antes de exportarla. */
function deshacerParaPdf_(hoja, estado) {
  if (!estado) return;
  if (estado.borrador) {
    if (estado.rango) {
      try { estado.rango.breakApart(); } catch (e) { /* no estaba unida */ }
      estado.rango.clearContent();
      estado.rango.setFontSize(LETRA_LEYENDA).setFontWeight('normal').setFontColor('#000000');
    }
    /* ponerMembrete_ con blob nulo no cambia la imagen: solo le devuelve su
       ancho y su alto de siempre. */
    try { ponerMembrete_(hoja, null); } catch (e) { /* mejor seguir */ }
    return;
  }
  if (estado.rango && estado.valores) estado.rango.setValues(estado.valores);
  if (estado.leyenda) {
    try { estado.leyenda.celda.setValue(estado.leyenda.texto); }
    catch (e) { /* la siguiente actualización la vuelve a escribir */ }
  }
}

function pdfsPorInforme_(libro, entradas, borrador) {
  /* Siempre la misma carpeta. Cada fichero se sustituye cuando se consigue
     sacar, así que si un día Google corta a medias, lo que ya estaba sigue
     ahí y basta con volver a pulsar para completar lo que falte. */
  const nombreCarpeta = borrador ? CARPETA_INFORMES + ' / ' + CARPETA_BORRADORES
                                 : CARPETA_INFORMES;
  const carpeta = carpetaDeInformes_(borrador);

  const token = ScriptApp.getOAuthToken();
  let hechos = 0, dobles = [], fallidos = [], seguidos = 0;
  for (let i = 0; i < entradas.length; i++) {
    const e = entradas[i];
    if (i) Utilities.sleep(2500);            // sin prisa, que Google se agobia
    const nombre = borrador ? e.nombre + ' BORRADOR' : e.nombre;

    /* La portada no se prepara: solo las pestañas de grupo, que son las que
       llevan membrete e interrogantes. Se reconocen porque tienen 'celda'. */
    let estado = null;
    try {
      if (e.celda) {
        estado = prepararParaPdf_(e.hoja, borrador);
        SpreadsheetApp.flush();
      }

      const aviso = {};
      let blob = exportarHoja_(libro, e.hoja, token, aviso);
      if (!blob) {
        fallidos.push(nombre + ' (Google respondió ' + aviso.codigo + ')');
        seguidos++;
        /* Si falla dos veces seguidas es que Google ha cerrado el grifo.
           Mejor parar y decirlo, que seguir dando golpes. */
        if (seguidos >= 2) {
          for (let k = i + 1; k < entradas.length; k++) {
            fallidos.push((borrador ? entradas[k].nombre + ' BORRADOR' : entradas[k].nombre) +
                          ' (no intentado)');
          }
          break;
        }
        continue;
      }
      seguidos = 0;
      const paginas = contarPaginas_(blob);
      /* Si el informe ocupa más de una hoja, se lo decimos al tutor en la
         cabecera, que se repite en todas sus páginas, y lo volvemos a sacar. */
      if (paginas > 1 && e.celda) {
        e.celda.setValue(e.texto + ' · ' + paginas + ' hojas');
        SpreadsheetApp.flush();
        Utilities.sleep(1500);
        const otro = exportarHoja_(libro, e.hoja, token, {});
        if (otro) blob = otro;
        dobles.push(nombre + ' (' + paginas + ' hojas)');
      }
      const anteriores = carpeta.getFilesByName(nombre + '.pdf');
      while (anteriores.hasNext()) anteriores.next().setTrashed(true);
      carpeta.createFile(blob.setName(nombre + '.pdf'));
      hechos++;
    } finally {
      /* Pase lo que pase, la pestaña se queda como estaba. */
      try { deshacerParaPdf_(e.hoja, estado); SpreadsheetApp.flush(); }
      catch (x) { /* la siguiente actualización la deja bien igualmente */ }
    }
  }
  return { carpeta: nombreCarpeta, hechos: hechos, dobles: dobles, fallidos: fallidos };
}

/* Qué hojas hay que exportar, mirando el cuaderno tal como está ahora.
   No hace falta haber rellenado nada en esta misma ejecución. */
function entradasParaPdf_(libro) {
  const entradas = [];
  const portada = libro.getSheetByName(HOJA_PORTADA);
  if (portada) entradas.push({ hoja: portada, nombre: 'RESUMEN para el equipo directivo' });

  const hojas = libro.getSheets();
  for (let h = 0; h < hojas.length; h++) {
    const hoja = hojas[h];
    if (hoja.getLastRow() < FILA_TITULOS) continue;
    const anchoFila7 = Math.max(hoja.getLastColumn(), 15);
    const fila7 = hoja.getRange(FILA_GRUPO, 1, 1, anchoFila7).getValues()[0];
    const grupo = grupoDeFila7(fila7);
    if (!grupo) continue;
    const celda = hoja.getRange(FILA_GRUPO, hoja.getLastColumn());
    /* La cabecera puede llevar ya un " · 2 hojas" de la vez anterior.
       Se le quita para no acumularlo. */
    const texto = String(celda.getValue() || '').replace(/\s*·\s*\d+\s*hojas\s*$/i, '');
    entradas.push({ hoja: hoja, nombre: grupo, celda: celda, texto: texto });
  }
  return entradas;
}

/*** ================= LA PORTADA ================= ***/
/* Primera hoja del cuaderno de informes. Es para Francisco, no para los
   tutores: dice qué falta por cuadrar en Séneca. */
function escribirPortada_(libro, A, resumenGrupos) {
  let hoja = libro.getSheetByName(HOJA_PORTADA);
  if (!hoja) hoja = libro.insertSheet(HOJA_PORTADA);
  hoja.clear();
  if (hoja.getMaxColumns() < 5) hoja.insertColumnsAfter(hoja.getMaxColumns(), 5 - hoja.getMaxColumns());
  libro.setActiveSheet(hoja);
  libro.moveActiveSheet(1);

  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const filas = [], bandas = [];
  let filaCabeceraTabla = 0;
  const mete = function (a, b, c, d, e) { filas.push([a || '', b || '', c || '', d || '', e || '']); };
  const banda = function (t) { bandas.push(filas.length); mete(t); };

  mete('INFORMES POR UNIDAD');
  mete('IES Fuente Lucena · Generado el ' + hoy + ' · ' + VERSION);
  mete('');

  const dame = function (fila, t) {
    const i = A.idx[normalizar(t)];
    return i === undefined ? '' : String(fila[i] === null || fila[i] === undefined ? '' : fila[i]).trim();
  };
  let nPil = 0, nRep = 0, nDiv = 0, nPen = 0, nTot = 0, nSinDato = 0;
  for (let f = 0; f < A.filas.length; f++) {
    const fila = A.filas[f];
    if (!dame(fila, 'Alumno/a')) continue;
    nTot++;
    if (String(dame(fila, 'PIL')).indexOf('SÍ') === 0) nPil++;
    if (dame(fila, 'Repite el curso actual') === 'SÍ') nRep++;
    if (normalizar(dame(fila, 'Diversificación')).indexOf('si') === 0) nDiv++;
    if (dame(fila, 'Nº pendientes') !== '') nPen++;
    if (dame(fila, 'Asignaturas pendientes') === SIN_DATO ||
        dame(fila, 'MAT NO SUP.') === SIN_DATO) nSinDato++;
  }
  banda('EL CENTRO EN CIFRAS');
  mete('Alumnado de ESO: ' + nTot + '     Grupos con informe: ' + resumenGrupos.length +
       '     Repetidores: ' + nRep + '     PIL: ' + nPil +
       '     En diversificación: ' + nDiv + '     Con materias pendientes: ' + nPen);
  mete('');

  banda('ALUMNADO CON ALGÚN DATO TODAVÍA SIN CONFIRMAR (' + nSinDato + ')');
  if (!nSinDato) {
    mete('Ninguno. No queda ninguna casilla con "' + SIN_DATO + '" en los informes.');
  } else {
    mete('Son los que salen con "' + SIN_DATO + '" en alguna columna del informe. ' +
         'Casi siempre, alumnado de 1º cuyo expediente de Primaria falta por descargar.');
  }
  mete('');

  banda('ALUMNADO SIN UNIDAD ASIGNADA EN SÉNECA');
  if (!A.sinUnidad.length) {
    mete('Ninguno. Todo el alumnado tiene su grupo.');
  } else {
    mete('No salen en ningún informe de grupo. Hay que ponerles unidad en Séneca.');
    for (let i = 0; i < A.sinUnidad.length; i++) {
      mete(A.sinUnidad[i][0] + '   (' + A.sinUnidad[i][1] + ' ESO)');
    }
  }
  mete('');

  const pend = discrepanciasPendientes_();
  banda('PENDIENTE DE AJUSTAR EN SÉNECA (' + pend.length + ')');
  if (!pend.length) {
    mete('Nada pendiente. Séneca coincide con lo que quiere Jefatura de Estudios.');
  } else {
    mete('Escribe algo en la columna Estado de la pestaña DISCREPANCIAS y esa línea desaparece de aquí.');
    filaCabeceraTabla = filas.length + 1;
    mete('Grupo', 'Alumno/a', 'Qué no cuadra', 'Séneca dice', 'Jefatura quiere');
    for (let i = 0; i < pend.length; i++) {
      mete(pend[i][0], pend[i][1], pend[i][2], pend[i][3], pend[i][4]);
    }
    bandas.push(-filaCabeceraTabla);   // marca: fila de títulos, con otro color
  }

  hoja.getRange(1, 1, filas.length, 5).setValues(filas)
      .setFontSize(8).setVerticalAlignment('middle').setWrap(false);
  /* La tabla de abajo sí ajusta el texto, para que ninguna celda invada la de al lado. */
  if (filaCabeceraTabla) {
    hoja.getRange(filaCabeceraTabla, 1, filas.length - filaCabeceraTabla + 1, 5).setWrap(true);
  }
  hoja.getRange(1, 1).setFontSize(15).setFontWeight('bold');
  hoja.getRange(2, 1).setFontStyle('italic');
  for (let i = 0; i < bandas.length; i++) {
    if (bandas[i] >= 0) {
      hoja.getRange(bandas[i] + 1, 1, 1, 5).setFontWeight('bold').setBackground('#D9E1F2').setFontSize(9);
    } else {
      hoja.getRange(-bandas[i], 1, 1, 5).setFontWeight('bold').setBackground('#F2F2F2');
    }
  }
  hoja.setColumnWidth(1, 65);
  hoja.setColumnWidth(2, 175);
  hoja.setColumnWidth(3, 235);
  hoja.setColumnWidth(4, 100);
  hoja.setColumnWidth(5, 100);
  hoja.setRowHeights(1, filas.length, 12);
  hoja.setRowHeight(1, 22);
  if (filaCabeceraTabla) {
    hoja.autoResizeRows(filaCabeceraTabla, filas.length - filaCabeceraTabla + 1);
    /* Si la lista se va a una segunda hoja, que los títulos salgan también allí. */
    hoja.setFrozenRows(filaCabeceraTabla);
  } else {
    hoja.setFrozenRows(0);
  }
  return pend.length;
}

/* Las diferencias con Jefatura que todavía no has marcado como resueltas. */
function discrepanciasPendientes_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_DISCREP);
  const salida = [];
  if (!hoja || hoja.getLastRow() < 3) return salida;
  const datos = hoja.getRange(3, 1, hoja.getLastRow() - 2, 8).getValues();
  for (let f = 0; f < datos.length; f++) {
    const alumno = String(datos[f][2] || '').trim();
    const tipo = String(datos[f][3] || '').trim();
    if (!tipo) continue;
    if (String(datos[f][6] || '').trim() !== '') continue;   // ya le has puesto un estado
    salida.push([String(datos[f][1] || ''), alumno, tipo,
                 String(datos[f][4] || ''), String(datos[f][5] || '')]);
  }
  return salida;
}

/*** ================= RELLENAR LAS PESTAÑAS (SIN PDF) =================
 *
 * Lo llama el botón "1. Actualizar los datos", en Panel.gs.
 * Devuelve un resumen de lo hecho, para que el panel lo cuente.
 * ======================================================== ***/
function rellenarPestanasInformes_() {
  const A = leerAlumnado_();
  const libro = SpreadsheetApp.openById(ID_INFORMES);

  const avisos = [], resumen = [], usadas = {}, informes = [];
  let totalEscritos = 0, membretesCambiados = 0;
  let membrete = null;
  try { membrete = blobMembrete_(); } catch (e) { membrete = null; }
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
  const siglasSinExplicar = {};

  const hojas = libro.getSheets();
  for (let h = 0; h < hojas.length; h++) {
    const hoja = hojas[h];
    if (hoja.getLastRow() < FILA_TITULOS) continue;

    const anchoFila7 = Math.max(hoja.getLastColumn(), 15);
    const fila7 = hoja.getRange(FILA_GRUPO, 1, 1, anchoFila7).getValues()[0];
    const grupo = grupoDeFila7(fila7);
    if (!grupo) continue;   // no es una pestaña de grupo
    limpiarRotuloDiver_(hoja, fila7);
    const nivel = grupo.substring(0, 2);

    const anchoViejo = hoja.getLastColumn();
    const titulosViejos = hoja.getRange(FILA_TITULOS, 1, 1, anchoViejo).getValues()[0];
    if (indiceTitulos(titulosViejos)[normalizar('Alumno/a:')] === undefined) {
      avisos.push([grupo, hoja.getName(), 'Sin columna Alumno/a:',
                   'La fila ' + FILA_TITULOS + ' no tiene el título "Alumno/a:". No la he tocado.']);
      continue;
    }

    /* Lo que había, guardado por nombre de alumno y por clave de columna.
       Así da igual que las columnas cambien de sitio: nada se pierde. */
    const previos = {};
    const ultima = hoja.getLastRow();
    if (ultima >= FILA_DATOS) {
      const iNomInf = indiceTitulos(titulosViejos)[normalizar('Alumno/a:')];
      const viejo = hoja.getRange(FILA_DATOS, 1, ultima - FILA_DATOS + 1, anchoViejo).getValues();
      for (let f = 0; f < viejo.length; f++) {
        const n = String(viejo[f][iNomInf] || '').trim();
        if (!n) continue;
        const porClave = {};
        for (let c = 0; c < anchoViejo; c++) {
          const t = String(titulosViejos[c] || '').trim();
          if (t) porClave[claveColumna_(t)] = viejo[f][c];
        }
        previos[normalizar(n)] = porClave;
      }
    }

    const alumnos = A.porUnidad[normalizar(grupo)] || [];
    if (!alumnos.length) {
      avisos.push([grupo, hoja.getName(), 'Grupo sin alumnos en ALUMNADO',
                   'No hay ningún alumno con Unidad = "' + grupo + '". No la he tocado.']);
      continue;
    }
    usadas[normalizar(grupo)] = true;

    const claves = columnasDeLaPestana_(nivel, titulosViejos);
    const ancho = claves.length + 1;              // más la columna de numeración
    const W = anchosDeLaPestana_(claves);

    /* Las filas 1 a 6 llevan la leyenda en una celda unida. Hay que soltarla
       y limpiar el texto residual antes de añadir o quitar columnas, o Google no deja. */
    try { 
      const cabecera = hoja.getRange(1, 1, FILAS_CABECERA, hoja.getMaxColumns());
      cabecera.breakApart();
      cabecera.clearContent();
    }
    catch (e) { /* no había nada unido */ }

    // Dejar la pestaña con el número de columnas justo
    if (hoja.getMaxColumns() < ancho) {
      hoja.insertColumnsAfter(hoja.getMaxColumns(), ancho - hoja.getMaxColumns());
    } else if (hoja.getMaxColumns() > ancho) {
      hoja.deleteColumns(ancho + 1, hoja.getMaxColumns() - ancho);
    }

    // Avisar de datos manuales que se pierden porque el alumno ya no está
    const ahora = {};
    for (let f = 0; f < alumnos.length; f++) {
      ahora[normalizar(alumnos[f][A.idx[normalizar('Alumno/a')]])] = true;
    }
    for (const clave in previos) {
      if (!ahora[clave]) {
        avisos.push([grupo, hoja.getName(), 'Alumno que ya no está en el grupo',
                     'Estaba en el informe pero no en ALUMNADO. Se ha quitado de la lista.']);
      }
    }

    // Rótulos y datos, de una vez
    const rotulos = [''];
    for (let c = 0; c < claves.length; c++) rotulos.push(ROTULOS[claves[c]] || claves[c]);
    const bloque = construirBloque(claves, alumnos, A.idx, previos);

    if (ultima >= FILA_TITULOS) {
      hoja.getRange(FILA_TITULOS, 1, ultima - FILA_TITULOS + 1, ancho).clearContent();
    }
    hoja.getRange(FILA_TITULOS, 1, 1, ancho).setValues([rotulos]);
    hoja.getRange(FILA_DATOS, 1, bloque.length, ancho).setValues(bloque);

    /* La fila 8 llevaba la leyenda. Ahora la leyenda va arriba, al lado del
       membrete, así que esta fila se vacía y se deja lo más baja posible. */
    hoja.getRange(FILA_LEYENDA, 1, 1, ancho).clearContent();
    hoja.setRowHeight(FILA_LEYENDA, ALTO_MINIMO_FILA);
    const textoCabecera = alumnos.length + ' alumnos · ' + hoy;
    const celdaCabecera = hoja.getRange(FILA_GRUPO, ancho);
    celdaCabecera.setValue(textoCabecera)
        .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('right').setWrap(false);
    informes.push({ hoja: hoja, nombre: grupo, celda: celdaCabecera, texto: textoCabecera });

    // Formato
    hoja.getRange(FILA_TITULOS, 1, 1, ancho).setFontWeight('bold').setWrap(true)
        .setHorizontalAlignment('center');
    hoja.getRange(FILA_TITULOS, 1, bloque.length + 1, ancho)
        .setBorder(true, true, true, true, true, true, '#999999', SpreadsheetApp.BorderStyle.SOLID)
        .setFontSize(LETRA_INFORME).setVerticalAlignment('middle');
    hoja.setColumnWidth(1, ANCHO_NUMERACION);
    hoja.getRange(FILA_DATOS, 1, bloque.length, 1).setHorizontalAlignment('center');
    /* El ancho no se puede agrupar (cada columna lleva el suyo), pero el
       ajuste de texto solo tiene dos casos: con ajuste o centrada. Se
       agrupan en dos listas y se aplican con getRangeList al final, en vez
       de una llamada por columna. Con esto se rellenan 23 pestañas cada
       vez que se pulsa "Actualizar los datos". */
    const colsConAjuste = [], colsCentradas = [];
    const filaUltima = FILA_DATOS + bloque.length - 1;
    for (let c = 0; c < claves.length; c++) {
      hoja.setColumnWidth(c + 2, W.anchos[claves[c]]);
      const letra = fmtLetraColumna_(c + 2);
      const ref = letra + FILA_DATOS + ':' + letra + filaUltima;
      if (CON_AJUSTE.indexOf(claves[c]) !== -1) colsConAjuste.push(ref);
      else colsCentradas.push(ref);
    }
    if (colsConAjuste.length) hoja.getRangeList(colsConAjuste).setWrap(true).setHorizontalAlignment('left');
    if (colsCentradas.length) hoja.getRangeList(colsCentradas).setWrap(false).setHorizontalAlignment('center');
    hoja.setRowHeight(FILA_TITULOS, altoDeLosRotulos_(claves, W.anchos));
    hoja.autoResizeRows(FILA_DATOS, bloque.length);
    if (ponerMembrete_(hoja, membrete)) membretesCambiados++;
    ajustarFilasDelLogo_(hoja);

    /* La leyenda, a medida de este grupo: solo las siglas que salen aquí. */
    const siglas = siglasDelBloque_(bloque, claves);
    const trozos = [];
    for (let s = 0; s < siglas.length; s++) {
      const e = explicacionDeSigla_(siglas[s]);
      if (e) trozos.push(siglas[s] + ': ' + e + '.');
      else siglasSinExplicar[siglas[s]] = true;
    }
    try {
      const L = escribirLeyendaCabecera_(hoja, claves, W.anchos, ancho, trozos);
      if (L.aviso) avisos.push([grupo, hoja.getName(), 'La leyenda no cabe entera', L.aviso]);
    } catch (e) {
      avisos.push([grupo, hoja.getName(), 'No he podido escribir la leyenda', e.message]);
    }
    hoja.setFrozenRows(FILA_TITULOS);

    if (W.suma > ANCHO_FOLIO + 40) {
      avisos.push([grupo, hoja.getName(), 'La tabla es demasiado ancha',
                   'Suma ' + W.suma + ' puntos y en el folio caben ' + ANCHO_FOLIO +
                   '. El PDF la encogerá y la letra saldrá pequeña.']);
    }

    resumen.push(hoja.getName() + ' (' + grupo + '): ' + bloque.length + ' alumnos');
    totalEscritos += bloque.length;
  }

  /* Una sigla que sale en el informe y no está en el diccionario deja al tutor
     sin saber qué es. Se avisa una sola vez, con todas juntas. */
  const listaSinExplicar = [];
  for (const s in siglasSinExplicar) listaSinExplicar.push(s);
  if (listaSinExplicar.length) {
    listaSinExplicar.sort();
    avisos.push(['', '', 'Siglas sin explicar en la leyenda',
                 'Salen en los informes pero no están en EXPLICACION_SIGLAS (NEAE.gs): ' +
                 listaSinExplicar.join(', ') + '. Hay que añadirlas.']);
  }

  for (const u in A.porUnidad) {
    if (!usadas[u]) {
      avisos.push([A.porUnidad[u][0][A.idx[normalizar('Unidad')]], '', 'Grupo sin pestaña',
                   'Hay ' + A.porUnidad[u].length + ' alumnos con esta unidad y ninguna pestaña para ellos.']);
    }
  }
  for (let i = 0; i < A.sinUnidad.length; i++) {
    avisos.push(['', '', 'Alumno sin unidad en Séneca',
                 A.sinUnidad[i][0] + ' (' + A.sinUnidad[i][1] + ' ESO). Sale en la portada del PDF.']);
  }

  let nPend = 0;
  try { nPend = escribirPortada_(libro, A, resumen); }
  catch (e) { avisos.push(['', '', 'No he podido hacer la portada', e.message]); }

  escribirAvisosInformes_(avisos);

  return { grupos: resumen.length, alumnos: totalEscritos, avisos: avisos.length,
           membretes: membretesCambiados, sinUnidad: A.sinUnidad.length,
           siglasSinExplicar: listaSinExplicar, pendientesSeneca: nPend };
}

/*** ================= BOTONES 2 Y 3: LOS PDF =================
 *
 * No cambian ningún dato: exportan lo que ya está en las pestañas. Cada
 * pestaña se prepara justo antes de exportarla y se deja como estaba justo
 * después. Por eso se pueden pulsar cuando se quiera, y por eso no pasa nada
 * si Google corta a medias: se vuelve a pulsar más tarde y completa lo que
 * falte.
 *
 *   Botón 2, definitivos -> con membrete, sin interrogantes.
 *   Botón 3, borrador    -> sin membrete, con interrogantes, rótulo BORRADOR.
 *
 * generarPdfs() se llama igual que siempre, para que la opción de menú de
 * antes siga funcionando mientras el menú se refresca.
 * ======================================================== ***/

function generarPdfs() { generarLosPdf_(false); }

function generarPdfsBorrador() { generarLosPdf_(true); }

function generarLosPdf_(borrador) {
  const comoSeLlama = borrador ? '3. Generar los PDF (borrador)'
                               : '2. Generar los PDF (definitivos)';
  let libro;
  try {
    libro = SpreadsheetApp.openById(ID_INFORMES);
  } catch (e) {
    avisar_('No he podido abrir el cuaderno de informes', e.message);
    return;
  }

  let entradas;
  try {
    entradas = entradasParaPdf_(libro);
  } catch (e) {
    avisar_('No he podido mirar las pestañas', e.message);
    return;
  }

  if (!entradas.length) {
    avisar_('No hay nada que exportar',
      'No he encontrado ninguna pestaña de grupo en el cuaderno de informes.\n\n' +
      'Pulsa antes "1. Actualizar los datos".');
    return;
  }

  const avisos = [];
  let sueltos = null;
  try {
    sueltos = pdfsPorInforme_(libro, entradas, borrador);
    for (let i = 0; i < sueltos.dobles.length; i++) {
      avisos.push(['', '', 'Informe de más de una hoja', sueltos.dobles[i] +
                   '. Lo pone en su cabecera, para que el tutor lo sepa.']);
    }
    for (let i = 0; i < sueltos.fallidos.length; i++) {
      avisos.push(['', '', 'PDF que no ha salido', sueltos.fallidos[i] +
                   '. Vuelve a pulsar "' + comoSeLlama + '" dentro de un rato.']);
    }
  } catch (e) {
    avisos.push(['', '', 'No he podido hacer los PDF', e.message]);
  }

  escribirAvisosInformes_(avisos);

  const total = sueltos ? sueltos.hechos + sueltos.fallidos.length : entradas.length;
  avisar_((borrador ? 'PDF de borrador generados' : 'PDF definitivos generados') +
    ' (' + VERSION + ')',
    (borrador
      ? 'Son los tuyos, para revisar: sin membrete, con las interrogantes y con la palabra BORRADOR arriba.'
      : 'Son los del profesorado: con membrete y sin ninguna interrogante.') + '\n\n' +
    (sueltos
      ? 'Carpeta "' + sueltos.carpeta + '": ' + sueltos.hechos + ' de ' + total + ' ficheros.' +
        (sueltos.fallidos.length
          ? '\n\nGoogle no me ha dejado sacar ' + sueltos.fallidos.length +
            '. No pasa nada: los que ya estaban siguen ahí.' +
            '\nVuelve a pulsar "' + comoSeLlama + '" dentro de un rato y completará lo que falte.'
          : '\n\nHan salido todos.')
      : 'No se ha podido exportar nada.') +
    '\n\nAvisos anotados: ' + avisos.length +
    (avisos.length ? '\nMíralos en la pestaña "' + HOJA_AV_INF + '".' : ''));
}

/*** ================= LA OPCIÓN ANTIGUA =================
 *
 * Rellenaba las pestañas y sacaba los PDF de una vez. Ya no está en el menú,
 * pero se deja: si Francisco abre el cuaderno antes de que el menú se
 * refresque, todavía vería la opción vieja y tiene que seguir funcionando.
 * ======================================================== ***/
function rellenarInformes() {
  let R;
  try {
    R = rellenarPestanasInformes_();
  } catch (e) {
    avisar_('No he podido rellenar los informes', e.message);
    return;
  }
  generarPdfs();
}

/* La pestaña AVISOS INFORMES, desde la BD v24, tiene dos columnas de
   Francisco: "Estado" y "Observaciones".

   CUIDADO: esta pestaña se reconstruye entera en cada ejecución, así que hay
   que leer esas dos columnas ANTES de limpiarla y volver a colocarlas al
   escribir cada fila. Si no, se pierde lo anotado, que es justo el fallo que
   tenía la pestaña AVISOS hasta la BD v21.

   Cada incidencia se reconoce por sus cuatro columnas: grupo, pestaña, aviso
   y detalle. Las dos funciones que hacen esto están en Formato.gs.

   El formato (anchos, ajuste de texto, filtro, desplegable de Estado) lo pone
   formatearHoja_, también en Formato.gs. Se llama aquí, y no solo desde el
   botón de actualizar, porque generarPdfs() reescribe esta misma pestaña y
   esa opción no pasa por el formateo general. */
function escribirAvisosInformes_(avisos) {
  const titulos = ['Grupo', 'Pestaña', 'Aviso', 'Detalle', 'Estado', 'Observaciones'];
  const previos = notasDeAvisosInformes_();
  const hoja = hojaLimpia(HOJA_AV_INF, titulos.length);
  hoja.getRange(1, 1).setValue('Incidencias al rellenar los informes por unidad. ' +
    'Las dos últimas columnas las rellenas tú y no se pierden. Actualizado: ' +
    new Date().toLocaleString('es-ES')).setFontStyle('italic');
  hoja.getRange(2, 1, 1, titulos.length).setValues([titulos]).setFontWeight('bold');
  if (avisos.length) {
    const filas = avisos.map(function (a) {
      const man = previos[claveAvisoInforme_(a)] || ['', ''];
      return [a[0], a[1], a[2], a[3], man[0], man[1]];
    });
    hoja.getRange(3, 1, filas.length, titulos.length).setValues(filas);
  }
  hoja.setFrozenRows(2);
  try { formatearHoja_(HOJA_AV_INF); } catch (e) { /* el formato no es crítico */ }
}
