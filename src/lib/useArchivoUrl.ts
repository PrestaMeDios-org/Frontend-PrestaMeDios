import { useEffect, useState } from "react"
import { descargarArchivo } from "./api"

/**
 * URL local (`blob:`) de un archivo de `files`, descargado con `Authorization` (SPEC-03 §6.6).
 *
 * La URL se libera con `URL.revokeObjectURL` al cambiar el id o al desmontar. Si la
 * descarga falla (p. ej. `404`), devuelve `null` y quien la usa muestra un respaldo.
 */
export function useArchivoUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    setUrl(null)
    if (!id) return
    let vigente = true
    let creada: string | null = null
    descargarArchivo(id)
      .then((blob) => {
        if (!vigente) return
        creada = URL.createObjectURL(blob)
        setUrl(creada)
      })
      .catch(() => {
        if (vigente) setUrl(null)
      })
    return () => {
      vigente = false
      if (creada) URL.revokeObjectURL(creada)
    }
  }, [id])

  return url
}
