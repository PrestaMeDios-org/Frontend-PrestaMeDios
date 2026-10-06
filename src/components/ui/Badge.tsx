import { useC } from "../../theme"

// Badge atómico: chip con dot de estado, respeta el tema activo.
export function Badge({
  label,
  color,
  bg,
}: {
  label: string
  color: string
  bg: string
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 100,
        background: bg,
        color,
        fontFamily: "'Inter',sans-serif",
        fontSize: 11.5,
        fontWeight: 600,
        whiteSpace: "nowrap" as any,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}

export function StatusBadge({
  available,
  maintenance,
}: {
  available: boolean
  maintenance?: boolean
}) {
  const C = useC()
  if (maintenance)
    return (
      <Badge
        label="En Mantenimiento"
        color={C.maintenance}
        bg={C.maintenanceBg}
      />
    )
  return (
    <Badge
      label={available ? "Disponible" : "Ocupado"}
      color={available ? C.available : C.occupied}
      bg={available ? C.availableBg : C.occupiedBg}
    />
  )
}

export function LoanBadge({ status }: { status: string }) {
  const C = useC()
  const m: Record<string, [string, string, string]> = {
    pending: [C.pending, C.pendingBg, "Pendiente"],
    approved: [C.available, C.availableBg, "Aprobado"],
    returned: [C.textMuted, C.bg, "Devuelto"],
    rejected: [C.occupied, C.occupiedBg, "Rechazado"],
    ready: [C.available, C.availableBg, "Listo p/retirar"],
    delivered: [C.mine, C.mineBg, "Entregado"],
    demorado: [C.occupied, C.occupiedBg, "⚠ Demorado"],
    cancelled: [C.textMuted, C.bg, "Cancelado"],
  }
  const [color, bg, label] = m[status] ?? [C.textMuted, C.bg, status]
  return <Badge label={label} color={color} bg={bg} />
}
