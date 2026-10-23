import { useCallback, useState } from "react"
import { mensajeDeError } from "../../../lib/api"
import type { AccionEstado } from "../components/UnidadesRow"
import {
  cambiarEstadoEquipamiento,
  darDeBajaUnidad,
  ponerEnMantenimiento,
  rehabilitarUnidad,
} from "../services/inventoryApi"
import type { Equipment, Unidad } from "../types"

/** Textos de confirmación de las acciones destructivas (SPEC-04 D-03, D-09). */
export const CONFIRMACION: Record<AccionEstado, (codigo: string) => string | null> = {
  mantenimiento: (c) =>
    `¿Poner la unidad ${c} en mantenimiento? No se podrá reservar hasta que la rehabilites.`,
  baja: (c) =>
    `¿Dar de baja la unidad ${c} (fuera de servicio)? Es definitivo: no se puede revertir.`,
  disponible: () => null,
}

const ACCION: Record<AccionEstado, (id: number) => Promise<unknown>> = {
  mantenimiento: ponerEnMantenimiento,
  baja: darDeBajaUnidad,
  disponible: rehabilitarUnidad,
}

// Acciones de administración compartidas por el catálogo y la tabla de stock (PRE-12, PRE-14):
// piden confirmación, informan el error del backend y recargan al terminar.
export function useGestion(recargar: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const ejecutar = useCallback(
    async (accion: () => Promise<unknown>, fallo: string) => {
      setOcupado(true)
      setError(null)
      try {
        await accion()
        recargar()
      } catch (e) {
        setError(mensajeDeError(e, fallo))
        recargar() // el estado pudo cambiar por otra persona: se muestra el real
      } finally {
        setOcupado(false)
      }
    },
    [recargar],
  )

  const cambiarEstado = useCallback(
    async (unidad: Unidad, accion: AccionEstado) => {
      const aviso = CONFIRMACION[accion](unidad.codigoInventario)
      if (aviso && !window.confirm(aviso)) return
      await ejecutar(() => ACCION[accion](unidad.id), "No se pudo cambiar el estado de la unidad.")
    },
    [ejecutar],
  )

  const cambiarActivo = useCallback(
    async (equipo: Equipment) => {
      if (
        equipo.activo &&
        !window.confirm(
          `¿Dar de baja "${equipo.name}"? Dejará de verse en el catálogo de estudiantes y docentes.`,
        )
      )
        return
      await ejecutar(
        () => cambiarEstadoEquipamiento(equipo.id, !equipo.activo),
        "No se pudo cambiar el estado del equipo.",
      )
    },
    [ejecutar],
  )

  return { error, ocupado, cambiarEstado, cambiarActivo, limpiarError: () => setError(null) }
}
