import { describe, expect, it } from "vitest"
import { armarMotivo, maxDescripcion, MOTIVO_MAX } from "./motivo"
import { separarMotivo } from "./reservasDelDia"

describe("motivo de la reserva (SPEC-10 V-13)", () => {
  it("une materia y descripción", () => {
    expect(armarMotivo("Taller", "Rodaje")).toBe("Taller — Rodaje")
    expect(armarMotivo("  Taller ", "")).toBe("Taller")
    expect(armarMotivo("", "Rodaje")).toBe("— Rodaje")
  })

  it("se lee igual que se armó (revisión del PR #28)", () => {
    const ida = (m: string, d: string) => separarMotivo(armarMotivo(m, d))
    expect(ida("", "Rodaje")).toEqual({ materia: "", descripcion: "Rodaje" })
    expect(ida("Taller", "")).toEqual({ materia: "Taller", descripcion: "" })
    // El separador dentro de la materia no corta mal.
    expect(armarMotivo("Taller — II", "Rodaje")).toBe("Taller - II — Rodaje")
    expect(ida("Taller — II", "Rodaje")).toEqual({ materia: "Taller - II", descripcion: "Rodaje" })
  })

  it("vacío no se manda", () => {
    expect(armarMotivo(" ", "  ")).toBeUndefined()
  })

  it("respeta el máximo de 500 de la API", () => {
    expect(armarMotivo("Taller", "x".repeat(600))).toHaveLength(MOTIVO_MAX)
    expect(maxDescripcion("Taller")).toBe(MOTIVO_MAX - "Taller — ".length)
    expect(maxDescripcion("")).toBe(MOTIVO_MAX - "— ".length)
    expect(armarMotivo("", "x".repeat(600))).toHaveLength(MOTIVO_MAX)
  })
})
