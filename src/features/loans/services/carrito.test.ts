import { describe, expect, it } from "vitest"
import type { Equipment } from "../../inventory/types"
import {
  agregar,
  cambiarCantidad,
  equipamientoIds,
  MAX_LINEAS,
  puedeSumar,
  quitar,
  requiereAval,
  tipoCarrito,
  totalUnidades,
  type ItemCarrito,
} from "./carrito"

const equipo = (p: Partial<Equipment> = {}): Equipment => ({
  id: 12,
  name: "Cámara Sony",
  category: "cameras",
  available: true,
  maintenance: false,
  image: "",
  specs: "",
  maxDays: 4,
  code: "CAM-001",
  brand: "Sony",
  model: "A7",
  quantity: 3,
  available_count: 3,
  esNotebook: false,
  activo: true,
  lockers: [],
  ...p,
})

describe("agregar", () => {
  it("el primer clic crea el ítem con cantidad 1", () => {
    const items = agregar([], equipo())
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      equipamientoId: 12,
      nombre: "Cámara Sony",
      cantidad: 1,
    })
  })

  it("repetir el modelo suma cantidad, no otro ítem", () => {
    const items = agregar(agregar([], equipo()), equipo())
    expect(items).toHaveLength(1)
    expect(items[0].cantidad).toBe(2)
  })

  it("no supera las unidades del modelo en la sede", () => {
    let items: ItemCarrito[] = []
    for (let i = 0; i < 5; i++) items = agregar(items, equipo({ quantity: 2 }))
    expect(items[0].cantidad).toBe(2)
    expect(puedeSumar(items, 12)).toBe(false)
  })

  it(`no supera ${MAX_LINEAS} unidades en total`, () => {
    let items: ItemCarrito[] = []
    for (let id = 1; id <= MAX_LINEAS + 2; id++)
      items = agregar(items, equipo({ id }))
    expect(totalUnidades(items)).toBe(MAX_LINEAS)
    expect(puedeSumar(items, 999)).toBe(false)
  })
})

describe("cambiarCantidad y quitar", () => {
  const base = agregar(agregar([], equipo()), equipo({ id: 15, quantity: 10 }))

  it("fija la cantidad dentro del tope del modelo", () => {
    expect(cambiarCantidad(base, 12, 2)[0].cantidad).toBe(2)
    expect(cambiarCantidad(base, 12, 50)[0].cantidad).toBe(3)
  })

  it("respeta el máximo total contando los otros modelos", () => {
    let items: ItemCarrito[] = [
      { ...base[1], maxCantidad: 30, cantidad: MAX_LINEAS - 2 },
      base[0],
    ]
    items = cambiarCantidad(items, 12, 3)
    expect(totalUnidades(items)).toBe(MAX_LINEAS)
  })

  it("con 0 quita el modelo", () => {
    expect(cambiarCantidad(base, 12, 0).map((i) => i.equipamientoId)).toEqual([
      15,
    ])
  })

  it("quitar saca solo ese modelo", () => {
    expect(quitar(base, 15).map((i) => i.equipamientoId)).toEqual([12])
  })
})

describe("derivados", () => {
  it("equipamientoIds repite el id una vez por unidad (AC-L03)", () => {
    const items = cambiarCantidad(
      agregar(agregar([], equipo()), equipo({ id: 15 })),
      12,
      2,
    )
    expect(equipamientoIds(items)).toEqual([12, 12, 15])
  })

  it("el tipo de carrito depende de la alta gama", () => {
    expect(tipoCarrito([])).toBeNull()
    const normal = agregar([], equipo())
    expect(tipoCarrito(normal)).toBe("normal")
    expect(requiereAval(normal)).toBe(false)
    const conAltaGama = agregar(normal, equipo({ id: 20, altaGama: true }))
    expect(tipoCarrito(conAltaGama)).toBe("alta-gama")
    expect(requiereAval(conAltaGama)).toBe(true)
  })
})
