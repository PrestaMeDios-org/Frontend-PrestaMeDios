// ─── Selección de horarios (SPEC-08 v1.1.0, RES-02, D-S04) ────────────────────
// Funciones puras: los horarios contiguos se piden como una sola reserva y cada tramo
// separado como otra. Los turnos son de una hora y se escriben "HH:MM".

/** Un tramo de horarios seguidos: una reserva de `inicio` a `fin`. */
export interface Corrida {
  inicio: string
  fin: string
  /** Los turnos de una hora que forman el tramo, en orden. */
  turnos: string[]
}

/** "10:00" → "11:00". */
export const sumarHora = (hora: string) =>
  `${String(Number(hora.slice(0, 2)) + 1).padStart(2, "0")}:${hora.slice(3)}`

/**
 * Agrupa los turnos elegidos en tramos contiguos (EC-S14): 10–11 y 11–12 dan un tramo
 * 10–12; 10–11 y 12–13 dan dos. No importa el orden en que se eligieron ni si se
 * repiten.
 */
export function agruparCorridas(turnos: string[]): Corrida[] {
  const ordenados = Array.from(new Set(turnos)).sort()
  const corridas: Corrida[] = []
  for (const turno of ordenados) {
    const ultima = corridas[corridas.length - 1]
    if (ultima && ultima.fin === turno) {
      ultima.fin = sumarHora(turno)
      ultima.turnos.push(turno)
    } else {
      corridas.push({ inicio: turno, fin: sumarHora(turno), turnos: [turno] })
    }
  }
  return corridas
}
