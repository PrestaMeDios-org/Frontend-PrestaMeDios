import { Fragment, useState } from "react"
import { useC } from "../../../theme"
import { Badge } from "../../../components/ui/Badge"
import { Ico } from "../../../components/ui/icons"
import { AltaGamaBadge } from "./AltaGamaBadge"
import { rangosDeLockers } from "../services/stockVista"
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
  const colorDe = (id: string) => categorias.find((c) => c.id === id)?.color ?? C.textFaint
  const botonIcono = (color: string) =>
    ({
      width: 32,
      height: 32,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: C.card,
      color,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: ocupado ? "default" : "pointer",
    }) as const

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
                {/* SPEC-10 V-16: miniatura, chips y barra de disponibles; la fila entera despliega */}
                <tr
                  onClick={() => alternar(e.id)}
                  style={{
                    borderTop: `1px solid ${C.borderLight}`,
                    opacity: e.activo ? 1 : 0.6,
                    cursor: "pointer",
                    background: abierto ? C.surface : "transparent",
                  }}
                >
                  <td style={{ padding: "0 0 0 12px", width: 36 }}>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        alternar(e.id)
                      }}
                      aria-expanded={abierto}
                      aria-label={`${abierto ? "Ocultar" : "Ver"} unidades de ${e.name}`}
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
                        cursor: "pointer",
                        transform: abierto ? "none" : "rotate(-90deg)",
                        transition: "transform 0.15s",
                      }}
                    >
                      {Ico.chevDown}
                    </button>
                  </td>
                  <td style={{ ...celda, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {e.image ? (
                        <img
                          src={e.image}
                          alt=""
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            objectFit: "cover",
                            flexShrink: 0,
                            border: `1px solid ${C.border}`,
                            background: C.bg,
                          }}
                        />
                      ) : (
                        <div
                          aria-hidden
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Outfit',sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.textFaint,
                          }}
                        >
                          {e.code.slice(0, 3).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700 }}>{e.name}</span>
                          {!e.activo && <Badge label="Dado de baja" color={C.textMuted} bg={C.bg} />}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: C.textFaint,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            marginTop: 2,
                          }}
                        >
                          {e.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={celda}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
                      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 99, background: colorDe(e.category) }} />
                      {etiqueta(e.category)}
                    </span>
                  </td>
                  <td style={celda}>
                    <span style={{ fontSize: 13, color: e.lockers.length ? C.text : C.textFaint }}>
                      {rangosDeLockers(e.lockers)}
                    </span>
                  </td>
                  <td style={celda}>
                    {e.altaGama ? <AltaGamaBadge /> : <span style={{ fontSize: 12.5, color: C.textMuted }}>Común</span>}
                  </td>
                  <td style={{ ...celda, minWidth: 120 }}>
                    <div style={{ fontSize: 12.5 }}>
                      <strong style={{ fontWeight: 700 }}>{e.available_count}</strong>
                      <span style={{ color: C.textMuted }}> de {e.quantity}</span>
                    </div>
                    <div style={{ marginTop: 5, height: 5, borderRadius: 99, background: C.bg, overflow: "hidden", maxWidth: 110 }}>
                      <div
                        style={{
                          width: `${e.quantity ? (100 * e.available_count) / e.quantity : 0}%`,
                          height: "100%",
                          borderRadius: 99,
                          background: e.available_count === 0 ? C.occupied : C.available,
                        }}
                      />
                    </div>
                    {e.maintenance && (
                      <div style={{ marginTop: 4, color: C.maintenance, fontSize: 11 }}>Con unidades en mantenimiento</div>
                    )}
                  </td>
                  <td
                    style={{ ...celda, textAlign: "right", whiteSpace: "nowrap" }}
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        type="button"
                        title="Editar equipo"
                        aria-label={`Editar ${e.name}`}
                        onClick={() => onEditarEquipo(e)}
                        disabled={ocupado}
                        style={botonIcono(C.textMuted)}
                      >
                        {Ico.edit}
                      </button>
                      {e.activo ? (
                        <button
                          type="button"
                          title="Dar de baja"
                          aria-label={`Dar de baja ${e.name}`}
                          onClick={() => onCambiarActivo(e)}
                          disabled={ocupado}
                          style={botonIcono(C.occupied)}
                        >
                          {Ico.trash}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCambiarActivo(e)}
                          disabled={ocupado}
                          style={{
                            ...botonIcono(C.available),
                            width: "auto",
                            padding: "0 10px",
                            fontFamily: "'Outfit',sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Reactivar
                        </button>
                      )}
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
