import { apiRequest } from "../../../lib/api"
import type { Sede } from "../../auth/types"
import type { Bloqueo, Disponibilidad, Espacio, EstadoReserva, Reserva } from "../types"

// Contrato de SPEC-02 §3.2: sede como texto, solicitante tomado del token,
// disponibilidad sin identidad de otros usuarios y horario desde config.
const BASE_URL = (
  import.meta.env.VITE_SPACES_API_URL ??
  `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1/spaces`
).replace(/\/$/, "")

const request = <T>(path: string, init?: Parameters<typeof apiRequest>[1]) =>
  apiRequest<T>(`${BASE_URL}${path}`, init)

type EspacioApi = { id_espacio: number; nombre: string; tipo?: string | null; sede: Sede }

type ReservaApi = {
  id_reserva: number
  id_usuario: number
  id_espacio: number
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  estado_reserva: EstadoReserva
  motivo?: string | null
}

type BloqueoApi = {
  id_bloqueo: number
  id_espacio: number
  fecha_inicio: string
  fecha_fin: string
  hora_inicio?: string | null
  hora_fin?: string | null
  motivo: string
}

type DisponibilidadApi = {
  fecha: string
  horario_apertura: string
  horario_cierre: string
  franjas_ocupadas: { id_espacio: number; hora_inicio: string; hora_fin: string; estado_reserva: EstadoReserva }[]
  bloqueos: BloqueoApi[]
}

const hhmm = (h: string) => h.slice(0, 5)

const mapEspacio = (e: EspacioApi): Espacio => ({
  id: e.id_espacio,
  nombre: e.nombre,
  tipo: e.tipo ?? undefined,
  sede: e.sede,
})

const mapReserva = (r: ReservaApi): Reserva => ({
  id: r.id_reserva,
  idUsuario: r.id_usuario,
  idEspacio: r.id_espacio,
  fecha: r.fecha_reserva,
  horaInicio: hhmm(r.hora_inicio),
  horaFin: hhmm(r.hora_fin),
  estado: r.estado_reserva,
  motivo: r.motivo ?? undefined,
})

const mapBloqueo = (b: BloqueoApi): Bloqueo => ({
  id: b.id_bloqueo,
  idEspacio: b.id_espacio,
  fechaInicio: b.fecha_inicio,
  fechaFin: b.fecha_fin,
  horaInicio: b.hora_inicio ? hhmm(b.hora_inicio) : undefined,
  horaFin: b.hora_fin ? hhmm(b.hora_fin) : undefined,
  motivo: b.motivo,
})

export async function getEspacios(sede?: Sede | null): Promise<Espacio[]> {
  const qs = sede ? `?${new URLSearchParams({ sede })}` : ""
  return (await request<EspacioApi[]>(`/espacios${qs}`)).map(mapEspacio)
}

export async function getDisponibilidad(fecha: string, idEspacio: number): Promise<Disponibilidad> {
  const params = new URLSearchParams({ fecha, id_espacio: String(idEspacio) })
  const data = await request<DisponibilidadApi>(`/disponibilidad?${params}`)
  return {
    ocupaciones: data.franjas_ocupadas.map((f) => ({
      idEspacio: f.id_espacio,
      fecha: data.fecha,
      horaInicio: hhmm(f.hora_inicio),
      horaFin: hhmm(f.hora_fin),
      estado: f.estado_reserva,
    })),
    bloqueos: data.bloqueos.map(mapBloqueo),
    apertura: hhmm(data.horario_apertura),
    cierre: hhmm(data.horario_cierre),
  }
}

export async function createReserva(payload: {
  id_espacio: number
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  motivo?: string
}): Promise<Reserva> {
  return mapReserva(await request<ReservaApi>("/reservas", { method: "POST", json: payload }))
}

/** Estudiantes y docentes reciben sólo las propias; administradores, las de su sede. */
export async function listReservas(params?: {
  id_espacio?: number
  fecha?: string
  estado?: EstadoReserva
}): Promise<Reserva[]> {
  const q = new URLSearchParams()
  if (params?.id_espacio != null) q.set("id_espacio", String(params.id_espacio))
  if (params?.fecha) q.set("fecha", params.fecha)
  if (params?.estado) q.set("estado", params.estado)
  const qs = q.toString()
  return (await request<ReservaApi[]>(`/reservas${qs ? `?${qs}` : ""}`)).map(mapReserva)
}

export async function updateReservaEstado(
  idReserva: number,
  nuevo_estado: EstadoReserva,
  motivo_rechazo?: string,
): Promise<Reserva> {
  const data = await request<ReservaApi>(`/reservas/${idReserva}/estado`, {
    method: "PATCH",
    json: { nuevo_estado, ...(motivo_rechazo ? { motivo_rechazo } : {}) },
  })
  return mapReserva(data)
}

export async function createBloqueo(payload: {
  id_espacio: number
  fecha_inicio: string
  fecha_fin: string
  hora_inicio?: string
  hora_fin?: string
  motivo: string
}): Promise<Bloqueo> {
  return mapBloqueo(await request<BloqueoApi>("/bloqueos", { method: "POST", json: payload }))
}
