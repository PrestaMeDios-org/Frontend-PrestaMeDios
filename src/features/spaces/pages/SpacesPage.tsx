import { useEffect, useState } from "react"
import { useC } from "../../../theme"
import {
  createBloqueo,
  createBloqueoGeneral,
  deleteBloqueo,
  createEspacio,
  createReserva,
  getDisponibilidad,
  getEspacios,
  listReservas,
  updateReservaEstado,
} from "../services/spacesApi"
import type { Bloqueo, Espacio, Ocupacion, Reserva } from "../types"
import type { Role } from "../../../types"
import { SEDES, type Sede } from "../../auth/types"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { mensajeDeError } from "../../../lib/api"
import { CalendarGrid } from "../components/CalendarGrid"
import { Alert, Card, SelectField, TextField } from "../../../components/ui/Form"
import { Button } from "../../../components/ui/Button"

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
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia))
}

const formatoFechaHoraLab = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Ushuaia",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const fechaHoraActualLab = (ahora: number) => {
  const partes = Object.fromEntries(
    formatoFechaHoraLab.formatToParts(new Date(ahora)).map(({ type, value }) => [type, value]),
  )
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`
}

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
  const [reservaParaCancelar, setReservaParaCancelar] = useState<Reserva | null>(null)
  const [cancelandoReserva, setCancelandoReserva] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())
  const [solicitandoReservas, setSolicitandoReservas] = useState(false)
  const [mes, setMes] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [reservas, setReservas] = useState<Ocupacion[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [pendientes, setPendientes] = useState<Reserva[]>([])
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [pendientesAdmin, setPendientesAdmin] = useState<Reserva[]>([])
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
    const timer = window.setInterval(() => setAhora(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

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

  const cargarMisReservas = () => {
    listReservas()
      .then((list) =>
        setMisReservas(
          list.filter((r) => r.estado !== "Cancelada" && r.estado !== "Rechazada"),
        ),
      )
      .catch((e) => setError(e.message))
  }

  const cargarPendientesAdmin = () => {
    listReservas({ estado: "Pendiente" }).then(setPendientesAdmin).catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar las solicitudes pendientes"))
  }

  useEffect(() => {
    if (esAdmin) cargarPendientesAdmin()
    else cargarMisReservas()
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

    for (const slot of [...horariosSeleccionados].sort()) {
      try {
        await createReserva({
          id_espacio: idEspacio,
          fecha_reserva: fecha,
          hora_inicio: `${slot}:00`,
          hora_fin: `${addHour(slot)}:00`,
        })
        solicitudesEnviadas += 1
      } catch (e) {
        horariosFallidos.push(slot)
        errores.push(`${slot}: ${mensajeDeError(e, "No se pudo crear la reserva")}`)
      }
    }

    if (solicitudesEnviadas > 0) {
      cargarMisReservas()
      listReservas({ id_espacio: idEspacio, fecha })
        .then(setPendientes)
        .catch((e) => setError(mensajeDeError(e, "No se pudieron actualizar las reservas del día")))
      refrescarMes()
    }

    setHorariosSeleccionados(horariosFallidos)
    setSolicitandoReservas(false)
    if (horariosFallidos.length > 0) {
      setError(
        `Se enviaron ${solicitudesEnviadas} solicitud(es). No se pudieron enviar ${horariosFallidos.length}: ${errores.join("; ")}`,
      )
      return
    }

    setMostrarConfirmacion(false)
    setMensajeExito(`Se enviaron ${solicitudesEnviadas} solicitudes de reserva.`)
  }

  const confirmarCancelacion = async () => {
    if (!reservaParaCancelar) return

    try {
      setCancelandoReserva(true)
      setError(null)
      await updateReservaEstado(reservaParaCancelar.id, "Cancelada")
      setReservaParaCancelar(null)
      cargarMisReservas()
      refrescarMes()
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cancelar la reserva"))
    } finally {
      setCancelandoReserva(false)
    }
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
        p.idUsuario === currentUserId &&
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

  const deshacerBloqueo = async (bloqueo: Bloqueo) => {
    if (!window.confirm(`¿Deshacer el bloqueo "${bloqueo.motivo}"?`)) return

    setBloqueoEliminando(bloqueo.id)
    setError(null)
    try {
      await deleteBloqueo(bloqueo.id)
      setBloqueos((actuales) => actuales.filter((b) => b.id !== bloqueo.id))
      setMensajeExito("Se deshizo el bloqueo del espacio.")
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo deshacer el bloqueo"))
    } finally {
      setBloqueoEliminando(null)
    }
  }

  const resolver = async (id: number, decision: "Aprobada" | "Rechazada") => {
    let motivo: string | undefined
    if (decision === "Rechazada") {
      motivo = window.prompt("Motivo del rechazo:") ?? undefined
      if (!motivo) return
    }
    try {
      await updateReservaEstado(id, decision, motivo)
      cargarPendientesAdmin()
      refrescarMes()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la reserva")
    }
  }

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
              placeholder="Ej.: Sala de edici\u00f3n"
              disabled={creandoEspacio}
            />
            <TextField
              label="Tipo (opcional)"
              value={tipoNuevoEspacio}
              onChange={setTipoNuevoEspacio}
              placeholder="Ej.: Edici\u00f3n"
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
              setBloFechaInicio(iso)
              setBloFechaFin(iso)
            }
          }}
          onMonthChange={setMes}
        />
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontWeight: 700,
              color: C.text,
              marginBottom: 12,
            }}
          >
            {fecha ? `Franjas del ${fecha} (${horario.apertura}–${horario.cierre})` : "Seleccioná un día"}
          </div>
          {isLoading && (
            <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              Cargando disponibilidad...
            </div>
          )}
          {fecha && !isLoading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {franjas(horario.apertura, horario.cierre).map((slot) => {
                const ocupado = slotOcupado(slot)
                const bloqueado = slotBloqueado(slot)
                const pendiente = slotPendiente(slot)
                const inhabilitado = ocupado || bloqueado
                const seleccionado = horariosSeleccionados.includes(slot)
                return (
                  <button
                    key={slot}
                    disabled={inhabilitado || esAdmin || (pendiente && !seleccionado)}
                    aria-pressed={seleccionado}
                    title={esAdmin ? "Las reservas las solicitan estudiantes y docentes." : undefined}
                    onClick={() => alternarHorario(slot)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 9,
                      border: `1px solid ${C.border}`,
                      background: ocupado
                        ? C.occupiedBg
                        : bloqueado
                          ? C.maintenanceBg
                          : pendiente
                            ? C.pendingBg
                            : C.availableBg,
                      color: ocupado
                        ? C.occupied
                        : bloqueado
                          ? C.maintenance
                          : pendiente
                            ? C.pending
                            : C.available,
                      cursor: inhabilitado || esAdmin || (pendiente && !seleccionado) ? "default" : "pointer",
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12.5,
                    }}
                  >
                    {slot}–{addHour(slot)}
                    <span
                      aria-hidden="true"
                      style={{
                        width: 15,
                        height: 15,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${seleccionado ? C.textMuted : C.border}`,
                        borderRadius: 3,
                        background: seleccionado ? C.textMuted : "transparent",
                        color: C.card,
                        fontSize: 11,
                        lineHeight: 1,
                      }}
                    >
                      {seleccionado ? "✓" : ""}
                    </span>
                  </button>
                )
              })}
            </div>
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

      {!esAdmin && (
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
          Mis reservas
        </div>
        {misReservas.length === 0 && (
          <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
            No tenés reservas registradas.
          </div>
        )}
          {misReservas.map((r) => {
            const expirada = `${r.fecha}T${r.horaFin}` <= fechaHoraActualLab(ahora)
            const estadoMostrado = expirada ? "Expirada" : r.estado

            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  color: expirada ? C.textFaint : C.text,
                }}
              >
                <span>
                  {nombreEspacio(r.idEspacio)} · {formatearFecha(r.fecha)} · {r.horaInicio}–{r.horaFin} ·{" "}
                  <strong
                    style={{
                      color: expirada
                        ? C.textFaint
                        : r.estado === "Aprobada"
                          ? C.available
                          : r.estado === "Pendiente"
                            ? C.pending
                            : C.textMuted,
                    }}
                  >
                    {estadoMostrado}
                  </strong>
                </span>
                {!expirada && (r.estado === "Pendiente" || r.estado === "Aprobada") && (
                  <button
                    onClick={() => {
                      setError(null)
                      setReservaParaCancelar(r)
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.occupiedBg,
                      color: C.occupied,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )
          })}
      </div>
      )}

      {esAdmin && (
        <>
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
              Solicitudes pendientes (aprobación manual)
            </div>
            {pendientesAdmin.length === 0 && (
              <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                No hay solicitudes pendientes.
              </div>
            )}
            {pendientesAdmin.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  color: C.text,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  {r.solicitanteNombre && r.solicitanteApellido
                    ? `${r.solicitanteApellido}, ${r.solicitanteNombre}`
                    : `Usuario #${r.idUsuario}`}
                  <span style={{ color: C.textFaint, fontSize: 12 }}>
                    {nombreEspacio(r.idEspacio)} · {formatearFecha(r.fecha)} · {r.horaInicio}–{r.horaFin}
                  </span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => resolver(r.id, "Aprobada")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: C.availableBg,
                      color: C.available,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => resolver(r.id, "Rechazada")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: C.occupiedBg,
                      color: C.occupied,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Rechazar
                  </button>
                </span>
              </div>
            ))}
          </div>

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
              <input
                type="date"
                value={bloFechaInicio}
                onChange={(e) => setBloFechaInicio(e.target.value)}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.border}` }}
              />
              <span style={{ color: C.textFaint }}>→</span>
              <input
                type="date"
                value={bloFechaFin}
                onChange={(e) => setBloFechaFin(e.target.value)}
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.border}` }}
              />
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
                  <input
                    type="time"
                    value={bloHoraInicio}
                    onChange={(e) => setBloHoraInicio(e.target.value)}
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.border}` }}
                  />
                  <span style={{ color: C.textFaint }}>→</span>
                  <input
                    type="time"
                    value={bloHoraFin}
                    onChange={(e) => setBloHoraFin(e.target.value)}
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, padding: "6px 8px", borderRadius: 8, border: `1px solid ${C.border}` }}
                  />
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
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => deshacerBloqueo(bloqueo)}
                      disabled={bloqueoEliminando !== null}
                    >
                      {bloqueoEliminando === bloqueo.id ? "Deshaciendo..." : "Deshacer"}
                    </Button>
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
              Revisá el espacio, la fecha y los horarios. Se enviará una solicitud por cada horario.
            </p>
            <div style={{ padding: 14, borderRadius: 10, background: C.crimsonLight, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              <strong>{espacioActual.nombre}</strong>
              <div style={{ marginTop: 4 }}>{formatearFecha(fecha)}</div>
            </div>
            <ul style={{ margin: "14px 0 20px", paddingLeft: 22, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
              {horariosSeleccionados.map((slot) => (
                <li key={slot} style={{ padding: "3px 0" }}>
                  {slot}–{addHour(slot)}
                </li>
              ))}
            </ul>
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
      {reservaParaCancelar && (
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
            aria-labelledby="confirmar-cancelacion-titulo"
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
              id="confirmar-cancelacion-titulo"
              style={{ margin: "0 0 8px", fontFamily: "'Outfit',sans-serif", fontSize: 20, color: C.text }}
            >
              ¿Cancelar esta reserva?
            </h2>
            <p style={{ margin: "0 0 16px", color: C.textMuted, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              Si confirmás, se cancelará también la aprobación del administrador.
            </p>
            <div style={{ padding: 14, borderRadius: 10, background: C.occupiedBg, color: C.text, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              <strong>{nombreEspacio(reservaParaCancelar.idEspacio)}</strong>
              <div style={{ marginTop: 4 }}>
                {formatearFecha(reservaParaCancelar.fecha)} · {reservaParaCancelar.horaInicio}–{reservaParaCancelar.horaFin}
              </div>
              <div style={{ marginTop: 4 }}>Estado: {reservaParaCancelar.estado}</div>
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
                  setReservaParaCancelar(null)
                  setError(null)
                }}
                disabled={cancelandoReserva}
              >
                No, volver
              </Button>
              <Button onClick={confirmarCancelacion} variant="danger" disabled={cancelandoReserva}>
                {cancelandoReserva ? "Cancelando..." : "Sí, cancelar reserva"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
