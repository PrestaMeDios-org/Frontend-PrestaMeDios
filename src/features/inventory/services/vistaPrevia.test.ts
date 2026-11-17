import { describe, expect, it } from "vitest"
import { equipoVacio, unidadVacia } from "./altas"
import { equipoDePrevia, filasDePrevia, MUESTRA } from "./vistaPrevia"

describe("vista previa del alta de equipo (SPEC-10 V-15)", () => {
  it("usa textos de muestra mientras los campos están vacíos", () => {
    const eq = equipoDePrevia(equipoVacio(), [])
    expect(eq.code).toBe(MUESTRA.codigo)
    expect(eq.name).toBe(MUESTRA.nombre)
    expect(eq.specs).toBe(MUESTRA.descripcion)
    expect(eq.image).toBe("")
    expect(eq.quantity).toBe(0)
  })

  it("pasa lo escrito a la tarjeta y cuenta las unidades cargadas", () => {
    const form = {
      ...equipoVacio(),
      codigo: " CAM-010 ",
      nombre: "Cámara Canon EOS R6",
      descripcion: "Full frame",
      imagenUrl: "https://ejemplo.com/foto.jpg",
      altaGama: true,
      unidades: [unidadVacia(), unidadVacia()],
    }
    const eq = equipoDePrevia(form, [])
    expect(eq).toMatchObject({ code: "CAM-010", name: "Cámara Canon EOS R6", specs: "Full frame", altaGama: true })
    expect(eq.image).toBe("https://ejemplo.com/foto.jpg")
    expect([eq.quantity, eq.available_count]).toEqual([2, 2])
  })

  it("no muestra una imagen que todavía no es una URL", () => {
    expect(equipoDePrevia({ ...equipoVacio(), imagenUrl: "https://" }, []).image).toBe("")
    expect(equipoDePrevia({ ...equipoVacio(), imagenUrl: "foto.jpg" }, []).image).toBe("")
  })

  it("arma las filas como Control de Stock, con la sede propia si no se elige", () => {
    const filas = filasDePrevia(
      [
        { serie: "SN1", codigoInventario: "INV-1", locker: "3", sede: "" },
        { serie: "", codigoInventario: "", locker: "", sede: "Ushuaia" },
      ],
      "Río Grande",
    )
    expect(filas).toEqual([
      { codigo: "INV-1", serie: "SN1", sede: "Río Grande", locker: "3" },
      { codigo: "—", serie: "—", sede: "Ushuaia", locker: "—" },
    ])
  })
})
