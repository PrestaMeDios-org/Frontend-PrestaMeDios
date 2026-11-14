import { useMemo, useState, type CSSProperties } from "react"
import { useC } from "../../../theme"
import { Alert } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"
import { SearchInput } from "../../../components/ui/Input"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { EquipmentFormModal } from "../components/EquipmentFormModal"
import { LockerTable } from "../components/LockerTable"
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
  // SPEC-10 V-16: chips de categoría como en el catálogo (sólo filtran lo que ya está cargado).
  const [categoria, setCategoria] = useState("all")
  // SPEC-10 V-17 (MOMENTÁNEO): ver la misma tabla agrupada por locker.
  const [vista, setVista] = useState<"equipo" | "locker">("equipo")

  const sede = puedeElegir ? filtroSede || sedeVista || undefined : undefined
  const { items, categorias, cargando, error, recargar } = useCatalogo({
    sede,
    q,
    incluirInactivos: true,
  })
  const gestion = useGestion(recargar)
  const conteo = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of items) c[e.category] = (c[e.category] ?? 0) + 1
    return c
  }, [items])
  const visibles = categoria === "all" ? items : items.filter((e) => e.category === categoria)
  const chip = (activo: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 13px",
    borderRadius: 100,
    border: `1.5px solid ${activo ? C.crimson : C.border}`,
    background: activo ? C.crimson : C.card,
    color: activo ? "white" : C.textMuted,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  })
  const contador = (activo: boolean, n: number) => (
    <span
      style={{
        background: activo ? "rgba(255,255,255,0.22)" : C.bg,
        borderRadius: 100,
        padding: "0 5px",
        fontSize: 10.5,
        fontWeight: 700,
      }}
    >
      {n}
    </span>
  )

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

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" aria-pressed={categoria === "all"} onClick={() => setCategoria("all")} style={chip(categoria === "all")}>
          Todo {contador(categoria === "all", items.length)}
        </button>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            aria-pressed={categoria === cat.id}
            onClick={() => setCategoria(cat.id)}
            style={chip(categoria === cat.id)}
          >
            {cat.label} {contador(categoria === cat.id, conteo[cat.id] ?? 0)}
          </button>
        ))}
        <div
          role="group"
          aria-label="Ver stock por"
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            padding: 3,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: C.card,
          }}
        >
          <span
            style={{
              padding: "0 8px 0 6px",
              fontFamily: "'Outfit',sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: C.textFaint,
            }}
          >
            VER POR:
          </span>
          {(["equipo", "locker"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => setVista(v)}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "none",
                background: vista === v ? C.crimson : "transparent",
                color: vista === v ? "white" : C.textMuted,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {v === "equipo" ? "Equipo" : "Locker"}
            </button>
          ))}
        </div>
      </div>

      {gestion.error && <Alert>{gestion.error}</Alert>}
      {error && <Alert>{error}</Alert>}

      {cargando && items.length === 0 && !error ? (
        <div role="status" style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif" }}>
          Cargando stock…
        </div>
      ) : visibles.length === 0 && !error ? (
        <div style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif", padding: "30px 0", textAlign: "center" }}>
          {q.trim() || categoria !== "all"
            ? "No hay equipos que coincidan con la búsqueda."
            : "Todavía no hay equipos cargados en esta sede."}
        </div>
      ) : vista === "locker" ? (
        <LockerTable
          items={visibles}
          ocupado={gestion.ocupado}
          onEstado={(_e, unidad, accion) => gestion.cambiarEstado(unidad, accion)}
          onEditarUnidad={(equipo, unidad) => setDialogo({ tipo: "unidad", equipo, unidad })}
        />
      ) : (
        <StockTable
          items={visibles}
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
