import { useState } from "react"
import type { Role } from "../../../types"
import type { Equipment } from "../types"
import { motivoNoAgregable, muestraBotonAgregar } from "../services/carrito"

interface Props {
  equipment: Equipment
  role: Role
  onAddToCart?: (eq: Equipment) => void
}

export function AgregarAlPedido({ equipment, role, onAddToCart }: Props) {
  const [agregado, setAgregado] = useState(false)
  // Sólo estudiantes y docentes, y sólo si la página recibió `onAddToCart` (INV-33).
  if (!onAddToCart || !muestraBotonAgregar(role, true)) return null
  const motivo = motivoNoAgregable(equipment)
  const disabled = motivo !== null

  const handleClick = () => {
    if (disabled) return
    onAddToCart(equipment)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={motivo ?? undefined}
      onClick={handleClick}
    >
      {agregado ? "Agregado" : "Agregar al pedido"}
    </button>
  )
}
