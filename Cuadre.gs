/*** ================= EL CUADRE: SÉNECA CONTRA JEFATURA, EN NÚMEROS =================
 *
 * POR QUÉ EXISTE (BD v64, 11-sep-2026). Lo pidió Francisco, que ha sido
 * contable: "un sistema de cuadre contable con el que veamos que los números
 * cuadran entre las dos fuentes, Séneca y el archivo de Jefatura: el total de
 * alumnos por enseñanza, curso y unidad, el número de matriculados en cada
 * asignatura por curso y unidad...".
 *
 * La pestaña MATRÍCULA mira alumno por alumno. El CUADRE mira los TOTALES:
 * los mismos números contados por dos caminos, y cada diferencia con su
 * explicación. Son TRES PESTAÑAS, una por cuadro (hasta la BD v64 iban las
 * tres en una y no se podía leer: cada cuadro necesita sus propios anchos de
 * columna). Cada pestaña lleva arriba su resumen (filas, con diferencia, sin
 * explicar), la cabecera fija y un filtro. Las notas largas van como nota de
 * la celda, no como columna:
 *
 *   1. PERSONAS. Por unidad, con subtotales por curso y por enseñanza:
 *      cuántos alumnos hay en Séneca, cuántos en Jefatura, la diferencia, y
 *      cuántos están solo en un sitio (que es lo que la explica).
 *
 *   2. MATERIAS. Por unidad, una fila por materia: matriculados en Séneca
 *      contra lo que se espera. Lo que se espera es lo que ha escrito
 *      Jefatura si la materia es de un cuadro de elección, o el número de
 *      alumnos que la tienen que cursar si es obligatoria.
 *
 *   3. CONTROLES. Sumas que tienen que salir por fuerza: en cada cuadro de
 *      elección, los alumnos de la unidad multiplicados por cuántas hay que
 *      elegir tiene que ser igual a la suma de matriculados en las materias
 *      del cuadro; y la diversificación de Séneca contra la de Jefatura.
 *
 * LA REGLA DE ORO: cada diferencia tiene que estar explicada por las filas
 * de MATRÍCULA (materias) o de DISCREPANCIAS (personas). La columna
 * "Explicado" dice cuánto explican esas filas, y "Cuadra" dice SÍ cuando la
 * diferencia y lo explicado coinciden. Un NO quiere decir que hay una
 * diferencia que ninguna fila explica: eso es un fallo del programa, no de
 * Séneca, y hay que contármelo.
 *
 * QUIÉN NO ENTRA EN LOS CUADROS 2 Y 3: el alumnado con la matrícula en
 * "DIV pendiente" o "?" (no se ha podido comprobar), y, en los controles de
 * cuadros, quien repite 2º de Bachillerato (solo cursa lo que le quedó, así
 * que ningún cuadro tiene por qué sumar). Se dice en una nota.
 *
 * DE DÓNDE SALEN LOS DATOS: de lo que comprobarMatriculas_ (Matricula.gs)
 * deja en RESULTADO_MATRICULA_: el alumnado por curso, lo de Jefatura y el
 * detalle de cada cuenta. Lo llama Panel.gs justo después de construir la
 * tabla ALUMNADO.
 * ======================================================================== ***/

const HOJA_CUADRE_PERSONAS  = 'CUADRE PERSONAS';
const HOJA_CUADRE_MATERIAS  = 'CUADRE MATERIAS';
const HOJA_CUADRE_CONTROLES = 'CUADRE CONTROLES';
const HOJAS_CUADRE = [HOJA_CUADRE_PERSONAS, HOJA_CUADRE_MATERIAS, HOJA_CUADRE_CONTROLES];
/* La pestaña única de la primera versión, que se borra si sigue ahí. */
const HOJA_CUADRE_VIEJA = 'CUADRE';

/* Un alumno queda fuera de los cuadros de materias si su matrícula no se ha
   podido comprobar. */
