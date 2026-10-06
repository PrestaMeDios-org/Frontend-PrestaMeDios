import { useC } from "../../theme"
import type { ReactNode, CSSProperties } from "react"

// Botón atómico con las variantes usadas en el prototipo.
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: "primary" | "ghost" | "danger"
  disabled?: boolean
  type?: "button" | "submit"
  title?: string
}) {
  const C = useC()
  const styles: Record<string, CSSProperties> = {
    primary: {
      border: "none",
      background: C.crimson,
      color: "white",
    },
    ghost: {
      border: `1.5px solid ${C.border}`,
      background: C.card,
      color: C.textMuted,
    },
    danger: {
      border: "none",
      background: C.occupied,
      color: "white",
    },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "9px 16px",
        borderRadius: 11,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 13.5,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  )
}
