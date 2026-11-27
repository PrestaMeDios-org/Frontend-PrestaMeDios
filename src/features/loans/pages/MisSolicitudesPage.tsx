import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Badge } from "../../../components/ui/Badge"
import { Alert } from "../../../components/ui/Form"
import { Ico } from "../../../components/ui/icons"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { AltaGamaBadge } from "../../inventory/components/AltaGamaBadge"
import { DIA_CORTO, HORA_CORTA, ICONO, Icono } from "../components/IconosLinea"
import { listarCategorias, listarEquipamiento } from "../../inventory/services/inventoryApi"
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

/** Datos del catálogo que muestra el detalle de cada línea (SPEC-10). */
interface DatoEquipo {
  nombre: string
  altaGama: boolean
  codigo: string
  categoria: { nombre: string; color: string | null } | null
}


/**
 * "Mis solicitudes" (SPEC-05 F1.5, USR-06): las órdenes propias, de la más nueva a la más
 * vieja, con su estado. Una orden pendiente se puede cancelar (CU-L03, F2.4).
 * SPEC-10 V-18: pestañas de equipamiento y espacios (las reservas venían al pie de Reservas de
 * Espacios), chips por estado y una fila compacta por solicitud.
 */
export function MisSolicitudesPage() {
  const C = useC()
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null)
  const [equipos, setEquipos] = useState<Map<number, DatoEquipo>>(new Map())
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
    Promise.all([listarEquipamiento({}, control.signal), listarCategorias(control.signal).catch(() => [])])
      .then(([lista, categorias]) => {
        const cats = new Map(categorias.map((c) => [c.id, { nombre: c.nombre, color: c.color }]))
        setEquipos(
          new Map(
            lista.map((e) => [
              e.id,
              { nombre: e.nombre, altaGama: !!e.alta_gama, codigo: e.codigo, categoria: cats.get(e.categoria_id) ?? null },
            ]),
          ),
        )
      })
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
  // SPEC-10: cabeceras con ícono y fecha arriba, hora abajo.
  const encabezado: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6 }
  const fechaHora = (fecha: Date) => (
    <span style={{ display: "grid", gap: 2, lineHeight: 1.25 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text, fontWeight: 600 }}>
        <span style={{ color: C.textFaint, display: "inline-flex" }}><Icono d={ICONO.calendario} size={13} /></span>
        {DIA_CORTO.format(fecha)}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.textMuted }}>
        <span style={{ color: C.textFaint, display: "inline-flex" }}><Icono d={ICONO.reloj} size={13} /></span>
        {HORA_CORTA.format(fecha)}
      </span>
    </span>
  )

  // SPEC-10: misma presentación para una reserva de espacio (día arriba, horario abajo).
  const diaYHorario = (dia: string, horario: string) => (
    <span style={{ display: "grid", gap: 2, lineHeight: 1.25 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.text, fontWeight: 600 }}>
        <span style={{ color: C.textFaint, display: "inline-flex" }}><Icono d={ICONO.calendario} size={13} /></span>
        {dia}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.textMuted }}>
        <span style={{ color: C.textFaint, display: "inline-flex" }}><Icono d={ICONO.reloj} size={13} /></span>
        {horario}
      </span>
    </span>
  )

  const nombres = new Map([...equipos].map(([id, e]) => [id, e.nombre]))

  // SPEC-10: detalle de una solicitud, "panel suave" (elegido el 2026-11-26): un bloque claro con
  // una fila por equipo, la cantidad a la izquierda y la categoría y el tipo a la derecha.
  const tipoEquipo = (dato: DatoEquipo | undefined) =>
    dato?.altaGama ? (
      <AltaGamaBadge />
    ) : dato ? (
      <span style={{ ...tenue, fontSize: 11.5, color: C.textFaint, flexShrink: 0 }}>Común</span>
    ) : null
  const puntoCategoria = (dato: DatoEquipo | undefined) =>
    dato?.categoria && (
      <span style={{ ...tenue, fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <span aria-hidden style={{ width: 7, height: 7, borderRadius: 99, background: dato.categoria.color ?? C.textFaint }} />
        {dato.categoria.nombre}
      </span>
    )
  const pieDetalle = (orden: Orden, grupos: ReturnType<typeof resumenDeLineas>) => {
    const total = grupos.reduce((n, g) => n + g.cantidad, 0)
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
        <span style={{ ...tenue, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icono d={ICONO.pedida} size={13} />
          Pedida el {fechaLab(orden.fechaSolicitud)}
        </span>
        <span style={tenue}>
          {total} {total === 1 ? "equipo" : "equipos"}
        </span>
        {orden.motivoResolucion && (
          <span style={{ ...tenue, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icono d={ICONO.motivo} size={13} />
            Motivo: {orden.motivoResolucion}
          </span>
        )}
      </div>
    )
  }

  const detalleDeOrden = (orden: Orden, grupos: ReturnType<typeof resumenDeLineas>) => {
    const filas = grupos.map((g) => ({ g, dato: equipos.get(g.equipamientoId) }))

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ background: C.card, borderRadius: 12, padding: "4px 14px", boxShadow: `0 1px 2px ${C.border}` }}>
          {filas.map(({ g, dato }, k) => (
            <div
              key={g.equipamientoId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: k ? `1px solid ${C.borderLight}` : "none",
                minWidth: 0,
              }}
            >
              <span style={{ ...texto, fontWeight: 700, minWidth: 26, color: C.crimson }}>{g.cantidad}×</span>
              <span style={{ ...texto, ...unaLinea, fontWeight: 600, flex: 1, minWidth: 0 }}>{g.nombre}</span>
              {puntoCategoria(dato)}
              <span style={{ minWidth: 84, display: "flex", justifyContent: "flex-end" }}>{tipoEquipo(dato)}</span>
            </div>
          ))}
        </div>
        {pieDetalle(orden, grupos)}
      </div>
    )
  }

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

  const tab = (clave: Pestana, etiqueta: string, n: number | undefined, icono?: ReactNode) => {
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
        {icono && <Icono d={icono} size={15} />}
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
    // SPEC-10: separador más marcado entre solicitudes, para ver dónde empieza y termina cada una.
    <div style={{ borderTop: `1px solid ${C.textMuted}55` }}>
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
        <div style={{ ...texto, fontSize: 12.5, minWidth: 0 }}>{fecha}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{estado}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>{accion}</div>
      </div>
      {abierta && children && (
        <div style={{ background: C.surface, padding: "2px 16px 14px 52px" }}>
          <div style={{ display: "grid", gap: 4, maxWidth: 720 }}>{children}</div>
        </div>
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
        {tab("equipos", "Equipamiento", ordenes?.length, ICONO.equipamiento)}
        {tab("espacios", "Espacios", reservas?.length, ICONO.espacio)}
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
            <span style={encabezado}>
              <Icono d={pestana === "equipos" ? ICONO.solicitud : ICONO.espacio} />
              {pestana === "equipos" ? "Solicitud" : "Espacio"}
            </span>
            {pestana === "equipos" ? (
              <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <span style={encabezado}>
                  <Icono d={ICONO.retiro} />
                  Retiro
                </span>
                <span style={encabezado}>
                  <Icono d={ICONO.devolucion} />
                  Devolución
                </span>
              </span>
            ) : (
              <span style={encabezado}>
                <Icono d={ICONO.fechaHorario} />
                Fecha y horario
              </span>
            )}
            <span style={encabezado}>
              <Icono d={ICONO.estado} />
              Estado
            </span>
            <span />
          </div>

          {pestana === "equipos" &&
            ordenesVisibles.map((orden) => {
              const grupos = resumenDeLineas(orden.lineas, nombres)
              const resumen =
                grupos.length === 0
                  ? "Sin equipos"
                  : `${grupos[0]!.cantidad} × ${grupos[0]!.nombre}${grupos.length > 1 ? ` + ${grupos.length - 1} más` : ""}`
              const abierta = abiertas.has(orden.id)
              return (
                <Fila
                  key={orden.id}
                  principal={`Solicitud #${orden.id}`}
                  secundario={resumen}
                  fecha={
                    orden.retiro && orden.devolucion ? (
                      <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {fechaHora(orden.retiro)}
                        {fechaHora(orden.devolucion)}
                      </span>
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
                  onClick={() => alternar(orden.id)}
                  abierta={abierta}
                >
                  {detalleDeOrden(orden, grupos)}
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
                  fecha={diaYHorario(fechaCorta(r.fecha), `${r.horaInicio}–${r.horaFin}`)}
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
