import { useRef, useState } from "react"
import { Avatar } from "../../../components/ui/Avatar"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, Grid, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useAuth, useUsuario } from "../../auth/AuthContext"
import { actualizarMe, cerrarTodasLasSesiones } from "../../auth/authApi"
import { ChangePasswordForm } from "../../auth/pages/ChangePasswordForm"
import { ESTADO_LABEL, iniciales, ROL_LABEL } from "../../auth/roles"
import { FOTO_ACCEPT, FOTO_MAX_MB, validarFoto } from "../services/foto"
import { quitarFoto, subirFoto } from "../services/usersApi"

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
      <FotoDePerfil />

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

      <CerrarSesiones />
    </div>
  )
}

/** "Cerrar todas mis sesiones" (SPEC-03 RN-69, D-14): esta pestaña sigue con un token nuevo. */
function CerrarSesiones() {
  const { aplicarToken } = useAuth()
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cerrar = async () => {
    if (!window.confirm("Se van a cerrar tus sesiones en todas las computadoras. Esta pestaña sigue abierta. ¿Continuar?")) return
    setOcupado(true)
    setMensaje(null)
    try {
      aplicarToken(await cerrarTodasLasSesiones())
      setMensaje({ tipo: "ok", texto: "Cerraste las sesiones abiertas en otras computadoras." })
    } catch (err) {
      setMensaje({ tipo: "error", texto: mensajeDeError(err, "No se pudieron cerrar las sesiones.") })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Card title="Sesiones">
      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.75 }}>
        Si dejaste la sesión abierta en una computadora compartida, podés cerrarla desde acá.
      </span>
      <div>
        <Button variant="danger" onClick={cerrar} disabled={ocupado}>
          {ocupado ? "Cerrando…" : "Cerrar todas mis sesiones"}
        </Button>
      </div>
    </Card>
  )
}

/** Foto de perfil (USR-03, SPEC-03 §6.6): subir, reemplazar y quitar. */
function FotoDePerfil() {
  const usuario = useUsuario()
  const { setUsuario } = useAuth()
  const input = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const ejecutar = async (accion: () => Promise<typeof usuario>, ok: string) => {
    setOcupado(true)
    setMensaje(null)
    try {
      setUsuario(await accion())
      setMensaje({ tipo: "ok", texto: ok })
    } catch (err) {
      setMensaje({ tipo: "error", texto: mensajeDeError(err, "No se pudo actualizar la foto.") })
    } finally {
      setOcupado(false)
    }
  }

  const elegir = (archivo: File | undefined) => {
    if (input.current) input.current.value = ""
    if (!archivo) return
    const error = validarFoto(archivo)
    if (error) return setMensaje({ tipo: "error", texto: error })
    void ejecutar(() => subirFoto(archivo), "Foto actualizada.")
  }

  return (
    <Card title="Foto de perfil">
      {mensaje && <Alert tipo={mensaje.tipo}>{mensaje.texto}</Alert>}
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <Avatar fotoId={usuario.foto_id} initials={iniciales(usuario.nombre, usuario.apellido)} size={88} radius={44} />
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => input.current?.click()} disabled={ocupado}>
              {ocupado ? "Guardando…" : usuario.foto_id ? "Cambiar foto" : "Subir foto"}
            </Button>
            {usuario.foto_id && (
              <Button variant="ghost" onClick={() => ejecutar(quitarFoto, "Foto quitada.")} disabled={ocupado}>
                Quitar foto
              </Button>
            )}
          </div>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.6 }}>
            JPEG, PNG o WebP de hasta {FOTO_MAX_MB} MB. Se guarda recortada a 512 px y sin datos de ubicación.
          </span>
        </div>
        <input
          ref={input}
          type="file"
          accept={FOTO_ACCEPT}
          hidden
          onChange={(e) => elegir(e.target.files?.[0])}
        />
      </div>
    </Card>
  )
}
