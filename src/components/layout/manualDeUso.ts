// MOMENTÁNEO (SPEC-10, RN-U02): contenido del "Manual de uso" del botón "?".
// No tiene requisito propio en el ERS (M-01); cada tarea cita el requisito que describe.
// Para sacarlo: borrar este archivo, ManualDeUsoModal.tsx y las líneas marcadas en App.tsx.
import type { RolUsuario } from "../../features/auth/types"
import { ROL_LABEL } from "../../features/auth/roles"

export interface TareaManual {
  texto: string
  /** Requisito del ERS que respalda la tarea (SPEC-10 §4.5). */
  requisito: string
  /** Todavía no está implementada (o lo está a medias) en `develop` (D-05). */
  proximamente?: boolean
}

export interface SeccionManual {
  titulo: string
  tareas: TareaManual[]
}

const ESTUDIANTE: SeccionManual = {
  titulo: "Vista Estudiante",
  tareas: [
    { texto: "Explorar el catálogo de equipos disponibles", requisito: "PRE-01, PRE-02" },
    { texto: "Ver ficha completa y specs de cada equipo", requisito: "PRE-01" },
    { texto: "Solicitar préstamo con aprobación del administrador", requisito: "PRE-03, PRE-06, PRE-07" },
    { texto: "Reservar espacios", requisito: "RES-01, RES-02" },
    { texto: "Hacer seguimiento de tus solicitudes activas", requisito: "USR-06" },
    { texto: "Cancelar solicitudes pendientes o aprobadas", requisito: "USR-06, RES-03" },
    { texto: "Consultar novedades e información institucional", requisito: "NOV-01, NOV-02" },
  ],
}

const DOCENTE: SeccionManual = {
  titulo: "Vista Docente",
  tareas: [
    { texto: "Revisar solicitudes de estudiantes pendientes", requisito: "PRE-20" },
    { texto: "Revisar y observar préstamos de tu materia", requisito: "PRE-20" },
    { texto: "Ver historial de solicitudes procesadas", requisito: "PRE-20, USR-07" },
    { texto: "Acceder al catálogo para referencia", requisito: "PRE-01" },
    { texto: "Consultar reservas de espacios del instituto", requisito: "RES-01" },
    { texto: "Recibir notificaciones de nuevas solicitudes", requisito: "NOV-04", proximamente: true },
  ],
}

const TAREAS_ADMIN: TareaManual[] = [
  { texto: "Gestionar entregas y devoluciones en mostrador", requisito: "PRE-13", proximamente: true },
  { texto: "Control de stock físico por sede y locker", requisito: "PRE-12, PRE-14" },
  { texto: "Validar solicitudes de Alta Gama y docentes", requisito: "PRE-05, PRE-09, PRE-10" },
  { texto: "Gestionar comportamiento de alumnos con chips", requisito: "USR-09", proximamente: true },
  { texto: "Calendario maestro de operaciones", requisito: "PRE-16" },
  { texto: "Bloquear fechas en el calendario de espacios", requisito: "RES-04, GLO-04" },
  { texto: "Publicar y editar novedades institucionales", requisito: "NOV-02" },
]

const ADMIN: SeccionManual = { titulo: "Vista Admin", tareas: TAREAS_ADMIN }

// D-07: el SUPERADMIN ve lo del admin más sus tareas propias.
const SUPERADMIN: SeccionManual = {
  titulo: "Vista Superadministrador",
  tareas: [
    ...TAREAS_ADMIN,
    { texto: "Gestionar usuarios y accesos de ambas sedes", requisito: "USR-04" },
    { texto: "Configurar los parámetros operativos del sistema", requisito: "GLO-03" },
  ],
}

export const MANUAL_POR_ROL: Record<RolUsuario, SeccionManual> = {
  ESTUDIANTE,
  DOCENTE,
  ADMIN_LOCAL: ADMIN,
  SUPERADMIN,
}

/** Subtítulo del modal: "Vista activa: <rol>" (AC-U02). */
export const vistaActiva = (rol: RolUsuario): string => `Vista activa: ${ROL_LABEL[rol]}`

