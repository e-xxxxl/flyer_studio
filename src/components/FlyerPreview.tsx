import { useLayoutEffect, useRef, useState, type PointerEvent, type Ref } from 'react'
import { layouts } from '../config/layouts'
import { Flyer } from './flyer/Flyer'
import type { FlyerProps } from './flyer/types'

interface Props {
  flyer: FlyerProps
  /** Ref to the unscaled flyer node, used for export. */
  flyerRef?: Ref<HTMLDivElement>
  /** Largest on-screen height in px; the preview shrinks to fit. */
  maxHeight?: number
  /** Called while the operator drags the canvas, with the move as a fraction of canvas width / height. */
  onPan?: (dx: number, dy: number) => void
}

/** Scales the 1080-wide flyer down to whatever room the page has. */
export function FlyerPreview({ flyer, flyerRef, maxHeight, onPan }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(0)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const L = layouts[flyer.aspect]

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setAvail(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  let scale = avail ? avail / L.width : 0.3
  if (maxHeight) scale = Math.min(scale, maxHeight / L.height)

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!onPan || !flyer.photo) return
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !onPan) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    onPan(dx / (scale * L.width), dy / (scale * L.height))
  }
  const up = () => {
    drag.current = null
  }

  return (
    <div ref={box} className="flex w-full justify-center">
      <div
        style={{ width: L.width * scale, height: L.height * scale }}
        className="relative overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/10"
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: L.width, height: L.height }}>
          <Flyer ref={flyerRef} {...flyer} />
        </div>
        {onPan && flyer.photo && (
          <div
            className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            aria-label="Drag to move the photo"
          />
        )}
      </div>
    </div>
  )
}
