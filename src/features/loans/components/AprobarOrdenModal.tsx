import { useEffect, useState, type CSSProperties } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Field, SelectField } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { Modal } from "../../inventory/components/Modal"
import { DatePicker } from "../../../components/ui/DatePicker"
import {
  aAjuste,
  aAsignaciones,
  asignacionInicial,
  mensajeDeErrorValidacion,
  retiroVencido,
  validarAjuste,
  validarSeleccion,
  type FormularioAjuste,
  type SeleccionUnidades,
} from "../services/bandeja"
import { caeEnFinDeSemana, fechaLab } from "../services/formato"
import { aprobarOrden, obtenerReglas, obtenerUnidadesLibres } from "../services/loansApi"
import { esFinDeSemana, fechaHoyLab, opcionesDeHora } from "../services/solicitud"
import type { LineaUnidadesLibres, Orden, Reglas } from "../types"

interface Props {
  orden: Orden
  /** Nombre de cada equipo y etiqueta de cada unidad, del stock del administrador. */
  nombres: Map<number, string>
  unidades: Map<number, string>
  onClose: () => void
  onAprobada: (orden: Orden) => void
}

/**
 * Aprobar una orden (PRE-10, RN-L11): una unidad por línea, elegida entre las libres para su
 * período (`GET /ordenes/{id}/unidades-libres`), y, si hace falta, un horario nuevo (PRE-18).
 */
