// Fechas en la zona del laboratorio (America/Argentina/Ushuaia, UTC-3 sin horario de
// verano), igual que el backend (`core.settings.ZONA_HORARIA_LAB`). Compartido entre features.

export const ZONA_LAB = "America/Argentina/Ushuaia"

/**
 * Desfase fijo de `ZONA_LAB` respecto de UTC (Argentina no usa horario de verano), para
 * armar instantes ISO con zona, por ejemplo `2026-11-12T10:00:00-03:00`. Si alguna vez
 * cambia la zona, se cambian los dos juntos.
 */
export const DESFASE_LAB = "-03:00"

const partesLab = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_LAB,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/**
 * "Hoy" en la zona del laboratorio, como fecha a las 00:00. El backend valida las fechas
 * con esa zona: con la hora del navegador, desde otra zona horaria se puede pedir un día
 * que para el laboratorio ya pasó (p. ej. `422 RANGO_FECHAS_INVALIDO`, SPEC-04 §5.4).
 */
export function hoyLab(ahora: Date = new Date()): Date {
  const p = Object.fromEntries(partesLab.formatToParts(ahora).map((x) => [x.type, x.value]))
  return new Date(Number(p.year), Number(p.month) - 1, Number(p.day))
}
