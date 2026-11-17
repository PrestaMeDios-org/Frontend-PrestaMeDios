import { useState } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { esAdmin } from "../../auth/roles"
import { ComunicadoForm } from "../components/ComunicadoForm"
import { ComunicadosList } from "../components/ComunicadosList"
import { PortalInfo } from "../components/PortalInfo"
import { useComunicados } from "../hooks/useComunicados"
import { cambiarEstadoComunicado } from "../services/notificationsApi"
import type { Comunicado } from "../types"
import { useConfirmar } from "../../../components/ui/Dialogo"
import { usePortadas } from "../portada/usePortadas" // MOMENTÁNEO (SPEC-10 M-02)

type Pestana = "comunicados" | "portal"

// Pantalla "Novedades" (NOV-01, NOV-02): comunicados de la sede más los globales, y el
// portal con la información institucional.
export function NewsPage() {
  const C = useC()
  const usuario = useUsuario()
  const { sedeVista } = useSede()
  const admin = esAdmin(usuario.rol)
  const [pestana, setPestana] = useState<Pestana>("comunicados")
  const [verArchivados, setVerArchivados] = useState(false)
  const [formulario, setFormulario] = useState<{ comunicado?: Comunicado } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)

  // Sólo el SUPERADMIN filtra por sede (la del selector global; "Ambas" = sin filtro).
  const sede = usuario.rol === "SUPERADMIN" ? (sedeVista ?? undefined) : undefined
  const { items, total, pagina, paginas, setPagina, cargando, error, recargar } = useComunicados({
    sede,
    incluirArchivados: admin && verArchivados,
  })
  const [versionPortadas, setVersionPortadas] = useState(0) // MOMENTÁNEO (SPEC-10 M-02)
  const portadas = usePortadas(items.map((c) => c.id), versionPortadas) // MOMENTÁNEO (SPEC-10 M-02)

  const confirmar = useConfirmar() // SPEC-10 V-11: diálogo propio en lugar de window.confirm
  const alternarEstado = async (c: Comunicado) => {
    const archivar = c.estado === "PUBLICADO"
    if (
      archivar &&
      !(await confirmar({
        titulo: "¿Archivar el comunicado?",
        mensaje: `"${c.titulo}" dejará de verse para estudiantes y docentes. Lo podés reactivar desde "Mostrar archivados".`,
        aceptar: "Archivar",
      }))
    )
      return
    setOcupado(c.id)
    setErrorAccion(null)
    try {
      await cambiarEstadoComunicado(c.id, archivar ? "ARCHIVADO" : "PUBLICADO")
      setAviso(archivar ? "Comunicado archivado." : "Comunicado reactivado.")
      recargar()
    } catch (e) {
      setErrorAccion(mensajeDeError(e, "No se pudo cambiar el estado."))
    } finally {
      setOcupado(null)
    }
  }

  const tab = (clave: Pestana, etiqueta: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={pestana === clave}
      onClick={() => setPestana(clave)}
      style={{
        padding: "8px 14px",
        border: "none",
        borderBottom: `2px solid ${pestana === clave ? C.crimson : "transparent"}`,
        background: "transparent",
        color: pestana === clave ? C.crimson : C.textMuted,
        fontFamily: "'Outfit',sans-serif",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {etiqueta}
    </button>
  )

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 16, alignContent: "start" }}>
      <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}` }}>
        {tab("comunicados", "Comunicados")}
        {tab("portal", "Información del laboratorio")}
      </div>

      {pestana === "portal" && <PortalInfo />}

      {pestana === "comunicados" && (
        <>
          {admin && !formulario && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <label
                style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted }}
              >
                <input type="checkbox" checked={verArchivados} onChange={(e) => setVerArchivados(e.target.checked)} />
                Mostrar archivados
              </label>
              <Button
                onClick={() => {
                  setAviso(null)
                  setFormulario({})
                }}
              >
                Nuevo comunicado
              </Button>
            </div>
          )}

          {formulario && (
            <ComunicadoForm
              key={formulario.comunicado?.id ?? "nuevo"}
              rol={usuario.rol}
              sedePropia={usuario.sede}
              comunicado={formulario.comunicado}
              onCancelar={() => setFormulario(null)}
              portadaActual={formulario.comunicado ? portadas.get(formulario.comunicado.id) : undefined}
              onGuardado={(mensaje) => {
                setFormulario(null)
                setAviso(mensaje)
                recargar()
                setVersionPortadas((v) => v + 1) // MOMENTÁNEO (SPEC-10 M-02)
              }}
            />
          )}

          {aviso && <Alert tipo="ok">{aviso}</Alert>}
          {errorAccion && <Alert>{errorAccion}</Alert>}
          {error && <Alert>{error}</Alert>}

          {cargando && !items.length ? (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, color: C.textMuted }}>Cargando comunicados…</p>
          ) : !error && !items.length ? (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: C.textFaint,
                fontFamily: "'Outfit',sans-serif",
                fontSize: 14,
                border: `1px dashed ${C.border}`,
                borderRadius: 16,
              }}
            >
              No hay comunicados por ahora.
            </div>
          ) : (
            <ComunicadosList
              items={items}
              rol={usuario.rol}
              ocupado={ocupado}
              onEditar={(c) => {
                setAviso(null)
                setFormulario({ comunicado: c })
              }}
              onCambiarEstado={alternarEstado}
              portadas={portadas} // MOMENTÁNEO (SPEC-10 M-02)
            />
          )}

          {paginas > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Button variant="ghost" disabled={pagina === 0 || cargando} onClick={() => setPagina(pagina - 1)}>
                Anterior
              </Button>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
                Página {pagina + 1} de {paginas} · {total} comunicados
              </span>
              <Button variant="ghost" disabled={pagina + 1 >= paginas || cargando} onClick={() => setPagina(pagina + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
