// Vista de las solicitudes pendientes del administrador (SPEC-10 V-21, RES-05). Sólo filtra,
// ordena y pagina lo que la API ya devolvió: no cambia qué datos ve cada rol.

interface Pendiente {
  idEspacio: number
  fecha: string
  horaInicio: string
}

export type Periodo = "7" | "14" | "todas"

export const PERIODOS: { clave: Periodo; etiqueta: string }[] = [
  { clave: "7", etiqueta: "Próximos 7 días" },
  { clave: "14", etiqueta: "Próximos 14 días" },
  { clave: "todas", etiqueta: "Todas" },
]

export const POR_PAGINA = 10

/** "2026-11-13" + 6 → "2026-11-19" (sin zona horaria: sólo aritmética de calendario). */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/**
 * Las pendientes que pasan los filtros, de la más próxima a la más lejana. Con `dia` (el que el
 * admin tocó en el calendario) manda el día y se ignora el período.
 */
export function filtrarPendientes<T extends Pendiente>(
  reservas: T[],
  filtro: { hoy: string; periodo: Periodo; idEspacio: number | "todos"; dia: string | null },
): T[] {
  const hasta = filtro.periodo === "todas" ? null : sumarDias(filtro.hoy, Number(filtro.periodo) - 1)
  return reservas
    .filter((r) => filtro.idEspacio === "todos" || r.idEspacio === filtro.idEspacio)
    .filter((r) => (filtro.dia ? r.fecha === filtro.dia : hasta === null || r.fecha <= hasta))
    .sort((a, b) => `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`))
}

/** Cantidad de pendientes por día de un espacio, para el número del calendario. */
export function contarPorDia(reservas: Pendiente[], idEspacio: number | null): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of reservas) if (r.idEspacio === idEspacio) out[r.fecha] = (out[r.fecha] ?? 0) + 1
  return out
}

/** Una página (desde 1) y el total de páginas; una página fuera de rango se corrige al borde. */
export function paginar<T>(items: T[], pagina: number, porPagina = POR_PAGINA) {
  const paginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(Math.max(1, pagina), paginas)
  const desde = (actual - 1) * porPagina
  return { items: items.slice(desde, desde + porPagina), pagina: actual, paginas, desde: desde + 1, hasta: Math.min(desde + porPagina, items.length) }
}

/** Agrupa por fecha conservando el orden (la lista ya viene ordenada). */
export function agruparPorDia<T extends { fecha: string }>(items: T[]): { fecha: string; items: T[] }[] {
  const dias: { fecha: string; items: T[] }[] = []
  for (const r of items) {
    const ult = dias.at(-1)
    if (ult && ult.fecha === r.fecha) ult.items.push(r)
    else dias.push({ fecha: r.fecha, items: [r] })
  }
  return dias
}
