import { useState, type FormEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { solicitarRecuperacion } from "../authApi"
import { AuthLayout, LinkButton } from "./AuthLayout"

const MENSAJE_LIMITE = "Hiciste demasiados pedidos. Probá de nuevo en una hora."

/**
 * "¿Olvidaste tu contraseña?" (USR-02, SPEC-03 §5.5). Pública.
 * Siempre muestra el mensaje neutro del backend: no revela si la cuenta existe (RN-44).
 */
export function RecoverPasswordPage({ onVolver }: { onVolver: () => void }) {
  const [email, setEmail] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return setError("Ingresá tu email.")
    setEnviando(true)
    try {
      const { detail } = await solicitarRecuperacion(email.trim())
      setEnviado(detail)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError(MENSAJE_LIMITE)
      else if (err instanceof ApiError && err.campos.email) setError("Revisá el formato del email.")
      else setError(mensajeDeError(err, "No se pudo enviar el pedido."))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te mandamos un enlace para elegir una contraseña nueva."
    >
      {enviado ? (
        <>
          <Alert tipo="ok">{enviado}</Alert>
          <Button onClick={onVolver}>Volver al inicio de sesión</Button>
        </>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
            <TextField label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, textAlign: "center" }}>
            <LinkButton onClick={onVolver}>Volver al inicio de sesión</LinkButton>
          </div>
        </>
      )}
    </AuthLayout>
  )
}
