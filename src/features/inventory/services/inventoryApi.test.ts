import { afterEach, describe, expect, it, vi } from "vitest"
import { construirQuery, darDeBajaUnidad, listarEquipamiento, ponerEnMantenimiento, rehabilitarUnidad } from "./inventoryApi"

describe("construirQuery", () => {
  it("omite filtros vacíos o en false", () => {
    expect(construirQuery({})).toBe("")
    expect(construirQuery({ q: "", categoria: undefined, incluir_inactivos: false })).toBe("")
  })

  it("serializa los filtros presentes", () => {
    const q = new URLSearchParams(
      construirQuery({ sede: "Río Grande", categoria: "cameras", q: "100%", incluir_inactivos: true }),
    )
    expect(q.get("sede")).toBe("Río Grande")
    expect(q.get("categoria")).toBe("cameras")
    expect(q.get("q")).toBe("100%")
    expect(q.get("incluir_inactivos")).toBe("true")
  })
})

describe("llamadas a la API", () => {
  afterEach(() => vi.unstubAllGlobals())

  const simular = () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    return fetchMock
  }
  const ultima = (m: ReturnType<typeof simular>) => {
    const [url, init] = m.mock.calls[m.mock.calls.length - 1] as unknown as [string, RequestInit]
    return { url, init }
  }

  it("lista el catálogo con los filtros, y sin filtros no agrega signo de pregunta", async () => {
    const m = simular()
    await listarEquipamiento({ q: "sony", categoria: "cameras" })
    expect(ultima(m).url).toMatch(/\/api\/v1\/inventory\/equipamiento\?q=sony&categoria=cameras$/)
    await listarEquipamiento()
    expect(ultima(m).url).toMatch(/\/api\/v1\/inventory\/equipamiento$/)
  })

  it("mantenimiento, baja y rehabilitación envían PATCH con el estado correcto; nunca 'prestado'", async () => {
    const m = simular()
    await ponerEnMantenimiento(4)
    expect(ultima(m).init.method).toBe("PATCH")
    expect(ultima(m).url).toContain("/unidades/4/estado")
    expect(JSON.parse(ultima(m).init.body as string)).toEqual({ estado: "mantenimiento" })
    await darDeBajaUnidad(4)
    expect(JSON.parse(ultima(m).init.body as string)).toEqual({ estado: "baja" })
    await rehabilitarUnidad(4)
    expect(JSON.parse(ultima(m).init.body as string)).toEqual({ estado: "disponible" })
  })
})
