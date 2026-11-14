import { useC } from "../../../theme"
import { Ico } from "../../../components/ui/icons"
import { AgregarAlPedido } from "./AgregarAlPedido"
import { EstadoEquipo } from "./EstadoEquipo"
import { AltaGamaBadge } from "./AltaGamaBadge"
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
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
                background: C.card,
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                color: C.textMuted,
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
                background: C.card,
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
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
      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            minHeight: 18,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 10,
              color: C.textFaint,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {eq.code}
          </span>
          {eq.altaGama && <AltaGamaBadge />}
        </div>
        <div
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 14.5,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.3,
            marginBottom: 6,
          }}
        >
          {eq.name}
        </div>
        <div
          title={eq.specs}
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            color: C.textMuted,
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {eq.specs}
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 11.5,
              color: C.textMuted,
            }}
          >
            <strong style={{ color: C.text, fontWeight: 600 }}>{eq.available_count}</strong> de {eq.quantity}{" "}
            disponibles
          </span>
          <div style={{ width: 30, height: 30, flexShrink: 0 }}>
            <AgregarAlPedido compacto equipment={eq} role={role} onAddToCart={onAddToCart} />
          </div>
        </div>
      </div>
    </div>
  )
}
