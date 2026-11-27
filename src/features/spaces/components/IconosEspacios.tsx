import type { ReactNode } from "react"

// SPEC-10: íconos de línea de Reservas de Espacios (trazo de 1,5 en 16 px, al estilo de Lucide,
// ISC). Propios de `spaces` para no depender de otros módulos.

export function IconoEspacio({ d, size = 14 }: { d: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {d}
    </svg>
  )
}

export const ICONOS_ESPACIOS = {
  // Espacio: puerta abierta (door-open).
  espacio: (
    <>
      <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01" />
      <path d="M13 4.56v16.88a.5.5 0 0 1-.68.47L5 19V5.83a2 2 0 0 1 1.38-1.9l5.4-1.8A1 1 0 0 1 13 3.08z" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  // Sede: pin de mapa (map-pin).
  sede: (
    <>
      <path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  // Turnos elegidos: círculo con tilde (circle-check).
  elegidos: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // Siguiente paso: flecha (arrow-right).
  flecha: <path d="M5 12h14M12 5l7 7-7 7" />,
  // Materia: libro abierto (book-open).
  materia: (
    <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  ),
  // Descripción: hoja con renglones (file-text).
  descripcion: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
    </>
  ),
}
