import { describe, expect, it } from "vitest"
import { ApiError } from "../../../lib/api"
import type { Reglas } from "../types"
import type { ItemCarrito } from "./carrito"
import {
  aSolicitudNueva,
  diasCorridos,
  fechaHoyLab,
  formularioInicial,
  instanteLab,
  limiteDias,
  mensajeDeErrorSolicitud,
  opcionesDeHora,
  validarSolicitud,
  type ContextoSolicitud,
  type FormularioSolicitud,
} from "./solicitud"

const REGLAS: Reglas = {
  horarioApertura: "09:00",
  horarioCierre: "16:00",
  anticipacionMinHoras: 24,
  maxDiasGeneral: 4,
  maxDiasNotebook: 15,
  toleranciaRetiroHoras: 2,
}

const item = (p: Partial<ItemCarrito> = {}): ItemCarrito => ({
  equipamientoId: 12,
  nombre: "Cámara Sony",
  codigo: "CAM-001",
  imagen: "",
  altaGama: false,
  esNotebook: false,
  maxDias: 15,
  maxCantidad: 3,
  cantidad: 1,
  ...p,
})

// "Ahora" fijo: lunes 9/11/2026 a las 12:00 del laboratorio.
const AHORA = instanteLab("2026-11-09", "12:00")

const ctx = (p: Partial<ContextoSolicitud> = {}): ContextoSolicitud => ({
  reglas: REGLAS,
  items: [item()],
  requiereAsignatura: true,
  requiereAval: false,
  ahora: AHORA,
  ...p,
})

const valido = (p: Partial<FormularioSolicitud> = {}): FormularioSolicitud => ({
  ...formularioInicial(REGLAS),
  fechaRetiro: "2026-11-11",
  horaRetiro: "10:00",
  fechaDevolucion: "2026-11-13",
  horaDevolucion: "15:00",
  asignatura: "7",
  aceptaNormativa: true,
  ...p,
})

const pdf = (bytes = 100, nombre = "resolucion.pdf", tipo = "application/pdf") =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo })

describe("fechas en la hora del laboratorio", () => {
  it("interpreta fecha y hora en UTC-3, esté donde esté el navegador", () => {
    expect(instanteLab("2026-11-11", "10:00").toISOString()).toBe("2026-11-11T13:00:00.000Z")
  })

  it("hoy es la fecha del laboratorio, no la UTC", () => {
    // 01:30 UTC del 12/11 son las 22:30 del 11/11 en Ushuaia.
    expect(fechaHoyLab(new Date("2026-11-12T01:30:00Z"))).toBe("2026-11-11")
  })

  it("las horas van de la apertura al cierre, ambas incluidas", () => {
    const horas = opcionesDeHora("09:00", "16:00")
    expect(horas[0]).toBe("09:00")
    expect(horas.at(-1)).toBe("16:00")
    expect(horas).toContain("12:30")
  })

  it("el cierre se incluye aunque no caiga en el paso", () => {
    expect(opcionesDeHora("09:00", "10:15").at(-1)).toBe("10:15")
  })

  it("los días corridos cuentan el de retiro y el de devolución", () => {
    expect(diasCorridos("2026-11-11", "2026-11-11")).toBe(1)
    expect(diasCorridos("2026-11-11", "2026-11-14")).toBe(4)
  })
})

describe("plazo por equipo", () => {
  it("un equipo común usa el parámetro general", () => {
    expect(limiteDias(item(), REGLAS)).toBe(4)
  })

  it("una notebook usa su parámetro", () => {
    expect(limiteDias(item({ esNotebook: true }), REGLAS)).toBe(15)
  })

  it("si el ítem tiene un máximo menor, gana ese", () => {
    expect(limiteDias(item({ maxDias: 2 }), REGLAS)).toBe(2)
  })
})

