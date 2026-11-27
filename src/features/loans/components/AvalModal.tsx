import { useEffect, useState } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"
import { Modal } from "../../../components/ui/Modal"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { descargarAval } from "../services/loansApi"
import type { Orden } from "../types"

// SPEC-10: vista previa del aval de alta gama (PRE-05) dentro de la app, antes de descargarlo.
// El PDF se pide con la sesión (`descargarAval`) y se muestra desde un `blob:` local; el enlace
// se libera al cerrar.
export function AvalModal({ orden, onClose }: { orden: Orden; onClose: () => void }) {
  const C = useC()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    let creada: string | null = null
    descargarAval(orden.id)
      .then((blob) => {
        if (!vigente) return
        creada = URL.createObjectURL(blob)
        setUrl(creada)
      })
      .catch((e) => vigente && setError(mensajeDeError(e, "No se pudo cargar el aval.")))
    return () => {
      vigente = false
      if (creada) URL.revokeObjectURL(creada)
    }
  }, [orden.id])

  const nombreArchivo = `aval-solicitud-${orden.id}.pdf`
  const enlace = {
    display: "inline-flex",
    alignItems: "center",
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
  } as const

  return (
    <Modal
      titulo={`Aval de la solicitud #${orden.id}`}
      subtitulo={orden.solicitante?.nombreCompleto}
      conCerrar
      ancho={820}
      onClose={onClose}
      pie={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          {url && (
            <>
              <a href={url} target="_blank" rel="noreferrer" style={{ ...enlace, border: `1.5px solid ${C.border}`, color: C.textMuted, background: C.card }}>
                Abrir en otra pestaña
              </a>
              <a href={url} download={nombreArchivo} style={{ ...enlace, background: C.crimson, color: "white" }}>
                Descargar
              </a>
            </>
          )}
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      {!error && !url && (
        <div role="status" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted, padding: "24px 0" }}>
          Cargando el aval…
        </div>
      )}
      {url && (
        <iframe
          title={`Aval de la solicitud #${orden.id}`}
          src={url}
          style={{ width: "100%", height: "min(70vh, 720px)", border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg }}
        />
      )}
    </Modal>
  )
}
