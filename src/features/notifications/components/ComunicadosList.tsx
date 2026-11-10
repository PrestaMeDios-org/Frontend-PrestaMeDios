import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { useC } from "../../../theme"
import type { RolUsuario } from "../../auth/types"
import { puedeGestionar } from "../services/alcance"
import type { Comunicado } from "../types"

// Lista de comunicados (NOV-02). El contenido se muestra como texto plano (D-N07):
// nunca se interpreta HTML.
export function ComunicadosList({
  items,
  rol,
  ocupado,
  onEditar,
  onCambiarEstado,
}: {
  items: Comunicado[]
  rol: RolUsuario
  ocupado: number | null
  onEditar: (c: Comunicado) => void
  onCambiarEstado: (c: Comunicado) => void
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((c) => (
        <Tarjeta
          key={c.id}
          c={c}
          gestionable={puedeGestionar(rol, c)}
          ocupado={ocupado === c.id}
          onEditar={() => onEditar(c)}
          onCambiarEstado={() => onCambiarEstado(c)}
        />
      ))}
    </div>
  )
}

function Tarjeta({
  c,
  gestionable,
  ocupado,
  onEditar,
  onCambiarEstado,
}: {
  c: Comunicado
  gestionable: boolean
  ocupado: boolean
  onEditar: () => void
  onCambiarEstado: () => void
}) {
  const C = useC()
  const archivado = c.estado === "ARCHIVADO"
  return (
    <article
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: c.vigente ? 1 : 0.75,
      }}
    >
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Outfit',sans-serif",
              fontSize: 15.5,
              fontWeight: 700,
              color: C.text,
              overflowWrap: "anywhere",
            }}
          >
            {c.titulo}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Badge label={c.alcance} color={c.esGlobal ? C.mine : C.crimson} bg={c.esGlobal ? C.mineBg : C.crimsonLight} />
            {archivado && <Badge label="Archivado" color={C.textMuted} bg={C.borderLight} />}
            {c.vencido && <Badge label="Vencido" color={C.pending} bg={C.pendingBg} />}
          </div>
        </div>
        {gestionable && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <Button variant="ghost" onClick={onEditar} disabled={ocupado}>
              Editar
            </Button>
            <Button variant="ghost" onClick={onCambiarEstado} disabled={ocupado}>
              {archivado ? "Reactivar" : "Archivar"}
            </Button>
          </div>
        )}
      </header>
      <p
        style={{
          margin: 0,
          whiteSpace: "pre-line",
          overflowWrap: "anywhere",
          fontFamily: "'Inter',sans-serif",
          fontSize: 13.5,
          lineHeight: 1.55,
          color: C.text,
        }}
      >
        {c.contenido}
      </p>
      <footer style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }}>
        Publicado el {c.publicadoLabel} · {c.autor}
        {c.venceLabel && ` · ${c.vencido ? "Venció" : "Vence"} el ${c.venceLabel}`}
      </footer>
    </article>
  )
}
