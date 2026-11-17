import { describe, expect, it } from "vitest"
import { reservaDelTurno, reservasDelDia, separarMotivo } from "./reservasDelDia"

const r = (id: number, horaInicio: string, horaFin: string, estado = "Aprobada", idEspacio = 1, fecha = "2026-11-18") => ({
  id,
  idEspacio,
  fecha,
  horaInicio,
  horaFin,
  estado,
})

describe("reservas del día para el admin (SPEC-10 V-21)", () => {
  it("filtra espacio, día y estados vigentes, y ordena por hora", () => {
    const lista = reservasDelDia(
      [r(1, "14:00", "16:00"), r(2, "09:00", "10:00", "Pendiente"), r(3, "10:00", "11:00", "Cancelada"), r(4, "11:00", "12:00", "Aprobada", 2), r(5, "12:00", "13:00", "Aprobada", 1, "2026-11-19")],
      1,
      "2026-11-18",
    )
    expect(lista.map((x) => x.id)).toEqual([2, 1])
  })

  it("encuentra la reserva de cada turno y prefiere la aprobada", () => {
    const dia = [r(1, "14:00", "16:00", "Pendiente"), r(2, "15:00", "16:00")]
    expect(reservaDelTurno(dia, "14:00")?.id).toBe(1)
    expect(reservaDelTurno(dia, "15:00")?.id).toBe(2)
    expect(reservaDelTurno(dia, "16:00")).toBeUndefined()
  })

  it("separa materia y descripción del motivo", () => {
    expect(separarMotivo("Taller — Rodaje en exteriores")).toEqual({ materia: "Taller", descripcion: "Rodaje en exteriores" })
    expect(separarMotivo("Sólo materia")).toEqual({ materia: "Sólo materia", descripcion: "" })
    expect(separarMotivo(undefined)).toEqual({ materia: "", descripcion: "" })
  })
})
