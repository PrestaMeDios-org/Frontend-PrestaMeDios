import { useState, type ReactNode } from "react"
import type { Role } from "../../../types"
import { useC } from "../../../theme"
import { SEDES, type Equipment, type Sede } from "../types"
import { useSede } from "../../auth/AuthContext"
import { Modal } from "../../../components/ui/Modal"
import { MiniCalendario } from "./MiniCalendario"
import { AgregarAlPedido } from "./AgregarAlPedido"
import { AltaGamaBadge } from "./AltaGamaBadge"
import { ICONOS_FICHA, IconoFicha } from "./IconosFicha"
// Sólo las reglas que valen para cualquier equipo (la de los lentes es específica de cámaras).
// Vienen de `lib/reglamento`: `inventory` no importa `loans` (SPEC-04 D-12).
import { REGLAS_GENERALES } from "../../../lib/reglamento"

interface Props {
  equipment: Equipment
  role: Role
  sede?: Sede
  onClose: () => void
  onAddToCart?: (eq: Equipment) => void
}

// Ficha del equipo (PRE-01): descripción, reglas de cuidado, video instructivo y mini-calendario.
// SPEC-10 V-07: dos columnas (datos y reglas de cuidado | calendario, video y reglas del laboratorio), imagen con tope de alto, datos agrupados,
// "Alta Gama" en el encabezado y "Agregar al pedido" en un pie fijo siempre visible.
export function EquipmentDetailModal({ equipment, role, sede, onClose, onAddToCart }: Props) {
  const C = useC()
  // SPEC-04 §8.2: el SUPERADMIN en "ambas sedes" elige la sede del calendario en la ficha (el
  // backend la exige). Arranca en la primera sede donde el equipo tiene unidades.
  const { puedeElegir } = useSede()
  const sedeInicial = SEDES.find((s) => equipment.unidades?.some((u) => u.sede === s)) ?? SEDES[0]
  const [sedeCalendario, setSedeCalendario] = useState<Sede>(sedeInicial)
  const elegirSede = puedeElegir && !sede

  const dato = (etiqueta: string, valor: string | number, icono: ReactNode) => (
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
      {/* SPEC-10: ícono de cada dato */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.textMuted, marginBottom: 3 }}>
        <span style={{ display: "inline-flex", color: C.textFaint }}>
          <IconoFicha d={icono} size={12} />
        </span>
        {etiqueta}
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>{valor}</div>
    </div>
  )

  // Recuadro de los bloques de la columna derecha (calendario y reglas del laboratorio).
  const recuadro = { border: `1px solid ${C.border}`, borderRadius: 14 }

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

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {dato("Plazo máximo", `${equipment.maxDays} días`, ICONOS_FICHA.plazo)}
            {dato("Disponibles hoy", equipment.available_count ?? equipment.quantity, ICONOS_FICHA.disponibles)}
            {equipment.locker !== undefined && dato("Locker", equipment.locker, ICONOS_FICHA.locker)}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ display: "inline-flex", color: C.crimson }}>
                  <IconoFicha d={ICONOS_FICHA.cuidado} size={14} />
                </span>
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

        {/* Columna del calendario, el video y las reglas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ ...recuadro, padding: "12px 12px 10px" }}>
            {elegirSede && (
              <div
                role="group"
                aria-label="Sede del calendario"
                style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 12, color: C.textMuted }}
              >
                Disponibilidad en
                <span style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 9, background: C.bg }}>
                  {SEDES.map((s) => {
                    const activa = s === sedeCalendario
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={activa}
                        onClick={() => setSedeCalendario(s)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 7,
                          border: "none",
                          background: activa ? C.card : "transparent",
                          boxShadow: activa ? `0 1px 2px ${C.border}` : "none",
                          color: activa ? C.text : C.textMuted,
                          fontFamily: "'Outfit',sans-serif",
                          fontSize: 12,
                          fontWeight: activa ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </span>
              </div>
            )}
            <MiniCalendario equipamientoId={equipment.id} sede={elegirSede ? sedeCalendario : sede} />
          </div>

          {equipment.videoUrl && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textMuted }}>
                <span style={{ display: "inline-flex", color: C.textFaint }}>
                  <IconoFicha d={ICONOS_FICHA.video} size={14} />
                </span>
                Video explicativo para el uso del equipo.
              </span>
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
            </div>
          )}

          {/* MOMENTÁNEO (SPEC-10 M-04): las reglas del laboratorio salen del mismo texto que los
              Términos de la solicitud, hasta que el Reglamento esté cargado en el sistema. */}
          <div style={{ ...recuadro, padding: "10px 12px", background: C.surface }}>
            <div
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: C.text,
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ display: "inline-flex", color: C.crimson }}>
                <IconoFicha d={ICONOS_FICHA.laboratorio} size={13} />
              </span>
              Reglas del laboratorio
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, lineHeight: 1.5, color: C.textMuted, listStyle: "disc" }}>
              {REGLAS_GENERALES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  )
}
