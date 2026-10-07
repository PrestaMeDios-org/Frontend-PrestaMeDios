export type Espacio = {
  id: number
  nombre: string
  tipo?: string
  idSede: number
}

export type Reserva = {
  id: number
  idUsuario: number
  idEspacio: number
  fecha: string // YYYY-MM-DD
  horaInicio: string // HH:MM
  horaFin: string
  estado: "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada" | "En_Uso" | "Finalizada"
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
