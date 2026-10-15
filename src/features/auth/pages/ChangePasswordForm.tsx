import { useState, type FormEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useAuth } from "../AuthContext"
import { cambiarPassword } from "../authApi"
import { errorPassword } from "../roles"
import { AuthLayout } from "./AuthLayout"

/** Formulario de cambio de contraseña (USR-03, SPEC-02 UC-11). */
export function ChangePasswordForm({ onListo }: { onListo?: () => void }) {
  const { aplicarToken } = useAuth()
  const [actual, setActual] = useState("")
  const [nueva, setNueva] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [tocado, setTocado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const errNueva = tocado
    ? (errorPassword(nueva) ?? (nueva && nueva === actual ? "Debe ser distinta de la actual." : null))
    : null
  const errConfirmacion = tocado && confirmacion !== nueva ? "Las contraseñas no coinciden." : null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setTocado(true)
    setError(null)
    setOk(false)
    if (!actual || errorPassword(nueva) || nueva === actual || confirmacion !== nueva) return
    setEnviando(true)
    try {
      aplicarToken(await cambiarPassword({ password_actual: actual, password_nueva: nueva }))
      setActual("")
      setNueva("")
      setConfirmacion("")
      setTocado(false)
      setOk(true)
      onListo?.()
    } catch (err) {
      const campos = err instanceof ApiError ? Object.values(err.campos) : []
      setError(campos[0] ?? mensajeDeError(err, "No se pudo cambiar la contraseña."))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      {error && <Alert>{error}</Alert>}
      {ok && <Alert tipo="ok">Contraseña actualizada. Se cerraron tus otras sesiones.</Alert>}
      <TextField
        label="Contraseña actual"
        type="password"
        value={actual}
        onChange={setActual}
        error={tocado && !actual ? "Obligatoria." : null}
        autoComplete="current-password"
      />
      <TextField
        label="Contraseña nueva"
        type="password"
        value={nueva}
        onChange={setNueva}
        error={errNueva}
        hint="Mínimo 8 caracteres, con letras y números."
        autoComplete="new-password"
      />
      <TextField
        label="Repetir contraseña nueva"
        type="password"
        value={confirmacion}
        onChange={setConfirmacion}
        error={errConfirmacion}
        autoComplete="new-password"
      />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  )
}

/** Pantalla bloqueante para cuentas con cambio obligatorio (SPEC-02 A9, AC-58). */
export function ChangePasswordPage() {
  const { logout } = useAuth()
  return (
    <AuthLayout
      title="Cambiá tu contraseña"
      subtitle="Tu cuenta fue creada o restablecida por la administración. Elegí una contraseña propia para continuar."
    >
      <ChangePasswordForm />
      <Button variant="ghost" onClick={() => logout()}>
        Cerrar sesión
      </Button>
    </AuthLayout>
  )
}
