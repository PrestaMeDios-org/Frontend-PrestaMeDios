import { useState, type FormEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { confirmarRecuperacion } from "../authApi"
import { errorPassword } from "../roles"
import { AuthLayout, LinkButton } from "./AuthLayout"

const ENLACE_INVALIDO = "El enlace no es válido o ya venció."

/**
 * Restablecer contraseña desde el enlace del correo (USR-02, SPEC-03 §5.5). Pública.
 * `token` ya se leyó del fragmento y se quitó de la barra de direcciones (RN-47).
 * Al terminar no inicia sesión: vuelve al login con un aviso (RN-52, D-09).
 */
export function ResetPasswordPage({
  token,
  onListo,
  onPedirOtro,
}: {
  token: string | null
  onListo: (aviso: string) => void
  onPedirOtro: () => void
}) {
  const [password, setPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [tocado, setTocado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [invalido, setInvalido] = useState(token === null)
  const [error, setError] = useState<string | null>(null)
  const [errorCampo, setErrorCampo] = useState<string | null>(null)

  const errorPwd = password || tocado ? errorPassword(password) : null
  const errorConf = confirmacion && confirmacion !== password ? "Las contraseñas no coinciden." : null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setTocado(true)
    setError(null)
    setErrorCampo(null)
    if (!token || errorPassword(password) || confirmacion !== password) return
    setEnviando(true)
    try {
      const { detail } = await confirmarRecuperacion(token, password)
      onListo(detail)
    } catch (err) {
      if (err instanceof ApiError && err.code === "TOKEN_RECUPERACION_INVALIDO") setInvalido(true)
      else if (err instanceof ApiError && err.campos.password_nueva) setErrorCampo(err.campos.password_nueva)
      else setError(mensajeDeError(err, "No se pudo restablecer la contraseña."))
    } finally {
      setEnviando(false)
    }
  }

  if (invalido) {
    return (
      <AuthLayout title="Restablecer contraseña">
        <Alert>{ENLACE_INVALIDO} Pedí uno nuevo; los enlaces sirven una sola vez.</Alert>
        <Button onClick={onPedirOtro}>Pedir un enlace nuevo</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Elegí una contraseña nueva para tu cuenta.">
      {error && <Alert>{error}</Alert>}
      <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <TextField
          label="Contraseña nueva"
          type="password"
          value={password}
          onChange={setPassword}
          error={errorPwd ?? errorCampo}
          hint="Al menos 8 caracteres, con una letra y un número."
          autoComplete="new-password"
        />
        <TextField
          label="Repetir contraseña"
          type="password"
          value={confirmacion}
          onChange={setConfirmacion}
          error={errorConf}
          autoComplete="new-password"
        />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, textAlign: "center", opacity: 0.75 }}>
        Al guardarla se cierran todas tus sesiones abiertas.{" "}
        <LinkButton onClick={onPedirOtro}>Pedir otro enlace</LinkButton>
      </div>
    </AuthLayout>
  )
}
