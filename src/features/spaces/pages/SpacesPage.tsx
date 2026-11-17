import { useEffect, useState } from "react"
import { useC } from "../../../theme"
import {
  createBloqueo,
  createBloqueoGeneral,
  createEspacio,
  createReserva,
  getDisponibilidad,
  getEspacios,
  listReservas,
  revertirBloqueo,
  updateReservaEstado,
} from "../services/spacesApi"
import type { Bloqueo, Espacio, Ocupacion, Reserva } from "../types"
import type { Role } from "../../../types"
import { SEDES, type Sede } from "../../auth/types"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { mensajeDeError } from "../../../lib/api"
import { ZONA_LAB } from "../../notifications/services/fechas"
import { CalendarGrid } from "../components/CalendarGrid"
import { SolicitudesPendientesEspacios } from "../components/SolicitudesPendientesEspacios"
import { reservaDelTurno, reservasDelDia, separarMotivo } from "../services/reservasDelDia"
import { contarPorDia } from "../services/pendientesVista"
import { armarMotivo, maxDescripcion } from "../services/motivo"
import { useInputStyle } from "../../../components/ui/Form"
import { DatePicker } from "../../../components/ui/DatePicker"
import { SelectorHora } from "../../../components/ui/SelectorHora"
import { agruparCorridas } from "../services/seleccion"
import { Alert, Card, SelectField, TextField } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"
import { usePedirTexto } from "../../../components/ui/Dialogo"

/** Franjas de una hora dentro del horario operativo vigente (GLO-02, desde config). */
const franjas = (apertura: string, cierre: string): string[] => {
  const out: string[] = []
  const [ha, ma] = apertura.split(":").map(Number)
  const [hc, mc] = cierre.split(":").map(Number)
  for (let m = ha * 60 + ma; m + 60 <= hc * 60 + mc; m += 60) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
  }
  return out
}

const addHour = (hora: string) =>
  `${String(Number(hora.slice(0, 2)) + 1).padStart(2, "0")}:${hora.slice(3)}`

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return formatoFechaLab.format(new Date(Date.UTC(anio, mes - 1, dia, 12)))
}

// SPEC-10 V-12: "jueves 12 de noviembre" para el encabezado de los turnos.
const mayusculaInicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const formatoDiaLargo = new Intl.DateTimeFormat("es-AR", { timeZone: ZONA_LAB, weekday: "long", day: "numeric", month: "long" })

const formatoFechaLab = new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_LAB,
  day: "numeric",
  month: "long",
  year: "numeric",
})

