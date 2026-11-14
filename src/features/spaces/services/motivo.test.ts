import { describe, expect, it } from "vitest"
import { armarMotivo, maxDescripcion, MOTIVO_MAX } from "./motivo"

describe("motivo de la reserva (SPEC-10 V-13)", () => {
  it("une materia y descripción", () => {
    expect(armarMotivo("Taller", "Rodaje")).toBe("Taller — Rodaje")
    expect(armarMotivo("  Taller ", "")).toBe("Taller")
    expect(armarMotivo("", "Rodaje")).toBe("Rodaje")
  })

  it("vacío no se manda", () => {
    expect(armarMotivo(" ", "  ")).toBeUndefined()
  })

  it("respeta el máximo de 500 de la API", () => {
    expect(armarMotivo("Taller", "x".repeat(600))).toHaveLength(MOTIVO_MAX)
    expect(maxDescripcion("Taller")).toBe(MOTIVO_MAX - "Taller — ".length)
    expect(maxDescripcion("")).toBe(MOTIVO_MAX)
  })
})
