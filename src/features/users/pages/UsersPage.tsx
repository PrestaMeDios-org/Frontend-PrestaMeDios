import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, Grid, SelectField, TextField } from "../../../components/ui/Form"
import { useC } from "../../../theme"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { errorPassword, ESTADO_LABEL, iniciales, ROL_LABEL } from "../../auth/roles"
import { SEDES } from "../../auth/types"
import {
  cambiarEstado,
  crearUsuario,
  editarUsuario,
  listarUsuarios,
  obtenerUsuario,
  quitarFotoDeUsuario,
} from "../services/usersApi"
import { Avatar } from "../../../components/ui/Avatar"
import { Badge } from "../../../components/ui/Badge"
import { SearchInput } from "../../../components/ui/Input"
import type {
  EstadoCuenta,
  EstadoDestino,
  PaginaUsuariosDTO,
  RolUsuario,
  Sede,
  UsuarioAdminUpdateDTO,
  UsuarioDetalleDTO,
  UsuarioResumenDTO,
} from "../types"
import { usePedirTexto } from "../../../components/ui/Dialogo"

const POR_PAGINA = 20
const ROLES: RolUsuario[] = ["ESTUDIANTE", "DOCENTE", "ADMIN_LOCAL", "SUPERADMIN"]
const ESTADOS: EstadoCuenta[] = ["PENDIENTE_APROBACION", "ACTIVO", "SUSPENDIDO", "INACTIVO", "RECHAZADO"]

/** SPEC-10 V-20: orden del directorio con lo que el backend ya acepta (`ordenar_por`, `direccion`). */
const ORDENES = [
  { value: "apellido-asc", label: "Apellido A → Z" },
  { value: "apellido-desc", label: "Apellido Z → A" },
  { value: "created_at-desc", label: "Más nuevas primero" },
  { value: "created_at-asc", label: "Más viejas primero" },
] as const
type Orden = (typeof ORDENES)[number]["value"]

type Accion = { label: string; destino: EstadoDestino; pideMotivo: boolean; peligro?: boolean }

/** Acciones disponibles según el estado (SPEC-01 §3.2). */
const ACCIONES: Record<EstadoCuenta, Accion[]> = {
  PENDIENTE_APROBACION: [
    { label: "Aprobar", destino: "ACTIVO", pideMotivo: false },
    { label: "Rechazar", destino: "RECHAZADO", pideMotivo: true, peligro: true },
  ],
  ACTIVO: [
    { label: "Suspender", destino: "SUSPENDIDO", pideMotivo: true, peligro: true },
    { label: "Dar de baja", destino: "INACTIVO", pideMotivo: true, peligro: true },
  ],
  SUSPENDIDO: [
    { label: "Reactivar", destino: "ACTIVO", pideMotivo: false },
    { label: "Dar de baja", destino: "INACTIVO", pideMotivo: true, peligro: true },
  ],
  INACTIVO: [{ label: "Reactivar", destino: "ACTIVO", pideMotivo: false }],
  RECHAZADO: [],
}

