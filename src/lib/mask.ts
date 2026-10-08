import type { CSSProperties } from 'react'

const STEPS = 10

/** 0 to 1 with a zero slope at both ends, so a fade has no visible start or end line. */
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

/**
 * A mask that is fully opaque until `1 - size` and then dissolves to transparent at the edge
 * the angle points at (0 = top, 90 = right, 180 = bottom, 270 = left).
 */
export function fadeOut(angleDeg: number, size: number): string {
  const start = Math.max(0, 1 - size)
  const stops = ['#000 0%', `#000 ${(start * 100).toFixed(2)}%`]
  for (let i = 1; i < STEPS; i++) {
    const t = i / STEPS
    stops.push(`rgba(0,0,0,${(1 - ease(t)).toFixed(3)}) ${((start + (1 - start) * t) * 100).toFixed(2)}%`)
  }
  stops.push('rgba(0,0,0,0) 100%')
  return `linear-gradient(${angleDeg}deg, ${stops.join(', ')})`
}

/** A soft oval that keeps the middle of the box and dissolves the corners. `inner` is where the fade begins (0 to 1). */
export function softOval(inner: number): string {
  const stops = ['#000 0%', `#000 ${(inner * 100).toFixed(1)}%`]
  for (let i = 1; i < STEPS; i++) {
    const t = i / STEPS
    stops.push(`rgba(0,0,0,${(1 - ease(t)).toFixed(3)}) ${((inner + (1 - inner) * t) * 100).toFixed(1)}%`)
  }
  stops.push('rgba(0,0,0,0) 100%')
  return `radial-gradient(ellipse closest-side at 50% 46%, ${stops.join(', ')})`
}

export const maskStyle = (image: string): CSSProperties => ({
  WebkitMaskImage: image,
  maskImage: image,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
})
