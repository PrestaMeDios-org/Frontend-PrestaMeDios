// ─── Renovación deslizante de la sesión (SPEC-03 §7, RN-70) ───────────────────
// El access token dura poco (30 min) y se cambia por uno nuevo con
// `POST /auth/renovar` sólo si el usuario estuvo usando la aplicación. Sin actividad,
// el token vence y se vuelve al login. El token sigue en `sessionStorage` (ADR-015).

/** Cuánto antes del vencimiento se renueva, como máximo. */
export const MARGEN_RENOVACION_MS = 5 * 60_000
/** Actividad que cuenta para renovar: la de los últimos minutos. */
export const VENTANA_ACTIVIDAD_MS = 10 * 60_000
/** Cada cuánto se revisa el token. */
export const INTERVALO_REVISION_MS = 20_000

export interface TiemposToken {
  /** Emisión (`iat`), en milisegundos. */
  emitido: number
  /** Vencimiento (`exp`), en milisegundos. */
  vence: number
}

/** `iat` y `exp` del token, sin verificar la firma (eso lo hace el backend). */
export function leerTiemposToken(token: string): TiemposToken | null {
  const partes = token.split(".")
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/")
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const claims: unknown = JSON.parse(atob(relleno))
    if (!claims || typeof claims !== "object") return null
    const { iat, exp } = claims as { iat?: unknown; exp?: unknown }
    if (typeof iat !== "number" || typeof exp !== "number" || exp <= iat) return null
    return { emitido: iat * 1000, vence: exp * 1000 }
  } catch {
    return null
  }
}

/**
 * ¿Hay que renovar ahora? Sí cuando el token todavía vale, le queda poco y hubo actividad
 * reciente (RN-70). El margen es el menor entre 5 minutos y la mitad de la vida del token,
 * y la ventana de actividad, el menor entre 10 minutos y esa vida: así un token corto
 * (de prueba) no se renueva en cada revisión ni por actividad anterior a su emisión.
 */
export function debeRenovar(token: TiemposToken, ultimaActividad: number, ahora: number): boolean {
  const restante = token.vence - ahora
  if (restante <= 0) return false
  const vida = token.vence - token.emitido
  const margen = Math.min(MARGEN_RENOVACION_MS, vida / 2)
  const ventana = Math.min(VENTANA_ACTIVIDAD_MS, vida)
  return restante <= margen && ahora - ultimaActividad <= ventana
}

/** ¿El token ya venció? Entonces la sesión terminó por inactividad. */
export function vencido(token: TiemposToken, ahora: number): boolean {
  return ahora >= token.vence
}

// ─── Registro de actividad ────────────────────────────────────────────────────

const EVENTOS_ACTIVIDAD = ["keydown", "pointerdown", "pointermove", "wheel", "touchstart", "hashchange", "popstate"] as const

export interface RegistroActividad {
  /** Momento de la última actividad, en milisegundos. */
  ultima: () => number
  registrar: () => void
  /** Escucha teclado, mouse, toque y navegación en `destino`. Devuelve la desuscripción. */
  escuchar: (destino: Pick<EventTarget, "addEventListener" | "removeEventListener">) => () => void
}

/** Registro de la última actividad del usuario. Empieza con actividad en `reloj()`. */
export function crearRegistroActividad(reloj: () => number = Date.now): RegistroActividad {
  let ultima = reloj()
  const registrar = () => {
    ultima = reloj()
  }
  return {
    ultima: () => ultima,
    registrar,
    escuchar: (destino) => {
      const opciones = { passive: true, capture: true }
      EVENTOS_ACTIVIDAD.forEach((e) => destino.addEventListener(e, registrar, opciones))
      return () => EVENTOS_ACTIVIDAD.forEach((e) => destino.removeEventListener(e, registrar, opciones))
    },
  }
}
