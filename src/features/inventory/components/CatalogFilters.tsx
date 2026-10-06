import { useC } from "../../../theme"
import { Ico } from "../../../components/ui/icons"
import { SearchInput } from "../../../components/ui/Input"
import type { CSSProperties } from "react"
import type { Category } from "../types"
import type { Role } from "../../../types"

// Filtros y buscador del catálogo: búsqueda, vista, sede y chips de categoría.
export function CatalogFilters({
  search,
  onSearch,
  viewMode,
  onViewMode,
  filterSede,
  onFilterSede,
  filter,
  onFilter,
  categories,
  totalCount,
  filteredCount,
  availableCount,
  counts,
  role,
  userSede,
  onNewEquipment,
}: {
  search: string
  onSearch: (v: string) => void
  viewMode: "grid" | "list"
  onViewMode: (v: "grid" | "list") => void
  filterSede: string
  onFilterSede: (v: string) => void
  filter: string
  onFilter: (v: string) => void
  categories: Category[]
  totalCount: number
  filteredCount: number
  availableCount: number
  counts: Record<string, number>
  role: Role
  userSede?: string
  onNewEquipment?: () => void
}) {
  const C = useC()

  const chipStyle = (active: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 13px",
    borderRadius: 100,
    border: `1.5px solid ${active ? C.crimson : C.border}`,
    background: active ? C.crimson : C.card,
    color: active ? "white" : C.textMuted,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  })

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Buscar equipo, código o marca..."
        />
        <div
          style={{
            display: "flex",
            background: C.bg,
            borderRadius: 9,
            padding: 3,
            border: `1px solid ${C.border}`,
          }}
        >
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewMode(v)}
              style={{
                width: 30,
                height: 28,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: viewMode === v ? C.card : "transparent",
                color: viewMode === v ? C.crimson : C.textFaint,
              }}
            >
              {v === "grid" ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <rect width="5" height="5" rx="1.5" />
                  <rect x="7" width="5" height="5" rx="1.5" />
                  <rect y="7" width="5" height="5" rx="1.5" />
                  <rect x="7" y="7" width="5" height="5" rx="1.5" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M0 2H12M0 6H12M0 10H12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
        {(role === "student" || role === "teacher") && userSede && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: 9,
              background: C.mineBg,
              border: `1px solid ${C.mine}40`,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: C.mine,
              }}
            >
              📍 {userSede}
            </span>
          </div>
        )}
        {role !== "student" && role !== "teacher" && (
          <div style={{ position: "relative" }}>
            <select
              value={filterSede}
              onChange={(e) => onFilterSede(e.target.value)}
              style={{
                padding: "8px 28px 8px 11px",
                border: `1.5px solid ${filterSede ? C.crimson : C.border}`,
                borderRadius: 9,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 13,
                color: filterSede ? C.text : C.textFaint,
                background: C.card,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Todas las sedes</option>
              <option value="Ushuaia">Ushuaia</option>
              <option value="Río Grande">Río Grande</option>
            </select>
            <span
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: C.textFaint,
              }}
            >
              {Ico.chevDown}
            </span>
          </div>
        )}
        <span
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            color: C.textFaint,
            marginLeft: "auto",
          }}
        >
          {availableCount} disp. de {filteredCount}
        </span>
        {role === "admin" && (
          <button
            onClick={onNewEquipment}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              borderRadius: 11,
              border: "none",
              background: C.crimson,
              color: "white",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <span>{Ico.plus}</span>Nuevo Equipo
          </button>
        )}
      </div>
      <div
        style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}
      >
        <button onClick={() => onFilter("all")} style={chipStyle(filter === "all")}>
          Todo{" "}
          <span
            style={{
              background: filter === "all" ? "rgba(255,255,255,0.22)" : C.bg,
              borderRadius: 100,
              padding: "0 5px",
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {totalCount}
          </span>
        </button>
        {categories.map((cat) => {
          const active = filter === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onFilter(cat.id)}
              style={chipStyle(active)}
            >
              {cat.label}
              <span
                style={{
                  background: active ? "rgba(255,255,255,0.22)" : C.bg,
                  borderRadius: 100,
                  padding: "0 5px",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {counts[cat.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
