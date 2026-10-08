// ─── Shared app types ─────────────────────────────────────────────────────────
// Rol de UI derivado de RolUsuario del backend (ver features/auth/roles.ts).
export type Role = "student" | "teacher" | "admin"
export type Screen =
  | "catalog"
  | "detail"
  | "spaces"
  | "news"
  | "status"
  | "validations"
  | "deliveries"
  | "admin-dashboard"
  | "admin-validations"
  | "admin-stock"
  | "admin-calendar"
  | "users"
  | "notes"
  | "profile"
  | "parameters"
export type BehaviorChip =
  | "tardio"
  | "sucio"
  | "dano"
  | "infraccion"
  | "puntual"
  | "cuidadoso"
export type SpaceType = "editing"
export type CartType = "normal" | "alta-gama" | null
export interface NewsTag {
  id: string
  label: string
  color: string
  bg: string
}
