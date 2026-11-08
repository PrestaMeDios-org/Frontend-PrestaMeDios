// ─── Enlace de recuperación de contraseña (SPEC-03 §5.5, RN-47) ───────────────
// El enlace es `{FRONTEND_URL}/#/restablecer?token=<token>`. El token viaja en el
// fragmento, que el navegador no manda al servidor ni en el `Referer`. Se lee una vez
// al cargar y se quita de la barra de direcciones; después viaja en el cuerpo del POST.

const RUTA = "#/restablecer"
const FORMATO_TOKEN = /^[A-Za-z0-9_-]{20,200}$/

/** ¿El fragmento corresponde a la pantalla de restablecer, con o sin token válido? */
export function esRutaRestablecer(hash: string): boolean {
  return hash === RUTA || hash.startsWith(`${RUTA}?`)
}

/** Token del fragmento, o `null` si falta o no tiene el formato esperado. */
export function leerTokenDeRecuperacion(hash: string): string | null {
  if (!hash.startsWith(`${RUTA}?`)) return null
  const token = new URLSearchParams(hash.slice(RUTA.length + 1)).get("token")
  return token && FORMATO_TOKEN.test(token) ? token : null
}

/** Quita el fragmento (y con él el token) de la barra de direcciones y del historial. */
export function limpiarFragmento(
  ubicacion: Pick<Location, "pathname" | "search"> = window.location,
  historial: Pick<History, "replaceState"> = window.history,
): void {
  historial.replaceState(null, "", `${ubicacion.pathname}${ubicacion.search}`)
}
