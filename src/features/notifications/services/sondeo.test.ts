import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { crearSondeo, INTERVALO_MS } from "./sondeo"

// F-B02 (SPEC-06 D-N04, plan §7.1): consulta al montar, cada 60 s, en pausa con la
// pestaña oculta y enseguida al volver.
describe("crearSondeo", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const armar = (visible = true) => {
    const estado = { visible }
    const consultar = vi.fn()
    const sondeo = crearSondeo({ consultar, estaVisible: () => estado.visible })
    return { estado, consultar, sondeo }
  }

  it("consulta al iniciar y después cada 60 segundos", () => {
    const { consultar, sondeo } = armar()
    sondeo.iniciar()
    expect(consultar).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(INTERVALO_MS - 1)
    expect(consultar).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(consultar).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(INTERVALO_MS * 3)
    expect(consultar).toHaveBeenCalledTimes(5)
    sondeo.detener()
  })

  it("no consulta con la pestaña oculta y consulta enseguida al volver", () => {
    const { estado, consultar, sondeo } = armar()
    sondeo.iniciar()
    estado.visible = false
    vi.advanceTimersByTime(INTERVALO_MS * 5)
    expect(consultar).toHaveBeenCalledTimes(1)
    sondeo.alVolverVisible() // sigue oculta: no hace nada
    expect(consultar).toHaveBeenCalledTimes(1)
    estado.visible = true
    sondeo.alVolverVisible()
    expect(consultar).toHaveBeenCalledTimes(2)
    sondeo.detener()
  })

  it("iniciar dos veces no duplica la consulta, y detener la corta", () => {
    const { consultar, sondeo } = armar()
    sondeo.iniciar()
    sondeo.iniciar()
    vi.advanceTimersByTime(INTERVALO_MS)
    expect(consultar).toHaveBeenCalledTimes(2)
    sondeo.detener()
    vi.advanceTimersByTime(INTERVALO_MS * 5)
    sondeo.alVolverVisible()
    expect(consultar).toHaveBeenCalledTimes(2)
  })

  it("si arranca con la pestaña oculta, espera a que vuelva", () => {
    const { estado, consultar, sondeo } = armar(false)
    sondeo.iniciar()
    expect(consultar).not.toHaveBeenCalled()
    estado.visible = true
    sondeo.alVolverVisible()
    expect(consultar).toHaveBeenCalledTimes(1)
    sondeo.detener()
  })
})
