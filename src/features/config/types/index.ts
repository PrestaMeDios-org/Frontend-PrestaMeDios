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
