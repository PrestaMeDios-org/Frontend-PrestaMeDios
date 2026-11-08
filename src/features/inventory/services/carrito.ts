import type { Equipment } from "../types"

export type Rol = "ESTUDIANTE" | "DOCENTE" | "ADMIN_LOCAL" | "SUPERADMIN"

export function motivoNoAgregable(eq: Equipment, role: Rol): string | null {
  if (!eq.activo) return "Dado de baja"
  if (eq.maintenance) return "En mantenimiento"
  if ((eq.available_count ?? eq.quantity) <= 0) return "Sin unidades disponibles hoy"
  return null
}

export function muestraBotonAgregar(role: Rol, hayCallback: boolean): boolean {
  if (!hayCallback) return false
  return role === "ESTUDIANTE" || role === "DOCENTE"
}
