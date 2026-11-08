import { useEffect, useState } from "react"
import type { DisponibilidadDTO } from "../types"
import { obtenerDisponibilidad } from "../services/inventoryApi"

export interface UseDisponibilidadResult {
  data: DisponibilidadDTO | null
  cargando: boolean
  error: string | null
}

export function useDisponibilidad(
  equipamientoId: number | null,
  desde: string | null,
  hasta: string | null,
  sede?: string,
): UseDisponibilidadResult {
  const [data, setData] = useState<DisponibilidadDTO | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (equipamientoId === null || !desde || !hasta) {
      setData(null)
      return
    }
    const controller = new AbortController()
    setCargando(true)
    setError(null)
    obtenerDisponibilidad(equipamientoId, { desde, hasta, sede: sede as any }, controller.signal)
      .then((d) => setData(d))
      .catch((e) => {
        if (controller.signal.aborted) return
        setError(e?.message ?? "Error al cargar disponibilidad")
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })
    return () => controller.abort()
  }, [equipamientoId, desde, hasta, sede])

  return { data, cargando, error }
}
