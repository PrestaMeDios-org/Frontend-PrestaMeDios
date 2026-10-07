import { useEffect, useState } from "react"
import { useC } from "../../../theme"
import {
  createBloqueo,
  createReserva,
  getDisponibilidad,
  getEspacios,
  listReservas,
  updateReservaEstado,
} from "../services/spacesApi"
import type { Bloqueo, Espacio, Reserva } from "../types"
import type { Role } from "../../../types"
import { CalendarGrid } from "../components/CalendarGrid"

const SLOTS: string[] = (() => {
  const out: string[] = []
  for (let h = 9; h < 16; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`)
    out.push(`${String(h).padStart(2, "0")}:30`)
  }
  return out
})()

const addHour = (hora: string) =>
  `${String(Number(hora.slice(0, 2)) + 1).padStart(2, "0")}:${hora.slice(3)}`

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

const USER_BY_ROLE: Record<Role, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
  icse: 4,
}

export function SpacesPage({ role = "student" }: { role?: Role }) {
  const C = useC()
  const USER_ID = USER_BY_ROLE[role]
  const [espacios, setEspacios] = useState<Espacio[]>([])
  const [idEspacio, setIdEspacio] = useState<number | null>(null)
  const [fecha, setFecha] = useState<string | null>(null)
  const [mes, setMes] = useState(() => {
    const hoy = new Date()
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [pendientes, setPendientes] = useState<Reserva[]>([])
  const [misReservas, setMisReservas] = useState<Reserva[]>([])
  const [pendientesAdmin, setPendientesAdmin] = useState<Reserva[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esAdmin = role === "admin" || role === "icse"

  useEffect(() => {
    getEspacios()
      .then((data) => {
        setEspacios(data)
        if (data.length > 0) setIdEspacio(data[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    const espacio = espacios.find((e) => e.id === idEspacio)
    if (!espacio) return
    setIsLoading(true)
    setError(null)
    const dias: string[] = []
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= total; d++)
      dias.push(toISO(new Date(mes.getFullYear(), mes.getMonth(), d)))
    Promise.all(dias.map((dia) => getDisponibilidad(espacio.idSede, dia, espacio.id)))
      .then((results) => {
        setReservas(results.flatMap((r) => r.reservas))
        setBloqueos(results.flatMap((r) => r.bloqueos))
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
    listReservas({ id_usuario: USER_ID })
      .then((list) =>
        setMisReservas(
          list.filter((r) => r.estado === "Pendiente" || r.estado === "Aprobada" || r.estado === "En_Uso"),
        ),
      )
      .catch((e) => setError(e.message))
  }

  const cargarPendientesAdmin = () => {
    listReservas({ estado: "Pendiente" }).then(setPendientesAdmin).catch((e) => setError(e.message))
  }

  useEffect(() => {
    cargarMisReservas()
    if (esAdmin) cargarPendientesAdmin()
  }, [esAdmin, USER_ID, idEspacio, fecha, reservas.length])

  const refrescarMes = () => {
    const espacio = espacios.find((e) => e.id === idEspacio)
    if (!espacio) return
    const dias: string[] = []
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= total; d++)
      dias.push(toISO(new Date(mes.getFullYear(), mes.getMonth(), d)))
    Promise.all(dias.map((dia) => getDisponibilidad(espacio.idSede, dia, espacio.id)))
      .then((results) => {
        setReservas(results.flatMap((r) => r.reservas))
        setBloqueos(results.flatMap((r) => r.bloqueos))
      })
      .catch((e) => setError(e.message))
  }

  const reservar = async (slot: string) => {
    if (!fecha || idEspacio == null) return
    setError(null)
    try {
      const nueva = await createReserva({
        id_usuario: USER_ID,
        id_espacio: idEspacio,
        fecha_reserva: fecha,
        hora_inicio: `${slot}:00`,
        hora_fin: `${addHour(slot)}:00`,
      })
      setReservas([...reservas, nueva])
      cargarMisReservas()
      listReservas({ id_espacio: idEspacio, fecha }).then(setPendientes).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la reserva")
    }
  }

  const cancelar = async (id: number) => {
    try {
      await updateReservaEstado(id, "Cancelada")
      cargarMisReservas()
      refrescarMes()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar")
    }
  }

  const delEspacio = reservas.filter((r) => r.idEspacio === idEspacio)
  const delEspacioBloqueos = bloqueos.filter((b) => b.idEspacio === idEspacio)

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
        p.idUsuario === USER_ID &&
        p.idEspacio === idEspacio &&
        p.fecha === fecha &&
        p.horaInicio <= slot &&
        p.horaFin > slot,
    )

  const [bloFechaInicio, setBloFechaInicio] = useState("")
  const [bloFechaFin, setBloFechaFin] = useState("")
  const [bloTodoElDia, setBloTodoElDia] = useState(true)
  const [bloHoraInicio, setBloHoraInicio] = useState("09:00")
  const [bloHoraFin, setBloHoraFin] = useState("16:00")
  const [bloMotivo, setBloMotivo] = useState("")

  const crearBloqueo = async () => {
    if (idEspacio == null || !bloFechaInicio || !bloFechaFin || !bloMotivo) return
    setError(null)
    try {
      await createBloqueo({
        id_espacio: idEspacio,
        fecha_inicio: bloFechaInicio,
        fecha_fin: bloFechaFin,
        hora_inicio: bloTodoElDia ? undefined : `${bloHoraInicio}:00`,
        hora_fin: bloTodoElDia ? undefined : `${bloHoraFin}:00`,
        motivo: bloMotivo,
      })
      setBloFechaInicio("")
      setBloFechaFin("")
      setBloMotivo("")
      refrescarMes()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el bloqueo")
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
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {espacios.map((e) => (
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
      {error && (
        <div style={{ color: C.crimson, marginBottom: 12, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
        <CalendarGrid
          reservas={delEspacio}
          bloqueos={delEspacioBloqueos}
          selectedFecha={fecha}
          onSelectFecha={setFecha}
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
            {fecha ? `Franjas del ${fecha} (09:00–16:00)` : "Seleccioná un día"}
          </div>
          {isLoading && (
            <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              Cargando disponibilidad...
            </div>
          )}
          {fecha && !isLoading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SLOTS.filter((_, i) => i % 2 === 0).map((slot) => {
                const ocupado = slotOcupado(slot)
                const bloqueado = slotBloqueado(slot)
                const pendiente = slotPendiente(slot)
                const inhabilitado = ocupado || bloqueado
                return (
                  <button
                    key={slot}
                    disabled={inhabilitado}
                    onClick={() => reservar(slot)}
                    style={{
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
                      cursor: inhabilitado ? "default" : "pointer",
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12.5,
                    }}
                  >
                    {slot}–{addHour(slot)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
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
          Mis reservas
        </div>
        {misReservas.length === 0 && (
          <div style={{ color: C.textFaint, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
            No tenés reservas vigentes.
          </div>
        )}
        {misReservas.map((r) => (
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
              color: C.text,
            }}
          >
            <span>
              {nombreEspacio(r.idEspacio)} · {r.fecha} · {r.horaInicio}–{r.horaFin} ·{" "}
              <strong style={{ color: r.estado === "Aprobada" ? C.available : C.pending }}>{r.estado}</strong>
            </span>
            <button
              onClick={() => cancelar(r.id)}
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
          </div>
        ))}
      </div>

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
                <span>
                  Usuario #{r.idUsuario} · {nombreEspacio(r.idEspacio)} · {r.fecha} · {r.horaInicio}–{r.horaFin}
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
                Bloquear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
