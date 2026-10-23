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
  // Opcional: el backend la fija para ADMIN_LOCAL y la exige al SUPERADMIN (PRE-19).
  sede?: Sede
  locker?: number | null
}

export interface UnidadFisicaUpdateDTO {
  numero_serie?: string
  codigo_inventario?: string
  locker?: number | null
}

interface EquipamientoBaseDTO {
  id: number
  codigo: string
  nombre: string
  marca: string
  modelo: string
  categoria_id: string
  descripcion: string | null
  max_dias_prestamo: number
  alta_gama: boolean
  es_notebook: boolean
  imagen_url: string | null
  video_url: string | null
  reglas_cuidado: string[]
  // computed_field del backend
  cantidad_total: number
  cantidad_disponible: number
  en_mantenimiento: boolean
}

/** Vista de administradores (SPEC-04 §5.1): incluye unidades y baja lógica. */
export interface EquipamientoDTO extends EquipamientoBaseDTO {
  activo: boolean
  unidades: UnidadFisicaDTO[]
}

/** Vista de estudiantes y docentes (SPEC-04 RN-I7): sin unidades ni series. */
export interface EquipamientoPublicoDTO extends EquipamientoBaseDTO {
  locker: number | null
}

export type EquipamientoCatalogoDTO = EquipamientoDTO | EquipamientoPublicoDTO

export interface EquipamientoCreateDTO {
  codigo: string
  nombre: string
  marca: string
  modelo: string
  categoria_id: string
  descripcion?: string | null
  max_dias_prestamo?: number
  alta_gama?: boolean
  es_notebook?: boolean
  imagen_url?: string | null
  video_url?: string | null
  reglas_cuidado?: string[]
  unidades?: UnidadFisicaCreateDTO[]
}

// `codigo` es inmutable (SPEC-04 §5.3).
export type EquipamientoUpdateDTO = Partial<Omit<EquipamientoCreateDTO, "codigo" | "unidades">>

// ─── View models de UI (derivados de los DTOs en services/mappers.ts) ─────────
export interface Unidad {
  id: number
  serie: string
  codigoInventario: string
  sede: Sede
  locker: number | null
  estado: EstadoUnidad
}

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
  model: string
  quantity: number
  available_count: number
  altaGama?: boolean
  esNotebook: boolean
  /** `false` si el ítem fue dado de baja lógica (sólo lo ven los administradores). */
  activo: boolean
  sede?: Sede
  locker?: number
  /** Lockers distintos de las unidades activas, ordenados (vacío si no hay dato). */
  lockers: number[]
  careRules?: string[]
  videoUrl?: string
  /** Sólo en la vista de administradores. */
  unidades?: Unidad[]
}

export interface Category {
  id: string
  label: string
  color: string
}
