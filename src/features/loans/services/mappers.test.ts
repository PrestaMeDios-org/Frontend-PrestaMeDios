import { describe, expect, it } from "vitest"
import type { DetallePrestamoDTO, OrdenPedidoDTO } from "../types"
import {
  toAprobarDTO,
  toLineaUnidadesLibres,
  toOrden,
  toOrdenCreateDTO,
  toReglas,
  toResolucionDTO,
} from "./mappers"

const linea = (p: Partial<DetallePrestamoDTO> = {}): DetallePrestamoDTO => ({
  id: 31,
  equipamiento_id: 12,
  unidad_fisica_id: null,
  estado: "pendiente",
  retiro_pactado: "2026-11-20T13:00:00Z",
  devolucion_pactada: "2026-11-22T18:00:00Z",
  fin_ocupacion: "2026-11-22T18:00:00Z",
  ...p,
})

const orden = (p: Partial<OrdenPedidoDTO> = {}): OrdenPedidoDTO => ({
  id: 5,
  solicitante_id: 7,
  sede: "Ushuaia",
  asignatura_id: 3,
  estado: "pendiente",
  fecha_solicitud: "2026-11-09T12:00:00Z",
  observacion_docente: null,
  motivo_resolucion: null,
  es_renovado: false,
  resuelto_en: null,
  solicitante: null,
  detalles: [linea()],
  demorado: false,
  situacion: "en_curso",
  ...p,
})

describe("toReglas", () => {
  it("acorta las horas a HH:MM y pasa los nombres a camelCase", () => {
    expect(
      toReglas({
        horario_apertura: "09:00:00",
        horario_cierre: "16:30:00",
        anticipacion_min_horas: 24,
        max_dias_general: 4,
        max_dias_notebook: 15,
        tolerancia_retiro_horas: 2,
      }),
    ).toEqual({
      horarioApertura: "09:00",
      horarioCierre: "16:30",
      anticipacionMinHoras: 24,
      maxDiasGeneral: 4,
      maxDiasNotebook: 15,
      toleranciaRetiroHoras: 2,
    })
  })
})

describe("toOrden", () => {
  it("toma el aval si viene y lo deja en null si no", () => {
    expect(toOrden(orden({ aval_archivo_id: "uuid-aval" })).avalArchivoId).toBe("uuid-aval")
    expect(toOrden(orden()).avalArchivoId).toBeNull()
  })

  it("convierte fechas y líneas, sin solicitante para el dueño", () => {
    const o = toOrden(orden())
    expect(o.solicitante).toBeNull()
    expect(o.fechaSolicitud).toEqual(new Date("2026-11-09T12:00:00Z"))
    expect(o.resueltoEn).toBeNull()
    expect(o.lineas).toEqual([
      {
        id: 31,
        equipamientoId: 12,
        unidadId: null,
        estado: "pendiente",
        retiro: new Date("2026-11-20T13:00:00Z"),
        devolucion: new Date("2026-11-22T18:00:00Z"),
        finOcupacion: new Date("2026-11-22T18:00:00Z"),
      },
    ])
  })

  it("arma el nombre completo del solicitante para los administradores", () => {
    const o = toOrden(
      orden({ solicitante: { id: 7, nombre: "Ana", apellido: "Pérez" } }),
    )
    expect(o.solicitante).toEqual({
      id: 7,
      nombre: "Ana",
      apellido: "Pérez",
      nombreCompleto: "Ana Pérez",
    })
  })

  it("toma el retiro más temprano y la devolución más tardía de las líneas", () => {
    const o = toOrden(
      orden({
        detalles: [
          linea({
            id: 1,
            retiro_pactado: "2026-11-21T13:00:00Z",
            devolucion_pactada: "2026-11-22T18:00:00Z",
          }),
          linea({
            id: 2,
            retiro_pactado: "2026-11-20T13:00:00Z",
            devolucion_pactada: "2026-11-23T18:00:00Z",
          }),
        ],
      }),
    )
    expect(o.retiro).toEqual(new Date("2026-11-20T13:00:00Z"))
    expect(o.devolucion).toEqual(new Date("2026-11-23T18:00:00Z"))
  })

  it("sin líneas, retiro y devolución quedan en null", () => {
    const o = toOrden(orden({ detalles: [] }))
    expect(o.retiro).toBeNull()
    expect(o.devolucion).toBeNull()
  })

  it("conserva estado, situación, demora y resolución", () => {
    const o = toOrden(
      orden({
        estado: "rechazada",
        situacion: "finalizada",
        demorado: true,
        motivo_resolucion: "Sin stock",
        resuelto_en: "2026-11-10T12:00:00Z",
      }),
    )
    expect(o).toMatchObject({
      estado: "rechazada",
      situacion: "finalizada",
      demorado: true,
      motivoResolucion: "Sin stock",
      resueltoEn: new Date("2026-11-10T12:00:00Z"),
    })
  })
})

