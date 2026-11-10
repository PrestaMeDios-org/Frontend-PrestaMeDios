import type { Sede } from "../../inventory/types"

export type { Sede }

// ─── Enums de dominio (espejo de app/modules/loans/enums.py) ──────────────────
export const ESTADOS_ORDEN = [
  "pendiente",
  "aprobada",
  "rechazada",
  "cancelada",
] as const
export type EstadoOrden = typeof ESTADOS_ORDEN[number]

export const ESTADOS_DETALLE = [
  "pendiente",
  "reservado",
  "entregado",
  "devuelto",
  "rechazado",
  "no_retirado",
  "cancelado",
] as const
export type EstadoDetalle = typeof ESTADOS_DETALLE[number]

/** Derivada por el backend (RN-L31): separa, dentro de un estado, lo que sigue en curso. */
export type SituacionOrden = "en_curso" | "finalizada"

// ─── DTOs: contrato 1:1 con los esquemas Pydantic (snake_case) ────────────────
// Las fechas viajan como ISO 8601 con zona horaria (AwareDatetime).

export interface ReglasDTO {
  /** "HH:MM:SS" */
  horario_apertura: string
  horario_cierre: string
  anticipacion_min_horas: number
  max_dias_general: number
  max_dias_notebook: number
  tolerancia_retiro_horas: number
}

export interface DetallePrestamoDTO {
  id: number
  equipamiento_id: number
  /** Vacía hasta que el administrador aprueba. */
  unidad_fisica_id: number | null
  estado: EstadoDetalle
  retiro_pactado: string
  devolucion_pactada: string
  fin_ocupacion: string
}

/** Identidad mínima del solicitante (P6). Solo llega a los administradores. */
export interface SolicitanteResumenDTO {
  id: number
  nombre: string
  apellido: string
}

export interface OrdenPedidoDTO {
  id: number
  solicitante_id: number
  sede: Sede
  asignatura_id: number | null
  estado: EstadoOrden
  fecha_solicitud: string
  observacion_docente: string | null
  motivo_resolucion: string | null
  es_renovado: boolean
  resuelto_en: string | null
  solicitante: SolicitanteResumenDTO | null
  detalles: DetallePrestamoDTO[]
  demorado: boolean
  situacion: SituacionOrden
}

export interface OrdenPedidoCreateDTO {
  asignatura_id?: number | null
  retiro: string
  devolucion: string
  /** Una línea por unidad pedida: repetir el modelo pide dos unidades. */
  items: { equipamiento_id: number }[]
  acepta_normativa: true
  pdf_aval_id?: string | null
  renueva_detalle_id?: number | null
}

export interface LineaUnidadesLibresDTO {
  detalle_id: number
  equipamiento_id: number
  /** Ids de las unidades libres para el período de la línea. */
  unidades: number[]
}

export interface AsignacionUnidadDTO {
  detalle_id: number
  unidad_fisica_id: number
}

export interface OrdenPedidoEstadoUpdateDTO {
  estado: Exclude<EstadoOrden, "pendiente">
  motivo?: string | null
  asignaciones?: AsignacionUnidadDTO[]
  nuevo_retiro?: string | null
  nueva_devolucion?: string | null
}

// ─── View models de UI (derivados en services/mappers.ts) ─────────────────────

export interface Reglas {
  /** "HH:MM" */
  horarioApertura: string
  horarioCierre: string
  anticipacionMinHoras: number
  maxDiasGeneral: number
  maxDiasNotebook: number
  toleranciaRetiroHoras: number
}

export interface LineaOrden {
  id: number
  equipamientoId: number
  unidadId: number | null
  estado: EstadoDetalle
  retiro: Date
  devolucion: Date
  finOcupacion: Date
}

export interface Solicitante {
  id: number
  nombre: string
  apellido: string
  nombreCompleto: string
}

export interface Orden {
  id: number
  solicitanteId: number
  /** Solo para administradores; `null` para el dueño. */
  solicitante: Solicitante | null
  sede: Sede
  asignaturaId: number | null
  estado: EstadoOrden
  situacion: SituacionOrden
  demorado: boolean
  fechaSolicitud: Date
  resueltoEn: Date | null
  motivoResolucion: string | null
  observacionDocente: string | null
  esRenovado: boolean
  /** El retiro más temprano de las líneas (todas comparten período salvo en un ajuste). */
  retiro: Date | null
  devolucion: Date | null
  lineas: LineaOrden[]
}

/** Lo que arma el formulario unificado (PRE-03). */
export interface SolicitudNueva {
  /** Obligatoria para estudiantes; el docente no la manda. */
  asignaturaId?: number | null
  retiro: Date
  devolucion: Date
  /** Un id por unidad pedida (el carrito puede repetir el modelo). */
  equipamientoIds: number[]
  aceptaNormativa: boolean
  pdfAvalId?: string | null
}

export interface LineaUnidadesLibres {
  lineaId: number
  equipamientoId: number
  unidadIds: number[]
}

export interface Asignacion {
  lineaId: number
  unidadId: number
}

export interface AjusteHorario {
  retiro: Date
  devolucion: Date
}

// ─── Filtros de listados ─────────────────────────────────────────────────────

export interface Paginacion {
  limit?: number
  offset?: number
}

export interface FiltrosMisOrdenes extends Paginacion {
  estado?: EstadoOrden
}

export interface FiltrosBandeja
  extends Paginacion {
  /** Por defecto el backend devuelve las `pendiente`. */
  /** Solo SUPERADMIN; un ADMIN_LOCAL que pide otra sede recibe 403. */
  estado?: EstadoOrden
  sede?: Sede
}
