import { useEffect, type ReactNode } from "react"
import { useC } from "../../../theme"

// Diálogo simple para los formularios de inventario (cierra con Escape o clic afuera).
export function Modal({
  titulo,
  onClose,
  children,
  ancho = 560,
}: {
  titulo: string
  onClose: () => void
  children: ReactNode
  ancho?: number
}) {
  const C = useC()

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", alTeclear)
    return () => window.removeEventListener("keydown", alTeclear)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
        zIndex: 50,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: ancho,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "'Outfit',sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: C.text,
          }}
        >
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  )
}
