import { describe, expect, it } from "vitest"
import { toCategory, toEquipment, toUnidad } from "./mappers"
import type { EquipamientoDTO, EquipamientoPublicoDTO, UnidadFisicaDTO } from "../types"

const unidad = (p: Partial<UnidadFisicaDTO>): UnidadFisicaDTO => ({
  id: 1,
  numero_serie: "SN-1",
  codigo_inventario: "CAM-S-01",
  sede: "Ushuaia",
  locker: null,
  estado: "disponible",
  ...p,
})

const base = {
  id: 7,
  codigo: "CAM-001",
  nombre: "Cámara Sony",
  marca: "Sony",
  modelo: "A7",
  categoria_id: "cameras",
  descripcion: null,
  max_dias_prestamo: 4,
  alta_gama: false,
  es_notebook: false,
  imagen_url: null,
  video_url: null,
  reglas_cuidado: [],
  cantidad_total: 2,
  cantidad_disponible: 1,
  en_mantenimiento: false,
}

describe("toEquipment (vista de administradores)", () => {
  const dto: EquipamientoDTO = {
    ...base,
    activo: true,
    unidades: [
      unidad({ id: 1, locker: 5 }),
      unidad({ id: 2, locker: 2, estado: "mantenimiento" }),
      unidad({ id: 3, locker: 7, estado: "baja" }),
    ],
  }

  it("calcula sede única, lockers de unidades activas y conserva las unidades", () => {
    const e = toEquipment(dto)
    expect(e.sede).toBe("Ushuaia")
    expect(e.lockers).toEqual([2, 5]) // el de la unidad en baja no cuenta
    expect(e.locker).toBe(2)
    expect(e.unidades).toHaveLength(3)
    expect(e.unidades?.[0]).toMatchObject({ serie: "SN-1", codigoInventario: "CAM-S-01" })
  })

  it("no define sede si hay unidades en ambas", () => {
    const e = toEquipment({
      ...dto,
      unidades: [unidad({}), unidad({ id: 2, sede: "Río Grande" })],
    })
    expect(e.sede).toBeUndefined()
  })

  it("respeta la baja lógica y los campos opcionales", () => {
    const e = toEquipment({ ...dto, activo: false, imagen_url: "https://x/y.png", video_url: "https://v" })
    expect(e.activo).toBe(false)
    expect(e.image).toBe("https://x/y.png")
    expect(e.videoUrl).toBe("https://v")
  })
})

describe("toEquipment (vista de estudiantes y docentes)", () => {
  const dto: EquipamientoPublicoDTO = { ...base, locker: 3 }

  it("funciona sin `unidades` y toma el locker del DTO", () => {
    const e = toEquipment(dto)
    expect(e.unidades).toBeUndefined()
    expect(e.locker).toBe(3)
    expect(e.lockers).toEqual([3])
    expect(e.activo).toBe(true)
    expect(e.available).toBe(true)
    expect(e.quantity).toBe(2)
  })

  it("locker nulo → sin locker", () => {
    const e = toEquipment({ ...dto, locker: null })
    expect(e.locker).toBeUndefined()
    expect(e.lockers).toEqual([])
  })

  it("marca mantenimiento y no disponible según los campos calculados", () => {
    const e = toEquipment({ ...dto, cantidad_disponible: 0, en_mantenimiento: true })
    expect(e.available).toBe(false)
    expect(e.maintenance).toBe(true)
  })
})

describe("toUnidad y toCategory", () => {
  it("mapea la unidad a view model", () => {
    expect(toUnidad(unidad({ id: 9, locker: 4, estado: "prestado" }))).toEqual({
      id: 9,
      serie: "SN-1",
      codigoInventario: "CAM-S-01",
      sede: "Ushuaia",
      locker: 4,
      estado: "prestado",
    })
  })

  it("usa un color por defecto si la categoría no tiene", () => {
    expect(toCategory({ id: "a", nombre: "Audio", color: null })).toEqual({
      id: "a",
      label: "Audio",
      color: "#6E6E73",
    })
  })
})
