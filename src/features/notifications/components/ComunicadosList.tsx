import { useState } from "react"
import { Badge } from "../../../components/ui/Badge"
import { Button } from "../../../components/ui/Button"
import { useC } from "../../../theme"
import type { RolUsuario } from "../../auth/types"
import { puedeGestionar } from "../services/alcance"
import type { Comunicado } from "../types"
import { temaDe, PALETA_TEMA } from "../services/tema"
import { PortadaComunicado } from "../portada/PortadaComunicado" // MOMENTÁNEO (SPEC-10 M-02)
import type { PortadaDTO } from "../portada/portadaApi" // MOMENTÁNEO (SPEC-10 M-02)

// Lista de comunicados (NOV-02). El contenido se muestra como texto plano (D-N07):
// nunca se interpreta HTML. SPEC-10 V-10: grilla de tarjetas con un banner cuyo color
// sale del alcance y del vencimiento (services/tema.ts).
export function ComunicadosList({
  items,
  rol,
  ocupado,
  portadas,
  onEditar,
  onCambiarEstado,
}: {
  items: Comunicado[]
  /** MOMENTÁNEO (SPEC-10 M-02) */
  portadas?: Map<number, PortadaDTO>
  rol: RolUsuario
  ocupado: number | null
  onEditar: (c: Comunicado) => void
  onCambiarEstado: (c: Comunicado) => void
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, alignItems: "stretch" }}>
      {items.map((c) => (
        <Tarjeta
          key={c.id}
          c={c}
          gestionable={puedeGestionar(rol, c)}
          ocupado={ocupado === c.id}
          portada={portadas?.get(c.id)} // MOMENTÁNEO (SPEC-10 M-02)
          onEditar={() => onEditar(c)}
          onCambiarEstado={() => onCambiarEstado(c)}
        />
      ))}
    </div>
  )
}

/** Contenido largo: se recorta a 3 líneas con "Leer más". */
const esLargo = (texto: string) => texto.length > 160 || texto.split("\n").length > 3

function Tarjeta({
  c,
  gestionable,
  ocupado,
  portada,
  onEditar,
  onCambiarEstado,
}: {
  c: Comunicado
  portada?: PortadaDTO
  gestionable: boolean
  ocupado: boolean
  onEditar: () => void
  onCambiarEstado: () => void
}) {
  const C = useC()
  const [expandido, setExpandido] = useState(false)
  const archivado = c.estado === "ARCHIVADO"
  const tema = temaDe(c)
  const acento = PALETA_TEMA[portada?.tema ?? tema].base
  const largo = esLargo(c.contenido)

  return (
    <article
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: c.vigente ? 1 : 0.75,
        filter: archivado ? "grayscale(60%)" : undefined,
      }}
    >
      {/* MOMENTÁNEO (SPEC-10 M-02): foto o tema elegidos; sin eso, el color automático */}
      <PortadaComunicado comunicadoId={c.id} portada={portada} temaAutomatico={tema} />
      <div style={{ padding: "14px 18px 16px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <Badge label={c.alcance} color={acento} bg={`${acento}1A`} />
          {archivado && <Badge label="Archivado" color={C.textMuted} bg={C.borderLight} />}
          {c.vencido && <Badge label="Vencido" color={C.pending} bg={C.pendingBg} />}
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.textFaint }}>{c.publicadoLabel}</span>
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: "'Outfit',sans-serif",
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.3,
            color: C.text,
            overflowWrap: "anywhere",
          }}
        >
          {c.titulo}
        </h3>
        <p
          style={{
            margin: 0,
            whiteSpace: "pre-line",
            overflowWrap: "anywhere",
            fontFamily: "'Inter',sans-serif",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: C.textMuted,
            ...(largo && !expandido
              ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }
              : {}),
          }}
        >
          {c.contenido}
        </p>
        {largo && (
          <button
            type="button"
            onClick={() => setExpandido((e) => !e)}
            aria-expanded={expandido}
            style={{
              alignSelf: "flex-start",
              border: "none",
              background: "none",
              padding: 0,
              color: C.crimson,
              fontFamily: "'Outfit',sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {expandido ? "Ver menos" : "Leer más"}
          </button>
        )}
        <footer
          style={{
            // SPEC-10: todas las tarjetas de la fila con el mismo alto y el pie siempre igual
            // (autor y vencimiento arriba, botones abajo), así quedan al mismo nivel.
            marginTop: "auto",
            paddingTop: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }}>
            {c.autor}
            {c.venceLabel && ` · ${c.vencido ? "Venció" : "Vence"} el ${c.venceLabel}`}
          </span>
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
        </footer>
      </div>
    </article>
  )
}
