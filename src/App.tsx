import { useState } from "react"
import { C_LIGHT, C_DARK, ThemeCtx, useC } from "./theme"
import type { Screen } from "./types"
import { MainLayout } from "./components/layout/MainLayout"
import { CatalogPage } from "./features/inventory/pages/CatalogPage"
import { SpacesPage } from "./features/spaces/pages/SpacesPage"
import { AuthProvider, SedeProvider, useAuth, useSede, useUsuario } from "./features/auth/AuthContext"
import { esAdmin, iniciales, ROL_LABEL, uiRole } from "./features/auth/roles"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { RegisterPage } from "./features/auth/pages/RegisterPage"
import { ChangePasswordPage } from "./features/auth/pages/ChangePasswordForm"
import { ProfilePage } from "./features/users/pages/ProfilePage"
import { UsersPage } from "./features/users/pages/UsersPage"
import { ParametersPage } from "./features/config/pages/ParametersPage"

const TITLES: Record<Screen, { title: string; subtitle?: string }> = {
  catalog: {
    title: "Catálogo de Equipos",
    subtitle: "Equipos disponibles para préstamo",
  },
  detail: { title: "Detalle", subtitle: "Solicitar préstamo" },
  spaces: {
    title: "Reservas de Espacios",
    subtitle: "Calendario mensual · Hasta 4 meses a futuro",
  },
  news: { title: "Novedades", subtitle: "Avisos e información institucional" },
  status: {
    title: "Mis Solicitudes",
    subtitle: "Equipos y espacios reservados",
  },
  validations: {
    title: "Validaciones Pendientes",
    subtitle: "Revisá y aprobá las solicitudes",
  },
  deliveries: {
    title: "Gestión de Entregas — Mostrador",
    subtitle: "Solicitudes aprobadas · Retiros y devoluciones",
  },
  "admin-dashboard": {
    title: "Historial de Solicitudes",
    subtitle: "Registro completo de préstamos",
  },
  "admin-validations": {
    title: "Bandeja de Validaciones",
    subtitle: "Solicitudes a revisar",
  },
  "admin-stock": { title: "Control de Stock", subtitle: "Inventario por sede" },
  "admin-calendar": {
    title: "Calendario de Operaciones",
    subtitle: "Préstamos y reservas",
  },
  users: { title: "Gestión de Usuarios", subtitle: "Aprobación de cuentas y directorio" },
  notes: { title: "Anotaciones", subtitle: "Notas internas" },
  profile: { title: "Mi Perfil", subtitle: "Datos de contacto y contraseña" },
  parameters: { title: "Parámetros Globales", subtitle: "Reglas operativas del laboratorio" },
}

/** Pantallas exclusivas de administración (se ocultan del menú del resto). */
const SOLO_ADMIN: Screen[] = [
  "users",
  "parameters",
  "admin-dashboard",
  "admin-validations",
  "admin-stock",
  "admin-calendar",
  "deliveries",
  "notes",
]

export default function App() {
  const [dark, setDark] = useState(false)
  return (
    <ThemeCtx.Provider value={dark ? C_DARK : C_LIGHT}>
      <AuthProvider>
        <AuthGate dark={dark} onDarkToggle={() => setDark((d) => !d)} />
      </AuthProvider>
    </ThemeCtx.Provider>
  )
}

/** Sin sesión → login/registro; con cambio obligatorio → cambio de contraseña; si no, la app. */
function AuthGate({ dark, onDarkToggle }: { dark: boolean; onDarkToggle: () => void }) {
  const { usuario, cargando } = useAuth()
  const [registro, setRegistro] = useState(false)

  if (cargando) return <Cargando />
  if (!usuario) {
    return registro ? (
      <RegisterPage onVolver={() => setRegistro(false)} />
    ) : (
      <LoginPage onRegistrarse={() => setRegistro(true)} />
    )
  }
  if (usuario.debe_cambiar_password) return <ChangePasswordPage />
  return (
    <SedeProvider>
      <Shell dark={dark} onDarkToggle={onDarkToggle} />
    </SedeProvider>
  )
}

function Shell({ dark, onDarkToggle }: { dark: boolean; onDarkToggle: () => void }) {
  const C = useC()
  const usuario = useUsuario()
  const { logout } = useAuth()
  const { sedeVista, puedeElegir, setSedeVista } = useSede()
  const role = uiRole(usuario.rol)
  const [screen, setScreen] = useState<Screen>("catalog")
  const visible: Screen = SOLO_ADMIN.includes(screen) && !esAdmin(usuario.rol) ? "catalog" : screen

  const { title, subtitle } = TITLES[visible]

  return (
    <MainLayout
      role={role}
      screen={visible}
      onNavigate={setScreen}
      user={{
        initials: iniciales(usuario.nombre, usuario.apellido),
        name: `${usuario.nombre} ${usuario.apellido}`,
        sub: `${ROL_LABEL[usuario.rol]} · ${usuario.sede ?? "Ambas sedes"}`,
        email: usuario.email,
      }}
      sede={{ vista: sedeVista, puedeElegir, onChange: setSedeVista }}
      onLogout={() => logout()}
      title={title}
      subtitle={subtitle}
      dark={dark}
      onDarkToggle={onDarkToggle}
      onProfile={() => setScreen("profile")}
      onHelp={() => {}}
    >
      {visible === "catalog" && <CatalogPage role={role} userSede={sedeVista ?? undefined} />}
      {visible === "spaces" && <SpacesPage key={sedeVista ?? "ambas"} role={role} />}
      {visible === "profile" && <ProfilePage />}
      {visible === "users" && <UsersPage />}
      {visible === "parameters" && <ParametersPage />}

      {/*
        Módulos en desarrollo por el equipo (loans, novedades, etc.): se
        renderizan aquí según `screen`, siguiendo la misma estructura.
      */}
      {!["catalog", "spaces", "profile", "users", "parameters"].includes(visible) && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.textFaint,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          Módulo "{visible}" — pendiente de implementación
        </div>
      )}
    </MainLayout>
  )
}

function Cargando() {
  const C = useC()
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        color: C.textMuted,
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      Cargando sesión…
    </div>
  )
}