function cuadreAlumnoCuenta_(R, a) {
  const d = R.detalle[normalizar(a.nombre) + '|' + a.curso];
  if (!d) return true;
  return d.corto !== MATRICULA_DIV_PENDIENTE && d.corto !== SIN_DATO;
}

/* Ordena cursos: primero la ESO (1º..4º), luego Bachillerato. */
function cuadreOrdenCurso_(c) {
  return (esBachillerato_(c) ? '2' : '1') + c;
}

/* Construye los tres cuadros. Devuelve { personas, materias, controles,
   sinExplicar, fuera, fueraPersonas }; cada cuadro trae titulos, filas, marcas
   (unidad, subtotal, total, hueco), notas (una por fila) y resumen. */
function cuadre_(R) {
  /* Cada cuadro es una lista de filas, con su marca (título de unidad,
     subtotal, total...) y su nota (la explicación que va como nota de celda).
     La última columna de cada fila es siempre "Cuadra". */
  const bloque = function (titulos) {
    return { titulos: titulos, filas: [], marcas: [], notas: [] };
  };
  const B = {
    personas: bloque(['Enseñanza', 'Curso', 'Unidad', 'Séneca', 'Jefatura', 'Diferencia',
                      'Solo en Séneca', 'Solo en Jefatura', 'Cuadra']),
    materias: bloque(['Curso', 'Unidad', 'Materia', 'Séneca', 'Esperado', 'Diferencia',
                      'Explicado en MATRÍCULA', 'Cuadra']),
    controles: bloque(['Curso', 'Unidad', 'Control', 'Esperado', 'Real', 'Diferencia',
                       'Explicado', 'Cuadra'])
  };
  const mete = function (bl, f, tipo, nota) {
    while (f.length < bl.titulos.length) f.push('');
    bl.filas.push(f);
    bl.marcas.push(tipo || '');
    bl.notas.push(nota || '');
  };
  const cuadra = function (dif, expl) {
    if (dif === '' || expl === '') return '';
    return Number(dif) === Number(expl) ? 'SÍ' : 'NO';
  };
  const etapaDe = function (c) { return esBachillerato_(c) ? 'Bachillerato' : 'ESO'; };

  /* ---- Las unidades, vistas desde Séneca y desde Jefatura. ---- */
  const unidades = {};   // clave normalizada -> { curso, nombre, sen: {clave alumno}, jef: {clave alumno} }
  const dame = function (curso, unidad) {
    const k = normalizar(unidad) || '(sin unidad)';
    if (!unidades[k]) unidades[k] = { curso: curso, nombre: String(unidad || '').trim() || '(sin unidad)', sen: {}, jef: {} };
    return unidades[k];
  };
  const alumnosPorUnidad = {};
  for (const curso in R.porCurso) {
    const lista = R.porCurso[curso];
    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      const u = dame(a.curso, a.unidad);
      u.sen[normalizar(a.nombre) + '|' + a.curso] = true;
      const k = normalizar(a.unidad) || '(sin unidad)';
      if (!alumnosPorUnidad[k]) alumnosPorUnidad[k] = [];
      alumnosPorUnidad[k].push(a);
    }
  }
  const jefPorUnidad = {};
  for (const clave in R.jef) {
    const j = R.jef[clave];
    const u = dame(j.curso, j.unidad);
    if (!u.nombre || u.nombre === '(sin unidad)') u.nombre = String(j.unidad || '').trim();
    u.jef[clave] = true;
    const k = normalizar(j.unidad) || '(sin unidad)';
    if (!jefPorUnidad[k]) jefPorUnidad[k] = [];
    jefPorUnidad[k].push(j);
  }
  const clavesUnidad = Object.keys(unidades).sort(function (x, y) {
    const kx = cuadreOrdenCurso_(unidades[x].curso) + '|' + x, ky = cuadreOrdenCurso_(unidades[y].curso) + '|' + y;
    return kx < ky ? -1 : (kx > ky ? 1 : 0);
  });

  /* ================= 1. PERSONAS ================= */
  const sub = {};   // acumuladores por curso y por etapa
  const acum = function (k, s, j, ss, sj, hayJef) {
    if (!sub[k]) sub[k] = { s: 0, j: 0, ss: 0, sj: 0, hayJef: false, sinJef: 0 };
    sub[k].s += s; sub[k].j += j; sub[k].ss += ss; sub[k].sj += sj;
    if (hayJef) sub[k].hayJef = true; else sub[k].sinJef++;
  };
  const filaPersonas = function (etiqueta1, etiqueta2, etiqueta3, t, tipo) {
    /* Un total en el que a algún curso le falta el fichero de Jefatura no se
       puede comparar: se enseña el número y se dice que es parcial. */
    const parcial = t.hayJef && t.sinJef > 0;
    const dif = t.hayJef && !parcial ? t.s - t.j : '';
    const expl = t.hayJef && !parcial ? t.ss - t.sj : '';
    mete(B.personas, [etiqueta1, etiqueta2, etiqueta3, t.s,
          !t.hayJef ? '—' : (parcial ? t.j + ' (sin todos los cursos)' : t.j), dif,
          t.hayJef ? t.ss : '', t.hayJef ? t.sj : '', cuadra(dif, expl)], tipo,
         !t.hayJef ? 'El fichero de Jefatura no trae este curso.'
                   : (parcial ? 'A algún curso de este total le falta el fichero de Jefatura: no se compara.' : ''));
  };
  let cursoAnterior = '', etapaAnterior = '';
  for (let i = 0; i < clavesUnidad.length; i++) {
    const u = unidades[clavesUnidad[i]];
    const hayJef = !!R.cursosJef[u.curso];
    let s = 0, j = 0, ss = 0, sj = 0;
    for (const k in u.sen) { s++; if (!u.jef[k]) ss++; }
    for (const k in u.jef) { j++; if (!u.sen[k]) sj++; }
    if (cursoAnterior && u.curso !== cursoAnterior) {
      filaPersonas('', 'Total ' + cursoAnterior, '', sub['c|' + cursoAnterior], 'subtotal');
    }
    if (etapaAnterior && etapaDe(u.curso) !== etapaAnterior) {
      filaPersonas('Total ' + etapaAnterior, '', '', sub['e|' + etapaAnterior], 'total');
    }
    filaPersonas(etapaDe(u.curso), u.curso, u.nombre, { s: s, j: j, ss: ss, sj: sj, hayJef: hayJef, sinJef: 0 });
    acum('c|' + u.curso, s, j, ss, sj, hayJef);
    acum('e|' + etapaDe(u.curso), s, j, ss, sj, hayJef);
    acum('t', s, j, ss, sj, hayJef);
    cursoAnterior = u.curso; etapaAnterior = etapaDe(u.curso);
  }
  if (cursoAnterior) filaPersonas('', 'Total ' + cursoAnterior, '', sub['c|' + cursoAnterior], 'subtotal');
  if (etapaAnterior) filaPersonas('Total ' + etapaAnterior, '', '', sub['e|' + etapaAnterior], 'total');
  if (sub['t']) filaPersonas('TOTAL DEL CENTRO', '', '', sub['t'], 'total');

  /* ================= 2. MATERIAS ================= */
  let fuera = 0, fueraPersonas = 0;
  const controles = [];   // se rellenan aquí y se escriben en el cuadro 3
  for (let i = 0; i < clavesUnidad.length; i++) {
    const u = unidades[clavesUnidad[i]];
    const k = clavesUnidad[i];
    const curso = u.curso;
    const lineas = ofertaDeCurso_(curso);
    if (!lineas.length) continue;
    const hayJef = !!R.cursosJef[curso];
    const todos = alumnosPorUnidad[k] || [];

    /* QUIÉN ENTRA. Solo quien está en las dos fuentes en esta misma unidad
       (si Jefatura trae el curso): quien está solo en una ya está explicado
       en el cuadro 1. Y solo quien tiene la matrícula comprobada. */
    const alumnos = [];
    let fueraU = 0, fueraPersonasU = 0;
    for (let q = 0; q < todos.length; q++) {
      const a = todos[q];
      const clave = normalizar(a.nombre) + '|' + a.curso;
      if (hayJef && !u.jef[clave]) { fueraPersonas++; fueraPersonasU++; continue; }
      if (!cuadreAlumnoCuenta_(R, a)) { fuera++; fueraU++; continue; }
      alumnos.push(a);
    }
    const porClave = {};
    for (let q = 0; q < alumnos.length; q++) porClave[normalizar(alumnos[q].nombre) + '|' + alumnos[q].curso] = alumnos[q];

    /* Lo que Jefatura escribe para esta unidad, materia por materia. Igual que
       en la cuenta de cada alumno: solo lo que le corresponde a ese alumno. Y
       si algún código no se sabe leer, los cuadros de esta unidad no se pueden
       dar por cuadrados. */
    const jefCuenta = {}, jefEscribeCuadro = {};
    let codigosSinLeer = 0;
    const jefes = jefPorUnidad[k] || [];
    for (let q = 0; q < jefes.length; q++) {
      const j = jefes[q];
      const a = porClave[normalizar(j.nombre) + '|' + j.curso];
      if (!a) continue;
      const codigos = codigosDeJefatura_(j);
      for (let z = 0; z < codigos.length; z++) {
        const l = lineaDeCodigoJef_(lineas, codigos[z]);
        if (!l) { codigosSinLeer++; continue; }
        const m = normalizar(l.materia);
        /* La línea que le toca a este alumno para esa materia, si la hay. */
        let aplica = false, cuadro = '';
        for (let y = 0; y < lineas.length; y++) {
          if (normalizar(lineas[y].materia) !== m) continue;
          if (lineaAplica_(lineas[y], a)) { aplica = true; cuadro = lineas[y].cuadro || ''; break; }
        }
        if (!aplica) continue;
        jefCuenta[m] = (jefCuenta[m] || 0) + 1;
        if (cuadro) jefEscribeCuadro[cuadro] = true;
      }
    }

    /* Lo que explican las filas de MATRÍCULA de esta unidad: por materia (todo
       el alumnado que entra) y por cuadro (sin repetidores ni sobrantes ajenos,
       que es lo que no entra en los controles). */
    const explMateria = {}, explCuadro = {};
    for (let q = 0; q < alumnos.length; q++) {
      const d = R.detalle[normalizar(alumnos[q].nombre) + '|' + alumnos[q].curso];
      if (!d || !d.detalle) continue;
      const D = d.detalle;
      for (let z = 0; z < D.sobran.length; z++) {
        const x = D.sobran[z];
        const m = normalizar(x.materia);
        explMateria[m] = (explMateria[m] || 0) + 1;
        if (!D.repite && x.cuadro && (x.tipo === 'jefatura' || x.tipo === 'cuadro')) {
          explCuadro[x.cuadro] = (explCuadro[x.cuadro] || 0) + 1;
        }
      }
      for (let z = 0; z < D.faltan.length; z++) {
        const f = D.faltan[z];
        if (f.materia) explMateria[normalizar(f.materia)] = (explMateria[normalizar(f.materia)] || 0) - 1;
        if (!D.repite && f.cuadro) explCuadro[f.cuadro] = (explCuadro[f.cuadro] || 0) - (f.n || 1);
      }
    }

    /* Materia por materia. Una materia puede salir en dos líneas de la oferta
       (ordinario y diversificación, o las dos modalidades): se cuenta una sola
       vez. A quién le toca se suma por cualquiera de sus líneas; quién la tiene
       en Séneca se cuenta a todo el mundo, le toque o no (si no le toca, ya
       sale como "sobra" en MATRÍCULA y eso lo explica). */
    const vistas = {}, ordenMaterias = [];
    const cuadros = {}, ordenCuadros = [];
    for (let z = 0; z < lineas.length; z++) {
      const l = lineas[z];
      const m = normalizar(l.materia);
      if (!vistas[m]) {
        vistas[m] = { l: l, aplicables: 0, sen: 0, existe: false, esCuadro: false, cuadros: [], contado: {} };
        ordenMaterias.push(m);
        for (let q = 0; q < alumnos.length; q++) {
          const a = alumnos[q];
          if (a.existe && a.existe[m]) vistas[m].existe = true;
          if (a.tiene[m] && !(a.aprobada && a.aprobada[m])) vistas[m].sen++;
        }
      }
      const V = vistas[m];
      if (l.cuadro) { V.esCuadro = true; if (V.cuadros.indexOf(l.cuadro) === -1) V.cuadros.push(l.cuadro); }
      for (let q = 0; q < alumnos.length; q++) {
        const a = alumnos[q];
        if (V.contado[q]) continue;
        if (!lineaAplica_(l, a)) continue;
        if (a.aprobada && a.aprobada[m]) continue;
        V.contado[q] = true;
        V.aplicables++;
      }
      /* Los cuadros de elección de esta unidad, para el cuadro 3: por cada
         alumno al que le toca (y no repite), cuántas debe y cuántas tiene. */
      if (l.cuadro) {
        if (!cuadros[l.cuadro]) {
          cuadros[l.cuadro] = { cuantas: l.cuantas, esperado: 0, real: 0, contado: {}, tenida: {} };
          ordenCuadros.push(l.cuadro);
        }
        const C = cuadros[l.cuadro];
        for (let q = 0; q < alumnos.length; q++) {
          const a = alumnos[q];
          if (a.aprobada && Object.keys(a.aprobada).length) continue;   // repetidores, fuera
          if (!lineaAplica_(l, a)) continue;
          if (!C.contado[q]) { C.contado[q] = true; C.esperado += l.cuantas; }
          if (a.tiene[m] && !C.tenida[q + '|' + m]) { C.tenida[q + '|' + m] = true; C.real++; }
        }
      }
    }
    /* La unidad, como fila de título, y debajo sus materias. */
    let cabeceraPuesta = false;
    const filaUnidad = function () {
      if (cabeceraPuesta) return;
      cabeceraPuesta = true;
      if (B.materias.filas.length) mete(B.materias, [], 'hueco');
      mete(B.materias, [curso, u.nombre, u.nombre + ' — ' + alumnos.length + ' alumnos que entran en el cuadre'], 'unidad',
           (fueraPersonasU ? fueraPersonasU + ' alumnos fuera: no están en las dos fuentes en esta unidad (ver PERSONAS). ' : '') +
           (fueraU ? fueraU + ' alumnos fuera: matrícula en "' + MATRICULA_DIV_PENDIENTE + '" o "' + SIN_DATO + '".' : ''));
    };
    for (let y = 0; y < ordenMaterias.length; y++) {
      const m = ordenMaterias[y], V = vistas[m], l = V.l;
      let esperado, nota = '';
      if (!V.esCuadro) {
        esperado = V.aplicables;
        nota = 'obligatoria: la cursa todo el alumnado al que le toca';
        if (!V.existe) {
          if (!V.aplicables) continue;
          filaUnidad();
          mete(B.materias, [curso, u.nombre, l.materia, '—', esperado, '', '', ''], '',
               'Séneca no trae esta columna (ver AVISOS).');
          continue;
        }
      } else {
        const escrito = hayJef && V.cuadros.some(function (c) { return jefEscribeCuadro[c]; });
        if (escrito) {
          esperado = jefCuenta[m] || 0;
          nota = 'lo que escribe Jefatura';
        } else {
          esperado = '';
          nota = hayJef ? 'Jefatura no escribe este cuadro: se mira en los controles'
                        : 'sin fichero de Jefatura para este curso: se mira en los controles';
        }
      }
      const expl = explMateria[m] || 0;
      if (V.sen === 0 && !esperado && expl === 0) continue;   // nadie la cursa ni la pide
      const dif = esperado === '' ? '' : V.sen - esperado;
      let cu = cuadra(dif, esperado === '' ? '' : expl);
      if (V.esCuadro && codigosSinLeer && cu === 'NO') {
        cu = '';
        nota += ' · hay códigos de Jefatura sin leer en esta unidad (ver AVISOS)';
      }
      filaUnidad();
      mete(B.materias, [curso, u.nombre, l.materia, V.sen, esperado === '' ? '—' : esperado, dif,
            esperado === '' ? '' : expl, cu], '', nota);
    }

    /* Los controles de esta unidad, para el cuadro 3. */
    for (let z = 0; z < ordenCuadros.length; z++) {
      const nombre = ordenCuadros[z], C = cuadros[nombre];
      if (!C.esperado && !C.real) continue;
      const expl = explCuadro[nombre] || 0;
      const dif = C.real - C.esperado;
      let cu = cuadra(dif, expl), nota = '';
      if (codigosSinLeer && cu === 'NO') { cu = ''; nota = 'hay códigos de Jefatura sin leer en esta unidad (ver AVISOS)'; }
      controles.push({ fila: [curso, u.nombre, 'Cuadro "' + nombreDeCuadro_(nombre) + '": ' +
                      (C.cuantas === 1 ? 'una por alumno' : C.cuantas + ' por alumno'),
                      C.esperado, C.real, dif, expl, cu],
                       nota: 'Esperado: alumnos de la unidad a los que les toca este cuadro, por cuántas hay que elegir. ' +
                             'Real: matriculados en las materias del cuadro. Quien repite 2º de Bachillerato no entra.' +
                             (nota ? ' ' + nota + '.' : '') });
    }
    /* La diversificación, en la ESO y solo si Jefatura trae el curso. Aquí
       entra todo el mundo: la explican las filas de DISCREPANCIAS. */
    if (!esBachillerato_(curso) && hayJef) {
      let sDiv = 0, jDiv = 0, soloS = 0, soloJ = 0;
      const jefDeUnidad = {};
      for (let q = 0; q < jefes.length; q++) jefDeUnidad[normalizar(jefes[q].nombre) + '|' + jefes[q].curso] = jefes[q];
      for (let q = 0; q < todos.length; q++) {
        const a = todos[q];
        const j = jefDeUnidad[normalizar(a.nombre) + '|' + a.curso];
        const sd = !!a.diver, jd = !!(j && j.div === 'SÍ');
        if (sd) sDiv++;
        if (jd) jDiv++;
        if (sd && !jd) soloS++;
        if (jd && !sd) soloJ++;
      }
      for (let q = 0; q < jefes.length; q++) {
        if (jefes[q].div === 'SÍ' && !u.sen[normalizar(jefes[q].nombre) + '|' + jefes[q].curso]) { jDiv++; soloJ++; }
      }
      if (sDiv || jDiv) {
        const dif = sDiv - jDiv, expl = soloS - soloJ;
        controles.push({ fila: [curso, u.nombre, 'Diversificación: Séneca contra Jefatura', jDiv, sDiv, dif, expl,
                               cuadra(dif, expl)],
                         nota: 'Esperado: alumnos en diversificación según Jefatura. Real: según Séneca. ' +
                               'La diferencia la explican las filas de DISCREPANCIAS.' });
      }
    }
  }
  /* ================= 3. CONTROLES ================= */
  for (let i = 0; i < controles.length; i++) mete(B.controles, controles[i].fila, '', controles[i].nota);

  /* El resumen de cada cuadro: filas de datos, con diferencia, sin explicar. */
  let sinExplicar = 0;
  for (const k in B) {
    const bl = B[k];
    const iDif = bl.titulos.indexOf('Diferencia'), iCu = bl.titulos.length - 1;
    bl.resumen = { filas: 0, conDiferencia: 0, sinExplicar: 0 };
    for (let i = 0; i < bl.filas.length; i++) {
      const mk = bl.marcas[i];
      if (mk === 'hueco' || mk === 'unidad') continue;
      bl.resumen.filas++;
      const d = bl.filas[i][iDif];
      if (d !== '' && Number(d) !== 0) bl.resumen.conDiferencia++;
      if (bl.filas[i][iCu] === 'NO') { bl.resumen.sinExplicar++; sinExplicar++; }
    }
  }
  B.fuera = fuera;
  B.fueraPersonas = fueraPersonas;
  B.sinExplicar = sinExplicar;
  return B;
}

