import { describe, expect, it, vi } from "vitest"
import { esRutaRestablecer, leerTokenDeRecuperacion, limpiarFragmento } from "./recuperacion"

const TOKEN = "q9Zx-_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789a"

describe("leerTokenDeRecuperacion", () => {
  it("lee el token del fragmento", () => {
    expect(leerTokenDeRecuperacion(`#/restablecer?token=${TOKEN}`)).toBe(TOKEN)
  })

  it("devuelve null si falta, está vacío o tiene otro formato", () => {
    expect(leerTokenDeRecuperacion("#/restablecer")).toBeNull()
    expect(leerTokenDeRecuperacion("#/restablecer?token=")).toBeNull()
    expect(leerTokenDeRecuperacion("#/restablecer?token=corto")).toBeNull()
    expect(leerTokenDeRecuperacion("#/restablecer?token=<script>alert(1)</script>aaaaaaaa")).toBeNull()
    expect(leerTokenDeRecuperacion(`#/otra?token=${TOKEN}`)).toBeNull()
    expect(leerTokenDeRecuperacion("")).toBeNull()
  })
})

describe("esRutaRestablecer", () => {
  it("reconoce la ruta con o sin token", () => {
    expect(esRutaRestablecer("#/restablecer")).toBe(true)
    expect(esRutaRestablecer(`#/restablecer?token=${TOKEN}`)).toBe(true)
    expect(esRutaRestablecer("#/restablecerX")).toBe(false)
    expect(esRutaRestablecer("")).toBe(false)
  })
})

describe("limpiarFragmento", () => {
  it("reemplaza la entrada del historial sin el fragmento", () => {
    const replaceState = vi.fn()
    limpiarFragmento({ pathname: "/app", search: "?x=1" }, { replaceState })
    expect(replaceState).toHaveBeenCalledWith(null, "", "/app?x=1")
  })
})
