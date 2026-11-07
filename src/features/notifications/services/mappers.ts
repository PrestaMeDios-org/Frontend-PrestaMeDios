import type { Comunicado, ComunicadoDTO } from "../types"
import { fechaLegible } from "./fechas"

/** DTO del backend → view model de la pantalla de Novedades (NOV-02). */
export function toComunicado(dto: ComunicadoDTO): Comunicado {
  return {
    id: dto.id,
    titulo: dto.titulo,
    contenido: dto.contenido,
    sede: dto.sede,
    esGlobal: dto.es_global,
    alcance: dto.es_global ? "Global" : (dto.sede ?? "—"),
    estado: dto.estado,
    vigente: dto.vigente,
    vencido: dto.estado === "PUBLICADO" && !dto.vigente,
    autor: dto.autor ? `${dto.autor.nombre} ${dto.autor.apellido}` : "Laboratorio",
    publicadoEn: dto.publicado_en,
    publicadoLabel: fechaLegible(dto.publicado_en),
    venceEn: dto.vence_en,
    venceLabel: dto.vence_en ? fechaLegible(dto.vence_en) : null,
  }
}
