import { useEffect, useState } from "react"
import { Ico } from "../../../components/ui/icons"
import { hoyLab } from "../../../lib/fechas"
import { useC } from "../../../theme"
import { ZONA_LAB } from "../../notifications/services/fechas"
import { agruparPorDia, filtrarPendientes, paginar, PERIODOS, type Periodo } from "../services/pendientesVista"
import { separarMotivo } from "../services/reservasDelDia"
import type { Espacio, Reserva } from "../types"

const COLUMNAS = "120px minmax(0, 1fr) minmax(0, 1.3fr) auto"
const formatoDia = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, weekday: "long", day: "numeric", month: "long" })
const diaLargo = (fecha: string) => {
  const t = formatoDia.format(new Date(`${fecha}T12:00:00-03:00`))
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const hoyISO = () => {
  const h = hoyLab()
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${h.getFullYear()}-${dos(h.getMonth() + 1)}-${dos(h.getDate())}`
}

/**
 * Solicitudes de reserva pendientes para el administrador (RES-05, SPEC-10 V-21): filtradas por
 * período, espacio o el día tocado en el calendario, paginadas y agrupadas por día.
 */
export function SolicitudesPendientesEspacios({
  reservas,
  espacios: espaciosSede,
  nombreEspacio,
  onResolver,
  filtroDia,
  onLimpiarDia,
}: {
  reservas: Reserva[]
  /** Los espacios de la sede vista, para el selector. */
  espacios: Espacio[]
  nombreEspacio: (id: number) => string
  onResolver: (id: number, decision: "Aprobada" | "Rechazada") => void
  /** El día (y su espacio) que el admin tocó en el calendario; manda sobre los otros filtros. */
  filtroDia: { fecha: string; idEspacio: number } | null
  onLimpiarDia: () => void
}) {
  const C = useC()
  const [periodo, setPeriodo] = useState<Periodo>("todas")
  const [espacio, setEspacio] = useState<number | "todos">("todos")
  const [pagina, setPagina] = useState(1)

  const repetidos = new Set(espaciosSede.map((e) => e.nombre).filter((n, i, t) => t.indexOf(n) !== i))
  const etiqueta = (e: Espacio) => (repetidos.has(e.nombre) ? `${e.nombre} · ${e.sede}` : e.nombre)
  const idEspacio = filtroDia ? filtroDia.idEspacio : espaciosSede.some((e) => e.id === espacio) ? espacio : "todos"
  const filtradas = filtrarPendientes(reservas, { hoy: hoyISO(), periodo, idEspacio, dia: filtroDia?.fecha ?? null })
  const pag = paginar(filtradas, pagina)
  const dias = agruparPorDia(pag.items)

  // Cambiar un filtro vuelve a la primera página.
  const claveFiltro = `${periodo}|${idEspacio}|${filtroDia?.fecha ?? ""}`
  useEffect(() => setPagina(1), [claveFiltro])

  const unaLinea = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const
  const boton = (color: string, bg: string) =>
    ({
      height: 34,
      padding: "0 14px",
      borderRadius: 9,
      border: `1px solid ${color}33`,
      background: bg,
      color,
      fontFamily: "'Outfit',sans-serif",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }) as const
  const chip = (activo: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 13px",
      borderRadius: 100,
      border: `1.5px solid ${activo ? C.crimson : C.border}`,
      background: activo ? C.crimson : C.card,
      color: activo ? "white" : C.textMuted,
      fontFamily: "'Outfit',sans-serif",
      fontSize: 12.5,
      fontWeight: 500,
      cursor: "pointer",
    }) as const
  const flecha = (habilitado: boolean) =>
    ({
      width: 32,
      height: 32,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: C.card,
      color: habilitado ? C.text : C.textFaint,
      cursor: habilitado ? "pointer" : "default",
      fontSize: 16,
      lineHeight: 1,
    }) as const

  return (
    <div style={{ marginTop: 18, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: C.text }}>Solicitudes pendientes</span>
        {reservas.length > 0 && (
          <span
            style={{
              background: C.pendingBg,
              color: C.pending,
              borderRadius: 100,
              padding: "1px 9px",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            {reservas.length}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted, marginBottom: 14 }}>
        Reservas que esperan aprobación manual, de la más próxima a la más lejana. Tocá un día del calendario para ver sólo
        las de ese día.
      </div>

      {reservas.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
          {filtroDia ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.surface,
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                color: C.textMuted,
              }}
            >
              <span>
                Mostrando las de <strong style={{ color: C.text, fontWeight: 600 }}>{nombreEspacio(filtroDia.idEspacio)}</strong> del{" "}
                <strong style={{ color: C.text, fontWeight: 600 }}>{diaLargo(filtroDia.fecha).toLowerCase()}</strong>, elegido en el calendario.
              </span>
              <button
                type="button"
                onClick={onLimpiarDia}
                style={{
                  all: "unset",
                  marginLeft: "auto",
                  cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.crimson,
                  whiteSpace: "nowrap",
                }}
              >
                Ver todas →
              </button>
            </div>
          ) : (
            <>
              {PERIODOS.map((p) => (
                <button key={p.clave} type="button" aria-pressed={periodo === p.clave} onClick={() => setPeriodo(p.clave)} style={chip(periodo === p.clave)}>
                  {p.etiqueta}
                </button>
              ))}
              {espaciosSede.length > 1 && (
                <select
                  aria-label="Espacio"
                  value={String(idEspacio)}
                  onChange={(e) => setEspacio(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                  style={{
                    marginLeft: "auto",
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 9,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    color: C.text,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                  }}
                >
                  <option value="todos">Todos los espacios</option>
                  {espaciosSede.map((e) => (
                    <option key={e.id} value={e.id}>
                      {etiqueta(e)}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      )}

      {filtradas.length === 0 ? (
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: C.textFaint, padding: "8px 0" }}>
          {reservas.length === 0 ? "No hay solicitudes pendientes." : "No hay solicitudes pendientes con estos filtros."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {dias.map((d) => (
            <div key={d.fecha}>
              <div
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: C.textFaint,
                  marginBottom: 8,
                }}
              >
                {diaLargo(d.fecha)}
              </div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                {d.items.map((r, i) => {
                  const { materia, descripcion } = separarMotivo(r.motivo)
                  const quien =
                    r.solicitanteApellido && r.solicitanteNombre
                      ? `${r.solicitanteApellido}, ${r.solicitanteNombre}`
                      : `Usuario #${r.idUsuario}`
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: COLUMNAS,
                        alignItems: "center",
                        gap: 16,
                        padding: "13px 16px",
                        borderTop: i ? `1px solid ${C.borderLight}` : "none",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          fontFamily: "'Outfit',sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.text,
                        }}
                      >
                        <span aria-hidden style={{ display: "flex", color: C.textMuted }}>
                          {Ico.clock}
                        </span>
                        {r.horaInicio}–{r.horaFin}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", ...unaLinea, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: C.text }}>
                          {quien}
                        </span>
                        <span style={{ display: "block", ...unaLinea, fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                          {nombreEspacio(r.idEspacio)}
                        </span>
                      </span>
                      <span style={{ minWidth: 0 }} title={r.motivo ?? undefined}>
                        <span style={{ display: "block", ...unaLinea, fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: materia ? C.text : C.textFaint }}>
                          {materia || "Sin materia"}
                        </span>
                        {descripcion && (
                          <span style={{ display: "block", ...unaLinea, fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                            {descripcion}
                          </span>
                        )}
                      </span>
                      <span style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => onResolver(r.id, "Aprobada")} style={boton(C.available, C.availableBg)}>
                          ✓ Aprobar
                        </button>
                        <button type="button" onClick={() => onResolver(r.id, "Rechazada")} style={boton(C.occupied, C.occupiedBg)}>
                          ✕ Rechazar
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtradas.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            color: C.textMuted,
          }}
        >
          <span>
            {pag.desde}–{pag.hasta} de {filtradas.length}
          </span>
          {pag.paginas > 1 && (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button type="button" aria-label="Página anterior" disabled={pag.pagina === 1} onClick={() => setPagina(pag.pagina - 1)} style={flecha(pag.pagina > 1)}>
                ‹
              </button>
              <span>
                Página {pag.pagina} de {pag.paginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={pag.pagina === pag.paginas}
                onClick={() => setPagina(pag.pagina + 1)}
                style={flecha(pag.pagina < pag.paginas)}
              >
                ›
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
