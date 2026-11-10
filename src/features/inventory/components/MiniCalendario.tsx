import { useMemo, useState } from "react"
import type { Sede } from "../types"
import { aIso, hoyLab, puedeIrA, rangoDelMes, ventana } from "../services/calendario"
import { useDisponibilidad } from "../hooks/useDisponibilidad"

interface Props {
  equipamientoId: number
  sede?: Sede
  /** Por defecto, hoy en la zona del laboratorio. */
  hoy?: Date
}

export function MiniCalendario({ equipamientoId, sede, hoy = hoyLab() }: Props) {
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

  return (
    <div className="mini-calendario">
      <div className="mc-header">
        <button disabled={!puedeAnterior} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>
          ‹
        </button>
        <span>
          {mes.toLocaleString("es-AR", { month: "long", year: "numeric" })}
        </span>
        <button disabled={!puedeSiguiente} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>
          ›
        </button>
      </div>
      {cargando && <p>Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <div className="mc-grid">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="mc-dow">
            {d}
          </div>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`e-${i}`} />
          const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia)
          const iso = aIso(fecha)
          const fuera = fecha < min || fecha > max
          const libres = diasMap.get(iso)
          const estado = fuera ? "fuera" : libres === undefined ? "cargando" : libres > 0 ? "libre" : "sin"
          return (
            <div key={iso} className={`mc-cell mc-${estado}`} aria-label={`${iso}: ${libres ?? 0} unidades libres`}>
              <span>{dia}</span>
              {!fuera && libres !== undefined && <small>{libres}</small>}
            </div>
          )
        })}
      </div>
      <p className="mc-legend">Orientativo: la confirmación llega al enviar el pedido.</p>
    </div>
  )
}
