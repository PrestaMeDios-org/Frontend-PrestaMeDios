import type { Comunicado, ComunicadoDTO, Notificacion, NotificacionDTO } from "../types"
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

/** DTO del backend → view model de la campanita (NOV-04). */
export function toNotificacion(dto: NotificacionDTO): Notificacion {
  return {
    id: dto.id,
    tipo: dto.tipo,
    critica: dto.severidad === "CRITICA",
    titulo: dto.titulo,
    mensaje: dto.mensaje,
    referencia: dto.referencia,
    creadaEn: dto.creada_en,
    creadaLabel: fechaLegible(dto.creada_en),
    leida: dto.leida_en !== null,
  }
}

/** Las que se marcan solas al abrir la campanita: normales sin leer (RN-N9). */
export function marcablesAlAbrir(items: Notificacion[]): number[] {
  return items.filter((n) => !n.critica && !n.leida).map((n) => n.id)
}
