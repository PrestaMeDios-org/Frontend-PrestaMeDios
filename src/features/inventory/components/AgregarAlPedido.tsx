import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useC } from "../../../theme"
import type { Role } from "../../../types"
import type { Equipment } from "../types"
import { motivoNoAgregable, muestraBotonAgregar } from "../services/carrito"

interface Props {
  equipment: Equipment
  role: Role
  onAddToCart?: (eq: Equipment) => void
  /** Botón de ícono, para la tarjeta y la fila de la lista. */
  compacto?: boolean
}

// Botón "Agregar al pedido" (SPEC-04 §8.2, C11, INV-33): la misma regla en la tarjeta, la
// fila de la lista y el detalle. Los equipos de alta gama también se agregan: el aval lo
// pide el formulario de `loans`.
export function AgregarAlPedido({ equipment, role, onAddToCart, compacto = false }: Props) {
  const C = useC()
  const [agregado, setAgregado] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  // Sólo estudiantes y docentes, y sólo si la página recibió `onAddToCart`.
  if (!muestraBotonAgregar(role, onAddToCart !== undefined)) return null
  const motivo = motivoNoAgregable(equipment)
  const disabled = motivo !== null

  const handleClick = (ev: MouseEvent) => {
    ev.stopPropagation() // la tarjeta y la fila abren el detalle con su propio clic
    if (disabled) return
    onAddToCart?.(equipment)
    setAgregado(true)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setAgregado(false), 2000)
  }

  const texto = agregado ? "Agregado" : "Agregar al pedido"

  if (!compacto) {
    return (
      <button type="button" disabled={disabled} title={motivo ?? undefined} onClick={handleClick}>
        {texto}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={motivo ?? texto}
      aria-label={`${texto}: ${equipment.name}`}
      onClick={handleClick}
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 8,
        border: `1.5px solid ${C.crimson}`,
        background: C.crimsonLight,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.crimson,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden>
        {agregado ? (
          <path d="M2.5 8L6 11.5L12.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <path
              d="M1 1H2.5L4.5 10H11.5L13.5 4H3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6" cy="12.5" r="1" fill="currentColor" />
            <circle cx="10" cy="12.5" r="1" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  )
}
