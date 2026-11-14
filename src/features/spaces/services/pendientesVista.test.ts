import { describe, expect, it } from "vitest"
import { agruparPorDia, contarPorDia, filtrarPendientes, paginar, sumarDias } from "./pendientesVista"

const r = (id: number, idEspacio: number, fecha: string, horaInicio: string) => ({ id, idEspacio, fecha, horaInicio })
const lista = [
  r(1, 1, "2026-11-30", "09:00"),
  r(2, 2, "2026-11-19", "10:00"),
  r(3, 1, "2026-11-19", "09:00"),
  r(4, 1, "2026-11-14", "12:00"),
]

describe("pendientesVista (SPEC-10 V-21)", () => {
  it("suma días cruzando el mes", () => {
    expect(sumarDias("2026-11-28", 6)).toBe("2026-12-04")
  })

  it("filtra por período, espacio y día, y ordena por fecha y hora", () => {
    const base = { hoy: "2026-11-13", idEspacio: "todos" as const, dia: null }
    expect(filtrarPendientes(lista, { ...base, periodo: "todas" }).map((x) => x.id)).toEqual([4, 3, 2, 1])
    expect(filtrarPendientes(lista, { ...base, periodo: "7" }).map((x) => x.id)).toEqual([4, 3, 2])
    expect(filtrarPendientes(lista, { ...base, periodo: "7", idEspacio: 1 }).map((x) => x.id)).toEqual([4, 3])
    // El día del calendario manda sobre el período.
    expect(filtrarPendientes(lista, { ...base, periodo: "7", dia: "2026-11-30" }).map((x) => x.id)).toEqual([1])
  })

  it("cuenta por día sólo las del espacio", () => {
    expect(contarPorDia(lista, 1)).toEqual({ "2026-11-30": 1, "2026-11-19": 1, "2026-11-14": 1 })
    expect(contarPorDia(lista, null)).toEqual({})
  })

  it("pagina y corrige una página fuera de rango", () => {
    const n = Array.from({ length: 23 }, (_, i) => i)
    expect(paginar(n, 3)).toMatchObject({ items: [20, 21, 22], pagina: 3, paginas: 3, desde: 21, hasta: 23 })
    expect(paginar(n, 9).pagina).toBe(3)
    expect(paginar([], 1)).toMatchObject({ items: [], paginas: 1 })
  })

  it("agrupa por día conservando el orden", () => {
    const g = agruparPorDia(filtrarPendientes(lista, { hoy: "2026-11-13", periodo: "todas", idEspacio: "todos", dia: null }))
    expect(g.map((d) => [d.fecha, d.items.length])).toEqual([["2026-11-14", 1], ["2026-11-19", 2], ["2026-11-30", 1]])
  })
})
