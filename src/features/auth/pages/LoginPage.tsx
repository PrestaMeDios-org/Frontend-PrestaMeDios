import { useState, type FormEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useAuth } from "../AuthContext"
import { AuthLayout, LinkButton } from "./AuthLayout"

// Títulos por código de error del login (SPEC-01 §6.6, AC-51). El detalle lo da el backend.
const TITULO_POR_CODIGO: Record<string, string> = {
  CUENTA_PENDIENTE_APROBACION: "Cuenta pendiente de aprobación",
  CUENTA_RECHAZADA: "Solicitud rechazada",
  CUENTA_SUSPENDIDA: "Cuenta suspendida",
  CUENTA_INACTIVA: "Cuenta dada de baja",
  CREDENCIALES_INVALIDAS: "No pudimos iniciar sesión",
}

export function LoginPage({ onRegistrarse }: { onRegistrarse: () => void }) {
  const { login, aviso } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<{ titulo?: string; detalle: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password) {
      setError({ detalle: "Ingresá tu email y tu contraseña." })
      return
    }
    setEnviando(true)
    try {
      await login(email, password)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      setError({
        titulo: code ? TITULO_POR_CODIGO[code] : undefined,
        detalle: mensajeDeError(err, "No se pudo iniciar sesión."),
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresá con el email con el que te registraste.">
      {aviso && <Alert tipo="info">{aviso}</Alert>}
      {error && (
        <Alert>
          {error.titulo && <strong style={{ display: "block", marginBottom: 2 }}>{error.titulo}</strong>}
          {error.detalle}
        </Alert>
      )}
      <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <TextField label="Email" type="email" value={email} onChange={setEmail} autoComplete="username" />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, textAlign: "center" }}>
        ¿No tenés cuenta? <LinkButton onClick={onRegistrarse}>Registrate</LinkButton>
      </div>
    </AuthLayout>
  )
}
