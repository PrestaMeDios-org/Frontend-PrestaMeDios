// Presentación de Control de Stock (SPEC-10 V-16). Sólo formatea lo que ya trae la API.
import type { Equipment, Unidad } from "../types"

/** [2, 3, 4, 5, 6, 8] → "2–6, 8". Vacío → "—". */
export function rangosDeLockers(lockers: number[]): string {
  const orden = [...new Set(lockers)].sort((a, b) => a - b)
  if (orden.length === 0) return "—"
  const partes: string[] = []
  let inicio = orden[0]!
  let previo = inicio
  for (const n of [...orden.slice(1), Number.NaN]) {
    if (n === previo + 1) {
      previo = n
      continue
    }
    partes.push(inicio === previo ? `${inicio}` : previo === inicio + 1 ? `${inicio}, ${previo}` : `${inicio}–${previo}`)
    inicio = n
    previo = n
  }
  return partes.join(", ")
}

export const LOCKERS = [1, 2, 3, 4, 5, 6, 7] as const // PRE-12: Locker (1-7)

export interface GrupoLocker {
  /** null = unidades sin locker asignado. */
  locker: number | null
  entradas: { equipo: Equipment; unidad: Unidad }[]
}

/**
 * Vista por locker (SPEC-10 V-17, MOMENTÁNEO): las mismas unidades de la tabla, agrupadas por
 * locker. Los 7 lockers aparecen siempre (vacíos también); "sin locker" sólo si hay alguna.
 */
export function agruparPorLocker(items: Equipment[]): GrupoLocker[] {
  const grupos = new Map<number | null, GrupoLocker["entradas"]>()
  for (const l of LOCKERS) grupos.set(l, [])
  for (const equipo of items)
    for (const unidad of equipo.unidades ?? []) {
      const clave = unidad.locker ?? null
      if (!grupos.has(clave)) grupos.set(clave, [])
      grupos.get(clave)!.push({ equipo, unidad })
    }
  const orden = (a: GrupoLocker["entradas"][number], b: GrupoLocker["entradas"][number]) =>
    a.equipo.name.localeCompare(b.equipo.name, "es") ||
    a.unidad.codigoInventario.localeCompare(b.unidad.codigoInventario, "es", { numeric: true })
  return [...grupos.entries()]
    .filter(([l, e]) => l !== null || e.length > 0)
    .sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity))
    .map(([locker, entradas]) => ({ locker, entradas: entradas.sort(orden) }))
}
