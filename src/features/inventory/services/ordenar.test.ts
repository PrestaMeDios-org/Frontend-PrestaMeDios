import { describe, expect, it } from "vitest"
import { alternarOrden, ordenarStock } from "./ordenar"
import type { Category, Equipment } from "../types"

const eq = (p: Partial<Equipment> & { id: number; name: string }): Equipment => ({
  category: "cameras",
  available: true,
  maintenance: false,
  image: "",
  specs: "",
  maxDays: 4,
  code: `C${p.id}`,
  brand: "X",
  model: "M",
  quantity: 1,
  available_count: 1,
  esNotebook: false,
  activo: true,
  lockers: [],
  ...p,
})

const categorias: Category[] = [
  { id: "cameras", label: "Cámaras", color: "#000" },
  { id: "audio", label: "Audio", color: "#000" },
]

const items = [
  eq({ id: 1, name: "Trípode", category: "cameras", lockers: [3], available_count: 5 }),
  eq({ id: 2, name: "Álbum", category: "audio", lockers: [], altaGama: true, available_count: 0 }),
  eq({ id: 3, name: "Micrófono", category: "audio", lockers: [1, 6], available_count: 2 }),
  eq({ id: 4, name: "Zoom", category: "cameras", lockers: [], available_count: 2 }),
]
const nombres = (xs: Equipment[]) => xs.map((x) => x.name)

describe("ordenarStock", () => {
  it("ordena por nombre ignorando acentos, asc y desc", () => {
    expect(nombres(ordenarStock(items, "nombre", "asc"))).toEqual(["Álbum", "Micrófono", "Trípode", "Zoom"])
    expect(nombres(ordenarStock(items, "nombre", "desc"))).toEqual(["Zoom", "Trípode", "Micrófono", "Álbum"])
  })

  it("ordena por la etiqueta de la categoría, no por su id", () => {
    // Audio (Álbum, Micrófono) antes que Cámaras (Trípode, Zoom); empate por nombre
    expect(nombres(ordenarStock(items, "categoria", "asc", categorias))).toEqual([
      "Álbum", "Micrófono", "Trípode", "Zoom",
    ])
    expect(nombres(ordenarStock(items, "categoria", "desc", categorias))[0]).toBe("Trípode")
  })

  it("ordena por locker con los ítems sin locker siempre al final", () => {
    expect(nombres(ordenarStock(items, "locker", "asc"))).toEqual(["Micrófono", "Trípode", "Álbum", "Zoom"])
    expect(nombres(ordenarStock(items, "locker", "desc"))).toEqual(["Trípode", "Micrófono", "Álbum", "Zoom"])
  })

  it("ordena por tipo: común antes que especial en ascendente", () => {
    const asc = ordenarStock(items, "tipo", "asc")
    expect(asc[asc.length - 1].name).toBe("Álbum")
    expect(ordenarStock(items, "tipo", "desc")[0].name).toBe("Álbum")
  })

  it("ordena por unidades disponibles", () => {
    expect(nombres(ordenarStock(items, "disponibles", "desc"))).toEqual(["Trípode", "Micrófono", "Zoom", "Álbum"])
    expect(nombres(ordenarStock(items, "disponibles", "asc"))).toEqual(["Álbum", "Micrófono", "Zoom", "Trípode"])
  })

  it("no modifica el arreglo original", () => {
    const copia = [...items]
    ordenarStock(items, "nombre", "desc")
    expect(items).toEqual(copia)
  })
})

describe("alternarOrden", () => {
  it("columna nueva → ascendente; la misma → alterna", () => {
    const a = alternarOrden({ columna: "nombre", sentido: "asc" }, "locker")
    expect(a).toEqual({ columna: "locker", sentido: "asc" })
    const b = alternarOrden(a, "locker")
    expect(b.sentido).toBe("desc")
    expect(alternarOrden(b, "locker").sentido).toBe("asc")
  })
})
