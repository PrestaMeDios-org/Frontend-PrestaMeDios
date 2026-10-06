import type {
  CategoriaDTO,
  EquipamientoCreateDTO,
  EquipamientoDTO,
  EstadoUnidad,
  Sede,
  UnidadFisicaDTO,
} from "../types"

const BASE_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/v1/inventory`

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
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
    body: JSON.stringify(payload),
  })
}

export function cambiarEstadoUnidad(
  unidadId: number,
  estado: EstadoUnidad,
): Promise<UnidadFisicaDTO> {
  return request(`/unidades/${unidadId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  })
}

// Botón "Fuera de servicio": pasa la unidad a mantenimiento.
export const ponerFueraDeServicio = (unidadId: number) =>
  cambiarEstadoUnidad(unidadId, "mantenimiento")
