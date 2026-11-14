// Motivo de la reserva (SPEC-10 V-13): materia y descripción se guardan juntas en el campo
// `motivo` que la API ya acepta (RES-02, SPEC-08 `ReservaEspacioCreate.motivo`, hasta 500).

export const MOTIVO_MAX = 500
export const SEPARADOR = " — "

/** "Taller", "Rodaje" → "Taller — Rodaje". Vacío → `undefined` (no se manda). */
export function armarMotivo(materia: string, descripcion: string): string | undefined {
  const partes = [materia.trim(), descripcion.trim()].filter(Boolean)
  if (partes.length === 0) return undefined
  return partes.join(SEPARADOR).slice(0, MOTIVO_MAX)
}

/** Lo que entra para la descripción después de la materia y el separador. */
export const maxDescripcion = (materia: string) =>
  Math.max(0, MOTIVO_MAX - (materia.trim() ? materia.trim().length + SEPARADOR.length : 0))
