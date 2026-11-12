import type { Category, Equipment } from "../types"

// Orden de la tabla de stock (PRE-12). Se hace en el cliente: el catálogo de una sede es chico.
export type ColumnaStock = "nombre" | "categoria" | "locker" | "tipo" | "disponibles"
export type Sentido = "asc" | "desc"

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true })

/** Locker de referencia del ítem: el menor de sus unidades activas. */
const lockerDe = (e: Equipment): number | undefined =>
  e.lockers.length ? e.lockers[0] : undefined

/**
 * Devuelve una copia ordenada. Los ítems sin locker van siempre al final,
 * sea cual sea el sentido. Los empates se resuelven por nombre.
 */
export function ordenarStock(
  items: readonly Equipment[],
  columna: ColumnaStock,
  sentido: Sentido,
  categorias: readonly Category[] = [],
): Equipment[] {
  const etiqueta = (id: string) => categorias.find((c) => c.id === id)?.label ?? id
  const signo = sentido === "asc" ? 1 : -1

  const comparar = (a: Equipment, b: Equipment): number => {
    switch (columna) {
      case "nombre":
        return signo * collator.compare(a.name, b.name)
      case "categoria":
        return signo * collator.compare(etiqueta(a.category), etiqueta(b.category))
      case "tipo":
        // Común (false) antes que Especial (true) en ascendente.
        return signo * (Number(!!a.altaGama) - Number(!!b.altaGama))
      case "disponibles":
        return signo * (a.available_count - b.available_count)
      case "locker": {
        const la = lockerDe(a)
        const lb = lockerDe(b)
        if (la === undefined && lb === undefined) return 0
        if (la === undefined) return 1
        if (lb === undefined) return -1
        return signo * (la - lb)
      }
    }
  }

  return [...items].sort((a, b) => comparar(a, b) || collator.compare(a.name, b.name))
}

/** Siguiente estado al hacer clic en una columna: misma columna alterna el sentido. */
export function alternarOrden(
  actual: { columna: ColumnaStock; sentido: Sentido },
  columna: ColumnaStock,
): { columna: ColumnaStock; sentido: Sentido } {
  if (actual.columna !== columna) return { columna, sentido: "asc" }
  return { columna, sentido: actual.sentido === "asc" ? "desc" : "asc" }
}
