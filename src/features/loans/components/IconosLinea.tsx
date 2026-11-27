import type { ReactNode } from "react"
import { ZONA_LAB } from "../../../lib/fechas"

// SPEC-10: íconos de línea (trazo de 1,5 en 16 px, al estilo de Lucide, ISC) y formatos cortos de
// fecha y hora en la zona del laboratorio, compartidos por Mis Solicitudes y la Bandeja.

export function Icono({ d, size = 14 }: { d: ReactNode; size?: number }) {
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

export const ICONO = {
  // Solicitud: hoja con renglones (clipboard-list).
  solicitud: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </>
  ),
  // Retiro: caja con flecha que sale (package + arrow-up).
  retiro: (
    <>
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l1-.57" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
      <path d="M19 22v-6M16 19l3-3 3 3" />
    </>
  ),
  // Devolución: caja con flecha que entra (package + arrow-down).
  devolucion: (
    <>
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l1-.57" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
      <path d="M19 16v6M16 19l3 3 3-3" />
    </>
  ),
  // Estado: tres pelotitas.
  estado: (
    <>
      <circle cx="4" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity={0.6} />
      <circle cx="20" cy="12" r="3" fill="currentColor" stroke="none" opacity={0.3} />
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
  // Pedida el…: calendario con un más (calendar-plus).
  pedida: (
    <>
      <path d="M8 2v4M16 2v4M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M3 10h18M16 19h6M19 16v6" />
    </>
  ),
  // Espacio: puerta abierta (door-open).
  espacio: (
    <>
      <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01" />
      <path d="M13 4.56v16.88a.5.5 0 0 1-.68.47L5 19V5.83a2 2 0 0 1 1.38-1.9l5.4-1.8A1 1 0 0 1 13 3.08z" />
    </>
  ),
  // Fecha y horario: calendario con reloj (calendar-clock).
  fechaHorario: (
    <>
      <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
      <circle cx="16" cy="16" r="6" />
      <path d="M16 14v2l1 1" />
    </>
  ),
  // Equipamiento: caja (package).
  equipamiento: (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12M3.29 7 12 12l8.71-5M7.5 4.27l9 5.15" />
    </>
  ),
  // Solicitante: persona (user).
  persona: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  // Asignatura: libro abierto (book-open).
  asignatura: (
    <>
      <path d="M12 7v14M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  // Período: calendario con rango (calendar-range).
  periodo: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M17 14h-6M13 18H7M7 14h.01M17 18h.01" />
    </>
  ),
  // Acciones: deslizadores (sliders-horizontal).
  acciones: (
    <>
      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
    </>
  ),
  // Botones de la bandeja.
  aprobar: <path d="M20 6 9 17l-5-5" />,
  rechazar: <path d="M18 6 6 18M6 6l12 12" />,
  documento: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
    </>
  ),
  // Quitar: tachito (trash-2).
  quitar: (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </>
  ),
  // Motivo de la resolución: globo de texto.
  motivo: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </>
  ),
}

export const DIA_CORTO = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, day: "2-digit", month: "2-digit", year: "2-digit" })
export const HORA_CORTA = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, hour: "2-digit", minute: "2-digit", hour12: false })
