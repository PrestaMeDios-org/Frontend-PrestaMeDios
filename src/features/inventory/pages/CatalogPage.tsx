import { useState } from "react"
import { useC } from "../../../theme"
import { Alert } from "../../../components/ui/Form"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { EquipmentCard } from "../components/EquipmentCard"
import { AgregarAlPedido } from "../components/AgregarAlPedido"
import { EstadoEquipo } from "../components/EstadoEquipo"
import { EquipmentFormModal } from "../components/EquipmentFormModal"
import { EquipmentDetailModal } from "../components/EquipmentDetailModal"
import { CatalogFilters } from "../components/CatalogFilters"
import { useCatalogo } from "../hooks/useCatalogo"
import { useGestion } from "../hooks/useGestion"
import type { Equipment, Sede } from "../types"
import type { Role } from "../../../types"

type Dialogo = { modo: "alta" | "edicion"; equipo?: Equipment } | null

// Página del catálogo (PRE-01, PRE-02): buscador + filtros + grilla/lista, con datos de la API.
// Estudiantes y docentes ven su sede; el SUPERADMIN elige; los administradores gestionan los
// equipos (alta, edición y baja lógica, PRE-12 y PRE-19).
export function CatalogPage({
  role = "student",
  userSede,
  onAddToCart,
}: {
  role?: Role
  userSede?: Sede
  onAddToCart?: (e: Equipment) => void
}) {
  const C = useC()
  const usuario = useUsuario()
  const { puedeElegir } = useSede()
  const esAdminUi = role === "admin"
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterSede, setFilterSede] = useState("")
  const [verBajas, setVerBajas] = useState(false)
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [detalle, setDetalle] = useState<Equipment | null>(null)

  // Sólo el SUPERADMIN puede pedir una sede; para el resto la fija el backend.
  const sede = puedeElegir ? ((filterSede || userSede) as Sede | undefined) : undefined
  const { items, categorias, cargando, error, recargar, buscando } = useCatalogo({
    sede,
    q: search,
    incluirInactivos: esAdminUi && verBajas,
  })
  const gestion = useGestion(recargar)

  const filtered = items.filter((e) => filter === "all" || e.category === filter)
  const counts = items.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  const canBook = (e: Equipment) => e.activo && e.available && !e.maintenance
  const sinResultados = !cargando && !buscando && !error && filtered.length === 0

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
      <CatalogFilters
        search={search}
        onSearch={setSearch}
        viewMode={viewMode}
        onViewMode={setViewMode}
        filterSede={filterSede}
        onFilterSede={setFilterSede}
        filter={filter}
        onFilter={setFilter}
        categories={categorias}
        totalCount={items.length}
        filteredCount={filtered.length}
        availableCount={filtered.filter(canBook).length}
        counts={counts}
        role={role}
        userSede={puedeElegir ? undefined : (usuario.sede ?? undefined)}
        puedeElegirSede={puedeElegir}
        onNewEquipment={() => setDialogo({ modo: "alta" })}
      />

      {esAdminUi && (
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 14,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12.5,
            color: C.textMuted,
            cursor: "pointer",
          }}
        >
          <input type="checkbox" checked={verBajas} onChange={(e) => setVerBajas(e.target.checked)} />
          Mostrar equipos dados de baja
        </label>
      )}

      {gestion.error && (
        <div style={{ marginBottom: 14 }}>
          <Alert>{gestion.error}</Alert>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 14 }}>
          <Alert>{error}</Alert>
        </div>
      )}
      {cargando && items.length === 0 && !error && (
        <div role="status" style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif" }}>
          Cargando catálogo…
        </div>
      )}
      {sinResultados && (
        <div
          role="status"
          style={{
            color: C.textMuted,
            fontFamily: "'Inter',sans-serif",
            fontSize: 14,
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          No hay recursos disponibles para el criterio seleccionado.
        </div>
      )}

      {viewMode === "grid" && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          {filtered.map((eq) => (
            <EquipmentCard
              key={eq.id}
              eq={eq}
              role={role}
              onSelect={setDetalle}
              onAddToCart={onAddToCart}
              onEdit={(e) => setDialogo({ modo: "edicion", equipo: e })}
              onDelete={(id) => {
                const equipo = items.find((e) => e.id === id)
                if (equipo) void gestion.cambiarActivo(equipo)
              }}
            />
          ))}
        </div>
      )}
      {viewMode === "list" && filtered.length > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {filtered.map((eq, i) => (
            <div
              key={eq.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetalle(eq)}
              onKeyDown={(ev) => {
                if (ev.target !== ev.currentTarget || (ev.key !== "Enter" && ev.key !== " ")) return
                ev.preventDefault()
                setDetalle(eq)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom:
                  i < filtered.length - 1
                    ? `1px solid ${C.borderLight}`
                    : "none",
                cursor: "pointer",
                textAlign: "left",
                opacity: eq.activo ? 1 : 0.6,
              }}
            >
              {eq.image ? (
                <img
                  src={eq.image}
                  alt={eq.name}
                  style={{
                    width: 56,
                    height: 42,
                    objectFit: "cover",
                    borderRadius: 9,
                    flexShrink: 0,
                    filter: eq.maintenance ? "grayscale(40%)" : "none",
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{ width: 56, height: 42, borderRadius: 9, flexShrink: 0, background: C.bg }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {eq.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 11.5,
                    color: C.textMuted,
                    marginTop: 2,
                  }}
                >
                  {eq.code} · {eq.brand}
                  {eq.sede ? ` · ${eq.sede}` : ""}
                  {eq.locker !== undefined ? ` · locker ${eq.locker}` : ""} · máx. {eq.maxDays} días
                </div>
              </div>
              <span
                style={{
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 11,
                  color: C.textFaint,
                  flexShrink: 0,
                }}
              >
                {eq.available_count}/{eq.quantity} uds.
              </span>
              <EstadoEquipo eq={eq} />
              <AgregarAlPedido compacto equipment={eq} role={role} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      )}

      {dialogo && (
        <EquipmentFormModal
          modo={dialogo.modo}
          equipo={dialogo.equipo}
          categorias={categorias}
          rol={usuario.rol}
          onClose={() => setDialogo(null)}
          onGuardado={() => {
            setDialogo(null)
            recargar()
          }}
        />
      )}
      {detalle && (
        <EquipmentDetailModal
          equipment={detalle}
          role={role}
          sede={sede}
          onClose={() => setDetalle(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  )
}
