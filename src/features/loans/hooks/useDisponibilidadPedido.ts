import { useEffect, useState } from "react"
import { obtenerDisponibilidad } from "../../inventory/services/inventoryApi"
import { aIso, ventana } from "../../inventory/services/calendario"
import { hoyLab } from "../../../lib/fechas"
import type { ItemCarrito } from "../services/carrito"
import type { DisponibilidadModelo } from "../services/calendarioPedido"

// Disponibilidad por día de cada modelo del carrito para Solicitar equipos (SPEC-10 §4.6):
// el mismo endpoint del mini-calendario del detalle (PRE-01), una consulta por modelo, sobre
// la ventana de 62 días que admite el backend. Orientativo: el backend valida al enviar.
export function useDisponibilidadPedido(items: ItemCarrito[]): {
  modelos: DisponibilidadModelo[]
  cargando: boolean
  error: string | null
} {
  const [libres, setLibres] = useState<Map<number, Map<string, number>>>(new Map())
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ids = items.map((i) => i.equipamientoId).join(",")

  useEffect(() => {
    if (!ids) return
    const control = new AbortController()
    const { min, max } = ventana(hoyLab())
    const rango = { desde: aIso(min), hasta: aIso(max) }
    setCargando(true)
    setError(null)
    Promise.all(
      ids.split(",").map(Number).map(async (id) => {
        const d = await obtenerDisponibilidad(id, rango, control.signal)
        return [id, new Map(d.dias.map((x) => [x.fecha, x.unidades_libres]))] as const
      }),
    )
      .then((pares) => setLibres(new Map(pares)))
      .catch((e) => {
        if (!control.signal.aborted) setError(e?.message ?? "No se pudo cargar la disponibilidad.")
      })
      .finally(() => {
        if (!control.signal.aborted) setCargando(false)
      })
    return () => control.abort()
  }, [ids])

  const modelos = items.map((i) => ({ libres: libres.get(i.equipamientoId) ?? new Map(), cantidad: i.cantidad }))
  return { modelos, cargando, error }
}
