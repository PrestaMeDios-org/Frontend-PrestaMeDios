import { useEffect, useState } from "react"
import { Alert, Card, Grid } from "../../../components/ui/Form"
import { mensajeDeError } from "../../../lib/api"
import { useC } from "../../../theme"
import { obtenerHorario } from "../services/notificationsApi"
import { PORTAL } from "../services/portal"

// Portal institucional (NOV-01). Contenido fijo (D-N02) más el horario operativo, que se
// lee de los parámetros globales para no duplicarlo en el código (P8, RN-N1).
export function PortalInfo() {
  const C = useC()
  const [horario, setHorario] = useState<{ apertura: string; cierre: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    obtenerHorario(ac.signal)
      .then(setHorario)
      .catch((e) => !ac.signal.aborted && setError(mensajeDeError(e, "No se pudo obtener el horario.")))
    return () => ac.abort()
  }, [])

  const texto = { fontFamily: "'Inter',sans-serif", fontSize: 13.5, color: C.text, lineHeight: 1.55, margin: 0 }
  const tenue = { ...texto, color: C.textMuted, fontSize: 12.5 }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title={PORTAL.laboratorio}>
        <p style={tenue}>{PORTAL.instituto}</p>
        <Grid min={200}>
          {PORTAL.sedes.map((s) => (
            <div key={s.nombre} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ ...texto, fontFamily: "'Outfit',sans-serif" }}>Sede {s.nombre}</strong>
              <span style={tenue}>{s.direccion}</span>
            </div>
          ))}
        </Grid>
      </Card>

      <Card title="Horario operativo">
        {error ? (
          <Alert>{error}</Alert>
        ) : horario ? (
          <p style={texto}>
            De <strong>{horario.apertura}</strong> a <strong>{horario.cierre}</strong> hs, en ambas sedes.
          </p>
        ) : (
          <p style={tenue}>Cargando…</p>
        )}
      </Card>

      <Card title="Normativa">
        <p style={texto}>
          {PORTAL.normativa.titulo} — <em>{PORTAL.normativa.referencia}</em>.
        </p>
        <ul style={{ ...texto, paddingLeft: 18, display: "grid", gap: 6 }}>
          {PORTAL.pautas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
