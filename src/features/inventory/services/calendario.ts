// Funciones puras del mini-calendario (SPEC-04 §8.2, Fase B).
export const VENTANA_DIAS = 62

export function aIso(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function ventana(hoy: Date): { min: Date; max: Date } {
  const min = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const max = new Date(min)
  max.setDate(max.getDate() + (VENTANA_DIAS - 1))
  return { min, max }
}

export function rangoDelMes(
  mes: Date,
  hoy: Date,
): { desde: string; hasta: string } | null {
  const { min, max } = ventana(hoy)
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
  const desde = primerDia < min ? min : primerDia
  const hasta = ultimoDia > max ? max : ultimoDia
  if (desde > hasta) return null
  return { desde: aIso(desde), hasta: aIso(hasta) }
}

export function puedeIrA(mes: Date, hoy: Date): boolean {
  const { min, max } = ventana(hoy)
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0)
  return !(ultimoDia < min || primerDia > max)
}
