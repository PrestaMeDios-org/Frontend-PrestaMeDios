import { describe, expect, it } from "vitest"
import { toComunicado } from "./mappers"
import { fechaLegible, isoALocal, localAIso } from "./fechas"
import type { ComunicadoDTO } from "../types"

const dto = (p: Partial<ComunicadoDTO> = {}): ComunicadoDTO => ({
  id: 1,
  titulo: "Cierre por feriado",
  contenido: "Línea 1\nLínea 2",
  sede: "Ushuaia",
  es_global: false,
  estado: "PUBLICADO",
  vigente: true,
  autor: { id: 3, nombre: "Natalia", apellido: "Ader" },
  publicado_en: "2026-11-07T10:30:00-03:00",
  vence_en: null,
  actualizado_en: "2026-11-07T10:30:00-03:00",
  ...p,
})

describe("toComunicado", () => {
  it("muestra la sede o «Global» como alcance", () => {
    expect(toComunicado(dto()).alcance).toBe("Ushuaia")
    expect(toComunicado(dto({ sede: null, es_global: true })).alcance).toBe("Global")
  })

  it("usa «Laboratorio» cuando no hay autor visible", () => {
    expect(toComunicado(dto()).autor).toBe("Natalia Ader")
    expect(toComunicado(dto({ autor: null })).autor).toBe("Laboratorio")
  })

  it("marca como vencido sólo a un publicado que ya no está vigente", () => {
    expect(toComunicado(dto({ vigente: false })).vencido).toBe(true)
    expect(toComunicado(dto({ estado: "ARCHIVADO", vigente: false })).vencido).toBe(false)
    expect(toComunicado(dto()).vencido).toBe(false)
  })

  it("formatea fechas en la zona del laboratorio y conserva el contenido tal cual", () => {
    const c = toComunicado(dto({ vence_en: "2026-11-20T00:00:00-03:00" }))
    expect(c.publicadoLabel).toBe("07/11/2026 10:30")
    expect(c.venceLabel).toBe("20/11/2026 00:00")
    expect(c.contenido).toBe("Línea 1\nLínea 2")
  })
})

describe("fechas", () => {
  it("convierte un datetime-local a ISO con la zona del laboratorio", () => {
    expect(localAIso("2026-11-20T09:00")).toBe("2026-11-20T09:00:00-03:00")
    expect(localAIso("")).toBeNull()
    expect(localAIso("20/11/2026")).toBeNull()
  })

  it("convierte ISO (en cualquier zona) al valor del input en hora del laboratorio", () => {
    expect(isoALocal("2026-11-20T12:00:00Z")).toBe("2026-11-20T09:00")
    expect(isoALocal("2026-11-20T00:00:00-03:00")).toBe("2026-11-20T00:00")
  })

  it("fechaLegible no depende de la zona del navegador", () => {
    expect(fechaLegible("2026-11-07T13:30:00Z")).toBe("07/11/2026 10:30")
  })
})
