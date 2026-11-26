import { describe, expect, it } from "vitest"
import type { Equipment, Unidad } from "../types"
import { agruparPorLocker, rangosDeLockers, separarFueraDeServicio, sinUnidadesEnUso } from "./stockVista"

describe("lockers en Control de Stock (SPEC-10 V-16)", () => {
  it("junta los lockers seguidos en rangos", () => {
    expect(rangosDeLockers([2, 3, 4, 5, 6])).toBe("2–6")
    expect(rangosDeLockers([6, 2, 3, 8])).toBe("2, 3, 6, 8")
    expect(rangosDeLockers([1, 2, 3, 7])).toBe("1–3, 7")
    expect(rangosDeLockers([3])).toBe("3")
    expect(rangosDeLockers([])).toBe("—")
  })
})

const u = (id: number, codigo: string, locker: number | null): Unidad => ({
  id,
  serie: `S${id}`,
  codigoInventario: codigo,
  sede: "Ushuaia",
  locker,
  estado: "disponible",
})
const eq = (id: number, name: string, unidades: Unidad[]) => ({ id, name, unidades }) as unknown as Equipment

describe("vista por locker (SPEC-10 V-17)", () => {
  it("muestra los 7 lockers, agrupa y ordena por equipo y código", () => {
    const grupos = agruparPorLocker([
      eq(1, "Trípode", [u(1, "TRI-02", 2), u(2, "TRI-01", 2)]),
      eq(2, "Cámara", [u(3, "CAM-10", 2), u(4, "CAM-02", null)]),
    ])
    expect(grupos.map((g) => g.locker)).toEqual([1, 2, 3, 4, 5, 6, 7, null])
    expect(grupos[1]!.entradas.map((e) => e.unidad.codigoInventario)).toEqual(["CAM-10", "TRI-01", "TRI-02"])
    expect(grupos[0]!.entradas).toEqual([])
    expect(grupos.at(-1)!.entradas.map((e) => e.unidad.id)).toEqual([4])
  })

  it("sin unidades sin locker no agrega ese grupo", () => {
    expect(agruparPorLocker([eq(1, "X", [u(1, "X-1", 7)])]).map((g) => g.locker)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe("unidades fuera de servicio (SPEC-04 §8.4, INV-37)", () => {
  const conEstado = (id: number, codigo: string, estado: Unidad["estado"]): Unidad => ({ ...u(id, codigo, 1), estado })

  it("separa las dadas de baja y ordena cada grupo por código", () => {
    const { enUso, fueraDeServicio } = separarFueraDeServicio([
      conEstado(1, "CAM-10", "baja"),
      conEstado(2, "CAM-03", "prestado"),
      conEstado(3, "CAM-02", "baja"),
      conEstado(4, "CAM-01", "mantenimiento"),
      conEstado(5, "CAM-04", "disponible"),
    ])
    expect(enUso.map((x) => x.codigoInventario)).toEqual(["CAM-01", "CAM-03", "CAM-04"])
    expect(fueraDeServicio.map((x) => x.codigoInventario)).toEqual(["CAM-02", "CAM-10"])
  })

  it("'Sin unidades en uso' sólo si tuvo unidades y todas están de baja", () => {
    const baja = [conEstado(1, "A", "baja"), conEstado(2, "B", "baja")]
    expect(sinUnidadesEnUso({ quantity: 0, unidades: baja })).toBe(true)
    expect(sinUnidadesEnUso({ quantity: 0, unidades: [] })).toBe(false) // sin unidades cargadas
    expect(sinUnidadesEnUso({ quantity: 0, unidades: undefined })).toBe(false)
    expect(sinUnidadesEnUso({ quantity: 1, unidades: [...baja, conEstado(3, "C", "disponible")] })).toBe(false)
  })
})
