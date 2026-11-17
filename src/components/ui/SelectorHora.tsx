import { useC } from "../../theme"
import { useInputStyle } from "./Form"

// Lista de horas con el estilo de los campos (SPEC-10 §4.6): reemplaza a <input type="time">.

/** "08:00", "08:30", … entre `desde` y `hasta` (ambos incluidos), cada `paso` minutos. */
export function horasEntre(desde = "00:00", hasta = "23:30", paso = 30): string[] {
  const aMin = (h: string) => {
    const [hh, mm] = h.split(":").map(Number)
    return hh * 60 + mm
  }
  const res: string[] = []
  for (let m = aMin(desde); m <= aMin(hasta); m += paso)
    res.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
  return res
}

export function SelectorHora({
  value,
  onChange,
  opciones = horasEntre(),
  invalido = false,
  vacio,
  ariaLabel,
  ariaDescribedBy,
}: {
  value: string
  onChange: (hora: string) => void
  opciones?: string[]
  invalido?: boolean
  /** Texto de la opción vacía (si se permite no elegir hora). */
  vacio?: string
  ariaLabel?: string
  ariaDescribedBy?: string
}) {
  const C = useC()
  const estilo = useInputStyle(invalido)
  // Si el valor guardado no cae en la grilla (p. ej. 10:15), se agrega para no perderlo.
  const lista = value && !opciones.includes(value) ? [...opciones, value].sort() : opciones
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalido || undefined}
        style={{ ...estilo, paddingRight: 30, cursor: "pointer" }}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {lista.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
        style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }}
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
