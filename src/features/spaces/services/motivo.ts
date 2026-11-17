// Motivo de la reserva (SPEC-10 V-13): materia y descripción se guardan juntas en el campo
// `motivo` que la API ya acepta (RES-02, SPEC-08 `ReservaEspacioCreate.motivo`, hasta 500).

export const MOTIVO_MAX = 500
export const SEPARADOR = " — "
/** Prefijo cuando hay descripción sin materia. La API recorta espacios, así que va sin el inicial. */
export const SIN_MATERIA = SEPARADOR.trimStart()

/** El separador no puede aparecer dentro de la materia: se cortaría mal al leerla. */
const limpiarMateria = (materia: string) => materia.trim().split(SEPARADOR).join(" - ")

/**
 * "Taller", "Rodaje" → "Taller — Rodaje"; sólo materia → "Taller"; sólo descripción →
 * "— Rodaje" (para que no se lea como materia). Vacío → `undefined` (no se manda).
 */
export function armarMotivo(materia: string, descripcion: string): string | undefined {
  const m = limpiarMateria(materia)
  const d = descripcion.trim()
  if (!m && !d) return undefined
  const texto = !d ? m : m ? `${m}${SEPARADOR}${d}` : `${SIN_MATERIA}${d}`
  return texto.slice(0, MOTIVO_MAX)
}

/** Lo que entra para la descripción después de la materia y el separador. */
export const maxDescripcion = (materia: string) => {
  const m = limpiarMateria(materia)
  return Math.max(0, MOTIVO_MAX - (m ? m.length + SEPARADOR.length : SIN_MATERIA.length))
}