describe("toLineaUnidadesLibres", () => {
  it("renombra los campos", () => {
    expect(
      toLineaUnidadesLibres({
        detalle_id: 31,
        equipamiento_id: 12,
        unidades: [101, 104],
      }),
    ).toEqual({
      lineaId: 31,
      equipamientoId: 12,
      unidadIds: [101, 104],
    })
  })
})

describe("toOrdenCreateDTO", () => {
  const base = {
    retiro: new Date("2026-11-20T13:00:00Z"),
    devolucion: new Date("2026-11-22T18:00:00Z"),
    equipamientoIds: [12, 12, 15],
    aceptaNormativa: true,
  }

  it("una línea por unidad pedida y fechas en ISO", () => {
    expect(toOrdenCreateDTO({ ...base, asignaturaId: 3 })).toEqual({
      asignatura_id: 3,
      retiro: "2026-11-20T13:00:00.000Z",
      devolucion: "2026-11-22T18:00:00.000Z",
      items: [
        { equipamiento_id: 12 },
        { equipamiento_id: 12 },
        { equipamiento_id: 15 },
      ],
      acepta_normativa: true,
    })
  })

  it("omite asignatura y aval cuando no hay", () => {
    const dto = toOrdenCreateDTO({
      ...base,
      asignaturaId: null,
      pdfAvalId: null,
    })
    expect(dto).not.toHaveProperty("asignatura_id")
    expect(dto).not.toHaveProperty("pdf_aval_id")
  })

  it("incluye el aval de alta gama", () => {
    expect(
      toOrdenCreateDTO({
        ...base,
        pdfAvalId: "3f2b6c1e-8a4d-4f7e-9b1a-2c5d7e9f0a1b",
      }).pdf_aval_id,
    ).toBe("3f2b6c1e-8a4d-4f7e-9b1a-2c5d7e9f0a1b")
  })

  it("no arma el pedido sin aceptar la normativa", () => {
    expect(() => toOrdenCreateDTO({ ...base, aceptaNormativa: false })).toThrow(
      /normativa/,
    )
  })
})

describe("payloads de cambio de estado", () => {
  it("aprobar sin ajuste manda solo las asignaciones", () => {
    expect(toAprobarDTO([{ lineaId: 31, unidadId: 101 }])).toEqual({
      estado: "aprobada",
      asignaciones: [{ detalle_id: 31, unidad_fisica_id: 101 }],
    })
  })

  it("aprobar con ajuste manda retiro y devolución juntos", () => {
    const dto = toAprobarDTO([{ lineaId: 31, unidadId: 101 }], {
      retiro: new Date("2026-11-21T13:00:00Z"),
      devolucion: new Date("2026-11-23T18:00:00Z"),
    })
    expect(dto.nuevo_retiro).toBe("2026-11-21T13:00:00.000Z")
    expect(dto.nueva_devolucion).toBe("2026-11-23T18:00:00.000Z")
  })

  it("rechazar recorta el motivo", () => {
    expect(toResolucionDTO("rechazada", "  Sin stock  ")).toEqual({
      estado: "rechazada",
      motivo: "Sin stock",
    })
  })

  it("cancelar sin motivo (o en blanco) no lo manda", () => {
    expect(toResolucionDTO("cancelada")).toEqual({ estado: "cancelada" })
    expect(toResolucionDTO("cancelada", "   ")).toEqual({ estado: "cancelada" })
  })
})
