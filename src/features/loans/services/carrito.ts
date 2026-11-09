// ─── Carrito de solicitud (SPEC-05 PRE-03, AC-L03) ────────────────────────────
// Funciones puras: el estado vive en CarritoContext. Cada unidad pedida es una línea
// de la orden, así que pedir 2 del mismo modelo manda ese id dos veces.

import type { Equipment } from "../../inventory/types"
import type { CartType } from "../../../types"

/** Máximo de líneas por orden (`items[1..20]` en `OrdenPedidoCreate`). */
export const MAX_LINEAS = 20

export interface ItemCarrito {
  equipamientoId: number
  nombre: string
  codigo: string
  imagen: string
  altaGama: boolean
  esNotebook: boolean
  maxDias: number
  /** Tope de unidades de este modelo: las que tiene la sede. */
  maxCantidad: number
  cantidad: number
}

export function itemDesde(eq: Equipment): ItemCarrito {
  return {
    equipamientoId: eq.id,
    nombre: eq.name,
    codigo: eq.code,
    imagen: eq.image,
    altaGama: eq.altaGama ?? false,
    esNotebook: eq.esNotebook,
    maxDias: eq.maxDays,
    maxCantidad: Math.max(eq.quantity, 1),
    cantidad: 1,
  }
}

export const totalUnidades = (items: ItemCarrito[]) =>
  items.reduce((suma, item) => suma + item.cantidad, 0)

/** ¿Se puede sumar una unidad de este modelo? */
export function puedeSumar(
  items: ItemCarrito[],
  equipamientoId: number,
): boolean {
  if (totalUnidades(items) >= MAX_LINEAS) return false
  const item = items.find((i) => i.equipamientoId === equipamientoId)
  return !item || item.cantidad < item.maxCantidad
}

/** Agrega una unidad del equipo. Si no se puede, devuelve la misma lista. */
export function agregar(items: ItemCarrito[], eq: Equipment): ItemCarrito[] {
  if (!puedeSumar(items, eq.id)) return items
  const existe = items.some((i) => i.equipamientoId === eq.id)
  if (!existe) return [...items, itemDesde(eq)]
  return items.map((i) =>
    i.equipamientoId === eq.id ? { ...i, cantidad: i.cantidad + 1 } : i,
  )
}

/** Fija la cantidad dentro de los topes; con 0 o menos, quita el modelo. */
export function cambiarCantidad(
  items: ItemCarrito[],
  equipamientoId: number,
  cantidad: number,
): ItemCarrito[] {
  if (cantidad <= 0) return quitar(items, equipamientoId)
  const otras = totalUnidades(
    items.filter((i) => i.equipamientoId !== equipamientoId),
  )
  return items.map((i) => {
    if (i.equipamientoId !== equipamientoId) return i
    const tope = Math.min(i.maxCantidad, MAX_LINEAS - otras)
    return { ...i, cantidad: Math.max(1, Math.min(cantidad, tope)) }
  })
}

export const quitar = (items: ItemCarrito[], equipamientoId: number) =>
  items.filter((i) => i.equipamientoId !== equipamientoId)

/** Un id por unidad pedida, en el orden del carrito: es lo que va en `items` del pedido. */
export const equipamientoIds = (items: ItemCarrito[]) =>
  items.flatMap((i) => Array<number>(i.cantidad).fill(i.equipamientoId))

/** Con algún ítem de alta gama, la solicitud pide el aval PDF (RN-L09). */
export const requiereAval = (items: ItemCarrito[]) =>
  items.some((i) => i.altaGama)

/** Variante del botón del carrito en la barra superior. */
export function tipoCarrito(items: ItemCarrito[]): CartType {
  if (items.length === 0) return null
  return requiereAval(items) ? "alta-gama" : "normal"
}
