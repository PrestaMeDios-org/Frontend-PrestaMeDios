import { useState, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../../theme"
import { Badge } from "../../../components/ui/Badge"
import { Ico } from "../../../components/ui/icons"
import { separarFueraDeServicio, sinUnidadesEnUso } from "../services/stockVista"
import { ICONOS_STOCK, IconoStock } from "./IconosStock"
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
// SPEC-10 (2026-11-26): botones de ícono chicos, con el nombre de la acción en el tooltip y en
// `aria-label`; "Fuera de servicio" en rojo porque es definitiva (sigue pidiendo confirmación).
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
  const icono = (
    etiqueta: string,
    d: ReactNode,
    color: string,
    onClick: () => void,
    { bloquear = true, fondo }: { bloquear?: boolean; fondo?: string } = {},
  ) => (
    <button
      type="button"
      title={etiqueta}
      aria-label={`${etiqueta}: ${u.codigoInventario}`}
      disabled={bloquear && ocupado}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: fondo ?? C.card,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: bloquear && ocupado ? "default" : "pointer",
        opacity: bloquear && ocupado ? 0.6 : 1,
      }}
    >
      <IconoStock d={d} size={14} />
    </button>
  )
  return (
    <div style={{ display: "inline-flex", gap: 5, justifyContent: "flex-end" }}>
      {onHistorial && icono("Historial", ICONOS_STOCK.historial, C.text, () => onHistorial(u), { bloquear: false })}
      {u.estado === "disponible" &&
        icono("Pasar a mantenimiento", ICONOS_STOCK.mantenimiento, C.maintenance, () => onEstado(u, "mantenimiento"))}
      {u.estado === "mantenimiento" &&
        icono("Rehabilitar", ICONOS_STOCK.rehabilitar, C.available, () => onEstado(u, "disponible"))}
      {(u.estado === "disponible" || u.estado === "mantenimiento") &&
        icono("Dar de baja (fuera de servicio)", ICONOS_STOCK.baja, C.occupied, () => onEstado(u, "baja"))}
      <button
        type="button"
        title="Editar unidad"
        aria-label={`Editar unidad ${u.codigoInventario}`}
        disabled={ocupado}
        onClick={() => onEditar(u)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.card,
          color: C.textMuted,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: ocupado ? "default" : "pointer",
          opacity: ocupado ? 0.6 : 1,
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
  const [sedeVista, setSedeVista] = useState<string | null>(null)
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

  // SPEC-10 (2026-11-26): fila compacta del "panel suave".
  const fila = (u: Unidad, i: number): ReactNode => (
    <div
      key={u.id}
      style={{
        display: "grid",
        gridTemplateColumns: "34px minmax(0, 1fr) 132px auto",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        borderTop: i ? `1px solid ${C.borderLight}` : "none",
        opacity: u.estado === "baja" ? 0.6 : 1,
      }}
    >
      <span
        title={u.locker ? `Locker ${u.locker}` : "Sin locker"}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: C.bg,
          color: u.locker ? C.text : C.textFaint,
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit',sans-serif",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.06em", color: C.textFaint }}>LOCKER</span>
        <span style={{ fontSize: 13, fontWeight: 800 }}>{u.locker ?? "—"}</span>
      </span>
      <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 10, fontFamily: "'Inter',sans-serif" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{u.codigoInventario}</span>
        <span
          style={{ fontSize: 11.5, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          N.º de serie {u.serie}
        </span>
      </div>
      <div>
        <EstadoBadge estado={u.estado} />
      </div>
      <AccionesUnidad unidad={u} ocupado={ocupado} onEstado={onEstado} onEditar={onEditar} onHistorial={onHistorial} />
    </div>
  )

  // Resumen como píldoras suaves, sin fondo propio.
  const pildora = (n: number, texto: string, color: string, bg: string): ReactNode =>
    n > 0 && (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "2px 9px",
          borderRadius: 99,
          background: bg,
          color,
          fontFamily: "'Inter',sans-serif",
          fontSize: 11.5,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <strong style={{ fontWeight: 800 }}>{n}</strong> {texto}
      </span>
    )
  const resumen = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {pildora(unidades.length, unidades.length === 1 ? "unidad" : "unidades", C.text, C.bg)}
      {pildora(cuenta("disponible"), "disponibles", C.available, C.availableBg)}
      {pildora(cuenta("prestado"), "prestadas", C.mine, C.mineBg)}
      {pildora(cuenta("mantenimiento"), "en mantenimiento", C.maintenance, C.maintenanceBg)}
      {pildora(cuenta("baja"), "fuera de servicio", C.textMuted, C.bg)}
    </div>
  )
  const agregar = (
    <button type="button" disabled={ocupado} onClick={onAgregar} style={boton(C.crimson, C.crimson)}>
      + Agregar unidad
    </button>
  )
  const aviso = sinUnidadesEnUso(equipo) && (
    <div
      role="note"
      style={{
        padding: "9px 12px",
        borderRadius: 10,
        background: C.mineBg,
        color: C.mine,
        fontFamily: "'Inter',sans-serif",
        fontSize: 12.5,
        lineHeight: 1.45,
      }}
    >
      Todas las unidades están fuera de servicio. Si el equipo no vuelve a usarse, dalo de baja con el botón de la
      papelera para sacarlo del catálogo.
    </div>
  )
  const vacio = (
    <div
      style={{
        padding: 14,
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
  )
  const lineaFueraDeServicio = (g: (typeof grupos)[number]) =>
    g.fueraDeServicio.length > 0 && (
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
            padding: "8px 12px",
            border: "none",
            borderTop: `1px solid ${C.borderLight}`,
            background: "transparent",
            color: C.textMuted,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span aria-hidden style={{ display: "inline-flex", transform: abiertas.has(g.sede) ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            {Ico.chevDown}
          </span>
          Fuera de servicio ({g.fueraDeServicio.length})
        </button>
        {abiertas.has(g.sede) && g.fueraDeServicio.map((u) => fila(u, 1))}
      </>
    )
  const listaDeSede = (g: (typeof grupos)[number], caja: boolean) => (
    <div
      style={
        caja
          ? { background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 12, boxShadow: `0 1px 2px ${C.border}`, overflow: "hidden" }
          : { borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}` }
      }
    >
      {g.enUso.length === 0 ? (
        <div style={{ padding: "10px 12px", fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
          Ninguna unidad en uso en esta sede.
        </div>
      ) : (
        g.enUso.map((u, i) => fila(u, i))
      )}
      {lineaFueraDeServicio(g)}
    </div>
  )
  // SPEC-10 (elegido el 2026-11-26): pestañas por sede. Se ve una sede a la vez, con el resumen en
  // píldoras y "Agregar unidad" en la misma línea, y abajo un bloque blanco con sus unidades.
  const activa = grupos.find((g) => g.sede === sedeVista) ?? grupos[0]
  return (
    <div style={{ background: C.card, padding: "4px 20px 14px 52px", borderTop: `1px solid ${C.borderLight}` }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {grupos.length > 0 && (
              <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 9, background: C.bg }}>
                {grupos.map((g) => {
                  const sel = g.sede === activa?.sede
                  return (
                    <button
                      key={g.sede}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setSedeVista(g.sede)}
                      style={{
                        padding: "4px 11px",
                        borderRadius: 7,
                        border: "none",
                        background: sel ? C.card : "transparent",
                        boxShadow: sel ? `0 1px 2px ${C.border}` : "none",
                        color: sel ? C.text : C.textMuted,
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: 12,
                        fontWeight: sel ? 700 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {g.sede} · {g.total}
                    </button>
                  )
                })}
              </div>
            )}
            {resumen}
          </div>
          {agregar}
        </div>
        {aviso}
        {unidades.length === 0 || !activa ? vacio : listaDeSede(activa, true)}
      </div>
    </div>
  )
}
