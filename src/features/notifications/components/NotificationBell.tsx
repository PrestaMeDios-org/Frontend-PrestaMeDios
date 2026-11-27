import { useEffect, useRef, useState } from "react"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useResumenNotificaciones } from "../hooks/useResumenNotificaciones"
import { marcablesAlAbrir, toNotificacion } from "../services/mappers"
import {
  leerTodasLasNotificaciones,
  listarNotificaciones,
  marcarNotificacionLeida,
} from "../services/notificationsApi"
import type { Notificacion } from "../types"

const ULTIMAS = 20

// Campanita (NOV-04, SPEC-06 §8): número de no leídas, panel con las últimas 20 y las
// críticas arriba y destacadas. Al abrirla se marcan las normales; las críticas sólo al
// hacerles clic (RN-N9). Reemplaza la maqueta `NOTIFICATIONS_DATA` de `Navbar.tsx`.
export function NotificationBell() {
  const C = useC()
  const { resumen, refrescar } = useResumenNotificaciones()
  const [abierta, setAbierta] = useState(false)
  const [items, setItems] = useState<Notificacion[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierta) return
    const alClic = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierta(false)
    }
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false)
    document.addEventListener("mousedown", alClic)
    document.addEventListener("keydown", alTeclear)
    return () => {
      document.removeEventListener("mousedown", alClic)
      document.removeEventListener("keydown", alTeclear)
    }
  }, [abierta])

  const abrir = async () => {
    setAbierta(true)
    setCargando(true)
    setError(null)
    try {
      const page = await listarNotificaciones({ limit: ULTIMAS })
      const lista = page.items.map(toNotificacion)
      // Se muestran como estaban al abrir (las nuevas, resaltadas) y se marcan de fondo.
      setItems(lista)
      setTotal(page.total)
      const marcar = marcablesAlAbrir(lista)
      if (marcar.length) {
        await Promise.allSettled(marcar.map(marcarNotificacionLeida))
        refrescar()
      }
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron cargar las notificaciones."))
    } finally {
      setCargando(false)
    }
  }

  const abrirCritica = async (n: Notificacion) => {
    if (!n.critica || n.leida) return
    try {
      await marcarNotificacionLeida(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
      refrescar()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo marcar la notificación."))
    }
  }

  const leerTodas = async () => {
    try {
      await leerTodasLasNotificaciones()
      setItems((prev) => prev.map((x) => (x.critica ? x : { ...x, leida: true })))
      refrescar()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron marcar las notificaciones."))
    }
  }

  const noLeidas = resumen?.no_leidas ?? 0
  const criticas = resumen?.criticas_no_leidas ?? 0
  const etiqueta = noLeidas > 99 ? "99+" : String(noLeidas)

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => (abierta ? setAbierta(false) : void abrir())}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"}
        title="Notificaciones"
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          border: `1px solid ${C.border}`,
          background: abierta ? C.crimsonLight : C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          color: abierta ? C.crimson : C.textMuted,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6V9.5L2 11H14L12.5 9.5V6C12.5 3.5 10.5 1.5 8 1.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M6.5 11C6.5 11.83 7.17 12.5 8 12.5S9.5 11.83 9.5 11" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {noLeidas > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              padding: "0 4px",
              borderRadius: 9,
              background: criticas > 0 ? C.occupied : C.crimson,
              color: "white",
              border: `2px solid ${C.card}`,
              fontFamily: "'Inter',sans-serif",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "14px",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {etiqueta}
          </span>
        )}
      </button>

      {abierta && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          style={{
            position: "absolute",
            top: 44,
            right: 0,
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            background: C.card,
            borderRadius: 16,
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          <div
            style={{
              padding: "12px 16px 10px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: C.text }}>
              Notificaciones
            </span>
            {items.some((n) => !n.critica && !n.leida) || noLeidas > criticas ? (
              <button
                type="button"
                onClick={leerTodas}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  color: C.crimson,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Marcar todas como leídas
              </button>
            ) : (
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.textFaint }}>
                {total} en total
              </span>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {error && (
              <p style={{ margin: 0, padding: "12px 16px", fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.occupied }}>
                {error}
              </p>
            )}
            {cargando && !items.length ? (
              <p style={{ margin: 0, padding: "18px 16px", fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
                Cargando…
              </p>
            ) : !items.length && !error ? (
              <p
                style={{
                  margin: 0,
                  padding: "26px 16px",
                  textAlign: "center",
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 13,
                  color: C.textFaint,
                }}
              >
                No tenés notificaciones.
              </p>
            ) : (
              items.map((n, i) => (
                <Item key={n.id} n={n} ultimo={i === items.length - 1} onAbrir={() => abrirCritica(n)} />
              ))
            )}
          </div>

          {total > items.length && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: `1px solid ${C.border}`,
                fontFamily: "'Inter',sans-serif",
                fontSize: 11,
                color: C.textFaint,
                textAlign: "center",
              }}
            >
              Mostrando las últimas {items.length} de {total}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Item({ n, ultimo, onAbrir }: { n: Notificacion; ultimo: boolean; onAbrir: () => void }) {
  const C = useC()
  const color = n.critica ? { dot: C.occupied, bg: C.occupiedBg } : { dot: C.mine, bg: C.mineBg }
  const pendienteCritica = n.critica && !n.leida
  const contenido = (
    <>
      <span
        aria-hidden="true"
        style={{ width: 9, height: 9, borderRadius: "50%", background: color.dot, flexShrink: 0, marginTop: 5 }}
      />
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
        <span
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 13,
            fontWeight: n.leida ? 500 : 700,
            color: n.critica ? C.occupied : C.text,
            lineHeight: 1.25,
          }}
        >
          {n.critica && "⚠ "}
          {n.titulo}
        </span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.textMuted, lineHeight: 1.5, overflowWrap: "anywhere" }}>
          {n.mensaje}
        </span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: C.textFaint, marginTop: 2 }}>
          {n.creadaLabel}
          {pendienteCritica && " · Tocá para marcarla como leída"}
        </span>
      </span>
    </>
  )
  const estilo = {
    width: "100%",
    padding: "11px 16px",
    border: "none",
    borderBottom: ultimo ? "none" : `1px solid ${C.borderLight}`,
    borderLeft: pendienteCritica ? `3px solid ${C.occupied}` : "3px solid transparent",
    background: n.leida ? "transparent" : `${color.bg}88`,
    display: "flex",
    gap: 11,
    alignItems: "flex-start",
    boxSizing: "border-box" as const,
  }
  return pendienteCritica ? (
    <button type="button" onClick={onAbrir} style={{ ...estilo, cursor: "pointer" }}>
      {contenido}
    </button>
  ) : (
    <div style={estilo}>{contenido}</div>
  )
}
