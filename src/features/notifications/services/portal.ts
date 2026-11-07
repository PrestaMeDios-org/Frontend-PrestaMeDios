// Contenido fijo del portal institucional (NOV-01, SPEC-06 D-N02).
// El horario NO va acá: se lee de los parámetros globales (P8, RN-N1).

export interface SedeInfo {
  nombre: string
  direccion: string
}

export const PORTAL = {
  laboratorio: "Laboratorio de Medios Audiovisuales",
  instituto: "Instituto de Cultura, Sociedad y Estado (ICSE) — UNTDF",
  sedes: [
    { nombre: "Ushuaia", direccion: "Yrigoyen 879" },
    { nombre: "Río Grande", direccion: "Thorne 302" },
  ] satisfies SedeInfo[],
  normativa: {
    titulo: "Reglamento del Laboratorio de Medios Audiovisuales",
    referencia: "Resolución CICSE N° 056/2023",
  },
  pautas: [
    "Cada sede gestiona su propio inventario y sus espacios: no se retiran equipos de una sede desde la otra.",
    "Los préstamos y las reservas se confirman de forma manual por el personal del Laboratorio.",
    "Las reservas del Aula-Estudio y de la Isla de Edición se hacen dentro del horario operativo.",
    "Ante cualquier daño o inconveniente con un equipo, avisá al personal al momento de la devolución.",
  ],
} as const
