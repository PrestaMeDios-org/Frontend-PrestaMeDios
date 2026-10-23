import { useState } from "react"
import { Alert, SelectField, TextField } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"
import { ApiError, mensajeDeError } from "../../../lib/api"
import type { RolUsuario } from "../../auth/types"
import {
  construirUnidad,
  reglaSedeAlta,
  unidadVacia,
  validarUnidad,
  type ErroresForm,
  type UnidadForm,
} from "../services/altas"
import { agregarUnidad, editarUnidad } from "../services/inventoryApi"
import { SEDES, type Equipment, type Unidad } from "../types"
import { Modal } from "./Modal"

// Alta de una unidad en un ítem existente (PRE-19) o edición de serie, código y locker (PRE-12).
// La sede no se edita (SPEC-04 RN-I1) y sólo la elige el SUPERADMIN al crear.
export function UnidadFormModal({
  equipo,
  unidad,
  rol,
  onClose,
  onGuardado,
}: {
  equipo: Equipment
  /** Si viene, se edita; si no, se agrega una unidad nueva. */
  unidad?: Unidad
  rol: RolUsuario
  onClose: () => void
  onGuardado: () => void
}) {
  const edicion = unidad !== undefined
  const [form, setForm] = useState<UnidadForm>(() =>
    unidad
      ? {
          serie: unidad.serie,
          codigoInventario: unidad.codigoInventario,
          locker: unidad.locker === null ? "" : String(unidad.locker),
          sede: unidad.sede,
        }
      : unidadVacia(),
  )
  const [errores, setErrores] = useState<ErroresForm>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const pedirSede = !edicion && reglaSedeAlta(rol) === "obligatoria"

  const guardar = async () => {
    const locales = validarUnidad(form, rol, !edicion)
    setErrores(locales)
    setGeneral(null)
    if (Object.keys(locales).length) return
    setEnviando(true)
    try {
      const dto = construirUnidad(form, rol)
      if (unidad) {
        await editarUnidad(unidad.id, {
          numero_serie: dto.numero_serie,
          codigo_inventario: dto.codigo_inventario,
          locker: dto.locker,
        })
      } else {
        await agregarUnidad(equipo.id, dto)
      }
      onGuardado()
    } catch (e) {
      if (e instanceof ApiError) setErrores(e.campos)
      setGeneral(mensajeDeError(e, "No se pudo guardar la unidad."))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={edicion ? `Editar unidad de ${equipo.name}` : `Nueva unidad de ${equipo.name}`} onClose={onClose} ancho={460}>
      <TextField
        label="Número de serie"
        value={form.serie}
        onChange={(v) => setForm((f) => ({ ...f, serie: v }))}
        error={errores.numero_serie}
      />
      <TextField
        label="Código de inventario"
        value={form.codigoInventario}
        onChange={(v) => setForm((f) => ({ ...f, codigoInventario: v }))}
        error={errores.codigo_inventario}
      />
      <TextField
        label="Locker (1 a 7)"
        value={form.locker}
        onChange={(v) => setForm((f) => ({ ...f, locker: v }))}
        error={errores.locker}
      />
      {pedirSede && (
        <SelectField
          label="Sede"
          value={form.sede}
          onChange={(v) => setForm((f) => ({ ...f, sede: v }))}
          error={errores.sede}
          options={[{ value: "", label: "Elegí…" }, ...SEDES.map((s) => ({ value: s, label: s }))]}
        />
      )}
      {general && <Alert>{general}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button variant="ghost" onClick={onClose} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </Modal>
  )
}
