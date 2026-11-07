import { useState } from "react"
import type { Equipment } from "../types"
import { motivoNoAgregable } from "../services/carrito"

interface Props {
  equipment: Equipment
  role: string
  onAddToCart?: (eq: Equipment) => void
}

export function AgregarAlPedido({ equipment, role, onAddToCart }: Props) {
  const [agregado, setAgregado] = useState(false)
  const motivo = motivoNoAgregable(equipment, role as any)
  const disabled = motivo !== null || !onAddToCart

  const handleClick = () => {
    if (disabled || !onAddToCart) return
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
