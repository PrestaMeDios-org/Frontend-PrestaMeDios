import { apiRequest } from "../../../lib/api"
import type { ParametroDTO, ParametroHistorialDTO, TipoParametro, ValorParametro } from "../types"

const BASE = "/api/v1/config/parametros"

export const listarParametros = () => apiRequest<ParametroDTO[]>(BASE)

export const actualizarParametro = (clave: string, valor: ValorParametro, version: number, motivo?: string) =>
  apiRequest<ParametroDTO>(`${BASE}/${encodeURIComponent(clave)}`, {
    method: "PUT",
    json: { valor, version, ...(motivo ? { motivo } : {}) },
  })

export const historialParametro = (clave: string) =>
  apiRequest<ParametroHistorialDTO[]>(`${BASE}/${encodeURIComponent(clave)}/historial`)

/** Convierte el texto del formulario al tipo nativo que exige el backend (RN-19). */
export function convertirValor(tipo: TipoParametro, texto: string): ValorParametro | null {
  const t = texto.trim()
  switch (tipo) {
    case "ENTERO":
      return /^-?\d+$/.test(t) ? Number(t) : null
    case "DECIMAL":
      return t !== "" && !Number.isNaN(Number(t)) ? Number(t) : null
    case "BOOLEANO":
      return t === "true" ? true : t === "false" ? false : null
    case "HORA":
      return /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : null
    case "TEXTO":
      return t.length >= 1 && t.length <= 300 ? t : null
  }
}
