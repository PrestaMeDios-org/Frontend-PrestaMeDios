import { describe, expect, it } from "vitest"
import type { LineaOrden } from "../types"
import { fechaLab, resumenDeLineas } from "./formato"

const linea = (equipamientoId: number, id = 1): LineaOrden => ({
  id,
  equipamientoId,
  unidadId: null,
  estado: "pendiente",
  retiro: new Date(),
  devolucion: new Date(),
  finOcupacion: new Date(),
})

describe("fechaLab", () => {
  it("muestra la hora del laboratorio", () => {
    expect(fechaLab(new Date("2026-11-11T13:00:00Z"))).toBe("11/11/2026 10:00")
  })
})

describe("resumenDeLineas", () => {
  it("agrupa por modelo y usa el nombre del catálogo", () => {
    const nombres = new Map([[12, "Cámara Sony"]])
    expect(resumenDeLineas([linea(12, 1), linea(12, 2), linea(7, 3)], nombres)).toEqual([
      { equipamientoId: 12, nombre: "Cámara Sony", cantidad: 2 },
      { equipamientoId: 7, nombre: "Equipo #7", cantidad: 1 },
    ])
  })
})
