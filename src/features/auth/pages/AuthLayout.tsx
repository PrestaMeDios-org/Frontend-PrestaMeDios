import type { ReactNode } from "react"
import { useC } from "../../../theme"
import logoUntdf from "../../../imports/untdf_l.png"

// Marco común de las pantallas públicas (login, registro, cambio de contraseña).
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const C = useC()
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: 460,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "28px 30px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logoUntdf} alt="UNTDF" style={{ height: 38 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.crimson }}>PrestaMeDios</div>
            <div style={{ fontSize: 11.5, color: C.textFaint }}>Laboratorio de Medios Audiovisuales · ICSE</div>
          </div>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </main>
    </div>
  )
}

export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  const C = useC()
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: C.crimson,
        cursor: "pointer",
        fontFamily: "'Inter',sans-serif",
        fontSize: 13,
        fontWeight: 600,
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}
