import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { Button } from "../../../components/ui/Button"
import { Alert, Card, Grid, SelectField, TextField } from "../../../components/ui/Form"
import { useC } from "../../../theme"
import { ApiError, mensajeDeError } from "../../../lib/api"
import { useSede, useUsuario } from "../../auth/AuthContext"
import { errorPassword, ESTADO_LABEL, ROL_LABEL } from "../../auth/roles"
import { SEDES } from "../../auth/types"
import { cambiarEstado, crearUsuario, editarUsuario, listarUsuarios, obtenerUsuario } from "../services/usersApi"
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

const POR_PAGINA = 20
const ROLES: RolUsuario[] = ["ESTUDIANTE", "DOCENTE", "ADMIN_LOCAL", "SUPERADMIN"]
const ESTADOS: EstadoCuenta[] = ["PENDIENTE_APROBACION", "ACTIVO", "SUSPENDIDO", "INACTIVO", "RECHAZADO"]

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

  const cargar = useCallback(() => {
    setError(null)
    const filtros =
      pestana === "pendientes"
        ? { estado: "PENDIENTE_APROBACION" as const, sede: sedeVista, limit: 100, offset: 0 }
        : { sede: sedeVista, rol, estado, q: busqueda.length >= 2 ? busqueda : "", limit: POR_PAGINA, offset }
    listarUsuarios(filtros)
      .then(setPagina)
      .catch((e) => setError(mensajeDeError(e)))
  }, [pestana, sedeVista, rol, estado, busqueda, offset])

  useEffect(() => {
    if (pestana !== "nueva") cargar()
  }, [cargar, pestana])

  useEffect(() => setOffset(0), [rol, estado, busqueda, sedeVista])

  const ejecutar = async (u: UsuarioResumenDTO, accion: Accion) => {
    let motivo: string | undefined
    if (accion.pideMotivo) {
      motivo = window.prompt(`Motivo para "${accion.label}" la cuenta de ${u.nombre} ${u.apellido}:`)?.trim()
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
            <Card>
              <Grid min={180}>
                <SelectField<RolUsuario | "">
                  label="Rol"
                  value={rol}
                  onChange={setRol}
                  options={[{ value: "", label: "Todos" }, ...ROLES.map((r) => ({ value: r, label: ROL_LABEL[r] }))]}
                />
                <SelectField<EstadoCuenta | "">
                  label="Estado"
                  value={estado}
                  onChange={setEstado}
                  options={[
                    { value: "", label: "Todos" },
                    ...ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e] })),
                  ]}
                />
                <TextField
                  label="Buscar"
                  value={q}
                  onChange={(v) => {
                    setQ(v)
                    setBusqueda(v.trim())
                  }}
                  placeholder="Nombre, apellido, email o DNI"
                  hint="Mínimo 2 caracteres."
                />
              </Grid>
            </Card>
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
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        border: `1px solid ${activa ? C.crimson : C.border}`,
        background: activa ? C.crimsonLight : C.card,
        color: activa ? C.crimson : C.text,
        cursor: "pointer",
        fontFamily: "'Outfit',sans-serif",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
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
                  {u.apellido}, {u.nombre}
                </td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.dni}</td>
                <td style={td}>{ROL_LABEL[u.rol]}</td>
                {mostrarSede && <td style={td}>{u.sede ?? "Ambas"}</td>}
                <td style={td}>{ESTADO_LABEL[u.estado]}</td>
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
