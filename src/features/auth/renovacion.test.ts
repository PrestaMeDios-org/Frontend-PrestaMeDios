import { describe, expect, it, vi } from "vitest"
import {
  crearRegistroActividad,
  debeRenovar,
  leerTiemposToken,
  MARGEN_RENOVACION_MS,
  VENTANA_ACTIVIDAD_MS,
  vencido,
} from "./renovacion"

const MIN = 60_000

function jwt(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.firma`
}

describe("leerTiemposToken", () => {
  it("lee iat y exp en milisegundos", () => {
    const token = jwt({ sub: "1", iat: 1_700_000_000, exp: 1_700_001_800, nombre: "Lucía ñ" })
    expect(leerTiemposToken(token)).toEqual({ emitido: 1_700_000_000_000, vence: 1_700_001_800_000 })
  })

  it("devuelve null si el token no tiene la forma esperada", () => {
    expect(leerTiemposToken("")).toBeNull()
    expect(leerTiemposToken("a.b")).toBeNull()
    expect(leerTiemposToken("a.%%%.c")).toBeNull()
    expect(leerTiemposToken(jwt({ iat: 10 }))).toBeNull()
    expect(leerTiemposToken(jwt({ iat: "10", exp: 20 }))).toBeNull()
    expect(leerTiemposToken(jwt({ iat: 20, exp: 10 }))).toBeNull()
  })
})

describe("debeRenovar", () => {
  const ahora = 10_000 * MIN
  const token30 = { emitido: ahora - 26 * MIN, vence: ahora + 4 * MIN } // token de 30 min

  it("renueva si falta poco y hubo actividad reciente", () => {
    expect(debeRenovar(token30, ahora - 1 * MIN, ahora)).toBe(true)
    expect(debeRenovar(token30, ahora - VENTANA_ACTIVIDAD_MS, ahora)).toBe(true)
  })

  it("no renueva sin actividad reciente (RN-70)", () => {
    expect(debeRenovar(token30, ahora - VENTANA_ACTIVIDAD_MS - 1, ahora)).toBe(false)
  })

  it("no renueva si todavía falta más que el margen", () => {
    const lejos = { emitido: ahora - 10 * MIN, vence: ahora + 20 * MIN }
    expect(debeRenovar(lejos, ahora, ahora)).toBe(false)
    const enElBorde = { emitido: ahora - 25 * MIN, vence: ahora + MARGEN_RENOVACION_MS }
    expect(debeRenovar(enElBorde, ahora, ahora)).toBe(true)
  })

  it("no renueva un token vencido", () => {
    const viejo = { emitido: ahora - 31 * MIN, vence: ahora - 1 }
    expect(debeRenovar(viejo, ahora, ahora)).toBe(false)
    expect(debeRenovar({ ...viejo, vence: ahora }, ahora, ahora)).toBe(false)
  })

  it("con un token corto el margen es la mitad de su vida y la ventana, su vida", () => {
    const token2 = { emitido: ahora - 30_000, vence: ahora + 90_000 } // 2 min
    expect(debeRenovar(token2, ahora, ahora)).toBe(false)
    const despues = ahora + 30_000
    expect(debeRenovar(token2, despues, despues)).toBe(true)
    expect(debeRenovar(token2, despues - 2 * MIN, despues)).toBe(true)
    expect(debeRenovar(token2, despues - 2 * MIN - 1, despues)).toBe(false)
  })
})

describe("vencido", () => {
  it("compara con el vencimiento", () => {
    const token = { emitido: 0, vence: 1000 }
    expect(vencido(token, 999)).toBe(false)
    expect(vencido(token, 1000)).toBe(true)
  })
})

describe("crearRegistroActividad", () => {
  it("empieza con actividad y la actualiza con los eventos", () => {
    let t = 100
    const registro = crearRegistroActividad(() => t)
    expect(registro.ultima()).toBe(100)

    const destino = new EventTarget()
    const dejar = registro.escuchar(destino)
    t = 200
    destino.dispatchEvent(new Event("keydown"))
    expect(registro.ultima()).toBe(200)
    t = 300
    destino.dispatchEvent(new Event("pointerdown"))
    expect(registro.ultima()).toBe(300)
    t = 400
    destino.dispatchEvent(new Event("hashchange"))
    expect(registro.ultima()).toBe(400)

    dejar()
    t = 500
    destino.dispatchEvent(new Event("keydown"))
    expect(registro.ultima()).toBe(400)
  })

  it("registrar() a mano", () => {
    const reloj = vi.fn().mockReturnValueOnce(1).mockReturnValueOnce(7)
    const registro = crearRegistroActividad(reloj)
    registro.registrar()
    expect(registro.ultima()).toBe(7)
  })
})
