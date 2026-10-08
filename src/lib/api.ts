// ─── Cliente HTTP compartido (SPEC-02 §6.1) ───────────────────────────────────
// - URL base desde VITE_API_URL.
// - Agrega `Authorization: Bearer <token>` si hay sesión.
// - Normaliza errores a `ApiError` (negocio `{detail, code}` y validación 422 de FastAPI).
// - Ante un 401 de sesión inválida avisa a los suscriptores (cierre de sesión global).

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "")

// ─── Token (sessionStorage, SPEC-02 D-06) ─────────────────────────────────────
const TOKEN_KEY = "prestamedios.token"
const memoria = new Map<string, string>()
const storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> =
  typeof sessionStorage !== "undefined"
    ? sessionStorage
    : {
        getItem: (k) => memoria.get(k) ?? null,
        setItem: (k, v) => void memoria.set(k, v),
        removeItem: (k) => void memoria.delete(k),
      }

export const tokenStore = {
  get: (): string | null => storage.getItem(TOKEN_KEY),
  set: (token: string): void => storage.setItem(TOKEN_KEY, token),
  clear: (): void => storage.removeItem(TOKEN_KEY),
}

// ─── Errores ──────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  /** Errores de validación por campo (422 de FastAPI). */
  readonly campos: Record<string, string>
  /** Datos adicionales del backend (p. ej. `suspendido_hasta`, `version_actual`). */
  readonly extra: Record<string, unknown>

  constructor(
    status: number,
    message: string,
    code?: string,
    campos: Record<string, string> = {},
    extra: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.campos = campos
    this.extra = extra
  }
}

type ErrorValidacion = { loc?: (string | number)[]; msg?: string }

const limpiarMensaje = (msg: string) => msg.replace(/^Value error, /, "")

/** Convierte una respuesta no exitosa en `ApiError`. */
export async function parseError(res: Response): Promise<ApiError> {
  const texto = await res.text().catch(() => "")
  let body: unknown = null
  try {
    body = texto ? JSON.parse(texto) : null
  } catch {
    body = null
  }

  if (body && typeof body === "object" && "detail" in body) {
    const { detail, code, ...extra } = body as {
      detail: unknown
      code?: string
      [k: string]: unknown
    }
    if (typeof detail === "string") {
      return new ApiError(res.status, detail, code, {}, extra)
    }
    if (Array.isArray(detail)) {
      const campos: Record<string, string> = {}
      const generales: string[] = []
      for (const item of detail as ErrorValidacion[]) {
        const msg = limpiarMensaje(item.msg ?? "Valor inválido.")
        const loc = (item.loc ?? []).filter((p) => p !== "body" && p !== "query")
        const campo = loc.length ? String(loc[loc.length - 1]) : ""
        if (campo && !campos[campo]) campos[campo] = msg
        else if (!campo) generales.push(msg)
      }
      const mensaje = generales[0] ?? "Revisá los datos ingresados."
      return new ApiError(res.status, mensaje, "VALIDACION", campos)
    }
  }
  return new ApiError(res.status, texto || `Error ${res.status}`)
}

// ─── Sesión expirada ──────────────────────────────────────────────────────────
type Listener = (error: ApiError) => void
const listeners = new Set<Listener>()

/** Suscribe una función a los cierres de sesión forzados. Devuelve la desuscripción. */
export function onSessionExpired(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** ¿El error indica que la sesión actual dejó de ser válida? (no confundir con login fallido) */
export function esSesionInvalida(error: ApiError, teniaToken: boolean): boolean {
  if (error.status !== 401) return false
  if (error.code?.startsWith("TOKEN_")) return true
  return error.code === "NO_AUTENTICADO" && teniaToken
}

// ─── Request ──────────────────────────────────────────────────────────────────
export type ApiInit = Omit<RequestInit, "body"> & {
  /** Cuerpo serializado como JSON. */
  json?: unknown
  /** `false` para no enviar el token (login, registro). */
  auth?: boolean
}

export async function apiRequest<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, auth = true, headers, ...rest } = init
  const token = auth ? tokenStore.get() : null
  const url = /^https?:\/\//.test(path) ? path : `${API_URL}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    })
  } catch {
    throw new ApiError(
      0,
      "No se pudo conectar con el servidor. Verificá que el backend esté levantado.",
      "SIN_CONEXION",
    )
  }

  if (!res.ok) {
    const error = await parseError(res)
    if (esSesionInvalida(error, token !== null)) listeners.forEach((fn) => fn(error))
    throw error
  }

  if (res.status === 204) return undefined as T
  const texto = await res.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

/** Mensaje legible de cualquier error. */
export function mensajeDeError(e: unknown, porDefecto = "Ocurrió un error inesperado."): string {
  if (e instanceof Error && e.message) return e.message
  return porDefecto
}
