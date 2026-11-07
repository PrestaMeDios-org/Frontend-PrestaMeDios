import { describe, expect, it } from "vitest"
import { estadoEquipo } from "./estado"

const e = (quantity: number, available_count: number, maintenance = false) => ({
  quantity,
  available_count,
  maintenance,
})

describe("estadoEquipo (DT-27, RN-I5)", () => {
  it("sin unidades activas es 'no disponible', no 'ocupado'", () => {
    expect(estadoEquipo(e(0, 0))).toBe("no_disponible")
  })

  it("sin unidades activas manda aunque el flag de mantenimiento venga encendido", () => {
    expect(estadoEquipo(e(0, 0, true))).toBe("no_disponible")
  })

  it("con unidades disponibles es 'disponible'", () => {
    expect(estadoEquipo(e(3, 1))).toBe("disponible")
  })

  it("con unidades pero ninguna disponible es 'ocupado'", () => {
    expect(estadoEquipo(e(2, 0))).toBe("ocupado")
  })

  it("todas las activas en mantenimiento es 'mantenimiento'", () => {
    expect(estadoEquipo(e(2, 0, true))).toBe("mantenimiento")
  })
})
