// Funciones puras del calendario común (SPEC-10 §4.6). Fechas como "AAAA-MM-DD" en hora local.

export function isoDe(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** "2026-11-12" → Date local a las 00:00 (sin corrimiento de zona). */
export function fechaDeIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export const primeroDelMes = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), 1)

export const sumarMeses = (mes: Date, n: number) => new Date(mes.getFullYear(), mes.getMonth() + n, 1)

export function sumarDias(iso: string, n: number): string {
  const f = fechaDeIso(iso)
  f.setDate(f.getDate() + n)
  return isoDe(f)
}

/** Días entre dos fechas ISO, contando ambas (12 → 14 = 3). */
export function diasInclusive(desde: string, hasta: string): number {
  return Math.round((fechaDeIso(hasta).getTime() - fechaDeIso(desde).getTime()) / 86_400_000) + 1
}

/** Celdas del mes con lunes primero: `null` para los huecos antes del día 1. */
export function celdasDelMes(mes: Date): (string | null)[] {
  const primero = primeroDelMes(mes)
  const huecos = (primero.getDay() + 6) % 7
  const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  return [
    ...Array<null>(huecos).fill(null),
    ...Array.from({ length: total }, (_, i) => isoDe(new Date(mes.getFullYear(), mes.getMonth(), i + 1))),
  ]
}

export const esFinDeSemana = (iso: string) => {
  const d = fechaDeIso(iso).getDay()
  return d === 0 || d === 6
}

/** ¿Algún día del mes cae dentro de [min, max]? (para habilitar ‹ y ›). */
export function mesTieneDias(mes: Date, min?: string, max?: string): boolean {
  const primero = isoDe(primeroDelMes(mes))
  const ultimo = isoDe(new Date(mes.getFullYear(), mes.getMonth() + 1, 0))
  return !((min && ultimo < min) || (max && primero > max))
}

/** "2026-11-12" → "12/11/2026". */
export function formatoCorto(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

export const tituloMes = (mes: Date) => mes.toLocaleString("es-AR", { month: "long", year: "numeric" })
