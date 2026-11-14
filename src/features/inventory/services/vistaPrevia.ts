// Vista previa del alta/edición de un equipo (SPEC-10 V-15). Sólo presentación: arma, con lo
// que se va escribiendo en el formulario, el mismo `Equipment` que dibuja la tarjeta del
// catálogo y las filas que mostraría Control de Stock. No agrega reglas ni valida.
import type { EquipoForm, UnidadForm } from "./altas"
import type { Category, Equipment, Sede } from "../types"

/** Textos de muestra para los campos vacíos, así se ve dónde cae cada uno. */
export const MUESTRA = {
  codigo: "CÓDIGO",
  nombre: "Nombre del equipo",
  descripcion: "Acá va la descripción técnica que se lee en la tarjeta.",
} as const

const urlValida = (v: string) => /^https?:\/\/\S+$/i.test(v.trim())

export function equipoDePrevia(form: EquipoForm, categorias: Category[], base?: Equipment): Equipment {
  const unidades = base?.quantity ?? form.unidades.length
  const disponibles = base?.available_count ?? form.unidades.length
  return {
    id: base?.id ?? 0,
    name: form.nombre.trim() || MUESTRA.nombre,
    category: categorias.find((c) => c.id === form.categoriaId)?.id ?? "",
    available: base ? base.available : true,
    maintenance: base?.maintenance ?? false,
    image: urlValida(form.imagenUrl) ? form.imagenUrl.trim() : "",
    specs: form.descripcion.trim() || MUESTRA.descripcion,
    maxDays: Number(form.maxDias) || 0,
    code: form.codigo.trim() || MUESTRA.codigo,
    brand: form.marca.trim(),
    model: form.modelo.trim(),
    quantity: unidades,
    available_count: disponibles,
    altaGama: form.altaGama,
    esNotebook: form.esNotebook,
    activo: base?.activo ?? true,
    lockers: [],
  }
}

export interface FilaPrevia {
  codigo: string
  serie: string
  sede: string
  locker: string
}

/** Filas de unidades como en Control de Stock; las nuevas nacen "Disponible". */
export function filasDePrevia(unidades: UnidadForm[], sedePropia: Sede | null): FilaPrevia[] {
  return unidades.map((u) => ({
    codigo: u.codigoInventario.trim() || "—",
    serie: u.serie.trim() || "—",
    sede: u.sede || sedePropia || "—",
    locker: u.locker.trim() || "—",
  }))
}
