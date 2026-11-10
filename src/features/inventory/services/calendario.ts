// Funciones puras del mini-calendario (SPEC-04 §8.2, Fase B).
import { ZONA_LAB } from "../../notifications/services/fechas"

export const VENTANA_DIAS = 62

const partesLab = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_LAB,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/**
 * "Hoy" en la zona del laboratorio, como fecha a las 00:00 (SPEC-04 §5.4). El backend valida
 * `desde ≥ hoy` con esa zona: con la hora del navegador, desde otra zona horaria el calendario
 * podría pedir un `desde` que termina en `422 RANGO_FECHAS_INVALIDO`.
 */
export function hoyLab(ahora: Date = new Date()): Date {
  const p = Object.fromEntries(partesLab.formatToParts(ahora).map((x) => [x.type, x.value]))
  return new Date(Number(p.year), Number(p.month) - 1, Number(p.day))
}

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
