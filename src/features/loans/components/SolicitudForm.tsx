import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Field, SelectField, TextField, useInputStyle } from "../../../components/ui/Form"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { useUsuario } from "../../auth/AuthContext"
import { Modal } from "../../inventory/components/Modal"
import { useCarrito } from "../CarritoContext"
import { crearOrden, obtenerReglas, subirAval } from "../services/loansApi"
import {
  AVAL_MAX_MB,
  aSolicitudNueva,
  fechaHoyLab,
  formularioInicial,
  limiteDias,
  mensajeDeErrorSolicitud,
  opcionesDeHora,
  validarSolicitud,
  type FormularioSolicitud,
} from "../services/solicitud"
import type { Orden, Reglas } from "../types"

interface Props {
  onClose: () => void
  /** Lleva a "Mis solicitudes" después de enviar. */
  onVerSolicitudes: () => void
}

/**
 * Formulario unificado de solicitud (SPEC-05 F1.4, PRE-03…PRE-07, PRE-09): fechas y horas
 * dentro de la franja de `GET /reglas`, asignatura (sólo estudiantes), aval PDF si hay alta
 * gama y aceptación de la normativa. El backend vuelve a validar todo (P2.2).
 */
export function SolicitudForm({ onClose, onVerSolicitudes }: Props) {
  const C = useC()
  const usuario = useUsuario()
  const carrito = useCarrito()
  const [reglas, setReglas] = useState<Reglas | null>(null)
  const [errorReglas, setErrorReglas] = useState<string | null>(null)
  const [form, setForm] = useState<FormularioSolicitud | null>(null)
  const [intentado, setIntentado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  // El aval ya subido, para no volver a subirlo si el envío falla por otro motivo.
  const [avalSubido, setAvalSubido] = useState<{ archivo: File; id: string } | null>(null)
  const [enviada, setEnviada] = useState<Orden | null>(null)

  const requiereAsignatura = usuario.rol === "ESTUDIANTE"
  const items = carrito.items

  useEffect(() => {
    const control = new AbortController()
    obtenerReglas(control.signal)
      .then((r) => {
        setReglas(r)
        setForm(formularioInicial(r))
      })
      .catch((e) => {
        if (!control.signal.aborted) setErrorReglas(mensajeDeError(e, "No se pudieron cargar las reglas del laboratorio."))
      })
    return () => control.abort()
  }, [])

  const contexto = useMemo(
    () =>
      reglas && {
        reglas,
        items,
        requiereAsignatura,
        requiereAval: carrito.requiereAval,
      },
    [reglas, items, requiereAsignatura, carrito.requiereAval],
  )
  const errores = form && contexto && intentado ? validarSolicitud(form, contexto) : {}
  const horas = reglas ? opcionesDeHora(reglas.horarioApertura, reglas.horarioCierre) : []
  const hoy = fechaHoyLab()
  const estiloFecha = useInputStyle(false)
  const estiloFechaInvalida = useInputStyle(true)

  const cambiar = <K extends keyof FormularioSolicitud>(campo: K, valor: FormularioSolicitud[K]) => {
    setForm((f) => f && { ...f, [campo]: valor })
    setErrorServidor(null)
  }

  const enviar = async () => {
    if (!form || !contexto) return
    setIntentado(true)
    if (Object.keys(validarSolicitud(form, contexto)).length > 0) return
    setEnviando(true)
    setErrorServidor(null)
    try {
      let avalId: string | null = null
      if (carrito.requiereAval && form.aval) {
        avalId = avalSubido?.archivo === form.aval ? avalSubido.id : await subirAval(form.aval)
        setAvalSubido({ archivo: form.aval, id: avalId })
      }
      const orden = await crearOrden(aSolicitudNueva(form, carrito.equipamientoIds, contexto, avalId))
      carrito.vaciar()
      setEnviada(orden)
    } catch (e) {
      if (e instanceof ApiError && e.code === "ARCHIVO_INVALIDO") setAvalSubido(null)
      setErrorServidor(mensajeDeErrorSolicitud(e, items))
    } finally {
      setEnviando(false)
    }
  }

  const texto: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }

  if (enviada) {
    return (
      <Modal titulo="Solicitud enviada" onClose={onClose} ancho={520}>
        <Alert tipo="ok">
          Tu solicitud #{enviada.id} quedó <strong>pendiente</strong>. El laboratorio la va a revisar y
          te asigna los equipos al aprobarla.
        </Alert>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onVerSolicitudes}>Ver mis solicitudes</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal titulo="Solicitar equipos" onClose={onClose} ancho={620}>
      {errorReglas && <Alert>{errorReglas}</Alert>}
      {!form || !reglas ? (
        !errorReglas && <p style={tenue}>Cargando las reglas del laboratorio…</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void enviar()
          }}
          style={{ display: "grid", gap: 14 }}
        >
          <section style={{ display: "grid", gap: 6 }}>
            <span style={{ ...texto, fontWeight: 600 }}>Equipos ({carrito.total})</span>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 2 }}>
              {items.map((item) => (
                <li key={item.equipamientoId} style={texto}>
                  {item.cantidad} × {item.nombre}
                  <span style={tenue}>
                    {" "}
                    · hasta {limiteDias(item, reglas)} días{item.altaGama ? " · alta gama" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p style={tenue}>
            Horario de retiro y devolución: de {reglas.horarioApertura} a {reglas.horarioCierre}. El retiro se
            pide con al menos {reglas.anticipacionMinHoras} horas de anticipación.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Fecha de retiro" error={errores.fechaRetiro}>
              <input
                type="date"
                min={hoy}
                value={form.fechaRetiro}
                aria-invalid={Boolean(errores.fechaRetiro)}
                onChange={(e) => cambiar("fechaRetiro", e.target.value)}
                style={errores.fechaRetiro ? estiloFechaInvalida : estiloFecha}
              />
            </Field>
            <SelectField
              label="Hora de retiro"
              value={form.horaRetiro}
              onChange={(v) => cambiar("horaRetiro", v)}
              options={horas.map((h) => ({ value: h, label: h }))}
              error={errores.horaRetiro}
            />
            <Field label="Fecha de devolución" error={errores.fechaDevolucion}>
              <input
                type="date"
                min={form.fechaRetiro || hoy}
                value={form.fechaDevolucion}
                aria-invalid={Boolean(errores.fechaDevolucion)}
                onChange={(e) => cambiar("fechaDevolucion", e.target.value)}
                style={errores.fechaDevolucion ? estiloFechaInvalida : estiloFecha}
              />
            </Field>
            <SelectField
              label="Hora de devolución"
              value={form.horaDevolucion}
              onChange={(v) => cambiar("horaDevolucion", v)}
              options={horas.map((h) => ({ value: h, label: h }))}
              error={errores.horaDevolucion}
            />
          </div>

          {requiereAsignatura && (
            <TextField
              label="Código de asignatura"
              type="number"
              value={form.asignatura}
              onChange={(v) => cambiar("asignatura", v)}
              error={errores.asignatura}
              hint="Provisorio: el código numérico de la asignatura, hasta que el sistema tenga el catálogo de asignaturas."
            />
          )}

          {carrito.requiereAval && (
            <Field
              label="Aval de alta gama (PDF)"
              error={errores.aval}
              hint={`La resolución del Consejo (CICSE/ICSE). PDF de hasta ${AVAL_MAX_MB} MB.`}
            >
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => cambiar("aval", e.target.files?.[0] ?? null)}
                style={texto}
              />
            </Field>
          )}

          <Field label="Normativa" error={errores.aceptaNormativa}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.aceptaNormativa}
                onChange={(e) => cambiar("aceptaNormativa", e.target.checked)}
              />
              <span style={texto}>Acepto la normativa de préstamos del laboratorio.</span>
            </span>
          </Field>

          {errorServidor && <Alert>{errorServidor}</Alert>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={onClose} disabled={enviando}>
              Volver al pedido
            </Button>
            <Button type="submit" disabled={enviando || items.length === 0}>
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
