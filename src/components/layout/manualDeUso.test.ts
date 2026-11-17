// MOMENTÁNEO (SPEC-10, RN-U02): tests del contenido del manual de uso (M-01).
import { describe, expect, it } from "vitest"
import { C_DARK, C_LIGHT } from "../../theme"
import { MANUAL_POR_ROL, NOTA_MANUAL, vistaActiva } from "./manualDeUso"

describe("manual de uso (SPEC-10 §4.5)", () => {
  it("muestra el rol de la sesión en el subtítulo", () => {
    // AC-U02
    expect(vistaActiva("ESTUDIANTE")).toBe("Vista activa: Estudiante")
    expect(vistaActiva("DOCENTE")).toBe("Vista activa: Docente")
    expect(vistaActiva("ADMIN_LOCAL")).toBe("Vista activa: Administrador local")
    expect(vistaActiva("SUPERADMIN")).toBe("Vista activa: Superadministrador")
  })

  it("lista las tareas de cada rol en orden, y el superadmin suma las suyas", () => {
    // AC-U03
    expect(MANUAL_POR_ROL.ESTUDIANTE.tareas).toHaveLength(7)
    expect(MANUAL_POR_ROL.DOCENTE.tareas).toHaveLength(6)
    expect(MANUAL_POR_ROL.ADMIN_LOCAL.tareas).toHaveLength(7)
    expect(MANUAL_POR_ROL.ESTUDIANTE.tareas[0].texto).toBe("Explorar el catálogo de equipos disponibles")
    const superadmin = MANUAL_POR_ROL.SUPERADMIN.tareas
    expect(superadmin.slice(0, 7)).toEqual(MANUAL_POR_ROL.ADMIN_LOCAL.tareas)
    expect(superadmin.slice(7).map((t) => t.requisito)).toEqual(["USR-04", "GLO-03"])
  })

  it("cada tarea cita un requisito del ERS", () => {
    // RN-U01
    for (const seccion of Object.values(MANUAL_POR_ROL))
      for (const t of seccion.tareas) expect(t.requisito).toMatch(/^[A-Z]{2,3}-\d{2}/)
  })

  it("marca como Próximamente sólo lo pendiente o parcial", () => {
    // AC-U04
    const prox = Object.values(MANUAL_POR_ROL)
      .flatMap((s) => s.tareas)
      .filter((t) => t.proximamente)
      .map((t) => t.requisito)
    expect(new Set(prox)).toEqual(new Set(["NOV-04", "PRE-13", "USR-09"]))
  })

  it("la nota no menciona el selector de vista del prototipo", () => {
    // AC-U05
    expect(NOTA_MANUAL).not.toMatch(/selector|Vista:/i)
  })

  it("usa colores del tema en claro y oscuro", () => {
    // AC-U06
    expect(MANUAL_POR_ROL.ESTUDIANTE.color(C_LIGHT)).toEqual({ acento: C_LIGHT.mine, fondo: C_LIGHT.mineBg })
    expect(MANUAL_POR_ROL.DOCENTE.color(C_DARK)).toEqual({ acento: C_DARK.available, fondo: C_DARK.availableBg })
    expect(MANUAL_POR_ROL.SUPERADMIN.color(C_DARK)).toEqual({ acento: C_DARK.crimson, fondo: C_DARK.crimsonLight })
  })
})
