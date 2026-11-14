// MOMENTÁNEO (SPEC-10 M-02): la "foto" de la tarjeta. Foto subida > tema elegido >
// color automático (V-10). Sin esta carpeta, ComunicadosList vuelve a usar el banner automático.
import { BannerComunicado } from "../components/BannerComunicado"
import type { TemaComunicado } from "../services/tema"
import type { PortadaDTO } from "./portadaApi"
import { usePortadaUrl } from "./usePortadas"

export function PortadaComunicado({
  comunicadoId,
  portada,
  temaAutomatico,
  alto = 130,
}: {
  comunicadoId: number
  portada?: PortadaDTO
  temaAutomatico: TemaComunicado
  alto?: number
}) {
  const url = usePortadaUrl(portada?.tiene_imagen ? comunicadoId : null, portada?.actualizado_en)
  if (portada?.tiene_imagen && url) {
    return (
      <img
        src={url}
        alt=""
        style={{ display: "block", width: "100%", height: alto, objectFit: "cover" }}
      />
    )
  }
  return <BannerComunicado tema={portada?.tema ?? temaAutomatico} semilla={comunicadoId} alto={alto} />
}
