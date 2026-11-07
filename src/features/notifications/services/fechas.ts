// Fechas en la zona del laboratorio (America/Argentina/Ushuaia, UTC-3 sin horario de
// verano), igual que el backend (`core.settings.ZONA_HORARIA_LAB`).

export const ZONA_LAB = "America/Argentina/Ushuaia"
const OFFSET_LAB = "-03:00"

const formato = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_LAB,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

/** "07/11/2026 10:30" en la zona del laboratorio. */
export function fechaLegible(iso: string): string {
  return formato.format(new Date(iso)).replace(",", "")
}

/** Valor de un `<input type="datetime-local">` ("2026-11-20T09:00") → ISO con zona del laboratorio. */
export function localAIso(valor: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor) ? `${valor}:00${OFFSET_LAB}` : null
}

/** ISO → valor de `<input type="datetime-local">` en la zona del laboratorio. */
export function isoALocal(iso: string): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA_LAB,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  )
  const hora = partes.hour === "24" ? "00" : partes.hour
  return `${partes.year}-${partes.month}-${partes.day}T${hora}:${partes.minute}`
}
