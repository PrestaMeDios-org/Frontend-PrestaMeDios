import type { RolUsuario } from "../../auth/types"
import type {
  EquipamientoCreateDTO,
  EquipamientoUpdateDTO,
  Sede,
  UnidadFisicaCreateDTO,
} from "../types"

// Reglas del formulario de alta (PRE-19, SPEC-04 RN-I2). El backend es la autoridad;
// esto sólo mejora la experiencia.

/** `oculta` para ADMIN_LOCAL (sede automática); `obligatoria` para SUPERADMIN. */
export type ReglaSede = "oculta" | "obligatoria"

export const reglaSedeAlta = (rol: RolUsuario): ReglaSede =>
  rol === "SUPERADMIN" ? "obligatoria" : "oculta"

export interface UnidadForm {
  serie: string
  codigoInventario: string
  locker: string
  sede: Sede | ""
}

export interface EquipoForm {
  codigo: string
  nombre: string
  marca: string
  modelo: string
  categoriaId: string
  descripcion: string
  maxDias: string
  altaGama: boolean
  esNotebook: boolean
  imagenUrl: string
  videoUrl: string
  reglas: string
  unidades: UnidadForm[]
}

export const unidadVacia = (): UnidadForm => ({
  serie: "",
  codigoInventario: "",
  locker: "",
  sede: "",
})

export const equipoVacio = (): EquipoForm => ({
  codigo: "",
  nombre: "",
  marca: "",
  modelo: "",
  categoriaId: "",
  descripcion: "",
  maxDias: "",
  altaGama: false,
  esNotebook: false,
  imagenUrl: "",
  videoUrl: "",
  reglas: "",
  unidades: [],
})

const texto = (v: string) => v.trim()
const opcional = (v: string) => (texto(v) === "" ? null : texto(v))

/** Una regla de cuidado por línea; ignora las vacías. */
export const parsearReglas = (v: string): string[] =>
  v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

const entero = (v: string): number | null => {
  const t = texto(v)
  return /^\d+$/.test(t) ? Number(t) : null
}

export type ErroresForm = Record<string, string>

const esUrl = (v: string) => /^https?:\/\//i.test(texto(v))

/** Valida el formulario y devuelve los errores por campo (vacío = válido). */
export function validarEquipo(f: EquipoForm, rol: RolUsuario, modo: "alta" | "edicion"): ErroresForm {
  const e: ErroresForm = {}
  if (modo === "alta" && !texto(f.codigo)) e.codigo = "Ingresá el código."
  if (!texto(f.nombre)) e.nombre = "Ingresá el nombre."
  if (!texto(f.marca)) e.marca = "Ingresá la marca."
  if (!texto(f.modelo)) e.modelo = "Ingresá el modelo."
  if (!f.categoriaId) e.categoria_id = "Elegí una categoría."
  if (texto(f.maxDias)) {
    const d = entero(f.maxDias)
    if (d === null || d < 1 || d > 15) e.max_dias_prestamo = "Entre 1 y 15 días."
  }
  if (texto(f.imagenUrl) && !esUrl(f.imagenUrl)) e.imagen_url = "Debe empezar con http:// o https://"
  if (texto(f.videoUrl) && !esUrl(f.videoUrl)) e.video_url = "Debe empezar con http:// o https://"
  if (modo === "alta") {
    f.unidades.forEach((u, i) => {
      const err = validarUnidad(u, rol, true)
      for (const [campo, msg] of Object.entries(err)) e[`unidades.${i}.${campo}`] = msg
    })
  }
  return e
}

/** Valida una unidad. `exigirSede`: el SUPERADMIN debe elegirla (RN-I2). */
export function validarUnidad(u: UnidadForm, rol: RolUsuario, exigirSede: boolean): ErroresForm {
  const e: ErroresForm = {}
  if (!texto(u.serie)) e.numero_serie = "Ingresá el número de serie."
  if (!texto(u.codigoInventario)) e.codigo_inventario = "Ingresá el código de inventario."
  if (texto(u.locker)) {
    const l = entero(u.locker)
    if (l === null || l < 1 || l > 7) e.locker = "El locker va de 1 a 7."
  }
  if (exigirSede && reglaSedeAlta(rol) === "obligatoria" && !u.sede) e.sede = "Elegí la sede."
  return e
}

/** DTO de una unidad nueva: sólo el SUPERADMIN envía `sede`; el backend la fija para el resto. */
export function construirUnidad(u: UnidadForm, rol: RolUsuario): UnidadFisicaCreateDTO {
  const dto: UnidadFisicaCreateDTO = {
    numero_serie: texto(u.serie),
    codigo_inventario: texto(u.codigoInventario),
    locker: entero(u.locker),
  }
  if (reglaSedeAlta(rol) === "obligatoria" && u.sede) dto.sede = u.sede
  return dto
}

type CamposComunes = Omit<EquipamientoCreateDTO, "codigo" | "unidades">

function camposComunes(f: EquipoForm): CamposComunes {
  const dto: CamposComunes = {
    nombre: texto(f.nombre),
    marca: texto(f.marca),
    modelo: texto(f.modelo),
    categoria_id: f.categoriaId,
    descripcion: opcional(f.descripcion),
    alta_gama: f.altaGama,
    es_notebook: f.esNotebook,
    imagen_url: opcional(f.imagenUrl),
    video_url: opcional(f.videoUrl),
    reglas_cuidado: parsearReglas(f.reglas),
  }
  // Omitido en el alta: el backend toma el plazo de los parámetros globales (GLO-03).
  const dias = entero(f.maxDias)
  if (dias !== null) dto.max_dias_prestamo = dias
  return dto
}

export function construirAlta(f: EquipoForm, rol: RolUsuario): EquipamientoCreateDTO {
  return {
    codigo: texto(f.codigo),
    ...camposComunes(f),
    unidades: f.unidades.map((u) => construirUnidad(u, rol)),
  }
}

export const construirEdicion = (f: EquipoForm): EquipamientoUpdateDTO => camposComunes(f)

/** Formulario de edición precargado desde un ítem existente. */
export function formDesdeEquipo(e: {
  code: string
  name: string
  brand: string
  model: string
  category: string
  specs: string
  maxDays: number
  altaGama?: boolean
  esNotebook: boolean
  image: string
  videoUrl?: string
  careRules?: string[]
}): EquipoForm {
  return {
    ...equipoVacio(),
    codigo: e.code,
    nombre: e.name,
    marca: e.brand,
    modelo: e.model,
    categoriaId: e.category,
    descripcion: e.specs,
    maxDias: String(e.maxDays),
    altaGama: !!e.altaGama,
    esNotebook: e.esNotebook,
    imagenUrl: e.image,
    videoUrl: e.videoUrl ?? "",
    reglas: (e.careRules ?? []).join("\n"),
  }
}
