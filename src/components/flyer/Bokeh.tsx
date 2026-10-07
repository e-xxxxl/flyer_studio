import { useId } from 'react'
import { lighten, mix } from '../../lib/color'
import type { Theme } from '../../config/themes'

interface Props {
  theme: Theme
  width: number
  height: number
}

/** Colour the bottom haze settles on. Also used to pick a readable logo colour. */
export const bokehBase = (t: Theme) => mix(t.panelFrom, t.glow, 0.4)

// Cosine-eased stops have no slope kinks, so the falloff shows no visible rings.
const EASE = Array.from({ length: 17 }, (_, i) => i / 16)

/** Soft blurred shapes in front of the person's chest, giving depth. */
export function Bokeh({ theme, width: W, height: H }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const base = bokehBase(theme)
  const warm = mix(theme.panelFrom, theme.glow, 0.15)
  const bright = theme.panelTo
  const white = lighten(theme.panelTo, 0.75)

  const blobs: { x: number; y: number; rx: number; ry: number; c: string; o: number }[] = [
    { x: 0.04, y: 0.98, rx: 0.3, ry: 0.07, c: bright, o: 0.95 },
    { x: 0.2, y: 0.9, rx: 0.2, ry: 0.045, c: white, o: 0.8 },
    { x: 0.45, y: 1.0, rx: 0.32, ry: 0.06, c: warm, o: 0.95 },
    { x: 0.62, y: 0.86, rx: 0.16, ry: 0.035, c: bright, o: 0.55 },
    { x: 0.8, y: 0.96, rx: 0.26, ry: 0.06, c: white, o: 0.85 },
    { x: 1.0, y: 0.9, rx: 0.2, ry: 0.07, c: bright, o: 0.9 },
    { x: 0.1, y: 0.8, rx: 0.12, ry: 0.03, c: warm, o: 0.5 },
    { x: 0.92, y: 0.8, rx: 0.12, ry: 0.035, c: white, o: 0.6 },
  ]

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: 'absolute', inset: 0 }}
    >
      <defs>
        <linearGradient id={`${uid}wash`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={base} stopOpacity="0" />
          <stop offset="0.45" stopColor={base} stopOpacity="0.72" />
          <stop offset="1" stopColor={base} stopOpacity="1" />
        </linearGradient>
        {/* Eased radial falloff: smooth like a Gaussian blur, but without 8-bit banding rings. */}
        {blobs.map((b, i) => (
          <radialGradient key={i} id={`${uid}r${i}`} cx="50%" cy="50%" r="50%">
            {EASE.map((t) => (
              <stop key={t} offset={t} stopColor={b.c} stopOpacity={b.o * (0.5 + 0.5 * Math.cos(Math.PI * t))} />
            ))}
          </radialGradient>
        ))}
      </defs>
      <rect x="0" y={H * 0.74} width={W} height={H * 0.26} fill={`url(#${uid}wash)`} />
      {blobs.map((b, i) => (
        <ellipse
          key={i}
          cx={b.x * W}
          cy={b.y * H}
          rx={b.rx * W * 1.5}
          ry={b.ry * H * 1.9}
          fill={`url(#${uid}r${i})`}
        />
      ))}
    </svg>
  )
}
