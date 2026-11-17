import { describe, expect, it } from "vitest"
import { claveDeReserva, contarPorEstado, filtrarPorEstado, ordenarReservas } from "./misSolicitudesVista"

const r = (fecha: string, horaInicio: string, horaFin: string, estado = "Aprobada") => ({ fecha, horaInicio, horaFin, estado })

describe("Mis Solicitudes (SPEC-10 V-18)", () => {
  it("cuenta y filtra por los estados de USR-06", () => {
    const items = [r("2026-11-14", "14:00", "16:00"), r("2026-11-19", "15:00", "16:00", "Pendiente"), r("2026-11-01", "09:00", "10:00", "Finalizada")]
    const clave = (x: { estado: string }) => claveDeReserva(x.estado)
    expect(contarPorEstado(items, clave)).toEqual({ todas: 3, pendiente: 1, aprobada: 1, rechazada: 0, cancelada: 0 })
    expect(filtrarPorEstado(items, "pendiente", clave)).toHaveLength(1)
    expect(filtrarPorEstado(items, "todas", clave)).toHaveLength(3)
    expect(claveDeReserva("En_Uso")).toBeNull()
  })

  it("pone primero las próximas y al final las que ya pasaron", () => {
    const orden = ordenarReservas(
      [r("2026-11-22", "15:00", "16:00"), r("2026-11-01", "09:00", "10:00"), r("2026-11-14", "14:00", "16:00"), r("2026-11-05", "09:00", "10:00")],
      "2026-11-13T12:00",
    )
    expect(orden.map((x) => x.fecha)).toEqual(["2026-11-14", "2026-11-22", "2026-11-05", "2026-11-01"])
  })
})
