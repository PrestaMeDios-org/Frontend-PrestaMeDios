import { useState, useRef, useEffect } from "react"
import { useC } from "../../theme"
import { Ico } from "../ui/icons"
import type { Role, CartType } from "../../types"

const NOTIFICATIONS_DATA = [
  {
    id: "1",
    type: "received",
    title: "Solicitud recibida",
    desc: "Tu pedido de Cámara Sony A7 III fue registrado correctamente.",
    time: "Hoy 14:32",
    read: false,
  },
  {
    id: "2",
    type: "approved",
    title: "Solicitud aprobada",
    desc: "Prof. Marcela Vega aprobó tu solicitud para Video II.",
    time: "Hoy 09:15",
    read: false,
  },
  {
    id: "3",
    type: "rejected",
    title: "Solicitud rechazada",
    desc: 'Motivo: "El equipo requiere certificación previa de uso."',
    time: "Ayer 11:45",
    read: true,
  },
  {
    id: "4",
    type: "due_soon",
    title: "Pronto a vencer",
    desc: "Tu préstamo de MacBook Pro vence en 2 días (22 ago).",
    time: "Ayer 08:00",
    read: true,
  },
  {
    id: "5",
    type: "return",
    title: "Recordatorio de devolución",
    desc: "Hoy es el último día para devolver Grabadora Zoom H6.",
    time: "14 ago 07:30",
    read: true,
  },
]

