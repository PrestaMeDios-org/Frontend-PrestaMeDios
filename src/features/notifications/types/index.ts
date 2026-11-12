// ─── DTOs espejo de app/modules/notifications/schemas.py (SPEC-06 §5) ─────────
import type { Sede } from "../../auth/types"

export type { Sede }
export type EstadoComunicado = "PUBLICADO" | "ARCHIVADO"

export interface AutorComunicadoDTO {
  id: number
  nombre: string
  apellido: string
}

export interface ComunicadoDTO {
  id: number
  titulo: string
  contenido: string
  sede: Sede | null
  es_global: boolean
  estado: EstadoComunicado
  vigente: boolean
  autor: AutorComunicadoDTO | null
  publicado_en: string
  vence_en: string | null
  actualizado_en: string
}

export interface ComunicadosPageDTO {
  items: ComunicadoDTO[]
  total: number
}

export interface ComunicadoCreateDTO {
  titulo: string
  contenido: string
  sede?: Sede | null
  es_global?: boolean
  vence_en?: string | null
}

export interface ComunicadoUpdateDTO {
  titulo?: string
  contenido?: string
  /** `null` quita el vencimiento; omitirlo lo deja como está. */
  vence_en?: string | null
}

export interface FiltrosComunicados {
  /** Sólo SUPERADMIN (el backend responde 403 a otros roles con otra sede). */
  sede?: Sede
  /** Sólo administradores (el backend lo ignora para el resto). */
  incluir_archivados?: boolean
  limit?: number
  offset?: number
}

// ─── View model ───────────────────────────────────────────────────────────────
export interface Comunicado {
  id: number
  titulo: string
  contenido: string
  sede: Sede | null
  esGlobal: boolean
  /** "Global" o el nombre de la sede. */
  alcance: string
  estado: EstadoComunicado
  vigente: boolean
  /** Vencido: publicado pero con la fecha de vencimiento ya pasada. */
  vencido: boolean
  /** "Nombre Apellido" o "Laboratorio" si no hay autor visible. */
  autor: string
  publicadoEn: string
  publicadoLabel: string
  venceEn: string | null
  venceLabel: string | null
}
