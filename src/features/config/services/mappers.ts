import type { DatosSede, DatosSedeDTO } from "../types"

/** "09:00:00" → "09:00". */
const horaCorta = (hora: string) => hora.slice(0, 5)

export const aDatosSede = (dto: DatosSedeDTO): DatosSede => ({
  sede: dto.sede,
  apertura: horaCorta(dto.horario_apertura),
  cierre: horaCorta(dto.horario_cierre),
  correoContacto: dto.correo_contacto,
})
