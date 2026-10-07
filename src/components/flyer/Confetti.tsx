import { useId, useMemo } from 'react'
import { darken, lighten } from '../../lib/color'
import { seededRandom } from '../../lib/random'

interface Piece {
  kind: 'rect' | 'ribbon'
  x: number
  y: number
  w: number
  h: number
  rot: number
  blur: 0 | 1 | 2 | 3
  opacity: number
  grad: 0 | 1 | 2
  front: boolean
}

const BLUR = [0, 2, 6, 12]

function makePieces(seed: number): Piece[] {
  const rnd = seededRandom(seed)
  const pieces: Piece[] = []
  const count = 26
  for (let i = 0; i < count; i++) {
    const front = i >= count - 6
    // mostly the left/right edges, some along the top
    const zone = rnd()
    let x: number
    let y: number
    if (zone < 0.38) {
      x = rnd() * 0.17
      y = rnd() * 0.78
    } else if (zone < 0.76) {
      x = 0.83 + rnd() * 0.17
      y = rnd() * 0.78
    } else {
      x = rnd()
      y = rnd() * 0.07
    }
    const kind = rnd() < 0.45 ? 'ribbon' : 'rect'
    const big = front || rnd() < 0.2
    const w = (big ? 0.07 + rnd() * 0.07 : 0.025 + rnd() * 0.05) * 1080
    const h = kind === 'ribbon' ? w * (0.28 + rnd() * 0.2) : w * (0.22 + rnd() * 0.35)
    const blur = (front ? 2 + Math.floor(rnd() * 2) : rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 2)) as Piece['blur']
    pieces.push({
      kind,
      x,
      y,
      w,
      h,
      rot: rnd() * 360,
      blur,
      opacity: front ? 0.75 : 0.55 + rnd() * 0.45,
      grad: Math.floor(rnd() * 3) as Piece['grad'],
      front,
    })
  }
  return pieces
}

function shape(p: Piece, W: number, H: number, fill: string, filter?: string) {
  const cx = p.x * W
  const cy = p.y * H
  const t = `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${p.rot.toFixed(1)})`
  const hw = p.w / 2
  const hh = p.h / 2
  return (
    <g transform={t} opacity={p.opacity} filter={filter}>
      {p.kind === 'rect' ? (
        <rect x={-hw} y={-hh} width={p.w} height={p.h} rx={1.5} fill={fill} />
      ) : (
        <path
          d={`M${-hw} ${-hh * 0.2} C${-hw * 0.4} ${-hh * 1.5} ${hw * 0.2} ${hh * 1.3} ${hw} ${-hh * 0.4} L${hw} ${hh * 0.7} C${hw * 0.2} ${hh * 1.9} ${-hw * 0.4} ${-hh * 1} ${-hw} ${hh * 0.9} Z`}
          fill={fill}
        />
      )}
    </g>
  )
}

interface Props {
  seed: number
  color: string
  width: number
  height: number
  layer: 'back' | 'front'
}

export function Confetti({ seed, color, width, height, layer }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const pieces = useMemo(() => makePieces(seed), [seed])
  const list = pieces.filter((p) => (layer === 'front') === p.front)
  const light = lighten(color, 0.4)
  const dark = darken(color, 0.35)
  const gradients: [string, string][] = [
    [light, dark],
    [color, darken(color, 0.55)],
    [lighten(color, 0.15), darken(color, 0.15)],
  ]
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
    >
      <defs>
        {gradients.map(([a, b], i) => (
          <linearGradient key={i} id={`${uid}g${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        {BLUR.slice(1).map((s, i) => (
          <filter key={i} id={`${uid}b${i + 1}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={s} />
          </filter>
        ))}
      </defs>
      {list.map((p, i) => (
        <g key={i}>{shape(p, width, height, `url(#${uid}g${p.grad})`, p.blur ? `url(#${uid}b${p.blur})` : undefined)}</g>
      ))}
    </svg>
  )
}
