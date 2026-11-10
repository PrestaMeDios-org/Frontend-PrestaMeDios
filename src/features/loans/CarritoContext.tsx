import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Equipment } from "../inventory/types"
import {
  agregar as agregarItem,
  cambiarCantidad as cambiarCantidadItem,
  equipamientoIds,
  puedeSumar as puedeSumarItem,
  quitar as quitarItem,
  requiereAval,
  tipoCarrito,
  totalUnidades,
  type ItemCarrito,
} from "./services/carrito"
import type { CartType } from "../../types"

interface CarritoValue {
  items: ItemCarrito[]
  /** Unidades pedidas (líneas de la orden). */
  total: number
  tipo: CartType
  requiereAval: boolean
  /** Ids para `SolicitudNueva.equipamientoIds`. */
  equipamientoIds: number[]
  agregar: (eq: Equipment) => void
  puedeSumar: (equipamientoId: number) => boolean
  cambiarCantidad: (equipamientoId: number, cantidad: number) => void
  quitar: (equipamientoId: number) => void
  vaciar: () => void
}

const CarritoCtx = createContext<CarritoValue | null>(null)

/**
 * Carrito en memoria (SPEC-05 F1.3). Vive mientras dura la sesión en la app: al cerrar
 * sesión el provider se desmonta y se vacía.
 */
export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])

  const agregar = useCallback(
    (eq: Equipment) => setItems((prev) => agregarItem(prev, eq)),
    [],
  )
  const cambiarCantidad = useCallback(
    (id: number, cantidad: number) =>
      setItems((prev) => cambiarCantidadItem(prev, id, cantidad)),
    [],
  )
  const quitar = useCallback(
    (id: number) => setItems((prev) => quitarItem(prev, id)),
    [],
  )
  const vaciar = useCallback(() => setItems([]), [])

  const value = useMemo<CarritoValue>(
    () => ({
      items,
      total: totalUnidades(items),
      tipo: tipoCarrito(items),
      requiereAval: requiereAval(items),
      equipamientoIds: equipamientoIds(items),
      agregar,
      puedeSumar: (id) => puedeSumarItem(items, id),
      cambiarCantidad,
      quitar,
      vaciar,
    }),
    [items, agregar, cambiarCantidad, quitar, vaciar],
  )

  return <CarritoCtx.Provider value={value}>{children}</CarritoCtx.Provider>
}

export function useCarrito(): CarritoValue {
  const ctx = useContext(CarritoCtx)
  if (!ctx) throw new Error("useCarrito necesita un CarritoProvider")
  return ctx
}
