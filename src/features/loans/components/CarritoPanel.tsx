import type { CSSProperties } from "react"
import { useC } from "../../../theme"
import { Button } from "../../../components/ui/Button"
import { Modal } from "../../../components/ui/Modal"
import { useCarrito } from "../CarritoContext"
import { MAX_LINEAS } from "../services/carrito"
import { ICONO, Icono } from "./IconosLinea"

interface Props {
  onClose: () => void
  /** Abre el formulario de solicitud (F1.4). Sin él, el botón queda deshabilitado. */
  onContinuar?: () => void
}

/** Contenido del carrito: cantidades por modelo, quitar y vaciar (SPEC-05 F1.3). */
export function CarritoPanel({ onClose, onContinuar }: Props) {
  const C = useC()
  const carrito = useCarrito()

  const texto: CSSProperties = {
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    color: C.text,
  }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }
  const botonCantidad: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    cursor: "pointer",
    fontWeight: 700,
  }

  return (
    <Modal titulo="Tu pedido" onClose={onClose} ancho={620}>
      {carrito.items.length === 0 ? (
        <p style={tenue}>
          El carrito está vacío. Agregá equipos desde el catálogo con «Agregar
          al pedido».
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: 10,
          }}
        >
          {carrito.items.map((item) => (
            <li
              key={item.equipamientoId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 10,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                background: C.surface,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...texto, fontWeight: 600 }}>{item.nombre}</div>
                <div style={tenue}>
                  {item.codigo} · hasta {item.maxDias} días
                  {item.altaGama && (
                    <span style={{ color: C.premium, fontWeight: 600 }}>
                      {" "}
                      · Alta gama
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  aria-label={`Quitar una unidad de ${item.nombre}`}
                  style={botonCantidad}
                  onClick={() =>
                    carrito.cambiarCantidad(
                      item.equipamientoId,
                      item.cantidad - 1,
                    )
                  }
                >
                  −
                </button>
                <span style={{ ...texto, minWidth: 18, textAlign: "center" }}>
                  {item.cantidad}
                </span>
                <button
                  type="button"
                  aria-label={`Sumar una unidad de ${item.nombre}`}
                  style={{
                    ...botonCantidad,
                    opacity: carrito.puedeSumar(item.equipamientoId) ? 1 : 0.4,
                  }}
                  disabled={!carrito.puedeSumar(item.equipamientoId)}
                  onClick={() =>
                    carrito.cambiarCantidad(
                      item.equipamientoId,
                      item.cantidad + 1,
                    )
                  }
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => carrito.quitar(item.equipamientoId)}
                style={{
                  border: "none",
                  background: "none",
                  color: C.occupied,
                  cursor: "pointer",
                  ...tenue,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icono d={ICONO.quitar} size={12} />
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {carrito.items.length > 0 && (
        // SPEC-10: un ícono por aviso (unidades, aval de alta gama y disponibilidad).
        <div style={{ display: "grid", gap: 5 }}>
          <span style={{ ...texto, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "inline-flex", color: C.textFaint }}>
              <Icono d={ICONO.equipamiento} size={14} />
            </span>
            {`${carrito.total} ${carrito.total === 1 ? "unidad" : "unidades"}`}
            {` (máximo ${MAX_LINEAS} por solicitud)`}
          </span>
          {carrito.requiereAval && (
            <span style={{ ...tenue, color: C.premium, display: "flex", alignItems: "center", gap: 7 }}>
              <Icono d={ICONO.documento} size={14} />
              Hay equipos de alta gama: al solicitar vas a tener que adjuntar el aval en PDF.
            </span>
          )}
          <span style={{ ...tenue, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ display: "inline-flex", color: C.textFaint }}>
              <Icono d={ICONO.calendario} size={14} />
            </span>
            La disponibilidad se confirma con las fechas que elijas en la solicitud.
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {carrito.items.length > 0 && (
          <Button variant="ghost" onClick={carrito.vaciar}>
            Vaciar
          </Button>
        )}
        <Button
          onClick={onContinuar}
          disabled={!onContinuar || carrito.items.length === 0}
          title={onContinuar ? undefined : "Disponible próximamente"}
        >
          Continuar con la solicitud
        </Button>
      </div>
    </Modal>
  )
}
