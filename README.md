# Base de datos de alumnado — IES Fuente Lucena

Sistema para convertir las descargas CSV de Séneca en una base de datos única de alumnado,
y a partir de ella generar los listados por unidad.

## Qué hay aquí

- **`Codigo.gs`** — el script de Google Apps Script del cuaderno **BASE DE DATOS ALUMNADO**
  (carpeta de Drive "Datos de matrícula").

## Cómo se usa el cuaderno

Menú **Base de datos**:

1. **Leer el histórico de matrículas** — lee `RegAlum.csv` y llena la pestaña `HISTORIAL`
   (edad, repeticiones en ESO y repeticiones en Primaria de cada alumno matriculado).
   Solo hay que pulsarlo cuando se descarga un `RegAlum` nuevo de Séneca.
2. **Construir la tabla ALUMNADO** — cruza `HISTORIAL` con los CSV de matrícula del curso
   y con las notas del curso anterior, y escribe las pestañas `ALUMNADO` y `AVISOS`.

## Ficheros que espera en Drive

En la carpeta "Datos de matrícula" (o en la carpeta de arriba):

- `RegAlum*.csv` — registro histórico de matrículas de Séneca.
- `MatOMCMatr1ºESO-26-27.csv` … `MatOMCMatr4ºESO-26-27.csv` — matrícula y asignaturas del curso.
- Cuaderno de notas `260626 PROPUESTA MATRÍCULA 2026-27`, con las pestañas `EV 1º ESO` … `EV 4º ESO`.

Los ficheros se identifican **por el nombre**, nunca adivinando su contenido.

## Pestañas que genera

| Pestaña | Qué es |
|---|---|
| `HISTORIAL` | Repeticiones de cada alumno, calculadas a partir de `RegAlum`. Es el almacén de la parte lenta. |
| `ALUMNADO` | La base de datos. Gris = viene de Séneca · Azul = calculado · Amarillo = se rellena a mano y no se pisa. |
| `AVISOS` | Incidencias detectadas. Las columnas Estado y Observaciones se conservan entre actualizaciones. |

## Reglas del proyecto

- **PIL** = alumno que ya no puede repetir. Ocurre si acumula 2 repeticiones entre Primaria y
  Secundaria, o si ya está repitiendo el curso en el que está matriculado.
- **MAT NO SUP.** = materias que suspendió el repetidor el curso pasado (salen de las pestañas EV).
- **Asignaturas pendientes** = materias que arrastra de cursos anteriores (columnas PEND de Séneca).
- Las columnas amarillas de `ALUMNADO` las escribe Francisco y el script nunca las borra.
- `RegAlum.csv` contiene datos personales (domicilios, teléfonos, DNI). No se sube a este repositorio.
