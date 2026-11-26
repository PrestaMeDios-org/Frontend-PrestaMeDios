import { useCallback, useEffect, useRef, useState } from "react"
import { useC } from "../../../theme"
import { mensajeDeError } from "../../../lib/api"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"
import { Modal } from "../../../components/ui/Modal"
import { listarHistorialUnidad } from "../services/inventoryApi"
import { aMovimiento, hayMas, POR_PAGINA } from "../services/historial"
import type { EstadoLineaPrestamo, MovimientoUnidad, Unidad } from "../types"

// Historial de usuarios de una unidad (PRE-12, SPEC-04 §5.5 y §8.3): quién la pidió, cuándo
// y en qué terminó cada línea, de la más reciente a la más antigua, con "Cargar más".
export function HistorialUnidadModal({
  unidad,
  nombreEquipo,
  onClose,
}: {
  unidad: Unidad
  nombreEquipo: string
  onClose: () => void
}) {
  const C = useC()
  const [filas, setFilas] = useState<MovimientoUnidad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quedanMas, setQuedanMas] = useState(false)
  const control = useRef<AbortController | null>(null)

  const cargar = useCallback(
    async (offset: number) => {
      control.current?.abort()
      const ctrl = new AbortController()
      control.current = ctrl
      setCargando(true)
      setError(null)
      try {
        const pagina = await listarHistorialUnidad(unidad.id, { limit: POR_PAGINA, offset }, ctrl.signal)
        if (ctrl.signal.aborted) return
        const nuevas = pagina.map(aMovimiento)
        setFilas((previas) => (offset === 0 ? nuevas : [...previas, ...nuevas]))
        setQuedanMas(hayMas(pagina.length))
      } catch (e) {
        if (ctrl.signal.aborted) return
        setError(mensajeDeError(e, "No se pudo cargar el historial de la unidad."))
      } finally {
        if (!ctrl.signal.aborted) setCargando(false)
      }
    },
    [unidad.id],
  )

  useEffect(() => {
    void cargar(0)
    return () => control.current?.abort()
  }, [cargar])

  const colorEstado: Record<EstadoLineaPrestamo, [string, string]> = {
    pendiente: [C.pending, C.pendingBg],
    reservado: [C.mine, C.mineBg],
    entregado: [C.maintenance, C.maintenanceBg],
    devuelto: [C.available, C.availableBg],
    cancelado: [C.textMuted, C.bg],
    rechazado: [C.occupied, C.occupiedBg],
    no_retirado: [C.occupied, C.occupiedBg],
  }

  const etiqueta = { fontSize: 11, color: C.textFaint, textTransform: "uppercase" as const, letterSpacing: "0.06em" }
  const dato = (titulo: string, valor: string) => (
    <div style={{ minWidth: 0 }}>
      <div style={etiqueta}>{titulo}</div>
      <div style={{ fontSize: 12.5, color: C.text }}>{valor}</div>
    </div>
  )

  return (
    <Modal
      titulo={`Historial de ${unidad.codigoInventario}`}
      subtitulo={`${nombreEquipo} · N.º de serie ${unidad.serie}`}
      conCerrar
      ancho={720}
      onClose={onClose}
      pie={
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "'Inter',sans-serif" }}>
        {error && <Alert>{error}</Alert>}

        {!cargando && !error && filas.length === 0 && (
          <div
            style={{
              padding: 18,
              border: `1.5px dashed ${C.border}`,
              borderRadius: 12,
              fontSize: 13,
              color: C.textMuted,
              textAlign: "center",
            }}
          >
            Esta unidad todavía no se prestó.
          </div>
        )}

        {filas.length > 0 && (
          <ul aria-label={`Historial de ${unidad.codigoInventario}`} style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {filas.map((f, i) => {
              const [color, bg] = colorEstado[f.estado] ?? [C.textMuted, C.bg]
              return (
                <li
                  key={f.id}
                  style={{
                    padding: "12px 0",
                    borderTop: i ? `1px solid ${C.borderLight}` : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{f.solicitante}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted }}>Orden #{f.ordenId}</div>
                    </div>
                    <Badge label={f.estadoTexto} color={color} bg={bg} />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {dato("Retiro pactado", f.retiro)}
                    {dato("Devolución pactada", f.devolucion)}
                    {dato("Entregado", f.entregado)}
                    {dato("Devuelto", f.devuelto)}
                  </div>
                  {dato("Observación de la devolución", f.observacion)}
                </li>
              )
            })}
          </ul>
        )}

        {cargando && (
          <div role="status" style={{ fontSize: 12.5, color: C.textMuted }}>
            Cargando historial…
          </div>
        )}

        {!cargando && quedanMas && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button variant="ghost" onClick={() => void cargar(filas.length)}>
              Cargar más
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
