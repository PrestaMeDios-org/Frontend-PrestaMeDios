import { afterEach, describe, expect, it, vi } from "vitest"
import { tokenStore } from "../../../lib/api"
import { correoValido, esCorreoContacto, obtenerDatosSedes } from "./configApi"

const responder = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  )

afterEach(() => {
  vi.restoreAllMocks()
  tokenStore.clear()
})

describe("obtenerDatosSedes (SPEC-09 §4.5, AC-122)", () => {
  it("pide /config/sedes con el token y mapea horario y correo", async () => {
    tokenStore.set("tok")
    const fetchMock = responder([
      { sede: "Ushuaia", horario_apertura: "09:00:00", horario_cierre: "20:00:00", correo_contacto: null },
      {
        sede: "Río Grande",
        horario_apertura: "10:00:00",
        horario_cierre: "17:00:00",
        correo_contacto: "lab.rg@example.com",
      },
    ])

    const sedes = await obtenerDatosSedes()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/api\/v1\/config\/sedes$/)
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok")
    expect(sedes).toEqual([
      { sede: "Ushuaia", apertura: "09:00", cierre: "20:00", correoContacto: null },
      { sede: "Río Grande", apertura: "10:00", cierre: "17:00", correoContacto: "lab.rg@example.com" },
    ])
  })
})

describe("correo de contacto (RN-80)", () => {
  it("reconoce sólo las claves contacto.<sede>.email", () => {
    expect(esCorreoContacto("contacto.ushuaia.email")).toBe(true)
    expect(esCorreoContacto("contacto.rio_grande.email")).toBe(true)
    expect(esCorreoContacto("horario.ushuaia.apertura")).toBe(false)
    expect(esCorreoContacto("contacto.email")).toBe(false)
  })

  it("valida el formato en línea", () => {
    expect(correoValido(" lab.rg@example.com ")).toBe(true)
    expect(correoValido("no-es-un-correo")).toBe(false)
    expect(correoValido("a@b")).toBe(false)
    expect(correoValido("")).toBe(false)
    expect(correoValido(`${"x".repeat(250)}@example.com`)).toBe(false)
  })
})
