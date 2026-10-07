import { useId, type CSSProperties, type Ref } from 'react'
import { brand } from '../../config/brand'
import { fonts, fontCss, pickHeadlineFont, pickNameFont } from '../../config/fonts'
import { layouts } from '../../config/layouts'
import { luminance, mix, rgba } from '../../lib/color'
import { formatDateLines, splitCustomDate } from '../../lib/date'
import { baselineOffset, fitFontSize, fontMetrics, useFontsReady } from '../../lib/fit'
import { useLogo } from '../../lib/logo'
import { splitHeadline, splitNameLines } from '../../lib/name'
import { Bokeh, bokehBase } from './Bokeh'
import { Confetti } from './Confetti'
import type { FlyerProps } from './types'

const abs: CSSProperties = { position: 'absolute', left: 0, top: 0 }

interface StackProps {
  lines: string[]
  /** x of the left edge (px), or the centre when align is center */
  x: number
  centerY: number
  size: number
  leading: number
  font: (typeof fonts)[keyof typeof fonts]
  fallback: string
  color: string
  letterSpacingEm: number
  align?: 'left' | 'center'
  boxWidth?: number
}

/** A stack of single-line text rows placed by real baseline, vertically centred on centerY. */
function TextStack(p: StackProps) {
  const m = fontMetrics(p.font, p.size)
  const pitch = p.size * p.leading
  const total = (p.lines.length - 1) * pitch + m.cap
  const firstBaseline = p.centerY - total / 2 + m.cap
  const off = baselineOffset(m, pitch)
  return (
    <>
      {p.lines.map((line, i) => (
        <div
          key={i}
          style={{
            ...abs,
            left: p.align === 'center' ? p.x - (p.boxWidth ?? 0) / 2 : p.x,
            width: p.align === 'center' ? p.boxWidth : undefined,
            top: firstBaseline + i * pitch - off,
            height: pitch,
            lineHeight: `${pitch}px`,
            ...fontCss(p.font, p.fallback),
            fontSize: p.size,
            letterSpacing: `${p.letterSpacingEm}em`,
            color: p.color,
            whiteSpace: 'nowrap',
            textAlign: p.align ?? 'left',
          }}
        >
          {line}
        </div>
      ))}
    </>
  )
}

function Silhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 7 400 353" width="100%" height="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
      <ellipse cx="200" cy="95" rx="72" ry="88" fill={color} />
      <path d="M0 360 C0 280 60 250 150 232 L250 232 C340 250 400 280 400 360 Z" fill={color} />
    </svg>
  )
}

