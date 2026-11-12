import { useCallback, useEffect, useState } from "react"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { listarEquipamiento } from "../../inventory/services/inventoryApi"
import { cancelarOrden, listarMisOrdenes } from "../services/loansApi"
import { ESTADO_ORDEN_LABEL, fechaLab, resumenDeLineas } from "../services/formato"
import type { EstadoOrden, Orden } from "../types"

/**
 * "Mis solicitudes" (SPEC-05 F1.5, USR-06): las órdenes propias, de la más nueva a la más
 * vieja, con su estado. Una orden pendiente se puede cancelar (CU-L03, F2.4).
 */
export function MisSolicitudesPage() {
  const C = useC()
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null)
  const [nombres, setNombres] = useState<Map<number, string>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)

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

  const cancelar = async (orden: Orden) => {
    if (!window.confirm(`¿Cancelar la solicitud #${orden.id}?`)) return
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

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 12, alignContent: "start" }}>
      {aviso && <Alert tipo="ok">{aviso}</Alert>}
      {error && <Alert>{error}</Alert>}
      {ordenes === null && !error && <p style={tenue}>Cargando tus solicitudes…</p>}
      {ordenes?.length === 0 && (
        <p style={tenue}>Todavía no hiciste solicitudes. Agregá equipos desde el catálogo para pedir un préstamo.</p>
      )}
      {ordenes?.map((orden) => (
        <article
          key={orden.id}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ ...texto, fontWeight: 700, fontFamily: "'Outfit',sans-serif", fontSize: 15 }}>
              Solicitud #{orden.id}
            </span>
            <Badge label={ESTADO_ORDEN_LABEL[orden.estado]} {...colores[orden.estado]} />
            {orden.demorado && <Badge label="Demorado" color={C.occupied} bg={C.occupiedBg} />}
            <span style={{ ...tenue, marginLeft: "auto" }}>Pedida el {fechaLab(orden.fechaSolicitud)}</span>
          </div>
          {orden.retiro && orden.devolucion && (
            <span style={texto}>
              Retiro {fechaLab(orden.retiro)} · Devolución {fechaLab(orden.devolucion)}
            </span>
          )}
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {resumenDeLineas(orden.lineas, nombres).map((g) => (
              <li key={g.equipamientoId} style={texto}>
                {g.cantidad} × {g.nombre}
              </li>
            ))}
          </ul>
          {orden.motivoResolucion && <span style={tenue}>Motivo: {orden.motivoResolucion}</span>}
          {orden.estado === "pendiente" && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => void cancelar(orden)} disabled={cancelando === orden.id}>
                {cancelando === orden.id ? "Cancelando…" : "Cancelar solicitud"}
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
