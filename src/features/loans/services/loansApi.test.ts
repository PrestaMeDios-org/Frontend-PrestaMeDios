import { afterEach, describe, expect, it, vi } from "vitest"
import { tokenStore } from "../../../lib/api"
import type { OrdenPedidoDTO } from "../types"
import {
  aprobarOrden,
  construirQuery,
  listarBandeja,
  listarMisOrdenes,
  rechazarOrden,
  subirAval,
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
})

describe("administración", () => {
  it("listarBandeja sin filtros no manda query", async () => {
    const fetchMock = responder([])
    await listarBandeja()
    expect(llamada(fetchMock).url).toMatch(/\/api\/v1\/loans\/ordenes$/)
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
})

describe("subirAval", () => {
  it("sube el PDF a files como AVAL_PRESTAMO y devuelve su id", async () => {
    tokenStore.set("token-de-prueba")
    const fetchMock = responder({ id: "3f2b6c1e-8a4d-4f7e-9b1a-2c5d7e9f0a1b" }, 201)
    const archivo = new File(["%PDF-1.4"], "resolucion.pdf", { type: "application/pdf" })

    const id = await subirAval(archivo)

    expect(id).toBe("3f2b6c1e-8a4d-4f7e-9b1a-2c5d7e9f0a1b")
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/api\/v1\/files\/archivos$/)
    expect(init.method).toBe("POST")
    const form = init.body as FormData
    expect(form.get("proposito")).toBe("AVAL_PRESTAMO")
    expect((form.get("archivo") as File).name).toBe("resolucion.pdf")
  })
})
