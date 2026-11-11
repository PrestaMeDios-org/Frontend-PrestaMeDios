import { useMemo, useState } from "react"
import { useC } from "../../../theme"
import type { Bloqueo, Ocupacion } from "../types"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// Calendario mensual interactivo: navega hasta 4 meses hacia adelante,
// permite seleccionar un día y ver sus franjas ocupadas/bloqueadas.
export function CalendarGrid({
  reservas,
  bloqueos,
  selectedFecha,
  onSelectFecha,
  onMonthChange,
}: {
  reservas: Ocupacion[]
  bloqueos: Bloqueo[]
  selectedFecha: string | null
  onSelectFecha: (iso: string) => void
  onMonthChange?: (view: Date) => void
}) {
  const C = useC()
  const hoy = new Date()
  const [view, setView] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [fechaConMotivoVisible, setFechaConMotivoVisible] = useState<string | null>(null)

  const maxView = new Date(hoy.getFullYear(), hoy.getMonth() + 4, 1)
  const canPrev = view > new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const canNext = view < maxView

  const celdas = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7 // lunes = 0
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
    const out: (Date | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= days; d++)
      out.push(new Date(view.getFullYear(), view.getMonth(), d))
    return out
  }, [view])

  const ocupadoEl = (iso: string) =>
    reservas.some(
      (r) => r.fecha === iso && (r.estado === "Aprobada" || r.estado === "En_Uso"),
    ) || bloqueos.some((b) => b.fechaInicio <= iso && b.fechaFin >= iso)

  const bloqueadoEl = (iso: string) =>
    bloqueos.some(
      (b) => b.fechaInicio <= iso && b.fechaFin >= iso && !b.horaInicio,
    )

  const pendienteEl = (iso: string) =>
    reservas.some((r) => r.fecha === iso && r.estado === "Pendiente")

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <button
          disabled={!canPrev}
          onClick={() => {
            const next = new Date(view.getFullYear(), view.getMonth() - 1, 1)
            setView(next)
            onMonthChange?.(next)
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: canPrev ? "pointer" : "default",
            color: canPrev ? C.text : C.textFaint,
            fontSize: 18,
          }}
        >
          ‹
        </button>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: C.text }}>
          {MESES[view.getMonth()]} {view.getFullYear()}
        </div>
        <button
          disabled={!canNext}
          onClick={() => {
            const next = new Date(view.getFullYear(), view.getMonth() + 1, 1)
            setView(next)
            onMonthChange?.(next)
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: canNext ? "pointer" : "default",
            color: canNext ? C.text : C.textFaint,
            fontSize: 18,
          }}
        >
          ›
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 6,
          textAlign: "center",
        }}
      >
        {DIAS.map((d) => (
          <div
            key={d}
            style={{ fontSize: 11, color: C.textFaint, fontFamily: "'Inter',sans-serif" }}
          >
            {d}
          </div>
        ))}
        {celdas.map((d, i) => {
          if (!d) return <div key={`b${i}`} />
          const iso = toISO(d)
          const past = d < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
          const selected = iso === selectedFecha
          const ocupado = ocupadoEl(iso)
          const bloqueado = bloqueadoEl(iso)
          const pendiente = !ocupado && !bloqueado && pendienteEl(iso)
          const detalleBloqueo = Array.from(
            new Map(
              bloqueos
                .filter((b) => b.fechaInicio <= iso && b.fechaFin >= iso)
                .map((b) => [b.id, b]),
            ).values(),
          )
            .map((b) => `${b.motivo}${b.horaInicio ? ` (${b.horaInicio}–${b.horaFin})` : " (todo el día)"}`)
            .join("\n")
          const mostrarMotivo = fechaConMotivoVisible === iso && detalleBloqueo.length > 0
          const tooltipId = `motivo-bloqueo-${iso}`
          return (
            <div
              key={iso}
              onMouseEnter={() => detalleBloqueo && setFechaConMotivoVisible(iso)}
              onMouseLeave={() => setFechaConMotivoVisible(null)}
              onFocus={() => detalleBloqueo && setFechaConMotivoVisible(iso)}
              onBlur={() => setFechaConMotivoVisible(null)}
              style={{ position: "relative", minWidth: 0 }}
            >
              <button
                disabled={past || bloqueado}
                aria-describedby={mostrarMotivo ? tooltipId : undefined}
                onClick={() => onSelectFecha(iso)}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 10,
                  border: selected ? `2px solid ${C.crimson}` : "1px solid transparent",
                  background: selected
                    ? C.crimsonLight
                    : bloqueado
                      ? C.maintenanceBg
                      : ocupado
                        ? C.occupiedBg
                        : pendiente
                          ? C.pendingBg
                          : "transparent",
                  color: past || bloqueado ? C.textFaint : C.text,
                  cursor: past || bloqueado ? "default" : "pointer",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                }}
              >
                {d.getDate()}
              </button>
              {mostrarMotivo && (
                <span
                  id={tooltipId}
                  role="tooltip"
                  style={{
                    position: "absolute",
                    zIndex: 10,
                    top: "50%",
                    left: "calc(100% + 6px)",
                    transform: "translateY(-50%)",
                    width: "max-content",
                    maxWidth: 220,
                    padding: "7px 10px",
                    borderRadius: 7,
                    background: C.text,
                    color: C.card,
                    boxShadow: "0 3px 12px rgba(0,0,0,0.2)",
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    lineHeight: 1.4,
                    textAlign: "left",
                    whiteSpace: "pre-line",
                    pointerEvents: "none",
                  }}
                >
                  {detalleBloqueo}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
