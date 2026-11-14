// ─── DTOs espejo de app/modules/users/schemas.py (gestión administrativa) ─────
import type {
  EstadoCuenta,
  RolUsuario,
  Sede,
  UsuarioDetalleDTO,
  UsuarioResumenDTO,
} from "../../auth/types"

export type { EstadoCuenta, RolUsuario, Sede, UsuarioDetalleDTO, UsuarioResumenDTO }

export interface PaginaUsuariosDTO {
  items: UsuarioResumenDTO[]
  total: number
  limit: number
  offset: number
}

export interface FiltrosDirectorio {
  sede?: Sede | null
  rol?: RolUsuario | ""
  estado?: EstadoCuenta | ""
  q?: string
  /** El backend acepta `apellido` (por defecto) o `created_at` (fecha de alta). */
  ordenar_por?: "apellido" | "created_at"
  direccion?: "asc" | "desc"
  limit?: number
  offset?: number
}

export interface UsuarioAdminCreateDTO {
  email: string
  password: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string | null
  rol: RolUsuario
  sede: Sede | null
}

export type UsuarioAdminUpdateDTO = Partial<{
  nombre: string
  apellido: string
  dni: string
  telefono: string | null
  email: string
  rol: RolUsuario
  sede: Sede | null
  password_nueva: string
}>

export type EstadoDestino = "ACTIVO" | "RECHAZADO" | "SUSPENDIDO" | "INACTIVO"
