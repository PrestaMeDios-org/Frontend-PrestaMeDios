import { Button } from "../../../components/ui/Button"
import { Alert } from "../../../components/ui/Form"

/**
 * Aviso no bloqueante para las cuentas sin teléfono (USR-05; SPEC-09 §5.3, RN-87).
 * Desaparece cuando Mi perfil guarda el teléfono y actualiza la sesión.
 */
export function AvisoTelefono({ onIrAMiPerfil }: { onIrAMiPerfil: () => void }) {
  return (
    <div style={{ padding: "12px 28px 0" }} role="status">
      <Alert tipo="info">
        <span style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>Tu cuenta no tiene un teléfono de contacto. Completá tu teléfono en Mi perfil.</span>
          <Button variant="ghost" onClick={onIrAMiPerfil}>
            Ir a Mi perfil
          </Button>
        </span>
      </Alert>
    </div>
  )
}
