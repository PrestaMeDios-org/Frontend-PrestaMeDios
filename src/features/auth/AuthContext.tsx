import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { onSessionExpired, tokenStore } from "../../lib/api"
import * as authApi from "./authApi"
import {
  crearRegistroActividad,
  debeRenovar,
  INTERVALO_REVISION_MS,
  leerTiemposToken,
  vencido,
} from "./renovacion"
import type { Sede, TokenResponseDTO, UsuarioPublicoDTO } from "./types"

// ─── Sesión (SPEC-02 §6.1) ────────────────────────────────────────────────────
interface AuthValue {
  usuario: UsuarioPublicoDTO | null
  cargando: boolean
  /** Mensaje para la pantalla de login (p. ej. "Tu sesión expiró"). */
  aviso: string | null
  login: (email: string, password: string) => Promise<void>
  logout: (aviso?: string) => void
  /** Aplica una respuesta con token nuevo (cambio de contraseña, renovación, cerrar sesiones). */
  aplicarToken: (respuesta: TokenResponseDTO) => void
  setUsuario: (u: UsuarioPublicoDTO) => void
}

const AuthCtx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublicoDTO | null>(null)
  const [cargando, setCargando] = useState(() => tokenStore.get() !== null)
  const [aviso, setAviso] = useState<string | null>(null)

  const logout = useCallback((mensaje?: string) => {
    tokenStore.clear()
    setUsuario(null)
    setAviso(mensaje ?? null)
  }, [])

  // Rehidratación al recargar la página (AC-50).
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .obtenerMe()
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false))
  }, [])

  // Cierre de sesión ante un 401 TOKEN_* en cualquier pantalla (AC-53).
  useEffect(
    () =>
      onSessionExpired((error) =>
        logout(
          error.code === "TOKEN_EXPIRADO"
            ? "Tu sesión expiró. Iniciá sesión nuevamente."
            : error.code === "TOKEN_REVOCADO"
              ? "Tu sesión fue cerrada por un cambio en tu cuenta. Iniciá sesión nuevamente."
              : error.code === "TOKEN_SESION_MAXIMA"
                ? "Pasó el tiempo máximo de la sesión. Iniciá sesión nuevamente."
                : "Tu sesión ya no es válida. Iniciá sesión nuevamente.",
        ),
      ),
    [logout],
  )

  const aplicarToken = useCallback((respuesta: TokenResponseDTO) => {
    tokenStore.set(respuesta.access_token)
    setUsuario(respuesta.usuario)
    setAviso(null)
  }, [])

  // Renovación deslizante (SPEC-03 §7, RN-70): con actividad reciente, el token se
  // cambia por uno nuevo poco antes de vencer; sin actividad, vence y se vuelve al login.
  const haySesion = usuario !== null
  useEffect(() => {
    if (!haySesion) return
    const actividad = crearRegistroActividad()
    const dejarDeEscuchar = actividad.escuchar(window)
    let renovando = false

    const revisar = () => {
      const token = tokenStore.get()
      const tiempos = token ? leerTiemposToken(token) : null
      if (!tiempos || renovando) return
      const ahora = Date.now()
      if (vencido(tiempos, ahora)) {
        logout("Tu sesión expiró por inactividad. Iniciá sesión nuevamente.")
        return
      }
      if (!debeRenovar(tiempos, actividad.ultima(), ahora)) return
      renovando = true
      authApi
        .renovarSesion()
        // Si mientras tanto se cerró la sesión o cambió el token, no se pisa.
        .then((respuesta) => tokenStore.get() === token && aplicarToken(respuesta))
        // Un 401 TOKEN_* ya cierra la sesión (onSessionExpired); un error de red se
        // reintenta en la próxima revisión.
        .catch(() => undefined)
        .finally(() => {
          renovando = false
        })
    }

    const intervalo = window.setInterval(revisar, INTERVALO_REVISION_MS)
    // Al volver a la pestaña: los navegadores demoran los temporizadores en segundo plano.
    document.addEventListener("visibilitychange", revisar)
    return () => {
      window.clearInterval(intervalo)
      document.removeEventListener("visibilitychange", revisar)
      dejarDeEscuchar()
    }
  }, [haySesion, logout, aplicarToken])

  const login = useCallback(
    async (email: string, password: string) => {
      aplicarToken(await authApi.login(email, password))
    },
    [aplicarToken],
  )

  const value = useMemo(
    () => ({ usuario, cargando, aviso, login, logout, aplicarToken, setUsuario }),
    [usuario, cargando, aviso, login, logout, aplicarToken],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}

/** Usuario autenticado (sólo dentro de la app, con sesión). */
export function useUsuario(): UsuarioPublicoDTO {
  const { usuario } = useAuth()
  if (!usuario) throw new Error("No hay sesión activa")
  return usuario
}

// ─── Sede vista (GLO-01) ──────────────────────────────────────────────────────
// SUPERADMIN elige "Ushuaia", "Río Grande" o ambas (`null`); el resto, su sede fija.
interface SedeValue {
  sedeVista: Sede | null
  puedeElegir: boolean
  setSedeVista: (s: Sede | null) => void
}

const SedeCtx = createContext<SedeValue | null>(null)

export function SedeProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuario()
  const puedeElegir = usuario.rol === "SUPERADMIN"
  const [elegida, setElegida] = useState<Sede | null>(null)
  const value = useMemo(
    () => ({
      sedeVista: puedeElegir ? elegida : usuario.sede,
      puedeElegir,
      setSedeVista: (s: Sede | null) => puedeElegir && setElegida(s),
    }),
    [puedeElegir, elegida, usuario.sede],
  )
  return <SedeCtx.Provider value={value}>{children}</SedeCtx.Provider>
}

export function useSede(): SedeValue {
  const ctx = useContext(SedeCtx)
  if (!ctx) throw new Error("useSede debe usarse dentro de <SedeProvider>")
  return ctx
}
