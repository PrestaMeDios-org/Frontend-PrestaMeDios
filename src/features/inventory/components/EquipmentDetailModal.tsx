import type { Equipment } from "../types"
import { Modal } from "./Modal"
import { MiniCalendario } from "./MiniCalendario"
import { AgregarAlPedido } from "./AgregarAlPedido"

interface Props {
  equipment: Equipment
  role: string
  sede?: string
  onClose: () => void
  onAddToCart?: (eq: Equipment) => void
}

export function EquipmentDetailModal({ equipment, role, sede, onClose, onAddToCart }: Props) {
  return (
    <Modal titulo={equipment.name} onClose={onClose}>
      <div>
        {equipment.image && <img src={equipment.image} alt={equipment.name} style={{ maxWidth: "100%" }} />}
        <p>
          {equipment.brand} {equipment.model} · {equipment.code}
        </p>
        <p>Tipo: {equipment.altaGama ? "Especial" : "Común"}</p>
        <p>Plazo máximo: {equipment.maxDays} días</p>
        {equipment.locker !== undefined && <p>Locker: {equipment.locker}</p>}
        <p>Disponibles hoy: {equipment.available_count ?? equipment.quantity}</p>
        {equipment.specs && <p>{equipment.specs}</p>}
        {equipment.careRules && equipment.careRules.length > 0 && (
          <ul>
            {equipment.careRules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
        {equipment.videoUrl && (
          <a href={equipment.videoUrl} target="_blank" rel="noreferrer">
            Ver video instructivo
          </a>
        )}
        <MiniCalendario equipamientoId={equipment.id} sede={sede} />
        <AgregarAlPedido equipment={equipment} role={role} onAddToCart={onAddToCart} />
      </div>
    </Modal>
  )
}
