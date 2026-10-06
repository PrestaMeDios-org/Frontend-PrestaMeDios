import { useState } from "react"
import { useC } from "../../../theme"
import { StatusBadge } from "../../../components/ui/Badge"
import { EquipmentCard } from "../components/EquipmentCard"
import { CatalogFilters } from "../components/CatalogFilters"
import { EQUIPMENT_INIT, CATEGORY_INIT } from "../services/mockInventory"
import type { Equipment } from "../types"
import type { Role } from "../../../types"

// Página del catálogo: buscador + filtros + grilla/lista de equipos.
export function CatalogPage({
  role = "student",
  userSede = "Ushuaia",
  onSelect,
  onAddToCart,
  onEdit,
  onDelete,
}: {
  role?: Role
  userSede?: string
  onSelect?: (e: Equipment) => void
  onAddToCart?: (e: Equipment) => void
  onEdit?: (e: Equipment) => void
  onDelete?: (id: string) => void
}) {
  const C = useC()
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterSede, setFilterSede] = useState("")

  const sedeFilter =
    (role === "student" || role === "teacher") && userSede
      ? userSede
      : filterSede || undefined

  const filtered = EQUIPMENT_INIT.filter(
    (e) =>
      (filter === "all" || e.category === filter) &&
      (!sedeFilter || e.sede === sedeFilter) &&
      (search === "" ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        e.brand.toLowerCase().includes(search.toLowerCase())),
  )

  const counts = CATEGORY_INIT.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = EQUIPMENT_INIT.filter((e) => e.category === cat.id).length
    return acc
  }, {})

  const canBook = (e: Equipment) => e.available && !e.maintenance

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
        categories={CATEGORY_INIT}
        totalCount={EQUIPMENT_INIT.length}
        filteredCount={filtered.length}
        availableCount={filtered.filter(canBook).length}
        counts={counts}
        role={role}
        userSede={userSede}
      />
      {viewMode === "grid" && (
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
              onSelect={onSelect}
              onAddToCart={onAddToCart}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
      {viewMode === "list" && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {filtered.map((eq, i) => (
            <button
              key={eq.id}
              onClick={() => canBook(eq) && onSelect?.(eq)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                padding: "12px 16px",
                background: "transparent",
                border: "none",
                borderBottom:
                  i < filtered.length - 1
                    ? `1px solid ${C.borderLight}`
                    : "none",
                cursor: canBook(eq) ? "pointer" : "default",
                textAlign: "left",
              }}
            >
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
                  {eq.code} · {eq.brand} · {eq.sede} · máx. {eq.maxDays} días
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
              <StatusBadge
                available={eq.available}
                maintenance={eq.maintenance}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
