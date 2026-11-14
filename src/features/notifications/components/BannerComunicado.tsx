import { PALETA_TEMA, type TemaComunicado } from "../services/tema"

// "Foto" de la tarjeta de comunicado (SPEC-10 V-10): patrón de circuito en SVG, dibujado
// acá (sin imágenes externas). `semilla` espeja el dibujo para que tarjetas vecinas no
// se vean idénticas.
export function BannerComunicado({ tema, semilla = 0, alto = 130 }: { tema: TemaComunicado; semilla?: number; alto?: number }) {
  const p = PALETA_TEMA[tema]
  const id = `bc-${tema}-${semilla}`
  const espejo = semilla % 2 === 1
  const trazo = { stroke: p.linea, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

  return (
    <svg
      viewBox="0 0 400 140"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height={alto}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}-fondo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.claro} />
          <stop offset="0.55" stopColor={p.base} />
          <stop offset="1" stopColor={p.oscuro} />
        </linearGradient>
        <radialGradient id={`${id}-brillo`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <rect width="400" height="140" fill={`url(#${id}-fondo)`} />

      {/* destellos suaves de fondo */}
      <circle cx="70" cy="40" r="60" fill={`url(#${id}-brillo)`} />
      <circle cx="300" cy="120" r="70" fill={`url(#${id}-brillo)`} opacity="0.6" />

      {/* franjas verticales tenues */}
      {[40, 52, 150, 158, 330].map((x, i) => (
        <rect key={i} x={x} y="0" width={i % 2 ? 3 : 6} height="140" fill="#FFFFFF" opacity="0.05" />
      ))}

      <g transform={espejo ? "translate(400 0) scale(-1 1)" : undefined}>
        {/* pistas del circuito */}
        <g {...trazo} strokeWidth="1.3" opacity="0.55">
          <path d="M0 96 H96 L120 120 H230" />
          <path d="M0 102 H92 L116 126 H210" />
          <path d="M150 0 V34 Q150 44 160 44 H232" />
          <path d="M258 0 V58 L280 80 V140" />
          <path d="M266 0 V54 L288 76 V140" />
          <path d="M330 140 V100 Q330 92 338 92 H400" />
          <path d="M60 0 V22 L84 46 V70" />
        </g>
        {/* bloques (chips) */}
        <g {...trazo} strokeWidth="1.4" opacity="0.7">
          <rect x="196" y="58" width="118" height="54" rx="7" />
          <rect x="210" y="4" width="78" height="30" rx="6" />
          <rect x="340" y="20" width="56" height="44" rx="6" />
        </g>
        {/* líneas internas de los chips */}
        <g stroke={p.linea} strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
          <path d="M232 14 H266 M232 20 H266 M232 26 H266" />
          <path d="M352 50 V60 M358 50 V60 M364 50 V60" />
          <path d="M40 124 L52 112 M48 128 L60 116 M56 132 L68 120" />
        </g>
        {/* nodos, con un halo que imita el brillo de la referencia */}
        <g fill={p.linea}>
          {[
            [196, 58, 3.2],
            [314, 84, 4.5],
            [232, 44, 2.6],
            [84, 70, 3],
            [120, 120, 2.6],
            [338, 92, 2.6],
            [244, 112, 2.2],
            [256, 112, 2.2],
            [268, 112, 2.2],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r * 2.2} filter={`url(#${id}-glow)`} opacity="0.55" />
              <circle cx={x} cy={y} r={r} />
            </g>
          ))}
        </g>
      </g>

      {/* oscurece apenas el borde inferior para separar del cuerpo de la tarjeta */}
      <rect y="110" width="400" height="30" fill={p.oscuro} opacity="0.18" />
    </svg>
  )
}
