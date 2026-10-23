import type {
  Category,
  CategoriaDTO,
  Equipment,
  EquipamientoCatalogoDTO,
  EquipamientoDTO,
  Unidad,
  UnidadFisicaDTO,
} from "../types"

const DEFAULT_CATEGORY_COLOR = "#6E6E73"

/** ¿Es la vista de administradores? (sólo ésta trae `unidades`, SPEC-04 RN-I7). */
export function esVistaAdmin(dto: EquipamientoCatalogoDTO): dto is EquipamientoDTO {
  return "unidades" in dto
}

export function toUnidad(dto: UnidadFisicaDTO): Unidad {
  return {
    id: dto.id,
    serie: dto.numero_serie,
    codigoInventario: dto.codigo_inventario,
    sede: dto.sede,
    locker: dto.locker,
    estado: dto.estado,
  }
}

export function toEquipment(dto: EquipamientoCatalogoDTO): Equipment {
  const base = {
    id: dto.id,
    name: dto.nombre,
    category: dto.categoria_id,
    available: dto.cantidad_disponible > 0,
    maintenance: dto.en_mantenimiento,
    image: dto.imagen_url ?? "",
    specs: dto.descripcion ?? "",
    maxDays: dto.max_dias_prestamo,
    code: dto.codigo,
    brand: dto.marca,
    model: dto.modelo,
    quantity: dto.cantidad_total,
    available_count: dto.cantidad_disponible,
    altaGama: dto.alta_gama,
    esNotebook: dto.es_notebook,
    careRules: dto.reglas_cuidado,
    videoUrl: dto.video_url ?? undefined,
  }

  if (!esVistaAdmin(dto)) {
    // Estudiantes y docentes: la sede es la propia y el backend ya acotó todo a ella.
    return {
      ...base,
      activo: true,
      locker: dto.locker ?? undefined,
      lockers: dto.locker === null ? [] : [dto.locker],
    }
  }

  const activas = dto.unidades.filter((u) => u.estado !== "baja")
  const sedes = [...new Set(activas.map((u) => u.sede))]
  const lockers = [
    ...new Set(activas.flatMap((u) => (u.locker === null ? [] : [u.locker]))),
  ].sort((a, b) => a - b)

  return {
    ...base,
    activo: dto.activo,
    sede: sedes.length === 1 ? sedes[0] : undefined,
    locker: lockers[0],
    lockers,
    unidades: dto.unidades.map(toUnidad),
  }
}

export function toCategory(dto: CategoriaDTO): Category {
  return {
    id: dto.id,
    label: dto.nombre,
    color: dto.color ?? DEFAULT_CATEGORY_COLOR,
  }
}
