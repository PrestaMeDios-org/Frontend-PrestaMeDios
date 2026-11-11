import { apiRequest } from "../../../lib/api"
import type {
  DatosSede,
  DatosSedeDTO,
  ParametroDTO,
  ParametroHistorialDTO,
  TipoParametro,
  ValorParametro,
} from "../types"
import { aDatosSede } from "./mappers"

const BASE = "/api/v1/config/parametros"

/**
 * Horario y correo de contacto de cada sede, en el orden Ushuaia, Río Grande
 * (SPEC-09 §4.5). Lo usan el portal, el aviso de anticipación y los calendarios.
 */
export const obtenerDatosSedes = async (signal?: AbortSignal): Promise<DatosSede[]> =>
  (await apiRequest<DatosSedeDTO[]>("/api/v1/config/sedes", { signal })).map(aDatosSede)

/** Claves `contacto.<sede>.email`: se editan como correo (SPEC-09 RN-80). */
export const esCorreoContacto = (clave: string) => /^contacto\.[a-z][a-z0-9_]*\.email$/.test(clave)

/** Validación en línea; la definitiva la hace el backend con `email-validator`. */
export const correoValido = (texto: string) => {
  const t = texto.trim()
  return t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

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
