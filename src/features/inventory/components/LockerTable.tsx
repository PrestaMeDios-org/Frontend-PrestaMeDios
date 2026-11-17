import { useState } from "react"
import { useC } from "../../../theme"
import { Ico } from "../../../components/ui/icons"
import { agruparPorLocker, type GrupoLocker } from "../services/stockVista"
import type { EstadoUnidad, Equipment, Unidad } from "../types"
import { AccionesUnidad, EstadoBadge, type AccionEstado } from "./UnidadesRow"

// Las entradas ya vienen ordenadas por equipo: se juntan las seguidas del mismo equipo.
function porEquipo(entradas: GrupoLocker["entradas"]) {
  const out: { equipo: Equipment; unidades: Unidad[] }[] = []
  for (const { equipo, unidad } of entradas) {
    const ult = out.at(-1)
    if (ult && ult.equipo.id === equipo.id) ult.unidades.push(unidad)
    else out.push({ equipo, unidades: [unidad] })
  }
  return out
}

// Control de Stock agrupado por locker (SPEC-10 V-17, MOMENTÁNEO): otra forma de mirar las
// mismas unidades de PRE-12; las acciones son las de PRE-14, sin cambios.
export function LockerTable({
  items,
  ocupado,
  onEstado,
  onEditarUnidad,
}: {
  items: Equipment[]
  ocupado: boolean
  onEstado: (equipo: Equipment, unidad: Unidad, accion: AccionEstado) => void
  onEditarUnidad: (equipo: Equipment, unidad: Unidad) => void
}) {
  const C = useC()
  const [abiertos, setAbiertos] = useState<ReadonlySet<string>>(new Set())
  const grupos = agruparPorLocker(items)
  const alternar = (k: string) =>
    setAbiertos((prev) => {
      const sig = new Set(prev)
      if (sig.has(k)) sig.delete(k)
      else sig.add(k)
      return sig
    })

  const puntos: [EstadoUnidad, string, string][] = [
    ["disponible", "disponibles", C.available],
    ["prestado", "prestadas", C.mine],
    ["mantenimiento", "en mantenimiento", C.maintenance],
    ["baja", "fuera de servicio", C.textFaint],
  ]

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      {grupos.map((g, gi) => {
        const clave = String(g.locker ?? "sin")
        const abierto = abiertos.has(clave)
        const vacio = g.entradas.length === 0
        const equipos = new Set(g.entradas.map((e) => e.equipo.id)).size
        const cuenta = (e: EstadoUnidad) => g.entradas.filter((x) => x.unidad.estado === e).length
        return (
          <div key={clave} style={{ borderTop: gi ? `1px solid ${C.borderLight}` : "none" }}>
            <button
              type="button"
              onClick={() => !vacio && alternar(clave)}
              aria-expanded={vacio ? undefined : abierto}
              disabled={vacio}
              style={{
                all: "unset",
                boxSizing: "border-box",
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 18px 12px 12px",
                cursor: vacio ? "default" : "pointer",
                background: abierto ? C.surface : "transparent",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  border: `1px solid ${abierto ? C.crimson : C.border}`,
                  background: abierto ? C.crimsonLight : C.card,
                  color: abierto ? C.crimson : C.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: abierto ? "none" : "rotate(-90deg)",
                  transition: "transform 0.15s",
                  opacity: vacio ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                {Ico.chevDown}
              </span>
              <span
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: vacio ? C.bg : C.crimsonLight,
                  color: vacio ? C.textFaint : C.crimson,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: g.locker === null ? 15 : 19,
                  fontWeight: 800,
                }}
              >
                {g.locker ?? "—"}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
                  {g.locker === null ? "Sin locker asignado" : `Locker ${g.locker}`}
                </span>
                <span style={{ display: "block", fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {vacio
                    ? "Vacío"
                    : `${g.entradas.length} ${g.entradas.length === 1 ? "unidad" : "unidades"} · ${equipos} ${
                        equipos === 1 ? "equipo" : "equipos"
                      }`}
                </span>
              </span>
              {!vacio && (
                <span style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.textMuted }}>
                  {puntos.map(([estado, texto, color]) => {
                    const n = cuenta(estado)
                    return (
                      n > 0 && (
                        <span key={estado} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />
                          <strong style={{ color: C.text, fontWeight: 700 }}>{n}</strong> {texto}
                        </span>
                      )
                    )
                  })}
                </span>
              )}
            </button>

            {abierto && (
              <div style={{ background: C.surface, padding: "2px 20px 16px 52px" }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                  {porEquipo(g.entradas).map(({ equipo, unidades }, i) => {
                    const disp = unidades.filter((u) => u.estado === "disponible").length
                    return (
                      <div key={equipo.id} style={{ borderTop: i ? `1px solid ${C.border}` : "none", padding: "10px 16px 6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                          {equipo.image ? (
                            <img
                              src={equipo.image}
                              alt=""
                              style={{ width: 36, height: 36, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }}
                            />
                          ) : (
                            <span
                              aria-hidden
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                flexShrink: 0,
                                background: C.bg,
                                border: `1px solid ${C.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "'Outfit',sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: C.textFaint,
                              }}
                            >
                              {equipo.code.slice(0, 3).toUpperCase()}
                            </span>
                          )}
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
                              {equipo.name}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 10.5,
                                color: C.textFaint,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              {equipo.code}
                            </span>
                          </span>
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.textMuted, whiteSpace: "nowrap" }}>
                            <strong style={{ color: C.text }}>{unidades.length}</strong> {unidades.length === 1 ? "unidad" : "unidades"} ·{" "}
                            <strong style={{ color: disp ? C.available : C.occupied }}>{disp}</strong>{" "}
                            {disp === 1 ? "disponible" : "disponibles"}
                          </span>
                        </div>
                        {unidades.map((unidad) => (
                          <div
                            key={unidad.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0, 1fr) 100px 150px auto",
                              alignItems: "center",
                              gap: 14,
                              padding: "6px 0 6px 48px",
                              borderTop: `1px dashed ${C.borderLight}`,
                              opacity: unidad.estado === "baja" ? 0.6 : 1,
                            }}
                          >
                            <div style={{ minWidth: 0, fontFamily: "'Inter',sans-serif" }}>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {unidad.codigoInventario}
                              </div>
                              <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                N.º de serie {unidad.serie}
                              </div>
                            </div>
                            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>{unidad.sede}</div>
                            <div>
                              <EstadoBadge estado={unidad.estado} />
                            </div>
                            <AccionesUnidad
                              unidad={unidad}
                              ocupado={ocupado}
                              onEstado={(u, accion) => onEstado(equipo, u, accion)}
                              onEditar={(u) => onEditarUnidad(equipo, u)}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
