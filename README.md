# PrestaMeDios — Frontend

Aplicación web del sistema de préstamos de equipamiento y reservas de espacios del **Laboratorio de Medios Audiovisuales (LMA)** del ICSE — Universidad Nacional de Tierra del Fuego (UNTDF), sedes **Ushuaia** y **Río Grande**.

| | |
| --- | --- |
| **Requisitos (ERS IEEE 830)** | [`docs/ERS.md` en el repositorio del backend](https://github.com/PrestaMeDios-org/Backend-PrestaMeDios/blob/develop/docs/ERS.md) |
| **API** | [`Backend-PrestaMeDios`](https://github.com/PrestaMeDios-org/Backend-PrestaMeDios) · contrato en `http://localhost:8000/docs` |
| **Stack** | React 19 · TypeScript 5 (strict) · Vite · Tailwind CSS 4 |

---

## Contenido

1. [Requisitos previos](#requisitos-previos)
2. [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
3. [Variables de entorno](#variables-de-entorno)
4. [Scripts](#scripts)
5. [Arquitectura y estructura](#arquitectura-y-estructura)
6. [Convenciones](#convenciones)
7. [Integración con el backend](#integración-con-el-backend)
8. [Flujo de trabajo](#flujo-de-trabajo)
9. [Equipo](#equipo)

---

## Requisitos previos

- **Node.js 20 o superior** (validado con 22 LTS) y npm.
- El **backend** corriendo en `http://localhost:8000` para las funciones conectadas a la API (ver su README).

---

## Instalación y puesta en marcha

```bash
npm install
cp .env.example .env.local     # opcional: ajustar la URL del backend
npm run dev                    # http://localhost:8443
```

El servidor de desarrollo escucha en el puerto **8443**, que es el origen permitido por defecto en el CORS del backend.

---

## Variables de entorno

Vite expone al cliente sólo las variables con prefijo `VITE_`. Se definen en `.env.local` (no versionado); ver [`.env.example`](.env.example).

| Variable | Default | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | URL base del backend (sin `/api/v1`) |
| `VITE_SPACES_API_URL` | `${VITE_API_URL}/api/v1/spaces` | Opcional: URL completa del módulo de espacios |
| `PORT` | `8443` | Puerto del servidor de desarrollo |

> No guardar secretos en variables `VITE_*`: terminan incluidas en el bundle público.

---

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run format` | Formatea el código con `oxfmt` |
| `npm run typecheck` | Chequeo de tipos (TypeScript strict) |
| `npm test` | Tests unitarios (Vitest) |

---

## Arquitectura y estructura

Organización **por funcionalidad (feature-first)**: cada dominio del negocio agrupa sus pantallas, componentes, servicios HTTP y tipos, en paralelo a los módulos del backend.

```text
src/
├── App.tsx                     # shell: tema, layout y selección de pantalla
├── main.tsx                    # punto de entrada
├── theme.ts                    # paletas claro/oscuro y ThemeCtx
├── types.ts                    # tipos compartidos de la app (roles de UI, pantallas)
├── lib/api.ts                  # cliente HTTP compartido: token, errores, sesión expirada
├── components/
│   ├── layout/                 # MainLayout, Navbar, Sidebar
│   └── ui/                     # Button, Input, Badge, Form (campos, Card, Alert), iconos
└── features/
    ├── auth/                   # sesión, login, registro, cambio de contraseña (USR-01, USR-05)
    ├── users/                  # mi perfil y gestión de usuarios (USR-03, USR-04)
    ├── config/                 # panel de parámetros globales (GLO-03)
    ├── inventory/              # catálogo de equipamiento (PRE-01, PRE-02)
    ├── spaces/                 # calendario y reservas de espacios (RES-01…RES-05)
    └── loans/                  # préstamos (pendiente)
        ├── components/
        ├── pages/
        ├── services/           # cliente HTTP del dominio + mappers
        └── types/              # DTOs espejo del backend + view models
```

| Feature | Estado |
| --- | --- |
| `auth` | Login, registro, sesión persistente en la pestaña y cambio obligatorio de contraseña |
| `users` | Mi perfil; bandeja de aprobación, directorio, alta y edición de cuentas |
| `config` | Panel de parámetros con control de versión e historial |
| `inventory` | Catálogo con filtros (datos de ejemplo; cliente de API autenticado disponible) |
| `spaces` | Calendario conectado a la API: reservas propias, aprobación y bloqueos |
| `loans` | Pendiente |

---

## Convenciones

- **DTOs espejo:** los tipos de `features/<dominio>/types` reflejan 1:1 los esquemas Pydantic del backend, en `snake_case`.
- **Mappers:** `services/mappers.ts` convierte DTOs en modelos de vista (`camelCase`) que consumen los componentes.
- **Cliente HTTP:** usar `apiRequest()` de `src/lib/api.ts`, que agrega el token y lanza `ApiError` (`status`, `code`, `detail`, `campos` para los 422). No llamar a `fetch` directamente.
- **Sesión:** `useAuth()` / `useUsuario()` y `useSede()` (sede vista; elegible sólo por el Superadministrador). El token vive en `sessionStorage`: cerrar la pestaña cierra la sesión.
- **Roles:** los componentes reciben `role: "student" | "teacher" | "admin"`, derivado del rol real con `uiRole()`.
- **Tema:** colores desde `useC()` / `ThemeCtx` (`src/theme.ts`), nunca hardcodeados; soporte claro/oscuro (GLO-06).
- **Idioma:** textos de interfaz en español rioplatense; nombres de dominio en español, términos técnicos en inglés.
- **Tipado:** TypeScript `strict`; evitar `any` en código nuevo.

---

## Equipo

Proyecto académico de la asignatura **Laboratorio de Software** (UNTDF, curso 2026).

- Matías Araujo · Joaquín Eberle · Daniel Sardinas · Fabrizio Verdú · Facundo Zamora
- **Referente:** Natalia Ader — Laboratorio de Medios Audiovisuales, ICSE.
