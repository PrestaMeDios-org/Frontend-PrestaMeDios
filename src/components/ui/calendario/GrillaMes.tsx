import type { CSSProperties } from "react"
import { useC } from "../../../theme"
import { celdasDelMes, esFinDeSemana, fechaDeIso, mesTieneDias, sumarMeses, tituloMes } from "./mes"

// Grilla mensual común (SPEC-10 §4.6, V-01): la usan el mini-calendario del detalle del
// equipo y el DatePicker. Sólo dibuja: el estado de cada día lo decide quien la usa.

export type EstadoDia = "neutro" | "libre" | "sin" | "fuera" | "cargando"

export interface InfoDia {
  estado: EstadoDia
  /** Segunda línea chica, p. ej. "5 libres". */
  texto?: string
  /** Por defecto se puede elegir si no está "fuera" ni "sin". */
  elegible?: boolean
  /** Tooltip y etiqueta accesible extra. */
  ayuda?: string
}

interface Props {
  mes: Date
  onMes: (mes: Date) => void
  /** Estado de cada día; sin esto, todos "neutro". */
  infoDia?: (iso: string) => InfoDia
  min?: string
  max?: string
  seleccionado?: string
  /** Días resaltados entre `desde` y `hasta` (ambos incluidos). */
  rango?: { desde: string; hasta: string }
  onElegir?: (iso: string) => void
  /** Atenúa sábados y domingos (siguen siendo elegibles). */
  atenuarFinDeSemana?: boolean
  /** Celdas más bajas, para el desplegable del DatePicker. */
  compacto?: boolean
}

const DIAS = ["L", "M", "X", "J", "V", "S", "D"]

export function GrillaMes({
  mes,
  onMes,
  infoDia,
  min,
  max,
  seleccionado,
  rango,
  onElegir,
  atenuarFinDeSemana = false,
  compacto = false,
}: Props) {
  const C = useC()
  const anterior = sumarMeses(mes, -1)
  const siguiente = sumarMeses(mes, 1)
  const puedeAnterior = mesTieneDias(anterior, min, max)
  const puedeSiguiente = mesTieneDias(siguiente, min, max)

  const colores: Record<EstadoDia, { color: string; bg: string }> = {
    neutro: { color: C.text, bg: "transparent" },
    fuera: { color: C.textFaint, bg: "transparent" },
    cargando: { color: C.textMuted, bg: C.surface },
    libre: { color: C.available, bg: C.availableBg },
    sin: { color: C.occupied, bg: C.occupiedBg },
  }

  const navBtn = (activo: boolean): CSSProperties => ({
    width: 30,
    height: 30,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: C.card,
    color: activo ? C.text : C.textFaint,
    cursor: activo ? "pointer" : "default",
    fontSize: 16,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          aria-label="Mes anterior"
          style={navBtn(puedeAnterior)}
          disabled={!puedeAnterior}
          onClick={() => onMes(anterior)}
        >
          ‹
        </button>
        <span
          style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}
        >
          {tituloMes(mes)}
        </span>
        <button
          type="button"
          aria-label="Mes siguiente"
          style={navBtn(puedeSiguiente)}
          disabled={!puedeSiguiente}
          onClick={() => onMes(siguiente)}
        >
          ›
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {DIAS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.textMuted, padding: "2px 0" }}>
            {d}
          </div>
        ))}
        {celdasDelMes(mes).map((iso, i) => {
          if (iso === null) return <div key={`h-${i}`} />
          const fueraDeRango = (min !== undefined && iso < min) || (max !== undefined && iso > max)
          const info: InfoDia = fueraDeRango ? { estado: "fuera" } : (infoDia?.(iso) ?? { estado: "neutro" })
          const elegible = onElegir !== undefined && (info.elegible ?? (info.estado !== "fuera" && info.estado !== "sin"))
          const esSeleccionado = iso === seleccionado
          const enRango = rango !== undefined && iso >= rango.desde && iso <= rango.hasta
          const finde = atenuarFinDeSemana && esFinDeSemana(iso) && info.estado !== "fuera"
          const { color, bg } = colores[info.estado]
          const ayuda = [info.ayuda, finde ? "El laboratorio normalmente no atiende sábados ni domingos" : undefined]
            .filter(Boolean)
            .join(" · ")

          const estilo: CSSProperties = {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            minHeight: compacto ? 34 : 40,
            padding: "3px 0",
            borderRadius: 8,
            border: "1.5px solid transparent",
            background: bg,
            color,
            opacity: finde && !esSeleccionado ? 0.55 : 1,
            fontFamily: "'Inter',sans-serif",
            cursor: elegible ? "pointer" : "default",
          }
          if (enRango && !esSeleccionado) {
            estilo.background = C.crimsonLight
            estilo.color = C.crimson
            estilo.opacity = 1
          }
          if (esSeleccionado) {
            estilo.background = C.crimson
            estilo.color = "white"
            estilo.borderColor = C.crimson
          }

          const contenido = (
            <>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{fechaDeIso(iso).getDate()}</span>
              {info.texto && <small style={{ fontSize: 9.5, lineHeight: 1, opacity: 0.85 }}>{info.texto}</small>}
            </>
          )

          return elegible ? (
            <button
              key={iso}
              type="button"
              title={ayuda || undefined}
              aria-label={`${iso}${info.texto ? `: ${info.texto}` : ""}${ayuda ? `. ${ayuda}` : ""}`}
              aria-pressed={esSeleccionado}
              onClick={() => onElegir?.(iso)}
              style={estilo}
            >
              {contenido}
            </button>
          ) : (
            <div
              key={iso}
              title={ayuda || undefined}
              aria-label={`${iso}${info.texto ? `: ${info.texto}` : ""}`}
              aria-disabled={onElegir !== undefined ? true : undefined}
              style={estilo}
            >
              {contenido}
            </div>
          )
        })}
      </div>
    </div>
  )
}
