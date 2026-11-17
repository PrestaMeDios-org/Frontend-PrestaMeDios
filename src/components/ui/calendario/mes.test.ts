import { describe, expect, it } from "vitest"
import { celdasDelMes, diasInclusive, esFinDeSemana, formatoCorto, mesTieneDias, sumarDias } from "./mes"
import { horasEntre } from "../SelectorHora"

describe("calendario común (SPEC-10 §4.6)", () => {
  it("arma el mes con lunes primero", () => {
    // noviembre de 2026 empieza en domingo: 6 huecos antes del 1
    const celdas = celdasDelMes(new Date(2026, 10, 1))
    expect(celdas.slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(celdas[6]).toBe("2026-11-01")
    expect(celdas.at(-1)).toBe("2026-11-30")
  })

  it("cuenta días incluyendo los dos extremos y suma días cruzando meses", () => {
    expect(diasInclusive("2026-11-16", "2026-11-19")).toBe(4)
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01")
  })

  it("detecta fines de semana y formatea dd/mm/aaaa", () => {
    expect(esFinDeSemana("2026-11-14")).toBe(true)
    expect(esFinDeSemana("2026-11-16")).toBe(false)
    expect(formatoCorto("2026-11-20")).toBe("20/11/2026")
  })

  it("habilita ‹ › sólo si el mes tiene días dentro de [min, max]", () => {
    expect(mesTieneDias(new Date(2026, 9, 1), "2026-11-12")).toBe(false)
    expect(mesTieneDias(new Date(2026, 10, 1), "2026-11-12", "2027-01-12")).toBe(true)
    expect(mesTieneDias(new Date(2027, 1, 1), undefined, "2027-01-12")).toBe(false)
  })

  it("lista horas cada 30 minutos", () => {
    expect(horasEntre("09:00", "10:30")).toEqual(["09:00", "09:30", "10:00", "10:30"])
    expect(horasEntre()).toHaveLength(48)
  })
})
