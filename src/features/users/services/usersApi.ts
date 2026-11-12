import { apiRequest } from "../../../lib/api"
import type { UsuarioPublicoDTO } from "../../auth/types"
import type {
  EstadoDestino,
  FiltrosDirectorio,
  PaginaUsuariosDTO,
  UsuarioAdminCreateDTO,
  UsuarioAdminUpdateDTO,
  UsuarioDetalleDTO,
} from "../types"

const BASE = "/api/v1/users"
const AUTH = "/api/v1/auth"

export function listarUsuarios(filtros: FiltrosDirectorio = {}): Promise<PaginaUsuariosDTO> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filtros)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
  }
  const qs = params.toString()
  return apiRequest(`${BASE}${qs ? `?${qs}` : ""}`)
}

export const obtenerUsuario = (id: number) => apiRequest<UsuarioDetalleDTO>(`${BASE}/${id}`)

export const crearUsuario = (datos: UsuarioAdminCreateDTO) =>
  apiRequest<UsuarioDetalleDTO>(BASE, { method: "POST", json: datos })

export const editarUsuario = (id: number, datos: UsuarioAdminUpdateDTO) =>
  apiRequest<UsuarioDetalleDTO>(`${BASE}/${id}`, { method: "PATCH", json: datos })

export const cambiarEstado = (id: number, nuevo_estado: EstadoDestino, motivo?: string) =>
  apiRequest<UsuarioDetalleDTO>(`${BASE}/${id}/estado`, {
    method: "PATCH",
    json: { nuevo_estado, ...(motivo ? { motivo } : {}) },
  })

/** Quita la foto de una cuenta (RN-64: el `ADMIN_LOCAL`, sólo de estudiantes y docentes). */
export const quitarFotoDeUsuario = (id: number) =>
  apiRequest<UsuarioDetalleDTO>(`${BASE}/${id}/foto`, { method: "DELETE" })

/** Sube o reemplaza la foto propia (SPEC-03 §6.3): multipart con el campo `archivo`. */
export const subirFoto = (archivo: File) => {
  const form = new FormData()
  form.append("archivo", archivo)
  return apiRequest<UsuarioPublicoDTO>(`${AUTH}/me/foto`, { method: "PUT", form })
}

export const quitarFoto = () => apiRequest<UsuarioPublicoDTO>(`${AUTH}/me/foto`, { method: "DELETE" })
