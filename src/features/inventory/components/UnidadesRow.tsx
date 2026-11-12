import { useC } from "../../../theme"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import type { EstadoUnidad, Equipment, Unidad } from "../types"

export type AccionEstado = "mantenimiento" | "baja" | "disponible"

function EstadoBadge({ estado }: { estado: EstadoUnidad }) {
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

// Unidades físicas de un ítem con las acciones de PRE-14. Reglas (SPEC-04 §5.3): sólo se pasa
// a mantenimiento o baja desde "disponible", se rehabilita desde mantenimiento, "baja" es
// definitiva y "prestado" lo libera la devolución (módulo de préstamos).
export function UnidadesRow({
  equipo,
  ocupado,
  onEstado,
  onEditar,
  onAgregar,
}: {
  equipo: Equipment
  ocupado: boolean
  onEstado: (unidad: Unidad, accion: AccionEstado) => void
  onEditar: (unidad: Unidad) => void
  onAgregar: () => void
}) {
  const C = useC()
  const unidades = equipo.unidades ?? []
  const celda = {
    padding: "8px 12px",
    fontFamily: "'Inter',sans-serif",
    fontSize: 12.5,
    color: C.text,
  } as const

  return (
    <div style={{ background: C.bg, padding: "12px 16px 14px" }}>
      {unidades.length === 0 ? (
        <div style={{ ...celda, color: C.textMuted }}>Este equipo todavía no tiene unidades en esta sede.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Código", "N.º de serie", "Sede", "Locker", "Estado", ""].map((h) => (
                <th
                  key={h}
                  style={{ ...celda, textAlign: "left", color: C.textFaint, fontSize: 11, fontWeight: 600 }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unidades.map((u) => (
              <tr key={u.id} style={{ borderTop: `1px solid ${C.borderLight}` }}>
                <td style={{ ...celda, fontWeight: 600 }}>{u.codigoInventario}</td>
                <td style={celda}>{u.serie}</td>
                <td style={celda}>{u.sede}</td>
                <td style={celda}>{u.locker ?? "—"}</td>
                <td style={celda}>
                  <EstadoBadge estado={u.estado} />
                </td>
                <td style={{ ...celda, textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Button variant="ghost" disabled={ocupado} onClick={() => onEditar(u)}>
                      Editar
                    </Button>
                    {u.estado === "disponible" && (
                      <Button variant="ghost" disabled={ocupado} onClick={() => onEstado(u, "mantenimiento")}>
                        En mantenimiento
                      </Button>
                    )}
                    {u.estado === "mantenimiento" && (
                      <Button variant="ghost" disabled={ocupado} onClick={() => onEstado(u, "disponible")}>
                        Rehabilitar
                      </Button>
                    )}
                    {(u.estado === "disponible" || u.estado === "mantenimiento") && (
                      <Button variant="danger" disabled={ocupado} onClick={() => onEstado(u, "baja")}>
                        Fuera de servicio
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 10 }}>
        <Button variant="ghost" disabled={ocupado} onClick={onAgregar}>
          + Agregar unidad
        </Button>
      </div>
    </div>
  )
}
