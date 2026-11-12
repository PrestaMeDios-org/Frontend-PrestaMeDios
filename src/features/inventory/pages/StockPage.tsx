import { useState } from "react"
import { useC } from "../../../theme"
import { Alert } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"
import { SearchInput } from "../../../components/ui/Input"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { EquipmentFormModal } from "../components/EquipmentFormModal"
import { StockTable } from "../components/StockTable"
import { UnidadFormModal } from "../components/UnidadFormModal"
import { useCatalogo } from "../hooks/useCatalogo"
import { useGestion } from "../hooks/useGestion"
import { SEDES, type Equipment, type Sede, type Unidad } from "../types"

type Dialogo =
  | { tipo: "equipo"; modo: "alta" | "edicion"; equipo?: Equipment }
  | { tipo: "unidad"; equipo: Equipment; unidad?: Unidad }
  | null

// Control de stock para administradores (PRE-12, PRE-14, PRE-19): tabla ordenable por sede
// con las unidades desplegables. La disponibilidad por fechas y el historial de usuarios por
// unidad llegan en la Fase B, cuando el módulo de préstamos exponga esos datos (SPEC-04 §5.4–5.5).
export function StockPage() {
  const C = useC()
  const usuario = useUsuario()
  const { sedeVista, puedeElegir } = useSede()
  const [filtroSede, setFiltroSede] = useState<Sede | "">("")
  const [q, setQ] = useState("")
  const [dialogo, setDialogo] = useState<Dialogo>(null)

  const sede = puedeElegir ? filtroSede || sedeVista || undefined : undefined
  const { items, categorias, cargando, error, recargar } = useCatalogo({
    sede,
    q,
    incluirInactivos: true,
  })
  const gestion = useGestion(recargar)

  const cerrar = () => setDialogo(null)
  const guardado = () => {
    cerrar()
    recargar()
  }

  const selectStyle = {
    padding: "8px 12px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    background: C.card,
    color: C.text,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 13,
  } as const

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SearchInput value={q} onChange={setQ} placeholder="Buscar equipo, código o marca..." />
        {puedeElegir ? (
          <select
            aria-label="Filtrar por sede"
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value as Sede | "")}
            style={selectStyle}
          >
            <option value="">{sedeVista ? `Sede vista: ${sedeVista}` : "Todas las sedes"}</option>
            {SEDES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span style={{ ...selectStyle, color: C.mine, background: C.mineBg, fontWeight: 600 }}>
            📍 {usuario.sede}
          </span>
        )}
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => setDialogo({ tipo: "equipo", modo: "alta" })}>+ Nuevo equipo</Button>
        </div>
      </div>

      {gestion.error && <Alert>{gestion.error}</Alert>}
      {error && <Alert>{error}</Alert>}

      {cargando && items.length === 0 && !error ? (
        <div role="status" style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif" }}>
          Cargando stock…
        </div>
      ) : items.length === 0 && !error ? (
        <div style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif", padding: "30px 0", textAlign: "center" }}>
          {q.trim()
            ? "No hay equipos que coincidan con la búsqueda."
            : "Todavía no hay equipos cargados en esta sede."}
        </div>
      ) : (
        <StockTable
          items={items}
          categorias={categorias}
          ocupado={gestion.ocupado}
          onEstado={(_e, unidad, accion) => gestion.cambiarEstado(unidad, accion)}
          onEditarUnidad={(equipo, unidad) => setDialogo({ tipo: "unidad", equipo, unidad })}
          onAgregarUnidad={(equipo) => setDialogo({ tipo: "unidad", equipo })}
          onEditarEquipo={(equipo) => setDialogo({ tipo: "equipo", modo: "edicion", equipo })}
          onCambiarActivo={gestion.cambiarActivo}
        />
      )}

      {dialogo?.tipo === "equipo" && (
        <EquipmentFormModal
          modo={dialogo.modo}
          equipo={dialogo.equipo}
          categorias={categorias}
          rol={usuario.rol}
          onClose={cerrar}
          onGuardado={guardado}
        />
      )}
      {dialogo?.tipo === "unidad" && (
        <UnidadFormModal
          equipo={dialogo.equipo}
          unidad={dialogo.unidad}
          rol={usuario.rol}
          onClose={cerrar}
          onGuardado={guardado}
        />
      )}
    </div>
  )
}
