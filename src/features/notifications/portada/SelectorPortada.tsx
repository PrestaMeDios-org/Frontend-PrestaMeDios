// MOMENTÁNEO (SPEC-10 M-02): elección de la portada en el formulario del comunicado.
import { useEffect, useRef, useState } from "react"
import { useC } from "../../../theme"
import { BannerComunicado } from "../components/BannerComunicado"
import { LEYENDA_TEMA, type TemaComunicado } from "../services/tema"
import type { EleccionPortada } from "./portadaApi"
import { usePortadaUrl } from "./usePortadas"

const TEMAS: TemaComunicado[] = ["rojo", "amarillo", "azul", "verde"]
const NOMBRE: Record<TemaComunicado, string> = { rojo: "Rojo", amarillo: "Amarillo", azul: "Azul", verde: "Verde" }
const MAX_MB = 5

export function SelectorPortada({
  valor,
  onCambiar,
  temaAutomatico,
  comunicadoId,
}: {
  valor: EleccionPortada
  onCambiar: (e: EleccionPortada) => void
  /** Color que tendría con "Automática" (alcance y vencimiento, V-10). */
  temaAutomatico: TemaComunicado
  /** Para mostrar la foto ya guardada al editar. */
  comunicadoId?: number
}) {
  const C = useC()
  const input = useRef<HTMLInputElement>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fotoActual = usePortadaUrl(valor.tipo === "foto-actual" && comunicadoId ? comunicadoId : null)

  useEffect(() => {
    if (valor.tipo !== "foto") {
      setPrevia(null)
      return
    }
    const url = URL.createObjectURL(valor.archivo)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [valor])

  const elegirArchivo = (archivo: File | undefined) => {
    setError(null)
    if (!archivo) return
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return setError("Tiene que ser JPG, PNG o WebP.")
    if (archivo.size > MAX_MB * 1024 * 1024) return setError(`La foto supera los ${MAX_MB} MB.`)
    onCambiar({ tipo: "foto", archivo })
  }

  const opcion = (activa: boolean, etiqueta: string, contenido: React.ReactNode, onClick: () => void, titulo?: string) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      title={titulo}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: 4,
        border: `2px solid ${activa ? C.crimson : C.border}`,
        borderRadius: 12,
        background: C.card,
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      <div style={{ borderRadius: 8, overflow: "hidden", height: 46 }}>{contenido}</div>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, fontWeight: activa ? 700 : 500, color: activa ? C.crimson : C.textMuted }}>
        {etiqueta}
      </span>
    </button>
  )

  const mostrarFoto = previa ?? fotoActual
  const esFoto = valor.tipo === "foto" || valor.tipo === "foto-actual"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
        {opcion(
          valor.tipo === "auto",
          "Automática",
          <BannerComunicado tema={temaAutomatico} alto={46} />,
          () => onCambiar({ tipo: "auto" }),
          `Según el alcance y el vencimiento (hoy: ${LEYENDA_TEMA[temaAutomatico]})`,
        )}
        {TEMAS.map((t) =>
          opcion(
            valor.tipo === "tema" && valor.tema === t,
            NOMBRE[t],
            <BannerComunicado tema={t} alto={46} />,
            () => onCambiar({ tipo: "tema", tema: t }),
          ),
        )}
        {opcion(
          esFoto,
          esFoto ? "Cambiar foto" : "Subir foto",
          mostrarFoto ? (
            <img src={mostrarFoto} alt="" style={{ width: "100%", height: 46, objectFit: "cover", display: "block" }} />
          ) : (
            <div
              style={{
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: C.bg,
                border: `1.5px dashed ${C.border}`,
                borderRadius: 8,
                color: C.textMuted,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <rect x="2" y="3.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="6.5" cy="7.5" r="1.4" fill="currentColor" />
                <path d="M3 13L7.5 9.5L10.5 12L12.5 10.5L15 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </div>
          ),
          () => input.current?.click(),
          "JPG, PNG o WebP de hasta 5 MB",
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          elegirArchivo(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      {error && <span style={{ fontSize: 12, color: C.occupied }}>{error}</span>}
    </div>
  )
}
