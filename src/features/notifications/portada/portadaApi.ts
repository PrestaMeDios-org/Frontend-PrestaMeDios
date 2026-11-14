// MOMENTÁNEO (SPEC-10 M-02, §4.7): API de la portada elegible de los comunicados.
// Toda la carpeta `portada/` se borra junto con las líneas marcadas en ComunicadoForm,
// ComunicadosList y NewsPage (SPEC-10 §1.4).
import { apiRequest } from "../../../lib/api"
import type { TemaComunicado } from "../services/tema"

const BASE = "/api/v1/notifications/comunicados"

export interface PortadaDTO {
  comunicado_id: number
  tema: TemaComunicado | null
  tiene_imagen: boolean
  actualizado_en: string
}

/** Lo que se elige en el formulario. */
export type EleccionPortada =
  | { tipo: "auto" }
  | { tipo: "tema"; tema: TemaComunicado }
  | { tipo: "foto"; archivo: File }
  /** Foto ya guardada que no se cambia. */
  | { tipo: "foto-actual" }

export const listarPortadas = (ids: number[], signal?: AbortSignal) =>
  apiRequest<PortadaDTO[]>(`${BASE}/portadas?ids=${ids.join(",")}`, { signal })

export const descargarPortada = (id: number) =>
  apiRequest<Blob>(`${BASE}/${id}/portada/imagen`, { responseType: "blob" })

export function eleccionDesde(p: PortadaDTO | undefined): EleccionPortada {
  if (!p) return { tipo: "auto" }
  if (p.tiene_imagen) return { tipo: "foto-actual" }
  return p.tema ? { tipo: "tema", tema: p.tema } : { tipo: "auto" }
}

/** Aplica la elección después de crear o editar el comunicado. */
export async function aplicarPortada(id: number, eleccion: EleccionPortada, antes: EleccionPortada): Promise<void> {
  if (eleccion.tipo === "foto-actual") return
  if (eleccion.tipo === "auto") {
    if (antes.tipo !== "auto") await apiRequest<void>(`${BASE}/${id}/portada`, { method: "DELETE" })
    return
  }
  if (eleccion.tipo === "tema") {
    if (antes.tipo === "tema" && antes.tema === eleccion.tema) return
    await apiRequest(`${BASE}/${id}/portada`, { method: "PUT", json: { tema: eleccion.tema } })
    return
  }
  const form = new FormData()
  form.append("archivo", eleccion.archivo)
  await apiRequest(`${BASE}/${id}/portada/imagen`, { method: "PUT", form })
}
