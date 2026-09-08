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

/* La versión que se enseña en el panel. Codigo.gs tiene la suya; mientras
   esta exista, manda esta. */
const VERSION_BD = 'BD v34';

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
    notas: {
      'Alumno/a': 'Nombre tal y como lo escribe Séneca.',
      'Nº Id. Escolar': 'El número de alumno de Séneca. Es el único identificador de verdad que hay en todo el sistema, y solo viene en el fichero del histórico (RegAlum.csv). Los CSV de matrícula no lo traen.',
      'Unidad': 'El grupo que consta en el histórico, que puede ir por detrás del de la matrícula.',
      'Curso': 'El nivel que consta en el histórico: 1º, 2º, 3º o 4º.',
      'Edad a 31/12': 'Los años que cumple a 31 de diciembre. Lo da Séneca.',
      'Repite el curso actual': 'SÍ cuando el mismo curso aparece en dos años de matrícula distintos.',
      'Repeticiones en ESO': 'Cuántos cursos ha repetido en la ESO en este centro.',
      'Rep. Primaria (calculado)': 'Cuántos cursos repitió en Primaria, según la fuente que diga la columna de al lado.',
      'Fuente Primaria': 'De dónde sale ese número EN ESTA PESTAÑA: 1ºESO o EDAD.\n\nAquí nunca pone EXPEDIENTE. Esta pestaña es el volcado del histórico de Séneca, y el expediente de Primaria se aplica después, al construir la tabla ALUMNADO. Si quieres ver la fuente definitiva de un alumno, míralo en ALUMNADO.',
      'Fecha de nacimiento': 'La fecha de nacimiento. Se usa para deshacer empates en el censo NEAE, que solo trae las iniciales del alumno.',
      'Cursos repetidos en ESO': 'Qué cursos repitió y en qué años. Formato: 1º (2022, 2023).',
      'Curso el año pasado': 'En qué curso de este centro estaba matriculado el año académico anterior. Vacío quiere decir que no estaba aquí.',
      'Repetía el año pasado': 'SÍ si el curso en el que estaba el año pasado ya lo había cursado antes. Es el dato del que sale la columna PIL de ALUMNADO.'
    },
    cols: {
      'Alumno/a': [210, 'I'], 'Nº Id. Escolar': [85, 'C'], 'Unidad': [65, 'C'],
      'Curso': [50, 'C'], 'Edad a 31/12': [60, 'C'], 'Repite el curso actual': [65, 'C'],
      'Repeticiones en ESO': [65, 'C'], 'Rep. Primaria (calculado)': [65, 'C'],
      'Fuente Primaria': [90, 'C'], 'Fecha de nacimiento': [95, 'C'],
      'Cursos repetidos en ESO': [140, 'W'],
      'Curso el año pasado': [80, 'C'], 'Repetía el año pasado': [80, 'C']
    }
  },

  'ALUMNADO': {
    cabecera: 2, congelar: 2,
    manuales: ['Rep. Primaria (corregido)', 'Motivo de la corrección', 'Observaciones'],
    noProteger: ['NEAE', 'MEDIDAS Y RECURSOS'],
    notas: {
      'Alumno/a': 'Nombre tal y como lo escribe Séneca: primero los apellidos, luego el nombre, separados por una coma.\n\nEs la forma que tiene el programa de reconocer al mismo alumno en los distintos ficheros. Como los CSV de Séneca no traen número de alumno, el cruce se hace por el nombre MÁS el curso. Si dos alumnos se llaman igual, sale un aviso.',
      'Unidad': 'Grupo en el que Séneca tiene matriculado al alumno, por ejemplo 2º ESO C.\n\nSi está vacía, el alumno no saldrá en ningún informe de grupo. Esos casos van en rojo y en la pestaña AVISOS.',
      'Curso': 'El nivel: 1º, 2º, 3º o 4º. Se saca de la Unidad.\n\nAdemás del nivel, sirve para distinguir a dos alumnos que se llamen igual.',
      'Edad a 31/12': 'Los años que cumple el alumno a 31 de diciembre de este curso. Lo da Séneca en el histórico.\n\nSe usa para estimar las repeticiones de Primaria cuando no hay una fuente mejor. Edad que corresponde a cada curso sin repetir: 1º = 12, 2º = 13, 3º = 14, 4º = 15.',
      'Curso el año pasado': 'En qué curso estaba el alumno el año académico pasado.\n\nSale del histórico de matrículas de Séneca, que trae una línea por alumno y año. En 1º de ESO el curso pasado fue 6º de Primaria, y eso lo dice su expediente.\n\nUn ? quiere decir que no lo sabemos: casi siempre es alumnado que llegó este año de otro centro, porque el histórico solo trae las matrículas de aquí.\n\nEsta columna y la siguiente están puestas para que se pueda entender de dónde sale la columna PIL.',
      'Repetía el año pasado': 'SÍ cuando el curso en el que estaba el año pasado ya lo había cursado antes.\n\nEs el dato clave de la columna PIL: quien el año pasado estaba repitiendo su curso ya no podía volver a repetirlo, así que si este año está en el siguiente es que promocionó sin poder quedarse.\n\nEn 1º de ESO quiere decir que repitió 6º de Primaria, y eso solo lo dice su expediente. Un ? quiere decir que no lo sabemos.',
      'Repite el curso actual': 'SÍ cuando el alumno ya estuvo matriculado antes en este mismo curso.\n\nSale del histórico de matrículas de Séneca (RegAlum.csv), que trae una línea por alumno y año. Si el mismo curso aparece en dos años distintos, es que lo repite.\n\nOjo: solo se ven las matrículas de este centro.',
      'Repeticiones en ESO': 'Cuántas veces ha repetido en la ESO, contando también el curso que está repitiendo ahora.\n\nSale del histórico de matrículas de este centro. Si repitió en otro instituto antes de llegar aquí, no aparece.',
      'Cursos repetidos en ESO': 'Qué cursos ha repetido y en qué años. Formato: 1º (2022, 2023).\n\nEs el detalle de la columna anterior. Sale del histórico de matrículas de este centro.',
      'Rep. Primaria (calculado)': 'Cuántos cursos repitió en Primaria, según la mejor fuente que haya. La columna Fuente Primaria dice cuál es y cuánto fiarse.\n\nSi el número no es correcto, no se corrige aquí: se escribe el bueno en Rep. Primaria (corregido), que es amarilla.',
      'Cursos repetidos en Primaria': 'Qué cursos de Primaria repitió.\n\nSolo se sabe de los alumnos de 1º que tienen su expediente de Primaria descargado. Casilla vacía = no repitió ninguno. Un ? = repitió, pero no tenemos el expediente que diga cuál. En 2º, 3º y 4º lo normal es el ?.',
      'Fuente Primaria': 'De dónde sale el número de repeticiones de Primaria. De más a menos fiable:\n\nEXPEDIENTE = lo dice el expediente de Primaria del alumno. Es seguro, y es el único que dice qué curso repitió. Solo en 1º.\n\n1ºESO = la edad que tenía al matricularse en 1º de ESO en este centro, menos 12. Fiable.\n\nEDAD = estimación: edad de ahora, menos la edad que le tocaría por curso, menos las repeticiones de ESO. Hay que revisarla a mano, y por eso sale en ámbar. Un alumno mayor por otro motivo (llegó tarde al sistema educativo español, estudió fuera) suma una repetición que no existe.',
      'Rep. sin localizar': 'Repeticiones que este alumno hizo seguro, pero de las que no sabemos ni el curso ni el centro.\n\nSe calcula con la edad: años que le sobran para el curso en el que está, menos las repeticiones de ESO en este centro, menos las de Primaria. Lo que queda son años perdidos que ninguna de nuestras fuentes explica.\n\nCasi siempre es alumnado que repitió en otro instituto antes de llegar aquí: el histórico de Séneca solo trae las matrículas de este centro.\n\nCuentan para las repeticiones totales y para el PIL, igual que las demás. Van en ámbar porque conviene mirarlas: si el alumno va retrasado por otro motivo (llegó tarde al sistema educativo español, estudió fuera), el número no es una repetición, y entonces se corrige a mano en Rep. Primaria (corregido).',
      'Rep. Primaria (corregido)': 'AQUÍ ESCRIBES TÚ. Si sabes que el número calculado no es correcto, pon aquí el bueno.\n\nEl programa no toca nunca esta columna, y el número que pongas manda sobre el calculado para las repeticiones totales y para el PIL.',
      'Motivo de la corrección': 'AQUÍ ESCRIBES TÚ. Por qué has corregido el número: por ejemplo, se incorporó al sistema educativo español en 4º de Primaria.\n\nSirve para que dentro de un año se entienda la corrección.',
      'Repeticiones totales': 'Repeticiones de Primaria más repeticiones en ESO.\n\nSi has escrito algo en Rep. Primaria (corregido), se usa ese número en vez del calculado.\n\nDe este número dependen las dos columnas de PIL, así que conviene mirarlo cuando un PIL no cuadre.',
      'PIL': 'PIL quiere decir Promoción por Imperativo Legal, y esta columna es la lectura literal de esas palabras: EL ALUMNO ESTÁ EN ESTE CURSO PORQUE EL AÑO PASADO YA NO PODÍA REPETIR.\n\nMira al curso PASADO, no a este. Es la que necesita el equipo directivo para contarle al profesorado cómo llega cada alumno, y es la que sale en el informe en papel.\n\nSÍ cuando el alumno no repite este curso y además se cumple una de estas dos: el año pasado ya estaba repitiendo su curso, o ya tenía gastadas las dos permanencias.\n\nNO cuando repite este curso: entonces no promocionó, se quedó.\n\nSÍ (por edad) = sale SÍ, pero apoyado en un número de repeticiones que es una suposición sacada de la edad y que nadie ha comprobado. Va en ámbar.\n\nUn ? quiere decir que no sabemos en qué curso estaba el año pasado, casi siempre porque llegó de otro centro.\n\nNO CONFUNDIR con las dos columnas siguientes: son tres preguntas distintas y los tres grupos de alumnos son distintos.',
      'No podrá repetir este curso': 'Si suspende en junio, pasará al curso siguiente igualmente.\n\nMira al futuro próximo. Es la pregunta que le interesa al tutor durante el curso. Es lo que esta base de datos llamaba PIL hasta la BD v33.\n\nSÍ cuando se cumple una de las dos: ya está repitiendo el curso en el que está, o tiene 2 o más repeticiones totales.\n\nSÍ (por edad) = sale SÍ, pero apoyado en un número sin comprobar. Va en ámbar.\n\nEsta columna no sale en el papel.',
      'Ha agotado las dos permanencias': 'No puede repetir ningún curso más en toda la enseñanza obligatoria, Primaria y ESO juntas. La norma deja repetir dos veces como máximo.\n\nMira a toda la etapa, no a un curso. Es lo que esta base de datos llamaba PIL (etapa) hasta la BD v33.\n\nSÍ cuando las repeticiones totales son 2 o más.\n\nSÍ (por edad) = sale SÍ, pero apoyado en un número sin comprobar. Va en ámbar.\n\nLa diferencia con la columna de al lado son los alumnos que están repitiendo ahora y es su primera repetición: esos no podrán repetir este curso otra vez, pero todavía les queda una permanencia para más adelante.\n\nEsta columna no sale en el papel.',
      'MAT NO SUP.': 'Materias que el alumno suspendió el curso pasado y está volviendo a cursar porque repite. Formato: 5 de 2º: FYQ, GEH, LCL, MAT, FRA2.\n\nSalen de las hojas de notas del curso anterior (cuaderno PROPUESTA MATRÍCULA), y solo de las columnas del propio curso.\n\nNo confundir con Asignaturas pendientes, que son de cursos anteriores. Un mismo código puede salir en las dos columnas: es la misma materia, de años distintos.\n\nUn ? quiere decir que el alumno repite pero no aparece en la hoja de notas.',
      'Nº pendientes': 'Cuántas asignaturas arrastra de cursos anteriores.\n\nNo cuenta las materias que suspendió el año pasado y está repitiendo: esas van en MAT NO SUP.',
      'Asignaturas pendientes': 'Las materias que el alumno arrastra de cursos anteriores mientras hace el siguiente. Formato: 2: BYG 1º, GEH 1º.\n\nEn 2º, 3º y 4º salen de las columnas PEND de los CSV de matrícula de Séneca.\n\nEn 1º son las que suspendió en 6º de Primaria, y salen de su expediente de Primaria. Mientras ese expediente no esté descargado, aquí pone ? y la casilla va en ámbar.\n\nUn alumno que repite 1º no arrastra nada de Primaria: su casilla va vacía a propósito.',
      'Diversificación': 'SÍ = Séneca lo confirma.\nSÍ (solo Jefatura) = lo dice el fichero de Jefatura, pero Séneca todavía no.\nNO = no está en diversificación.\n\nSéneca lo refleja matriculando al alumno en las materias de Ámbito. En 4º, además, en Matemáticas = ÁMB.',
      'NEAE': 'Necesidades específicas de apoyo educativo, abreviadas. Sale del censo NEAE de Séneca (RegAluNEE.csv).\n\nCategorías: NEE (necesidades educativas especiales), DIA (dificultades de aprendizaje), AACC (altas capacidades), COM (compensación educativa). Detrás van hasta dos detalles, y un +2 si hay más.\n\nCasilla vacía = ese alumno no tiene NEAE, siempre que el censo descargado incluya su curso. Si el censo no trae su curso, sale un aviso.',
      'MEDIDAS Y RECURSOS': 'Lo que recibe el alumno, según el censo NEAE de Séneca. Formato: las medidas, una barra, y el profesorado o personal de apoyo. Por ejemplo: ACS, PE, PRA / PT, AL.\n\nLas siglas se explican en la leyenda de cada informe de grupo, que se genera sola con las siglas que aparecen en ese grupo.',
      'OPT': 'La optativa que cursa. Códigos: OyD (Oratoria y Debate), CyR (Computación y Robótica), MTGE (Music, theatre and games), PEPA (Proyecto de Plástica), LAB (Laboratorio de Física y Química), CC (Cultura Clásica), MUS (Música), FR (Francés).\n\nLos alumnos de diversificación de 3º llevan dos, separadas por una barra: la suya y Música.\n\nEn 4º esta columna va vacía: sus opciones están en OPC1 a OPC4.',
      'FR -> ALCT': 'Solo en 1º. Dice qué cursa el alumno de las dos opciones que hay:\n\nFR = Francés, Segundo Idioma.\nALCT = Área Lingüística de carácter transversal, que es la alternativa de quien está exento de francés.\n\nNo puede estar vacía. Si lo está, es que en Séneca no está matriculado en ninguna de las dos, y sale un aviso.',
      'MAT': 'Solo en 4º. Qué matemáticas cursa: MatA, MatB, o ÁMB si va por diversificación (Ámbito Científico-Tecnológico).',
      'OPC1': 'Solo en 4º. Primera opción: ECO (Economía), TEC (Tecnología) o BYG (Biología y Geología).\n\nLos alumnos de diversificación no cursan esta columna.',
      'OPC2': 'Solo en 4º. Segunda opción: FOPP (Formación y Orientación Personal y Profesional), FQ (Física y Química) o LAT (Latín).\n\nLos alumnos de diversificación no cursan esta columna.',
      'OPC3': 'Solo en 4º. Tercera opción: DIG (Digitalización), EA (Expresión Artística) o FR (Francés).',
      'OPC4': 'Solo en 4º. Cuarta opción: NSD (Nutrición, Salud y Deporte), PB (Prácticas Biológicas), DT (Dibujo Técnico) o ASE (Aprendizaje Social y Emocional).',
      'REL/Atedu': 'Qué cursa el alumno en la hora de religión: CAT (Religión Católica), EVA (Religión Evangélica) o ATEDU (Atención Educativa).',
      'Observaciones': 'AQUÍ ESCRIBES TÚ. Lo que quieras anotar de ese alumno.\n\nEl programa no toca nunca esta columna: se guarda antes de reconstruir la tabla y se vuelve a poner igual.'
    },
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'], 'Edad a 31/12': [60, 'C'],
      'Curso el año pasado': [80, 'C'], 'Repetía el año pasado': [80, 'C'],
      'Repite el curso actual': [65, 'C'], 'Repeticiones en ESO': [65, 'C'],
      'Cursos repetidos en ESO': [140, 'W'], 'Rep. Primaria (calculado)': [65, 'C'],
      'Cursos repetidos en Primaria': [105, 'C'], 'Fuente Primaria': [90, 'C'],
      'Rep. sin localizar': [70, 'C'], 'Rep. Primaria (corregido)': [65, 'C'], 'Motivo de la corrección': [170, 'W'],
      'Repeticiones totales': [65, 'C'], 'PIL': [85, 'C'],
      'No podrá repetir este curso': [95, 'C'], 'Ha agotado las dos permanencias': [95, 'C'],
      'MAT NO SUP.': [200, 'W'], 'Nº pendientes': [55, 'C'], 'Asignaturas pendientes': [230, 'W'],
      'Diversificación': [95, 'C'], 'NEAE': [180, 'W'], 'MEDIDAS Y RECURSOS': [180, 'W'],
      'OPT': [60, 'C'], 'FR -> ALCT': [60, 'C'], 'MAT': [55, 'C'], 'OPC1': [55, 'C'],
      'OPC2': [55, 'C'], 'OPC3': [55, 'C'], 'OPC4': [55, 'C'], 'REL/Atedu': [65, 'C'],
      'Observaciones': [200, 'W']
    }
  },

  'JEFATURA': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
    notas: {
      'Alumno/a': 'Nombre tal y como lo escribe Jefatura de Estudios en su cuaderno AGRUPAMIENTOS.',
      'Unidad': 'El grupo en el que Jefatura quiere que esté el alumno. Sale del nombre de la pestaña de su cuaderno.',
      'Curso': 'El nivel: 1º, 2º, 3º o 4º.',
      'Grupo de origen': 'De dónde viene el alumno, según Jefatura.',
      'REL/Atedu': 'Religión o atención educativa, con los códigos ya traducidos a los nuestros.',
      'OPT': 'La optativa que quiere Jefatura. En los alumnos de diversificación de 3º van las dos, separadas por una barra: la suya y Música.',
      'OPT 2 (DIV)': 'La segunda optativa de los alumnos de diversificación de 3º, tal como viene en la columna aparte del cuaderno de Jefatura.',
      'MAT': 'Matemáticas A o B, en 4º.',
      'OPC1': 'Primera opción de 4º, con el código ya traducido al nuestro.',
      'OPC2': 'Segunda opción de 4º.',
      'OPC3': 'Tercera opción de 4º.',
      'OPC4': 'Cuarta opción de 4º.',
      'FR -> ALCT': 'En 1º: ALCT si Jefatura lo marca como exento de francés, y FR si no.',
      'Repite': 'SÍ si Jefatura lo ha marcado como repetidor en su cuaderno.',
      'PIL': 'SÍ si Jefatura lo ha marcado como PIL en su cuaderno. Es su anotación, no el cálculo del programa.',
      'Conflictivo': 'SÍ si Jefatura lo ha marcado así en su cuaderno.',
      'NEAE': 'NEAE si Jefatura lo ha marcado así en su cuaderno. Es su anotación, no el censo de Séneca.',
      'Diversificación': 'SÍ si Jefatura escribe DIV o DIVER en la fila del alumno. Se mira el texto, no el color de la celda: el amarillo significa otra cosa en 1º.'
    },
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
    notas: {
      'Curso': 'El nivel del alumno. Las filas van ordenadas por curso y por alumno, para que todo lo de una misma persona salga junto.',
      'Grupo': 'El grupo en el que Jefatura quiere al alumno.',
      'Alumno/a': 'El alumno al que se refiere la diferencia.',
      'Qué no cuadra': 'En qué no coinciden Séneca y el fichero de Jefatura. Puede ser el grupo, el curso, la diversificación, la religión, una optativa, la exención de francés, o que el alumno esté en un sitio y no en el otro.',
      'Séneca dice': 'Lo que hay hoy en Séneca, que es el registro oficial.',
      'Jefatura quiere': 'Lo que dice el cuaderno de Jefatura de Estudios, que es la organización que ha decidido el centro.',
      'Estado': 'AQUÍ ESCRIBES TÚ. Elige del desplegable cuando lo hayas resuelto.\n\nDejarlo en blanco quiere decir que sigue pendiente, y es lo que cuentan el panel y la portada del PDF. Por eso el desplegable no tiene ninguna opción que signifique pendiente.',
      'Observaciones': 'AQUÍ ESCRIBES TÚ. Lo que quieras anotar. No se pierde al actualizar.'
    },
    cols: {
      'Curso': [50, 'C'], 'Grupo': [65, 'C'], 'Alumno/a': [200, 'I'],
      'Qué no cuadra': [190, 'W'], 'Séneca dice': [115, 'W'],
      'Jefatura quiere': [115, 'W'], 'Estado': [130, 'C'], 'Observaciones': [220, 'W']
    }
  },

  'NEAE': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
    notas: {
      'Alumno/a': 'El alumno al que se ha asignado esta ficha del censo. El fichero de Séneca no trae el nombre: hay que averiguarlo.',
      'Unidad': 'Su grupo, sacado de la tabla ALUMNADO.',
      'Curso': 'El nivel que trae la ficha del censo.',
      'Iniciales': 'Lo único que trae el fichero de Séneca para identificar al alumno. Son la inicial del nombre y las de los apellidos, contando solo las palabras que empiezan por mayúscula.',
      'Fecha de nacimiento': 'La que trae la ficha. Sirve para deshacer empates cuando dos alumnos del mismo curso tienen las mismas iniciales.',
      'NEAE': 'La categoría y hasta dos detalles, abreviados.',
      'MEDIDAS Y RECURSOS': 'Las medidas, una barra, y el profesorado o personal de apoyo.',
      'Cómo se ha localizado': 'Con qué datos se ha sabido de quién es la ficha: por iniciales y curso, o además por la fecha de nacimiento. Sirve para comprobar que el reparto es correcto.',
      'Texto original de Séneca': 'Lo que pone el fichero, palabra por palabra, antes de abreviarlo. Si algo está mal abreviado, se ve aquí.'
    },
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Curso': [50, 'C'],
      'Iniciales': [70, 'C'], 'Fecha de nacimiento': [95, 'C'],
      'NEAE': [200, 'W'], 'MEDIDAS Y RECURSOS': [190, 'W'],
      'Cómo se ha localizado': [150, 'W'], 'Texto original de Séneca': [320, 'W']
    }
  },

  'PRIMARIA': {
    cabecera: 2, congelar: 2, manuales: [], noProteger: [],
    notas: {
      'Alumno/a': 'El alumno, sacado del NOMBRE DEL FICHERO del expediente. Dentro del fichero no viene. Si el nombre del fichero no coincide con ninguno de la tabla, sale en rojo y en AVISOS.',
      'Unidad': 'Su grupo, sacado de la tabla ALUMNADO.',
      'Año de 1º': 'El año académico en el que empezó 1º de Primaria. Si repitió 1º, el primero de los dos.\n\nSirve para descartar que el alumno se incorporara tarde al sistema educativo español: se compara con su fecha de nacimiento. Si empezó 1º de Primaria el año en que cumplía 6, estaba aquí desde el principio, y entonces los años que le falten son repeticiones de verdad.',
      'Año de 6º': 'El año académico en el que cursó 6º de Primaria. Si repitió 6º, el más reciente.',
      'Nº pendientes': 'Cuántas materias suspendió en 6º de Primaria.',
      'Pendientes de 6º': 'Las materias del propio 6º con nota menor que 5. Son las que pasan a la columna Asignaturas pendientes de ALUMNADO y al informe de papel.',
      'Arrastraba de antes': 'Materias que el alumno ya traía suspensas de cursos anteriores de Primaria. NO se llevan al informe: en algunos alumnos son diez o más y no caben en el folio.',
      'Rep. Primaria (expediente)': 'Cuántos cursos de Primaria repitió, según su expediente. Solo se da por bueno si el expediente trae los seis cursos.',
      'Cursos repetidos': 'Qué cursos de Primaria repitió. Un curso que aparece en dos años académicos distintos es un curso repetido.',
      'Centro de 6º': 'El colegio donde cursó 6º.',
      'Fichero': 'El nombre del fichero CSV del que sale todo esto, para poder volver a él.'
    },
    cols: {
      'Alumno/a': [210, 'I'], 'Unidad': [65, 'C'], 'Año de 1º': [65, 'C'], 'Año de 6º': [65, 'C'],
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
    notas: {
      'Curso': 'El nivel del alumno al que se refiere el aviso, si lo hay.',
      'Grupo': 'Su grupo, si lo hay.',
      'Alumno/a': 'El alumno al que se refiere el aviso. Hay avisos que no son de ningún alumno concreto y llevan esta casilla vacía.',
      'Aviso': 'Qué es lo que no cuadra al construir la base de datos.',
      'Detalle': 'La explicación completa, con los datos concretos.',
      'Estado': 'AQUÍ ESCRIBES TÚ. Elige del desplegable cuando lo hayas mirado. Dejarlo en blanco quiere decir que sigue pendiente.',
      'Observaciones': 'AQUÍ ESCRIBES TÚ. Lo que quieras anotar. No se pierde al actualizar.'
    },
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
    notas: {
      'Grupo': 'El grupo al que se refiere el aviso.',
      'Pestaña': 'La pestaña del cuaderno de informes donde ha pasado.',
      'Aviso': 'Qué es lo que no cuadra al rellenar los listados por unidad o al sacar los PDF.',
      'Detalle': 'La explicación completa, con los datos concretos.',
      'Estado': 'AQUÍ ESCRIBES TÚ. Elige del desplegable cuando lo hayas mirado. Dejarlo en blanco quiere decir que sigue pendiente.',
      'Observaciones': 'AQUÍ ESCRIBES TÚ. Lo que quieras anotar. No se pierde al actualizar.'
    },
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

/* Filas alternas suaves. Con 668 filas y 30 columnas, seguir una fila con la
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
    /* Sabemos que repitió, pero no de qué curso. En Primaria solo lo dice el
       expediente; en ESO, un HISTORIAL de una versión anterior. */
    siDice('Cursos repetidos en Primaria', SIN_DATO, FMT_AMBAR);
    siDice('Cursos repetidos en ESO', SIN_DATO, FMT_AMBAR);
    /* Repeticiones de Primaria estimadas por edad: hay que revisarlas a mano. */
    siDice('Fuente Primaria', 'EDAD', FMT_AMBAR);
    /* Repeticiones que hubo pero no sabemos dónde. Cuentan para el PIL, y
       conviene mirarlas una a una: puede que el alumno vaya retrasado por
       otro motivo. Aquí el valor es un número, no un texto. */
    const cSinLoc = fmtColumnaDe_(titulos, 'Rep. sin localizar');
    if (cSinLoc) {
      reglas.push(SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(0).setBackground(FMT_AMBAR)
        .setRanges([hoja.getRange(primera, cSinLoc, nDatos, 1)]).build());
    }
    /* Sin unidad en Séneca: este alumno no sale en ningún informe. */
    siVacia('Unidad', FMT_ROJO);
    /* Los PIL, para localizarlos de un vistazo. No es un problema: es un dato.
       Son dos columnas: la de este curso, que va al papel, y la de la etapa. */
    const PERMANENCIA = ['PIL', 'No podrá repetir este curso',
                         'Ha agotado las dos permanencias'];
    for (let q = 0; q < PERMANENCIA.length; q++) {
      siDice(PERMANENCIA[q], 'SÍ', FMT_AZUL);
      /* En ámbar lo que se apoya en una suposición por edad, y lo que no
         sabemos: hay que comprobarlo antes de dárselo a nadie. */
      siDice(PERMANENCIA[q], PIL_POR_EDAD, FMT_AMBAR);
      siDice(PERMANENCIA[q], SIN_DATO, FMT_AMBAR);
    }
    /* De dónde viene el alumno: en ámbar lo que no sabemos. */
    siDice('Curso el año pasado', SIN_DATO, FMT_AMBAR);
    siDice('Repetía el año pasado', SIN_DATO, FMT_AMBAR);
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

  /* La explicación de cada columna va como nota de la celda del título. Se
     ponen todas de una vez al terminar el recorrido, que es mucho más rápido
     que casilla por casilla. Una columna sin explicación recibe nota vacía,
     así se borra la que hubiera de una versión anterior. */
  const notasFila = [];

  for (let c = 0; c < ancho; c++) {
    const titulo = String(titulos[c] === null || titulos[c] === undefined
                          ? '' : titulos[c]).trim();
    const conf = def.cols[titulo] || [ANCHO_DEFECTO, 'C'];
    hoja.setColumnWidth(c + 1, conf[0]);
    notasFila.push(def.notas && def.notas[titulo] ? def.notas[titulo] : '');
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

  hoja.getRange(filaCab, 1, 1, ancho).setNotes([notasFila]);

  /* 3. La cabecera: centrada, con ajuste de texto y sitio para tres líneas.
        Hay títulos largos, como "Cursos repetidos en Primaria". */
  hoja.getRange(filaCab, 1, 1, ancho)
      .setWrap(true).setHorizontalAlignment('center').setVerticalAlignment('middle');
  hoja.setRowHeight(filaCab, 48);

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

/* Lleva el curso delante porque dos alumnos distintos pueden llamarse igual y
   sus anotaciones no se pueden mezclar. */
function claveAvisoCorta_(fila) {
  return normalizar(fila[0]) + '|' + normalizar(fila[2]) + '|' + normalizar(fila[3]);
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
