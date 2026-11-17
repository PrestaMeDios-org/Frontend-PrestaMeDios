// Presentación de Mis Solicitudes (SPEC-10 V-18, USR-06). Sólo ordena y filtra lo que trae la API.

/** Chips de estado: los de USR-06 (Pendientes / Aprobadas / Rechazadas) más "Canceladas". */
export const FILTROS_ESTADO = [
  ["todas", "Todas"],
  ["pendiente", "Pendientes"],
  ["aprobada", "Aprobadas"],
  ["rechazada", "Rechazadas"],
  ["cancelada", "Canceladas"],
] as const
export type FiltroEstado = (typeof FILTROS_ESTADO)[number][0]

/** Cuenta por chip; "todas" es el total. Los estados sin chip (en uso, finalizada) sólo suman en "todas". */
export function contarPorEstado<T>(items: T[], clave: (item: T) => FiltroEstado | null): Record<FiltroEstado, number> {
  const c: Record<FiltroEstado, number> = { todas: items.length, pendiente: 0, aprobada: 0, rechazada: 0, cancelada: 0 }
  for (const it of items) {
    const k = clave(it)
    if (k && k !== "todas") c[k] += 1
  }
  return c
}

export function filtrarPorEstado<T>(items: T[], filtro: FiltroEstado, clave: (item: T) => FiltroEstado | null): T[] {
  return filtro === "todas" ? items : items.filter((it) => clave(it) === filtro)
}

/** "Pendiente" → "pendiente"; "En_Uso" y "Finalizada" no tienen chip. */
export function claveDeReserva(estado: string): FiltroEstado | null {
  const k = estado.toLowerCase()
  return k === "pendiente" || k === "aprobada" || k === "rechazada" || k === "cancelada" ? k : null
}

/** Primero lo que viene (de la más cercana a la más lejana), al final lo que ya pasó (lo más reciente arriba). */
export function ordenarReservas<T extends { fecha: string; horaInicio: string; horaFin: string }>(reservas: T[], ahora: string): T[] {
  const inicio = (r: T) => `${r.fecha}T${r.horaInicio}`
  const pasada = (r: T) => `${r.fecha}T${r.horaFin}` <= ahora
  const futuras = reservas.filter((r) => !pasada(r)).sort((a, b) => inicio(a).localeCompare(inicio(b)))
  const pasadas = reservas.filter(pasada).sort((a, b) => inicio(b).localeCompare(inicio(a)))
  return [...futuras, ...pasadas]
}
