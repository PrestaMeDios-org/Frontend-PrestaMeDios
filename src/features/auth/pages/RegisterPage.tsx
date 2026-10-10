import { useState, type FormEvent } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Grid, SelectField, TextField } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { registrar } from "../authApi"
import { errorPassword } from "../roles"
import { SEDES, type RegistroDTO, type Sede } from "../types"
import { AuthLayout, LinkButton } from "./AuthLayout"

type Campos = Omit<RegistroDTO, "telefono"> & { telefono: string; confirmacion: string }

const INICIAL: Campos = {
  email: "",
  password: "",
  confirmacion: "",
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  rol: "ESTUDIANTE",
  sede: "Ushuaia",
}

/** Validación en línea (espejo de las reglas del backend, SPEC-01 §6.5). */
export function validarRegistro(c: Campos): Partial<Record<keyof Campos, string>> {
  const errores: Partial<Record<keyof Campos, string>> = {}
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) errores.email = "Ingresá un email válido."
  const pwd = errorPassword(c.password, c.email)
  if (pwd) errores.password = pwd
  if (c.confirmacion !== c.password) errores.confirmacion = "Las contraseñas no coinciden."
  if (!c.nombre.trim()) errores.nombre = "Obligatorio."
  if (!c.apellido.trim()) errores.apellido = "Obligatorio."
  if (!/^\d{7,8}$/.test(c.dni.trim())) errores.dni = "7 u 8 dígitos, sin puntos."
  if (c.telefono.trim() && !/^\+?[0-9 -]{6,20}$/.test(c.telefono.trim()))
    errores.telefono = "Sólo números, espacios, guiones y + inicial."
  return errores
}

export function RegisterPage({ onVolver }: { onVolver: () => void }) {
  const [c, setC] = useState<Campos>(INICIAL)
  const [tocado, setTocado] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [camposServidor, setCamposServidor] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)

  const errores = tocado ? validarRegistro(c) : {}
  const set = <K extends keyof Campos>(k: K) => (v: Campos[K]) => setC((prev) => ({ ...prev, [k]: v }))
  const error = (k: keyof Campos) => errores[k] ?? camposServidor[k] ?? null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setTocado(true)
    setErrorServidor(null)
    setCamposServidor({})
    if (Object.keys(validarRegistro(c)).length) return
    setEnviando(true)
    try {
      const { confirmacion: _confirmacion, telefono, ...resto } = c
      await registrar({ ...resto, telefono: telefono.trim() || null })
      setListo(true)
    } catch (err) {
      if (err instanceof ApiError) setCamposServidor(err.campos)
      setErrorServidor(mensajeDeError(err, "No se pudo completar el registro."))
    } finally {
      setEnviando(false)
    }
  }

  if (listo) {
    return (
      <AuthLayout title="Solicitud enviada" subtitle="Tu cuenta quedó pendiente de aprobación.">
        <Alert tipo="ok">
          La administración del Laboratorio de la sede <strong>{c.sede}</strong> validará tus datos. Vas a
          poder iniciar sesión cuando tu cuenta sea aprobada.
        </Alert>
        <Button onClick={onVolver}>Volver al inicio de sesión</Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Completá tus datos. Un administrador aprobará tu solicitud.">
      {errorServidor && <Alert>{errorServidor}</Alert>}
      <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
        <Grid min={170}>
          <TextField label="Nombre" value={c.nombre} onChange={set("nombre")} error={error("nombre")} />
          <TextField label="Apellido" value={c.apellido} onChange={set("apellido")} error={error("apellido")} />
          <TextField label="DNI" value={c.dni} onChange={set("dni")} error={error("dni")} />
          <TextField
            label="Teléfono (opcional)"
            value={c.telefono}
            onChange={set("telefono")}
            error={error("telefono")}
          />
          <SelectField
            label="Soy"
            value={c.rol}
            onChange={set("rol")}
            options={[
              { value: "ESTUDIANTE", label: "Estudiante" },
              { value: "DOCENTE", label: "Docente" },
            ]}
          />
          <SelectField<Sede>
            label="Sede"
            value={c.sede}
            onChange={set("sede")}
            options={SEDES.map((s) => ({ value: s, label: s }))}
          />
        </Grid>
        <TextField
          label="Email"
          type="email"
          value={c.email}
          onChange={set("email")}
          error={error("email")}
          autoComplete="email"
        />
        <Grid min={170}>
          <TextField
            label="Contraseña"
            type="password"
            value={c.password}
            onChange={set("password")}
            error={error("password")}
            hint="Mínimo 8 caracteres, con letras y números."
            autoComplete="new-password"
          />
          <TextField
            label="Repetir contraseña"
            type="password"
            value={c.confirmacion}
            onChange={set("confirmacion")}
            error={error("confirmacion")}
            autoComplete="new-password"
          />
        </Grid>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </form>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, textAlign: "center" }}>
        ¿Ya tenés cuenta? <LinkButton onClick={onVolver}>Iniciá sesión</LinkButton>
      </div>
    </AuthLayout>
  )
}
