import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../../theme"
import { ESTADO_ORDEN_LABEL, resumenDeLineas } from "../services/formato"
import { diasDelPeriodo, fechaCorta, horaLab, inicialesDe, type FichaEquipo } from "../services/bandejaVista"
import { caeEnFinDeSemana } from "../services/formato"
import { retiroVencido } from "../services/bandeja"
import type { EstadoOrden, Orden } from "../types"

// Bandeja de validaciones en tabla (SPEC-10 V-14): mismas acciones que antes (PRE-10,
// PRE-15, PRE-18), con la presentación del prototipo del equipo.

export interface AccionesFila {
  onAprobar: (o: Orden) => void
  onRechazar: (o: Orden) => void
  onCancelar: (o: Orden) => void
  onVerAval: (o: Orden) => void
}

const COLUMNAS = ["Solicitud", "Solicitante", "Equipo", "Asignatura", "Período", "Obs. docente", "Estado", "Acciones"]

export function BandejaTabla({
  ordenes,
  fichas,
  unidades,
  acciones,
}: {
  ordenes: Orden[]
  fichas: Map<number, FichaEquipo>
  unidades: Map<number, string>
  acciones: AccionesFila
}) {
  const C = useC()
  const th: CSSProperties = {
    padding: "12px 8px",
    textAlign: "left",
    fontFamily: "'Inter',sans-serif",
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: C.textMuted,
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: "nowrap",
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c} style={th}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o) => (
            <Fila key={o.id} orden={o} fichas={fichas} unidades={unidades} acciones={acciones} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Fila({
  orden,
  fichas,
  unidades,
  acciones,
}: {
  orden: Orden
  fichas: Map<number, FichaEquipo>
  unidades: Map<number, string>
  acciones: AccionesFila
}) {
  const C = useC()
  const [verObs, setVerObs] = useState(false)
  const pendiente = orden.estado === "pendiente"
  const nombre = orden.solicitante?.nombreCompleto ?? `Usuario #${orden.solicitanteId}`
  const grupos = resumenDeLineas(orden.lineas, new Map([...fichas].map(([id, f]) => [id, f.nombre])))
  const primero = grupos[0]
  const fichaPrimero = primero ? fichas.get(primero.equipamientoId) : undefined
  const hayEntregas = orden.lineas.some((l) => l.estado === "entregado")
  const vencido = retiroVencido(orden)
  const finDeSemana =
    pendiente && orden.retiro !== null && orden.devolucion !== null &&
    (caeEnFinDeSemana(orden.retiro) || caeEnFinDeSemana(orden.devolucion))

  const colores: Record<EstadoOrden, { color: string; bg: string }> = {
    pendiente: { color: C.pending, bg: C.pendingBg },
    aprobada: { color: C.available, bg: C.availableBg },
    rechazada: { color: C.occupied, bg: C.occupiedBg },
    cancelada: { color: C.textMuted, bg: C.surface },
  }
  const td: CSSProperties = {
    padding: "14px 8px",
    borderBottom: `1px solid ${C.borderLight}`,
    verticalAlign: "middle",
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    color: C.text,
    background: pendiente ? `${C.pendingBg}55` : C.card,
  }
  const chip = (texto: ReactNode, color: string, bg: string, extra: CSSProperties = {}) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...extra,
      }}
    >
      {texto}
    </span>
  )
  const boton = (texto: string, color: string, bg: string, onClick: () => void, icono?: string) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 10px",
        borderRadius: 9,
        border: `1px solid ${color}33`,
        background: bg,
        color,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icono && <span aria-hidden="true">{icono}</span>}
      {texto}
    </button>
  )

  return (
    <tr>
      {/* Solicitud */}
      <td style={td}>
        {chip(`#${orden.id}`, pendiente ? C.pending : C.textMuted, pendiente ? C.pendingBg : C.surface, {
          borderRadius: 7,
          fontFamily: "ui-monospace, Menlo, monospace",
        })}
      </td>

      {/* Solicitante */}
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: 999,
              background: C.crimsonLight,
              border: `1px solid ${C.crimson}33`,
              color: C.crimson,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {inicialesDe(nombre)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>{nombre}</div>
            <div style={{ fontSize: 11.5, color: C.textMuted }}>
              {orden.sede} · {fechaCorta(orden.fechaSolicitud)}
            </div>
          </div>
        </div>
      </td>

      {/* Equipo — SPEC-10 V-14: "+N más" despliega todos los equipos de la solicitud */}
      <td style={td}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Miniatura imagen={fichaPrimero?.imagen} codigo={fichaPrimero?.codigo} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, minWidth: 110 }}>
              {primero ? `${primero.cantidad > 1 ? `${primero.cantidad} × ` : ""}${primero.nombre}` : "—"}
            </div>
            <div style={{ fontSize: 11.5, color: C.textMuted }}>
              {fichaPrimero?.codigo}
              {grupos.length > 1 && (
                <>
                  {" · "}
                  <MasEquipos grupos={grupos} fichas={fichas} />
                </>
              )}
            </div>
            {orden.estado === "aprobada" && (
              <div style={{ fontSize: 11, color: C.textFaint }}>
                {orden.lineas.map((l) => (l.unidadId ? (unidades.get(l.unidadId) ?? `#${l.unidadId}`) : "—")).join(", ")}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Asignatura */}
      <td style={td}>
        {orden.asignaturaId != null ? (
          <span
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderLeft: `3px solid ${C.crimson}`,
              borderRadius: "4px 8px 8px 4px",
              background: C.crimsonLight,
              color: C.crimson,
              fontWeight: 600,
              fontSize: 12.5,
              whiteSpace: "nowrap",
            }}
          >
            Asignatura {orden.asignaturaId}
          </span>
        ) : (
          <span style={{ color: C.textFaint, fontStyle: "italic" }}>Uso de cátedra</span>
        )}
      </td>

      {/* Período */}
      <td style={td}>
        {orden.retiro && orden.devolucion ? (
          <>
            <div style={{ fontWeight: 700, minWidth: 130 }}>
              {fechaCorta(orden.retiro)} → {fechaCorta(orden.devolucion)}
            </div>
            <div style={{ fontSize: 11.5, color: C.textMuted }}>
              {horaLab(orden.retiro)} a {horaLab(orden.devolucion)} · {diasDelPeriodo(orden.retiro, orden.devolucion)}d
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
              {vencido && chip("Retiro vencido", C.occupied, C.occupiedBg)}
              {finDeSemana && chip("Fin de semana", C.pending, C.pendingBg)}
              {orden.demorado && chip("Demorado", C.occupied, C.occupiedBg)}
            </div>
          </>
        ) : (
          "—"
        )}
      </td>

      {/* Obs. docente */}
      <td style={td}>
        {orden.observacionDocente?.trim() ? (
          <>
            <button
              type="button"
              aria-expanded={verObs}
              onClick={() => setVerObs((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 9,
                border: `1.5px solid ${C.mine}`,
                background: C.mineBg,
                color: C.mine,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 3H12V9.5H6L3 12V9.5H2V3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Ver obs.
            </button>
            {verObs && (
              <div
                role="dialog"
                aria-label="Observación del docente"
                style={{
                  position: "absolute",
                  zIndex: 5,
                  top: "calc(100% - 6px)",
                  left: 8,
                  width: 260,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                }}
              >
                {orden.observacionDocente}
              </div>
            )}
          </>
        ) : (
          <span style={{ color: C.textFaint, fontStyle: "italic" }}>Sin obs.</span>
        )}
      </td>

      {/* Estado */}
      <td style={td}>
        {chip(
          <>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 99, background: colores[orden.estado].color }} />
            {ESTADO_ORDEN_LABEL[orden.estado]}
          </>,
          colores[orden.estado].color,
          colores[orden.estado].bg,
        )}
        {orden.motivoResolucion && (
          <div title={orden.motivoResolucion} style={{ marginTop: 4, fontSize: 11, color: C.textMuted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {orden.motivoResolucion}
          </div>
        )}
      </td>

      {/* Acciones */}
      <td style={td}>
        <div style={{ display: "flex", gap: 6 }}>
          {orden.avalArchivoId && boton("Aval", C.premium, C.premiumBg, () => acciones.onVerAval(orden), "📄")}
          {pendiente && (
            <>
              {boton("Aprobar", C.available, C.availableBg, () => acciones.onAprobar(orden), "✓")}
              {boton("Rechazar", C.occupied, C.occupiedBg, () => acciones.onRechazar(orden), "✕")}
            </>
          )}
          {orden.estado === "aprobada" && !hayEntregas && boton("Cancelar", C.occupied, C.occupiedBg, () => acciones.onCancelar(orden))}
          {!pendiente && !(orden.estado === "aprobada" && !hayEntregas) && !orden.avalArchivoId && (
            <span style={{ color: C.textFaint, fontStyle: "italic" }}>Procesada</span>
          )}
        </div>
      </td>
    </tr>
  )
}

function Miniatura({ imagen, codigo, size }: { imagen?: string | null; codigo?: string; size: number }) {
  const C = useC()
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 8,
        overflow: "hidden",
        background: C.bg,
        border: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Outfit',sans-serif",
        fontSize: size > 34 ? 10.5 : 9,
        fontWeight: 700,
        color: C.textFaint,
      }}
    >
      {imagen ? (
        <img src={imagen} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        (codigo ?? "").slice(0, 3).toUpperCase()
      )}
    </div>
  )
}

