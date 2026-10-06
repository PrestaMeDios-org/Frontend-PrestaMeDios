import { useState, type ReactNode } from "react"
import { useC } from "../../theme"
import type { Role, Screen, CartType } from "../../types"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

// MainLayout: Sidebar fija a la izquierda + Navbar arriba + contenido central.
export function MainLayout({
  children,
  role,
  screen,
  onNavigate,
  onRoleChange,
  title,
  subtitle,
  dark,
  onDarkToggle,
  onProfile,
  onHelp,
  cartCount = 0,
  cartType = null,
  onCartOpen,
}: {
  children: ReactNode
  role: Role
  screen: Screen
  onNavigate: (s: Screen) => void
  onRoleChange: (r: Role) => void
  title: string
  subtitle?: string
  dark: boolean
  onDarkToggle: () => void
  onProfile: () => void
  onHelp: () => void
  cartCount?: number
  cartType?: CartType
  onCartOpen?: () => void
}) {
  const C = useC()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <Sidebar
        screen={screen}
        role={role}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Navbar
          role={role}
          onRoleChange={onRoleChange}
          title={title}
          subtitle={subtitle}
          dark={dark}
          onDarkToggle={onDarkToggle}
          onProfile={onProfile}
          onHelp={onHelp}
          cartCount={cartCount}
          cartType={cartType}
          onCartOpen={onCartOpen ?? (() => {})}
        />
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
