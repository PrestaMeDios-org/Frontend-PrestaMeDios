// Reglas del formulario de comunicados (NOV-02, SPEC-06 RN-N2, PRE-04).
// Funciones puras: se prueban sin React.
import type { RolUsuario, Sede } from "../../auth/types"
import type { Comunicado, ComunicadoCreateDTO, ComunicadoUpdateDTO } from "../types"
import { isoALocal, localAIso } from "./fechas"

/** "" = sin elegir (sólo SUPERADMIN tiene que elegir). */
export type OpcionAlcance = "" | "GLOBAL" | Sede

export interface ComunicadoForm {
  titulo: string
  contenido: string
  alcance: OpcionAlcance
  /** Valor de `<input type="datetime-local">` o "" (sin vencimiento). */
  venceEn: string
}

export type ErroresComunicado = Partial<Record<"titulo" | "contenido" | "alcance" | "vence_en", string>>

export const TITULO_MIN = 3
export const TITULO_MAX = 150
export const CONTENIDO_MAX = 5000

/** Sólo el SUPERADMIN elige el alcance; el ADMIN_LOCAL publica siempre en su sede. */
export const mostrarSelectorAlcance = (rol: RolUsuario): boolean => rol === "SUPERADMIN"

/** El ADMIN_LOCAL no edita ni archiva comunicados globales (RN-N5). */
export const puedeGestionar = (rol: RolUsuario, comunicado: Pick<Comunicado, "esGlobal">): boolean =>
  rol === "SUPERADMIN" || (rol === "ADMIN_LOCAL" && !comunicado.esGlobal)

export const formVacio = (): ComunicadoForm => ({ titulo: "", contenido: "", alcance: "", venceEn: "" })

export const formDesdeComunicado = (c: Comunicado): ComunicadoForm => ({
  titulo: c.titulo,
  contenido: c.contenido,
  alcance: c.esGlobal ? "GLOBAL" : (c.sede ?? ""),
  venceEn: c.venceEn ? isoALocal(c.venceEn) : "",
})

/** Errores por campo; vacío si se puede enviar. `ahora` se inyecta para los tests. */
export function validarComunicado(
  form: ComunicadoForm,
  rol: RolUsuario,
  modo: "alta" | "edicion",
  ahora: Date = new Date(),
): ErroresComunicado {
  const errores: ErroresComunicado = {}
  const titulo = form.titulo.trim()
  const contenido = form.contenido.trim()

  if (!titulo) errores.titulo = "El título es obligatorio."
  else if (titulo.length < TITULO_MIN) errores.titulo = `Mínimo ${TITULO_MIN} caracteres.`
  else if (titulo.length > TITULO_MAX) errores.titulo = `Máximo ${TITULO_MAX} caracteres.`

  if (!contenido) errores.contenido = "El contenido es obligatorio."
  else if (contenido.length > CONTENIDO_MAX) errores.contenido = `Máximo ${CONTENIDO_MAX} caracteres.`

  if (modo === "alta" && mostrarSelectorAlcance(rol) && !form.alcance)
    errores.alcance = "Elegí una sede o «Global»."

  if (form.venceEn) {
    const iso = localAIso(form.venceEn)
    if (!iso) errores.vence_en = "Fecha inválida."
    else if (new Date(iso) <= ahora) errores.vence_en = "La fecha de vencimiento tiene que ser futura."
  }
  return errores
}

export function construirAlta(form: ComunicadoForm, rol: RolUsuario): ComunicadoCreateDTO {
  const dto: ComunicadoCreateDTO = {
    titulo: form.titulo.trim(),
    contenido: form.contenido.trim(),
    vence_en: form.venceEn ? localAIso(form.venceEn) : null,
  }
  if (mostrarSelectorAlcance(rol)) {
    if (form.alcance === "GLOBAL") dto.es_global = true
    else if (form.alcance) dto.sede = form.alcance
  }
  return dto
}

/** Sólo los campos que cambiaron; quitar el vencimiento envía `null`. */
export function construirEdicion(form: ComunicadoForm, original: Comunicado): ComunicadoUpdateDTO {
  const dto: ComunicadoUpdateDTO = {}
  const titulo = form.titulo.trim()
  const contenido = form.contenido.trim()
  if (titulo !== original.titulo) dto.titulo = titulo
  if (contenido !== original.contenido) dto.contenido = contenido
  const antes = original.venceEn ? isoALocal(original.venceEn) : ""
  if (form.venceEn !== antes) dto.vence_en = form.venceEn ? localAIso(form.venceEn) : null
  return dto
}
