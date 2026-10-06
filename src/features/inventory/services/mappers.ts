import type {
  Category,
  CategoriaDTO,
  Equipment,
  EquipamientoDTO,
} from "../types"

const DEFAULT_CATEGORY_COLOR = "#6E6E73"

export function toEquipment(dto: EquipamientoDTO): Equipment {
  const activas = dto.unidades.filter((u) => u.estado !== "baja")
  const sedes = [...new Set(activas.map((u) => u.sede))]
  const locker = activas.find((u) => u.locker !== null)?.locker ?? undefined

  return {
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
    quantity: dto.cantidad_total,
    available_count: dto.cantidad_disponible,
    altaGama: dto.alta_gama,
    sede: sedes.length === 1 ? sedes[0] : undefined,
    locker,
    careRules: dto.reglas_cuidado,
    videoUrl: dto.video_url ?? undefined,
  }
}

export function toCategory(dto: CategoriaDTO): Category {
  return {
    id: dto.id,
    label: dto.nombre,
    color: dto.color ?? DEFAULT_CATEGORY_COLOR,
  }
}
