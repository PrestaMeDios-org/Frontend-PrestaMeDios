import { describe, expect, it } from "vitest"
import type { MovimientoUnidadDTO } from "../types"
import { aMovimiento, fechaHoraLab, hayMas, POR_PAGINA, textoReservasAfectadas } from "./historial"

// SPEC-04 INV-36 (lógica pura del historial y del aviso de reservas afectadas).

const dto = (extra: Partial<MovimientoUnidadDTO> = {}): MovimientoUnidadDTO => ({
  orden_id: 12,
  detalle_id: 31,
  solicitante: { id: 7, nombre: "Ana", apellido: "Pérez" },
  estado: "devuelto",
  retiro_pactado: "2026-11-10T10:00:00-03:00",
  devolucion_pactada: "2026-11-12T15:00:00-03:00",
  entregado_en: null,
  devuelto_en: null,
  observacion_devolucion: null,
  ...extra,
})

describe("aMovimiento", () => {
  it("arma la fila con nombre, estado y fechas en la hora del laboratorio", () => {
    const m = aMovimiento(dto())
    expect(m).toMatchObject({
      id: 31,
      ordenId: 12,
      solicitante: "Ana Pérez",
      estado: "devuelto",
      estadoTexto: "Devuelto",
      retiro: "10/11/2026 10:00",
      devolucion: "12/11/2026 15:00",
    })
  })

  it("muestra '—' en los campos que `loans` todavía no completa", () => {
    const m = aMovimiento(dto({ solicitante: null }))
    expect(m.solicitante).toBe("—")
    expect(m.entregado).toBe("—")
    expect(m.devuelto).toBe("—")
    expect(m.observacion).toBe("—")
  })

  it("usa las fechas reales y la observación cuando llegan", () => {
    const m = aMovimiento(
      dto({
        entregado_en: "2026-11-10T10:20:00-03:00",
        devuelto_en: "2026-11-12T14:05:00-03:00",
        observacion_devolucion: "  Lente con polvo ",
        estado: "no_retirado",
      }),
    )
    expect(m.entregado).toBe("10/11/2026 10:20")
    expect(m.devuelto).toBe("12/11/2026 14:05")
    expect(m.observacion).toBe("Lente con polvo")
    expect(m.estadoTexto).toBe("No retirado")
  })
})

describe("fechaHoraLab", () => {
  it("convierte instantes en UTC a la hora del laboratorio", () => {
    expect(fechaHoraLab("2026-11-10T13:00:00Z")).toBe("10/11/2026 10:00")
  })

  it("devuelve '—' sin dato o con una fecha inválida", () => {
    expect(fechaHoraLab(null)).toBe("—")
    expect(fechaHoraLab("no es una fecha")).toBe("—")
  })
})

describe("hayMas", () => {
  it("sigue mientras la página viene completa", () => {
    expect(hayMas(POR_PAGINA)).toBe(true)
    expect(hayMas(POR_PAGINA - 1)).toBe(false)
    expect(hayMas(0)).toBe(false)
    expect(hayMas(2, 2)).toBe(true)
  })
})

describe("textoReservasAfectadas", () => {
  it("no avisa sin reservas", () => {
    expect(textoReservasAfectadas("CAM-01", null, null)).toBeNull()
    expect(textoReservasAfectadas("CAM-01", 0, [])).toBeNull()
  })

  it("nombra la unidad, la cantidad y las órdenes", () => {
    expect(textoReservasAfectadas("CAM-01", 2, [12, 15])).toBe(
      "La unidad CAM-01 tenía 2 reservas aprobadas (órdenes #12, #15). " +
        "Resolvelas con una cancelación forzada en la Bandeja de Validaciones.",
    )
    expect(textoReservasAfectadas("CAM-01", 1, [12])).toContain("1 reserva aprobada (orden #12)")
  })

  it("sin ids de orden avisa igual", () => {
    expect(textoReservasAfectadas("CAM-01", 1, null)).toContain("tenía 1 reserva aprobada.")
  })
})
