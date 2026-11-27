// Reglamento de uso de los equipos, compartido por la solicitud (`loans`, PRE-03) y la ficha del
// equipo (`inventory`, SPEC-10 M-04). Vive en `lib` para que `inventory` no importe `loans`
// (SPEC-04 D-12). MOMENTÁNEO hasta que el Reglamento esté cargado en el sistema.

/** Reglas que valen para cualquier equipo. */
export const REGLAS_GENERALES = [
  "Devolver el equipo en la fecha y horario acordados, en las mismas condiciones en que fue entregado.",
  "Reportar de inmediato cualquier daño accidental al personal del laboratorio.",
  "El préstamo es personal e intransferible — no ceder el equipo a terceros.",
] as const

/** Regla específica de los equipos con óptica (cámaras y lentes). */
export const REGLA_OPTICA =
  "Cuidar los lentes y accesorios ópticos: nunca limpiar con ropa ni superficies abrasivas." as const

/** Reglamento completo que se acepta al pedir (mismo orden que antes). */
export const REGLAMENTO_USO = [REGLAS_GENERALES[0], REGLA_OPTICA, REGLAS_GENERALES[1], REGLAS_GENERALES[2]] as const