/* Escribe una de las tres pestañas del cuadre. */
function escribirPestanaCuadre_(nombre, bl, explicacion, anchos) {
  const N = bl.titulos.length;
  const hoja = hojaLimpia(nombre, N);
  const r = bl.resumen;
  hoja.getRange(1, 1).setValue(nombre + ' — ' + explicacion + ' Actualizado: ' +
    new Date().toLocaleString('es-ES')).setFontStyle('italic').setFontColor('#666666');
  hoja.getRange(2, 1).setValue('Filas: ' + r.filas + '   ·   Con diferencia: ' + r.conDiferencia +
    '   ·   Sin explicar: ' + r.sinExplicar +
    (r.sinExplicar ? '   ←  hay diferencias que ninguna fila explica: cuéntamelo' : '   ·   todo explicado'))
    .setFontWeight('bold').setFontSize(11)
    .setBackground(r.sinExplicar ? FMT_ROJO : FMT_VERDE);
  hoja.getRange(2, 1).setNote('Con diferencia: filas cuya columna Diferencia no es cero. ' +
    'Sin explicar: filas con NO en la columna Cuadra. Para ver solo las filas con diferencia, ' +
    'usa el filtro de la cabecera en la columna Diferencia y quita el 0.');
  hoja.getRange(3, 1, 1, N).setValues([bl.titulos]).setFontWeight('bold').setBackground('#D9D9D9')
      .setWrap(true).setVerticalAlignment('middle');
  hoja.setRowHeight(3, 40);

  if (bl.filas.length) {
    hoja.getRange(4, 1, bl.filas.length, N).setValues(bl.filas);
    const unidades = [], subtotales = [], totales = [], noes = [], notas = [];
    for (let i = 0; i < bl.filas.length; i++) {
      const fila = i + 4;
      const a1 = 'A' + fila + ':' + fmtLetraColumna_(N) + fila;
      if (bl.marcas[i] === 'unidad') unidades.push(a1);
      else if (bl.marcas[i] === 'subtotal') subtotales.push(a1);
      else if (bl.marcas[i] === 'total') totales.push(a1);
      if (bl.filas[i][N - 1] === 'NO') noes.push(fmtLetraColumna_(N) + fila);
      notas.push([bl.notas[i] || '']);
    }
    if (unidades.length) hoja.getRangeList(unidades).setFontWeight('bold').setBackground('#D9E1F2');
    if (subtotales.length) hoja.getRangeList(subtotales).setFontWeight('bold').setBackground('#F2F2F2');
    if (totales.length) hoja.getRangeList(totales).setFontWeight('bold').setBackground(FMT_VERDE);
    if (noes.length) hoja.getRangeList(noes).setBackground(FMT_ROJO).setFontWeight('bold');
    /* La explicación de cada fila, como nota de la celda de la tercera
       columna (materia, control o unidad): se lee al pasar el ratón. */
    hoja.getRange(4, 3, bl.filas.length, 1).setNotes(notas);
    hoja.getRange(4, 4, bl.filas.length, N - 3).setHorizontalAlignment('center');
    hoja.getRange(4, 1, bl.filas.length, N)
        .setBorder(true, true, true, true, true, true, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);
    /* Las filas de unidad se leen de un tirón: la celda de la tercera columna
       no se corta. */
    if (unidades.length) hoja.getRangeList(unidades).setHorizontalAlignment('left');
    hoja.getRange(3, 1, bl.filas.length + 1, N).createFilter();
  }
  for (let c = 0; c < anchos.length; c++) hoja.setColumnWidth(c + 1, anchos[c]);
  hoja.setFrozenRows(3);
  try { hoja.setTabColor('#2E7D32'); } catch (e) { }
}