/** Gestión de usuarios: bandeja de pendientes y directorio (USR-04, USR-05, GLO-01). */
export function UsersPage() {
  const actor = useUsuario()
  const { sedeVista } = useSede()
  const esSuper = actor.rol === "SUPERADMIN"
  const C = useC()
  const [pestana, setPestana] = useState<"pendientes" | "directorio" | "nueva">("pendientes")
  const [rol, setRol] = useState<RolUsuario | "">("")
  const [estado, setEstado] = useState<EstadoCuenta | "">("")
  const [q, setQ] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [offset, setOffset] = useState(0)
  const [pagina, setPagina] = useState<PaginaUsuariosDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [editando, setEditando] = useState<UsuarioDetalleDTO | null>(null)
  const [orden, setOrden] = useState<Orden>("apellido-asc")
  const [conteoRol, setConteoRol] = useState<Partial<Record<RolUsuario | "", number>>>({})
  const rolesVisibles = esSuper ? ROLES : ROLES.filter((r) => r !== "SUPERADMIN")

  const cargar = useCallback(() => {
    setError(null)
    const [ordenar_por, direccion] = orden.split("-") as ["apellido" | "created_at", "asc" | "desc"]
    const base = { sede: sedeVista, estado, q: busqueda.length >= 2 ? busqueda : "" }
    const filtros =
      pestana === "pendientes"
        ? { estado: "PENDIENTE_APROBACION" as const, sede: sedeVista, limit: 100, offset: 0 }
        : { ...base, rol, ordenar_por, direccion, limit: POR_PAGINA, offset }
    listarUsuarios(filtros)
      .then(setPagina)
      .catch((e) => setError(mensajeDeError(e)))
    // SPEC-10 V-20: cantidad por rol para los chips (sólo el total, `limit: 1`).
    if (pestana === "directorio")
      Promise.all(
        (["", ...ROLES] as const).map((r) =>
          listarUsuarios({ ...base, rol: r, limit: 1, offset: 0 }).then((p) => [r, p.total] as const),
        ),
      )
        .then((pares) => setConteoRol(Object.fromEntries(pares)))
        .catch(() => setConteoRol({}))
  }, [pestana, sedeVista, rol, estado, busqueda, offset, orden])

  useEffect(() => {
    if (pestana !== "nueva") cargar()
  }, [cargar, pestana])

  useEffect(() => setOffset(0), [rol, estado, busqueda, sedeVista, orden])

  const pedirTexto = usePedirTexto() // SPEC-10 V-11: en lugar de window.prompt
  const ejecutar = async (u: UsuarioResumenDTO, accion: Accion) => {
    let motivo: string | undefined
    if (accion.pideMotivo) {
      motivo =
        (await pedirTexto({
          titulo: `${accion.label}: ${u.nombre} ${u.apellido}`,
          etiqueta: "Motivo",
          aceptar: accion.label,
          minimo: 3,
        })) ?? undefined
      if (!motivo) return
      if (motivo.length < 3) {
        setError("El motivo debe tener al menos 3 caracteres.")
        return
      }
    }
    try {
      await cambiarEstado(u.id, accion.destino, motivo)
      setAviso(`${u.nombre} ${u.apellido}: ${ESTADO_LABEL[accion.destino]}.`)
      cargar()
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const abrirEdicion = async (id: number) => {
    try {
      setEditando(await obtenerUsuario(id))
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  const items = pagina?.items ?? []
  const total = pagina?.total ?? 0

  return (
    <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto", display: "grid", gap: 16, alignContent: "start" }}>
      <div role="tablist" style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${C.border}` }}>
        <Pestana activa={pestana === "pendientes"} onClick={() => setPestana("pendientes")}>
          Pendientes{pestana === "pendientes" && pagina ? ` (${total})` : ""}
        </Pestana>
        <Pestana activa={pestana === "directorio"} onClick={() => setPestana("directorio")}>
          Directorio
        </Pestana>
        {esSuper && (
          <Pestana activa={pestana === "nueva"} onClick={() => setPestana("nueva")}>
            + Nueva cuenta
          </Pestana>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {aviso && <Alert tipo="ok">{aviso}</Alert>}

      {pestana === "nueva" ? (
        <NuevaCuenta
          onCreada={(u) => {
            setAviso(`Cuenta creada para ${u.nombre} ${u.apellido}. Deberá cambiar la contraseña al ingresar.`)
            setPestana("directorio")
          }}
        />
      ) : (
        <>
          {pestana === "directorio" && (
            // SPEC-10 V-20: chips por rol (USR-04), estado y orden en una fila, como en el catálogo
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {(["", ...rolesVisibles] as const).map((r) => {
                  const activo = rol === r
                  const n = conteoRol[r]
                  return (
                    <button key={r || "todos"} type="button" aria-pressed={activo} onClick={() => setRol(r)} style={chip(C, activo)}>
                      {r ? ROL_PLURAL[r] : "Todos"}
                      {n !== undefined && (
                        <span
                          style={{
                            background: activo ? "rgba(255,255,255,0.22)" : C.bg,
                            borderRadius: 100,
                            padding: "0 5px",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <SearchInput
                  value={q}
                  onChange={(v) => {
                    setQ(v)
                    setBusqueda(v.trim())
                  }}
                  placeholder="Buscar por nombre, apellido, email o DNI…"
                />
                <select
                  aria-label="Filtrar por estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoCuenta | "")}
                  style={selectChico(C)}
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_LABEL[e]}
                    </option>
                  ))}
                </select>
                <select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} style={selectChico(C)}>
                  {ORDENES.map((o) => (
                    <option key={o.value} value={o.value}>
                      Ordenar: {o.label}
                    </option>
                  ))}
                </select>
                {pagina && (
                  <span style={{ marginLeft: "auto", fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: C.textMuted }}>
                    {total} {total === 1 ? "cuenta" : "cuentas"}
                  </span>
                )}
              </div>
            </div>
          )}

          {editando && (
            <EditarUsuario
              usuario={editando}
              onCancelar={() => setEditando(null)}
              onGuardado={(u) => {
                setEditando(null)
                setAviso(`Cambios guardados para ${u.nombre} ${u.apellido}.`)
                cargar()
              }}
            />
          )}

          <Card>
            {items.length === 0 ? (
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.6 }}>
                {pestana === "pendientes" ? "No hay solicitudes pendientes." : "No hay usuarios para estos filtros."}
              </span>
            ) : (
              <TablaUsuarios
                items={items}
                mostrarSede={sedeVista === null}
                onAccion={ejecutar}
                onEditar={abrirEdicion}
                puedeGestionar={(u) => esSuper || (u.rol !== "ADMIN_LOCAL" && u.rol !== "SUPERADMIN")}
                actorId={actor.id}
              />
            )}
            {pestana === "directorio" && total > POR_PAGINA && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
                <Button variant="ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - POR_PAGINA))}>
                  Anterior
                </Button>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>
                  {offset + 1}–{Math.min(offset + POR_PAGINA, total)} de {total}
                </span>
                <Button variant="ghost" disabled={offset + POR_PAGINA >= total} onClick={() => setOffset(offset + POR_PAGINA)}>
                  Siguiente
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function Pestana({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: ReactNode }) {
  const C = useC()
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      style={{
        padding: "8px 14px",
        border: "none",
        borderBottom: `2px solid ${activa ? C.crimson : "transparent"}`,
        background: "transparent",
        color: activa ? C.crimson : C.textMuted,
        cursor: "pointer",
        fontFamily: "'Outfit',sans-serif",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  )
}

type Tokens = ReturnType<typeof useC>

const ROL_PLURAL: Record<RolUsuario, string> = {
  ESTUDIANTE: "Estudiantes",
  DOCENTE: "Docentes",
  ADMIN_LOCAL: "Administradores locales",
  SUPERADMIN: "Superadministradores",
}

const chip = (C: Tokens, activo: boolean): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "6px 13px",
  borderRadius: 100,
  border: `1.5px solid ${activo ? C.crimson : C.border}`,
  background: activo ? C.crimson : C.card,
  color: activo ? "white" : C.textMuted,
  fontFamily: "'Outfit',sans-serif",
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
})

const selectChico = (C: Tokens): CSSProperties => ({
  padding: "8px 12px",
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  background: C.card,
  color: C.text,
  fontFamily: "'Outfit',sans-serif",
  fontSize: 13,
})

/** Colores de rol y estado para los chips de la tabla (SPEC-10 V-20). */
function colorRol(C: Tokens, r: RolUsuario) {
  if (r === "SUPERADMIN") return { color: C.premium, bg: C.premiumBg }
  if (r === "ADMIN_LOCAL") return { color: C.crimson, bg: C.crimsonLight }
  if (r === "DOCENTE") return { color: C.mine, bg: C.mineBg }
  return { color: C.textMuted, bg: C.bg }
}

function colorEstado(C: Tokens, e: EstadoCuenta) {
  if (e === "ACTIVO") return { color: C.available, bg: C.availableBg }
  if (e === "PENDIENTE_APROBACION") return { color: C.pending, bg: C.pendingBg }
  if (e === "SUSPENDIDO") return { color: C.maintenance, bg: C.maintenanceBg }
  if (e === "RECHAZADO") return { color: C.occupied, bg: C.occupiedBg }
  return { color: C.textMuted, bg: C.bg }
}

function TablaUsuarios({
  items,
  mostrarSede,
  onAccion,
  onEditar,
  puedeGestionar,
  actorId,
}: {
  items: UsuarioResumenDTO[]
  mostrarSede: boolean
  onAccion: (u: UsuarioResumenDTO, a: Accion) => void
  onEditar: (id: number) => void
  puedeGestionar: (u: UsuarioResumenDTO) => boolean
  actorId: number
}) {
  const C = useC()
  const th: CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    fontFamily: "'Outfit',sans-serif",
    fontSize: 12,
    color: C.textMuted,
    borderBottom: `1px solid ${C.border}`,
  }
  const td: CSSProperties = {
    padding: "9px 10px",
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    color: C.text,
    borderBottom: `1px solid ${C.borderLight}`,
    verticalAlign: "middle",
  }
  const boton = (peligro?: boolean): CSSProperties => ({
    padding: "5px 10px",
    borderRadius: 8,
    border: "none",
    background: peligro ? C.occupiedBg : C.availableBg,
    color: peligro ? C.occupied : C.available,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  })
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Apellido y nombre</th>
            <th style={th}>Email</th>
            <th style={th}>DNI</th>
            <th style={th}>Rol</th>
            {mostrarSede && <th style={th}>Sede</th>}
            <th style={th}>Estado</th>
            <th style={th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => {
            const gestionable = puedeGestionar(u) && u.id !== actorId
            return (
              <tr key={u.id}>
                <td style={td}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 32,
                        height: 32,
                        flexShrink: 0,
                        borderRadius: 999,
                        background: C.crimsonLight,
                        color: C.crimson,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      {iniciales(u.nombre, u.apellido)}
                    </span>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                      {u.apellido}, {u.nombre}
                    </span>
                  </span>
                </td>
                <td style={{ ...td, color: C.textMuted }}>{u.email}</td>
                <td style={{ ...td, color: C.textMuted }}>{u.dni}</td>
                <td style={td}>
                  <Badge label={ROL_LABEL[u.rol]} {...colorRol(C, u.rol)} />
                </td>
                {mostrarSede && <td style={td}>{u.sede ?? "Ambas"}</td>}
                <td style={td}>
                  <Badge label={ESTADO_LABEL[u.estado]} {...colorEstado(C, u.estado)} />
                </td>
                <td style={td}>
                  {gestionable ? (
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {ACCIONES[u.estado].map((a) => (
                        <button key={a.label} style={boton(a.peligro)} onClick={() => onAccion(u, a)}>
                          {a.label}
                        </button>
                      ))}
                      <button
                        style={{ ...boton(), background: C.mineBg, color: C.mine }}
                        onClick={() => onEditar(u.id)}
                      >
                        Editar
                      </button>
                    </span>
                  ) : (
                    <span style={{ opacity: 0.5, fontSize: 12 }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Alta directa (UC-06, sólo SUPERADMIN) ────────────────────────────────────
function NuevaCuenta({ onCreada }: { onCreada: (u: UsuarioDetalleDTO) => void }) {
  const [d, setD] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    password: "",
    rol: "ADMIN_LOCAL" as RolUsuario,
    sede: "Ushuaia" as Sede,
  })
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const set = <K extends keyof typeof d>(k: K) => (v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }))
  const errPwd = d.password ? errorPassword(d.password, d.email) : null

  const crear = async () => {
    setError(null)
    setCampos({})
    if (errPwd) return
    setEnviando(true)
    try {
      const creado = await crearUsuario({
        ...d,
        telefono: d.telefono.trim() || null,
        sede: d.rol === "SUPERADMIN" ? null : d.sede,
      })
      onCreada(creado)
    } catch (e) {
      if (e instanceof ApiError) setCampos(e.campos)
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card title="Nueva cuenta">
      {error && <Alert>{error}</Alert>}
      <Grid>
        <TextField label="Nombre" value={d.nombre} onChange={set("nombre")} error={campos.nombre} />
        <TextField label="Apellido" value={d.apellido} onChange={set("apellido")} error={campos.apellido} />
        <TextField label="DNI" value={d.dni} onChange={set("dni")} error={campos.dni} />
        <TextField label="Email" type="email" value={d.email} onChange={set("email")} error={campos.email} />
        <TextField label="Teléfono (opcional)" value={d.telefono} onChange={set("telefono")} error={campos.telefono} />
        <TextField
          label="Contraseña inicial"
          type="password"
          value={d.password}
          onChange={set("password")}
          error={errPwd ?? campos.password}
          hint="La persona deberá cambiarla en su primer ingreso."
          autoComplete="new-password"
        />
        <SelectField<RolUsuario>
          label="Rol"
          value={d.rol}
          onChange={set("rol")}
          options={ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }))}
        />
        <SelectField<Sede | "AMBAS">
          label="Alcance"
          value={d.rol === "SUPERADMIN" ? "AMBAS" : d.sede}
          onChange={(v) => v !== "AMBAS" && set("sede")(v)}
          disabled={d.rol === "SUPERADMIN"}
          options={[
            ...SEDES.map((s) => ({ value: s, label: s })),
            ...(d.rol === "SUPERADMIN" ? [{ value: "AMBAS" as const, label: "Ambas sedes" }] : []),
          ]}
        />
      </Grid>
      <div>
        <Button onClick={crear} disabled={enviando}>
          {enviando ? "Creando…" : "Crear cuenta"}
        </Button>
      </div>
    </Card>
  )
}

// ─── Edición administrativa (UC-12) ───────────────────────────────────────────
function EditarUsuario({
  usuario,
  onCancelar,
  onGuardado,
}: {
  usuario: UsuarioDetalleDTO
  onCancelar: () => void
  onGuardado: (u: UsuarioDetalleDTO) => void
}) {
  const actor = useUsuario()
  const esSuper = actor.rol === "SUPERADMIN"
  const [d, setD] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    dni: usuario.dni,
    email: usuario.email,
    telefono: usuario.telefono ?? "",
    rol: usuario.rol,
    sede: usuario.sede,
    password_nueva: "",
  })
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [fotoId, setFotoId] = useState(usuario.foto_id)
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null)
  // RN-64: el ADMIN_LOCAL sólo quita fotos de estudiantes y docentes (el backend lo exige igual).
  const puedeQuitarFoto = esSuper || usuario.rol === "ESTUDIANTE" || usuario.rol === "DOCENTE"
  const quitarFoto = async () => {
    setError(null)
    setAvisoFoto(null)
    try {
      setFotoId((await quitarFotoDeUsuario(usuario.id)).foto_id)
      setAvisoFoto("Foto quitada.")
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo quitar la foto."))
    }
  }
  const set = <K extends keyof typeof d>(k: K) => (v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }))
  const roles: RolUsuario[] = esSuper ? ROLES : ["ESTUDIANTE", "DOCENTE"]

  const guardar = async () => {
    setError(null)
    setCampos({})
    const cambios: UsuarioAdminUpdateDTO = {}
    if (d.nombre !== usuario.nombre) cambios.nombre = d.nombre
    if (d.apellido !== usuario.apellido) cambios.apellido = d.apellido
    if (d.dni !== usuario.dni) cambios.dni = d.dni
    if (d.email !== usuario.email) cambios.email = d.email
    if (d.telefono.trim() !== (usuario.telefono ?? "")) cambios.telefono = d.telefono.trim() || null
    if (d.rol !== usuario.rol) cambios.rol = d.rol
    const sede = d.rol === "SUPERADMIN" ? null : (d.sede ?? "Ushuaia")
    if (sede !== usuario.sede) cambios.sede = sede
    if (d.password_nueva) cambios.password_nueva = d.password_nueva
    if (Object.keys(cambios).length === 0) return onCancelar()
    try {
      onGuardado(await editarUsuario(usuario.id, cambios))
    } catch (e) {
      if (e instanceof ApiError) setCampos(e.campos)
      setError(mensajeDeError(e))
    }
  }

  return (
    <Card title={`Editar: ${usuario.apellido}, ${usuario.nombre}`}>
      {error && <Alert>{error}</Alert>}
      {avisoFoto && <Alert tipo="ok">{avisoFoto}</Alert>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar fotoId={fotoId} initials={iniciales(usuario.nombre, usuario.apellido)} size={56} radius={28} />
        {fotoId && puedeQuitarFoto && (
          <Button variant="ghost" onClick={quitarFoto}>
            Quitar foto
          </Button>
        )}
      </div>
      {usuario.motivo_estado && (
        <Alert tipo="info">
          Último motivo de cambio de estado: {usuario.motivo_estado}
          {usuario.suspendido_hasta && ` (suspendida hasta ${new Date(usuario.suspendido_hasta).toLocaleDateString()})`}
        </Alert>
      )}
      <Grid>
        <TextField label="Nombre" value={d.nombre} onChange={set("nombre")} error={campos.nombre} />
        <TextField label="Apellido" value={d.apellido} onChange={set("apellido")} error={campos.apellido} />
        <TextField label="DNI" value={d.dni} onChange={set("dni")} error={campos.dni} />
        <TextField label="Email" type="email" value={d.email} onChange={set("email")} error={campos.email} />
        <TextField label="Teléfono" value={d.telefono} onChange={set("telefono")} error={campos.telefono} />
        <SelectField<RolUsuario>
          label="Rol"
          value={d.rol}
          onChange={set("rol")}
          options={roles.map((r) => ({ value: r, label: ROL_LABEL[r] }))}
        />
        {esSuper && d.rol !== "SUPERADMIN" && (
          <SelectField<Sede>
            label="Sede"
            value={d.sede ?? "Ushuaia"}
            onChange={(v) => set("sede")(v)}
            options={SEDES.map((s) => ({ value: s, label: s }))}
          />
        )}
        <TextField
          label="Restablecer contraseña (opcional)"
          type="password"
          value={d.password_nueva}
          onChange={set("password_nueva")}
          error={d.password_nueva ? errorPassword(d.password_nueva) : campos.password_nueva}
          hint="La persona deberá cambiarla al ingresar."
          autoComplete="new-password"
        />
      </Grid>
      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={guardar}>Guardar</Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}
