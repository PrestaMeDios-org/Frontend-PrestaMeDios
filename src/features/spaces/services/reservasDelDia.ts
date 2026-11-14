// Reservas de un día para el administrador (SPEC-10 V-21). Sólo ordena lo que la API ya
// devuelve: al admin con jurisdicción le llegan solicitante y motivo (SPEC-08 AC-S14); al
// estudiante, sólo las propias (RN-30), así que esto no se usa en su vista.
import { SEPARADOR } from "./motivo"

interface ReservaDia {
  idEspacio: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: string
}

const VIGENTES = new Set(["Pendiente", "Aprobada", "En_Uso", "Finalizada"])

/** Las del espacio y el día, sin canceladas ni rechazadas, por hora de inicio. */
export function reservasDelDia<T extends ReservaDia>(reservas: T[], idEspacio: number | null, fecha: string | null): T[] {
  return reservas
    .filter((r) => r.idEspacio === idEspacio && r.fecha === fecha && VIGENTES.has(r.estado))
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
}

/** La reserva que cubre el turno; si hay una aprobada y una pendiente, gana la aprobada. */
export function reservaDelTurno<T extends ReservaDia>(reservas: T[], turno: string): T | undefined {
  const cubren = reservas.filter((r) => r.horaInicio <= turno && r.horaFin > turno)
  return cubren.find((r) => r.estado !== "Pendiente") ?? cubren[0]
}

/** "Taller — Rodaje" → { materia: "Taller", descripcion: "Rodaje" }. Sin separador, todo es la materia. */
export function separarMotivo(motivo?: string | null): { materia: string; descripcion: string } {
  if (!motivo) return { materia: "", descripcion: "" }
  const i = motivo.indexOf(SEPARADOR)
  if (i < 0) return { materia: motivo.trim(), descripcion: "" }
  return { materia: motivo.slice(0, i).trim(), descripcion: motivo.slice(i + SEPARADOR.length).trim() }
}
