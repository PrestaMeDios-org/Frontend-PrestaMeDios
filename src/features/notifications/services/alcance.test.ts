import { describe, expect, it } from "vitest"
import {
  construirAlta,
  construirEdicion,
  formDesdeComunicado,
  formVacio,
  mostrarSelectorAlcance,
  puedeGestionar,
  validarComunicado,
  type ComunicadoForm,
} from "./alcance"
import { toComunicado } from "./mappers"

const AHORA = new Date("2026-11-07T12:00:00-03:00")
const valido = (p: Partial<ComunicadoForm> = {}): ComunicadoForm => ({
  ...formVacio(),
  titulo: "Cierre por feriado",
  contenido: "El lunes el laboratorio está cerrado.",
  ...p,
})

describe("selector de alcance (NTF-25)", () => {
  it("sólo lo ve el SUPERADMIN", () => {
    expect(mostrarSelectorAlcance("SUPERADMIN")).toBe(true)
    for (const rol of ["ADMIN_LOCAL", "DOCENTE", "ESTUDIANTE"] as const) {
      expect(mostrarSelectorAlcance(rol)).toBe(false)
    }
  })

  it("es obligatorio para el SUPERADMIN en el alta, no en la edición", () => {
    expect(validarComunicado(valido(), "SUPERADMIN", "alta", AHORA).alcance).toBeDefined()
    expect(validarComunicado(valido({ alcance: "GLOBAL" }), "SUPERADMIN", "alta", AHORA)).toEqual({})
    expect(validarComunicado(valido(), "SUPERADMIN", "edicion", AHORA)).toEqual({})
    expect(validarComunicado(valido(), "ADMIN_LOCAL", "alta", AHORA)).toEqual({})
  })
})

describe("validarComunicado (PRE-04)", () => {
  it("marca título y contenido obligatorios", () => {
    const e = validarComunicado(formVacio(), "ADMIN_LOCAL", "alta", AHORA)
    expect(e.titulo).toBe("El título es obligatorio.")
    expect(e.contenido).toBe("El contenido es obligatorio.")
  })

  it("controla los largos", () => {
    expect(validarComunicado(valido({ titulo: "ab" }), "ADMIN_LOCAL", "alta", AHORA).titulo).toMatch(/Mínimo/)
    expect(validarComunicado(valido({ titulo: "x".repeat(151) }), "ADMIN_LOCAL", "alta", AHORA).titulo).toMatch(/Máximo/)
    expect(validarComunicado(valido({ contenido: "x".repeat(5001) }), "ADMIN_LOCAL", "alta", AHORA).contenido).toMatch(/Máximo/)
  })

  it("exige un vencimiento futuro", () => {
    expect(validarComunicado(valido({ venceEn: "2026-11-07T11:00" }), "ADMIN_LOCAL", "alta", AHORA).vence_en).toMatch(/futura/)
    expect(validarComunicado(valido({ venceEn: "2026-11-08T09:00" }), "ADMIN_LOCAL", "alta", AHORA)).toEqual({})
  })
})

describe("construirAlta", () => {
  it("el ADMIN_LOCAL nunca envía sede ni alcance", () => {
    expect(construirAlta(valido({ alcance: "Río Grande" }), "ADMIN_LOCAL")).toEqual({
      titulo: "Cierre por feriado",
      contenido: "El lunes el laboratorio está cerrado.",
      vence_en: null,
    })
  })

  it("el SUPERADMIN envía la sede o es_global", () => {
    expect(construirAlta(valido({ alcance: "Río Grande" }), "SUPERADMIN").sede).toBe("Río Grande")
    const global = construirAlta(valido({ alcance: "GLOBAL", venceEn: "2026-11-20T09:00" }), "SUPERADMIN")
    expect(global.es_global).toBe(true)
    expect(global.sede).toBeUndefined()
    expect(global.vence_en).toBe("2026-11-20T09:00:00-03:00")
  })
})

describe("construirEdicion", () => {
  const original = toComunicado({
    id: 1,
    titulo: "Cierre por feriado",
    contenido: "Texto",
    sede: "Ushuaia",
    es_global: false,
    estado: "PUBLICADO",
    vigente: true,
    autor: null,
    publicado_en: "2026-11-07T10:00:00-03:00",
    vence_en: "2026-11-20T09:00:00-03:00",
    actualizado_en: "2026-11-07T10:00:00-03:00",
  })

  it("sin cambios no envía nada", () => {
    expect(construirEdicion(formDesdeComunicado(original), original)).toEqual({})
  })

  it("envía sólo lo que cambió y null para quitar el vencimiento", () => {
    const form = { ...formDesdeComunicado(original), titulo: "Nuevo", venceEn: "" }
    expect(construirEdicion(form, original)).toEqual({ titulo: "Nuevo", vence_en: null })
  })
})

describe("puedeGestionar (RN-N5)", () => {
  it("el ADMIN_LOCAL no gestiona globales; el SUPERADMIN sí; el resto nunca", () => {
    expect(puedeGestionar("ADMIN_LOCAL", { esGlobal: false })).toBe(true)
    expect(puedeGestionar("ADMIN_LOCAL", { esGlobal: true })).toBe(false)
    expect(puedeGestionar("SUPERADMIN", { esGlobal: true })).toBe(true)
    expect(puedeGestionar("ESTUDIANTE", { esGlobal: false })).toBe(false)
  })
})
