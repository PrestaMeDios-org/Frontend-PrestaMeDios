// MOMENTÁNEO (SPEC-10, RN-U02): tests del contenido del manual de uso (M-01).
import { describe, expect, it } from "vitest"
import { MANUAL_POR_ROL } from "./manualDeUso"

describe("manual de uso (SPEC-10 §4.5)", () => {
  it("el superadmin ve las tareas del admin y suma las suyas (D-07)", () => {
    // AC-U03
    const admin = MANUAL_POR_ROL.ADMIN_LOCAL.tareas
    const superadmin = MANUAL_POR_ROL.SUPERADMIN.tareas
    expect(superadmin.slice(0, admin.length)).toEqual(admin)
    expect(superadmin.length).toBeGreaterThan(admin.length)
  })

  it("cada tarea cita un requisito del ERS", () => {
    // RN-U01
    for (const seccion of Object.values(MANUAL_POR_ROL))
      for (const t of seccion.tareas) expect(t.requisito).toMatch(/^[A-Z]{2,3}-\d{2}/)
  })
})
