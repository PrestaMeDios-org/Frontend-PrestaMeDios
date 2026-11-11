import { describe, expect, it } from "vitest"
import type { LineaOrden } from "../types"
import { caeEnFinDeSemana, fechaLab, resumenDeLineas } from "./formato"

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

describe("caeEnFinDeSemana", () => {
  it("usa el día del laboratorio, no el UTC", () => {
    // Sábado 14/11 a las 22:00 en Ushuaia es domingo 15/11 a la 01:00 UTC.
    expect(caeEnFinDeSemana(new Date("2026-11-15T01:00:00Z"))).toBe(true)
    // Domingo 15/11 a las 22:00 en Ushuaia es lunes en UTC: sigue siendo fin de semana.
    expect(caeEnFinDeSemana(new Date("2026-11-16T01:00:00Z"))).toBe(true)
    // Viernes 13/11 a las 22:00 en Ushuaia ya es sábado en UTC: no es fin de semana.
    expect(caeEnFinDeSemana(new Date("2026-11-14T01:00:00Z"))).toBe(false)
    // Lunes 16/11 a las 22:00 en Ushuaia es martes en UTC.
    expect(caeEnFinDeSemana(new Date("2026-11-17T01:00:00Z"))).toBe(false)
  })
})
