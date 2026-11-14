/**
 * Teléfono obligatorio (USR-05, SPEC-09 Fase B). Mismo formato que el backend
 * (`Telefono` en `users/schemas.py`): dígitos, espacios, guiones y un + inicial.
 */
export const TELEFONO_RE = /^\+?[0-9 -]{6,20}$/

export const TELEFONO_OBLIGATORIO = "El teléfono es obligatorio."
export const TELEFONO_NO_VACIO = "El teléfono no puede quedar vacío."
export const TELEFONO_FORMATO = "Sólo números, espacios, guiones y + inicial."

/** Alta y registro: obligatorio y con formato (RN-86). */
export function validarTelefono(texto: string): string | null {
  const t = texto.trim()
  if (!t) return TELEFONO_OBLIGATORIO
  return TELEFONO_RE.test(t) ? null : TELEFONO_FORMATO
}

/**
 * Edición (Mi perfil y edición administrativa): el teléfono se cambia pero no se
 * borra (RN-88). Una cuenta anterior a SPEC-09 sin teléfono puede guardar otros
 * datos dejándolo vacío (RN-87): sólo se valida si cambió.
 */
export function validarCambioTelefono(texto: string, actual: string | null): string | null {
  const t = texto.trim()
  if (t === (actual ?? "")) return null
  if (!t) return TELEFONO_NO_VACIO
  return TELEFONO_RE.test(t) ? null : TELEFONO_FORMATO
}

/** Aviso no bloqueante para las cuentas sin teléfono (D-16 de SPEC-03, RN-87). */
export const necesitaTelefono = (usuario: { telefono: string | null } | null | undefined) =>
  !!usuario && !usuario.telefono?.trim()
