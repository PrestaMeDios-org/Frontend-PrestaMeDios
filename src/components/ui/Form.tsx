import { useId, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../theme"

// Primitivas de formulario con los tokens del tema (usadas por auth, users y config).

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | null
  hint?: string
  /** Recibe el id del texto de ayuda/error para `aria-describedby`. */
  children: ReactNode | ((descripcionId: string | undefined) => ReactNode)
}) {
  const C = useC()
  const id = useId()
  const descripcionId = error || hint ? `${id}-desc` : undefined
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, fontWeight: 600, color: C.text }}>
          {label}
        </span>
        {typeof children === "function" ? children(descripcionId) : children}
      </label>
      {error ? (
        <span id={descripcionId} role="alert" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.occupied }}>
          {error}
        </span>
      ) : hint ? (
        <span id={descripcionId} style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export function useInputStyle(invalido = false): CSSProperties {
  const C = useC()
  return {
    width: "100%",
    padding: "9px 12px",
    border: `1.5px solid ${invalido ? C.occupied : C.border}`,
    borderRadius: 10,
    background: C.card,
    fontFamily: "'Inter',sans-serif",
    fontSize: 13.5,
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
  }
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  error,
  hint,
  placeholder,
  disabled,
  autoComplete,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  error?: string | null
  hint?: string
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
}) {
  const style = useInputStyle(Boolean(error))
  const C = useC()
  return (
    <Field label={label} error={error} hint={hint}>
      {(descripcionId) => (
      <input
        aria-describedby={descripcionId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ ...style, ...(disabled ? { background: C.bg, color: C.textMuted } : {}) }}
      />
      )}
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  error,
  disabled,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  error?: string | null
  disabled?: boolean
}) {
  const style = useInputStyle(Boolean(error))
  return (
    <Field label={label} error={error}>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)} style={style}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  const C = useC()
  return (
    <section
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {(title || actions) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          {title && (
            <h2 style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, color: C.text }}>
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Alert({
  tipo = "error",
  children,
}: {
  tipo?: "error" | "ok" | "info"
  children: ReactNode
}) {
  const C = useC()
  const colores = {
    error: { fg: C.occupied, bg: C.occupiedBg },
    ok: { fg: C.available, bg: C.availableBg },
    info: { fg: C.mine, bg: C.mineBg },
  }[tipo]
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: colores.bg,
        color: colores.fg,
        fontFamily: "'Inter',sans-serif",
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  )
}

export function Grid({ children, min = 220 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }}>
      {children}
    </div>
  )
}
