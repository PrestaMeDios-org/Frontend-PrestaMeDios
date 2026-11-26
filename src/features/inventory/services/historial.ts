// ─── Historial por unidad y reservas afectadas (SPEC-04 §5.3, §5.5, §8.3) ─────
// Funciones puras: no importan nada de `loans` (D-12). Los textos de los estados de línea
// viven acá para que `inventory` no dependa de esa feature.

import { ZONA_LAB } from "../../../lib/fechas"
import type { EstadoLineaPrestamo, MovimientoUnidad, MovimientoUnidadDTO } from "../types"

/** Filas por página del historial. */
export const POR_PAGINA = 20

export const TEXTO_ESTADO_LINEA: Record<EstadoLineaPrestamo, string> = {
  pendiente: "Pendiente",
  reservado: "Reservado",
  entregado: "Entregado",
  devuelto: "Devuelto",
  cancelado: "Cancelado",
  rechazado: "Rechazado",
  no_retirado: "No retirado",
}

const SIN_DATO = "—"

const FECHA_HORA = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_LAB,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

/** "12/11/2026 10:00" en la hora del laboratorio, o "—" si no hay dato. */
export function fechaHoraLab(iso: string | null): string {
  if (!iso) return SIN_DATO
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? SIN_DATO : FECHA_HORA.format(fecha).replace(",", "")
}

export function aMovimiento(dto: MovimientoUnidadDTO): MovimientoUnidad {
  const s = dto.solicitante
  return {
    id: dto.detalle_id,
    ordenId: dto.orden_id,
    solicitante: s ? `${s.nombre} ${s.apellido}`.trim() : SIN_DATO,
    estado: dto.estado,
    estadoTexto: TEXTO_ESTADO_LINEA[dto.estado] ?? dto.estado,
    retiro: fechaHoraLab(dto.retiro_pactado),
    devolucion: fechaHoraLab(dto.devolucion_pactada),
    entregado: fechaHoraLab(dto.entregado_en),
    devuelto: fechaHoraLab(dto.devuelto_en),
    observacion: dto.observacion_devolucion?.trim() || SIN_DATO,
  }
}

/** Hay otra página mientras la última vino completa (el backend no informa el total). */
export function hayMas(recibidas: number, limit: number = POR_PAGINA): boolean {
  return recibidas >= limit
}

/**
 * Aviso persistente del stock cuando una unidad pasa a mantenimiento o baja con reservas
 * aprobadas futuras (PRE-17). `null` si no hay nada que avisar.
 */
export function textoReservasAfectadas(
  codigo: string,
  cantidad: number | null | undefined,
  ordenes: number[] | null | undefined,
): string | null {
  if (!cantidad || cantidad <= 0) return null
  const reservas = cantidad === 1 ? "1 reserva aprobada" : `${cantidad} reservas aprobadas`
  const lista = (ordenes ?? []).map((id) => `#${id}`)
  const detalle =
    lista.length === 0 ? "" : ` (${lista.length === 1 ? "orden" : "órdenes"} ${lista.join(", ")})`
  return (
    `La unidad ${codigo} tenía ${reservas}${detalle}. ` +
    "Resolvelas con una cancelación forzada en la Bandeja de Validaciones."
  )
}