/** Enlace "+N más" que abre la lista de todos los equipos pedidos (se cierra con Escape o tocando afuera). */
function MasEquipos({
  grupos,
  fichas,
}: {
  grupos: { equipamientoId: number; nombre: string; cantidad: number }[]
  fichas: Map<number, FichaEquipo>
}) {
  const C = useC()
  // Posición fija calculada desde el enlace: así la tabla (con overflow) no corta la lista.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const abierto = pos !== null
  const setAbierto = (v: boolean) => {
    if (!v) return setPos(null)
    const r = boton.current?.getBoundingClientRect()
    if (!r) return
    const alto = 46 + grupos.length * 45
    const top = r.bottom + 6 + alto > window.innerHeight ? Math.max(8, r.top - 6 - alto) : r.bottom + 6
    setPos({ top, left: Math.min(r.left, window.innerWidth - 310) })
  }
  const caja = useRef<HTMLSpanElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const total = grupos.reduce((n, g) => n + g.cantidad, 0)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false)
    const cerrar = () => setPos(null)
    document.addEventListener("mousedown", fuera)
    document.addEventListener("keydown", esc)
    window.addEventListener("scroll", cerrar, true)
    window.addEventListener("resize", cerrar)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("keydown", esc)
      window.removeEventListener("scroll", cerrar, true)
      window.removeEventListener("resize", cerrar)
    }
  }, [abierto])

  return (
    <span ref={caja}>
      <button
        type="button"
        ref={boton}
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
        style={{
          all: "unset",
          cursor: "pointer",
          color: C.crimson,
          fontWeight: 700,
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        +{grupos.length - 1} más
      </button>
      {pos && (
        <div
          role="dialog"
          aria-label="Equipos de la solicitud"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 1000,
            width: 300,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
            padding: "10px 0 6px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              padding: "0 14px 8px",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.textFaint,
            }}
          >
            {grupos.length} equipos · {total} {total === 1 ? "unidad" : "unidades"}
          </div>
          {grupos.map((g) => {
            const f = fichas.get(g.equipamientoId)
            return (
              <div
                key={g.equipamientoId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 14px",
                  borderTop: `1px solid ${C.borderLight}`,
                }}
              >
                <Miniatura imagen={f?.imagen} codigo={f?.codigo} size={30} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: C.text }}>{g.nombre}</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.textMuted }}>{f?.codigo}</div>
                </div>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12.5, fontWeight: 700, color: C.text }}>
                  × {g.cantidad}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </span>
  )
}
