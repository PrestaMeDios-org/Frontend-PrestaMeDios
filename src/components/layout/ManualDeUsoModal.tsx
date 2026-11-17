// MOMENTÁNEO (SPEC-10, RN-U02): modal "Manual de uso" del botón "?" (M-01, §4.5).
// Autocontenido a propósito: no depende de módulos de otros perfiles y se saca borrando
// este archivo, manualDeUso.ts y las líneas marcadas en App.tsx. No llama a la API (RN-U03).
import { useEffect, useState } from "react"
import { useC } from "../../theme"
import { Ico } from "../ui/icons"
import type { RolUsuario } from "../../features/auth/types"
import { MANUAL_POR_ROL, NOTA_MANUAL, vistaActiva } from "./manualDeUso"

export function ManualDeUsoModal({ rol, onClose }: { rol: RolUsuario; onClose: () => void }) {
  const C = useC()
  const seccion = MANUAL_POR_ROL[rol]
  const { acento, fondo } = seccion.color(C)

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
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
        zIndex: 60,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          background: C.card,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "24px 24px 18px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div>
            <h2
              id="manual-titulo"
              style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800 }}
            >
              Manual de Uso
            </h2>
            <div style={{ marginTop: 4, fontSize: 13, color: C.textMuted }}>{vistaActiva(rol)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 36,
              height: 36,
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
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Recuadro del rol */}
          <section
            style={{
              background: fondo,
              border: `1px solid ${acento}33`,
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontFamily: "'Outfit',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: acento,
              }}
            >
              {seccion.titulo}
            </h3>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {seccion.tareas.map((t, i) => (
                <li
                  key={t.texto}
                  title={`Requisito: ${t.requisito}`}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.text }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      borderRadius: 6,
                      background: acento,
                      color: "white",
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ opacity: t.proximamente ? 0.7 : 1 }}>{t.texto}</span>
                  {t.proximamente && (
                    <span
                      style={{
                        marginLeft: "auto",
                        flexShrink: 0,
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: C.pendingBg,
                        color: C.pending,
                        border: `1px solid ${C.pending}40`,
                      }}
                    >
                      Próximamente
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* Nota (D-04) */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 12.5,
              lineHeight: 1.5,
              color: C.textMuted,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 7.2V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="5" r="0.8" fill="currentColor" />
            </svg>
            <span>{NOTA_MANUAL}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            autoFocus
            style={{
              width: "100%",
              padding: "13px 16px",
              border: "none",
              borderRadius: 12,
              background: C.crimson,
              color: "white",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

/** Estado del manual para App.tsx: un solo punto de conexión (RN-U02). */
export function useManualDeUso(rol: RolUsuario) {
  const [abierto, setAbierto] = useState(false)
  return {
    abrir: () => setAbierto(true),
    modal: abierto ? <ManualDeUsoModal rol={rol} onClose={() => setAbierto(false)} /> : null,
  }
}
