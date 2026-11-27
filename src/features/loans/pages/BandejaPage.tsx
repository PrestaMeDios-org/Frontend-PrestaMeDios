import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { Alert } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useSede } from "../../auth/AuthContext"
import { listarEquipamiento } from "../../inventory/services/inventoryApi"
import { AprobarOrdenModal } from "../components/AprobarOrdenModal"
import { AvalModal } from "../components/AvalModal"
import { ICONO, Icono } from "../components/IconosLinea"
import { MotivoModal } from "../components/MotivoModal"
import { etiquetasDelStock, mensajeDeErrorValidacion } from "../services/bandeja"
import { ESTADO_ORDEN_LABEL } from "../services/formato"
import { BandejaTabla } from "../components/BandejaTabla"
import {
  cifra,
  contarPorTipo,
  fichasDelStock,
  LIMITE_BANDEJA,
  resumenBandeja,
  TIPO_LABEL,
  tipoDe,
  type FichaEquipo,
  type ResumenBandeja,
  type TipoSolicitud,
} from "../services/bandejaVista"
import { cancelarOrden, listarBandeja, rechazarOrden } from "../services/loansApi"
import { ESTADOS_ORDEN, type EstadoOrden, type Orden } from "../types"

type Accion = { tipo: "aprobar" | "rechazar" | "cancelar"; orden: Orden }

/**
 * Bandeja de validaciones (SPEC-05 F2.1…F2.3, PRE-10, PRE-15): las órdenes de la sede del
 * administrador (el SUPERADMIN, la del selector o ambas), por estado, de la más vieja a la
 * más nueva. Desde acá se aprueba asignando unidades, se rechaza o se cancela una aprobada.
 */
