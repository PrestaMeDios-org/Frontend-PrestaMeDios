import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "../../../components/ui/Dialogo"
import { mensajeDeError } from "../../../lib/api"
import { isoALocal, ZONA_LAB } from "../../notifications/services/fechas"
import { getEspacios, listReservas, updateReservaEstado } from "../services/spacesApi"
import type { Reserva } from "../types"

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_LAB,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})
/** "2026-11-14" → "Sáb 14/11/2026". */
export const fechaCorta = (fecha: string) => {
  const [a, m, d] = fecha.split("-").map(Number)
  const t = formatoFecha.format(new Date(Date.UTC(a!, m! - 1, d!, 12))).replace(",", "").replace(".", "")
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * Reservas de espacios propias (SPEC-10 V-18): las trae todas (también canceladas y
 * rechazadas, para los filtros) y cancela antes de que empiecen (RES-03). `version` vuelve a
 * cargarlas cuando la página envía reservas nuevas; `onCancelada` avisa para refrescar el mes.
 */
export function useMisReservas(version = 0, onCancelada?: () => void) {
  const confirmar = useConfirmar()
  const [reservas, setReservas] = useState<Reserva[] | null>(null)
  const [nombres, setNombres] = useState<Map<number, string>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())

  const cargar = useCallback(async () => {
    try {
      setReservas(await listReservas())
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron cargar tus reservas."))
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar, version])

  useEffect(() => {
    getEspacios()
      .then((es) => setNombres(new Map(es.map((e) => [e.id, e.nombre]))))
      .catch(() => {})
    const timer = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const nombre = (id: number) => nombres.get(id) ?? `Espacio #${id}`

  const cancelar = async (r: Reserva) => {
    if (
      !(await confirmar({
        titulo: "¿Cancelar esta reserva?",
        mensaje: `${nombre(r.idEspacio)} · ${fechaCorta(r.fecha)} · ${r.horaInicio}–${r.horaFin}. Si confirmás, se cancela también la aprobación del administrador.`,
        aceptar: "Sí, cancelar reserva",
        cancelar: "No, volver",
        peligro: true,
      }))
    )
      return
    setCancelando(r.id)
    setAviso(null)
    setError(null)
    try {
      await updateReservaEstado(r.id, "Cancelada")
      setAviso(`Cancelaste la reserva de ${nombre(r.idEspacio)}.`)
      await cargar()
      onCancelada?.()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cancelar la reserva."))
    } finally {
      setCancelando(null)
    }
  }

  return { reservas, nombre, ahora: isoALocal(new Date(ahora).toISOString()), error, aviso, cancelando, cancelar }
}
