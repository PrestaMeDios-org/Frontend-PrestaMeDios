import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, tokenStore } from "../../../lib/api"
import type { OrdenPedidoDTO } from "../types"
import {
  aprobarOrden,
  cancelarOrden,
  construirQuery,
  crearOrden,
  listarBandeja,
  listarMisOrdenes,
  obtenerOrden,
  obtenerReglas,
  obtenerUnidadesLibres,
  rechazarOrden,
} from "./loansApi"

const ordenDTO: OrdenPedidoDTO = {
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
  detalles: [],
  demorado: false,
  situacion: "en_curso",
}

const responder = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  )

const llamada = (fetchMock: ReturnType<typeof responder>) => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return {
    url,
    init,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  tokenStore.clear()
})

describe("construirQuery", () => {
  it("omite los filtros vacíos", () => {
    expect(construirQuery({})).toBe("")
    expect(
      construirQuery({ estado: undefined, sede: "", limit: 20, offset: 0 }),
    ).toBe("?limit=20&offset=0")
  })
})

describe("solicitante", () => {
  it("obtenerReglas pide /reglas con el token y mapea la respuesta", async () => {
    tokenStore.set("tok")
    const fetchMock = responder({
      horario_apertura: "09:00:00",
      horario_cierre: "16:00:00",
      anticipacion_min_horas: 24,
      max_dias_general: 4,
      max_dias_notebook: 15,
      tolerancia_retiro_horas: 2,
    })
    const reglas = await obtenerReglas()
    const { url, init } = llamada(fetchMock)
    expect(url).toMatch(/\/api\/v1\/loans\/reglas$/)
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    )
    expect(reglas.horarioApertura).toBe("09:00")
  })

  it("crearOrden hace POST /ordenes con el payload en snake_case", async () => {
    const fetchMock = responder(ordenDTO, 201)
    const orden = await crearOrden({
      asignaturaId: 3,
      retiro: new Date("2026-11-20T13:00:00Z"),
      devolucion: new Date("2026-11-22T18:00:00Z"),
      equipamientoIds: [12],
      aceptaNormativa: true,
    })
    const { url, init, body } = llamada(fetchMock)
    expect(url).toMatch(/\/api\/v1\/loans\/ordenes$/)
    expect(init.method).toBe("POST")
    expect(body).toEqual({
      asignatura_id: 3,
      retiro: "2026-11-20T13:00:00.000Z",
      devolucion: "2026-11-22T18:00:00.000Z",
      items: [{ equipamiento_id: 12 }],
      acepta_normativa: true,
    })
    expect(orden.id).toBe(5)
  })

  it("crearOrden deja los datos extra del error en ApiError.extra", async () => {
    responder(
      {
        detail: "El plazo supera el máximo",
        code: "LIMITE_DIAS_EXCEDIDO",
        equipamiento_id: 12,
        max_dias: 4,
      },
      422,
    )
    const error = await crearOrden({
      retiro: new Date("2026-11-20T13:00:00Z"),
      devolucion: new Date("2026-11-30T18:00:00Z"),
      equipamientoIds: [12],
      aceptaNormativa: true,
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: "LIMITE_DIAS_EXCEDIDO",
      extra: { equipamiento_id: 12, max_dias: 4 },
    })
  })

  it("listarMisOrdenes pasa estado y paginación por query", async () => {
    const fetchMock = responder([ordenDTO])
    const ordenes = await listarMisOrdenes({
      estado: "pendiente",
      limit: 10,
      offset: 20,
    })
    expect(llamada(fetchMock).url).toMatch(
      /\/ordenes\/mias\?estado=pendiente&limit=10&offset=20$/,
    )
    expect(ordenes).toHaveLength(1)
  })

  it("obtenerOrden pide el detalle por id", async () => {
    const fetchMock = responder(ordenDTO)
    await obtenerOrden(5)
    expect(llamada(fetchMock).url).toMatch(/\/api\/v1\/loans\/ordenes\/5$/)
  })
})

describe("administración", () => {
  it("listarBandeja sin filtros no manda query", async () => {
    const fetchMock = responder([])
    await listarBandeja()
    expect(llamada(fetchMock).url).toMatch(/\/api\/v1\/loans\/ordenes$/)
  })

  it("listarBandeja con sede (superadmin)", async () => {
    const fetchMock = responder([])
    await listarBandeja({ sede: "Río Grande" })
    expect(llamada(fetchMock).url).toMatch(/\/ordenes\?sede=R%C3%ADo\+Grande$/)
  })

  it("obtenerUnidadesLibres mapea las líneas", async () => {
    const fetchMock = responder([
      { detalle_id: 31, equipamiento_id: 12, unidades: [101] },
    ])
    const lineas = await obtenerUnidadesLibres(5)
    expect(llamada(fetchMock).url).toMatch(/\/ordenes\/5\/unidades-libres$/)
    expect(lineas).toEqual([
      { lineaId: 31, equipamientoId: 12, unidadIds: [101] },
    ])
  })

  it("aprobarOrden hace PATCH …/estado con las asignaciones", async () => {
    const fetchMock = responder({ ...ordenDTO, estado: "aprobada" })
    const orden = await aprobarOrden(5, [{ lineaId: 31, unidadId: 101 }])
    const { url, init, body } = llamada(fetchMock)
    expect(url).toMatch(/\/ordenes\/5\/estado$/)
    expect(init.method).toBe("PATCH")
    expect(body).toEqual({
      estado: "aprobada",
      asignaciones: [{ detalle_id: 31, unidad_fisica_id: 101 }],
    })
    expect(orden.estado).toBe("aprobada")
  })

  it("rechazarOrden manda el motivo", async () => {
    const fetchMock = responder({ ...ordenDTO, estado: "rechazada" })
    await rechazarOrden(5, "Sin stock")
    expect(llamada(fetchMock).body).toEqual({
      estado: "rechazada",
      motivo: "Sin stock",
    })
  })

  it("cancelarOrden del solicitante va sin motivo", async () => {
    const fetchMock = responder({ ...ordenDTO, estado: "cancelada" })
    await cancelarOrden(5)
    expect(llamada(fetchMock).body).toEqual({ estado: "cancelada" })
  })
})