export function BandejaPage() {
  const C = useC()
  const { sedeVista } = useSede()
  const [estado, setEstado] = useState<EstadoOrden>("pendiente")
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null)
  const [stock, setStock] = useState(() => ({ nombres: new Map<number, string>(), unidades: new Map<number, string>() }))
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [accion, setAccion] = useState<Accion | null>(null)
  // SPEC-10 V-14: fichas del stock (imagen, código, alta gama), tipo elegido y resumen de arriba.
  const [fichas, setFichas] = useState<Map<number, FichaEquipo>>(new Map())
  const [tipo, setTipo] = useState<TipoSolicitud>("estudiante")
  const [resumen, setResumen] = useState<ResumenBandeja | null>(null)
  const [versionResumen, setVersionResumen] = useState(0)
  // SPEC-10: el aval se ve primero en un diálogo; desde ahí se descarga.
  const [avalDe, setAvalDe] = useState<Orden | null>(null)

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      setError(null)
      try {
        setOrdenes(await listarBandeja({ estado, sede: sedeVista ?? undefined, limit: LIMITE_BANDEJA }, signal))
      } catch (e) {
        if (!signal?.aborted) setError(mensajeDeError(e, "No se pudo cargar la bandeja."))
      }
    },
    [estado, sedeVista],
  )

  useEffect(() => {
    const control = new AbortController()
    setOrdenes(null)
    void cargar(control.signal)
    return () => control.abort()
  }, [cargar])

  useEffect(() => {
    // Nombres de equipos y códigos de inventario de las unidades (vista completa del admin).
    const control = new AbortController()
    listarEquipamiento({ sede: sedeVista ?? undefined }, control.signal)
      .then((equipos) => {
        setStock(etiquetasDelStock(equipos))
        setFichas(fichasDelStock(equipos))
      })
      .catch(() => {})
    return () => control.abort()
  }, [sedeVista])

  useEffect(() => {
    // SPEC-10 V-14: las cifras de arriba salen de las listas que ya expone la API.
    const control = new AbortController()
    const sede = sedeVista ?? undefined
    Promise.all([
      listarBandeja({ estado: "pendiente", sede, limit: LIMITE_BANDEJA }, control.signal),
      listarBandeja({ estado: "aprobada", sede, limit: LIMITE_BANDEJA }, control.signal),
    ])
      .then(([p, a]) => setResumen(resumenBandeja(p, a)))
      .catch(() => {})
    return () => control.abort()
  }, [sedeVista, versionResumen])

  const terminar = (mensaje: string) => {
    setAccion(null)
    setAviso(mensaje)
    void cargar()
    setVersionResumen((v) => v + 1)
  }

  const conteo = useMemo(() => contarPorTipo(ordenes ?? [], fichas), [ordenes, fichas])
  const visibles = useMemo(() => (ordenes ?? []).filter((o) => tipoDe(o, fichas) === tipo), [ordenes, fichas, tipo])

  const texto: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }

  // SPEC-10: resumen de la bandeja, diseño "acento" (elegido el 2026-11-26): tarjetas con una
  // barra de color a la izquierda, el nombre en mayúsculas chicas y la cifra grande en su color.
  const metricas: { cifra: number | string; etiqueta: string; detalle: string; color: string; bg: string; icono: ReactNode }[] = [
    {
      cifra: resumen ? cifra(resumen.pendientes, resumen.pendientesAlLimite) : "…",
      etiqueta: "Pendientes",
      detalle: "Esperan tu revisión",
      color: C.pending,
      bg: C.pendingBg,
      icono: ICONO.reloj,
    },
    {
      cifra: resumen ? cifra(resumen.aprobadasHoy, resumen.aprobadasAlLimite) : "…",
      etiqueta: "Aprobadas hoy",
      detalle: "En el día de hoy",
      color: C.available,
      bg: C.availableBg,
      icono: ICONO.aprobar,
    },
    {
      cifra: resumen ? cifra(resumen.conObservacion, resumen.pendientesAlLimite) : "…",
      etiqueta: "Con obs. del docente",
      detalle: "Entre las pendientes",
      color: C.mine,
      bg: C.mineBg,
      icono: ICONO.motivo,
    },
  ]
  const resumenVista = () => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {metricas.map((m) => (
            <div
              key={m.etiqueta}
              style={{
                display: "grid",
                gap: 4,
                padding: "12px 16px 12px 18px",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${m.color}`,
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                }}
              >
                <span style={{ display: "inline-flex", color: m.color }}>
                  <Icono d={m.icono} size={13} />
                </span>
                {m.etiqueta}
              </span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1.1 }}>{m.cifra}</span>
                <span style={{ ...tenue, fontSize: 11 }}>{m.detalle}</span>
              </span>
            </div>
          ))}
        </div>
      )
  }

  // SPEC-10: filtro por tipo de solicitud como sub-pestañas (elegido el 2026-11-26): más chicas que
  // las de estado, con ícono, contador y una línea bordó debajo de la activa.
  const TIPOS: TipoSolicitud[] = ["estudiante", "docente", "especial"]
  const ICONO_TIPO: Record<TipoSolicitud, ReactNode> = {
    estudiante: ICONO.persona,
    docente: ICONO.asignatura,
    especial: ICONO.documento,
  }
  const contador = (n: number, activo: boolean, fuerte = true) => (
    <span
      style={{
        background: activo && fuerte ? C.crimson : activo ? C.crimsonLight : C.bg,
        color: activo && fuerte ? "white" : activo ? C.crimson : C.textMuted,
        borderRadius: 100,
        padding: "0 6px",
        fontSize: 10,
        fontWeight: 700,
        lineHeight: "16px",
      }}
    >
      {n}
    </span>
  )
  const filtroTipo = () => {
    return (
        <div style={{ display: "flex", gap: 18, padding: "0 18px" }}>
          {TIPOS.map((t) => {
            const activo = tipo === t
            return (
              <button
                key={t}
                type="button"
                aria-pressed={activo}
                onClick={() => setTipo(t)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 0 9px",
                  borderStyle: "none none solid",
                  borderWidth: "0 0 2px",
                  borderColor: activo ? C.crimson : "transparent",
                  background: "transparent",
                  color: activo ? C.text : C.textMuted,
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 12.5,
                  fontWeight: activo ? 700 : 500,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "inline-flex", color: activo ? C.crimson : C.textFaint }}>
                  <Icono d={ICONO_TIPO[t]} size={13} />
                </span>
                {TIPO_LABEL[t]}
                {contador(conteo[t], activo, false)}
              </button>
            )
          })}
        </div>
      )
  }

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 16, alignContent: "start" }}>
      {/* SPEC-10 V-14: resumen, pestañas por estado y por tipo, y tabla */}
      {/* Con la lista al límite, la cifra es "al menos": se muestra "100+" (la API no da el total). */}
      {resumenVista()}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div role="tablist" style={{ display: "flex", gap: 4, padding: "6px 14px 0", borderBottom: `1px solid ${C.border}` }}>
          {ESTADOS_ORDEN.map((e) => (
            <button
              key={e}
              type="button"
              role="tab"
              aria-selected={estado === e}
              onClick={() => {
                setEstado(e)
                setAviso(null)
              }}
              style={{
                padding: "10px 14px",
                border: "none",
                borderBottom: `2px solid ${estado === e ? C.crimson : "transparent"}`,
                background: "transparent",
                color: estado === e ? C.crimson : C.textMuted,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {ESTADO_ORDEN_LABEL[e]}s
            </button>
          ))}
        </div>
        <div style={{ borderBottom: `1px solid ${C.border}` }}>{filtroTipo()}</div>

        {(aviso || error || ordenes === null || visibles.length === 0) && (
          <div style={{ padding: "14px 16px", display: "grid", gap: 8 }}>
            {aviso && <Alert tipo="ok">{aviso}</Alert>}
            {error && <Alert>{error}</Alert>}
            {ordenes === null && !error && <p style={tenue}>Cargando la bandeja…</p>}
            {ordenes !== null && visibles.length === 0 && (
              <p style={{ ...tenue, margin: 0 }}>
                No hay {TIPO_LABEL[tipo].toLowerCase()} {ESTADO_ORDEN_LABEL[estado].toLowerCase()}s.
              </p>
            )}
          </div>
        )}

        {visibles.length > 0 && (
          <BandejaTabla
            ordenes={visibles}
            fichas={fichas}
            unidades={stock.unidades}
            acciones={{
              onAprobar: (orden) => setAccion({ tipo: "aprobar", orden }),
              onRechazar: (orden) => setAccion({ tipo: "rechazar", orden }),
              onCancelar: (orden) => setAccion({ tipo: "cancelar", orden }),
              onVerAval: (orden) => setAvalDe(orden),
            }}
          />
        )}
        {ordenes !== null && ordenes.length >= LIMITE_BANDEJA && (
          <p style={{ ...tenue, margin: 0, padding: "10px 16px", borderTop: `1px solid ${C.border}` }}>
            Se muestran las primeras {LIMITE_BANDEJA} solicitudes de este estado; el filtro por tipo se aplica sobre ellas.
          </p>
        )}
      </div>

      {accion?.tipo === "aprobar" && (
        <AprobarOrdenModal
          orden={accion.orden}
          nombres={stock.nombres}
          unidades={stock.unidades}
          onClose={() => setAccion(null)}
          onAprobada={(o) => terminar(`Aprobaste la solicitud #${o.id}.`)}
        />
      )}
      {accion?.tipo === "rechazar" && (
        <MotivoModal
          titulo={`Rechazar solicitud #${accion.orden.id}`}
          descripcion="La orden queda rechazada y el solicitante ve el motivo."
          accion="Rechazar"
          onClose={() => setAccion(null)}
          onConfirmar={async (motivo) => {
            try {
              await rechazarOrden(accion.orden.id, motivo)
              terminar(`Rechazaste la solicitud #${accion.orden.id}.`)
              return null
            } catch (e) {
              return mensajeDeErrorValidacion(e)
            }
          }}
        />
      )}
      {accion?.tipo === "cancelar" && (
        <MotivoModal
          titulo={`Cancelar solicitud #${accion.orden.id}`}
          descripcion="Se liberan las unidades reservadas y el solicitante ve el motivo."
          accion="Cancelar solicitud"
          onClose={() => setAccion(null)}
          onConfirmar={async (motivo) => {
            try {
              await cancelarOrden(accion.orden.id, motivo)
              terminar(`Cancelaste la solicitud #${accion.orden.id}.`)
              return null
            } catch (e) {
              return mensajeDeErrorValidacion(e)
            }
          }}
        />
      )}
      {avalDe && <AvalModal orden={avalDe} onClose={() => setAvalDe(null)} />}
    </div>
  )
}
