import type {
  CategoriaDTO,
  EquipamientoCatalogoDTO,
  EquipamientoCreateDTO,
  EquipamientoDTO,
  EquipamientoUpdateDTO,
  EstadoUnidad,
  Sede,
  UnidadFisicaCreateDTO,
  UnidadFisicaDTO,
  UnidadFisicaUpdateDTO,
} from "../types"

import { apiRequest } from "../../../lib/api"

const BASE = "/api/v1/inventory"

// Cliente compartido: agrega el token de sesión y normaliza los errores (SPEC-02 §6.4).
function request<T>(
  path: string,
  init?: { method?: string; json?: unknown; signal?: AbortSignal },
): Promise<T> {
  return apiRequest<T>(`${BASE}${path}`, init)
}

export interface EquipamientoFiltros {
  sede?: Sede
  categoria?: string
  q?: string
  /** Sólo administradores; el backend lo ignora para el resto (RN-I5). */
  incluir_inactivos?: boolean
}

/** Query string del catálogo: omite los filtros vacíos o en `false`. */
export function construirQuery(filtros: EquipamientoFiltros): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filtros)) {
    if (v === undefined || v === null || v === "" || v === false) continue
    params.set(k, String(v))
  }
  return params.toString()
}

// Estudiantes y docentes reciben la vista reducida; administradores, la completa.
export function listarEquipamiento(
  filtros: EquipamientoFiltros = {},
  signal?: AbortSignal,
): Promise<EquipamientoCatalogoDTO[]> {
  const query = construirQuery(filtros)
  return request(`/equipamiento${query ? `?${query}` : ""}`, { signal })
}

export function listarCategorias(signal?: AbortSignal): Promise<CategoriaDTO[]> {
  return request("/categorias", { signal })
}

// ─── Administración (PRE-12, PRE-14, PRE-19) ──────────────────────────────────
export function crearEquipamiento(payload: EquipamientoCreateDTO): Promise<EquipamientoDTO> {
  return request("/equipamiento", { method: "POST", json: payload })
}

export function editarEquipamiento(
  id: number,
  cambios: EquipamientoUpdateDTO,
): Promise<EquipamientoDTO> {
  return request(`/equipamiento/${id}`, { method: "PATCH", json: cambios })
}

/** Baja (`false`) o reactivación (`true`) lógica del ítem. */
export function cambiarEstadoEquipamiento(id: number, activo: boolean): Promise<EquipamientoDTO> {
  return request(`/equipamiento/${id}/estado`, { method: "PATCH", json: { activo } })
}

export function agregarUnidad(
  equipamientoId: number,
  payload: UnidadFisicaCreateDTO,
): Promise<UnidadFisicaDTO> {
  return request(`/equipamiento/${equipamientoId}/unidades`, { method: "POST", json: payload })
}

export function editarUnidad(
  unidadId: number,
  cambios: UnidadFisicaUpdateDTO,
): Promise<UnidadFisicaDTO> {
  return request(`/unidades/${unidadId}`, { method: "PATCH", json: cambios })
}

export function cambiarEstadoUnidad(
  unidadId: number,
  estado: EstadoUnidad,
): Promise<UnidadFisicaDTO> {
  return request(`/unidades/${unidadId}/estado`, { method: "PATCH", json: { estado } })
}

// "En Mantenimiento" es temporal; "Fuera de servicio" (baja) es definitivo (SPEC-04 D-03, D-09).
// `prestado` no se envía nunca: lo gestiona el módulo de préstamos (D-02).
export const ponerEnMantenimiento = (unidadId: number) =>
  cambiarEstadoUnidad(unidadId, "mantenimiento")
export const darDeBajaUnidad = (unidadId: number) => cambiarEstadoUnidad(unidadId, "baja")
export const rehabilitarUnidad = (unidadId: number) =>
  cambiarEstadoUnidad(unidadId, "disponible")
