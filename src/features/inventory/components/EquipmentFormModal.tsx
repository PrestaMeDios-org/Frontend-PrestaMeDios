import { useState, type CSSProperties, type ReactNode } from "react"
import { useC } from "../../../theme"
import { Alert, Field, SelectField, TextField, useInputStyle } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"
import { ApiError, mensajeDeError } from "../../../lib/api"
import type { RolUsuario } from "../../auth/types"
import {
  construirAlta,
  construirEdicion,
  equipoVacio,
  formDesdeEquipo,
  reglaSedeAlta,
  unidadVacia,
  validarEquipo,
  type EquipoForm,
  type ErroresForm,
  type UnidadForm,
} from "../services/altas"
import { crearEquipamiento, editarEquipamiento } from "../services/inventoryApi"
import { SEDES, type Category, type Equipment } from "../types"
import { Modal } from "./Modal"

function Casilla({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  const C = useC()
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, cursor: "pointer" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>
          {label}
        </span>
      </span>
      {hint && (
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint, marginLeft: 24 }}>
          {hint}
        </span>
      )}
    </label>
  )
}

function FilaDos({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
}

// Alta (PRE-19) y edición (PRE-12) de un ítem del catálogo. En el alta, la sede de cada unidad
// la fija el backend para ADMIN_LOCAL (el selector no se muestra) y la elige el SUPERADMIN.
export function EquipmentFormModal({
  modo,
  equipo,
  categorias,
  rol,
  onClose,
  onGuardado,
}: {
  modo: "alta" | "edicion"
  equipo?: Equipment
  categorias: Category[]
  rol: RolUsuario
  onClose: () => void
  onGuardado: () => void
}) {
  const C = useC()
  const areaStyle: CSSProperties = { ...useInputStyle(false), minHeight: 70, resize: "vertical" }
  const [form, setForm] = useState<EquipoForm>(() =>
    equipo && modo === "edicion" ? formDesdeEquipo(equipo) : equipoVacio(),
  )
  const [errores, setErrores] = useState<ErroresForm>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const pedirSede = reglaSedeAlta(rol) === "obligatoria"

  const poner = <K extends keyof EquipoForm>(k: K, v: EquipoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))
  const ponerUnidad = (i: number, cambios: Partial<UnidadForm>) =>
    setForm((f) => ({
      ...f,
      unidades: f.unidades.map((u, j) => (j === i ? { ...u, ...cambios } : u)),
    }))

  const guardar = async () => {
    const locales = validarEquipo(form, rol, modo)
    setErrores(locales)
    setGeneral(null)
    if (Object.keys(locales).length) return
    setEnviando(true)
    try {
      if (modo === "alta") await crearEquipamiento(construirAlta(form, rol))
      else if (equipo) await editarEquipamiento(equipo.id, construirEdicion(form))
      onGuardado()
    } catch (e) {
      if (e instanceof ApiError) setErrores(e.campos)
      setGeneral(mensajeDeError(e, "No se pudo guardar el equipo."))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={modo === "alta" ? "Nuevo equipo" : `Editar ${equipo?.name ?? "equipo"}`} onClose={onClose} ancho={640}>
      <FilaDos>
        <TextField
          label="Código"
          value={form.codigo}
          onChange={(v) => poner("codigo", v)}
          error={errores.codigo}
          disabled={modo === "edicion"}
          hint={modo === "edicion" ? "El código no se puede modificar." : undefined}
        />
        <TextField label="Nombre" value={form.nombre} onChange={(v) => poner("nombre", v)} error={errores.nombre} />
        <TextField label="Marca" value={form.marca} onChange={(v) => poner("marca", v)} error={errores.marca} />
        <TextField label="Modelo" value={form.modelo} onChange={(v) => poner("modelo", v)} error={errores.modelo} />
        <SelectField
          label="Categoría"
          value={form.categoriaId}
          onChange={(v) => poner("categoriaId", v)}
          error={errores.categoria_id}
          options={[
            { value: "", label: categorias.length ? "Elegí una categoría…" : "No hay categorías" },
            ...categorias.map((c) => ({ value: c.id, label: c.label })),
          ]}
        />
        <TextField
          label="Plazo máximo (días)"
          value={form.maxDias}
          onChange={(v) => poner("maxDias", v)}
          error={errores.max_dias_prestamo}
          hint="Vacío: se toma el valor de los parámetros globales."
        />
      </FilaDos>

      <Field label="Descripción técnica" error={errores.descripcion}>
        <textarea
          value={form.descripcion}
          onChange={(e) => poner("descripcion", e.target.value)}
          style={areaStyle}
        />
      </Field>
      <Field label="Reglas de cuidado" hint="Una por línea.">
        <textarea value={form.reglas} onChange={(e) => poner("reglas", e.target.value)} style={areaStyle} />
      </Field>
      <FilaDos>
        <TextField
          label="URL de la imagen"
          value={form.imagenUrl}
          onChange={(v) => poner("imagenUrl", v)}
          error={errores.imagen_url}
        />
        <TextField
          label="URL del video instructivo"
          value={form.videoUrl}
          onChange={(v) => poner("videoUrl", v)}
          error={errores.video_url}
        />
      </FilaDos>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Casilla
          label="Equipo especial (alta gama)"
          checked={form.altaGama}
          onChange={(v) => poner("altaGama", v)}
          hint="Requiere aval en la solicitud."
        />
        <Casilla
          label="Es notebook"
          checked={form.esNotebook}
          onChange={(v) => poner("esNotebook", v)}
          hint="Usa el plazo de notebooks por defecto."
        />
      </div>

      {modo === "alta" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13.5, fontWeight: 700, color: C.text }}>
              Unidades físicas
            </span>
            <Button variant="ghost" onClick={() => poner("unidades", [...form.unidades, unidadVacia()])}>
              + Agregar unidad
            </Button>
          </div>
          {!pedirSede && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }}>
              Las unidades se registran en tu sede automáticamente.
            </span>
          )}
          {form.unidades.map((u, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: pedirSede ? "1.2fr 1.2fr 0.6fr 1fr auto" : "1.2fr 1.2fr 0.6fr auto",
                gap: 10,
                alignItems: "start",
              }}
            >
              <TextField
                label="N.º de serie"
                value={u.serie}
                onChange={(v) => ponerUnidad(i, { serie: v })}
                error={errores[`unidades.${i}.numero_serie`]}
              />
              <TextField
                label="Cód. inventario"
                value={u.codigoInventario}
                onChange={(v) => ponerUnidad(i, { codigoInventario: v })}
                error={errores[`unidades.${i}.codigo_inventario`]}
              />
              <TextField
                label="Locker"
                value={u.locker}
                onChange={(v) => ponerUnidad(i, { locker: v })}
                error={errores[`unidades.${i}.locker`]}
              />
              {pedirSede && (
                <SelectField
                  label="Sede"
                  value={u.sede}
                  onChange={(v) => ponerUnidad(i, { sede: v })}
                  error={errores[`unidades.${i}.sede`]}
                  options={[{ value: "", label: "Elegí…" }, ...SEDES.map((s) => ({ value: s, label: s }))]}
                />
              )}
              <div style={{ paddingTop: 22 }}>
                <Button
                  variant="ghost"
                  title="Quitar unidad"
                  onClick={() => poner("unidades", form.unidades.filter((_, j) => j !== i))}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {general && <Alert>{general}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" onClick={onClose} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : modo === "alta" ? "Crear equipo" : "Guardar cambios"}
        </Button>
      </div>
    </Modal>
  )
}
