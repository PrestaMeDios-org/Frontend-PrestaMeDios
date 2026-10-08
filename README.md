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
| `npx tsc --noEmit` | Chequeo de tipos (TypeScript strict) |

---

## Arquitectura y estructura

Organización **por funcionalidad (feature-first)**: cada dominio del negocio agrupa sus pantallas, componentes, servicios HTTP y tipos, en paralelo a los módulos del backend.

```text
src/
├── App.tsx                     # shell: tema, layout y selección de pantalla
├── main.tsx                    # punto de entrada
├── theme.ts                    # paletas claro/oscuro y ThemeCtx
├── types.ts                    # tipos compartidos de la app (roles de UI, pantallas)
├── components/
│   ├── layout/                 # MainLayout, Navbar, Sidebar
│   └── ui/                     # Button, Input, Badge, iconos
└── features/
    ├── inventory/              # catálogo de equipamiento (PRE-01, PRE-02)
    ├── spaces/                 # calendario y reservas de espacios (RES-01…RES-05)
    ├── loans/                  # préstamos (pendiente)
    └── users/                  # identidad y usuarios (pendiente)
        ├── components/
        ├── pages/
        ├── services/           # cliente HTTP del dominio + mappers
        └── types/              # DTOs espejo del backend + view models
```

| Feature | Estado |
| --- | --- |
| `inventory` | Catálogo con filtros (datos de ejemplo; cliente de API disponible) |
| `spaces` | Calendario interactivo conectado a la API de reservas |
| `users` | Pendiente: login, registro, perfil y gestión de usuarios |
| `loans` | Pendiente |

---

## Convenciones

- **DTOs espejo:** los tipos de `features/<dominio>/types` reflejan 1:1 los esquemas Pydantic del backend, en `snake_case`.
- **Mappers:** `services/mappers.ts` convierte DTOs en modelos de vista (`camelCase`) que consumen los componentes.
- **Cliente HTTP:** `fetch` con `BASE_URL` derivada de `VITE_API_URL`; los errores se leen de `body.detail`.
- **Tema:** colores desde `useC()` / `ThemeCtx` (`src/theme.ts`), nunca hardcodeados; soporte claro/oscuro (GLO-06).
- **Idioma:** textos de interfaz en español rioplatense; nombres de dominio en español, términos técnicos en inglés.
- **Tipado:** TypeScript `strict`; evitar `any` en código nuevo.

---

## Integración con el backend

- Prefijo de la API: `/api/v1/<modulo>` (`inventory`, `spaces`, `auth`, `users`, `config`).
- Errores de negocio: `{"detail": "<mensaje>", "code": "<CODIGO>"}`; el `code` permite mostrar mensajes específicos.
- Sedes válidas: `"Ushuaia"` y `"Río Grande"` (mismos valores que el `SedeEnum` del backend).
- Las reglas operativas (horario 09:00–16:00, plazos, anticipación mínima) las define el backend en `/api/v1/config/parametros`; la interfaz debe leerlas en lugar de fijarlas en el código.

---

## Flujo de trabajo

El equipo aplica **Spec-Driven Development** dentro de Scrum (ClickUp):

1. Toda funcionalidad parte de un spec aprobado con contratos y criterios de aceptación.
2. Ramas desde `develop`: `feat/<tema>`, `fix/<tema>`, `docs/<tema>`.
3. Commits con [Conventional Commits](https://www.conventionalcommits.org/) en español.
4. Pull Request a `develop` con revisión de al menos un integrante y `npm run build` sin errores.

---

## Equipo

Proyecto académico de la asignatura **Laboratorio de Software** (UNTDF, curso 2026).

- Matías Araujo · Joaquín Eberle · Daniel Sardinas · Fabrizio Verdú · Facundo Zamora
- **Referente:** Natalia Ader — Laboratorio de Medios Audiovisuales, ICSE.
