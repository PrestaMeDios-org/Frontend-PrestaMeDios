// ─── Enums de dominio (espejo de app/modules/inventory/enums.py) ──────────────
export const SEDES = ["Ushuaia", "Río Grande"] as const
export type Sede = (typeof SEDES)[number]

export const ESTADOS_UNIDAD = [
  "disponible",
  "prestado",
  "mantenimiento",
  "baja",
] as const
export type EstadoUnidad = (typeof ESTADOS_UNIDAD)[number]

// ─── DTOs: contrato 1:1 con los esquemas Pydantic (snake_case) ────────────────
export interface CategoriaDTO {
  id: string
  nombre: string
  color: string | null
}

export interface UnidadFisicaDTO {
  id: number
  numero_serie: string
  codigo_inventario: string
  sede: Sede
  locker: number | null
  estado: EstadoUnidad
}

export interface UnidadFisicaCreateDTO {
  numero_serie: string
  codigo_inventario: string
  sede: Sede
  locker?: number | null
  estado?: EstadoUnidad
}

export interface EquipamientoDTO {
  id: number
  codigo: string
  nombre: string
  marca: string
  modelo: string
  categoria_id: string
  descripcion: string | null
  max_dias_prestamo: number
  alta_gama: boolean
  imagen_url: string | null
  video_url: string | null
  reglas_cuidado: string[]
  unidades: UnidadFisicaDTO[]
  // computed_field del backend
  cantidad_total: number
  cantidad_disponible: number
  en_mantenimiento: boolean
}

export interface EquipamientoCreateDTO {
  codigo: string
  nombre: string
  marca: string
  modelo: string
  categoria_id: string
  descripcion?: string | null
  max_dias_prestamo?: number
  alta_gama?: boolean
  imagen_url?: string | null
  video_url?: string | null
  reglas_cuidado?: string[]
  unidades?: UnidadFisicaCreateDTO[]
}

// ─── View models de UI (derivados de los DTOs en services/mappers.ts) ─────────
export interface Equipment {
  id: number
  name: string
  category: string
  available: boolean
  maintenance: boolean
  image: string
  specs: string
  maxDays: number
  code: string
  brand: string
  quantity: number
  available_count: number
  altaGama?: boolean
  sede?: Sede
  locker?: number
  careRules?: string[]
  videoUrl?: string
}

export interface Category {
  id: string
  label: string
  color: string
}
