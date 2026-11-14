import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useC } from "../../theme"
import { useInputStyle } from "./Form"

// Diálogos de confirmación y de texto con el estilo de la app (SPEC-10 V-11). Reemplazan a
// window.confirm y window.prompt: además de verse fuera de estilo, algunos navegadores
// (como el panel embebido de la app de escritorio) los bloquean y devuelven "Cancelar" sin
// mostrarlos, y la acción no hace nada.

interface OpcionesConfirmar {
  titulo: string
  mensaje?: string
  /** Texto del botón principal. */
  aceptar?: string
  cancelar?: string
  /** Botón principal en rojo (acciones destructivas). */
  peligro?: boolean
}

interface OpcionesTexto {
  titulo: string
  etiqueta: string
  aceptar?: string
  /** Largo mínimo después de recortar espacios. */
  minimo?: number
  placeholder?: string
}

type Pedido =
  | { tipo: "confirmar"; op: OpcionesConfirmar; resolver: (ok: boolean) => void }
  | { tipo: "texto"; op: OpcionesTexto; resolver: (texto: string | null) => void }

interface Api {
  confirmar: (op: OpcionesConfirmar) => Promise<boolean>
  pedirTexto: (op: OpcionesTexto) => Promise<string | null>
}

const Ctx = createContext<Api | null>(null)

export function DialogoProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const confirmar = useCallback(
    (op: OpcionesConfirmar) => new Promise<boolean>((resolver) => setPedido({ tipo: "confirmar", op, resolver })),
    [],
  )
  const pedirTexto = useCallback(
    (op: OpcionesTexto) => new Promise<string | null>((resolver) => setPedido({ tipo: "texto", op, resolver })),
    [],
  )
  const cerrar = (valor: boolean | string | null) => {
    if (!pedido) return
    if (pedido.tipo === "confirmar") pedido.resolver(valor === true)
    else pedido.resolver(typeof valor === "string" ? valor : null)
    setPedido(null)
  }
  return (
    <Ctx.Provider value={{ confirmar, pedirTexto }}>
      {children}
      {pedido && <Ventana pedido={pedido} onCerrar={cerrar} />}
    </Ctx.Provider>
  )
}

function useApi(): Api {
  const api = useContext(Ctx)
  if (!api) throw new Error("Falta <DialogoProvider> (components/ui/Dialogo.tsx).")
  return api
}

/** `await confirmar({ titulo, mensaje })` → `true` si acepta. */
export const useConfirmar = () => useApi().confirmar
/** `await pedirTexto({ titulo, etiqueta })` → el texto recortado, o `null` si cancela. */
export const usePedirTexto = () => useApi().pedirTexto

function Ventana({ pedido, onCerrar }: { pedido: Pedido; onCerrar: (v: boolean | string | null) => void }) {
  const C = useC()
  const estiloCampo = useInputStyle(false)
  const [texto, setTexto] = useState("")
  const campo = useRef<HTMLTextAreaElement>(null)
  const esTexto = pedido.tipo === "texto"
  const minimo = esTexto ? (pedido.op.minimo ?? 1) : 0
  const valido = !esTexto || texto.trim().length >= minimo
  const peligro = pedido.tipo === "confirmar" && pedido.op.peligro

  useEffect(() => {
    if (esTexto) campo.current?.focus()
  }, [esTexto])

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onCerrar(esTexto ? null : false)
      }
    }
    window.addEventListener("keydown", tecla, true)
    return () => window.removeEventListener("keydown", tecla, true)
  }, [esTexto, onCerrar])

  const aceptar = () => {
    if (!valido) return
    onCerrar(esTexto ? texto.trim() : true)
  }

  const boton = (principal: boolean) => ({
    padding: "10px 16px",
    borderRadius: 11,
    border: principal ? "none" : `1.5px solid ${C.border}`,
    background: principal ? (peligro ? C.occupied : C.crimson) : C.card,
    color: principal ? "white" : C.textMuted,
    fontFamily: "'Outfit',sans-serif",
    fontSize: 14,
    fontWeight: 700,
    cursor: principal && !valido ? "not-allowed" : "pointer",
    opacity: principal && !valido ? 0.55 : 1,
  })

  return (
    <div
      onClick={() => onCerrar(esTexto ? null : false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.12s ease-out",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: C.card,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h2 id="dialogo-titulo" style={{ margin: 0, fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800 }}>
          {pedido.op.titulo}
        </h2>
        {pedido.tipo === "confirmar" && pedido.op.mensaje && (
          <p style={{ margin: 0, fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.55, color: C.textMuted }}>
            {pedido.op.mensaje}
          </p>
        )}
        {pedido.tipo === "texto" && (
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>{pedido.op.etiqueta}</span>
            <textarea
              ref={campo}
              value={texto}
              rows={3}
              placeholder={pedido.op.placeholder}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  aceptar()
                }
              }}
              style={{ ...estiloCampo, resize: "vertical" }}
            />
            {minimo > 1 && (
              <span style={{ fontSize: 11.5, color: C.textFaint }}>Al menos {minimo} caracteres.</span>
            )}
          </label>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button type="button" style={boton(false)} onClick={() => onCerrar(esTexto ? null : false)}>
            {(pedido.tipo === "confirmar" && pedido.op.cancelar) || "Cancelar"}
          </button>
          <button type="button" style={boton(true)} onClick={aceptar} disabled={!valido} autoFocus={!esTexto}>
            {pedido.op.aceptar ?? (esTexto ? "Aceptar" : "Confirmar")}
          </button>
        </div>
      </div>
    </div>
  )
}
