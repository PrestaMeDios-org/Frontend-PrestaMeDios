import { describe, expect, it } from "vitest"
import { errorPassword, esAdmin, iniciales, uiRole } from "./roles"
import { validarRegistro } from "./pages/RegisterPage"
import { convertirValor } from "../config/services/configApi"

describe("roles", () => {
  it("deriva el rol de UI sin el rol icse (D-07)", () => {
    expect(uiRole("ESTUDIANTE")).toBe("student")
    expect(uiRole("DOCENTE")).toBe("teacher")
    expect(uiRole("ADMIN_LOCAL")).toBe("admin")
    expect(uiRole("SUPERADMIN")).toBe("admin")
    expect(esAdmin("DOCENTE")).toBe(false)
    expect(iniciales("lucía", "pérez")).toBe("LP")
  })

  it("replica la política de contraseña del backend (RN-03)", () => {
    expect(errorPassword("abcdefgh")).not.toBeNull()
    expect(errorPassword("1234567")).not.toBeNull()
    expect(errorPassword("ana2026@x.com", "Ana2026@x.com")).not.toBeNull()
    expect(errorPassword("Camara2026!")).toBeNull()
    expect(errorPassword("Cámara2026")).toBeNull()
  })
})

describe("validarRegistro", () => {
  const base = {
    email: "lucia@gmail.com",
    password: "Camara2026!",
    confirmacion: "Camara2026!",
    nombre: "Lucía",
    apellido: "Pérez",
    dni: "40123456",
    telefono: "",
    rol: "ESTUDIANTE" as const,
    sede: "Ushuaia" as const,
  }
  it("acepta datos válidos", () => expect(validarRegistro(base)).toEqual({}))
  it("marca los campos inválidos", () => {
    const e = validarRegistro({ ...base, dni: "40.123.456", confirmacion: "otra", email: "x" })
    expect(Object.keys(e).sort()).toEqual(["confirmacion", "dni", "email"])
  })
})

describe("convertirValor (RN-19)", () => {
  it("respeta el tipo del parámetro", () => {
    expect(convertirValor("ENTERO", "4")).toBe(4)
    expect(convertirValor("ENTERO", "4.5")).toBeNull()
    expect(convertirValor("HORA", "09:00")).toBe("09:00")
    expect(convertirValor("HORA", "9:00")).toBeNull()
    expect(convertirValor("BOOLEANO", "true")).toBe(true)
    expect(convertirValor("DECIMAL", "1.5")).toBe(1.5)
    expect(convertirValor("TEXTO", "")).toBeNull()
  })
})
