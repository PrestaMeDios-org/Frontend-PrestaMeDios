import { afterEach, describe, expect, it, vi } from "vitest"
import { tokenStore } from "../../../lib/api"
import { createEspacio, revertirBloqueo } from "./spacesApi"

afterEach(() => {
  vi.restoreAllMocks()
  tokenStore.clear()
})

describe("createEspacio", () => {
  it("sends the local-admin payload without a sede and maps the response", async () => {
    tokenStore.set("session-token")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id_espacio: 18, nombre: "Sala", sede: "Ushuaia" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await expect(createEspacio({ nombre: "Sala", tipo: "Edición" })).resolves.toEqual({
      id: 18,
      nombre: "Sala",
      tipo: undefined,
      sede: "Ushuaia",
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/spaces/espacios"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nombre: "Sala", tipo: "Edición" }),
      }),
    )
  })

  it("sends the sede selected by a superadmin", async () => {
    tokenStore.set("session-token")
    const payload = { nombre: "Taller", sede: "Río Grande" as const }
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id_espacio: 23, nombre: "Taller", sede: "Río Grande" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await createEspacio(payload)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/spaces/espacios"),
      expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
    )
  })
})

const fila = (id: number, extra: Record<string, unknown> = {}) => ({
  id_bloqueo: id,
  id_espacio: id * 10,
  fecha_inicio: "2026-11-20",
  fecha_fin: "2026-11-20",
  motivo: "Cierre",
  estado: "Revertido",
  ...extra,
})

describe("revertirBloqueo", () => {
  // SPEC-08 AC-S16: PATCH, no DELETE; el bloqueo no se borra.
  it("pide la reversión con PATCH y devuelve una lista con el bloqueo", async () => {
    tokenStore.set("session-token")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(fila(4)), { status: 200, headers: { "Content-Type": "application/json" } }),
    )

    const revertidos = await revertirBloqueo(4)

    expect(revertidos).toHaveLength(1)
    expect(revertidos[0]).toMatchObject({ id: 4, estado: "Revertido", idGrupo: null })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/spaces/bloqueos/4/estado"),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ nuevo_estado: "Revertido" }) }),
    )
  })

  // SPEC-08 EC-S12: un bloqueo general vuelve con todas sus filas.
  it("devuelve todas las filas cuando era un bloqueo general", async () => {
    tokenStore.set("session-token")
    const grupo = "5f0c6a4e-2b1d-4c8a-9f3e-7d2a1b0c9e8f"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([fila(1, { id_grupo: grupo }), fila(2, { id_grupo: grupo })]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const revertidos = await revertirBloqueo(2)

    expect(revertidos.map((b) => b.id)).toEqual([1, 2])
    expect(new Set(revertidos.map((b) => b.idGrupo))).toEqual(new Set([grupo]))
  })
})
