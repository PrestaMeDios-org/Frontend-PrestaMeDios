import type { Sede } from "../../auth/types"

// ─── DTOs espejo de app/modules/config/schemas.py (GLO-03) ────────────────────
export type TipoParametro = "ENTERO" | "DECIMAL" | "BOOLEANO" | "TEXTO" | "HORA"
export type ValorParametro = number | boolean | string

export interface ParametroDTO {
  clave: string
  tipo: TipoParametro
  valor: ValorParametro
  descripcion: string
  unidad: string | null
  valor_min: number | null
  valor_max: number | null
  editable: boolean
  version: number
  actualizado_por_id: number | null
  actualizado_en: string
}

export interface ParametroHistorialDTO {
  version: number
  valor_anterior: ValorParametro
  valor_nuevo: ValorParametro
  motivo: string | null
  actor_id: number | null
  created_at: string
}

// ─── Horario y correo de contacto por sede (SPEC-09 §4.5, GLO-02, GLO-03) ─────
/** Espejo de `DatosSedeResponse` (`GET /api/v1/config/sedes`). */
export interface DatosSedeDTO {
  sede: Sede
  horario_apertura: string // "HH:MM:SS"
  horario_cierre: string
  correo_contacto: string | null // null mientras no se configure
}

/** Vista para el portal, los avisos y los calendarios. */
export interface DatosSede {
  sede: Sede
  apertura: string // "HH:MM"
  cierre: string
  correoContacto: string | null
}