export function AprobarOrdenModal({ orden, nombres, unidades, onClose, onAprobada }: Props) {
  const C = useC()
  const [lineas, setLineas] = useState<LineaUnidadesLibres[] | null>(null)
  const [reglas, setReglas] = useState<Reglas | null>(null)
  const [seleccion, setSeleccion] = useState<SeleccionUnidades>({})
  const vencido = retiroVencido(orden)
  const [ajustar, setAjustar] = useState(vencido)
  const [ajuste, setAjuste] = useState<FormularioAjuste>({
    fechaRetiro: "",
    horaRetiro: "",
    fechaDevolucion: "",
    horaDevolucion: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const control = new AbortController()
    Promise.all([obtenerUnidadesLibres(orden.id, control.signal), obtenerReglas(control.signal)])
      .then(([libres, r]) => {
        setLineas(libres)
        setSeleccion(asignacionInicial(libres))
        setReglas(r)
        setAjuste((a) => ({ ...a, horaRetiro: r.horarioApertura, horaDevolucion: r.horarioCierre }))
      })
      .catch((e) => {
        if (!control.signal.aborted) setError(mensajeDeError(e, "No se pudieron cargar las unidades libres."))
      })
    return () => control.abort()
  }, [orden.id])

  const etiqueta = (id: number) => unidades.get(id) ?? `Unidad #${id}`
  const horas = reglas ? opcionesDeHora(reglas.horarioApertura, reglas.horarioCierre) : []

  const aprobar = async () => {
    if (!lineas) return
    const problema = validarSeleccion(lineas, seleccion) ?? (ajustar ? validarAjuste(ajuste) : null)
    if (problema) {
      setError(problema)
      return
    }
    setEnviando(true)
    setError(null)
    try {
      onAprobada(await aprobarOrden(orden.id, aAsignaciones(lineas, seleccion), ajustar ? aAjuste(ajuste) : undefined))
    } catch (e) {
      setError(mensajeDeErrorValidacion(e, unidades))
    } finally {
      setEnviando(false)
    }
  }

  const texto: CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }
  const tenue: CSSProperties = { ...texto, fontSize: 12, color: C.textMuted }
  const fecha = (campo: "fechaRetiro" | "fechaDevolucion", label: string) => (
    <Field label={label}>
      {/* SPEC-10 §4.6 (V-01): selector de fecha común */}
      <DatePicker
        value={ajuste[campo]}
        onChange={(iso) => setAjuste((a) => ({ ...a, [campo]: iso }))}
        min={campo === "fechaDevolucion" && ajuste.fechaRetiro ? ajuste.fechaRetiro : fechaHoyLab()}
        rango={ajuste.fechaRetiro && ajuste.fechaDevolucion ? { desde: ajuste.fechaRetiro, hasta: ajuste.fechaDevolucion } : undefined}
        atenuarFinDeSemana
        ariaLabel={label}
      />
    </Field>
  )

  return (
    <Modal titulo={`Aprobar solicitud #${orden.id}`} onClose={onClose} ancho={620}>
      {orden.retiro && orden.devolucion && (
        <p style={{ ...texto, margin: 0 }}>
          {orden.solicitante?.nombreCompleto ?? `Usuario #${orden.solicitanteId}`} · retiro{" "}
          {fechaLab(orden.retiro)} · devolución {fechaLab(orden.devolucion)}
        </p>
      )}
      {vencido && (
        <Alert tipo="info">El retiro pedido ya pasó: para aprobarla, acordá un horario nuevo con el solicitante.</Alert>
      )}
      {!ajustar && orden.retiro && orden.devolucion && (caeEnFinDeSemana(orden.retiro) || caeEnFinDeSemana(orden.devolucion)) && (
        <Alert tipo="info">
          El retiro o la devolución pedidos caen en fin de semana, cuando el laboratorio normalmente no atiende.
          Podés aprobarla con otro horario o rechazarla.
        </Alert>
      )}

      {lineas === null ? (
        !error && <p style={tenue}>Buscando unidades libres…</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {lineas.map((linea, i) => {
            const nombre = nombres.get(linea.equipamientoId) ?? `Equipo #${linea.equipamientoId}`
            return linea.unidadIds.length === 0 ? (
              <Alert key={linea.lineaId}>
                {nombre}: no hay unidades libres para ese período. Rechazá la orden o ajustá el horario.
              </Alert>
            ) : (
              <SelectField
                key={linea.lineaId}
                label={`${i + 1}. ${nombre}`}
                value={String(seleccion[linea.lineaId] ?? "")}
                onChange={(v) => {
                  setSeleccion((s) => ({ ...s, [linea.lineaId]: v ? Number(v) : null }))
                  setError(null)
                }}
                options={[
                  { value: "", label: "Elegí una unidad…" },
                  ...linea.unidadIds.map((id) => ({ value: String(id), label: etiqueta(id) })),
                ]}
              />
            )
          })}
        </div>
      )}

      {reglas && (
        <label style={{ ...texto, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={ajustar} disabled={vencido} onChange={(e) => setAjustar(e.target.checked)} />
          Aprobar con otro horario (avisale al solicitante)
        </label>
      )}
      {ajustar && reglas && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {fecha("fechaRetiro", "Nuevo retiro")}
          <SelectField
            label="Hora"
            value={ajuste.horaRetiro}
            onChange={(v) => setAjuste((a) => ({ ...a, horaRetiro: v }))}
            options={horas.map((h) => ({ value: h, label: h }))}
          />
          {fecha("fechaDevolucion", "Nueva devolución")}
          <SelectField
            label="Hora"
            value={ajuste.horaDevolucion}
            onChange={(v) => setAjuste((a) => ({ ...a, horaDevolucion: v }))}
            options={horas.map((h) => ({ value: h, label: h }))}
          />
        </div>
      )}

      {ajustar && (esFinDeSemana(ajuste.fechaRetiro) || esFinDeSemana(ajuste.fechaDevolucion)) && (
        <Alert tipo="info">El nuevo horario cae en fin de semana, cuando el laboratorio normalmente no atiende.</Alert>
      )}

      {error && <Alert>{error}</Alert>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="ghost" onClick={onClose} disabled={enviando}>
          Volver
        </Button>
        <Button onClick={() => void aprobar()} disabled={enviando || lineas === null}>
          {enviando ? "Aprobando…" : "Aprobar"}
        </Button>
      </div>
    </Modal>
  )
}
