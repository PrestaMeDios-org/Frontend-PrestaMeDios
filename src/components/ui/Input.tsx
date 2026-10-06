import { useC } from "../../theme"
import { Ico } from "./icons"

// Input atómico de búsqueda con icono, idéntico al del catálogo original.
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const C = useC()
  return (
    <div style={{ position: "relative", flex: "1 1 320px", maxWidth: 380 }}>
      <span
        style={{
          position: "absolute",
          left: 11,
          top: "50%",
          transform: "translateY(-50%)",
          color: C.textFaint,
        }}
      >
        {Ico.search}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px 9px 34px",
          border: `1.5px solid ${C.border}`,
          borderRadius: 11,
          background: C.card,
          fontFamily: "'Outfit',sans-serif",
          fontSize: 13.5,
          color: C.text,
          outline: "none",
        }}
      />
    </div>
  )
}

// Input atómico genérico con los tokens del tema.
export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  const C = useC()
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1.5px solid ${C.border}`,
        borderRadius: 11,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 13.5,
        color: C.text,
        outline: "none",
        background: C.card,
      }}
    />
  )
}
