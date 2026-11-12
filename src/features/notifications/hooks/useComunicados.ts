import { useCallback, useEffect, useState } from "react"
import { mensajeDeError } from "../../../lib/api"
import { listarComunicados } from "../services/notificationsApi"
import { toComunicado } from "../services/mappers"
import type { Comunicado, Sede } from "../types"

export const POR_PAGINA = 10

// Carga los comunicados (NOV-02) con paginación y cancelación de pedidos viejos.
export function useComunicados({ sede, incluirArchivados }: { sede?: Sede; incluirArchivados: boolean }) {
  const [items, setItems] = useState<Comunicado[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  // Al cambiar los filtros se vuelve a la primera página.
  useEffect(() => setPagina(0), [sede, incluirArchivados])

  useEffect(() => {
    const ac = new AbortController()
    setCargando(true)
    listarComunicados(
      { sede, incluir_archivados: incluirArchivados, limit: POR_PAGINA, offset: pagina * POR_PAGINA },
      ac.signal,
    )
      .then((page) => {
        setItems(page.items.map(toComunicado))
        setTotal(page.total)
        setError(null)
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setItems([])
        setTotal(0)
        setError(mensajeDeError(e, "No se pudieron cargar los comunicados."))
      })
      .finally(() => {
        if (!ac.signal.aborted) setCargando(false)
      })
    return () => ac.abort()
  }, [sede, incluirArchivados, pagina, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return { items, total, pagina, paginas, setPagina, cargando, error, recargar }
}
