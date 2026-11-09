import { apiRequest } from "../../lib/api"
import type {
  CambioPasswordDTO,
  PerfilUpdateDTO,
  RegistroDTO,
  TokenResponseDTO,
  UsuarioPublicoDTO,
} from "./types"

const BASE = "/api/v1/auth"

export const login = (email: string, password: string) =>
  apiRequest<TokenResponseDTO>(`${BASE}/login`, {
    method: "POST",
    json: { email, password },
    auth: false,
  })

export const registrar = (datos: RegistroDTO) =>
  apiRequest<UsuarioPublicoDTO>(`${BASE}/register`, { method: "POST", json: datos, auth: false })

export const obtenerMe = () => apiRequest<UsuarioPublicoDTO>(`${BASE}/me`)

export const actualizarMe = (datos: PerfilUpdateDTO) =>
  apiRequest<UsuarioPublicoDTO>(`${BASE}/me`, { method: "PATCH", json: datos })

export const cambiarPassword = (datos: CambioPasswordDTO) =>
  apiRequest<TokenResponseDTO>(`${BASE}/me/password`, { method: "POST", json: datos })

// ─── Recuperación de contraseña (SPEC-03 §5.3, USR-02) ───────────────────────
// Públicos: no llevan token. La respuesta del pedido es siempre neutra (RN-44).

export const solicitarRecuperacion = (email: string) =>
  apiRequest<{ detail: string }>(`${BASE}/recuperacion`, { method: "POST", json: { email }, auth: false })

export const confirmarRecuperacion = (token: string, password_nueva: string) =>
  apiRequest<{ detail: string }>(`${BASE}/recuperacion/confirmar`, {
    method: "POST",
    json: { token, password_nueva },
    auth: false,
  })

