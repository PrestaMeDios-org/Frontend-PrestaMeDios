// Tema visual de la tarjeta de un comunicado (SPEC-10 V-10). Se deriva de datos que ya
// existen (alcance y vencimiento, NOV-02): no se guarda nada ni se elige a mano.
import type { Comunicado } from "../types"

export type TemaComunicado = "rojo" | "amarillo" | "azul" | "verde"

/** Horas antes del vencimiento en las que la tarjeta pasa a amarillo. */
export const HORAS_POR_VENCER = 48

export function temaDe(c: Pick<Comunicado, "esGlobal" | "sede" | "venceEn" | "vencido">, ahora = new Date()): TemaComunicado {
  if (c.venceEn && !c.vencido) {
    const faltan = new Date(c.venceEn).getTime() - ahora.getTime()
    if (faltan > 0 && faltan <= HORAS_POR_VENCER * 3_600_000) return "amarillo"
  }
  if (c.esGlobal) return "rojo"
  return c.sede === "Río Grande" ? "verde" : "azul"
}

/** Colores fijos del banner (son "la foto" de la tarjeta: iguales en claro y oscuro). */
export const PALETA_TEMA: Record<TemaComunicado, { claro: string; base: string; oscuro: string; linea: string }> = {
  rojo: { claro: "#D11F3F", base: "#B0142F", oscuro: "#6E0A1C", linea: "#FF6F8A" },
  amarillo: { claro: "#F2B51C", base: "#D99A06", oscuro: "#8F5E00", linea: "#FFE28A" },
  azul: { claro: "#2F78CF", base: "#1D5BA8", oscuro: "#0C3367", linea: "#7DBBFF" },
  verde: { claro: "#2BA56A", base: "#1B8350", oscuro: "#0B4D2D", linea: "#7DEBB2" },
}

export const LEYENDA_TEMA: Record<TemaComunicado, string> = {
  rojo: "Global · ambas sedes",
  azul: "Ushuaia",
  verde: "Río Grande",
  amarillo: "Vence pronto",
}
