import { describe, expect, it } from "vitest"
import { infoDiaRetiro, libresDelPedido, ultimaDevolucion, type DisponibilidadModelo } from "./calendarioPedido"

const modelo = (dias: Record<string, number>, cantidad = 1): DisponibilidadModelo => ({
  libres: new Map(Object.entries(dias)),
  cantidad,
})

describe("calendario de Solicitar equipos (SPEC-10 §4.6)", () => {
  it("toma el modelo más justo considerando la cantidad pedida", () => {
    const canon = modelo({ "2026-11-20": 5 }, 2)
    const sony = modelo({ "2026-11-20": 2 }, 2)
    expect(libresDelPedido([canon, sony], "2026-11-20")).toEqual({ libres: 2, alcanza: true })
    expect(libresDelPedido([canon, modelo({ "2026-11-20": 1 }, 2)], "2026-11-20")).toEqual({ libres: 1, alcanza: false })
  })

  it("sin dato de algún modelo no inventa disponibilidad", () => {
    expect(libresDelPedido([modelo({ "2026-11-20": 3 }), modelo({})], "2026-11-20")).toBeUndefined()
    expect(infoDiaRetiro([modelo({})], true, "2026-11-20")).toEqual({ estado: "cargando" })
    expect(infoDiaRetiro([modelo({})], false, "2026-11-20")).toEqual({ estado: "neutro" })
  })

  it("marca libre o sin según alcance el pedido", () => {
    expect(infoDiaRetiro([modelo({ "2026-11-20": 4 })], false, "2026-11-20")).toMatchObject({ estado: "libre", texto: "4 libres" })
    expect(infoDiaRetiro([modelo({ "2026-11-20": 0 })], false, "2026-11-20")).toMatchObject({ estado: "sin" })
  })

  it("la devolución llega hasta el plazo, contando el día de retiro (PRE-07)", () => {
    const m = modelo({ "2026-11-20": 3, "2026-11-21": 3, "2026-11-22": 3, "2026-11-23": 3, "2026-11-24": 3 })
    expect(ultimaDevolucion([m], "2026-11-20", 4)).toBe("2026-11-23")
    expect(ultimaDevolucion([m], "2026-11-20", 1)).toBe("2026-11-20")
  })

  it("la devolución se corta antes del primer día sin unidades", () => {
    const m = modelo({ "2026-11-20": 3, "2026-11-21": 3, "2026-11-22": 0, "2026-11-23": 3 })
    expect(ultimaDevolucion([m], "2026-11-20", 4)).toBe("2026-11-21")
  })
})
