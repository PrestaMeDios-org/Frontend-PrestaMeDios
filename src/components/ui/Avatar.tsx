import { useArchivoUrl } from "../../lib/useArchivoUrl"
import { useC } from "../../theme"

/**
 * Avatar con la foto de perfil (USR-03) o, si no hay o no se pudo descargar, las iniciales.
 * La foto se baja con `Authorization` y se muestra como `blob:` (SPEC-03 §6.6).
 */
export function Avatar({
  fotoId,
  initials,
  size = 36,
  radius = 9,
}: {
  fotoId: string | null | undefined
  initials: string
  size?: number
  radius?: number
}) {
  const C = useC()
  const url = useArchivoUrl(fotoId)
  const base = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
  } as const

  if (url) {
    return <img src={url} alt="Foto de perfil" style={{ ...base, objectFit: "cover", display: "block" }} />
  }
  return (
    <span
      aria-hidden
      style={{
        ...base,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.crimsonLight,
        color: C.crimson,
        fontFamily: "'Outfit',sans-serif",
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials}
    </span>
  )
}
