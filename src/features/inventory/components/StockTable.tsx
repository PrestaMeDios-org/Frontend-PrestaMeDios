import { Fragment, useState } from "react"
import { useC } from "../../../theme"
import { Badge } from "../../../components/ui/Badge"
import { alternarOrden, ordenarStock, type ColumnaStock, type Sentido } from "../services/ordenar"
import type { Category, Equipment, Unidad } from "../types"
import { UnidadesRow, type AccionEstado } from "./UnidadesRow"

const COLUMNAS: { id: ColumnaStock; label: string }[] = [
  { id: "nombre", label: "Nombre" },
  { id: "categoria", label: "Categoría" },
  { id: "locker", label: "Locker" },
  { id: "tipo", label: "Tipo" },
  { id: "disponibles", label: "Disponibles" },
]

// Tabla de stock para administradores (PRE-12): columnas ordenables y unidades desplegables.
export function StockTable({
  items,
  categorias,
  ocupado,
  onEstado,
  onEditarUnidad,
  onAgregarUnidad,
  onEditarEquipo,
  onCambiarActivo,
}: {
  items: Equipment[]
  categorias: Category[]
  ocupado: boolean
  onEstado: (equipo: Equipment, unidad: Unidad, accion: AccionEstado) => void
  onEditarUnidad: (equipo: Equipment, unidad: Unidad) => void
  onAgregarUnidad: (equipo: Equipment) => void
  onEditarEquipo: (equipo: Equipment) => void
  onCambiarActivo: (equipo: Equipment) => void
}) {
  const C = useC()
  const [orden, setOrden] = useState<{ columna: ColumnaStock; sentido: Sentido }>({
    columna: "nombre",
    sentido: "asc",
  })
  const [abiertos, setAbiertos] = useState<ReadonlySet<number>>(new Set())

  const filas = ordenarStock(items, orden.columna, orden.sentido, categorias)
  const etiqueta = (id: string) => categorias.find((c) => c.id === id)?.label ?? id
  const alternar = (id: number) =>
    setAbiertos((prev) => {
      const sig = new Set(prev)
      if (sig.has(id)) sig.delete(id)
      else sig.add(id)
      return sig
    })

  const celda = { padding: "11px 14px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text } as const

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: C.bg }}>
            <th style={{ width: 36 }} />
            {COLUMNAS.map((col) => {
              const activa = orden.columna === col.id
              const flecha = !activa ? "↕" : orden.sentido === "asc" ? "↑" : "↓"
              return (
                <th
                  key={col.id}
                  aria-sort={activa ? (orden.sentido === "asc" ? "ascending" : "descending") : "none"}
                  style={{ ...celda, textAlign: "left", padding: 0 }}
                >
                  <button
                    type="button"
                    onClick={() => setOrden((o) => alternarOrden(o, col.id))}
                    title={`Ordenar por ${col.label.toLowerCase()}`}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      width: "100%",
                      padding: "11px 14px",
                      cursor: "pointer",
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: activa ? C.crimson : C.textMuted,
                    }}
                  >
                    {col.label} <span aria-hidden>{flecha}</span>
                  </button>
                </th>
              )
            })}
            <th style={{ ...celda, textAlign: "right", color: C.textMuted, fontFamily: "'Outfit',sans-serif", fontSize: 12.5 }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((e) => {
            const abierto = abiertos.has(e.id)
            return (
              <Fragment key={e.id}>
                <tr style={{ borderTop: `1px solid ${C.borderLight}`, opacity: e.activo ? 1 : 0.6 }}>
                  <td style={{ padding: "0 0 0 8px" }}>
                    <button
                      type="button"
                      onClick={() => alternar(e.id)}
                      aria-expanded={abierto}
                      aria-label={`${abierto ? "Ocultar" : "Ver"} unidades de ${e.name}`}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: C.textMuted, fontSize: 13 }}
                    >
                      {abierto ? "▾" : "▸"}
                    </button>
                  </td>
                  <td style={{ ...celda, fontWeight: 600 }}>
                    {e.name}
                    <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 400 }}>{e.code}</div>
                    {!e.activo && (
                      <Badge label="Dado de baja" color={C.textMuted} bg={C.bg} />
                    )}
                  </td>
                  <td style={celda}>{etiqueta(e.category)}</td>
                  <td style={celda}>{e.lockers.length ? e.lockers.join(", ") : "—"}</td>
                  <td style={celda}>{e.altaGama ? "Especial" : "Común"}</td>
                  <td style={celda}>
                    {e.available_count}/{e.quantity}
                    {e.maintenance && (
                      <span style={{ marginLeft: 6, color: C.maintenance, fontSize: 11 }}>En mantenimiento</span>
                    )}
                  </td>
                  <td style={{ ...celda, textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", gap: 14 }}>
                    <button
                      type="button"
                      onClick={() => onEditarEquipo(e)}
                      disabled={ocupado}
                      style={{ border: "none", background: "transparent", color: C.crimson, cursor: "pointer", fontWeight: 600 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onCambiarActivo(e)}
                      disabled={ocupado}
                      style={{ border: "none", background: "transparent", color: e.activo ? C.occupied : C.available, cursor: "pointer", fontWeight: 600 }}
                    >
                      {e.activo ? "Dar de baja" : "Reactivar"}
                    </button>
                    </div>
                  </td>
                </tr>
                {abierto && (
                  <tr>
                    <td colSpan={COLUMNAS.length + 2} style={{ padding: 0 }}>
                      <UnidadesRow
                        equipo={e}
                        ocupado={ocupado}
                        onEstado={(u, accion) => onEstado(e, u, accion)}
                        onEditar={(u) => onEditarUnidad(e, u)}
                        onAgregar={() => onAgregarUnidad(e)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
