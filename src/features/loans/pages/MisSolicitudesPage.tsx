import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Badge } from "../../../components/ui/Badge"
import { Alert } from "../../../components/ui/Form"
import { Ico } from "../../../components/ui/icons"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { listarEquipamiento } from "../../inventory/services/inventoryApi"
import { fechaCorta, useMisReservas } from "../../spaces/components/MisReservas"
import { cancelarOrden, listarMisOrdenes } from "../services/loansApi"
import { ESTADO_ORDEN_LABEL, fechaLab, resumenDeLineas } from "../services/formato"
import {
  claveDeReserva,
  contarPorEstado,
  FILTROS_ESTADO,
  filtrarPorEstado,
  ordenarReservas,
  type FiltroEstado,
} from "../services/misSolicitudesVista"
import type { EstadoOrden, Orden } from "../types"
import { useConfirmar } from "../../../components/ui/Dialogo"

type Pestana = "equipos" | "espacios"

/**
 * "Mis solicitudes" (SPEC-05 F1.5, USR-06): las órdenes propias, de la más nueva a la más
 * vieja, con su estado. Una orden pendiente se puede cancelar (CU-L03, F2.4).
 * SPEC-10 V-18: pestañas de equipamiento y espacios (las reservas venían al pie de Reservas de
 * Espacios), chips por estado y una fila compacta por solicitud.
 */