/* Escribe las tres pestañas del cuadre. Devuelve { sinExplicar, personas,
   materias, controles } (cada una con filas, conDiferencia, sinExplicar) o
   null si no hay datos de los que partir. Lo llama Panel.gs después de
   construirAlumnado. */
function escribirCuadre_() {
  const R = RESULTADO_MATRICULA_;
  if (!R || !R.porCurso) return null;
  const B = cuadre_(R);
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  /* La pestaña única de la primera versión sobra. */
  try {
    const vieja = libro.getSheetByName(HOJA_CUADRE_VIEJA);
    if (vieja) libro.deleteSheet(vieja);
  } catch (e) { /* si no se puede borrar, se queda */ }

  escribirPestanaCuadre_(HOJA_CUADRE_PERSONAS, B.personas,
    'cuántos alumnos hay en cada unidad según Séneca y según Jefatura. La diferencia la explican ' +
    'los que están solo en un sitio (salen en DISCREPANCIAS). Cuadra = SÍ cuando diferencia y ' +
    'explicado coinciden.',
    [100, 90, 110, 70, 90, 80, 90, 90, 60]);
  escribirPestanaCuadre_(HOJA_CUADRE_MATERIAS, B.materias,
    'matriculados en Séneca en cada materia, contra lo esperado: lo que escribe Jefatura si es de un ' +
    'cuadro de elección, o los alumnos a los que le toca si es obligatoria. La diferencia la explican ' +
    'las filas de MATRÍCULA de esa unidad (sobran menos faltan). Pasa el ratón por la materia para ver ' +
    'de dónde sale el esperado.' +
    (B.fueraPersonas ? ' Fuera del cuadro: ' + B.fueraPersonas + ' alumnos que no están en las dos fuentes en la misma unidad.' : '') +
    (B.fuera ? ' Fuera también: ' + B.fuera + ' con la matrícula en "' + MATRICULA_DIV_PENDIENTE + '" o "' + SIN_DATO + '".' : ''),
    [70, 90, 320, 70, 80, 80, 100, 60]);
  escribirPestanaCuadre_(HOJA_CUADRE_CONTROLES, B.controles,
    'sumas que tienen que salir: en cada cuadro de elección, alumnos por cuántas hay que elegir ' +
    '(esperado) contra la suma de matriculados en las materias del cuadro (real); y la ' +
    'diversificación de Séneca contra la de Jefatura. Pasa el ratón por el control para ver cómo se cuenta.',
    [70, 90, 340, 80, 70, 80, 90, 60]);

  return { sinExplicar: B.sinExplicar, personas: B.personas.resumen,
           materias: B.materias.resumen, controles: B.controles.resumen };
}

/* Deja las tres pestañas del cuadre detrás de MATRÍCULA, en orden. Se llama
   después de ordenar las demás pestañas (Formato.gs), que no las conocen. */
function colocarCuadre_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const ref = libro.getSheetByName(HOJA_MATRICULA);
  if (!ref) return;
  for (let i = 0; i < HOJAS_CUADRE.length; i++) {
    const hoja = libro.getSheetByName(HOJAS_CUADRE[i]);
    if (!hoja) continue;
    try {
      libro.setActiveSheet(hoja);
      libro.moveActiveSheet(ref.getIndex() + 1 + i);
    } catch (e) { /* si no se puede mover, se queda donde esté */ }
  }
}

/* Cuántas diferencias sin explicar hay en las pestañas del cuadre, para el
   panel: lee la línea de resumen de cada una. */
function cuadreSinExplicar_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  for (let i = 0; i < HOJAS_CUADRE.length; i++) {
    const hoja = libro.getSheetByName(HOJAS_CUADRE[i]);
    if (!hoja || hoja.getLastRow() < 2) continue;
    const m = String(hoja.getRange(2, 1).getValue() || '').match(/Sin explicar:\s*(\d+)/);
    if (m) n += parseInt(m[1], 10);
  }
  return n;
}
