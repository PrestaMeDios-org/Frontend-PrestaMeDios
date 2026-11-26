import { useState, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../../theme"
import { Badge } from "../../../components/ui/Badge"
import { Ico } from "../../../components/ui/icons"
import { separarFueraDeServicio, sinUnidadesEnUso } from "../services/stockVista"
import { SEDES, type EstadoUnidad, type Equipment, type Unidad } from "../types"

export type AccionEstado = "mantenimiento" | "baja" | "disponible"

export function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
  const C = useC()
  const m: Record<EstadoUnidad, [string, string, string]> = {
    disponible: ["Disponible", C.available, C.availableBg],
    prestado: ["Prestado", C.mine, C.mineBg],
    mantenimiento: ["En mantenimiento", C.maintenance, C.maintenanceBg],
    baja: ["Fuera de servicio", C.textMuted, C.bg],
  }
  const [label, color, bg] = m[estado]
  return <Badge label={label} color={color} bg={bg} />
}

type Tokens = ReturnType<typeof useC>

function estiloBoton(C: Tokens, ocupado: boolean, color: string, borde: string): CSSProperties {
  return {
    height: 28,
    padding: "0 10px",
    borderRadius: 8,
    border: `1px solid ${borde}`,
    background: C.card,
    color,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: ocupado ? "default" : "pointer",
    opacity: ocupado ? 0.6 : 1,
    whiteSpace: "nowrap",
  }
}

