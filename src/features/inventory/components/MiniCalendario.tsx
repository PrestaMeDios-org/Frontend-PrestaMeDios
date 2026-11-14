import { useMemo, useState } from "react"
import { useC } from "../../../theme"
import type { Sede } from "../types"
import { hoyLab } from "../../../lib/fechas"
import { aIso, rangoDelMes, ventana } from "../services/calendario"
import { GrillaMes, type InfoDia } from "../../../components/ui/calendario/GrillaMes"
import { useDisponibilidad } from "../hooks/useDisponibilidad"

interface Props {
  equipamientoId: number
  sede?: Sede
  /** Por defecto, hoy en la zona del laboratorio. */
  hoy?: Date
}

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

  // SPEC-10 V-01: se dibuja con la grilla común de components/ui.
  const infoDia = (iso: string): InfoDia => {
    const libres = diasMap.get(iso)
    if (libres === undefined) return { estado: "cargando" }
    return { estado: libres > 0 ? "libre" : "sin", texto: `${libres} libres` }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, color: C.text }}>
      <GrillaMes mes={mes} onMes={setMes} infoDia={infoDia} min={aIso(min)} max={aIso(max)} />
      {cargando && <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>Cargando…</p>}
      {error && <p style={{ margin: 0, fontSize: 12, color: C.occupied }}>{error}</p>}
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>Orientativo: la confirmación llega al enviar el pedido.</p>
    </div>
  )
}
