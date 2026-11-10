import { describe, expect, it } from "vitest"
import { aIso, hoyLab, puedeIrA, rangoDelMes, ventana, VENTANA_DIAS } from "./calendario"

const dia = (y: number, m: number, d: number) => new Date(y, m - 1, d)
const mes = (y: number, m: number) => new Date(y, m - 1, 1)

describe("aIso", () => {
  it("AAAA-MM-DD con ceros a la izquierda", () => {
    expect(aIso(dia(2026, 1, 5))).toBe("2026-01-05")
    expect(aIso(dia(2026, 12, 31))).toBe("2026-12-31")
  })
})

describe("ventana", () => {
  // D-07
  it("va de hoy a hoy + 61: 62 días en total", () => {
    expect(VENTANA_DIAS).toBe(62)
    const { min, max } = ventana(dia(2026, 11, 10))
    expect(aIso(min)).toBe("2026-11-10")
    expect(aIso(max)).toBe("2027-01-10")
    expect(Math.round((max.getTime() - min.getTime()) / 86_400_000) + 1).toBe(62)
  })

  it("descarta la hora de hoy", () => {
    const { min } = ventana(new Date(2026, 10, 10, 23, 59, 59))
    expect(min.getHours()).toBe(0)
    expect(aIso(min)).toBe("2026-11-10")
  })
})

describe("rangoDelMes", () => {
  // INV-32
  const hoy = dia(2026, 11, 10)

  it("el mes actual empieza hoy, no el día 1", () => {
    expect(rangoDelMes(mes(2026, 11), hoy)).toEqual({ desde: "2026-11-10", hasta: "2026-11-30" })
  })

  it("un mes entero dentro de la ventana", () => {
    expect(rangoDelMes(mes(2026, 12), hoy)).toEqual({ desde: "2026-12-01", hasta: "2026-12-31" })
  })

  it("el último mes se corta en hoy + 61, cruzando el año", () => {
    expect(rangoDelMes(mes(2027, 1), hoy)).toEqual({ desde: "2027-01-01", hasta: "2027-01-10" })
  })

  it("null para un mes pasado o posterior a la ventana", () => {
    expect(rangoDelMes(mes(2026, 10), hoy)).toBeNull()
    expect(rangoDelMes(mes(2027, 2), hoy)).toBeNull()
  })

  it("hoy es el último día del mes: un rango de un día", () => {
    expect(rangoDelMes(mes(2026, 11), dia(2026, 11, 30))).toEqual({ desde: "2026-11-30", hasta: "2026-11-30" })
  })

  it("nunca pide más de 62 días", () => {
    const r = rangoDelMes(mes(2026, 1), dia(2026, 1, 1))
    expect(r).toEqual({ desde: "2026-01-01", hasta: "2026-01-31" })
  })
})

describe("puedeIrA", () => {
  // INV-32
  const hoy = dia(2026, 11, 10)

  it("el mes actual y los que tocan la ventana", () => {
    expect(puedeIrA(mes(2026, 11), hoy)).toBe(true)
    expect(puedeIrA(mes(2026, 12), hoy)).toBe(true)
    expect(puedeIrA(mes(2027, 1), hoy)).toBe(true) // cambio de año
  })

  it("no deja ir al mes anterior ni pasar el fin de la ventana", () => {
    expect(puedeIrA(mes(2026, 10), hoy)).toBe(false)
    expect(puedeIrA(mes(2027, 2), hoy)).toBe(false)
  })

  it("el día 1: la ventana termina dentro del mes siguiente al próximo", () => {
    const primero = dia(2026, 7, 1) // 1/7 + 61 = 31/8
    expect(puedeIrA(mes(2026, 8), primero)).toBe(true)
    expect(puedeIrA(mes(2026, 9), primero)).toBe(false)
  })

  it("coincide con rangoDelMes", () => {
    for (const m of [mes(2026, 10), mes(2026, 11), mes(2026, 12), mes(2027, 1), mes(2027, 2)]) {
      expect(puedeIrA(m, hoy)).toBe(rangoDelMes(m, hoy) !== null)
    }
  })
})

describe("hoyLab", () => {
  // SPEC-04 §5.4: `desde ≥ hoy` en la zona del laboratorio (UTC-3)
  it("usa la fecha del laboratorio, no la del navegador", () => {
    // 02:30 UTC del 11/11 todavía es 10/11 a las 23:30 en el laboratorio
    expect(aIso(hoyLab(new Date("2026-11-11T02:30:00Z")))).toBe("2026-11-10")
    // 03:00 UTC ya es 11/11 a las 00:00
    expect(aIso(hoyLab(new Date("2026-11-11T03:00:00Z")))).toBe("2026-11-11")
  })

  it("cambio de año", () => {
    expect(aIso(hoyLab(new Date("2027-01-01T02:59:59Z")))).toBe("2026-12-31")
    expect(aIso(hoyLab(new Date("2027-01-01T03:00:00Z")))).toBe("2027-01-01")
  })

  it("devuelve la medianoche local de ese día", () => {
    const hoy = hoyLab(new Date("2026-11-10T15:00:00Z"))
    expect([hoy.getHours(), hoy.getMinutes(), hoy.getSeconds()]).toEqual([0, 0, 0])
  })
})