// Acciones de PRE-14 sobre una unidad; las usan la vista por equipo y la vista por locker.
export function AccionesUnidad({
  unidad: u,
  ocupado,
  onEstado,
  onEditar,
  onHistorial,
}: {
  unidad: Unidad
  ocupado: boolean
  onEstado: (unidad: Unidad, accion: AccionEstado) => void
  onEditar: (unidad: Unidad) => void
  /** Historial de usuarios (PRE-12, SPEC-04 §8.3). Sin él, no se muestra el botón. */
  onHistorial?: (unidad: Unidad) => void
}) {
  const C = useC()
  const boton = (color: string, borde: string) => estiloBoton(C, ocupado, color, borde)
  return (
    <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
      {u.estado === "disponible" && (
        <button type="button" disabled={ocupado} onClick={() => onEstado(u, "mantenimiento")} style={boton(C.maintenance, C.border)}>
          A mantenimiento
        </button>
      )}
      {u.estado === "mantenimiento" && (
        <button type="button" disabled={ocupado} onClick={() => onEstado(u, "disponible")} style={boton(C.available, C.border)}>
          Rehabilitar
        </button>
      )}
      {(u.estado === "disponible" || u.estado === "mantenimiento") && (
        <button type="button" disabled={ocupado} onClick={() => onEstado(u, "baja")} style={boton(C.occupied, C.border)}>
          Fuera de servicio
        </button>
      )}
      {onHistorial && (
        <button
          type="button"
          aria-label={`Historial de la unidad ${u.codigoInventario}`}
          onClick={() => onHistorial(u)}
          style={boton(C.text, C.border)}
        >
          Historial
        </button>
      )}
      <button
        type="button"
        title="Editar unidad"
        aria-label={`Editar unidad ${u.codigoInventario}`}
        disabled={ocupado}
        onClick={() => onEditar(u)}
        style={{
          ...boton(C.textMuted, C.border),
          width: 28,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Ico.edit}
      </button>
    </div>
  )
}

// Unidades físicas de un ítem con las acciones de PRE-14. Reglas (SPEC-04 §5.3): sólo se pasa
// a mantenimiento o baja desde "disponible", se rehabilita desde mantenimiento, "baja" es
// definitiva y "prestado" lo libera la devolución (módulo de préstamos).
// SPEC-10 V-16: resumen arriba, agrupadas por sede y cada unidad como una fila compacta con
// el locker al frente y acciones chicas. Las reglas no cambian.
// SPEC-04 §8.4 (v1.3.1): en cada sede, las unidades dadas de baja van aparte, en una línea
// "Fuera de servicio (N)" plegada; no se borran porque conservan su historial (PRE-14).
export function UnidadesRow({
  equipo,
  ocupado,
  onEstado,
  onEditar,
  onAgregar,
  onHistorial,
}: {
  equipo: Equipment
  ocupado: boolean
  onEstado: (unidad: Unidad, accion: AccionEstado) => void
  onEditar: (unidad: Unidad) => void
  onAgregar: () => void
  onHistorial?: (unidad: Unidad) => void
}) {
  const C = useC()
  const unidades = equipo.unidades ?? []
  const cuenta = (e: EstadoUnidad) => unidades.filter((u) => u.estado === e).length
  const grupos = SEDES.map((sede) => ({
    sede,
    total: unidades.filter((u) => u.sede === sede).length,
    ...separarFueraDeServicio(unidades.filter((u) => u.sede === sede)),
  })).filter((g) => g.total > 0)
  // Sedes con la línea "Fuera de servicio" abierta (cerrada por defecto).
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const alternar = (sede: string) =>
    setAbiertas((previas) => {
      const nuevas = new Set(previas)
      if (nuevas.has(sede)) nuevas.delete(sede)
      else nuevas.add(sede)
      return nuevas
    })

  const boton = (color: string, borde: string) => estiloBoton(C, ocupado, color, borde)

  const fila = (u: Unidad, i: number): ReactNode => (
    <div
      key={u.id}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 90px 150px auto",
        alignItems: "center",
        gap: 14,
        padding: "10px 16px",
        borderTop: i ? `1px solid ${C.borderLight}` : "none",
        opacity: u.estado === "baja" ? 0.6 : 1,
      }}
    >
      <div style={{ minWidth: 0, fontFamily: "'Inter',sans-serif" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {u.codigoInventario}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: C.textMuted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          N.º de serie {u.serie}
        </div>
      </div>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
        Locker <strong style={{ color: C.text, fontWeight: 600 }}>{u.locker ?? "—"}</strong>
      </div>
      <div>
        <EstadoBadge estado={u.estado} />
      </div>
      <AccionesUnidad
        unidad={u}
        ocupado={ocupado}
        onEstado={onEstado}
        onEditar={onEditar}
        onHistorial={onHistorial}
      />
    </div>
  )

  const resumen = (n: number, texto: string, color: string): ReactNode =>
    n > 0 && (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: color }} />
        <strong style={{ color: C.text, fontWeight: 700 }}>{n}</strong> {texto}
      </span>
    )

  return (
    <div style={{ background: C.surface, padding: "4px 20px 18px 56px", borderTop: `1px solid ${C.borderLight}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "10px 0 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            color: C.textMuted,
          }}
        >
          <span>
            <strong style={{ color: C.text }}>{unidades.length}</strong> {unidades.length === 1 ? "unidad" : "unidades"}
          </span>
          {resumen(cuenta("disponible"), "disponibles", C.available)}
          {resumen(cuenta("prestado"), "prestadas", C.mine)}
          {resumen(cuenta("mantenimiento"), "en mantenimiento", C.maintenance)}
          {resumen(cuenta("baja"), "fuera de servicio", C.textFaint)}
        </div>
        <button type="button" disabled={ocupado} onClick={onAgregar} style={boton(C.crimson, C.crimson)}>
          + Agregar unidad
        </button>
      </div>

      {sinUnidadesEnUso(equipo) && (
        <div
          role="note"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 10,
            background: C.mineBg,
            color: C.mine,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12.5,
            lineHeight: 1.45,
          }}
        >
          Todas las unidades están fuera de servicio. Si el equipo no vuelve a usarse, dalo de baja con el botón
          de la papelera para sacarlo del catálogo.
        </div>
      )}

      {unidades.length === 0 ? (
        <div
          style={{
            padding: 16,
            border: `1.5px dashed ${C.border}`,
            borderRadius: 12,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12.5,
            color: C.textMuted,
            textAlign: "center",
          }}
        >
          Este equipo todavía no tiene unidades en esta sede.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {grupos.map((g) => (
            <div key={g.sede}>
              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.textFaint,
                  marginBottom: 6,
                }}
              >
                {g.sede} · {g.total}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                {g.enUso.length === 0 ? (
                  <div style={{ padding: "12px 16px", fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
                    Ninguna unidad en uso en esta sede.
                  </div>
                ) : (
                  g.enUso.map((u, i) => fila(u, i))
                )}
                {g.fueraDeServicio.length > 0 && (
                  <>
                    <button
                      type="button"
                      aria-expanded={abiertas.has(g.sede)}
                      onClick={() => alternar(g.sede)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 16px",
                        border: "none",
                        borderTop: `1px solid ${C.borderLight}`,
                        background: C.surface,
                        color: C.textMuted,
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          display: "inline-flex",
                          transform: abiertas.has(g.sede) ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      >
                        {Ico.chevDown}
                      </span>
                      Fuera de servicio ({g.fueraDeServicio.length})
                    </button>
                    {abiertas.has(g.sede) && g.fueraDeServicio.map((u) => fila(u, 1))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
