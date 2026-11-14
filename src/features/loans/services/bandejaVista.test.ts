import { describe, expect, it } from "vitest"
import type { Orden } from "../types"
import { contarPorTipo, diasDelPeriodo, fechaCorta, inicialesDe, resumenBandeja, tipoDe, type FichaEquipo } from "./bandejaVista"

const ficha = (altaGama = false): FichaEquipo => ({ nombre: "Equipo", codigo: "X-1", imagen: null, altaGama })
const fichas = new Map<number, FichaEquipo>([
  [1, ficha()],
  [2, ficha(true)],
])

const orden = (p: Partial<Orden> = {}): Orden =>
  ({
    id: 1,
    solicitanteId: 9,
    solicitante: null,
    sede: "Ushuaia",
    asignaturaId: 101,
    estado: "pendiente",
    situacion: "en_curso",
    demorado: false,
    fechaSolicitud: new Date(),
    resueltoEn: null,
    motivoResolucion: null,
    observacionDocente: null,
    esRenovado: false,
    avalArchivoId: null,
    retiro: null,
    devolucion: null,
    lineas: [{ id: 1, equipamientoId: 1, unidadId: null, estado: "pendiente", retiro: new Date(), devolucion: new Date(), finOcupacion: new Date() }],
    ...p,
  }) as Orden

describe("bandeja en tabla (SPEC-10 V-14)", () => {
  it("deduce el tipo de solicitud", () => {
    expect(tipoDe(orden(), fichas)).toBe("estudiante")
    expect(tipoDe(orden({ asignaturaId: null }), fichas)).toBe("docente")
    expect(tipoDe(orden({ avalArchivoId: "abc" }), fichas)).toBe("especial")
    const conAltaGama = orden({ lineas: [{ ...orden().lineas[0], equipamientoId: 2 }] })
    expect(tipoDe(conAltaGama, fichas)).toBe("especial")
    expect(contarPorTipo([orden(), orden({ asignaturaId: null }), conAltaGama], fichas)).toEqual({
      estudiante: 1,
      docente: 1,
      especial: 1,
    })
  })

  it("cuenta los días del período con retiro y devolución incluidos", () => {
    expect(diasDelPeriodo(new Date("2026-11-18T10:00:00-03:00"), new Date("2026-11-19T12:00:00-03:00"))).toBe(2)
    expect(diasDelPeriodo(new Date("2026-11-18T09:00:00-03:00"), new Date("2026-11-18T16:00:00-03:00"))).toBe(1)
  })

  it("resume pendientes, aprobadas hoy y observaciones del docente", () => {
    const ahora = new Date("2026-11-12T20:00:00-03:00")
    const r = resumenBandeja(
      [orden(), orden({ observacionDocente: "Ok de la cátedra" }), orden({ observacionDocente: "  " })],
      [orden({ resueltoEn: new Date("2026-11-12T10:00:00-03:00") }), orden({ resueltoEn: new Date("2026-11-11T10:00:00-03:00") })],
      ahora,
    )
    expect(r).toEqual({ pendientes: 3, aprobadasHoy: 1, conObservacion: 1 })
  })

  it("formatea la fecha corta como en el prototipo", () => {
    expect(fechaCorta(new Date("2026-11-18T10:00:00-03:00"))).toBe("18 nov 2026")
  })

  it("arma las iniciales", () => {
    expect(inicialesDe("Joaquín Prueba")).toBe("JP")
    expect(inicialesDe("Ana")).toBe("A")
  })
})
