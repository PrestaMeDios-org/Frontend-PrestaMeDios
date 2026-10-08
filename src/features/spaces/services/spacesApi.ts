import type { Bloqueo, Espacio, Reserva } from "../types"

const BASE_URL = (
  import.meta.env.VITE_SPACES_API_URL ??
  `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1/spaces`
).replace(/\/$/, "")

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text()
  if (!text) return `Error ${res.status}`

  try {
    const parsed = JSON.parse(text)
    const message =
      parsed?.detail ??
      parsed?.message ??
      parsed?.error ??
      parsed?.detail?.message ??
      parsed?.errors?.[0]?.message

    if (typeof message === "string" && message.trim()) return message
  } catch {
    // Fall through to the raw response body if the server is not returning JSON.
  }

  return text
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    })
  } catch {
    throw new Error(
      "No se pudo conectar con la API de reservas. Verificá que el backend esté levantado y que VITE_SPACES_API_URL apunte al contrato correcto.",
    )
  }

  if (!res.ok) {
    const detail = await readErrorMessage(res)
    if (res.status === 409) {
      throw new Error(`Conflicto de disponibilidad: ${detail}`)
    }
    throw new Error(detail || `Error ${res.status}`)
  }

  const raw = await res.text()
  if (!raw) return undefined as T
  try {
    return JSON.parse(raw) as T
  } catch {
    return raw as unknown as T
  }
}

type EspacioApi = { id_espacio: number; nombre: string; tipo?: string | null; id_sede: number }

type ReservaApi = {
  id_reserva: number
  id_usuario: number
  id_espacio: number
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
  estado_reserva: Reserva["estado"]
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
  id_sede: number
  id_espacio: number | null
  reservas_ocupadas: ReservaApi[]
  bloqueos: BloqueoApi[]
}

const mapEspacio = (e: EspacioApi): Espacio => ({
  id: e.id_espacio,
  nombre: e.nombre,
  tipo: e.tipo ?? undefined,
  idSede: e.id_sede,
})

const mapReserva = (r: ReservaApi): Reserva => ({
  id: r.id_reserva,
  idUsuario: r.id_usuario,
  idEspacio: r.id_espacio,
  fecha: r.fecha_reserva,
  horaInicio: r.hora_inicio.slice(0, 5),
  horaFin: r.hora_fin.slice(0, 5),
  estado: r.estado_reserva,
  motivo: r.motivo ?? undefined,
})

const mapBloqueo = (b: BloqueoApi): Bloqueo => ({
  id: b.id_bloqueo,
  idEspacio: b.id_espacio,
  fechaInicio: b.fecha_inicio,
  fechaFin: b.fecha_fin,
  horaInicio: b.hora_inicio ? b.hora_inicio.slice(0, 5) : undefined,
  horaFin: b.hora_fin ? b.hora_fin.slice(0, 5) : undefined,
  motivo: b.motivo,
})

export async function getEspacios(): Promise<Espacio[]> {
  const data = await request<EspacioApi[]>("/espacios")
  return data.map(mapEspacio)
}

export async function getDisponibilidad(
  idSede: number,
  fecha: string,
  idEspacio?: number,
): Promise<{ reservas: Reserva[]; bloqueos: Bloqueo[] }> {
  const params = new URLSearchParams({ id_sede: String(idSede), fecha })
  if (idEspacio != null) params.set("id_espacio", String(idEspacio))
  const data = await request<DisponibilidadApi>(`/disponibilidad?${params}`)
  return {
    reservas: data.reservas_ocupadas.map(mapReserva),
    bloqueos: data.bloqueos.map(mapBloqueo),
  }
}

export async function createReserva(payload: {
  id_usuario: number
  id_espacio: number
  fecha_reserva: string
  hora_inicio: string
  hora_fin: string
}): Promise<Reserva> {
  const data = await request<ReservaApi>("/reservas", {
    method: "POST",
    body: JSON.stringify({ ...payload, estado_reserva: "Pendiente" }),
  })
  return mapReserva(data)
}

export async function listReservas(params?: {
  id_espacio?: number
  fecha?: string
  estado?: string
  id_usuario?: number
}): Promise<Reserva[]> {
  const q = new URLSearchParams()
  if (params?.id_espacio != null) q.set("id_espacio", String(params.id_espacio))
  if (params?.fecha) q.set("fecha", params.fecha)
  if (params?.estado) q.set("estado", params.estado)
  if (params?.id_usuario != null) q.set("id_usuario", String(params.id_usuario))
  const qs = q.toString()
  const data = await request<ReservaApi[]>(`/reservas${qs ? `?${qs}` : ""}`)
  return data.map(mapReserva)
}

export async function updateReservaEstado(
  idReserva: number,
  nuevo_estado: "Aprobada" | "Rechazada" | "Cancelada",
  motivo_rechazo?: string,
): Promise<Reserva> {
  const data = await request<ReservaApi>(`/reservas/${idReserva}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ nuevo_estado, motivo_rechazo }),
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
  const data = await request<BloqueoApi>("/bloqueos", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return mapBloqueo(data)
}
