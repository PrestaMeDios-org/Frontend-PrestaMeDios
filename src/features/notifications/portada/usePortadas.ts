// MOMENTÁNEO (SPEC-10 M-02): portadas elegidas de los comunicados visibles, y la URL local
// de una foto (se baja con el token como Blob, igual que `useArchivoUrl`).
import { useEffect, useState } from "react"
import { descargarPortada, listarPortadas, type PortadaDTO } from "./portadaApi"

/** `version` cambia después de guardar, para volver a pedirlas aunque los ids sean los mismos. */
export function usePortadas(ids: number[], version = 0): Map<number, PortadaDTO> {
  const [portadas, setPortadas] = useState<Map<number, PortadaDTO>>(new Map())
  const clave = ids.join(",")
  useEffect(() => {
    if (!clave) {
      setPortadas(new Map())
      return
    }
    const ac = new AbortController()
    listarPortadas(clave.split(",").map(Number), ac.signal)
      .then((lista) => setPortadas(new Map(lista.map((p) => [p.comunicado_id, p]))))
      .catch(() => {
        if (!ac.signal.aborted) setPortadas(new Map()) // sin portadas: queda el color automático
      })
    return () => ac.abort()
  }, [clave, version])
  return portadas
}

/** `version` (p. ej. `actualizado_en`) fuerza a bajarla de nuevo cuando cambia. */
export function usePortadaUrl(id: number | null, version?: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(null)
    if (id === null) return
    let vigente = true
    let creada: string | null = null
    descargarPortada(id)
      .then((blob) => {
        if (!vigente) return
        creada = URL.createObjectURL(blob)
        setUrl(creada)
      })
      .catch(() => vigente && setUrl(null))
    return () => {
      vigente = false
      if (creada) URL.revokeObjectURL(creada)
    }
  }, [id, version])
  return url
}
