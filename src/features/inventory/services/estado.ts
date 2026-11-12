import type { Equipment } from "../types"

// Estado visible de un equipo en el catálogo (SPEC-04 RN-I4, RN-I5).
export type EstadoEquipo = "no_disponible" | "mantenimiento" | "disponible" | "ocupado"

/**
 * Un equipo sin unidades activas (todas dadas de baja, o sin ninguna) se muestra
 * "No disponible" y no "Ocupado": no hay nada que esperar a que se devuelva (RN-I5).
 */
export function estadoEquipo(e: Pick<Equipment, "quantity" | "available_count" | "maintenance">): EstadoEquipo {
  if (e.quantity === 0) return "no_disponible"
  if (e.maintenance) return "mantenimiento"
  return e.available_count > 0 ? "disponible" : "ocupado"
}
