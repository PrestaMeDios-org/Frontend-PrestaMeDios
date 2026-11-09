// ─── Foto de perfil: aviso previo de tipo y tamaño (SPEC-03 §6.6) ─────────────
// El backend decide por los bytes (RN-55) y corta por tamaño (RN-56); esto sólo evita
// subir algo que va a ser rechazado y explica por qué.

export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const
export const FOTO_MAX_MB = 2
export const FOTO_ACCEPT = FOTO_TIPOS.join(",")

/** Mensaje de error para mostrar, o `null` si el archivo parece válido. */
export function validarFoto(archivo: Pick<File, "type" | "size">): string | null {
  if (!(FOTO_TIPOS as readonly string[]).includes(archivo.type)) {
    return "La foto tiene que ser JPEG, PNG o WebP."
  }
  if (archivo.size > FOTO_MAX_MB * 1024 * 1024) {
    return `La foto supera el tamaño máximo de ${FOTO_MAX_MB} MB.`
  }
  if (archivo.size === 0) return "El archivo está vacío."
  return null
}
