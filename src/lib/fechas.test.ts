import { describe, expect, it } from "vitest"
import { hoyLab, ZONA_LAB } from "./fechas"

const iso = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`

describe("hoyLab", () => {
  it("la zona es la del laboratorio (UTC-3)", () => {
    expect(ZONA_LAB).toBe("America/Argentina/Ushuaia")
  })

  it("usa la fecha del laboratorio, no la del navegador", () => {
    // 02:30 UTC del 11/11 todavía es 10/11 a las 23:30 en el laboratorio
    expect(iso(hoyLab(new Date("2026-11-11T02:30:00Z")))).toBe("2026-11-10")
    // 03:00 UTC ya es 11/11 a las 00:00
    expect(iso(hoyLab(new Date("2026-11-11T03:00:00Z")))).toBe("2026-11-11")
  })

  it("cambio de año", () => {
    expect(iso(hoyLab(new Date("2027-01-01T02:59:59Z")))).toBe("2026-12-31")
    expect(iso(hoyLab(new Date("2027-01-01T03:00:00Z")))).toBe("2027-01-01")
  })

  it("devuelve la medianoche local de ese día", () => {
    const hoy = hoyLab(new Date("2026-11-10T15:00:00Z"))
    expect([hoy.getHours(), hoy.getMinutes(), hoy.getSeconds()]).toEqual([0, 0, 0])
  })
})
