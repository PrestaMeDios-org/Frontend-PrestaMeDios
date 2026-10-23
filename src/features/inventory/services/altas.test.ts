import { describe, expect, it } from "vitest"
import {
  construirAlta,
  construirEdicion,
  construirUnidad,
  equipoVacio,
  formDesdeEquipo,
  parsearReglas,
  reglaSedeAlta,
  unidadVacia,
  validarEquipo,
  validarUnidad,
  type EquipoForm,
} from "./altas"

const valido = (p: Partial<EquipoForm> = {}): EquipoForm => ({
  ...equipoVacio(),
  codigo: "CAM-001",
  nombre: "Cámara",
  marca: "Sony",
  modelo: "A7",
  categoriaId: "cameras",
  ...p,
})

describe("regla de sede en el alta (INV-25)", () => {
  it("se oculta para ADMIN_LOCAL y es obligatoria para SUPERADMIN", () => {
    expect(reglaSedeAlta("ADMIN_LOCAL")).toBe("oculta")
    expect(reglaSedeAlta("SUPERADMIN")).toBe("obligatoria")
  })

  it("el SUPERADMIN debe elegir la sede de cada unidad", () => {
    const u = { ...unidadVacia(), serie: "S", codigoInventario: "I" }
    expect(validarUnidad(u, "SUPERADMIN", true).sede).toBeTruthy()
    expect(validarUnidad({ ...u, sede: "Ushuaia" }, "SUPERADMIN", true).sede).toBeUndefined()
    expect(validarUnidad(u, "ADMIN_LOCAL", true).sede).toBeUndefined()
  })

  it("sólo el SUPERADMIN envía la sede en el payload", () => {
    const u = { ...unidadVacia(), serie: "S", codigoInventario: "I", sede: "Ushuaia" as const }
    expect(construirUnidad(u, "SUPERADMIN").sede).toBe("Ushuaia")
    expect("sede" in construirUnidad(u, "ADMIN_LOCAL")).toBe(false)
  })
})

describe("validarEquipo", () => {
  it("acepta un formulario completo", () => {
    expect(validarEquipo(valido(), "ADMIN_LOCAL", "alta")).toEqual({})
  })

  it("exige los datos básicos; el código sólo en el alta", () => {
    const e = validarEquipo(equipoVacio(), "ADMIN_LOCAL", "alta")
    expect(Object.keys(e).sort()).toEqual(["categoria_id", "codigo", "marca", "modelo", "nombre"])
    expect(validarEquipo({ ...equipoVacio() }, "ADMIN_LOCAL", "edicion").codigo).toBeUndefined()
  })

  it("valida el plazo (1–15), las URLs y el locker (1–7)", () => {
    const e = validarEquipo(
      valido({
        maxDias: "16",
        imagenUrl: "ftp://x",
        videoUrl: "youtube",
        unidades: [{ serie: "S", codigoInventario: "I", locker: "8", sede: "" }],
      }),
      "ADMIN_LOCAL",
      "alta",
    )
    expect(e.max_dias_prestamo).toBeTruthy()
    expect(e.imagen_url).toBeTruthy()
    expect(e.video_url).toBeTruthy()
    expect(e["unidades.0.locker"]).toBeTruthy()
    expect(validarEquipo(valido({ maxDias: "15" }), "ADMIN_LOCAL", "alta")).toEqual({})
    expect(validarEquipo(valido({ maxDias: "0" }), "ADMIN_LOCAL", "alta").max_dias_prestamo).toBeTruthy()
  })
})

describe("construirAlta y construirEdicion", () => {
  it("arma el DTO con espacios recortados y sin plazo si se deja vacío (lo fija el backend)", () => {
    const dto = construirAlta(
      valido({
        nombre: "  Cámara  ",
        descripcion: "  ",
        reglas: "No mojar\n\n  Guardar en el estuche ",
        unidades: [{ serie: " S1 ", codigoInventario: "I1", locker: "3", sede: "" }],
      }),
      "ADMIN_LOCAL",
    )
    expect(dto).toMatchObject({
      codigo: "CAM-001",
      nombre: "Cámara",
      descripcion: null,
      reglas_cuidado: ["No mojar", "Guardar en el estuche"],
      unidades: [{ numero_serie: "S1", codigo_inventario: "I1", locker: 3 }],
    })
    expect("max_dias_prestamo" in dto).toBe(false)
  })

  it("incluye el plazo y el tipo cuando se indican", () => {
    const dto = construirAlta(valido({ maxDias: "15", esNotebook: true, altaGama: true }), "SUPERADMIN")
    expect(dto).toMatchObject({ max_dias_prestamo: 15, es_notebook: true, alta_gama: true })
  })

  it("la edición no envía código ni unidades", () => {
    const dto = construirEdicion(valido({ unidades: [unidadVacia()] }))
    expect("codigo" in dto).toBe(false)
    expect("unidades" in dto).toBe(false)
  })

  it("precarga el formulario de edición desde un ítem", () => {
    const f = formDesdeEquipo({
      code: "CAM-1",
      name: "Cámara",
      brand: "Sony",
      model: "A7",
      category: "cameras",
      specs: "4K",
      maxDays: 4,
      altaGama: true,
      esNotebook: false,
      image: "",
      careRules: ["a", "b"],
    })
    expect(f).toMatchObject({ codigo: "CAM-1", maxDias: "4", altaGama: true, reglas: "a\nb", descripcion: "4K" })
  })

  it("parsearReglas ignora líneas vacías", () => {
    expect(parsearReglas("\n a \n\n b\n")).toEqual(["a", "b"])
  })
})
