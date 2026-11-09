import { describe, expect, it } from "vitest"
import { FOTO_MAX_MB, validarFoto } from "./foto"

const MB = 1024 * 1024

describe("validarFoto", () => {
  it("acepta JPEG, PNG y WebP dentro del tamaño", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validarFoto({ type, size: MB })).toBeNull()
    }
    expect(validarFoto({ type: "image/png", size: FOTO_MAX_MB * MB })).toBeNull()
  })

  it("rechaza otros tipos", () => {
    expect(validarFoto({ type: "image/gif", size: 10 })).toMatch(/JPEG, PNG o WebP/)
    expect(validarFoto({ type: "application/pdf", size: 10 })).toMatch(/JPEG, PNG o WebP/)
    expect(validarFoto({ type: "", size: 10 })).toMatch(/JPEG, PNG o WebP/)
  })

  it("rechaza archivos de más del máximo y vacíos", () => {
    expect(validarFoto({ type: "image/jpeg", size: FOTO_MAX_MB * MB + 1 })).toMatch(/2 MB/)
    expect(validarFoto({ type: "image/jpeg", size: 0 })).toMatch(/vacío/)
  })
})

