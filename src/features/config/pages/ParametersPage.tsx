import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, useInputStyle } from "../../../components/ui/Form"
import { useC } from "../../../theme"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useUsuario } from "../../auth/AuthContext"
import {
  actualizarParametro,
  convertirValor,
  correoValido,
  esCorreoContacto,
  historialParametro,
  listarParametros,
} from "../services/configApi"
import type { ParametroDTO, ParametroHistorialDTO, ValorParametro } from "../types"

const mostrar = (v: ValorParametro) => (typeof v === "boolean" ? (v ? "Sí" : "No") : String(v))

/** El correo de contacto de una sede arranca vacío: "sin configurar" (SPEC-09 D-05). */
const SIN_CONFIGURAR = "Sin configurar"

/**
 * Panel de Parámetros Globales (GLO-03): el SUPERADMIN edita; el ADMIN_LOCAL consulta.
 * Desde SPEC-09 el horario y el correo de contacto se cargan por sede; las claves
 * globales de horario quedan obsoletas y sin edición (`editable = false`).
 */
export function ParametersPage() {
  const usuario = useUsuario()
  const puedeEditar = usuario.rol === "SUPERADMIN"
  const [parametros, setParametros] = useState<ParametroDTO[]>([])
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = useCallback(
    () =>
      listarParametros()
        .then(setParametros)
        .catch((e) => setError(mensajeDeError(e))),
    [],
  )
  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 16, alignContent: "start" }}>
      {!puedeEditar && <Alert tipo="info">Sólo el Superadministrador puede modificar estos valores.</Alert>}
      {error && <Alert>{error}</Alert>}
      {aviso && <Alert tipo="ok">{aviso}</Alert>}
      <Card title="Reglas operativas del laboratorio">
        <div style={{ display: "grid", gap: 10 }}>
          {parametros.map((p) => (
            <FilaParametro
              key={p.clave}
              parametro={p}
              puedeEditar={puedeEditar && p.editable}
              onGuardado={(nuevo) => {
                setError(null)
                setParametros((prev) => prev.map((x) => (x.clave === nuevo.clave ? nuevo : x)))
                setAviso(`"${nuevo.descripcion}" actualizado. Rige para las solicitudes nuevas.`)
              }}
              onConflicto={(mensaje) => {
                setAviso(null)
                setError(mensaje)
                cargar()
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

function FilaParametro({
  parametro: p,
  puedeEditar,
  onGuardado,
  onConflicto,
}: {
  parametro: ParametroDTO
  puedeEditar: boolean
  onGuardado: (p: ParametroDTO) => void
  onConflicto: (mensaje: string) => void
}) {
  const C = useC()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(String(p.valor))
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [historial, setHistorial] = useState<ParametroHistorialDTO[] | null>(null)
  const esCorreo = esCorreoContacto(p.clave)
  const correoInvalido = esCorreo && texto.trim() !== "" && !correoValido(texto)
  const input = useInputStyle()
  const inputCorreo = useInputStyle(correoInvalido)

  useEffect(() => setTexto(String(p.valor)), [p.valor])

  const guardar = async () => {
    setError(null)
    if (esCorreo && !correoValido(texto)) {
      setError("Ingresá un correo válido, por ejemplo laboratorio@untdf.edu.ar.")
      return
    }
    const valor = esCorreo ? texto.trim().toLowerCase() : convertirValor(p.tipo, texto)
    if (valor === null) {
      setError(p.tipo === "HORA" ? "Formato HH:MM." : "Valor inválido para el tipo del parámetro.")
      return
    }
    try {
      onGuardado(await actualizarParametro(p.clave, valor, p.version, motivo.trim() || undefined))
      setEditando(false)
      setMotivo("")
      setHistorial(null)
    } catch (e) {
      if (e instanceof ApiError && e.code === "CONFLICTO_VERSION") {
        setEditando(false)
        onConflicto("Otra persona modificó este parámetro mientras lo editabas. Se recargaron los valores vigentes.")
        return
      }
      setError(mensajeDeError(e))
    }
  }

  const verHistorial = async () => {
    if (historial) return setHistorial(null)
    try {
      setHistorial(await historialParametro(p.clave))
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const rango =
    p.valor_min !== null || p.valor_max !== null
      ? `Rango ${p.valor_min ?? "—"} a ${p.valor_max ?? "—"}${p.unidad ? ` ${p.unidad}` : ""}`
      : null
  const chico: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }

  return (
    <div
      data-clave={p.clave}
      style={{ border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: "12px 14px", display: "grid", gap: 8 }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.text }}>
            {p.descripcion}
          </div>
          <div style={chico}>
            <code>{p.clave}</code>
            {rango && ` · ${rango}`} · versión {p.version}
          </div>
        </div>
        {editando ? (
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {p.tipo === "BOOLEANO" ? (
              <select value={texto} onChange={(e) => setTexto(e.target.value)} style={{ ...input, width: 100 }}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type={esCorreo ? "email" : p.tipo === "HORA" ? "time" : p.tipo === "TEXTO" ? "text" : "number"}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={esCorreo ? "laboratorio@untdf.edu.ar" : undefined}
                aria-invalid={correoInvalido || undefined}
                aria-label={p.descripcion}
                style={{ ...(esCorreo ? inputCorreo : input), width: esCorreo ? 260 : p.tipo === "TEXTO" ? 220 : 110 }}
              />
            )}
            <input
              placeholder="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ ...input, width: 200 }}
            />
            <Button onClick={guardar} disabled={correoInvalido}>
              Guardar
            </Button>
            <Button variant="ghost" onClick={() => (setEditando(false), setTexto(String(p.valor)), setError(null))}>
              Cancelar
            </Button>
          </span>
        ) : (
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {esCorreo && p.valor === "" ? (
              <em style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textFaint }}>{SIN_CONFIGURAR}</em>
            ) : (
              <strong style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, color: C.crimson }}>
                {mostrar(p.valor)}
                {p.unidad ? ` ${p.unidad}` : ""}
              </strong>
            )}
            {puedeEditar && (
              <Button variant="ghost" onClick={() => setEditando(true)}>
                Editar
              </Button>
            )}
            <Button variant="ghost" onClick={verHistorial}>
              {historial ? "Ocultar historial" : "Historial"}
            </Button>
          </span>
        )}
      </div>
      {editando && correoInvalido && !error && (
        <div style={{ ...chico, color: C.crimson }}>Todavía no es un correo válido.</div>
      )}
      {error && <Alert>{error}</Alert>}
      {historial && (
        <div style={chico}>
          {historial.length === 0
            ? "Sin modificaciones desde la carga inicial."
            : historial.map((h) => (
                <div key={h.version}>
                  v{h.version} · {new Date(h.created_at).toLocaleString()} ·{" "}
                  {esCorreo && h.valor_anterior === "" ? SIN_CONFIGURAR : mostrar(h.valor_anterior)} →{" "}
                  {mostrar(h.valor_nuevo)}
                  {h.motivo ? ` · ${h.motivo}` : ""}
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