export function MisSolicitudesPage() {
  const C = useC()
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null)
  const [nombres, setNombres] = useState<Map<number, string>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)
  const [pestana, setPestana] = useState<Pestana>("equipos")
  const [filtro, setFiltro] = useState<FiltroEstado>("todas")
  const [abiertas, setAbiertas] = useState<ReadonlySet<number>>(new Set())
  const esp = useMisReservas()

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setError(null)
    try {
      setOrdenes(await listarMisOrdenes({ limit: 100 }, signal))
    } catch (e) {
      if (!signal?.aborted) setError(mensajeDeError(e, "No se pudieron cargar tus solicitudes."))
    }
  }, [])

  useEffect(() => {
    const control = new AbortController()
    void cargar(control.signal)
    // Los nombres salen del catálogo; si falla, se muestra "Equipo #id".
    listarEquipamiento({}, control.signal)
      .then((equipos) => setNombres(new Map(equipos.map((e) => [e.id, e.nombre]))))
      .catch(() => {})
    return () => control.abort()
  }, [cargar])

  const confirmar = useConfirmar() // SPEC-10 V-11
  const cancelar = async (orden: Orden) => {
    if (
      !(await confirmar({
        titulo: `¿Cancelar la solicitud #${orden.id}?`,
        mensaje: "Se liberan los equipos reservados. Esta acción no se puede deshacer.",
        aceptar: "Cancelar solicitud",
        cancelar: "Volver",
        peligro: true,
      }))
    )
      return
    setCancelando(orden.id)
    setAviso(null)
    setError(null)
    try {
      await cancelarOrden(orden.id)
      setAviso(`Cancelaste la solicitud #${orden.id}.`)
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cancelar la solicitud."))
    } finally {
      setCancelando(null)
    }
  }

  const colores: Record<EstadoOrden, { color: string; bg: string }> = {
    pendiente: { color: C.pending, bg: C.pendingBg },
    aprobada: { color: C.available, bg: C.availableBg },
    rechazada: { color: C.occupied, bg: C.occupiedBg },
    cancelada: { color: C.textMuted, bg: C.surface },
  }
  const texto = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text } as const
  const tenue = { ...texto, fontSize: 12, color: C.textMuted } as const
  const unaLinea: CSSProperties = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

  // Conteos y filtros de cada pestaña.
  const claveOrden = (o: Orden) => o.estado
  const claveRes = (r: { estado: string }) => claveDeReserva(r.estado)
  const reservas = esp.reservas ? ordenarReservas(esp.reservas, esp.ahora) : null
  const conteo =
    pestana === "equipos" ? contarPorEstado(ordenes ?? [], claveOrden) : contarPorEstado(reservas ?? [], claveRes)
  const ordenesVisibles = filtrarPorEstado(ordenes ?? [], filtro, claveOrden)
  const reservasVisibles = filtrarPorEstado(reservas ?? [], filtro, claveRes)

  const cambiarPestana = (p: Pestana) => {
    setPestana(p)
    setFiltro("todas")
  }
  const alternar = (id: number) =>
    setAbiertas((prev) => {
      const sig = new Set(prev)
      if (sig.has(id)) sig.delete(id)
      else sig.add(id)
      return sig
    })

  const tab = (clave: Pestana, etiqueta: string, n: number | undefined) => {
    const activa = pestana === clave
    return (
      <button
        type="button"
        role="tab"
        aria-selected={activa}
        onClick={() => cambiarPestana(clave)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px",
          border: "none",
          borderBottom: `2px solid ${activa ? C.crimson : "transparent"}`,
          background: "transparent",
          color: activa ? C.crimson : C.textMuted,
          fontFamily: "'Outfit',sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {etiqueta}
        {n !== undefined && (
          <span
            style={{
              background: activa ? C.crimsonLight : C.bg,
              color: activa ? C.crimson : C.textMuted,
              borderRadius: 100,
              padding: "0 7px",
              fontSize: 11.5,
            }}
          >
            {n}
          </span>
        )}
      </button>
    )
  }

  const chip = (activo: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 13px",
    borderRadius: 100,
    border: `1.5px solid ${activo ? C.crimson : C.border}`,
    background: activo ? C.crimson : C.card,
    color: activo ? "white" : C.textMuted,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  })

  const botonCancelar = (ocupado: boolean, onClick: () => void) => (
    <button
      type="button"
      disabled={ocupado}
      onClick={(ev) => {
        ev.stopPropagation()
        onClick()
      }}
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: C.card,
        color: C.occupied,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: ocupado ? "default" : "pointer",
        opacity: ocupado ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {ocupado ? "Cancelando…" : "Cancelar"}
    </button>
  )

  const Fila = ({
    principal,
    secundario,
    fecha,
    estado,
    accion,
    apagada,
    onClick,
    abierta,
    children,
  }: {
    principal: ReactNode
    secundario?: ReactNode
    fecha: ReactNode
    estado: ReactNode
    accion?: ReactNode
    apagada?: boolean
    onClick?: () => void
    abierta?: boolean
    children?: ReactNode
  }) => (
    <div style={{ borderTop: `1px solid ${C.borderLight}` }}>
      <div
        onClick={onClick}
        style={{
          display: "grid",
          gridTemplateColumns: "22px minmax(0, 1.4fr) minmax(0, 1.2fr) 150px 100px",
          alignItems: "center",
          gap: 14,
          padding: "10px 16px",
          cursor: onClick ? "pointer" : "default",
          background: abierta ? C.surface : "transparent",
          opacity: apagada ? 0.6 : 1,
        }}
      >
        <span
          aria-hidden
          style={{
            color: abierta ? C.crimson : C.textFaint,
            display: "flex",
            transform: abierta ? "none" : "rotate(-90deg)",
            transition: "transform 0.15s",
            visibility: onClick ? "visible" : "hidden",
          }}
        >
          {Ico.chevDown}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...texto, ...unaLinea, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700 }}>{principal}</div>
          {secundario && <div style={{ ...tenue, ...unaLinea, marginTop: 1 }}>{secundario}</div>}
        </div>
        <div style={{ ...texto, ...unaLinea, fontSize: 12.5 }}>{fecha}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{estado}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>{accion}</div>
      </div>
      {abierta && children && (
        <div style={{ background: C.surface, padding: "0 16px 12px 52px", display: "grid", gap: 4 }}>{children}</div>
      )}
    </div>
  )

  const avisoActual = pestana === "equipos" ? aviso : esp.aviso
  const errorActual = pestana === "equipos" ? error : esp.error
  const cargando = pestana === "equipos" ? ordenes === null : reservas === null
  const vacio = pestana === "equipos" ? ordenesVisibles.length === 0 : reservasVisibles.length === 0

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 14, alignContent: "start" }}>
      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}` }}>
        {tab("equipos", "Equipamiento", ordenes?.length)}
        {tab("espacios", "Espacios", reservas?.length)}
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {FILTROS_ESTADO.map(([clave, etiqueta]) => {
          const activo = filtro === clave
          return (
            <button key={clave} type="button" aria-pressed={activo} onClick={() => setFiltro(clave)} style={chip(activo)}>
              {etiqueta}
              <span
                style={{
                  background: activo ? "rgba(255,255,255,0.22)" : C.bg,
                  borderRadius: 100,
                  padding: "0 5px",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {conteo[clave]}
              </span>
            </button>
          )
        })}
      </div>

      {avisoActual && <Alert tipo="ok">{avisoActual}</Alert>}
      {errorActual && <Alert>{errorActual}</Alert>}

      {cargando && !errorActual ? (
        <p style={tenue}>Cargando…</p>
      ) : vacio ? (
        <p style={{ ...tenue, textAlign: "center", padding: "24px 0" }}>
          {filtro !== "todas"
            ? "No hay solicitudes con ese estado."
            : pestana === "equipos"
              ? "Todavía no hiciste solicitudes de equipos. Agregá equipos desde el catálogo para pedir un préstamo."
              : "No tenés reservas de espacios. Podés pedir una desde Reservas de Espacios."}
        </p>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "22px minmax(0, 1.4fr) minmax(0, 1.2fr) 150px 100px",
              gap: 14,
              padding: "9px 16px",
              background: C.bg,
              fontFamily: "'Outfit',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: C.textMuted,
            }}
          >
            <span />
            <span>{pestana === "equipos" ? "Solicitud" : "Espacio"}</span>
            <span>{pestana === "equipos" ? "Retiro → Devolución" : "Fecha y horario"}</span>
            <span>Estado</span>
            <span />
          </div>

          {pestana === "equipos" &&
            ordenesVisibles.map((orden) => {
              const grupos = resumenDeLineas(orden.lineas, nombres)
              const resumen =
                grupos.length === 0
                  ? "Sin equipos"
                  : `${grupos[0]!.cantidad} × ${grupos[0]!.nombre}${grupos.length > 1 ? ` + ${grupos.length - 1} más` : ""}`
              const conDetalle = grupos.length > 1 || !!orden.motivoResolucion
              const abierta = abiertas.has(orden.id)
              return (
                <Fila
                  key={orden.id}
                  principal={`Solicitud #${orden.id}`}
                  secundario={resumen}
                  fecha={
                    orden.retiro && orden.devolucion ? (
                      <>
                        {fechaLab(orden.retiro)} <span style={{ color: C.textFaint }}>→</span> {fechaLab(orden.devolucion)}
                      </>
                    ) : (
                      <span style={{ color: C.textFaint }}>—</span>
                    )
                  }
                  estado={
                    <>
                      <Badge label={ESTADO_ORDEN_LABEL[orden.estado]} {...colores[orden.estado]} />
                      {orden.demorado && <Badge label="Demorado" color={C.occupied} bg={C.occupiedBg} />}
                    </>
                  }
                  accion={
                    orden.estado === "pendiente" && botonCancelar(cancelando === orden.id, () => void cancelar(orden))
                  }
                  apagada={orden.estado === "cancelada" || orden.estado === "rechazada"}
                  onClick={conDetalle ? () => alternar(orden.id) : undefined}
                  abierta={abierta}
                >
                  {grupos.map((g) => (
                    <span key={g.equipamientoId} style={texto}>
                      {g.cantidad} × {g.nombre}
                    </span>
                  ))}
                  {orden.motivoResolucion && <span style={tenue}>Motivo: {orden.motivoResolucion}</span>}
                  <span style={tenue}>Pedida el {fechaLab(orden.fechaSolicitud)}</span>
                </Fila>
              )
            })}

          {pestana === "espacios" &&
            reservasVisibles.map((r) => {
              const expirada = `${r.fecha}T${r.horaFin}` <= esp.ahora
              const iniciada = `${r.fecha}T${r.horaInicio}` <= esp.ahora
              const clave = claveDeReserva(r.estado)
              const etiqueta =
                r.estado === "En_Uso"
                  ? "En uso"
                  : expirada && (r.estado === "Aprobada" || r.estado === "Pendiente")
                    ? "Expirada"
                    : r.estado
              const color =
                expirada || !clave || clave === "cancelada" || clave === "todas"
                  ? r.estado === "En_Uso"
                    ? { color: C.mine, bg: C.mineBg }
                    : { color: C.textMuted, bg: C.surface }
                  : colores[clave]
              return (
                <Fila
                  key={r.id}
                  principal={esp.nombre(r.idEspacio)}
                  secundario={r.motivo}
                  fecha={`${fechaCorta(r.fecha)} · ${r.horaInicio}–${r.horaFin}`}
                  estado={<Badge label={etiqueta} {...color} />}
                  accion={
                    !iniciada &&
                    (r.estado === "Pendiente" || r.estado === "Aprobada") &&
                    botonCancelar(esp.cancelando === r.id, () => void esp.cancelar(r))
                  }
                  apagada={expirada || r.estado === "Cancelada" || r.estado === "Rechazada"}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}
