import type { Role } from "../../../types"
import { useC } from "../../../theme"
import type { Equipment, Sede } from "../types"
import { Modal } from "./Modal"
import { MiniCalendario } from "./MiniCalendario"
import { AgregarAlPedido } from "./AgregarAlPedido"
import { AltaGamaBadge } from "./AltaGamaBadge"

interface Props {
  equipment: Equipment
  role: Role
  sede?: Sede
  onClose: () => void
  onAddToCart?: (eq: Equipment) => void
}

// Ficha del equipo (PRE-01): descripción, reglas de cuidado, video instructivo y mini-calendario.
// SPEC-10 V-07: dos columnas (datos | calendario), imagen con tope de alto, datos agrupados,
// "Alta Gama" en el encabezado y "Agregar al pedido" en un pie fijo siempre visible.
export function EquipmentDetailModal({ equipment, role, sede, onClose, onAddToCart }: Props) {
  const C = useC()

  const dato = (etiqueta: string, valor: string | number) => (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 90,
        padding: "10px 12px",
        borderRadius: 11,
        background: C.surface,
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 3 }}>{etiqueta}</div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>{valor}</div>
    </div>
  )

  const subtitulo = `${equipment.brand} ${equipment.model} · ${equipment.code}`

  return (
    <Modal
      titulo={equipment.name}
      subtitulo={subtitulo}
      extraTitulo={equipment.altaGama ? <AltaGamaBadge /> : undefined}
      conCerrar
      onClose={onClose}
      ancho={840}
      pie={
        <>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: 11,
              border: `1.5px solid ${C.border}`,
              background: C.card,
              color: C.textMuted,
              fontFamily: "'Outfit',sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
          <AgregarAlPedido equipment={equipment} role={role} onAddToCart={onAddToCart} />
        </>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "start",
          color: C.text,
        }}
      >
        {/* Columna de datos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {equipment.image && (
            <div
              style={{
                // Fondo de tarjeta: las fotos de producto suelen venir con fondo blanco.
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 220,
              }}
            >
              <img
                src={equipment.image}
                alt={equipment.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
          )}

          {equipment.videoUrl && (
            <a
              href={equipment.videoUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1.5px solid ${C.crimson}`,
                background: C.crimsonLight,
                color: C.crimson,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5.6 4.6L9.4 7L5.6 9.4V4.6Z" fill="currentColor" />
              </svg>
              Ver video instructivo
            </a>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {dato("Plazo máximo", `${equipment.maxDays} días`)}
            {dato("Disponibles hoy", equipment.available_count ?? equipment.quantity)}
            {equipment.locker !== undefined && dato("Locker", equipment.locker)}
          </div>

          {equipment.specs && (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.text }}>{equipment.specs}</p>
          )}

          {equipment.careRules && equipment.careRules.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.text,
                  marginBottom: 6,
                }}
              >
                Reglas de cuidado
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: C.textMuted,
                  listStyle: "disc",
                }}
              >
                {equipment.careRules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Columna del calendario */}
        <div style={{ minWidth: 0 }}>
          <MiniCalendario equipamientoId={equipment.id} sede={sede} />
        </div>
      </div>
    </Modal>
  )
}
