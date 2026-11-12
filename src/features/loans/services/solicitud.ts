// ─── Formulario de solicitud (SPEC-05 F1.4, F1.7) ─────────────────────────────
// Lógica pura, sin React: armado de fechas, validación previa y mensajes de error.
// El backend sigue siendo la garantía (P2.2): esto sólo evita idas y vueltas.

import { ApiError } from "../../../lib/api"
import { DESFASE_LAB, hoyLab } from "../../../lib/fechas"
import type { Reglas, SolicitudNueva } from "../types"
import type { ItemCarrito } from "./carrito"

/** Tamaño máximo del PDF de aval (`ARCHIVO_PDF_MAX_MB` de `files`, por defecto 10). */
export const AVAL_MAX_MB = 10

export interface FormularioSolicitud {
  /** "AAAA-MM-DD" */
  fechaRetiro: string
  /** "HH:MM" */
  horaRetiro: string
  fechaDevolucion: string
  horaDevolucion: string
  /** Provisorio hasta que exista el catálogo de asignaturas (C3, D-L13): un número. */
  asignatura: string
  aceptaNormativa: boolean
  aval: File | null
}

export type CampoSolicitud =
  | "fechaRetiro"
  | "horaRetiro"
  | "fechaDevolucion"
  | "horaDevolucion"
  | "asignatura"
  | "aceptaNormativa"
  | "aval"

export type ErroresSolicitud = Partial<Record<CampoSolicitud, string>>

export interface ContextoSolicitud {
  reglas: Reglas
  items: ItemCarrito[]
  /** Los estudiantes indican la asignatura; los docentes, no (RN-L07). */
  requiereAsignatura: boolean
  /** Hay ítems de alta gama (RN-L09). */
  requiereAval: boolean
  ahora?: Date
}

/**
 * Instante de una fecha y hora del laboratorio: lo que elige el usuario se interpreta en la
 * hora del laboratorio, esté donde esté su navegador (RN-L29, EC-L04).
 */
export function instanteLab(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00${DESFASE_LAB}`)
}

/** La fecha de hoy en el laboratorio ("AAAA-MM-DD"), para el mínimo del calendario. */
export function fechaHoyLab(ahora: Date = new Date()): string {
  const hoy = hoyLab(ahora) // compartida (`lib/fechas`): fecha local con el día del laboratorio
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`
}

