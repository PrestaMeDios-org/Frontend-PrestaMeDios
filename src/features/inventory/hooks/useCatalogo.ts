import { useCallback, useEffect, useState } from "react"
import { mensajeDeError } from "../../../lib/api"
import { listarCategorias, listarEquipamiento } from "../services/inventoryApi"
import { toCategory, toEquipment } from "../services/mappers"
import type { Category, Equipment, Sede } from "../types"

const DEBOUNCE_MS = 300

/** Valor que se actualiza recién cuando deja de cambiar durante `ms`. */
export function useDebounced<T>(valor: T, ms = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(valor), ms)
    return () => clearTimeout(id)
  }, [valor, ms])
  return debounced
}

export interface FiltrosCatalogo {
  sede?: Sede
  q: string
  /** Sólo administradores (el backend lo ignora para el resto). */
  incluirInactivos?: boolean
}

// Carga el catálogo desde la API (PRE-01, PRE-02) con búsqueda diferida y cancelación de
// pedidos viejos. La categoría se filtra en la pantalla para poder mostrar los contadores
// de todas las categorías con un solo pedido.
export function useCatalogo({ sede, q, incluirInactivos = false }: FiltrosCatalogo) {
  const [items, setItems] = useState<Equipment[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const busqueda = useDebounced(q.trim())

  useEffect(() => {
    const ac = new AbortController()
    listarCategorias(ac.signal)
      .then((cats) => setCategorias(cats.map(toCategory)))
      .catch(() => {
        // Sin categorías sólo se pierden los chips; el error del catálogo se informa aparte.
      })
    return () => ac.abort()
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    setCargando(true)
    listarEquipamiento(
      { sede, q: busqueda || undefined, incluir_inactivos: incluirInactivos },
      ac.signal,
    )
      .then((dtos) => {
        setItems(dtos.map(toEquipment))
        setError(null)
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        setItems([])
        setError(mensajeDeError(e, "No se pudo cargar el catálogo."))
      })
      .finally(() => {
        if (!ac.signal.aborted) setCargando(false)
      })
    return () => ac.abort()
  }, [sede, busqueda, incluirInactivos, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])

  return { items, categorias, cargando, error, recargar, buscando: q.trim() !== busqueda }
}
