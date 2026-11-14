import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import { Alert } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useSede } from "../../auth/AuthContext"
import { listarEquipamiento } from "../../inventory/services/inventoryApi"
import { AprobarOrdenModal } from "../components/AprobarOrdenModal"
import { MotivoModal } from "../components/MotivoModal"
import { etiquetasDelStock, mensajeDeErrorValidacion } from "../services/bandeja"
import { ESTADO_ORDEN_LABEL } from "../services/formato"
import { BandejaTabla } from "../components/BandejaTabla"
import { contarPorTipo, fichasDelStock, resumenBandeja, TIPO_LABEL, tipoDe, type FichaEquipo, type TipoSolicitud } from "../services/bandejaVista"
import { cancelarOrden, descargarAval, listarBandeja, rechazarOrden } from "../services/loansApi"
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
  const [resumen, setResumen] = useState<{ pendientes: number; aprobadasHoy: number; conObservacion: number } | null>(null)
  const [versionResumen, setVersionResumen] = useState(0)

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      setError(null)
      try {
        setOrdenes(await listarBandeja({ estado, sede: sedeVista ?? undefined, limit: 100 }, signal))
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
      listarBandeja({ estado: "pendiente", sede, limit: 100 }, control.signal),
      listarBandeja({ estado: "aprobada", sede, limit: 100 }, control.signal),
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

  const verAval = async (orden: Orden) => {
    // La ventana se abre antes de esperar la descarga, para que el navegador no la bloquee.
    const ventana = window.open("", "_blank")
    try {
      const url = URL.createObjectURL(await descargarAval(orden.id))
      if (ventana) ventana.location.href = url
      else window.location.assign(url)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      ventana?.close()
      setError(mensajeDeError(e, "No se pudo abrir el aval."))
    }
  }

  const texto: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }

  const tarjeta = (cifra: number | string, etiqueta: string, color: string, bg: string) => (
    <div
      style={{
        flex: "1 1 220px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 18px",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
      }}
    >
      <span
        style={{
          minWidth: 46,
          height: 46,
          padding: "0 10px",
          borderRadius: 12,
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit',sans-serif",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {cifra}
      </span>
      <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.textMuted }}>{etiqueta}</span>
    </div>
  )

  const pastilla = (t: TipoSolicitud) => {
    const activa = tipo === t
    return (
      <button
        key={t}
        type="button"
        aria-pressed={activa}
        onClick={() => setTipo(t)}
        // SPEC-10 V-14: mismo chip que los filtros de categoría del catálogo.
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "6px 13px",
          borderRadius: 100,
          border: `1.5px solid ${activa ? C.crimson : C.border}`,
          background: activa ? C.crimson : C.card,
          color: activa ? "white" : C.textMuted,
          fontFamily: "'Outfit',sans-serif",
          fontSize: 12.5,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {TIPO_LABEL[t]}
        <span
          style={{
            background: activa ? "rgba(255,255,255,0.22)" : C.bg,
            borderRadius: 100,
            padding: "0 5px",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          {conteo[t]}
        </span>
      </button>
    )
  }

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 16, alignContent: "start" }}>
      {/* SPEC-10 V-14: resumen, pestañas por estado y por tipo, y tabla */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {tarjeta(resumen?.pendientes ?? "…", "Total pendientes", C.pending, C.pendingBg)}
        {tarjeta(resumen?.aprobadasHoy ?? "…", "Aprobadas hoy", C.available, C.availableBg)}
        {tarjeta(resumen?.conObservacion ?? "…", "Con obs. del docente", C.mine, C.mineBg)}
      </div>

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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
          {(["estudiante", "docente", "especial"] as TipoSolicitud[]).map(pastilla)}
        </div>

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
              onVerAval: (orden) => void verAval(orden),
            }}
          />
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
    </div>
  )
}
