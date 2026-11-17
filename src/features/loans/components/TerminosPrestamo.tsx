import { useEffect, useRef, useState } from "react"
import { useC } from "../../../theme"
import { PORTAL } from "../../notifications/services/portal"

/**
 * MOMENTÁNEO (SPEC-10 V-19): texto tomado del diseño de Figma, a reemplazar por los artículos
 * del Reglamento (Resolución CICSE N° 056/2023) cuando estén cargados en el sistema.
 */
export const REGLAMENTO_USO = [
  "Devolver el equipo en la fecha y horario acordados, en las mismas condiciones en que fue entregado.",
  "Cuidar los lentes y accesorios ópticos: nunca limpiar con ropa ni superficies abrasivas.",
  "Reportar de inmediato cualquier daño accidental al personal del laboratorio.",
  "El préstamo es personal e intransferible — no ceder el equipo a terceros.",
] as const

/**
 * Casilla de Términos y Condiciones de la solicitud (PRE-03). El enlace muestra el reglamento
 * en un globo: al pasar el mouse o al tocarlo (para pantallas táctiles); se cierra con Escape
 * o tocando afuera.
 */
export function TerminosPrestamo({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const C = useC()
  const [hover, setHover] = useState(false)
  const [fijo, setFijo] = useState(false)
  const caja = useRef<HTMLSpanElement>(null)
  const abierto = hover || fijo

  useEffect(() => {
    if (!fijo) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setFijo(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setFijo(false)
      }
    }
    document.addEventListener("mousedown", fuera)
    document.addEventListener("keydown", esc, true)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("keydown", esc, true)
    }
  }, [fijo])

  const texto = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text } as const

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        id="acepta-terminos"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 18, height: 18, accentColor: C.crimson, cursor: "pointer", margin: 0 }}
      />
      <span style={texto}>
        <label htmlFor="acepta-terminos" style={{ cursor: "pointer" }}>
          Acepto los{" "}
        </label>
        <span
          ref={caja}
          style={{ position: "relative", display: "inline-block" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <button
            type="button"
            aria-expanded={abierto}
            aria-controls="reglamento-uso"
            onClick={() => setFijo((f) => !f)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            style={{
              all: "unset",
              cursor: "pointer",
              color: C.crimson,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Términos y Condiciones
          </button>
          {abierto && (
            <span
              id="reglamento-uso"
              role="tooltip"
              style={{
                position: "absolute",
                bottom: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                width: 340,
                zIndex: 20,
                background: C.text,
                color: C.card,
                borderRadius: 12,
                padding: "16px 18px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Reglamento de uso
              </span>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {REGLAMENTO_USO.map((r, i) => (
                  <li
                    key={r}
                    style={{ display: "flex", gap: 8, fontFamily: "'Inter',sans-serif", fontSize: 12.5, lineHeight: 1.45 }}
                  >
                    <span style={{ opacity: 0.6, minWidth: 14 }}>{i + 1}.</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
              <span style={{ display: "block", marginTop: 10, fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.65 }}>
                {PORTAL.normativa.titulo} · {PORTAL.normativa.referencia}
              </span>
              {/* flechita hacia el enlace */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: `7px solid ${C.text}`,
                }}
              />
            </span>
          )}
        </span>
      </span>
    </span>
  )
}
