// Reglas del botón "Agregar al pedido" (SPEC-04 §8.2, C11, D-12). Funciones puras.
import type { Role } from "../../../types"
import type { Equipment } from "../types"

/** Motivo por el que el equipo no se puede agregar hoy, o `null` si se puede. */
export function motivoNoAgregable(eq: Equipment): string | null {
  if (!eq.activo) return "Dado de baja"
  if (eq.maintenance) return "En mantenimiento"
  if ((eq.available_count ?? eq.quantity) <= 0) return "Sin unidades disponibles hoy"
  return null
}

/** El botón es sólo para quienes piden (estudiantes y docentes) y si hay a quién avisar. */
export function muestraBotonAgregar(role: Role, hayCallback: boolean): boolean {
  if (!hayCallback) return false
  return role === "student" || role === "teacher"
}
