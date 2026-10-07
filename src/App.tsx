import { useState } from "react"
import { C_LIGHT, C_DARK, ThemeCtx } from "./theme"
import type { Role, Screen } from "./types"
import { MainLayout } from "./components/layout/MainLayout"
import { CatalogPage } from "./features/inventory/pages/CatalogPage"
import { SpacesPage } from "./features/spaces/pages/SpacesPage"

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
    subtitle: "Registro completo de préstamos — ICSE",
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
  users: { title: "Gestión de Usuarios", subtitle: "Alumnos y docentes" },
  notes: { title: "Anotaciones", subtitle: "Notas internas" },
}

export default function App() {
  const [role, setRole] = useState<Role>("student")
  const [screen, setScreen] = useState<Screen>("catalog")
  const [dark, setDark] = useState(false)
  const C = dark ? C_DARK : C_LIGHT

  const { title, subtitle } = TITLES[screen]

  return (
    <ThemeCtx.Provider value={C}>
      <MainLayout
        role={role}
        screen={screen}
        onNavigate={setScreen}
        onRoleChange={(r) => {
          setRole(r)
          setScreen("catalog")
        }}
        title={title}
        subtitle={subtitle}
        dark={dark}
        onDarkToggle={() => setDark((d) => !d)}
        onProfile={() => {}}
        onHelp={() => {}}
      >
        {/* Módulo de Inventario — plantilla activa */}
        {screen === "catalog" && <CatalogPage role={role} />}
        {screen === "spaces" && <SpacesPage role={role} />}

        {/*
          Módulos en desarrollo por el equipo:
          - loans: src/features/loans/pages/LoansPage.tsx
          - spaces: src/features/spaces/pages/SpacesPage.tsx
          - users: src/features/users/pages/UsersPage.tsx
          Cada uno se renderiza aquí según `screen`, siguiendo
          la misma estructura que CatalogPage.
        */}
        {screen !== "catalog" && screen !== "spaces" && (
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
            Módulo "{screen}" — pendiente de implementación
          </div>
        )}
      </MainLayout>
    </ThemeCtx.Provider>
  )
}
