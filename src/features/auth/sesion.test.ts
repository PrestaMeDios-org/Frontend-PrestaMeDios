import { describe, expect, it } from "vitest"
import { esDuenoDelToken, leerClaimsToken, leerIdentidadToken } from "./sesion"

function jwt(claims: unknown): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.firma`
}

const SID = "4459918f-8e23-44fd-a28b-35f166f657c7"

describe("leerClaimsToken", () => {
  it("devuelve los claims de un token bien formado", () => {
    expect(leerClaimsToken(jwt({ sub: "7", iat: 10 }))).toEqual({ sub: "7", iat: 10 })
  })

  it("devuelve null si el token no tiene la forma esperada", () => {
    expect(leerClaimsToken("")).toBeNull()
    expect(leerClaimsToken("a.b")).toBeNull()
    expect(leerClaimsToken("a.%%%.c")).toBeNull()
    expect(leerClaimsToken(jwt([1, 2]))).toBeNull()
    expect(leerClaimsToken(jwt("texto"))).toBeNull()
  })
})

describe("leerIdentidadToken", () => {
  it("lee sub como número y sid", () => {
    expect(leerIdentidadToken(jwt({ sub: "7", sid: SID }))).toEqual({ sub: 7, sid: SID })
  })

  it("un token sin sid (anterior a SPEC-12 Fase B) da sid null", () => {
    expect(leerIdentidadToken(jwt({ sub: "7" }))).toEqual({ sub: 7, sid: null })
  })

  it("devuelve null sin un sub numérico", () => {
    expect(leerIdentidadToken(jwt({ sid: SID }))).toBeNull()
    expect(leerIdentidadToken(jwt({ sub: 7 }))).toBeNull()
    expect(leerIdentidadToken(jwt({ sub: "7a" }))).toBeNull()
    expect(leerIdentidadToken(jwt({ sub: "" }))).toBeNull()
    expect(leerIdentidadToken("no-es-un-token")).toBeNull()
  })
})

describe("esDuenoDelToken (SPEC-12 RN-92)", () => {
  it("acepta el /auth/me del dueño del token", () => {
    expect(esDuenoDelToken(7, jwt({ sub: "7" }))).toBe(true)
  })

  it("rechaza el /auth/me de otro usuario, como el que devolvía la caché", () => {
    expect(esDuenoDelToken(6, jwt({ sub: "7" }))).toBe(false)
  })

  it("rechaza si el token no se puede leer", () => {
    expect(esDuenoDelToken(7, "a.b")).toBe(false)
  })
})