export function Navbar({
  role,
  onRoleChange,
  title,
  subtitle,
  dark,
  onDarkToggle,
  onProfile,
  onHelp,
  cartCount,
  cartType,
  onCartOpen,
}: {
  role: Role
  onRoleChange: (r: Role) => void
  title: string
  subtitle?: string
  dark: boolean
  onDarkToggle: () => void
  onProfile: () => void
  onHelp: () => void
  cartCount: number
  cartType: CartType
  onCartOpen: () => void
}) {
  const C = useC()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS_DATA)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  const unread = notifs.filter((n) => !n.read).length
  const notifColors: { [k: string]: { dot: string; bg: string } } = {
    received: { dot: C.mine, bg: C.mineBg },
    approved: { dot: C.available, bg: C.availableBg },
    rejected: { dot: C.occupied, bg: C.occupiedBg },
    due_soon: { dot: C.pending, bg: C.pendingBg },
    return: { dot: C.crimson, bg: C.crimsonLight },
  }
  return (
    <header
      style={{
        height: 62,
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 20,
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 11.5,
              color: C.textFaint,
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "4px 4px 4px 10px",
            background: C.bg,
            borderRadius: 11,
            border: `1px solid ${C.border}`,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 10.5,
              color: C.textFaint,
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Vista:
          </span>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: C.card,
              borderRadius: 7,
              padding: "2px",
              border: `1px solid ${C.border}`,
            }}
          >
            {(["student", "teacher", "admin"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => onRoleChange(r)}
                style={{
                  padding: "5px 11px",
                  borderRadius: 5,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  background: role === r ? C.crimson : "transparent",
                  color: role === r ? "white" : C.textMuted,
                  transition: "all 0.12s",
                }}
              >
                {
                  (
                    {
                      student: "Estudiante",
                      teacher: "Docente",
                      admin: "Admin",
                    } as Record<Role, string>
                  )[r]
                }
              </button>
            ))}
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={onCartOpen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 13px",
              borderRadius: 9,
              border: `1.5px solid ${
                cartType === "alta-gama" ? "#5A2D82" : C.crimson
              }`,
              background: cartType === "alta-gama" ? "#EDE0FF" : C.crimsonLight,
              cursor: "pointer",
              color: cartType === "alta-gama" ? "#5A2D82" : C.crimson,
            }}
            title="Ver carrito"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M1 1H2.5L4.5 10H11.5L13.5 4H3.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="6" cy="12.5" r="1" fill="currentColor" />
              <circle cx="10" cy="12.5" r="1" fill="currentColor" />
            </svg>
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {cartType === "alta-gama" ? "Alta Gama" : "Carrito"}
            </span>
            <span
              style={{
                background: cartType === "alta-gama" ? "#5A2D82" : C.crimson,
                color: "white",
                borderRadius: 100,
                padding: "0 6px",
                fontSize: 11,
                fontWeight: 800,
                lineHeight: "18px",
              }}
            >
              {cartCount}
            </span>
          </button>
        )}
        <button
          onClick={onHelp}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: `1px solid ${C.border}`,
            background: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: C.textMuted,
          }}
          title="Ayuda y manual de uso"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M6 6C6 4.9 6.9 4 8 4C9.1 4 10 4.9 10 6C10 7 9.3 7.8 8.3 8C8.1 8 8 8.1 8 8.3V9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="8" cy="11" r="0.8" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={onDarkToggle}
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: `1px solid ${C.border}`,
            background: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: C.textMuted,
          }}
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? Ico.sun : Ico.moon}
        </button>
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              setNotifOpen(!notifOpen)
              if (!notifOpen)
                setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: notifOpen ? C.crimsonLight : C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              color: notifOpen ? C.crimson : C.textMuted,
            }}
            title="Notificaciones"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6V9.5L2 11H14L12.5 9.5V6C12.5 3.5 10.5 1.5 8 1.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M6.5 11C6.5 11.83 7.17 12.5 8 12.5S9.5 11.83 9.5 11"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: C.crimson,
                  border: "2px solid " + C.bg,
                }}
              />
            )}
          </button>
          {notifOpen && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                width: 330,
                background: C.card,
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "12px 16px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  Notificaciones
                </span>
                <span
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 11,
                    color: C.textFaint,
                  }}
                >
                  {notifs.length} alertas
                </span>
              </div>
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                {notifs.map((n, i) => {
                  const nc = notifColors[n.type] ?? {
                    dot: C.textMuted,
                    bg: C.bg,
                  }
                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: "11px 16px",
                        borderBottom:
                          i < notifs.length - 1
                            ? `1px solid ${C.borderLight}`
                            : "none",
                        background: n.read ? "transparent" : nc.bg + "55",
                        display: "flex",
                        gap: 11,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: nc.dot,
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Outfit',sans-serif",
                            fontSize: 13,
                            fontWeight: n.read ? 500 : 700,
                            color: C.text,
                            lineHeight: 1.2,
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12,
                            color: C.textMuted,
                            marginTop: 2,
                            lineHeight: 1.5,
                          }}
                        >
                          {n.desc}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 11,
                            color: C.textFaint,
                            marginTop: 4,
                          }}
                        >
                          {n.time}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: userMenuOpen ? C.crimsonLight : C.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: userMenuOpen ? C.crimson : C.textMuted,
              transition: "all 0.12s",
            }}
          >
            {Ico.user}
          </button>
          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                top: 42,
                right: 0,
                width: 204,
                background: C.card,
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                zIndex: 50,
              }}
            >
              <div
                style={{
                  padding: "12px 14px 10px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {
                    ({
                      student: "Juan Pérez",
                      teacher: "Marcela Vega",
                      admin: "No Docente",
                      icse: "Coordinación",
                    } as Record<Role, string>)[role]
                  }
                </div>
                <div
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 11,
                    color: C.textFaint,
                  }}
                >
                  {
                    ({
                      student: "jperez@icse.edu.ar",
                      teacher: "mvega@icse.edu.ar",
                      admin: "nododente@icse.edu.ar",
                      icse: "coordinacion@icse.edu.ar",
                    } as Record<Role, string>)[role]
                  }
                </div>
              </div>
              {[
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle
                        cx="6.5"
                        cy="4"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M1.5 12C1.5 9.5 3.7 7.5 6.5 7.5S11.5 9.5 11.5 12"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  label: "Mi Perfil / Configuración",
                  action: () => {
                    onProfile()
                    setUserMenuOpen(false)
                  },
                },
                {
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path
                        d="M5 6.5H11M11 6.5L9 4.5M11 6.5L9 8.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 3H2.5C2 3 1.5 3.4 1.5 3.9V9.1C1.5 9.6 2 10 2.5 10H6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                  label: "Cerrar Sesión",
                  action: () => setUserMenuOpen(false),
                  color: C.occupied,
                },
              ].map(({ icon, label, action, color }: any) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "10px 14px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: color ?? C.textMuted,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = C.bg
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background =
                      "transparent"
                  }}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
