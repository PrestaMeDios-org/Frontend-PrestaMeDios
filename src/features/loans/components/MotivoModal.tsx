import { useState } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Field, useInputStyle } from "../../../components/ui/Form"
import { Modal } from "../../inventory/components/Modal"

interface Props {
  titulo: string
  descripcion: string
  accion: string
  onClose: () => void
  /** Ejecuta la acción; si falla, devuelve el mensaje a mostrar. */
  onConfirmar: (motivo: string) => Promise<string | null>
}

/** Pide un motivo obligatorio: rechazar una orden o cancelar una aprobada (RN-L15, RN-L16). */
export function MotivoModal({ titulo, descripcion, accion, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const estilo = useInputStyle(Boolean(error) && !motivo.trim())

  const confirmar = async () => {
    if (!motivo.trim()) {
      setError("Indicá el motivo: el solicitante lo va a ver.")
      return
    }
    setEnviando(true)
    setError(await onConfirmar(motivo.trim()))
    setEnviando(false)
  }

  return (
    <Modal titulo={titulo} onClose={onClose} ancho={520}>
      <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{descripcion}</p>
      <Field label="Motivo">
        <textarea
          value={motivo}
          maxLength={500}
          rows={3}
          onChange={(e) => {
            setMotivo(e.target.value)
            setError(null)
          }}
          style={{ ...estilo, resize: "vertical" }}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onClose} disabled={enviando}>
          Volver
        </Button>
        <Button variant="danger" onClick={() => void confirmar()} disabled={enviando}>
          {enviando ? "Guardando…" : accion}
        </Button>
      </div>
    </Modal>
  )
}
