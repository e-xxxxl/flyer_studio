import { useLayoutEffect, useRef, useState, type PointerEvent, type Ref } from 'react'
import { layouts } from '../config/layouts'
import { Flyer } from './flyer/Flyer'
import type { FlyerProps } from './flyer/types'

interface Props {
  flyer: FlyerProps
  /** Ref to the unscaled flyer node, used for export. */
  flyerRef?: Ref<HTMLDivElement>
  /**
   * "width": fill the parent's width and let the height follow (cards, lists).
   * "contain": fit inside the parent's width AND height (the editor canvas).
   */
  fit?: 'width' | 'contain'
  /** Called while the operator drags the canvas, with the move as a fraction of canvas width / height. */
  onPan?: (dx: number, dy: number) => void
  className?: string
}

/** Scales the 1080-wide flyer down to whatever room the page has. */
export function FlyerPreview({ flyer, flyerRef, fit = 'width', onPan, className = '' }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const L = layouts[flyer.aspect]

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  let scale = size.w ? size.w / L.width : 0.2
  if (fit === 'contain' && size.h) scale = Math.min(scale, size.h / L.height)

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
    <div ref={box} className={`flex items-center justify-center ${fit === 'contain' ? 'h-full w-full' : 'w-full'} ${className}`}>
      <div
        style={{ width: L.width * scale, height: L.height * scale }}
        className="relative shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(29,24,21,0.1),0_14px_32px_-18px_rgba(29,24,21,0.45)]"
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
