// ─── DTOs espejo de app/modules/users/schemas.py (snake_case) ─────────────────
import type { Sede } from "../inventory/types"

export type { Sede }
export const SEDES: Sede[] = ["Ushuaia", "Río Grande"]

export type RolUsuario = "SUPERADMIN" | "ADMIN_LOCAL" | "DOCENTE" | "ESTUDIANTE"
export type EstadoCuenta =
  | "PENDIENTE_APROBACION"
  | "ACTIVO"
  | "RECHAZADO"
  | "SUSPENDIDO"
  | "INACTIVO"

export interface UsuarioResumenDTO {
  id: number
  email: string
  nombre: string
  apellido: string
  dni: string
  rol: RolUsuario
  sede: Sede | null
  estado: EstadoCuenta
  created_at: string
}

export interface UsuarioPublicoDTO extends UsuarioResumenDTO {
  telefono: string | null
  debe_cambiar_password: boolean
}

export interface UsuarioDetalleDTO extends UsuarioPublicoDTO {
  motivo_estado: string | null
  suspendido_hasta: string | null
  ultimo_login_en: string | null
  aprobado_por_id: number | null
  aprobado_en: string | null
  updated_at: string
}

export interface TokenResponseDTO {
  access_token: string
  token_type: "bearer"
  expires_in: number
  usuario: UsuarioPublicoDTO
}

export interface RegistroDTO {
  email: string
  password: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string | null
  rol: "ESTUDIANTE" | "DOCENTE"
  sede: Sede
}

export interface PerfilUpdateDTO {
  telefono?: string | null
  email?: string
  password_actual?: string
}

export interface CambioPasswordDTO {
  password_actual: string
  password_nueva: string
}
