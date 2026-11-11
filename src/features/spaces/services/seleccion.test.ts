import { describe, expect, it } from "vitest"
import { agruparCorridas, sumarHora } from "./seleccion"

describe("sumarHora", () => {
  it("suma una hora y conserva los minutos", () => {
    expect(sumarHora("09:00")).toBe("10:00")
    expect(sumarHora("15:30")).toBe("16:30")
  })
})

describe("agruparCorridas", () => {
  // AC-S17, EC-S14
  it("agrupa horarios contiguos en una sola reserva", () => {
    expect(agruparCorridas(["10:00", "11:00"])).toEqual([
      { inicio: "10:00", fin: "12:00", turnos: ["10:00", "11:00"] },
    ])
  })

  it("separa los tramos que no son contiguos", () => {
    expect(agruparCorridas(["10:00", "12:00"])).toEqual([
      { inicio: "10:00", fin: "11:00", turnos: ["10:00"] },
      { inicio: "12:00", fin: "13:00", turnos: ["12:00"] },
    ])
  })

  it("no depende del orden de selección ni de repetidos", () => {
    expect(agruparCorridas(["14:00", "09:00", "10:00", "13:00", "10:00"])).toEqual([
      { inicio: "09:00", fin: "11:00", turnos: ["09:00", "10:00"] },
      { inicio: "13:00", fin: "15:00", turnos: ["13:00", "14:00"] },
    ])
  })

  it("sin horarios no hay reservas", () => {
    expect(agruparCorridas([])).toEqual([])
  })
})
