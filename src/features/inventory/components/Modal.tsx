import { useEffect, type ReactNode } from "react"
import { useC } from "../../../theme"
import { Ico } from "../../../components/ui/icons"

// Diálogo simple para los formularios de inventario (cierra con Escape o clic afuera).
// SPEC-10 (V-07): `subtitulo`, `extraTitulo`, `conCerrar` y `pie` son opcionales. Sin ellos,
// el diálogo se ve exactamente como antes; con ellos, tiene encabezado con X, cuerpo con
// scroll y un pie fijo que queda siempre visible.
export function Modal({
  titulo,
  onClose,
  children,
  ancho = 560,
  subtitulo,
  extraTitulo,
  conCerrar = false,
  pie,
  cerrarAfuera = true,
}: {
  titulo: string
  onClose: () => void
  children: ReactNode
  ancho?: number
  subtitulo?: ReactNode
  /** Algo al lado del título (p. ej. el chip "Alta Gama"). */
  extraTitulo?: ReactNode
  /** Muestra el botón X en el encabezado. */
  conCerrar?: boolean
  /** Acciones fijas al pie (p. ej. "Cerrar" y "Agregar al pedido"). */
  pie?: ReactNode
  /**
   * SPEC-10 V-15: `false` en formularios. No se cierra con clic afuera ni con Escape, así
   * un clic errado no borra lo cargado; se cierra con la X o con los botones del pie.
   */
  cerrarAfuera?: boolean
}) {
  const C = useC()

  useEffect(() => {
    if (!cerrarAfuera) return
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", alTeclear)
    return () => window.removeEventListener("keydown", alTeclear)
  }, [onClose, cerrarAfuera])

  const enriquecido = subtitulo !== undefined || extraTitulo !== undefined || conCerrar || pie !== undefined

  const tituloH2 = (
    <h2
      style={{
        margin: 0,
        fontFamily: "'Outfit',sans-serif",
        fontSize: enriquecido ? 19 : 17,
        fontWeight: enriquecido ? 800 : 700,
        color: C.text,
      }}
    >
      {titulo}
    </h2>
  )

  return (
    <div
      onClick={cerrarAfuera ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: enriquecido ? "center" : "flex-start",
        justifyContent: "center",
        padding: enriquecido ? 16 : "40px 16px",
        overflowY: "auto",
        zIndex: 50,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        style={
          enriquecido
            ? {
                width: "100%",
                maxWidth: ancho,
                maxHeight: "calc(100vh - 32px)",
                background: C.card,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }
            : {
                width: "100%",
                maxWidth: ancho,
                background: C.card,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }
        }
      >
        {!enriquecido && (
          <>
            {tituloH2}
            {children}
          </>
        )}
        {enriquecido && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "20px 22px 16px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {tituloH2}
                  {extraTitulo}
                </div>
                {subtitulo !== undefined && (
                  <div style={{ marginTop: 4, fontSize: 13, color: C.textMuted }}>{subtitulo}</div>
                )}
              </div>
              {conCerrar && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {Ico.close}
                </button>
              )}
            </div>
            <div style={{ padding: 22, overflowY: "auto", flex: 1 }}>{children}</div>
            {pie !== undefined && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  borderTop: `1px solid ${C.border}`,
                  background: C.surface,
                  flexShrink: 0,
                }}
              >
                {pie}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
