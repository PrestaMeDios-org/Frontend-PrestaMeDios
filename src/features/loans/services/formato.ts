// ─── Presentación de órdenes (SPEC-05 F1.5) ───────────────────────────────────

import { ZONA_LAB } from "../../../lib/fechas"
import type { EstadoDetalle, EstadoOrden, LineaOrden } from "../types"

const FECHA_LAB = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_LAB,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

/** "12/11/2026 10:00", siempre en la hora del laboratorio (RN-L29). */
export function fechaLab(fecha: Date): string {
  return FECHA_LAB.format(fecha).replace(",", "")
}

export const ESTADO_ORDEN_LABEL: Record<EstadoOrden, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
}

export const ESTADO_DETALLE_LABEL: Record<EstadoDetalle, string> = {
  pendiente: "Pendiente",
  reservado: "Reservado",
  entregado: "Entregado",
  devuelto: "Devuelto",
  rechazado: "Rechazado",
  no_retirado: "No retirado",
  cancelado: "Cancelado",
}

/** Líneas agrupadas por modelo, en el orden en que aparecen: "2 × Cámara Sony". */
export function resumenDeLineas(
  lineas: LineaOrden[],
  nombres: Map<number, string>,
): { equipamientoId: number; nombre: string; cantidad: number }[] {
  const grupos = new Map<number, number>()
  for (const linea of lineas) grupos.set(linea.equipamientoId, (grupos.get(linea.equipamientoId) ?? 0) + 1)
  return [...grupos].map(([equipamientoId, cantidad]) => ({
    equipamientoId,
    nombre: nombres.get(equipamientoId) ?? `Equipo #${equipamientoId}`,
    cantidad,
  }))
}
