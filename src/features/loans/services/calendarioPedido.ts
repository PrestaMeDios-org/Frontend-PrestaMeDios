// Calendario de Solicitar equipos (SPEC-10 §4.6, V-01; PRE-01, PRE-06, PRE-07): cruza la
// disponibilidad por día de cada modelo del carrito con la cantidad pedida. Funciones puras.
import type { InfoDia } from "../../../components/ui/calendario/GrillaMes"
import { sumarDias } from "../../../components/ui/calendario/mes"

/** Libres por día de un modelo ("AAAA-MM-DD" → unidades libres) y cuántas se piden. */
export interface DisponibilidadModelo {
  libres: Map<string, number>
  cantidad: number
}

/**
 * Por día, las unidades libres del modelo más justo (el de menor `libres - cantidad`) y si
 * alcanza para todo el pedido. `undefined` si falta el dato de algún modelo.
 */
export function libresDelPedido(
  modelos: DisponibilidadModelo[],
  iso: string,
): { libres: number; alcanza: boolean } | undefined {
  if (modelos.length === 0) return undefined
  let peor: { libres: number; margen: number } | undefined
  for (const m of modelos) {
    const libres = m.libres.get(iso)
    if (libres === undefined) return undefined
    const margen = libres - m.cantidad
    if (!peor || margen < peor.margen) peor = { libres, margen }
  }
  return peor && { libres: peor.libres, alcanza: peor.margen >= 0 }
}

/** Estado del día en el calendario de retiro. */
export function infoDiaRetiro(modelos: DisponibilidadModelo[], cargando: boolean, iso: string): InfoDia {
  const r = libresDelPedido(modelos, iso)
  if (r === undefined) return cargando ? { estado: "cargando" } : { estado: "neutro" }
  return r.alcanza
    ? { estado: "libre", texto: `${r.libres} libres` }
    : { estado: "sin", texto: `${r.libres} libres`, ayuda: "No alcanzan las unidades para tu pedido" }
}

/**
 * Última devolución posible: la menor entre el plazo del pedido (contando el día de retiro,
 * como `diasCorridos`) y el día anterior al primer día sin unidades suficientes después del retiro.
 */
export function ultimaDevolucion(
  modelos: DisponibilidadModelo[],
  retiro: string,
  plazoDias: number,
): string {
  const porPlazo = sumarDias(retiro, Math.max(plazoDias, 1) - 1)
  let dia = retiro
  while (dia < porPlazo) {
    const siguiente = sumarDias(dia, 1)
    const r = libresDelPedido(modelos, siguiente)
    if (r !== undefined && !r.alcanza) return dia
    dia = siguiente
  }
  return porPlazo
}
