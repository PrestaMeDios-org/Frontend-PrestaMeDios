import type { Sede } from "../../auth/types"

export type EstadoReserva = "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada" | "En_Uso" | "Finalizada"

export type Espacio = {
  id: number
  nombre: string
  tipo?: string
  sede: Sede
}

/** Franja ocupada en un espacio (sin identidad del solicitante, SPEC-02 RN-30). */
export type Ocupacion = {
  idEspacio: number
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:MM
  horaFin: string
  estado: EstadoReserva
}

/** Reserva visible para su dueño o para un administrador con jurisdicción. */
export type Reserva = Ocupacion & {
  id: number
  idUsuario: number
  motivo?: string
}

export type Bloqueo = {
  id: number
  idEspacio: number
  fechaInicio: string
  fechaFin: string
  horaInicio?: string
  horaFin?: string
  motivo: string
}

export type Disponibilidad = {
  ocupaciones: Ocupacion[]
  bloqueos: Bloqueo[]
  apertura: string // HH:MM
  cierre: string
}
