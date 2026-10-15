import { afterEach, describe, expect, it, vi } from "vitest"
import { tokenStore } from "../../../lib/api"
import { createEspacio } from "./spacesApi"

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
