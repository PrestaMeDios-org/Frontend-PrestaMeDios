import { Fragment, useState, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../../theme"
import { AltaGamaBadge } from "../../inventory/components/AltaGamaBadge"
import { ESTADO_ORDEN_LABEL, resumenDeLineas } from "../services/formato"
import { diasDelPeriodo, fechaCorta, inicialesDe, type FichaEquipo } from "../services/bandejaVista"
import { caeEnFinDeSemana } from "../services/formato"
import { retiroVencido } from "../services/bandeja"
import type { EstadoOrden, Orden } from "../types"
import { DIA_CORTO, HORA_CORTA, ICONO, Icono } from "./IconosLinea"

// Bandeja de validaciones en tabla (SPEC-10 V-14): mismas acciones que antes (PRE-10,
// PRE-15, PRE-18), con la presentación del prototipo del equipo.
// SPEC-10 (2026-11-26): íconos en los títulos, período con día y hora en dos líneas como en
// Mis Solicitudes, asignatura en texto plano, chips y botones más chicos, y "+N más" que
// despliega los equipos debajo de la fila en lugar de una ventanita flotante.

export interface AccionesFila {
  onAprobar: (o: Orden) => void
  onRechazar: (o: Orden) => void
  onCancelar: (o: Orden) => void
  onVerAval: (o: Orden) => void
}

const COLUMNAS: [string, ReactNode][] = [
  ["Solicitud", ICONO.solicitud],
  ["Solicitante", ICONO.persona],
  ["Equipo", ICONO.equipamiento],
  ["Asignatura", ICONO.asignatura],
  ["Período", ICONO.periodo],
  ["Obs. docente", ICONO.motivo],
  ["Estado", ICONO.estado],
  ["Acciones", ICONO.acciones],
]

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
    padding: "11px 10px",
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
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
        <thead>
          <tr>
            {COLUMNAS.map(([c, icono]) => (
              <th key={c} style={th}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", color: C.textFaint }}>
                    <Icono d={icono} size={13} />
                  </span>
                  {c}
                </span>
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
  const [verEquipos, setVerEquipos] = useState(false)
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
  const total = grupos.reduce((n, g) => n + g.cantidad, 0)
  // El detalle se abre si hay varios equipos o si ya hay unidades asignadas para mirar.
  const hayAsignadas = orden.lineas.some((l) => l.unidadId)
  const desplegable = grupos.length > 1 || hayAsignadas
  // Unidades asignadas por equipo (sólo después de aprobar).
  const unidadesDe = (equipamientoId: number) =>
    orden.lineas
      .filter((l) => l.equipamientoId === equipamientoId && l.unidadId)
      .map((l) => unidades.get(l.unidadId!) ?? `#${l.unidadId}`)

  const colores: Record<EstadoOrden, { color: string; bg: string }> = {
    pendiente: { color: C.pending, bg: C.pendingBg },
    aprobada: { color: C.available, bg: C.availableBg },
    rechazada: { color: C.occupied, bg: C.occupiedBg },
    cancelada: { color: C.textMuted, bg: C.surface },
  }
  const fondo = pendiente ? `${C.pendingBg}55` : C.card
  const td: CSSProperties = {
    padding: "12px 10px",
    borderBottom: verEquipos ? "none" : `1px solid ${C.border}`,
    verticalAlign: "middle",
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    color: C.text,
    background: fondo,
  }
  const tenue: CSSProperties = { fontSize: 11.5, color: C.textMuted }
  const chip = (texto: ReactNode, color: string, bg: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: 1.5,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </span>
  )
  const boton = (texto: string, color: string, bg: string, onClick: () => void, icono?: ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 9px",
        borderRadius: 8,
        border: `1px solid ${color}33`,
        background: bg,
        color,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icono && <Icono d={icono} size={12} />}
      {texto}
    </button>
  )
  const diaHora = (fecha: Date) => (
    <span style={{ display: "grid", gap: 2, lineHeight: 1.25, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
        <span style={{ display: "inline-flex", color: C.textFaint }}>
          <Icono d={ICONO.calendario} size={12} />
        </span>
        {DIA_CORTO.format(fecha)}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, ...tenue }}>
        <span style={{ display: "inline-flex", color: C.textFaint }}>
          <Icono d={ICONO.reloj} size={12} />
        </span>
        {HORA_CORTA.format(fecha)}
      </span>
    </span>
  )

  return (
    <Fragment>
      <tr>
        {/* Solicitud */}
        <td style={{ ...td, width: 60, paddingLeft: 16, paddingRight: 18, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, fontWeight: 700, color: pendiente ? C.pending : C.textMuted }}>
          #{orden.id}
        </td>

        {/* Solicitante */}
        <td style={td}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span
              aria-hidden="true"
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 999,
                background: C.crimsonLight,
                color: C.crimson,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Outfit',sans-serif",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {inicialesDe(nombre)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>{nombre}</div>
              <div style={{ ...tenue, whiteSpace: "nowrap" }}>
                {orden.sede} · {fechaCorta(orden.fechaSolicitud)}
              </div>
            </div>
          </div>
        </td>

        {/* Equipo — "+N más" despliega todos los equipos debajo de la fila */}
        <td style={td}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Miniatura imagen={fichaPrimero?.imagen} codigo={fichaPrimero?.codigo} size={34} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                <span style={{ whiteSpace: "nowrap" }}>
                  {primero ? `${primero.cantidad > 1 ? `${primero.cantidad} × ` : ""}${primero.nombre}` : "—"}
                </span>
                {fichaPrimero?.altaGama && grupos.length === 1 && <AltaGamaBadge />}
              </div>
              <div style={{ ...tenue, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                {/* SPEC-10: en la celda sólo el código; las unidades asignadas van en el desplegable. */}
                {grupos.length === 1 && <span>{fichaPrimero?.codigo}</span>}
                {desplegable && (
                  <>
                    {grupos.length === 1 && <span aria-hidden style={{ color: C.textFaint }}>·</span>}
                    <button
                      type="button"
                      aria-expanded={verEquipos}
                      onClick={() => setVerEquipos((v) => !v)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        color: C.crimson,
                        fontWeight: 700,
                      }}
                    >
                      {verEquipos
                        ? "Ocultar"
                        : grupos.length > 1
                          ? `+${grupos.length - 1} más · ver los ${total}`
                          : total > 1
                            ? `ver las ${total} unidades`
                            : "ver unidad"}
                      <span
                        aria-hidden
                        style={{ display: "inline-flex", transform: verEquipos ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Asignatura: texto plano */}
        <td style={td}>
          {orden.asignaturaId != null ? (
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>Asignatura {orden.asignaturaId}</span>
          ) : (
            <span style={{ color: C.textFaint, fontStyle: "italic", whiteSpace: "nowrap" }}>Uso de cátedra</span>
          )}
        </td>

        {/* Período: retiro y devolución con día y hora, como en Mis Solicitudes */}
        <td style={td}>
          {orden.retiro && orden.devolucion ? (
            <div style={{ display: "grid", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {diaHora(orden.retiro)}
                <span aria-hidden style={{ color: C.textFaint }}>→</span>
                {diaHora(orden.devolucion)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                <span style={{ ...tenue, fontSize: 11 }}>{diasDelPeriodo(orden.retiro, orden.devolucion)} días</span>
                {vencido && chip("Retiro vencido", C.occupied, C.occupiedBg)}
                {finDeSemana && chip("Fin de semana", C.pending, C.pendingBg)}
                {orden.demorado && chip("Demorado", C.occupied, C.occupiedBg)}
              </div>
            </div>
          ) : (
            "—"
          )}
        </td>

        {/* Obs. docente */}
        <td style={{ ...td, position: "relative" }}>
          {orden.observacionDocente?.trim() ? (
            <>
              <button
                type="button"
                aria-expanded={verObs}
                onClick={() => setVerObs((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 9px",
                  borderRadius: 8,
                  border: `1px solid ${C.mine}55`,
                  background: C.mineBg,
                  color: C.mine,
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Icono d={ICONO.motivo} size={12} />
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
            <span style={{ color: C.textFaint, fontStyle: "italic", fontSize: 12 }}>Sin obs.</span>
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
            <div
              title={orden.motivoResolucion}
              style={{ marginTop: 4, fontSize: 11, color: C.textMuted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {orden.motivoResolucion}
            </div>
          )}
        </td>

        {/* Acciones */}
        <td style={td}>
          <div style={{ display: "flex", gap: 6 }}>
            {orden.avalArchivoId && boton("Aval", C.premium, C.premiumBg, () => acciones.onVerAval(orden), ICONO.documento)}
            {pendiente && (
              <>
                {boton("Aprobar", C.available, C.availableBg, () => acciones.onAprobar(orden), ICONO.aprobar)}
                {boton("Rechazar", C.occupied, C.occupiedBg, () => acciones.onRechazar(orden), ICONO.rechazar)}
              </>
            )}
            {orden.estado === "aprobada" && !hayEntregas && boton("Cancelar", C.occupied, C.occupiedBg, () => acciones.onCancelar(orden))}
            {!pendiente && !(orden.estado === "aprobada" && !hayEntregas) && !orden.avalArchivoId && (
              <span style={{ color: C.textFaint, fontStyle: "italic", fontSize: 12 }}>Procesada</span>
            )}
          </div>
        </td>
      </tr>

      {/* Equipos de la solicitud, desplegados debajo de la fila ("panel suave", como en Mis Solicitudes) */}
      {verEquipos && (
        <tr>
          <td colSpan={COLUMNAS.length} style={{ padding: "0 10px 14px", background: fondo, borderBottom: `1px solid ${C.border}` }}>
            <div
              style={{
                marginLeft: 210,
                maxWidth: 640,
                background: C.card,
                borderRadius: 12,
                padding: "2px 14px",
                boxShadow: `0 1px 2px ${C.border}`,
                border: `1px solid ${C.borderLight}`,
              }}
            >
              {grupos.map((g, k) => {
                const f = fichas.get(g.equipamientoId)
                const asignadas = unidadesDe(g.equipamientoId)
                return (
                  <div
                    key={g.equipamientoId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderTop: k ? `1px solid ${C.borderLight}` : "none",
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 700, minWidth: 26, color: C.crimson }}>{g.cantidad}×</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600, color: C.text }}>{g.nombre}</span>
                      <span style={{ ...tenue, marginLeft: 8 }}>{f?.codigo}</span>
                    </span>
                    {asignadas.length > 0 && (
                      <span style={{ ...tenue, display: "grid", gap: 1, textAlign: "right", color: C.textMuted }}>
                        {asignadas.map((a) => (
                          <span key={a} style={{ whiteSpace: "nowrap" }}>{a}</span>
                        ))}
                      </span>
                    )}
                    <span style={{ minWidth: 84, display: "flex", justifyContent: "flex-end" }}>
                      {f?.altaGama ? <AltaGamaBadge /> : <span style={{ ...tenue, color: C.textFaint }}>Común</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
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
