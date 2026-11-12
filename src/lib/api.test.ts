import { afterEach, describe, expect, it, vi } from "vitest"
import {
  ApiError,
  apiRequest,
  descargarArchivo,
  esSesionInvalida,
  onSessionExpired,
  parseError,
  tokenStore,
} from "./api"

const respuesta = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status })

afterEach(() => {
  vi.restoreAllMocks()
  tokenStore.clear()
})

describe("parseError", () => {
  it("lee errores de negocio con code y datos extra", async () => {
    const e = await parseError(
      respuesta(403, { detail: "Tu cuenta está suspendida.", code: "CUENTA_SUSPENDIDA", suspendido_hasta: null }),
    )
    expect(e).toBeInstanceOf(ApiError)
    expect([e.status, e.code, e.message]).toEqual([403, "CUENTA_SUSPENDIDA", "Tu cuenta está suspendida."])
    expect(e.extra).toEqual({ suspendido_hasta: null })
  })

  it("mapea los 422 de FastAPI por campo y limpia el prefijo de Pydantic", async () => {
    const e = await parseError(
      respuesta(422, {
        detail: [
          { loc: ["body", "dni"], msg: "String should match pattern" },
          { loc: ["body"], msg: "Value error, La contraseña debe contener al menos una letra y un número." },
        ],
      }),
    )
    expect(e.code).toBe("VALIDACION")
    expect(e.campos).toEqual({ dni: "String should match pattern" })
    expect(e.message).toBe("La contraseña debe contener al menos una letra y un número.")
  })

  it("tolera respuestas que no son JSON", async () => {
    const e = await parseError(new Response("Bad Gateway", { status: 502 }))
    expect([e.status, e.message]).toEqual([502, "Bad Gateway"])
  })
})

describe("esSesionInvalida", () => {
  it("distingue una sesión inválida de un login fallido", () => {
    expect(esSesionInvalida(new ApiError(401, "x", "TOKEN_EXPIRADO"), true)).toBe(true)
    expect(esSesionInvalida(new ApiError(401, "x", "TOKEN_REVOCADO"), true)).toBe(true)
    expect(esSesionInvalida(new ApiError(401, "x", "NO_AUTENTICADO"), true)).toBe(true)
    expect(esSesionInvalida(new ApiError(401, "x", "NO_AUTENTICADO"), false)).toBe(false)
    expect(esSesionInvalida(new ApiError(401, "x", "CREDENCIALES_INVALIDAS"), false)).toBe(false)
    expect(esSesionInvalida(new ApiError(403, "x", "PASSWORD_ACTUAL_INCORRECTA"), true)).toBe(false)
  })
})

describe("apiRequest", () => {
  it("envía el token y el cuerpo JSON", async () => {
    tokenStore.set("abc")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta(200, { ok: true }))
    await expect(apiRequest("/api/v1/x", { method: "POST", json: { a: 1 } })).resolves.toEqual({ ok: true })
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).toMatchObject({ Authorization: "Bearer abc", "Content-Type": "application/json" })
    expect(init?.body).toBe('{"a":1}')
  })

  it("no envía el token cuando auth es false", async () => {
    tokenStore.set("abc")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta(200, {}))
    await apiRequest("/login", { auth: false })
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization")
  })

  it("avisa a los suscriptores ante un token revocado", async () => {
    tokenStore.set("abc")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta(401, { detail: "x", code: "TOKEN_REVOCADO" }))
    const listener = vi.fn()
    const desuscribir = onSessionExpired(listener)
    await expect(apiRequest("/api/v1/x")).rejects.toMatchObject({ code: "TOKEN_REVOCADO" })
    expect(listener).toHaveBeenCalledOnce()
    desuscribir()
  })

  it("no avisa ante credenciales inválidas", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta(401, { detail: "x", code: "CREDENCIALES_INVALIDAS" }))
    const listener = vi.fn()
    const desuscribir = onSessionExpired(listener)
    await expect(apiRequest("/login", { auth: false })).rejects.toBeInstanceOf(ApiError)
    expect(listener).not.toHaveBeenCalled()
    desuscribir()
  })

  it("informa la falta de conexión", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"))
    await expect(apiRequest("/x")).rejects.toMatchObject({ code: "SIN_CONEXION", status: 0 })
  })
})

describe("archivos (SPEC-03 §6.6)", () => {
  it("envía FormData sin Content-Type JSON", async () => {
    tokenStore.set("abc")
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(respuesta(200, { id: "x" }))
    const form = new FormData()
    form.append("archivo", new Blob(["%PDF-1.4"], { type: "application/pdf" }), "aval.pdf")
    await apiRequest("/api/v1/files/archivos", { method: "POST", form })
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe(form)
    expect(init?.headers).toMatchObject({ Authorization: "Bearer abc" })
    expect(init?.headers).not.toHaveProperty("Content-Type")
  })

  it("descarga como Blob con el token en el header, nunca en la URL", async () => {
    tokenStore.set("abc")
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(new Blob(["jpeg"], { type: "image/jpeg" }), { status: 200 }))
    const blob = await descargarArchivo("3f2b8c1e-5d4a-4b6f-9a1e-2c7d8e9f0a1b")
    expect(blob).toBeInstanceOf(Blob)
    expect(await blob.text()).toBe("jpeg")
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/v1\/files\/archivos\/3f2b8c1e-5d4a-4b6f-9a1e-2c7d8e9f0a1b\/contenido$/)
    expect(String(url)).not.toContain("abc")
    expect(init?.headers).toMatchObject({ Authorization: "Bearer abc" })
  })

  it("una descarga denegada es un ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuesta(404, { detail: "Archivo no encontrado.", code: "ARCHIVO_NO_ENCONTRADO" }),
    )
    await expect(descargarArchivo("x")).rejects.toMatchObject({ status: 404, code: "ARCHIVO_NO_ENCONTRADO" })
  })
})