export function Flyer({ ref, ...p }: FlyerProps & { ref?: Ref<HTMLDivElement> }) {
  useFontsReady() // re-render once fonts load so fitted sizes use the real faces
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const L = layouts[p.aspect]
  const W = L.width
  const H = L.height
  const t = p.theme
  const headFont = pickHeadlineFont(p.headlineFont ?? '')
  const nameFont = pickNameFont(p.nameFont ?? '')

  // ---- headline ----
  const headLines = splitHeadline(p.headlineText || '')
  const fitSize = fitFontSize(headLines, {
    font: headFont.spec,
    letterSpacingEm: -0.005,
    maxWidth: L.headline.maxWidth * W,
    leading: 1,
    maxSize: L.headline.maxSize * W,
  })
  const sy = L.headline.scaleY * headFont.tall
  const headRows = Math.max(headLines.length, 1)
  // Very tall fonts would push the headline into the photo, so cap the whole block's height.
  const blockAtFit = fontMetrics(headFont.spec, fitSize).cap * sy * (headRows + (headRows - 1) * L.headline.gap)
  const headSize = blockAtFit > L.headline.maxBlock * H ? (fitSize * L.headline.maxBlock * H) / blockAtFit : fitSize
  const hm = fontMetrics(headFont.spec, headSize)
  const headCap = hm.cap * sy // visible cap height after the vertical stretch
  const headPitch = headCap * (1 + L.headline.gap)
  const headFirstBaseline = L.headline.top * H + headCap
  const headLastBaseline = headFirstBaseline + (Math.max(headLines.length, 1) - 1) * headPitch
  const headOff = baselineOffset(hm, headPitch)

  // ---- panel ----
  const px0 = L.panel.left * W
  const px1 = L.panel.right * W
  const py1 = L.panel.top * H
  const py2 = L.panel.stepTop * H
  const pxs = L.panel.stepX * W
  const panelPath = `M${px0} ${py1} L${pxs} ${py1} L${pxs} ${py2} L${px1} ${py2} L${px1} ${H} L${px0} ${H} Z`

  // ---- photo ----
  const photo = p.photo
  const photoAspect = photo ? photo.aspect : 400 / 353
  const photoScale = photo ? photo.scale : 1
  const photoW = L.photo.widthFrac * W * photoScale
  const photoH = photoW / photoAspect
  const overlap = photo?.overlap ?? L.photo.overlap
  const photoLeft = (L.photo.centerX + (photo?.offsetX ?? 0)) * W - photoW / 2
  const photoTop = headLastBaseline - overlap * H + (photo?.offsetY ?? 0) * H

  // ---- name ----
  const nameLines = splitNameLines(p.title, p.name)
  const nameLeading = nameFont.leading ?? 0.9
  const nameSize = fitFontSize(nameLines, {
    font: nameFont.spec,
    letterSpacingEm: 0,
    maxWidth: L.name.width * W,
    maxHeight: L.name.height * H,
    leading: nameLeading,
    maxSize: L.name.maxSize * W,
  })

  // ---- date ----
  const dateLines = p.dateOverride?.trim() ? splitCustomDate(p.dateOverride) : formatDateLines(p.date)
  const dateLeading = 1.02
  const dateSize = fitFontSize(dateLines, {
    font: fonts.date,
    letterSpacingEm: 0.02,
    maxWidth: L.date.width * W,
    maxHeight: L.date.height * H,
    leading: dateLeading,
    maxSize: L.date.maxSize * W,
  })

  // ---- logo ----
  const backdrop = p.showBlur ? bokehBase(t) : t.background
  const backdropIsLight = luminance(backdrop) > 0.2
  const logoColor = backdropIsLight ? t.name : t.headline
  const logo = useLogo(backdropIsLight, logoColor)
  const churchLines = brand.logoIncludesName ? [] : splitHeadline(brand.churchName)
  const churchSize = L.logo.nameSize * W
  const churchPitch = churchSize * 0.98
  const markW = L.logo.markWidth * W
  const markH = logo ? markW / logo.aspect : 0
  const logoBottom = H - L.logo.bottom * H
  const churchBlockH = churchLines.length ? churchLines.length * churchPitch + churchSize * 0.35 : 0
  const markTop = logoBottom - churchBlockH - markH

  const bgStyle: CSSProperties = {
    ...abs,
    width: W,
    height: H,
    backgroundColor: t.background,
    backgroundImage: [
      `radial-gradient(ellipse 52% 30% at 0% ${L.glowY * 100}%, ${rgba(t.glow, 0.95)}, ${rgba(t.glow, 0.45)} 45%, ${rgba(t.glow, 0)} 100%)`,
      `radial-gradient(ellipse 52% 32% at 100% ${(L.glowY - 0.04) * 100}%, ${rgba(mix(t.glow, '#ffa23a', 0.45), 0.95)}, ${rgba(mix(t.glow, '#ffa23a', 0.45), 0.4)} 45%, ${rgba(t.glow, 0)} 100%)`,
      `radial-gradient(ellipse 80% 55% at 50% 20%, ${rgba(mix(t.background, t.glow, 0.14), 0.9)}, ${rgba(t.background, 0)} 100%)`,
      `radial-gradient(ellipse 85% 75% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)`,
    ].join(','),
  }

  return (
    <div
      ref={ref}
      data-flyer
      style={{
        position: 'relative',
        width: W,
        height: H,
        overflow: 'hidden',
        background: t.background,
        fontKerning: 'normal',
      }}
    >
      {/* 1. background, fabric texture, vignette */}
      <div style={bgStyle} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...abs, opacity: 0.55 }}>
        <filter id={`${uid}noise`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 -0.2" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}noise)`} />
      </svg>
      <div
        style={{
          ...abs,
          width: W,
          height: H,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0 1px, rgba(0,0,0,0) 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0 1px, rgba(0,0,0,0) 1px 4px)',
          opacity: 0.55,
        }}
      />

      {/* 2. confetti (behind the headline) */}
      {p.showConfetti && <Confetti seed={p.confettiSeed} color={t.confetti} width={W} height={H} layer="back" />}

      {/* 3. headline (sits behind the head) */}
      {headLines.map((line, i) => (
        <div
          key={i}
          style={{
            ...abs,
            left: 0,
            width: W,
            top: headFirstBaseline + i * headPitch - headOff,
            height: headPitch,
            lineHeight: `${headPitch}px`,
            transform: `scaleY(${sy})`,
            transformOrigin: `50% ${headOff}px`,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            ...fontCss(headFont.spec, 'serif'),
            fontSize: headSize,
            letterSpacing: '-0.005em',
            color: t.headline,
            textShadow: `0 ${headSize * 0.025}px 0 rgba(0,0,0,0.28), 0 ${headSize * 0.07}px ${headSize * 0.16}px rgba(0,0,0,0.55)`,
          }}
        >
          {line}
        </div>
      ))}

      {/* 4. colour panel */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          ...abs,
          WebkitMaskImage: 'linear-gradient(to bottom, #000 72%, transparent 92%)',
          maskImage: 'linear-gradient(to bottom, #000 72%, transparent 92%)',
        }}
      >
        <defs>
          <linearGradient id={`${uid}panel`} gradientUnits="userSpaceOnUse" x1={px0} y1={py1} x2={W * 0.62} y2={H * 0.8}>
            <stop offset="0" stopColor={t.panelFrom} />
            <stop offset="1" stopColor={t.panelTo} />
          </linearGradient>
          <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="38" />
          </filter>
        </defs>
        <path d={panelPath} fill={t.panelFrom} opacity="0.5" filter={`url(#${uid}glow)`} />
        <path d={panelPath} fill={`url(#${uid}panel)`} />
      </svg>

      {/* 5. celebrant cut-out, fading into the bottom blur */}
      <div
        style={{
          ...abs,
          width: W,
          height: H,
          WebkitMaskImage: `linear-gradient(to bottom, #000 ${L.photo.fadeStart * 100}%, transparent ${L.photo.fadeEnd * 100}%)`,
          maskImage: `linear-gradient(to bottom, #000 ${L.photo.fadeStart * 100}%, transparent ${L.photo.fadeEnd * 100}%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: photoLeft,
            top: photoTop,
            width: photoW,
            height: photoH,
            transform: photo?.flip ? 'scaleX(-1)' : undefined,
          }}
        >
          {photo ? (
            <img src={photo.url} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
          ) : (
            <Silhouette color={mix(t.panelFrom, t.name, 0.55)} />
          )}
        </div>
      </div>

      {/* 6 + 7. name and date */}
      <TextStack
        lines={nameLines}
        x={L.name.left * W}
        centerY={(L.name.top + L.name.height / 2) * H}
        size={nameSize}
        leading={nameLeading}
        font={nameFont.spec}
        fallback="serif"
        color={t.name}
        letterSpacingEm={0}
      />
      <TextStack
        lines={dateLines}
        x={L.date.left * W}
        centerY={(L.date.top + L.date.height / 2) * H}
        size={dateSize}
        leading={dateLeading}
        font={fonts.date}
        fallback="sans-serif"
        color={t.date}
        letterSpacingEm={0.02}
      />

      {/* confetti in front of everything but the logo */}
      {p.showConfetti && <Confetti seed={p.confettiSeed} color={t.confetti} width={W} height={H} layer="front" />}

      {/* 8. foreground blur */}
      {p.showBlur && <Bokeh theme={t} width={W} height={H} />}

      {/* film grain over everything but the logo: hides gradient banding */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ ...abs, opacity: 0.16, pointerEvents: 'none' }}>
        <filter id={`${uid}grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="3" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 -0.28" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${uid}grain)`} />
      </svg>

      {/* 9. church logo */}
      {logo && (
        <img
          src={logo.url}
          alt=""
          draggable={false}
          style={{ ...abs, left: (W - markW) / 2, top: markTop, width: markW, height: markH }}
        />
      )}
      {churchLines.length > 0 && (
        <div style={{ ...abs, left: 0, width: W, top: logoBottom - churchBlockH + churchSize * 0.2, textAlign: 'center' }}>
          {churchLines.map((l) => (
            <div
              key={l}
              style={{
                ...fontCss(fonts.church, 'sans-serif'),
                fontSize: churchSize,
                lineHeight: `${churchPitch}px`,
                letterSpacing: '-0.01em',
                color: logoColor,
                whiteSpace: 'nowrap',
              }}
            >
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
