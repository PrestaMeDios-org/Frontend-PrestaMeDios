// ─── Identidad de la sesión de esta pestaña (SPEC-12) ─────────────────────────
// Lee los claims del token sin verificar la firma (eso lo hace el backend): sirve para
// comparar lo que muestra la interfaz con el dueño del token de la pestaña.

/** Claims del JWT, o `null` si el token no tiene la forma `cabecera.claims.firma`. */
export function leerClaimsToken(token: string): Record<string, unknown> | null {
  const partes = token.split(".")
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/")
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const claims: unknown = JSON.parse(atob(relleno))
    return claims && typeof claims === "object" && !Array.isArray(claims)
      ? (claims as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

export interface IdentidadToken {
  /** Id del usuario dueño del token (`sub`). */
  sub: number
  /** Identificador de la sesión (`sid`); `null` en tokens anteriores a SPEC-12 Fase B. */
  sid: string | null
}

/** `sub` (id del usuario) y `sid` del token, o `null` si el token no los trae bien. */
export function leerIdentidadToken(token: string): IdentidadToken | null {
  const claims = leerClaimsToken(token)
  if (!claims || typeof claims.sub !== "string" || !/^\d+$/.test(claims.sub)) return null
  return { sub: Number(claims.sub), sid: typeof claims.sid === "string" ? claims.sid : null }
}

/**
 * ¿El usuario que devolvió `/auth/me` es el dueño del token de esta pestaña? (SPEC-12
 * RN-92). Si no lo es, la respuesta vino de una caché o de un proxy y no se usa.
 */
export function esDuenoDelToken(usuarioId: number, token: string): boolean {
  return leerIdentidadToken(token)?.sub === usuarioId
}
