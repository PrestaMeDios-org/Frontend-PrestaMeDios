import { useEffect, useRef, useState } from "react"
import { useC } from "../../theme"
import { useInputStyle } from "./Form"
import { GrillaMes, type InfoDia } from "./calendario/GrillaMes"
import { fechaDeIso, formatoCorto, primeroDelMes } from "./calendario/mes"

// Selector de fecha común (SPEC-10 §4.6, V-01): reemplaza a <input type="date"> y al
// datetime-local. Se ve como el resto de los campos y abre la grilla común en un desplegable.
interface Props {
  /** "AAAA-MM-DD" o "" si no hay fecha. */
  value: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  /** Estado de cada día (p. ej. disponibilidad del pedido). */
  infoDia?: (iso: string) => InfoDia
  /** Días a resaltar (p. ej. retiro → devolución). */
  rango?: { desde: string; hasta: string }
  invalido?: boolean
  placeholder?: string
  atenuarFinDeSemana?: boolean
  /** Muestra el botón "Borrar" (para fechas opcionales). */
  borrable?: boolean
  ariaDescribedBy?: string
  ariaLabel?: string
  /** Texto chico al pie del desplegable (p. ej. la leyenda de colores). */
  pie?: string
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  infoDia,
  rango,
  invalido = false,
  placeholder = "dd/mm/aaaa",
  atenuarFinDeSemana = false,
  borrable = false,
  ariaDescribedBy,
  ariaLabel,
  pie,
}: Props) {
  const C = useC()
  const estiloCampo = useInputStyle(invalido)
  const [abierto, setAbierto] = useState(false)
  const inicial = () => primeroDelMes(value ? fechaDeIso(value) : min ? fechaDeIso(min) : new Date())
  const [mes, setMes] = useState(inicial)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation() // que no cierre también el modal que lo contiene
        setAbierto(false)
      }
    }
    document.addEventListener("mousedown", fuera)
    window.addEventListener("keydown", tecla, true)
    return () => {
      document.removeEventListener("mousedown", fuera)
      window.removeEventListener("keydown", tecla, true)
    }
  }, [abierto])

  const abrir = () => {
    setMes(inicial())
    setAbierto((a) => !a)
  }

  return (
    <div ref={raiz} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-invalid={invalido || undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        style={{
          ...estiloCampo,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          textAlign: "left",
          cursor: "pointer",
          // `border` completo: mezclar el shorthand con `borderColor` hace que React pierda el color.
          border: `1.5px solid ${invalido ? C.occupied : abierto ? C.crimson : C.border}`,
        }}
      >
        <span style={{ color: value ? C.text : C.textFaint }}>{value ? formatoCorto(value) : placeholder}</span>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: C.textMuted, flexShrink: 0 }}>
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 6.5H14M5.5 1.5V4M10.5 1.5V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 70,
            width: 300,
            maxWidth: "calc(100vw - 32px)",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            padding: 12,
            animation: "fadeIn 0.12s ease-out",
          }}
        >
          <GrillaMes
            compacto
            mes={mes}
            onMes={setMes}
            infoDia={infoDia}
            min={min}
            max={max}
            seleccionado={value || undefined}
            rango={rango}
            atenuarFinDeSemana={atenuarFinDeSemana}
            onElegir={(iso) => {
              onChange(iso)
              setAbierto(false)
            }}
          />
          {(pie || borrable) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 8,
                fontSize: 11,
                color: C.textMuted,
              }}
            >
              <span>{pie}</span>
              {borrable && value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("")
                    setAbierto(false)
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: C.crimson,
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Borrar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
