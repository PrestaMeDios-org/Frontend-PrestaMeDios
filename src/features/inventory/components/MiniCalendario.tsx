import { useMemo, useState, type CSSProperties } from "react"
import { useC } from "../../../theme"
import type { Sede } from "../types"
import { hoyLab } from "../../../lib/fechas"
import { aIso, puedeIrA, rangoDelMes, ventana } from "../services/calendario"
import { useDisponibilidad } from "../hooks/useDisponibilidad"

interface Props {
  equipamientoId: number
  sede?: Sede
  /** Por defecto, hoy en la zona del laboratorio. */
  hoy?: Date
}

type EstadoDia = "fuera" | "cargando" | "libre" | "sin"

export function MiniCalendario({ equipamientoId, sede, hoy = hoyLab() }: Props) {
  const C = useC()
  const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const rango = rangoDelMes(mes, hoy)
  const { data, cargando, error } = useDisponibilidad(
    equipamientoId,
    rango?.desde ?? null,
    rango?.hasta ?? null,
    sede,
  )

  const diasMap = useMemo(() => {
    const m = new Map<string, number>()
    data?.dias.forEach((d) => m.set(d.fecha, d.unidades_libres))
    return m
  }, [data])

  const { min, max } = ventana(hoy)
  const primerDia = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const offset = (primerDia.getDay() + 6) % 7 // lunes=0
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celdas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)]

  const puedeAnterior = puedeIrA(new Date(mes.getFullYear(), mes.getMonth() - 1, 1), hoy)
  const puedeSiguiente = puedeIrA(new Date(mes.getFullYear(), mes.getMonth() + 1, 1), hoy)

  const colores: Record<EstadoDia, { color: string; bg: string }> = {
    fuera: { color: C.textFaint, bg: "transparent" },
    cargando: { color: C.textMuted, bg: C.surface },
    libre: { color: C.available, bg: C.availableBg },
    sin: { color: C.occupied, bg: C.occupiedBg },
  }
  const navBtn = (activo: boolean): CSSProperties => ({
    width: 28,
    height: 28,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    background: C.card,
    color: activo ? C.text : C.textFaint,
    cursor: activo ? "pointer" : "default",
    fontSize: 16,
    lineHeight: 1,
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          aria-label="Mes anterior"
          style={navBtn(puedeAnterior)}
          disabled={!puedeAnterior}
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
          {mes.toLocaleString("es-AR", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          style={navBtn(puedeSiguiente)}
          disabled={!puedeSiguiente}
          onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>
      {cargando && <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>Cargando…</p>}
      {error && <p style={{ margin: 0, fontSize: 12, color: C.occupied }}>{error}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.textMuted }}>
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`e-${i}`} />
          const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia)
          const iso = aIso(fecha)
          const fuera = fecha < min || fecha > max
          const libres = diasMap.get(iso)
          const estado: EstadoDia = fuera ? "fuera" : libres === undefined ? "cargando" : libres > 0 ? "libre" : "sin"
          const { color, bg } = colores[estado]
          return (
            <div
              key={iso}
              aria-label={`${iso}: ${libres ?? 0} unidades libres`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                minHeight: 40,
                padding: "4px 0",
                borderRadius: 6,
                background: bg,
                color,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{dia}</span>
              {!fuera && libres !== undefined && (
                <small style={{ fontSize: 10, lineHeight: 1, opacity: 0.85 }}>{libres} libres</small>
              )}
            </div>
          )
        })}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Orientativo: la confirmación llega al enviar el pedido.</p>
    </div>
  )
}
