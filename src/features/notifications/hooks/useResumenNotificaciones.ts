import { useCallback, useEffect, useRef, useState } from "react"
import { obtenerResumenNotificaciones } from "../services/notificationsApi"
import { crearSondeo } from "../services/sondeo"
import type { ResumenNotificacionesDTO } from "../types"

// Número de la campanita (NOV-04): `/notificaciones/resumen` al montar y cada 60 s,
// en pausa con la pestaña oculta (D-N04). Si falla, no se muestra número y se reintenta
// en la vuelta siguiente; un 401 lo resuelve `lib/api.ts` cerrando la sesión.
export function useResumenNotificaciones() {
  const [resumen, setResumen] = useState<ResumenNotificacionesDTO | null>(null)
  const pedido = useRef<AbortController | null>(null)

  const refrescar = useCallback(() => {
    pedido.current?.abort()
    const ac = new AbortController()
    pedido.current = ac
    obtenerResumenNotificaciones(ac.signal)
      .then(setResumen)
      .catch(() => {
        if (!ac.signal.aborted) setResumen(null)
      })
  }, [])

  useEffect(() => {
    const sondeo = crearSondeo({
      consultar: refrescar,
      estaVisible: () => document.visibilityState !== "hidden",
    })
    const alCambiar = () => sondeo.alVolverVisible()
    sondeo.iniciar()
    document.addEventListener("visibilitychange", alCambiar)
    return () => {
      sondeo.detener()
      document.removeEventListener("visibilitychange", alCambiar)
      pedido.current?.abort()
    }
  }, [refrescar])

  return { resumen, refrescar }
}
