// ─── Roles: backend (RolUsuario) → rol de UI usado por los componentes (SPEC-02 D-07)
import type { Role } from "../../types"
import type { EstadoCuenta, RolUsuario } from "./types"

export function uiRole(rol: RolUsuario): Role {
  if (rol === "ESTUDIANTE") return "student"
  if (rol === "DOCENTE") return "teacher"
  return "admin"
}

export const esAdmin = (rol: RolUsuario): boolean => rol === "SUPERADMIN" || rol === "ADMIN_LOCAL"

export const ROL_LABEL: Record<RolUsuario, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN_LOCAL: "Administrador local",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
}

export const ESTADO_LABEL: Record<EstadoCuenta, string> = {
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  ACTIVO: "Activa",
  RECHAZADO: "Rechazada",
  SUSPENDIDO: "Suspendida",
  INACTIVO: "Dada de baja",
}

/** Iniciales para el avatar ("Lucía Pérez" → "LP"). */
export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.trim()[0] ?? ""}${apellido.trim()[0] ?? ""}`.toUpperCase()
}

/** Política de contraseña del backend (SPEC-01 RN-03). Devuelve el error o `null`. */
export function errorPassword(password: string, email?: string): string | null {
  if (password.length < 8) return "Mínimo 8 caracteres."
  if (password.length > 128) return "Máximo 128 caracteres."
  if (!/\p{L}/u.test(password) || !/\d/.test(password))
    return "Debe contener al menos una letra y un número."
  if (email && password.trim().toLowerCase() === email.trim().toLowerCase())
    return "No puede ser igual al email."
  return null
}
