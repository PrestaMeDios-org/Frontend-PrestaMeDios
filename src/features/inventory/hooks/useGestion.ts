import { useCallback, useState } from "react"
import { mensajeDeError } from "../../../lib/api"
import type { AccionEstado } from "../components/UnidadesRow"
import {
  cambiarEstadoEquipamiento,
  darDeBajaUnidad,
  ponerEnMantenimiento,
  rehabilitarUnidad,
} from "../services/inventoryApi"
import { textoReservasAfectadas } from "../services/historial"
import type { Equipment, Unidad, UnidadEstadoDTO } from "../types"
import { useConfirmar } from "../../../components/ui/Dialogo"

/** Textos de confirmación de las acciones destructivas (SPEC-04 D-03, D-09). */
export const CONFIRMACION: Record<AccionEstado, (codigo: string) => string | null> = {
  mantenimiento: (c) =>
    `¿Poner la unidad ${c} en mantenimiento? No se podrá reservar hasta que la rehabilites.`,
  baja: (c) =>
    `¿Dar de baja la unidad ${c} (fuera de servicio)? Es definitivo: no se puede revertir.`,
  disponible: () => null,
}

const ACCION: Record<AccionEstado, (id: number) => Promise<UnidadEstadoDTO>> = {
  mantenimiento: ponerEnMantenimiento,
  baja: darDeBajaUnidad,
  disponible: rehabilitarUnidad,
}

// Acciones de administración compartidas por el catálogo y la tabla de stock (PRE-12, PRE-14):
// piden confirmación, informan el error del backend y recargan al terminar.
// Fase C (PRE-17, SPEC-04 §8.3): si una unidad pasa a mantenimiento o baja con reservas
// aprobadas futuras, deja un aviso que queda hasta que el administrador lo cierra.
export function useGestion(recargar: () => void) {
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
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

  const confirmar = useConfirmar() // SPEC-10 V-11: diálogo propio en lugar de window.confirm
  const cambiarEstado = useCallback(
    async (unidad: Unidad, accion: AccionEstado) => {
      const aviso = CONFIRMACION[accion](unidad.codigoInventario)
      if (aviso && !(await confirmar({ titulo: "¿Confirmás el cambio?", mensaje: aviso }))) return
      await ejecutar(async () => {
        const r = await ACCION[accion](unidad.id)
        const texto = textoReservasAfectadas(unidad.codigoInventario, r?.reservas_afectadas, r?.ordenes_afectadas)
        if (texto) setAviso(texto)
      }, "No se pudo cambiar el estado de la unidad.")
    },
    [ejecutar, confirmar],
  )

  const cambiarActivo = useCallback(
    async (equipo: Equipment) => {
      if (
        equipo.activo &&
        !(await confirmar({
          titulo: `¿Dar de baja "${equipo.name}"?`,
          mensaje: "Dejará de verse en el catálogo de estudiantes y docentes. Lo podés reactivar después.",
          aceptar: "Dar de baja",
          peligro: true,
        }))
      )
        return
      await ejecutar(
        () => cambiarEstadoEquipamiento(equipo.id, !equipo.activo),
        "No se pudo cambiar el estado del equipo.",
      )
    },
    [ejecutar, confirmar],
  )

  return {
    error,
    ocupado,
    aviso,
    cambiarEstado,
    cambiarActivo,
    limpiarError: () => setError(null),
    cerrarAviso: () => setAviso(null),
  }
}
