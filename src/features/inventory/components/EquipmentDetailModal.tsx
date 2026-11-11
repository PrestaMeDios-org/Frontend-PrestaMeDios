import type { Role } from "../../../types"
import { useC } from "../../../theme"
import type { Equipment, Sede } from "../types"
import { Modal } from "./Modal"
import { MiniCalendario } from "./MiniCalendario"
import { AgregarAlPedido } from "./AgregarAlPedido"

interface Props {
  equipment: Equipment
  role: Role
  sede?: Sede
  onClose: () => void
  onAddToCart?: (eq: Equipment) => void
}

export function EquipmentDetailModal({ equipment, role, sede, onClose, onAddToCart }: Props) {
  const C = useC()
  const dato = (etiqueta: string, valor: string | number) => (
    <p style={{ margin: 0, fontSize: 14 }}>
      <span style={{ color: C.textMuted }}>{etiqueta}: </span>
      {valor}
    </p>
  )

  return (
    <Modal titulo={equipment.name} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, color: C.text }}>
        {equipment.image && (
          <img src={equipment.image} alt={equipment.name} style={{ maxWidth: "100%", borderRadius: 10 }} />
        )}
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
          {equipment.brand} {equipment.model} · {equipment.code}
        </p>
        {dato("Tipo", equipment.altaGama ? "Especial" : "Común")}
        {dato("Plazo máximo", `${equipment.maxDays} días`)}
        {equipment.locker !== undefined && dato("Locker", equipment.locker)}
        {dato("Disponibles hoy", equipment.available_count ?? equipment.quantity)}
        {equipment.specs && <p style={{ margin: 0, fontSize: 14 }}>{equipment.specs}</p>}
        {equipment.careRules && equipment.careRules.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, listStyle: "disc" }}>
            {equipment.careRules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        {equipment.videoUrl && (
          <a href={equipment.videoUrl} target="_blank" rel="noreferrer" style={{ color: C.crimson, fontSize: 14 }}>
            Ver video instructivo
          </a>
        )}
        <MiniCalendario equipamientoId={equipment.id} sede={sede} />
        <AgregarAlPedido equipment={equipment} role={role} onAddToCart={onAddToCart} />
      </div>
    </Modal>
  )
}
