// ─── Shared app types ─────────────────────────────────────────────────────────
export type Role = "student" | "teacher" | "admin" | "icse"
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
