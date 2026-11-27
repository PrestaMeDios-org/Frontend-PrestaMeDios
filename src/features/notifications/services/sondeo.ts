// Consulta periódica de la campanita (NOV-04, SPEC-06 D-N04, plan §7.1).
// Lógica pura, sin React: se prueba con los timers falsos de Vitest y el hook
// `useResumenNotificaciones` sólo la conecta con el componente.

export const INTERVALO_MS = 60_000

export interface Sondeo {
  /** Consulta enseguida y después cada `intervaloMs`. Llamarla dos veces no duplica. */
  iniciar(): void
  detener(): void
  /** Al volver a la pestaña: consulta enseguida, sin esperar la próxima vuelta. */
  alVolverVisible(): void
}

export function crearSondeo({
  consultar,
  estaVisible,
  intervaloMs = INTERVALO_MS,
}: {
  consultar: () => void
  /** Con la pestaña oculta no se consulta (ahorra pedidos con muchas pestañas). */
  estaVisible: () => boolean
  intervaloMs?: number
}): Sondeo {
  let timer: ReturnType<typeof setInterval> | null = null
  const vuelta = () => {
    if (estaVisible()) consultar()
  }
  return {
    iniciar() {
      if (timer !== null) return
      vuelta()
      timer = setInterval(vuelta, intervaloMs)
    },
    detener() {
      if (timer !== null) clearInterval(timer)
      timer = null
    },
    alVolverVisible() {
      if (timer !== null && estaVisible()) consultar()
    },
  }
}
