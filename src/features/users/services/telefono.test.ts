import { describe, expect, it } from "vitest"
import {
  necesitaTelefono,
  TELEFONO_FORMATO,
  TELEFONO_NO_VACIO,
  TELEFONO_OBLIGATORIO,
  validarCambioTelefono,
  validarTelefono,
} from "./telefono"

describe("validarTelefono (SPEC-09 RN-86, AC-121)", () => {
  it("es obligatorio", () => {
    expect(validarTelefono("")).toBe(TELEFONO_OBLIGATORIO)
    expect(validarTelefono("   ")).toBe(TELEFONO_OBLIGATORIO)
  })

  it("respeta el formato del backend", () => {
    expect(validarTelefono("+54 2901 555123")).toBeNull()
    expect(validarTelefono(" 2964-400100 ")).toBeNull()
    expect(validarTelefono("12345")).toBe(TELEFONO_FORMATO)
    expect(validarTelefono("tel 2901")).toBe(TELEFONO_FORMATO)
  })
})

describe("validarCambioTelefono (RN-87, RN-88)", () => {
  it("no deja borrar un teléfono cargado", () => {
    expect(validarCambioTelefono("", "+54 2901 555123")).toBe(TELEFONO_NO_VACIO)
  })

  it("una cuenta sin teléfono puede dejarlo vacío al guardar otros datos", () => {
    expect(validarCambioTelefono("", null)).toBeNull()
  })

  it("valida el formato sólo si cambió", () => {
    expect(validarCambioTelefono("+54 2901 555123", "+54 2901 555123")).toBeNull()
    expect(validarCambioTelefono("abc123", "+54 2901 555123")).toBe(TELEFONO_FORMATO)
    expect(validarCambioTelefono("2964 111222", null)).toBeNull()
  })
})

describe("necesitaTelefono", () => {
  it("avisa sólo a las cuentas sin teléfono", () => {
    expect(necesitaTelefono({ telefono: null })).toBe(true)
    expect(necesitaTelefono({ telefono: "" })).toBe(true)
    expect(necesitaTelefono({ telefono: "+54 2901 555123" })).toBe(false)
    expect(necesitaTelefono(null)).toBe(false)
  })
})
