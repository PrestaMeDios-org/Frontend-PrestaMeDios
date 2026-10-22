import type {
  CategoriaDTO,
  EquipamientoCreateDTO,
  EquipamientoDTO,
  EstadoUnidad,
  Sede,
  UnidadFisicaDTO,
} from "../types"

import { apiRequest } from "../../../lib/api"

const BASE = "/api/v1/inventory"

// Cliente compartido: agrega el token de sesión y normaliza los errores (SPEC-02 §6.4).
function request<T>(path: string, init?: { method?: string; json?: unknown; signal?: AbortSignal }): Promise<T> {
  return apiRequest<T>(`${BASE}${path}`, init)
}

export interface EquipamientoFiltros {
  sede?: Sede
  categoria?: string
  q?: string
}

export function listarEquipamiento(
  filtros: EquipamientoFiltros = {},
  signal?: AbortSignal,
): Promise<EquipamientoDTO[]> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filtros)) if (v) params.set(k, v)
  return request(`/equipamiento?${params}`, { signal })
}

export function listarCategorias(signal?: AbortSignal): Promise<CategoriaDTO[]> {
  return request("/categorias", { signal })
}

export function crearEquipamiento(
  payload: EquipamientoCreateDTO,
): Promise<EquipamientoDTO> {
  return request("/equipamiento", {
    method: "POST",
    json: payload,
  })
}

export function cambiarEstadoUnidad(
  unidadId: number,
  estado: EstadoUnidad,
): Promise<UnidadFisicaDTO> {
  return request(`/unidades/${unidadId}/estado`, {
    method: "PATCH",
    json: { estado },
  })
}

// Botón "Fuera de servicio": pasa la unidad a mantenimiento.
export const ponerFueraDeServicio = (unidadId: number) =>
  cambiarEstadoUnidad(unidadId, "mantenimiento")
