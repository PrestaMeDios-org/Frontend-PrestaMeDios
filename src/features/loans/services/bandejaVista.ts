// Presentación de la bandeja en tabla (SPEC-10 V-14). Funciones puras sobre datos que ya
// trae la API: no agregan reglas, sólo agrupan y cuentan para mostrar.
import { ZONA_LAB } from "../../../lib/fechas"
import type { EquipamientoCatalogoDTO } from "../../inventory/types"
import type { Orden } from "../types"

export interface FichaEquipo {
  nombre: string
  codigo: string
  imagen: string | null
  altaGama: boolean
}

/** Nombre, código, imagen y alta gama de cada equipo del stock que ve el admin. */
export function fichasDelStock(equipos: EquipamientoCatalogoDTO[]): Map<number, FichaEquipo> {
  return new Map(
    equipos.map((e) => [e.id, { nombre: e.nombre, codigo: e.codigo, imagen: e.imagen_url, altaGama: e.alta_gama }]),
  )
}

export type TipoSolicitud = "estudiante" | "docente" | "especial"

export const TIPO_LABEL: Record<TipoSolicitud, string> = {
  estudiante: "Solicitudes de Estudiantes",
  docente: "Solicitudes de Docentes",
  especial: "Solicitudes Especiales",
}

/**
 * Deducido de la orden: "especial" si lleva alta gama o aval (PRE-05); si no, "estudiante"
 * si tiene asignatura (la cargan sólo los estudiantes, PRE-03) y "docente" si no (PRE-09).
 */
export function tipoDe(orden: Orden, fichas: Map<number, FichaEquipo>): TipoSolicitud {
  if (orden.avalArchivoId || orden.lineas.some((l) => fichas.get(l.equipamientoId)?.altaGama)) return "especial"
  return orden.asignaturaId != null ? "estudiante" : "docente"
}

export function contarPorTipo(ordenes: Orden[], fichas: Map<number, FichaEquipo>): Record<TipoSolicitud, number> {
  const cuenta: Record<TipoSolicitud, number> = { estudiante: 0, docente: 0, especial: 0 }
  for (const o of ordenes) cuenta[tipoDe(o, fichas)] += 1
  return cuenta
}

const DIA_ISO = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_LAB, year: "numeric", month: "2-digit", day: "2-digit" })
const isoLab = (f: Date) => DIA_ISO.format(f)

/** Días del período contando retiro y devolución, en la fecha del laboratorio (como RN-L06). */
export function diasDelPeriodo(retiro: Date, devolucion: Date): number {
  return Math.round((Date.parse(isoLab(devolucion)) - Date.parse(isoLab(retiro))) / 86_400_000) + 1
}

/** Las tres cifras de arriba de la bandeja. */
export function resumenBandeja(
  pendientes: Orden[],
  aprobadas: Orden[],
  ahora: Date = new Date(),
): { pendientes: number; aprobadasHoy: number; conObservacion: number } {
  const hoy = isoLab(ahora)
  return {
    pendientes: pendientes.length,
    aprobadasHoy: aprobadas.filter((o) => o.resueltoEn && isoLab(o.resueltoEn) === hoy).length,
    conObservacion: pendientes.filter((o) => o.observacionDocente?.trim()).length,
  }
}

/** "Joaquín Prueba" → "JP". */
export function inicialesDe(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("")
}

const FECHA_CORTA = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, day: "numeric", month: "short", year: "numeric" })
const HORA = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, hour: "2-digit", minute: "2-digit", hour12: false })

/** "18 nov 2026" y "10:00", en la zona del laboratorio. */
export const fechaCorta = (f: Date) => FECHA_CORTA.format(f).replace(/ de /g, " ").replace(".", "")
export const horaLab = (f: Date) => HORA.format(f)
