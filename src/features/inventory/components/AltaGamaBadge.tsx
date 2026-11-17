import { useC } from "../../../theme"

// Chip "Alta Gama" (PRE-05), igual en la tarjeta y en la lista del catálogo (SPEC-10 V-05).
// Usa los tokens `premium`/`premiumBg` para leerse en claro y oscuro.
export function AltaGamaBadge() {
  const C = useC()
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        padding: "2px 7px",
        borderRadius: 6,
        background: C.premiumBg,
        border: `1px solid ${C.premium}30`,
        color: C.premium,
        fontFamily: "'Inter',sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M5 1L6.12 3.62L9 3.9L7 5.74L7.63 8.5L5 7.1L2.37 8.5L3 5.74L1 3.9L3.88 3.62L5 1Z"
          fill="currentColor"
        />
      </svg>
      Alta Gama
    </span>
  )
}
