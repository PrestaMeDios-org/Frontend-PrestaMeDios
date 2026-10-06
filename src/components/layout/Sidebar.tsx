import { useC } from "../../theme"
import { Ico } from "../ui/icons"
import type { Role, Screen } from "../../types"

export function Sidebar({
  screen,
  role,
  onNavigate,
  collapsed,
  onToggle,
}: {
  screen: Screen
  role: Role
  onNavigate: (s: Screen) => void
  collapsed: boolean
  onToggle: () => void
}) {
  const C = useC()
  const common = [
    {
      key: "catalog",
      label: "Catálogo de Equipos",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="1"
            y="1"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="9"
            y="1"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="1"
            y="9"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <rect
            x="9"
            y="9"
            width="6"
            height="6"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      key: "spaces",
      label: "Reservas de Espacios",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 1.5V3.5M11 1.5V3.5M1.5 6H14.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: "news",
      label: "Novedades",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect
            x="1.5"
            y="2"
            width="13"
            height="12"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 6H11M5 9H9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ]
  const roleItems: Record<Role, any[]> = {
    student: [
      {
        key: "status",
        label: "Mis Solicitudes",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="2"
              y="1.5"
              width="12"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 6H11M5 9H11M5 12H8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
    teacher: [
      {
        key: "validations",
        label: "Validaciones Pendientes",
        badge: 3,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5.5 8L7.5 10L10.5 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
    admin: [
      {
        key: "admin-dashboard",
        label: "Historial Solicitudes",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="2"
              y="1.5"
              width="12"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5 6H11M5 9H11M5 12H8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        key: "admin-validations",
        label: "Bandeja de Validaciones",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="1.5"
              y="2"
              width="13"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M5 6H11M5 9H9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="12" cy="3" r="2.5" fill="currentColor" />
          </svg>
        ),
      },
      {
        key: "admin-stock",
        label: "Control de Stock",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 3H14V6H2V3Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M2 6V13H14V6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M6 9H10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        key: "admin-calendar",
        label: "Calendario de Operaciones",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="12"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M5 1.5V3.5M11 1.5V3.5M1.5 6H14.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="5.5" cy="9.5" r="1" fill="currentColor" />
            <circle cx="8.5" cy="9.5" r="1" fill="currentColor" />
            <circle cx="11.5" cy="9.5" r="1" fill="currentColor" />
            <circle cx="5.5" cy="12.5" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        key: "users",
        label: "Gestión de Usuarios",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="6"
              cy="5"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M1 13C1 10.8 3.2 9 6 9S11 10.8 11 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle
              cx="11"
              cy="5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M13 8.5C14.1 9.2 15 10.6 15 12.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        key: "deliveries",
        label: "Gestión de Entregas",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 5H14M2 5V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V5M2 5L4 2H12L14 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        key: "notes",
        label: "Anotaciones",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M9 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H12.5C13.33 14 14 13.33 14 12.5V7L9 2Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M9 2V7H14M5 10H11M5 12H8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ],
    icse: [],
  }
  const fa = (k: string) => roleItems.admin.find((i: any) => i.key === k)!
  const groupedItems: Record<Role, { group: string; items: any[] }[]> = {
    student: [
      { group: "RECURSOS", items: common },
      { group: "MIS ACTIVIDADES", items: roleItems.student },
    ],
    teacher: [
      { group: "RECURSOS", items: common },
      { group: "GESTIÓN", items: roleItems.teacher },
    ],
    admin: [
      { group: "RECURSOS", items: [common[0], common[1], common[2]] },
      {
        group: "OPERATIVA DIARIA",
        items: [
          fa("admin-validations"),
          fa("deliveries"),
          fa("admin-dashboard"),
          fa("admin-calendar"),
        ],
      },
      {
        group: "ADMINISTRACIÓN",
        items: [fa("admin-stock"), fa("users"), fa("notes")],
      },
    ],
    icse: [{ group: "ADMINISTRACIÓN", items: [fa("users"), fa("notes")] }],
  }
  const groups = groupedItems[role]
  const userInfo: Record<Role, { initials: string; name: string; sub: string }> =
    {
      student: {
        initials: "JP",
        name: "Juan Pérez",
        sub: "Estudiante · 3er año",
      },
      teacher: {
        initials: "MV",
        name: "Marcela Vega",
        sub: "Docente · Video II",
      },
      admin: { initials: "ND", name: "No Docente", sub: "Admin · Pañol ICSE" },
      icse: { initials: "AI", name: "Admin ICSE", sub: "Coordinación ICSE" },
    }
  const ui = userInfo[role]
  return (
    <aside
      style={{
        width: collapsed ? 64 : 228,
        background: C.sidebar,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 30,
        transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: collapsed ? "14px 0" : "18px 16px 14px",
          borderBottom: `1px solid ${C.sidebarBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              border: "none",
              background: "rgba(255,255,255,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.5)",
            }}
            title="Expandir menú"
          >
            {Ico.hamburger}
          </button>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 800,
                  fontSize: 14.5,
                  color: "white",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}
              >
                PrestaMeDios
              </div>
              <div
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 9.5,
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                ICSE · Gestión de Recursos
              </div>
            </div>
            <button
              onClick={onToggle}
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "none",
                background: "rgba(255,255,255,0.06)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
                flexShrink: 0,
              }}
              title="Colapsar menú"
            >
              {Ico.hamburger}
            </button>
          </>
        )}
      </div>
      <nav
        style={{
          flex: 1,
          padding: collapsed ? "10px 6px" : "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {groups.map(({ group, items }, gi) => (
          <div key={group || gi} style={{ marginTop: gi > 0 ? 10 : 0 }}>
            {!collapsed && group && (
              <div
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 9,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "2px 10px 5px",
                }}
              >
                {group}
              </div>
            )}
            {items.map(({ key, label, icon, badge }: any) => {
              const active =
                screen === key || (screen === "detail" && key === "catalog")
              return (
                <button
                  key={key}
                  onClick={() => onNavigate(key as Screen)}
                  title={collapsed ? label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 9,
                    width: "100%",
                    padding: collapsed ? "10px 0" : "8px 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    background: active ? "rgba(139,26,47,0.85)" : "transparent",
                    color: active ? "white" : C.sidebarText,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>
                    {icon}
                  </span>
                  {!collapsed && (
                    <span
                      style={{
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: 13.5,
                        fontWeight: active ? 600 : 400,
                        flex: 1,
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>
                  )}
                  {badge && !active && !collapsed && (
                    <span
                      style={{
                        background: C.crimson,
                        color: "white",
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 100,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div
        style={{
          padding: collapsed ? "10px 0" : "12px 14px 14px",
          borderTop: `1px solid ${C.sidebarBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 9,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(139,26,47,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "white",
            }}
          >
            {ui.initials}
          </span>
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ui.name}
            </div>
            <div
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 10.5,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {ui.sub}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
