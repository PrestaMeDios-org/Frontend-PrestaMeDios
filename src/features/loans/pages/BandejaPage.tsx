import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useSede } from "../../auth/AuthContext"
import { listarEquipamiento } from "../../inventory/services/inventoryApi"
import { AprobarOrdenModal } from "../components/AprobarOrdenModal"
import { MotivoModal } from "../components/MotivoModal"
import { etiquetasDelStock, mensajeDeErrorValidacion, retiroVencido } from "../services/bandeja"
import { ESTADO_ORDEN_LABEL, fechaLab, resumenDeLineas } from "../services/formato"
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
      .then((equipos) => setStock(etiquetasDelStock(equipos)))
      .catch(() => {})
    return () => control.abort()
  }, [sedeVista])

  const terminar = (mensaje: string) => {
    setAccion(null)
    setAviso(mensaje)
    void cargar()
  }

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

  const colores: Record<EstadoOrden, { color: string; bg: string }> = {
    pendiente: { color: C.pending, bg: C.pendingBg },
    aprobada: { color: C.available, bg: C.availableBg },
    rechazada: { color: C.occupied, bg: C.occupiedBg },
    cancelada: { color: C.textMuted, bg: C.surface },
  }
  const texto: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 12, alignContent: "start" }}>
      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}` }}>
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
              padding: "8px 14px",
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

      {aviso && <Alert tipo="ok">{aviso}</Alert>}
      {error && <Alert>{error}</Alert>}
      {ordenes === null && !error && <p style={tenue}>Cargando la bandeja…</p>}
      {ordenes?.length === 0 && <p style={tenue}>No hay solicitudes {ESTADO_ORDEN_LABEL[estado].toLowerCase()}s.</p>}

      {ordenes?.map((orden) => {
        const vencido = retiroVencido(orden)
        const hayEntregas = orden.lineas.some((l) => l.estado === "entregado")
        return (
          <article
            key={orden.id}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, display: "grid", gap: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ ...texto, fontWeight: 700, fontFamily: "'Outfit',sans-serif", fontSize: 15 }}>
                #{orden.id} · {orden.solicitante?.nombreCompleto ?? `Usuario #${orden.solicitanteId}`}
              </span>
              <Badge label={ESTADO_ORDEN_LABEL[orden.estado]} {...colores[orden.estado]} />
              {vencido && <Badge label="Retiro vencido" color={C.occupied} bg={C.occupiedBg} />}
              {orden.demorado && <Badge label="Demorado" color={C.occupied} bg={C.occupiedBg} />}
              <span style={{ ...tenue, marginLeft: "auto" }}>
                {orden.sede} · pedida el {fechaLab(orden.fechaSolicitud)}
              </span>
            </div>
            {orden.retiro && orden.devolucion && (
              <span style={texto}>
                Retiro {fechaLab(orden.retiro)} · Devolución {fechaLab(orden.devolucion)}
                {orden.asignaturaId != null && <span style={tenue}> · asignatura {orden.asignaturaId}</span>}
              </span>
            )}
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {resumenDeLineas(orden.lineas, stock.nombres).map((g) => (
                <li key={g.equipamientoId} style={texto}>
                  {g.cantidad} × {g.nombre}
                </li>
              ))}
            </ul>
            {orden.estado === "aprobada" && (
              <span style={tenue}>
                Unidades:{" "}
                {orden.lineas
                  .map((l) => (l.unidadId ? (stock.unidades.get(l.unidadId) ?? `#${l.unidadId}`) : "—"))
                  .join(", ")}
              </span>
            )}
            {orden.motivoResolucion && <span style={tenue}>Motivo: {orden.motivoResolucion}</span>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
              {orden.avalArchivoId && (
                <Button variant="ghost" onClick={() => void verAval(orden)}>
                  Ver aval (PDF)
                </Button>
              )}
              {orden.estado === "pendiente" && (
                <>
                  <Button variant="danger" onClick={() => setAccion({ tipo: "rechazar", orden })}>
                    Rechazar
                  </Button>
                  <Button onClick={() => setAccion({ tipo: "aprobar", orden })}>Revisar y aprobar</Button>
                </>
              )}
              {orden.estado === "aprobada" && !hayEntregas && (
                <Button variant="danger" onClick={() => setAccion({ tipo: "cancelar", orden })}>
                  Cancelar
                </Button>
              )}
            </div>
          </article>
        )
      })}

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
