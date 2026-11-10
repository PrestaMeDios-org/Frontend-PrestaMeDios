import { useState } from "react"
import { C_LIGHT, C_DARK, ThemeCtx, useC } from "./theme"
import type { Screen } from "./types"
import { MainLayout } from "./components/layout/MainLayout"
import { CatalogPage } from "./features/inventory/pages/CatalogPage"
import { StockPage } from "./features/inventory/pages/StockPage"
import { SpacesPage } from "./features/spaces/pages/SpacesPage"
import { AuthProvider, SedeProvider, useAuth, useSede, useUsuario } from "./features/auth/AuthContext"
import { esAdmin, iniciales, ROL_LABEL, uiRole } from "./features/auth/roles"
import { LoginPage } from "./features/auth/pages/LoginPage"
import { RegisterPage } from "./features/auth/pages/RegisterPage"
import { RecoverPasswordPage } from "./features/auth/pages/RecoverPasswordPage"
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage"
import { esRutaRestablecer, leerTokenDeRecuperacion, limpiarFragmento } from "./features/auth/recuperacion"
import { ChangePasswordPage } from "./features/auth/pages/ChangePasswordForm"
import { ProfilePage } from "./features/users/pages/ProfilePage"
import { UsersPage } from "./features/users/pages/UsersPage"
import { ParametersPage } from "./features/config/pages/ParametersPage"
import { NewsPage } from "./features/notifications/pages/NewsPage"

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

/**
 * Enlace de recuperación (SPEC-03 RN-47), leído una sola vez al cargar el módulo y quitado
 * de la barra de direcciones: `undefined` si no es `#/restablecer`, `null` si el token no
 * sirve. Fuera de React para que el doble render de `StrictMode` no lo pierda.
 */
function leerEnlaceDeRecuperacion(): string | null | undefined {
  const { hash } = window.location
  if (!esRutaRestablecer(hash)) return undefined
  const token = leerTokenDeRecuperacion(hash)
  limpiarFragmento()
  return token
}
const ENLACE_RECUPERACION = typeof window !== "undefined" ? leerEnlaceDeRecuperacion() : undefined

type PantallaPublica = "login" | "registro" | "recuperar" | "restablecer"

/** Sin sesión → pantallas públicas; con cambio obligatorio → cambio de contraseña; si no, la app. */
function AuthGate({ dark, onDarkToggle }: { dark: boolean; onDarkToggle: () => void }) {
  const { usuario, cargando, logout } = useAuth()
  const [publica, setPublica] = useState<PantallaPublica>(
    ENLACE_RECUPERACION !== undefined ? "restablecer" : "login",
  )

  // El enlace del correo se muestra fuera del layout, haya o no sesión abierta (SPEC-03 §5.5).
  if (publica === "restablecer") {
    return (
      <ResetPasswordPage
        token={ENLACE_RECUPERACION ?? null}
        onListo={(aviso) => {
          logout(aviso) // el backend cerró todas las sesiones (RN-52)
          setPublica("login")
        }}
        onPedirOtro={() => setPublica("recuperar")}
      />
    )
  }
  if (cargando) return <Cargando />
  if (!usuario) {
    if (publica === "registro") return <RegisterPage onVolver={() => setPublica("login")} />
    if (publica === "recuperar") return <RecoverPasswordPage onVolver={() => setPublica("login")} />
    return (
      <LoginPage
        onRegistrarse={() => setPublica("registro")}
        onOlvidoPassword={() => setPublica("recuperar")}
      />
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
        fotoId: usuario.foto_id,
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
      {visible === "admin-stock" && <StockPage />}
      {visible === "spaces" && <SpacesPage key={sedeVista ?? "ambas"} role={role} />}
      {visible === "profile" && <ProfilePage />}
      {visible === "users" && <UsersPage />}
      {visible === "parameters" && <ParametersPage />}
      {visible === "news" && <NewsPage />}

      {/*
        Módulos en desarrollo por el equipo (loans, novedades, etc.): se
        renderizan aquí según `screen`, siguiendo la misma estructura.
      */}
      {!["catalog", "admin-stock", "spaces", "profile", "users", "parameters", "news"].includes(visible) && (
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
