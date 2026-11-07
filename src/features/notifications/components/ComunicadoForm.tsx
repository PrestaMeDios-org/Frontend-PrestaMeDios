import { useState } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, Field, SelectField, TextField, useInputStyle } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import type { RolUsuario } from "../../auth/types"
import { SEDES } from "../../auth/types"
import {
  CONTENIDO_MAX,
  construirAlta,
  construirEdicion,
  formDesdeComunicado,
  formVacio,
  mostrarSelectorAlcance,
  validarComunicado,
  type ComunicadoForm as FormValores,
  type ErroresComunicado,
  type OpcionAlcance,
} from "../services/alcance"
import { crearComunicado, editarComunicado } from "../services/notificationsApi"
import type { Comunicado } from "../types"

// Alta y edición de un comunicado (NOV-02). El alcance sólo lo elige el SUPERADMIN y sólo
// en el alta (RN-N2, RN-N5); para el ADMIN_LOCAL la sede la fija el backend.
export function ComunicadoForm({
  rol,
  sedePropia,
  comunicado,
  onCancelar,
  onGuardado,
}: {
  rol: RolUsuario
  sedePropia: string | null
  comunicado?: Comunicado
  onCancelar: () => void
  onGuardado: (mensaje: string) => void
}) {
  const C = useC()
  const modo = comunicado ? "edicion" : "alta"
  const [form, setForm] = useState<FormValores>(() => (comunicado ? formDesdeComunicado(comunicado) : formVacio()))
  const [errores, setErrores] = useState<ErroresComunicado>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const areaStyle = { ...useInputStyle(Boolean(errores.contenido)), minHeight: 140, resize: "vertical" as const }
  const fechaStyle = useInputStyle(Boolean(errores.vence_en))

  const poner = <K extends keyof FormValores>(k: K, v: FormValores[K]) => setForm((f) => ({ ...f, [k]: v }))

  const guardar = async () => {
    const locales = validarComunicado(form, rol, modo)
    setErrores(locales)
    setGeneral(null)
    if (Object.keys(locales).length) return
    setEnviando(true)
    try {
      if (comunicado) {
        const cambios = construirEdicion(form, comunicado)
        if (Object.keys(cambios).length) await editarComunicado(comunicado.id, cambios)
        onGuardado("Comunicado actualizado.")
      } else {
        await crearComunicado(construirAlta(form, rol))
        onGuardado("Comunicado publicado.")
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setErrores({ ...e.campos, ...(e.code === "VENCIMIENTO_INVALIDO" ? { vence_en: e.message } : {}) })
      }
      setGeneral(mensajeDeError(e, "No se pudo guardar el comunicado."))
    } finally {
      setEnviando(false)
    }
  }

  const opcionesAlcance: { value: OpcionAlcance; label: string }[] = [
    { value: "", label: "Elegí el alcance…" },
    { value: "GLOBAL", label: "Global (ambas sedes)" },
    ...SEDES.map((s) => ({ value: s, label: `Sólo ${s}` })),
  ]

  return (
    <Card title={comunicado ? "Editar comunicado" : "Nuevo comunicado"}>
      {general && <Alert>{general}</Alert>}
      <TextField label="Título" value={form.titulo} onChange={(v) => poner("titulo", v)} error={errores.titulo} />
      <Field
        label="Contenido"
        error={errores.contenido}
        hint={`Texto plano; se respetan los saltos de línea. Máximo ${CONTENIDO_MAX} caracteres.`}
      >
        {(descripcionId) => (
          <textarea
            aria-describedby={descripcionId}
            aria-invalid={Boolean(errores.contenido)}
            value={form.contenido}
            onChange={(e) => poner("contenido", e.target.value)}
            style={areaStyle}
          />
        )}
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {modo === "alta" && mostrarSelectorAlcance(rol) ? (
          <SelectField
            label="Alcance"
            value={form.alcance}
            onChange={(v) => poner("alcance", v)}
            options={opcionesAlcance}
            error={errores.alcance}
          />
        ) : (
          <TextField
            label="Alcance"
            value={comunicado ? comunicado.alcance : (sedePropia ?? "")}
            disabled
            hint={modo === "alta" ? "Se publica en tu sede." : "El alcance no se puede cambiar."}
          />
        )}
        <Field
          label="Vence (opcional)"
          error={errores.vence_en}
          hint="Hora del laboratorio. Vacío: queda visible hasta que se archive."
        >
          {(descripcionId) => (
            <input
              type="datetime-local"
              aria-describedby={descripcionId}
              aria-invalid={Boolean(errores.vence_en)}
              value={form.venceEn}
              onChange={(e) => poner("venceEn", e.target.value)}
              style={fechaStyle}
            />
          )}
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, color: C.textMuted }}>
        <Button variant="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : comunicado ? "Guardar cambios" : "Publicar"}
        </Button>
      </div>
    </Card>
  )
}
