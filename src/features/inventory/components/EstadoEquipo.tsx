import { useC } from "../../../theme"
import { Badge, StatusBadge } from "../../../components/ui/Badge"
import { estadoEquipo } from "../services/estado"
import type { Equipment } from "../types"

// Insignia del catálogo: igual que `StatusBadge`, más "No disponible" para equipos sin
// unidades activas (RN-I5). Vive acá para no tocar el componente compartido.
export function EstadoEquipo({ eq }: { eq: Equipment }) {
  const C = useC()
  if (estadoEquipo(eq) === "no_disponible") {
    return <Badge label="No disponible" color={C.textMuted} bg={C.bg} />
  }
  return <StatusBadge available={eq.available} maintenance={eq.maintenance} />
}
