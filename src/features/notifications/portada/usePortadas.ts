// MOMENTÁNEO (SPEC-10 M-02): portadas elegidas de los comunicados visibles, y la URL local
// de una foto (se baja con el token como Blob, igual que `useArchivoUrl`).
import { useEffect, useState } from "react"
import { descargarPortada, listarPortadas, type PortadaDTO } from "./portadaApi"

/** Tope de `GET /comunicados/portadas` (backend `MAX_IDS`). */
const MAX_IDS = 50

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
    // El backend acepta hasta MAX_IDS por pedido: si la página crece, se pide en tandas.
    const todos = clave.split(",").map(Number)
    const tandas = Array.from({ length: Math.ceil(todos.length / MAX_IDS) }, (_, i) =>
      todos.slice(i * MAX_IDS, (i + 1) * MAX_IDS),
    )
    Promise.all(tandas.map((t) => listarPortadas(t, ac.signal)))
      .then((listas) => setPortadas(new Map(listas.flat().map((p) => [p.comunicado_id, p]))))
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