describe("validarSolicitud", () => {
  it("un formulario completo no tiene errores", () => {
    expect(validarSolicitud(valido(), ctx())).toEqual({})
  })

  it("exige las dos fechas", () => {
    const errores = validarSolicitud(valido({ fechaRetiro: "", fechaDevolucion: "" }), ctx())
    expect(errores.fechaRetiro).toBeTruthy()
    expect(errores.fechaDevolucion).toBeTruthy()
  })

  it("la devolución tiene que ser posterior al retiro", () => {
    const errores = validarSolicitud(valido({ fechaDevolucion: "2026-11-11", horaDevolucion: "09:00" }), ctx())
    expect(errores.fechaDevolucion).toMatch(/posterior/)
  })

  it("exige la anticipación mínima", () => {
    const errores = validarSolicitud(valido({ fechaRetiro: "2026-11-10", horaRetiro: "11:00" }), ctx())
    expect(errores.fechaRetiro).toMatch(/24 horas/)
  })

  it("la anticipación justa alcanza", () => {
    expect(validarSolicitud(valido({ fechaRetiro: "2026-11-10", horaRetiro: "12:00" }), ctx())).toEqual({})
  })

  it("rechaza horas fuera de la franja", () => {
    const errores = validarSolicitud(valido({ horaRetiro: "08:30", horaDevolucion: "16:30" }), ctx())
    expect(errores.horaRetiro).toMatch(/09:00/)
    expect(errores.horaDevolucion).toMatch(/16:00/)
  })

  it("nombra el equipo que excede su plazo", () => {
    const errores = validarSolicitud(
      valido({ fechaDevolucion: "2026-11-15" }),
      ctx({ items: [item({ esNotebook: true, nombre: "Notebook" }), item({ nombre: "Trípode" })] }),
    )
    expect(errores.fechaDevolucion).toBe("«Trípode» se presta hasta 4 días; elegiste 5.")
  })

  it("el estudiante indica una asignatura numérica", () => {
    expect(validarSolicitud(valido({ asignatura: "" }), ctx()).asignatura).toBeTruthy()
    expect(validarSolicitud(valido({ asignatura: "abc" }), ctx()).asignatura).toBeTruthy()
    expect(validarSolicitud(valido({ asignatura: "0" }), ctx()).asignatura).toBeTruthy()
  })

  it("el docente no necesita asignatura", () => {
    expect(validarSolicitud(valido({ asignatura: "" }), ctx({ requiereAsignatura: false }))).toEqual({})
  })

  it("exige aceptar la normativa", () => {
    expect(validarSolicitud(valido({ aceptaNormativa: false }), ctx()).aceptaNormativa).toBeTruthy()
  })

  it("con alta gama exige un PDF de hasta 10 MB", () => {
    const conAval = ctx({ requiereAval: true })
    expect(validarSolicitud(valido(), conAval).aval).toMatch(/aval/)
    expect(validarSolicitud(valido({ aval: pdf(10, "foto.jpg", "image/jpeg") }), conAval).aval).toMatch(/PDF/)
    expect(validarSolicitud(valido({ aval: pdf(11 * 1024 * 1024) }), conAval).aval).toMatch(/10 MB/)
    expect(validarSolicitud(valido({ aval: pdf() }), conAval)).toEqual({})
  })
})

describe("aSolicitudNueva", () => {
  it("arma la solicitud con las fechas del laboratorio", () => {
    const solicitud = aSolicitudNueva(valido(), [12, 12], { requiereAsignatura: true }, "uuid-aval")
    expect(solicitud).toEqual({
      asignaturaId: 7,
      retiro: instanteLab("2026-11-11", "10:00"),
      devolucion: instanteLab("2026-11-13", "15:00"),
      equipamientoIds: [12, 12],
      aceptaNormativa: true,
      pdfAvalId: "uuid-aval",
    })
  })

  it("el docente no manda asignatura", () => {
    expect(aSolicitudNueva(valido(), [12], { requiereAsignatura: false }).asignaturaId).toBeNull()
  })
})

describe("mensajeDeErrorSolicitud", () => {
  const items = [item({ equipamientoId: 12, nombre: "Cámara Sony" })]
  const error = (code: string, extra = {}) => new ApiError(409, "detalle del backend", code, {}, extra)

  it("sin unidades libres nombra el equipo", () => {
    const msg = mensajeDeErrorSolicitud(error("EQUIPAMIENTO_NO_DISPONIBLE", { equipamiento_id: 12, libres: 0 }), items)
    expect(msg).toMatch(/«Cámara Sony» no tiene unidades libres/)
  })

  it("con menos unidades que las pedidas dice cuántas hay", () => {
    const msg = mensajeDeErrorSolicitud(error("EQUIPAMIENTO_NO_DISPONIBLE", { equipamiento_id: 12, libres: 1 }), items)
    expect(msg).toMatch(/solo 1 unidad libre/)
  })

  it("un plazo excedido trae el máximo", () => {
    const msg = mensajeDeErrorSolicitud(error("LIMITE_DIAS_EXCEDIDO", { equipamiento_id: 12, max_dias: 4 }), items)
    expect(msg).toBe("«Cámara Sony» se presta hasta 4 días.")
  })

  it("si no hay mensaje propio, usa el del backend", () => {
    expect(mensajeDeErrorSolicitud(error("FRANJA_FUERA_DE_HORARIO"), items)).toBe("detalle del backend")
  })

  it("un error de red no es un ApiError", () => {
    expect(mensajeDeErrorSolicitud(new TypeError("fetch failed"), items)).toMatch(/conexión/)
  })
})
