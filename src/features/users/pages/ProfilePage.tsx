import { useState } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, Grid, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useAuth, useUsuario } from "../../auth/AuthContext"
import { actualizarMe } from "../../auth/authApi"
import { ChangePasswordForm } from "../../auth/pages/ChangePasswordForm"
import { ESTADO_LABEL, ROL_LABEL } from "../../auth/roles"

/** Mi perfil (USR-03, SPEC-02 UC-10/UC-11): datos protegidos en sólo lectura. */
export function ProfilePage() {
  const usuario = useUsuario()
  const { setUsuario } = useAuth()

  const [telefono, setTelefono] = useState(usuario.telefono ?? "")
  const [email, setEmail] = useState(usuario.email)
  const [passwordActual, setPasswordActual] = useState("")
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  const cambiaEmail = email.trim().toLowerCase() !== usuario.email
  const cambiaTelefono = telefono.trim() !== (usuario.telefono ?? "")

  const guardar = async () => {
    setMensaje(null)
    setCampos({})
    if (!cambiaEmail && !cambiaTelefono) return
    setGuardando(true)
    try {
      const actualizado = await actualizarMe({
        ...(cambiaTelefono ? { telefono: telefono.trim() || null } : {}),
        ...(cambiaEmail ? { email: email.trim(), password_actual: passwordActual } : {}),
      })
      setUsuario(actualizado)
      setPasswordActual("")
      setMensaje({ tipo: "ok", texto: "Datos actualizados." })
    } catch (err) {
      if (err instanceof ApiError) setCampos(err.campos)
      setMensaje({ tipo: "error", texto: mensajeDeError(err, "No se pudieron guardar los cambios.") })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 18, maxWidth: 900 }}>
      <Card title="Datos de la cuenta">
        <Grid>
          <TextField label="Nombre" value={usuario.nombre} disabled />
          <TextField label="Apellido" value={usuario.apellido} disabled />
          <TextField label="DNI" value={usuario.dni} disabled />
          <TextField label="Rol" value={ROL_LABEL[usuario.rol]} disabled />
          <TextField label="Sede" value={usuario.sede ?? "Ambas sedes"} disabled />
          <TextField label="Estado" value={ESTADO_LABEL[usuario.estado]} disabled />
        </Grid>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: "inherit", opacity: 0.6 }}>
          Para corregir estos datos, contactá a la administración del Laboratorio.
        </span>
      </Card>

      <Card title="Datos de contacto">
        {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}
        <Grid>
          <TextField
            label="Teléfono"
            value={telefono}
            onChange={setTelefono}
            error={campos.telefono}
            placeholder="+54 2901 555123"
          />
          <TextField label="Email" type="email" value={email} onChange={setEmail} error={campos.email} />
          {cambiaEmail && (
            <TextField
              label="Contraseña actual"
              type="password"
              value={passwordActual}
              onChange={setPasswordActual}
              hint="Necesaria para cambiar el email."
              autoComplete="current-password"
            />
          )}
        </Grid>
        <div>
          <Button onClick={guardar} disabled={guardando || (!cambiaEmail && !cambiaTelefono)}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </Card>

      <Card title="Cambiar contraseña">
        <div style={{ maxWidth: 420 }}>
          <ChangePasswordForm />
        </div>
      </Card>
    </div>
  )
}
