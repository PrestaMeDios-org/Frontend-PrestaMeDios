import { describe, expect, it } from "vitest"
import { ApiError } from "../../../lib/api"
import type { EquipamientoCatalogoDTO } from "../../inventory/types"
import type { LineaUnidadesLibres, Orden } from "../types"
import {
  aAjuste,
  aAsignaciones,
  asignacionInicial,
  etiquetasDelStock,
  mensajeDeErrorValidacion,
  retiroVencido,
  validarAjuste,
  validarSeleccion,
} from "./bandeja"
import { instanteLab } from "./solicitud"

const linea = (lineaId: number, unidadIds: number[], equipamientoId = 12): LineaUnidadesLibres => ({
  lineaId,
  equipamientoId,
  unidadIds,
})

const orden = (p: Partial<Orden> = {}): Orden => ({
  id: 5,
  solicitanteId: 7,
  solicitante: null,
  sede: "Ushuaia",
  asignaturaId: 7,
  estado: "pendiente",
  situacion: "en_curso",
  demorado: false,
  fechaSolicitud: new Date(),
  resueltoEn: null,
  motivoResolucion: null,
  observacionDocente: null,
  esRenovado: false,
  avalArchivoId: null,
  retiro: instanteLab("2026-11-11", "10:00"),
  devolucion: instanteLab("2026-11-13", "15:00"),
  lineas: [],
  ...p,
})

describe("retiroVencido", () => {
  const despues = instanteLab("2026-11-11", "10:01")
  it("marca una pendiente cuyo retiro ya pasó", () => {
    expect(retiroVencido(orden(), despues)).toBe(true)
  })
  it("no marca una pendiente con retiro futuro", () => {
    expect(retiroVencido(orden(), instanteLab("2026-11-11", "09:59"))).toBe(false)
  })
  it("no marca una orden ya resuelta", () => {
    expect(retiroVencido(orden({ estado: "aprobada" }), despues)).toBe(false)
  })
})

describe("asignacionInicial", () => {
  it("da a cada línea una unidad distinta", () => {
    expect(asignacionInicial([linea(1, [10, 11]), linea(2, [10, 11])])).toEqual({ 1: 10, 2: 11 })
  })
  it("deja en null la línea sin unidades suficientes", () => {
    expect(asignacionInicial([linea(1, [10]), linea(2, [10]), linea(3, [])])).toEqual({ 1: 10, 2: null, 3: null })
  })
})

describe("validarSeleccion y aAsignaciones", () => {
  const lineas = [linea(1, [10, 11]), linea(2, [10, 11])]
  it("una selección completa y sin repetidos es válida", () => {
    expect(validarSeleccion(lineas, { 1: 10, 2: 11 })).toBeNull()
    expect(aAsignaciones(lineas, { 1: 10, 2: 11 })).toEqual([
      { lineaId: 1, unidadId: 10 },
      { lineaId: 2, unidadId: 11 },
    ])
  })
  it("pide una unidad por línea", () => {
    expect(validarSeleccion(lineas, { 1: 10, 2: null })).toMatch(/cada equipo/)
  })
  it("no deja repetir una unidad", () => {
    expect(validarSeleccion(lineas, { 1: 10, 2: 10 })).toMatch(/misma unidad/)
  })
})

describe("ajuste horario", () => {
  const ahora = instanteLab("2026-11-11", "12:00")
  const ajuste = { fechaRetiro: "2026-11-12", horaRetiro: "10:00", fechaDevolucion: "2026-11-13", horaDevolucion: "15:00" }
  it("un horario futuro y ordenado es válido", () => {
    expect(validarAjuste(ajuste, ahora)).toBeNull()
    expect(aAjuste(ajuste)).toEqual({
      retiro: instanteLab("2026-11-12", "10:00"),
      devolucion: instanteLab("2026-11-13", "15:00"),
    })
  })
  it("exige las fechas", () => {
    expect(validarAjuste({ ...ajuste, fechaRetiro: "" }, ahora)).toMatch(/fechas/)
  })
  it("el retiro tiene que ser futuro", () => {
    expect(validarAjuste({ ...ajuste, fechaRetiro: "2026-11-11", horaRetiro: "11:00" }, ahora)).toMatch(/posterior a este momento/)
  })
  it("la devolución tiene que ser posterior al retiro", () => {
    expect(validarAjuste({ ...ajuste, fechaDevolucion: "2026-11-12", horaDevolucion: "09:00" }, ahora)).toMatch(/devolución/)
  })
})

describe("etiquetasDelStock", () => {
  it("toma nombres y códigos de inventario de la vista del administrador", () => {
    const equipos = [
      {
        id: 12,
        nombre: "Cámara Sony",
        unidades: [
          { id: 10, codigo_inventario: "CAM-S-01", locker: 3 },
          { id: 11, codigo_inventario: "CAM-S-02", locker: null },
        ],
      },
      { id: 13, nombre: "Trípode", locker: null },
    ] as unknown as EquipamientoCatalogoDTO[]
    const { nombres, unidades } = etiquetasDelStock(equipos)
    expect(nombres.get(13)).toBe("Trípode")
    expect(unidades.get(10)).toBe("CAM-S-01 · locker 3")
    expect(unidades.get(11)).toBe("CAM-S-02")
  })
})

describe("mensajeDeErrorValidacion", () => {
  const unidades = new Map([[10, "CAM-S-01"]])
  it("nombra la unidad que no se puede asignar", () => {
    const e = new ApiError(422, "detalle", "UNIDAD_NO_ASIGNABLE", {}, { unidad_fisica_id: 10, detalle_id: 1 })
    expect(mensajeDeErrorValidacion(e, unidades)).toMatch(/^CAM-S-01 no se puede asignar/)
  })
  it("explica el choque con otra reserva", () => {
    expect(mensajeDeErrorValidacion(new ApiError(409, "detalle", "UNIDAD_NO_DISPONIBLE"))).toMatch(/Otra orden/)
  })
  it("avisa si otro la resolvió antes", () => {
    const e = new ApiError(409, "detalle", "TRANSICION_INVALIDA", {}, { estado_actual: "aprobada" })
    expect(mensajeDeErrorValidacion(e)).toMatch(/ya está aprobada/)
  })
  it("si no hay mensaje propio, usa el del backend", () => {
    expect(mensajeDeErrorValidacion(new ApiError(422, "Indicá el motivo.", "MOTIVO_REQUERIDO"))).toBe("Indicá el motivo.")
  })
})
