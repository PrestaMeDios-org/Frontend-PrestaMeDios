import { useC } from "../../../theme"
import { Ico } from "../../../components/ui/icons"
import { AgregarAlPedido } from "./AgregarAlPedido"
import { EstadoEquipo } from "./EstadoEquipo"
import type { Equipment } from "../types"
import type { Role } from "../../../types"

// Tarjeta visual de un equipo del catálogo (grilla).
export function EquipmentCard({
  eq,
  role,
  onSelect,
  onAddToCart,
  onEdit,
  onDelete,
}: {
  eq: Equipment
  role: Role
  onSelect?: (e: Equipment) => void
  onAddToCart?: (e: Equipment) => void
  onEdit?: (e: Equipment) => void
  onDelete?: (id: number) => void
}) {
  const C = useC()
  return (
    <div
      onClick={() => onSelect?.(eq)}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: onSelect ? "pointer" : "default",
        transition: "transform 0.15s,box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onSelect) {
          ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
          ;(e.currentTarget as HTMLElement).style.boxShadow =
            "0 8px 22px rgba(0,0,0,0.1)"
        }
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = "none"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
      }}
    >
      <div style={{ position: "relative" }}>
        {eq.image ? (
          <img
            src={eq.image}
            alt={eq.name}
            style={{
              width: "100%",
              height: 148,
              objectFit: "cover",
              display: "block",
              filter: eq.maintenance || !eq.activo ? "grayscale(40%)" : "none",
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{ width: "100%", height: 148, background: C.bg, display: "block" }}
          />
        )}
        {!eq.activo && (
          <div style={{ position: "absolute", left: 9, bottom: 9 }}>
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 10.5,
                fontWeight: 700,
                color: "white",
                background: "rgba(60,60,67,0.9)",
                padding: "3px 10px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Dado de baja
            </span>
          </div>
        )}
        {eq.maintenance && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 10.5,
                fontWeight: 700,
                color: "white",
                background: "rgba(122,90,0,0.9)",
                padding: "3px 10px",
                borderRadius: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              En Mantenimiento
            </span>
          </div>
        )}
        <div style={{ position: "absolute", top: 9, right: 9 }}>
          <EstadoEquipo eq={eq} />
        </div>
        {role === "admin" && (
          <div
            style={{
              position: "absolute",
              top: 9,
              left: 9,
              display: "flex",
              gap: 5,
            }}
          >
            <button
              title="Editar equipo"
              aria-label={`Editar ${eq.name}`}
              onClick={(ev) => {
                ev.stopPropagation()
                onEdit?.(eq)
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Ico.edit}
            </button>
            <button
              title={eq.activo ? "Dar de baja" : "Reactivar"}
              aria-label={`${eq.activo ? "Dar de baja" : "Reactivar"} ${eq.name}`}
              onClick={(ev) => {
                ev.stopPropagation()
                onDelete?.(eq.id)
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.occupied,
              }}
            >
              {Ico.trash}
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 9.5,
            color: C.textFaint,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 3,
          }}
        >
          {eq.code}
        </div>
        <div
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.3,
            marginBottom: 5,
          }}
        >
          {eq.name}
        </div>
        <div
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 11.5,
            color: C.textMuted,
            lineHeight: 1.5,
            marginBottom: eq.altaGama ? 7 : 10,
          }}
        >
          {eq.specs}
        </div>
        {eq.altaGama && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: 7,
              background: "#EDE0FF",
              border: "1px solid #C4A8E060",
              marginBottom: 10,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 1L6.12 3.62L9 3.9L7 5.74L7.63 8.5L5 7.1L2.37 8.5L3 5.74L1 3.9L3.88 3.62L5 1Z"
                fill="#5A2D82"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#5A2D82",
                letterSpacing: "0.02em",
              }}
            >
              Alta Gama
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 11,
              color: C.textFaint,
            }}
          >
            {eq.available_count}/{eq.quantity} uds.
          </span>
          <div style={{ width: 30, height: 30, flexShrink: 0 }}>
            <AgregarAlPedido compacto equipment={eq} role={role} onAddToCart={onAddToCart} />
          </div>
        </div>
      </div>
    </div>
  )
}
