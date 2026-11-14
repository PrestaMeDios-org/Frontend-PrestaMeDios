import type { CSSProperties, ReactNode } from "react"
import { useC } from "../../../theme"
import type { EquipoForm } from "../services/altas"
import { equipoDePrevia, filasDePrevia } from "../services/vistaPrevia"
import type { Category, Equipment, Sede } from "../types"
import { EquipmentCard } from "./EquipmentCard"
import { EstadoBadge } from "./UnidadesRow"

// SPEC-10 V-15: panel lateral del alta/edición de equipo. Muestra, mientras se escribe, cómo
// queda la tarjeta en el catálogo (el mismo componente) y cómo se verían las unidades en
// Control de Stock. Es sólo una vista: no se puede tocar.
function Titulo({ children }: { children: ReactNode }) {
  const C = useC()
  return (
    <div
      style={{
        fontFamily: "'Outfit',sans-serif",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: C.textFaint,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

export function VistaPreviaEquipo({
  form,
  categorias,
  base,
  sedePropia,
  conUnidades,
}: {
  form: EquipoForm
  categorias: Category[]
  /** En la edición, el equipo guardado (conserva cantidades y estado). */
  base?: Equipment
  sedePropia: Sede | null
  conUnidades: boolean
}) {
  const C = useC()
  const eq = equipoDePrevia(form, categorias, base)
  const categoria = categorias.find((c) => c.id === form.categoriaId)?.label
  const filas = filasDePrevia(form.unidades, sedePropia)
  const vacio = (v: string) => (v.trim() ? v.trim() : <span style={{ color: C.textFaint }}>—</span>)
  const celda: CSSProperties = { padding: "6px 8px", fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.text }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <Titulo>Así se ve en el catálogo</Titulo>
        <div aria-hidden style={{ pointerEvents: "none", height: 290, position: "relative" }}>
          <EquipmentCard eq={eq} role="student" />
          {!eq.image && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 148,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter',sans-serif",
                fontSize: 12,
                color: C.textFaint,
              }}
            >
              Acá va la imagen (pegá su URL)
            </div>
          )}
        </div>
      </div>

      <div>
        <Titulo>Ficha del equipo</Titulo>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "5px 12px",
            padding: "10px 12px",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            color: C.text,
          }}
        >
          <span style={{ color: C.textMuted }}>Marca</span>
          <span>{vacio(form.marca)}</span>
          <span style={{ color: C.textMuted }}>Modelo</span>
          <span>{vacio(form.modelo)}</span>
          <span style={{ color: C.textMuted }}>Categoría</span>
          <span>{vacio(categoria ?? "")}</span>
          <span style={{ color: C.textMuted }}>Plazo máximo</span>
          <span>{form.maxDias.trim() ? `${form.maxDias.trim()} días` : <span style={{ color: C.textFaint }}>El de los parámetros</span>}</span>
        </div>
      </div>

      {conUnidades && (
        <div>
          <Titulo>Así se ve en Control de Stock</Titulo>
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "6px 6px 8px" }}>
            {filas.length === 0 ? (
              <div style={{ ...celda, color: C.textMuted }}>Sin unidades todavía. Agregalas con “+ Agregar unidad”.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filas.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 8px",
                      borderTop: i ? `1px solid ${C.borderLight}` : "none",
                      fontFamily: "'Inter',sans-serif",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.codigo}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Serie {f.serie} · {f.sede} · Locker {f.locker}
                      </div>
                    </div>
                    <EstadoBadge estado="disponible" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
