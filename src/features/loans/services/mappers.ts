import type {
  AjusteHorario,
  Asignacion,
  DetallePrestamoDTO,
  LineaOrden,
  LineaUnidadesLibres,
  LineaUnidadesLibresDTO,
  Orden,
  OrdenPedidoCreateDTO,
  OrdenPedidoDTO,
  OrdenPedidoEstadoUpdateDTO,
  Reglas,
  ReglasDTO,
  SolicitudNueva,
} from "../types"

// ─── Del backend a la UI ──────────────────────────────────────────────────────

/** "09:00:00" → "09:00". */
const horaCorta = (hora: string) => hora.slice(0, 5)

export function toReglas(dto: ReglasDTO): Reglas {
  return {
    horarioApertura: horaCorta(dto.horario_apertura),
    horarioCierre: horaCorta(dto.horario_cierre),
    anticipacionMinHoras: dto.anticipacion_min_horas,
    maxDiasGeneral: dto.max_dias_general,
    maxDiasNotebook: dto.max_dias_notebook,
    toleranciaRetiroHoras: dto.tolerancia_retiro_horas,
  }
}

export function toLineaOrden(dto: DetallePrestamoDTO): LineaOrden {
  return {
    id: dto.id,
    equipamientoId: dto.equipamiento_id,
    unidadId: dto.unidad_fisica_id,
    estado: dto.estado,
    retiro: new Date(dto.retiro_pactado),
    devolucion: new Date(dto.devolucion_pactada),
    finOcupacion: new Date(dto.fin_ocupacion),
  }
}

const masTemprana = (fechas: Date[]) =>
  fechas.length ? new Date(Math.min(...fechas.map((f) => f.getTime()))) : null
const masTardia = (fechas: Date[]) =>
  fechas.length ? new Date(Math.max(...fechas.map((f) => f.getTime()))) : null

export function toOrden(dto: OrdenPedidoDTO): Orden {
  const lineas = dto.detalles.map(toLineaOrden)
  return {
    id: dto.id,
    solicitanteId: dto.solicitante_id,
    solicitante: dto.solicitante && {
      ...dto.solicitante,
      nombreCompleto: `${dto.solicitante.nombre} ${dto.solicitante.apellido}`,
    },
    sede: dto.sede,
    asignaturaId: dto.asignatura_id,
    estado: dto.estado,
    situacion: dto.situacion,
    demorado: dto.demorado,
    fechaSolicitud: new Date(dto.fecha_solicitud),
    resueltoEn: dto.resuelto_en ? new Date(dto.resuelto_en) : null,
    motivoResolucion: dto.motivo_resolucion,
    observacionDocente: dto.observacion_docente,
    esRenovado: dto.es_renovado,
    avalArchivoId: dto.aval_archivo_id ?? null,
    retiro: masTemprana(lineas.map((l) => l.retiro)),
    devolucion: masTardia(lineas.map((l) => l.devolucion)),
    lineas,
  }
}

export function toLineaUnidadesLibres(
  dto: LineaUnidadesLibresDTO,
): LineaUnidadesLibres {
  return {
    lineaId: dto.detalle_id,
    equipamientoId: dto.equipamiento_id,
    unidadIds: dto.unidades,
  }
}

// ─── De la UI al backend ──────────────────────────────────────────────────────

/**
 * Payload de `POST /ordenes`. Las fechas van en ISO con zona (UTC); el backend las
 * pasa a la hora del laboratorio para validar la franja.
 */
export function toOrdenCreateDTO(s: SolicitudNueva): OrdenPedidoCreateDTO {
  if (!s.aceptaNormativa)
    throw new Error("Hay que aceptar la normativa para solicitar.")
  const dto: OrdenPedidoCreateDTO = {
    retiro: s.retiro.toISOString(),
    devolucion: s.devolucion.toISOString(),
    items: s.equipamientoIds.map((equipamiento_id) => ({ equipamiento_id })),
    acepta_normativa: true,
  }
  // El backend rechaza campos desconocidos, pero no los opcionales vacíos; igual se
  // omiten para que el body quede limpio.
  if (s.asignaturaId != null) dto.asignatura_id = s.asignaturaId
  if (s.pdfAvalId) dto.pdf_aval_id = s.pdfAvalId
  return dto
}

export function toAprobarDTO(
  asignaciones: Asignacion[],
  ajuste?: AjusteHorario,
): OrdenPedidoEstadoUpdateDTO {
  const dto: OrdenPedidoEstadoUpdateDTO = {
    estado: "aprobada",
    asignaciones: asignaciones.map((a) => ({
      detalle_id: a.lineaId,
      unidad_fisica_id: a.unidadId,
    })),
  }
  if (ajuste) {
    dto.nuevo_retiro = ajuste.retiro.toISOString()
    dto.nueva_devolucion = ajuste.devolucion.toISOString()
  }
  return dto
}

/** Rechazar o cancelar. El motivo vacío no se envía (el backend respondería 422 de forma). */
export function toResolucionDTO(
  estado: "rechazada" | "cancelada",
  motivo?: string,
): OrdenPedidoEstadoUpdateDTO {
  const limpio = motivo?.trim()
  return limpio ? { estado, motivo: limpio } : { estado }
}