export function SpacesPage({ role = "student" }: { role?: Role }) {
  const C = useC()
  const usuario = useUsuario()
  const { sedeVista } = useSede()
  const currentUserId = usuario.id
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null)
  const [horario, setHorario] = useState({ apertura: "09:00", cierre: "16:00" })
  const [idEspacio, setIdEspacio] = useState<number | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<string[]>([])
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  // SPEC-10 V-13: materia y descripción, guardadas juntas en `motivo` (RES-02).
  const [materia, setMateria] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const estiloCampo = useInputStyle(false)
  const [bloqueoParaDeshacer, setBloqueoParaDeshacer] = useState<Bloqueo | null>(null)
  const [solicitandoReservas, setSolicitandoReservas] = useState(false)
  const [mes, setMes] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [reservas, setReservas] = useState<Ocupacion[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [pendientes, setPendientes] = useState<Reserva[]>([])
  const [pendientesAdmin, setPendientesAdmin] = useState<Reserva[]>([])
  // SPEC-10 V-21: tocar un día del calendario filtra las pendientes a ese día y espacio.
  const [verDia, setVerDia] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [nombreNuevoEspacio, setNombreNuevoEspacio] = useState("")
  const [tipoNuevoEspacio, setTipoNuevoEspacio] = useState("")
  const [sedeNuevoEspacio, setSedeNuevoEspacio] = useState<Sede>(sedeVista ?? SEDES[0])
  const [creandoEspacio, setCreandoEspacio] = useState(false)

  const esAdmin = role === "admin"
  const esSuperAdmin = usuario.rol === "SUPERADMIN"
  const puedeCrearEspacio = usuario.rol === "ADMIN_LOCAL" || esSuperAdmin

  useEffect(() => {
    setHorariosSeleccionados([])
    setMostrarConfirmacion(false)
  }, [fecha, idEspacio])

  useEffect(() => {
    getEspacios(sedeVista)
      .then((data) => {
        setEspacios(data)
        if (data.length === 0) {
          setSelectedSede(null)
          setIdEspacio(null)
          return
        }
        const firstSede = data[0].sede
        setSelectedSede(firstSede)
        setIdEspacio(data.find((e) => e.sede === firstSede)?.id ?? data[0].id)
      })
      .catch((e) => setError(mensajeDeError(e, "No se pudo cargar la lista de espacios")))
  }, [sedeVista])

  useEffect(() => {
    const espacio = espacios.find((e) => e.id === idEspacio)
    if (!espacio) return
    setIsLoading(true)
    setError(null)
    const dias: string[] = []
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= total; d++)
      dias.push(toISO(new Date(mes.getFullYear(), mes.getMonth(), d)))
    Promise.all(dias.map((dia) => getDisponibilidad(dia, espacio.id)))
      .then((results) => {
        setReservas(results.flatMap((r) => r.ocupaciones))
        setBloqueos(results.flatMap((r) => r.bloqueos))
        if (results[0]) setHorario({ apertura: results[0].apertura, cierre: results[0].cierre })
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [idEspacio, mes, espacios])

  useEffect(() => {
    if (!fecha || idEspacio == null) {
      setPendientes([])
      return
    }
    listReservas({ id_espacio: idEspacio, fecha })
      .then(setPendientes)
      .catch((e) => setError(e.message))
  }, [fecha, idEspacio])

  const cargarPendientesAdmin = () => {
    listReservas({ estado: "Pendiente" }).then(setPendientesAdmin).catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar las solicitudes pendientes"))
  }

  useEffect(() => {
    if (esAdmin) cargarPendientesAdmin()
  }, [esAdmin, currentUserId, idEspacio, fecha, reservas.length])

  const refrescarMes = () => {
    const espacio = espacios.find((e) => e.id === idEspacio)
    if (!espacio) return
    const dias: string[] = []
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= total; d++)
      dias.push(toISO(new Date(mes.getFullYear(), mes.getMonth(), d)))
    Promise.all(dias.map((dia) => getDisponibilidad(dia, espacio.id)))
      .then((results) => {
        setReservas(results.flatMap((r) => r.ocupaciones))
        setBloqueos(results.flatMap((r) => r.bloqueos))
        if (results[0]) setHorario({ apertura: results[0].apertura, cierre: results[0].cierre })
      })
      .catch((e) => setError(e.message))
  }

  const alternarHorario = (slot: string) => {
    setError(null)
    setMensajeExito(null)
    setHorariosSeleccionados((actuales) =>
      actuales.includes(slot) ? actuales.filter((horario) => horario !== slot) : [...actuales, slot].sort(),
    )
  }

  const confirmarReservas = async () => {
    if (!fecha || idEspacio == null || horariosSeleccionados.length === 0) return

    setSolicitandoReservas(true)
    setError(null)
    setMensajeExito(null)
    let solicitudesEnviadas = 0
    const horariosFallidos: string[] = []
    const errores: string[] = []

    // SPEC-08 D-S04: cada tramo de horarios seguidos es una sola reserva.
    for (const corrida of agruparCorridas(horariosSeleccionados)) {
      try {
        await createReserva({
          id_espacio: idEspacio,
          fecha_reserva: fecha,
          hora_inicio: `${corrida.inicio}:00`,
          hora_fin: `${corrida.fin}:00`,
          motivo: armarMotivo(materia, descripcion),
        })
        solicitudesEnviadas += 1
      } catch (e) {
        horariosFallidos.push(...corrida.turnos)
        errores.push(`${corrida.inicio}–${corrida.fin}: ${mensajeDeError(e, "No se pudo crear la reserva")}`)
      }
    }

    if (solicitudesEnviadas > 0) {
      listReservas({ id_espacio: idEspacio, fecha })
        .then(setPendientes)
        .catch((e) => setError(mensajeDeError(e, "No se pudieron actualizar las reservas del día")))
      refrescarMes()
    }

    setHorariosSeleccionados(horariosFallidos)
    setSolicitandoReservas(false)
    if (horariosFallidos.length === 0) {
      setMateria("")
      setDescripcion("")
    }
    if (horariosFallidos.length > 0) {
      setError(
        `Se enviaron ${solicitudesEnviadas} solicitud(es). No se pudieron enviar ${errores.length}: ${errores.join("; ")}`,
      )
      return
    }

    setMostrarConfirmacion(false)
    setMensajeExito(`Se enviaron ${solicitudesEnviadas} solicitudes de reserva. Podés seguirlas en Mis Solicitudes.`)
  }

  const crearEspacio = async () => {
    const nombre = nombreNuevoEspacio.trim()
    if (!nombre) {
      setError("Ingres\u00e1 el nombre del espacio.")
      setMensajeExito(null)
      return
    }

    setError(null)
    setMensajeExito(null)
    setCreandoEspacio(true)
    try {
      const nuevo = await createEspacio({
        nombre,
        ...(tipoNuevoEspacio.trim() ? { tipo: tipoNuevoEspacio.trim() } : {}),
        ...(esSuperAdmin ? { sede: sedeNuevoEspacio } : {}),
      })
      setEspacios((actuales) => [...actuales.filter((espacio) => espacio.id !== nuevo.id), nuevo])
      setSelectedSede(nuevo.sede)
      setIdEspacio(nuevo.id)
      setNombreNuevoEspacio("")
      setTipoNuevoEspacio("")
      setMensajeExito(`Se cre\u00f3 el espacio "${nuevo.nombre}" en ${nuevo.sede}.`)
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo crear el espacio"))
    } finally {
      setCreandoEspacio(false)
    }
  }

  const sedes = Array.from(new Set(espacios.map((e) => e.sede)))
  const espacioActual = espacios.find((e) => e.id === idEspacio)
  const espaciosPorSede = espacios.filter((e) => e.sede === (selectedSede ?? espacioActual?.sede))
  const delEspacio = reservas.filter((r) => r.idEspacio === idEspacio)
  const delEspacioBloqueos = bloqueos.filter((b) => b.idEspacio === idEspacio)
  const bloqueosUnicos = Array.from(new Map(delEspacioBloqueos.map((b) => [b.id, b])).values())

  const slotBloqueado = (slot: string) =>
    delEspacioBloqueos.some(
      (b) =>
        fecha! >= b.fechaInicio &&
        fecha! <= b.fechaFin &&
        (!b.horaInicio || (b.horaInicio <= slot && (b.horaFin ?? "24:00") > slot)),
    )

  const slotOcupado = (slot: string) =>
    delEspacio.some(
      (r) =>
        r.fecha === fecha &&
        (r.estado === "Aprobada" || r.estado === "En_Uso") &&
        r.horaInicio <= slot &&
        r.horaFin > slot,
    )

  const slotPendiente = (slot: string) =>
    pendientes.some(
      (p) =>
        p.estado === "Pendiente" &&
        (esAdmin || p.idUsuario === currentUserId) &&
        p.idEspacio === idEspacio &&
        p.fecha === fecha &&
        p.horaInicio <= slot &&
        p.horaFin > slot,
    )

  const [bloFechaInicio, setBloFechaInicio] = useState("")
  const [bloFechaFin, setBloFechaFin] = useState("")
  const [bloTodoElDia, setBloTodoElDia] = useState(true)
  const [bloAmbasSedes, setBloAmbasSedes] = useState(false)
  const [bloHoraInicio, setBloHoraInicio] = useState(horario.apertura)
  const [bloHoraFin, setBloHoraFin] = useState(horario.cierre)
  const [bloMotivo, setBloMotivo] = useState("")
  const [bloqueoEliminando, setBloqueoEliminando] = useState<number | null>(null)

  const crearBloqueo = async () => {
    if ((!bloAmbasSedes && idEspacio == null) || !bloFechaInicio || !bloFechaFin || !bloMotivo) return
    setError(null)
    setMensajeExito(null)
    try {
      const rango = {
        fecha_inicio: bloFechaInicio,
        fecha_fin: bloFechaFin,
        hora_inicio: bloTodoElDia ? undefined : `${bloHoraInicio}:00`,
        hora_fin: bloTodoElDia ? undefined : `${bloHoraFin}:00`,
        motivo: bloMotivo,
      }
      let nuevosBloqueos: Bloqueo[]
      if (bloAmbasSedes) {
        nuevosBloqueos = await createBloqueoGeneral(rango)
      } else {
        if (idEspacio === null) return
        nuevosBloqueos = [
          await createBloqueo({
            id_espacio: idEspacio,
            ...rango,
          }),
        ]
      }
      setBloqueos((actuales) => [...actuales, ...nuevosBloqueos])
      setBloFechaInicio("")
      setBloFechaFin("")
      setBloMotivo("")
      setMensajeExito(
        bloAmbasSedes
          ? `Se bloquearon todos los espacios de ambas sedes (${nuevosBloqueos.length}).`
          : "Se bloqueó el espacio.",
      )
      refrescarMes()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo crear el bloqueo"))
    }
  }

  const confirmarDeshacerBloqueo = async () => {
    if (!bloqueoParaDeshacer) return
    const bloqueo = bloqueoParaDeshacer
    setError(null)
    setBloqueoEliminando(bloqueo.id)
    try {
      const revertidos = new Set((await revertirBloqueo(bloqueo.id)).map((b) => b.id))
      setBloqueos((actuales) => actuales.filter((b) => !revertidos.has(b.id)))
      setBloqueoParaDeshacer(null)
      setMensajeExito(
        bloqueo.idGrupo
          ? `Se deshizo el bloqueo general en todos los espacios (${revertidos.size}).`
          : "Se deshizo el bloqueo del espacio.",
      )
      refrescarMes()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo deshacer el bloqueo"))
    } finally {
      setBloqueoEliminando(null)
    }
  }

  const pedirTexto = usePedirTexto() // SPEC-10 V-11: en lugar de window.prompt
  const resolver = async (id: number, decision: "Aprobada" | "Rechazada") => {
    let motivo: string | undefined
    if (decision === "Rechazada") {
      motivo = (await pedirTexto({ titulo: "Rechazar la reserva", etiqueta: "Motivo del rechazo", aceptar: "Rechazar" })) ?? undefined
      if (!motivo) return
    }
    try {
      await updateReservaEstado(id, decision, motivo)
      cargarPendientesAdmin()
      refrescarMes()
      if (fecha && idEspacio != null) listReservas({ id_espacio: idEspacio, fecha }).then(setPendientes).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la reserva")
    }
  }

  // SPEC-10 V-21: el admin ve quién reservó cada turno y para qué (la API ya se lo da, AC-S14).
  const delDia = esAdmin ? reservasDelDia(pendientes, idEspacio, fecha) : []

  const nombreEspacio = (id: number) => espacios.find((e) => e.id === id)?.nombre ?? `#${id}`

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
      {puedeCrearEspacio && (
        <Card title="Cargar nuevo espacio">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <TextField
              label="Nombre"
              value={nombreNuevoEspacio}
              onChange={setNombreNuevoEspacio}
              placeholder="Ej.: Sala de edición"
              disabled={creandoEspacio}
            />
            <TextField
              label="Tipo (opcional)"
              value={tipoNuevoEspacio}
              onChange={setTipoNuevoEspacio}
              placeholder="Ej.: Edición"
              disabled={creandoEspacio}
            />
            {esSuperAdmin ? (
              <SelectField
                label="Sede"
                value={sedeNuevoEspacio}
                onChange={setSedeNuevoEspacio}
                options={SEDES.map((sede) => ({ value: sede, label: sede }))}
                disabled={creandoEspacio}
              />
            ) : (
              <div style={{ alignSelf: "end", padding: "9px 0", fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.textMuted }}>
                Sede: {usuario.sede ?? "No asignada"}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={crearEspacio}
              disabled={creandoEspacio || (usuario.rol === "ADMIN_LOCAL" && !usuario.sede)}
            >
              {creandoEspacio ? "Creando..." : "Crear espacio"}
            </Button>
          </div>
        </Card>
      )}
      {mensajeExito && (
        <div style={{ marginTop: 14 }}>
          <Alert tipo="ok">{mensajeExito}</Alert>
        </div>
      )}
      <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              color: C.text,
              alignSelf: "center",
            }}
          >
            Sede
          </span>
          {sedes.length === 0 && <span style={{ color: C.textFaint }}>Sin sedes disponibles.</span>}
          {sedes.map((sedeId) => (
            <button
              key={sedeId}
              onClick={() => {
                setSelectedSede(sedeId)
                const nextSpace = espacios.find((e) => e.sede === sedeId)
                if (nextSpace) setIdEspacio(nextSpace.id)
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${selectedSede === sedeId ? C.crimson : C.border}`,
                background: selectedSede === sedeId ? C.crimsonLight : C.card,
                color: C.text,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
              }}
            >
              {sedeId}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              color: C.text,
              alignSelf: "center",
            }}
          >
            Espacio
          </span>
          {espaciosPorSede.length === 0 && <span style={{ color: C.textFaint }}>Sin espacios para esta sede.</span>}
          {espaciosPorSede.map((e) => (
            <button
              key={e.id}
              onClick={() => setIdEspacio(e.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${e.id === idEspacio ? C.crimson : C.border}`,
                background: e.id === idEspacio ? C.crimsonLight : C.card,
                color: C.text,
                cursor: "pointer",
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
              }}
            >
              {e.nombre}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ color: C.crimson, marginBottom: 12, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        <CalendarGrid
          reservas={delEspacio}
          bloqueos={delEspacioBloqueos}
          horario={horario}
          selectedFecha={fecha}
          onSelectFecha={(iso) => {
            setFecha(iso)
            if (esAdmin) {
              setVerDia(true)
              setBloFechaInicio(iso)
              setBloFechaFin(iso)
            }
          }}
          onMonthChange={setMes}
          pendientesPorDia={esAdmin ? contarPorDia(pendientesAdmin, idEspacio) : undefined}
        />
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          {/* SPEC-10 V-12: encabezado con el día en palabras, turnos como tarjetas y leyenda */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: C.text }}>
              {fecha ? mayusculaInicial(formatoDiaLargo.format(new Date(`${fecha}T12:00:00-03:00`))) : "Elegí un día"}
            </div>
            <div style={{ marginTop: 3, fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
              {fecha
                ? `Horario del laboratorio: ${horario.apertura} a ${horario.cierre}${esAdmin ? "" : " · Podés elegir varios turnos seguidos"}`
                : "Tocá un día del calendario para ver sus turnos."}
            </div>
          </div>
          {!fecha && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                minHeight: 220,
                border: `1.5px dashed ${C.border}`,
                borderRadius: 14,
                color: C.textFaint,
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3" y="4.5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 9.5H21M8 2.5V6M16 2.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="15" r="2" fill="currentColor" />
              </svg>
              Sin día elegido
            </div>
          )}
          {isLoading && (
            <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              Cargando disponibilidad...
            </div>
          )}
          {fecha && !isLoading && (
            <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {franjas(horario.apertura, horario.cierre).map((slot) => {
                const ocupado = slotOcupado(slot)
                const bloqueado = slotBloqueado(slot)
                const pendiente = slotPendiente(slot)
                const inhabilitado = ocupado || bloqueado
                const seleccionado = horariosSeleccionados.includes(slot)
                const deshabilitado = inhabilitado || esAdmin || (pendiente && !seleccionado)
                const estado = seleccionado
                  ? { texto: "Elegido", color: "white", bg: C.crimson, borde: C.crimson, punto: "white" }
                  : ocupado
                    ? { texto: "Ocupado", color: C.occupied, bg: C.occupiedBg, borde: "transparent", punto: C.occupied }
                    : bloqueado
                      ? { texto: "Bloqueado", color: C.maintenance, bg: C.maintenanceBg, borde: "transparent", punto: C.maintenance }
                      : pendiente
                        ? { texto: "Con solicitud pendiente", color: C.pending, bg: C.pendingBg, borde: "transparent", punto: C.pending }
                        : { texto: "Libre", color: C.text, bg: C.card, borde: C.border, punto: C.available }
                return (
                  <button
                    key={slot}
                    disabled={deshabilitado}
                    aria-pressed={seleccionado}
                    title={esAdmin ? "Las reservas las solicitan estudiantes y docentes." : undefined}
                    onClick={() => alternarHorario(slot)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 6,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${estado.borde}`,
                      background: estado.bg,
                      color: estado.color,
                      cursor: deshabilitado ? "default" : "pointer",
                      textAlign: "left",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                  >
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700 }}>
                      {slot} – {addHour(slot)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Inter',sans-serif", fontSize: 11.5 }}>
                      {seleccionado ? (
                        <span aria-hidden="true" style={{ fontWeight: 700 }}>✓</span>
                      ) : (
                        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: estado.punto }} />
                      )}
                      {estado.texto}
                    </span>
                    {(() => {
                      const res = esAdmin && !seleccionado ? reservaDelTurno(delDia, slot) : undefined
                      if (!res) return null
                      const { materia } = separarMotivo(res.motivo)
                      return (
                        <span
                          title={res.motivo ?? undefined}
                          style={{
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: C.text,
                          }}
                        >
                          {res.solicitanteApellido ?? `Usuario #${res.idUsuario}`}
                          {materia ? ` · ${materia}` : ""}
                        </span>
                      )
                    })()}
                  </button>
                )
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 14, fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textMuted }}>
              {[
                ["Libre", C.available],
                ["Con solicitud pendiente", C.pending],
                ["Ocupado", C.occupied],
                ["Bloqueado", C.maintenance],
              ].map(([t, c]) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
                  {t}
                </span>
              ))}
            </div>
            </>
          )}
          {!esAdmin && fecha && !isLoading && horariosSeleccionados.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <span style={{ color: C.textMuted, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                {horariosSeleccionados.length} horario(s) seleccionado(s)
              </span>
              <Button onClick={() => setMostrarConfirmacion(true)}>Revisar solicitud</Button>
            </div>
          )}
        </div>
      </div>

      {/* SPEC-10 V-18: "Mis reservas" pasó a Mis Solicitudes (USR-06). */}

      {esAdmin && (
        <>
          {/* SPEC-10 V-21: agrupadas por día, más grandes y con materia y descripción separadas */}
          <SolicitudesPendientesEspacios
            reservas={pendientesAdmin}
            espacios={espacios}
            nombreEspacio={nombreEspacio}
            onResolver={resolver}
            filtroDia={verDia && fecha && idEspacio !== null ? { fecha, idEspacio } : null}
            onLimpiarDia={() => setVerDia(false)}
          />

          <div
            style={{
              marginTop: 18,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: C.text, marginBottom: 12 }}>
              Bloquear espacio (mantenimiento / feriado)
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {/* SPEC-10 §4.6 (V-01): selectores comunes de fecha y hora */}
              <div style={{ width: 150 }}>
                <DatePicker
                  value={bloFechaInicio}
                  onChange={setBloFechaInicio}
                  rango={bloFechaInicio && bloFechaFin ? { desde: bloFechaInicio, hasta: bloFechaFin } : undefined}
                  ariaLabel="Desde"
                />
              </div>
              <span style={{ color: C.textFaint }}>→</span>
              <div style={{ width: 150 }}>
                <DatePicker
                  value={bloFechaFin}
                  onChange={setBloFechaFin}
                  min={bloFechaInicio || undefined}
                  rango={bloFechaInicio && bloFechaFin ? { desde: bloFechaInicio, hasta: bloFechaFin } : undefined}
                  ariaLabel="Hasta"
                />
              </div>
              <label style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.text }}>
                <input
                  type="checkbox"
                  checked={bloTodoElDia}
                  onChange={(e) => setBloTodoElDia(e.target.checked)}
                />{" "}
                Días completos
              </label>
              {!bloTodoElDia && (
                <>
                  <div style={{ width: 100 }}>
                    <SelectorHora value={bloHoraInicio} onChange={setBloHoraInicio} vacio="--:--" ariaLabel="Hora desde" />
                  </div>
                  <span style={{ color: C.textFaint }}>→</span>
                  <div style={{ width: 100 }}>
                    <SelectorHora value={bloHoraFin} onChange={setBloHoraFin} vacio="--:--" ariaLabel="Hora hasta" />
                  </div>
                </>
              )}
              <input
                placeholder="Motivo"
                value={bloMotivo}
                onChange={(e) => setBloMotivo(e.target.value)}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, flex: 1, minWidth: 160 }}
              />
              {esSuperAdmin && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={bloAmbasSedes}
                    onChange={(e) => setBloAmbasSedes(e.target.checked)}
                  />
                  Todos los espacios de ambas sedes
                </label>
              )}
              <button
                onClick={crearBloqueo}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: C.crimson,
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                }}
              >
                {bloAmbasSedes ? "Bloquear todos" : "Bloquear"}
              </button>
            </div>
            <div style={{ marginTop: 6, color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
              Seleccioná una fecha en el calendario para completar el inicio y fin del bloqueo.
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Bloqueos de {espacioActual?.nombre ?? "este espacio"}
              </div>
              {bloqueosUnicos.length === 0 ? (
                <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  No hay bloqueos en el mes visible.
                </div>
              ) : (
                bloqueosUnicos.map((bloqueo) => (
                  <div
                    key={bloqueo.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.borderLight}`,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                      color: C.text,
                    }}
                  >
                    <span>
                      {formatearFecha(bloqueo.fechaInicio)}
                      {bloqueo.fechaFin !== bloqueo.fechaInicio && ` – ${formatearFecha(bloqueo.fechaFin)}`}
                      {bloqueo.horaInicio && ` · ${bloqueo.horaInicio}–${bloqueo.horaFin}`}
                      {" · "}{bloqueo.motivo}
                      {bloqueo.idGrupo && " · General (ambas sedes)"}
                    </span>
                    {/* SPEC-08 D-S02: un bloqueo general sólo lo deshace el Superadministrador. */}
                    {(!bloqueo.idGrupo || esSuperAdmin) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setError(null)
                          setBloqueoParaDeshacer(bloqueo)
                        }}
                        disabled={bloqueoEliminando !== null}
                      >
                        {bloqueoEliminando === bloqueo.id ? "Deshaciendo..." : "Deshacer"}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      {mostrarConfirmacion && fecha && espacioActual && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.48)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-reservas-titulo"
            style={{
              width: "100%",
              maxWidth: 460,
              maxHeight: "85vh",
              overflowY: "auto",
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
            }}
          >
            <h2
              id="confirmar-reservas-titulo"
              style={{ margin: "0 0 8px", fontFamily: "'Outfit',sans-serif", fontSize: 20, color: C.text }}
            >
              Confirmar solicitud
            </h2>
            <p style={{ margin: "0 0 16px", color: C.textMuted, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              Revisá el espacio, la fecha y los horarios. Los horarios seguidos se piden como una sola reserva.
            </p>
            <div style={{ padding: 14, borderRadius: 10, background: C.crimsonLight, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              <strong>{espacioActual.nombre}</strong>
              <div style={{ marginTop: 4 }}>{formatearFecha(fecha)}</div>
            </div>
            <ul style={{ margin: "14px 0 16px", paddingLeft: 22, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
              {agruparCorridas(horariosSeleccionados).map((corrida) => (
                <li key={corrida.inicio} style={{ padding: "3px 0" }}>
                  {corrida.inicio}–{corrida.fin}
                </li>
              ))}
            </ul>
            {/* SPEC-10 V-13: materia y descripción (se guardan en `motivo`, RES-02) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>
                Materia
                <input
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Ej.: Taller de Realización Audiovisual"
                  maxLength={150}
                  style={estiloCampo}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>
                Descripción
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej.: Rodaje de la práctica 2"
                  rows={2}
                  maxLength={maxDescripcion(materia)}
                  style={{ ...estiloCampo, resize: "vertical" }}
                />
              </label>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: C.textFaint }}>
                Ayuda al laboratorio a evaluar la solicitud.
              </span>
            </div>
            {error && (
              <div role="alert" style={{ marginBottom: 16, color: C.crimson, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <Button
                variant="ghost"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={solicitandoReservas}
              >
                Cancelar
              </Button>
              <Button onClick={confirmarReservas} disabled={solicitandoReservas || horariosSeleccionados.length === 0}>
                {solicitandoReservas ? "Enviando..." : "Aceptar y solicitar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {bloqueoParaDeshacer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.48)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-deshacer-bloqueo-titulo"
            style={{
              width: "100%",
              maxWidth: 460,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
            }}
          >
            <h2
              id="confirmar-deshacer-bloqueo-titulo"
              style={{ margin: "0 0 8px", fontFamily: "'Outfit',sans-serif", fontSize: 20, color: C.text }}
            >
              ¿Deshacer este bloqueo?
            </h2>
            <p style={{ margin: "0 0 16px", color: C.textMuted, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              {bloqueoParaDeshacer.idGrupo
                ? "Es un bloqueo general: si confirmás, se deshace en todos los espacios de ambas sedes."
                : "Si confirmás, el espacio volverá a estar disponible en las fechas indicadas."}{" "}
              El bloqueo queda registrado como revertido.
            </p>
            <div style={{ padding: 14, borderRadius: 10, background: C.occupiedBg, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              <strong>{bloqueoParaDeshacer.motivo}</strong>
              <div style={{ marginTop: 4 }}>
                {formatearFecha(bloqueoParaDeshacer.fechaInicio)}
                {bloqueoParaDeshacer.fechaFin !== bloqueoParaDeshacer.fechaInicio &&
                  ` – ${formatearFecha(bloqueoParaDeshacer.fechaFin)}`}
                {bloqueoParaDeshacer.horaInicio &&
                  ` · ${bloqueoParaDeshacer.horaInicio}–${bloqueoParaDeshacer.horaFin}`}
              </div>
            </div>
            {error && (
              <div role="alert" style={{ marginTop: 14, color: C.crimson, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <Button
                variant="ghost"
                onClick={() => {
                  setBloqueoParaDeshacer(null)
                  setError(null)
                }}
                disabled={bloqueoEliminando !== null}
              >
                No, volver
              </Button>
              <Button
                onClick={confirmarDeshacerBloqueo}
                variant="danger"
                disabled={bloqueoEliminando !== null}
              >
                {bloqueoEliminando === bloqueoParaDeshacer.id ? "Deshaciendo..." : "Sí, deshacer bloqueo"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
