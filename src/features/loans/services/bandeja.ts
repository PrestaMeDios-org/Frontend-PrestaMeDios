// ─── Bandeja del administrador (SPEC-05 F2.1…F2.3, F2.5) ──────────────────────
// Lógica pura: preasignación de unidades, validación de la aprobación, ajuste horario
// y mensajes de error. El backend sigue siendo la garantía (P2.2).

import { ApiError } from "../../../lib/api"
import type { EquipamientoCatalogoDTO } from "../../inventory/types"
import type { AjusteHorario, Asignacion, LineaUnidadesLibres, Orden } from "../types"
import { instanteLab } from "./solicitud"

/** Unidad elegida por línea (`null` si todavía no hay). */
export type SeleccionUnidades = Record<number, number | null>

/** Una orden pendiente cuyo retiro ya pasó sólo se aprueba ajustando el horario (RN-L27). */
export function retiroVencido(orden: Orden, ahora: Date = new Date()): boolean {
  return orden.estado === "pendiente" && orden.retiro !== null && orden.retiro <= ahora
}

/**
 * Preasigna a cada línea la primera unidad libre que no tomó otra línea, para que el
 * administrador sólo tenga que confirmar. Si no alcanzan, la línea queda en `null`.
 */
export function asignacionInicial(lineas: LineaUnidadesLibres[]): SeleccionUnidades {
  const usadas = new Set<number>()
  const seleccion: SeleccionUnidades = {}
  for (const linea of lineas) {
    const libre = linea.unidadIds.find((id) => !usadas.has(id)) ?? null
    if (libre !== null) usadas.add(libre)
    seleccion[linea.lineaId] = libre
  }
  return seleccion
}

/** Mensaje si la selección no se puede enviar; `null` si está completa (RN-L11, AC-L22). */
export function validarSeleccion(lineas: LineaUnidadesLibres[], seleccion: SeleccionUnidades): string | null {
  if (lineas.some((l) => seleccion[l.lineaId] == null)) return "Elegí una unidad para cada equipo."
  const elegidas = lineas.map((l) => seleccion[l.lineaId])
  if (new Set(elegidas).size !== elegidas.length) return "No se puede asignar la misma unidad a dos equipos."
  return null
}

export function aAsignaciones(lineas: LineaUnidadesLibres[], seleccion: SeleccionUnidades): Asignacion[] {
  return lineas.map((l) => ({ lineaId: l.lineaId, unidadId: seleccion[l.lineaId] as number }))
}

export interface FormularioAjuste {
  fechaRetiro: string
  horaRetiro: string
  fechaDevolucion: string
  horaDevolucion: string
}

/**
 * Ajuste horario al aprobar (PRE-18): el retiro nuevo tiene que ser futuro y la devolución
 * posterior. Franja y plazo los valida el backend con los parámetros vigentes.
 */
export function validarAjuste(f: FormularioAjuste, ahora: Date = new Date()): string | null {
  if (!f.fechaRetiro || !f.fechaDevolucion) return "Completá las fechas del nuevo horario."
  const retiro = instanteLab(f.fechaRetiro, f.horaRetiro)
  const devolucion = instanteLab(f.fechaDevolucion, f.horaDevolucion)
  if (retiro <= ahora) return "El nuevo retiro tiene que ser posterior a este momento."
  if (devolucion <= retiro) return "La nueva devolución tiene que ser posterior al retiro."
  return null
}

export function aAjuste(f: FormularioAjuste): AjusteHorario {
  return {
    retiro: instanteLab(f.fechaRetiro, f.horaRetiro),
    devolucion: instanteLab(f.fechaDevolucion, f.horaDevolucion),
  }
}

/**
 * Del stock que ve el administrador (vista completa de `inventory`): nombre de cada equipo y
 * etiqueta de cada unidad ("CAM-S-01 · locker 3"). `unidades-libres` sólo devuelve ids (Q1).
 */
export function etiquetasDelStock(equipos: EquipamientoCatalogoDTO[]): {
  nombres: Map<number, string>
  unidades: Map<number, string>
} {
  const nombres = new Map<number, string>()
  const unidades = new Map<number, string>()
  for (const eq of equipos) {
    nombres.set(eq.id, eq.nombre)
    for (const u of "unidades" in eq ? eq.unidades : []) {
      unidades.set(u.id, u.locker ? `${u.codigo_inventario} · locker ${u.locker}` : u.codigo_inventario)
    }
  }
  return { nombres, unidades }
}

/** Errores de aprobar, rechazar o cancelar, en palabras del administrador. */
export function mensajeDeErrorValidacion(e: unknown, unidades: Map<number, string> = new Map()): string {
  if (!(e instanceof ApiError)) return "No se pudo completar la acción. Revisá tu conexión e intentá de nuevo."
  const unidad = (id: unknown) => (typeof id === "number" && unidades.get(id)) || "La unidad elegida"
  switch (e.code) {
    case "UNIDAD_NO_DISPONIBLE":
      return "Otra orden ya tiene reservada una de esas unidades en ese período. Elegí otra unidad."
    case "UNIDAD_NO_ASIGNABLE":
      return `${unidad(e.extra.unidad_fisica_id)} no se puede asignar: no está disponible o es de otra sede o equipo.`
    case "TRANSICION_INVALIDA":
      return `La orden ya está ${e.extra.estado_actual ?? "resuelta"}: alguien la resolvió mientras la revisabas.`
    default:
      return e.message || "No se pudo completar la acción."
  }
}
