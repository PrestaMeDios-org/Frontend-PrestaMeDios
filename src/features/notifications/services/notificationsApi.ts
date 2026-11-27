import { apiRequest } from "../../../lib/api"
import type {
  ComunicadoCreateDTO,
  ComunicadoDTO,
  ComunicadosPageDTO,
  ComunicadoUpdateDTO,
  EstadoComunicado,
  FiltrosComunicados,
  NotificacionDTO,
  NotificacionesPageDTO,
  ResumenNotificacionesDTO,
} from "../types"

const BASE = "/api/v1/notifications"

function query(filtros: FiltrosComunicados): string {
  const p = new URLSearchParams()
  if (filtros.sede) p.set("sede", filtros.sede)
  if (filtros.incluir_archivados) p.set("incluir_archivados", "true")
  if (filtros.limit !== undefined) p.set("limit", String(filtros.limit))
  if (filtros.offset) p.set("offset", String(filtros.offset))
  const texto = p.toString()
  return texto ? `?${texto}` : ""
}

// ─── Comunicados (NOV-02) ─────────────────────────────────────────────────────
export const listarComunicados = (filtros: FiltrosComunicados = {}, signal?: AbortSignal) =>
  apiRequest<ComunicadosPageDTO>(`${BASE}/comunicados${query(filtros)}`, { signal })

export const obtenerComunicado = (id: number) =>
  apiRequest<ComunicadoDTO>(`${BASE}/comunicados/${id}`)

export const crearComunicado = (datos: ComunicadoCreateDTO) =>
  apiRequest<ComunicadoDTO>(`${BASE}/comunicados`, { method: "POST", json: datos })

export const editarComunicado = (id: number, datos: ComunicadoUpdateDTO) =>
  apiRequest<ComunicadoDTO>(`${BASE}/comunicados/${id}`, { method: "PATCH", json: datos })

export const cambiarEstadoComunicado = (id: number, estado: EstadoComunicado) =>
  apiRequest<ComunicadoDTO>(`${BASE}/comunicados/${id}/estado`, {
    method: "PATCH",
    json: { estado },
  })

// ─── Portal (NOV-01): el horario sale de `config` (P8, SPEC-06 RN-N1) ──────────
interface ParametroHoraDTO {
  clave: string
  valor: string
}

export async function obtenerHorario(signal?: AbortSignal): Promise<{ apertura: string; cierre: string }> {
  const leer = (clave: string) =>
    apiRequest<ParametroHoraDTO>(`/api/v1/config/parametros/${encodeURIComponent(clave)}`, { signal })
  const [apertura, cierre] = await Promise.all([leer("horario.apertura"), leer("horario.cierre")])
  return { apertura: String(apertura.valor), cierre: String(cierre.valor) }
}

// ─── Notificaciones personales (NOV-04) ───────────────────────────────────────
export const listarNotificaciones = (
  filtros: { solo_no_leidas?: boolean; limit?: number; offset?: number } = {},
  signal?: AbortSignal,
) => {
  const p = new URLSearchParams()
  if (filtros.solo_no_leidas) p.set("solo_no_leidas", "true")
  if (filtros.limit !== undefined) p.set("limit", String(filtros.limit))
  if (filtros.offset) p.set("offset", String(filtros.offset))
  const q = p.toString()
  return apiRequest<NotificacionesPageDTO>(`${BASE}/notificaciones${q ? `?${q}` : ""}`, { signal })
}

export const obtenerResumenNotificaciones = (signal?: AbortSignal) =>
  apiRequest<ResumenNotificacionesDTO>(`${BASE}/notificaciones/resumen`, { signal })

export const marcarNotificacionLeida = (id: number) =>
  apiRequest<NotificacionDTO>(`${BASE}/notificaciones/${id}/leida`, { method: "PATCH" })

export const leerTodasLasNotificaciones = () =>
  apiRequest<{ marcadas: number }>(`${BASE}/notificaciones/leer-todas`, { method: "POST" })
