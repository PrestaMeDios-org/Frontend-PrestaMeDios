import { describe, expect, it } from "vitest"
import { temaDe } from "./tema"

const ahora = new Date("2026-11-12T12:00:00-03:00")
const base = { esGlobal: false, sede: "Ushuaia" as const, venceEn: null, vencido: false }

describe("tema de la tarjeta de comunicado (SPEC-10 V-10)", () => {
  it("rojo si es global, azul en Ushuaia, verde en Río Grande", () => {
    expect(temaDe({ ...base, esGlobal: true, sede: null }, ahora)).toBe("rojo")
    expect(temaDe(base, ahora)).toBe("azul")
    expect(temaDe({ ...base, sede: "Río Grande" }, ahora)).toBe("verde")
  })

  it("amarillo si vence dentro de 48 h", () => {
    expect(temaDe({ ...base, esGlobal: true, venceEn: "2026-11-13T12:00:00-03:00" }, ahora)).toBe("amarillo")
    expect(temaDe({ ...base, venceEn: "2026-11-20T12:00:00-03:00" }, ahora)).toBe("azul")
  })

  it("un vencido vuelve a su color de alcance", () => {
    expect(temaDe({ ...base, venceEn: "2026-11-11T12:00:00-03:00", vencido: true }, ahora)).toBe("azul")
  })
})
