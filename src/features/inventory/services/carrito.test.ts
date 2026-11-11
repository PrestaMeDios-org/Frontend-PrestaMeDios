import { describe, expect, it } from "vitest"
import { motivoNoAgregable, muestraBotonAgregar } from "./carrito"
import type { Equipment } from "../types"

const eq = (p: Partial<Equipment> = {}): Equipment => ({
  id: 1,
  name: "Cámara",
  category: "cameras",
  available: true,
  maintenance: false,
  image: "",
  specs: "",
  maxDays: 4,
  code: "C1",
  brand: "X",
  model: "M",
  quantity: 2,
  available_count: 2,
  esNotebook: false,
  activo: true,
  lockers: [],
  ...p,
})

describe("motivoNoAgregable", () => {
  // INV-33
  it("null si el ítem está activo, sin mantenimiento y con unidades hoy", () => {
    expect(motivoNoAgregable(eq())).toBeNull()
    expect(motivoNoAgregable(eq({ available_count: 1 }))).toBeNull()
  })

  it("ítem dado de baja", () => {
    expect(motivoNoAgregable(eq({ activo: false }))).toBe("Dado de baja")
  })

  it("ítem en mantenimiento", () => {
    expect(motivoNoAgregable(eq({ maintenance: true }))).toBe("En mantenimiento")
  })

  it("sin unidades disponibles hoy", () => {
    expect(motivoNoAgregable(eq({ available_count: 0 }))).toBe("Sin unidades disponibles hoy")
  })

  it("la baja pesa más que el mantenimiento, y éste más que la falta de unidades", () => {
    expect(motivoNoAgregable(eq({ activo: false, maintenance: true, available_count: 0 }))).toBe("Dado de baja")
    expect(motivoNoAgregable(eq({ maintenance: true, available_count: 0 }))).toBe("En mantenimiento")
  })
})

describe("muestraBotonAgregar", () => {
  // INV-33, C11
  it("estudiantes y docentes lo ven si hay onAddToCart", () => {
    expect(muestraBotonAgregar("student", true)).toBe(true)
    expect(muestraBotonAgregar("teacher", true)).toBe(true)
  })

  it("los administradores no lo ven", () => {
    expect(muestraBotonAgregar("admin", true)).toBe(false)
  })

  it("sin onAddToCart no lo ve nadie", () => {
    expect(muestraBotonAgregar("student", false)).toBe(false)
    expect(muestraBotonAgregar("teacher", false)).toBe(false)
    expect(muestraBotonAgregar("admin", false)).toBe(false)
  })
})
