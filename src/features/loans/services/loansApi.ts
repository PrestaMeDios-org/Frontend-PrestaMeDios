// ─── Cliente del módulo `loans` (SPEC-05 §6) ──────────────────────────────────
// Usa el cliente compartido: agrega el token y convierte los errores en `ApiError`
// ({status, code, message, campos, extra}). Los datos extra de negocio, como
// `equipamiento_id` y `max_dias` de LIMITE_DIAS_EXCEDIDO o `campo` de RETIRO_VENCIDO,
// llegan en `error.extra`.

import { type ApiInit, apiRequest } from "../../../lib/api"
import type {
  AjusteHorario,
  Asignacion,
  FiltrosBandeja,
  FiltrosMisOrdenes,
  LineaUnidadesLibres,
  LineaUnidadesLibresDTO,
  Orden,
  OrdenPedidoDTO,
  OrdenPedidoEstadoUpdateDTO,
  Reglas,
  ReglasDTO,
  SolicitudNueva,
} from "../types"
import {
  toAprobarDTO,
  toLineaUnidadesLibres,
  toOrden,
  toOrdenCreateDTO,
  toReglas,
  toResolucionDTO,
} from "./mappers"

const BASE = "/api/v1/loans"

function request<T>(
  path: string,
  init?: Pick<ApiInit, "method" | "json" | "signal">,
): Promise<T> {
  return apiRequest<T>(`${BASE}${path}`, init)
}

/** Query string que omite los filtros vacíos. */
export function construirQuery(filtros: object): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filtros)) {
    if (v === undefined || v === null || v === "") continue
    params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ─── Fase 1: solicitante ──────────────────────────────────────────────────────

/** Horario, anticipación y plazos vigentes, para armar el formulario (PRE-06, PRE-07). */
export async function obtenerReglas(signal?: AbortSignal): Promise<Reglas> {
  return toReglas(await request<ReglasDTO>("/reglas", { signal }))
}

/**
 * Sube el PDF de aval de alta gama a `files` (SPEC-03 §6.3, `proposito=AVAL_PRESTAMO`) y
 * devuelve su id, que viaja como `pdf_aval_id` en la orden (PRE-05). El archivo queda sin
 * vincular hasta que se crea la orden; si no se crea, `files` lo limpia.
 */
export async function subirAval(archivo: File): Promise<string> {
  const form = new FormData()
  form.append("archivo", archivo)
  form.append("proposito", "AVAL_PRESTAMO")
  const { id } = await apiRequest<{ id: string }>("/api/v1/files/archivos", {
    method: "POST",
    form,
  })
  return id
}

/** Queda `pendiente`; solicitante y sede salen de la sesión. */
export async function crearOrden(solicitud: SolicitudNueva): Promise<Orden> {
  const dto = await request<OrdenPedidoDTO>("/ordenes", {
    method: "POST",
    json: toOrdenCreateDTO(solicitud),
  })
  return toOrden(dto)
}

export async function listarMisOrdenes(
  filtros: FiltrosMisOrdenes = {},
  signal?: AbortSignal,
): Promise<Orden[]> {
  const dtos = await request<OrdenPedidoDTO[]>(
    `/ordenes/mias${construirQuery(filtros)}`,
    {
      signal,
    },
  )
  return dtos.map(toOrden)
}

/** Lo ven el dueño y los administradores con jurisdicción; fuera de alcance, 404. */
export async function obtenerOrden(
  ordenId: number,
  signal?: AbortSignal,
): Promise<Orden> {
  return toOrden(
    await request<OrdenPedidoDTO>(`/ordenes/${ordenId}`, { signal }),
  )
}

// ─── Fase 2: bandeja administrativa ───────────────────────────────────────────

/** Por defecto, las pendientes de la sede del administrador, de la más vieja a la más nueva. */
export async function listarBandeja(
  filtros: FiltrosBandeja = {},
  signal?: AbortSignal,
): Promise<Orden[]> {
  const dtos = await request<OrdenPedidoDTO[]>(
    `/ordenes${construirQuery(filtros)}`,
    { signal },
  )
  return dtos.map(toOrden)
}

/** Por línea, los ids de las unidades que se pueden asignar al aprobar. */
export async function obtenerUnidadesLibres(
  ordenId: number,
  signal?: AbortSignal,
): Promise<LineaUnidadesLibres[]> {
  const dtos = await request<LineaUnidadesLibresDTO[]>(
    `/ordenes/${ordenId}/unidades-libres`,
    {
      signal,
    },
  )
  return dtos.map(toLineaUnidadesLibres)
}

async function cambiarEstado(
  ordenId: number,
  body: OrdenPedidoEstadoUpdateDTO,
): Promise<Orden> {
  const dto = await request<OrdenPedidoDTO>(`/ordenes/${ordenId}/estado`, {
    method: "PATCH",
    json: body,
  })
  return toOrden(dto)
}

/** Una unidad por línea; con `ajuste`, el horario nuevo para todas las líneas (PRE-18). */
export const aprobarOrden = (
  ordenId: number,
  asignaciones: Asignacion[],
  ajuste?: AjusteHorario,
) => cambiarEstado(ordenId, toAprobarDTO(asignaciones, ajuste))

/** Motivo obligatorio (422 MOTIVO_REQUERIDO). */
export const rechazarOrden = (ordenId: number, motivo: string) =>
  cambiarEstado(ordenId, toResolucionDTO("rechazada", motivo))

/**
 * El solicitante cancela su orden `pendiente` (sin motivo). El administrador cancela
 * una `aprobada` de su sede, con motivo obligatorio.
 */
export const cancelarOrden = (ordenId: number, motivo?: string) =>
  cambiarEstado(ordenId, toResolucionDTO("cancelada", motivo))