const aMinutos = (hora: string) => {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}
const aHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`

/**
 * ¿La fecha ("AAAA-MM-DD") cae en sábado o domingo? Sólo para avisar: todavía no hay una
 * regla de días de atención (pregunta 1 de SPEC-05 §15.2, D-09 de SPEC-09).
 */
export function esFinDeSemana(fecha: string): boolean {
  if (!fecha) return false
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay()
  return dia === 0 || dia === 6
}

/** Horas elegibles entre la apertura y el cierre, ambas incluidas (RN-L04, EC-L03). */
export function opcionesDeHora(apertura: string, cierre: string, pasoMin = 30): string[] {
  const opciones: string[] = []
  for (let m = aMinutos(apertura); m <= aMinutos(cierre); m += pasoMin) opciones.push(aHora(m))
  if (opciones[opciones.length - 1] !== cierre) opciones.push(cierre)
  return opciones
}

/** Días corridos contando el de retiro y el de devolución (RN-L06, D-L04). */
export function diasCorridos(fechaRetiro: string, fechaDevolucion: string): number {
  const dia = 24 * 60 * 60 * 1000
  return Math.round((Date.parse(fechaDevolucion) - Date.parse(fechaRetiro)) / dia) + 1
}

/** Plazo máximo de un ítem: el menor entre el parámetro de su tipo y su propio máximo (D-L03). */
export function limiteDias(item: ItemCarrito, reglas: Reglas): number {
  const porTipo = item.esNotebook ? reglas.maxDiasNotebook : reglas.maxDiasGeneral
  return Math.min(porTipo, item.maxDias)
}

export function formularioInicial(reglas: Reglas): FormularioSolicitud {
  return {
    fechaRetiro: "",
    horaRetiro: reglas.horarioApertura,
    fechaDevolucion: "",
    horaDevolucion: reglas.horarioCierre,
    asignatura: "",
    aceptaNormativa: false,
    aval: null,
  }
}

const esPdf = (archivo: File) =>
  archivo.type === "application/pdf" || archivo.name.toLowerCase().endsWith(".pdf")

/** Validación previa al envío. Devuelve un mensaje por campo; vacío si se puede enviar. */
export function validarSolicitud(f: FormularioSolicitud, ctx: ContextoSolicitud): ErroresSolicitud {
  const { reglas } = ctx
  const errores: ErroresSolicitud = {}

  if (!f.fechaRetiro) errores.fechaRetiro = "Elegí la fecha de retiro."
  if (!f.fechaDevolucion) errores.fechaDevolucion = "Elegí la fecha de devolución."
  const dentroDeFranja = (hora: string) =>
    aMinutos(hora) >= aMinutos(reglas.horarioApertura) && aMinutos(hora) <= aMinutos(reglas.horarioCierre)
  const franja = `entre las ${reglas.horarioApertura} y las ${reglas.horarioCierre}`
  if (!dentroDeFranja(f.horaRetiro)) errores.horaRetiro = `El retiro tiene que ser ${franja}.`
  if (!dentroDeFranja(f.horaDevolucion)) errores.horaDevolucion = `La devolución tiene que ser ${franja}.`

  if (f.fechaRetiro && f.fechaDevolucion && !errores.horaRetiro && !errores.horaDevolucion) {
    const retiro = instanteLab(f.fechaRetiro, f.horaRetiro)
    const devolucion = instanteLab(f.fechaDevolucion, f.horaDevolucion)
    const minimo = new Date((ctx.ahora ?? new Date()).getTime() + reglas.anticipacionMinHoras * 3600_000)
    if (devolucion <= retiro) {
      errores.fechaDevolucion = "La devolución tiene que ser posterior al retiro."
    } else if (retiro < minimo) {
      errores.fechaRetiro = `El retiro se pide con al menos ${reglas.anticipacionMinHoras} horas de anticipación.`
    } else {
      const dias = diasCorridos(f.fechaRetiro, f.fechaDevolucion)
      const excedido = ctx.items.find((item) => dias > limiteDias(item, reglas))
      if (excedido) {
        const limite = limiteDias(excedido, reglas)
        errores.fechaDevolucion = `«${excedido.nombre}» se presta hasta ${limite} ${limite === 1 ? "día" : "días"}; elegiste ${dias}.`
      }
    }
  }

  if (ctx.requiereAsignatura) {
    const n = Number(f.asignatura)
    if (!f.asignatura.trim()) errores.asignatura = "Indicá la asignatura para la que pedís el equipo."
    else if (!Number.isInteger(n) || n < 1) errores.asignatura = "El código de asignatura es un número entero positivo."
  }
  if (!f.aceptaNormativa) errores.aceptaNormativa = "Tenés que aceptar la normativa para solicitar."
  if (ctx.requiereAval) {
    if (!f.aval) errores.aval = "Los equipos de alta gama requieren el aval en PDF."
    else if (!esPdf(f.aval)) errores.aval = "El aval tiene que ser un archivo PDF."
    else if (f.aval.size > AVAL_MAX_MB * 1024 * 1024) errores.aval = `El aval no puede superar los ${AVAL_MAX_MB} MB.`
  }
  return errores
}

/** Lo que se envía a `crearOrden`, una vez validado el formulario. */
export function aSolicitudNueva(
  f: FormularioSolicitud,
  equipamientoIds: number[],
  ctx: Pick<ContextoSolicitud, "requiereAsignatura">,
  pdfAvalId?: string | null,
): SolicitudNueva {
  return {
    asignaturaId: ctx.requiereAsignatura ? Number(f.asignatura) : null,
    retiro: instanteLab(f.fechaRetiro, f.horaRetiro),
    devolucion: instanteLab(f.fechaDevolucion, f.horaDevolucion),
    equipamientoIds,
    aceptaNormativa: f.aceptaNormativa,
    pdfAvalId: pdfAvalId ?? null,
  }
}

/** Errores del servidor en palabras del usuario (F1.7). Si no hay uno propio, usa el del backend. */
export function mensajeDeErrorSolicitud(e: unknown, items: ItemCarrito[]): string {
  if (!(e instanceof ApiError)) return "No se pudo enviar la solicitud. Revisá tu conexión e intentá de nuevo."
  const nombre = (id: unknown) => items.find((i) => i.equipamientoId === id)?.nombre ?? "Un equipo"
  switch (e.code) {
    case "EQUIPAMIENTO_NO_DISPONIBLE": {
      const libres = e.extra.libres
      return typeof libres === "number" && libres > 0
        ? `«${nombre(e.extra.equipamiento_id)}» tiene solo ${libres} ${libres === 1 ? "unidad libre" : "unidades libres"} en esas fechas. Bajá la cantidad o probá otras fechas.`
        : `«${nombre(e.extra.equipamiento_id)}» no tiene unidades libres en esas fechas. Probá otras fechas o quitalo del pedido.`
    }
    case "LIMITE_DIAS_EXCEDIDO":
      return `«${nombre(e.extra.equipamiento_id)}» se presta hasta ${e.extra.max_dias} días.`
    case "EQUIPAMIENTO_NO_ENCONTRADO":
      return `«${nombre(e.extra.equipamiento_id)}» ya no está disponible para préstamo. Quitalo del pedido.`
    case "ARCHIVO_INVALIDO":
      return "No se pudo usar el aval. Volvé a adjuntar el PDF."
    case "TIPO_ARCHIVO_NO_PERMITIDO":
      return "El aval tiene que ser un archivo PDF."
    case "ARCHIVO_DEMASIADO_GRANDE":
      return `El aval no puede superar los ${AVAL_MAX_MB} MB.`
    default:
      return e.message || "No se pudo enviar la solicitud."
  }
}
